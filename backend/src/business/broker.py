"""Broker module to handle trading"""

from datetime import datetime
from typing import List
import yfinance as yf
from pytz import timezone
from src.storage.sql_wrapper import SQLWrapper
from src.business.stock_prediction import StockPrediction

class Broker:
    """
    Represents a broker that can evaluate stock prices and make buy and sell decisions.

    Attributes
    ----------
    ticker : str
        The ticker of the stock.
    did_buy : bool
        Indicates if the broker made a buy decision.
    did_sell : bool
        Indicates if the broker made a sell decision.

    Methods
    -------
    evaluate_action(buy_threshold, sell_threshold)
        Evaluates the action to be taken based on today's prices and the calculated thresholds.
    calculate_thresholds(prediction)
        Calculates the buy and sell thresholds based on the prediction.
    """

    number_of_stocks_allowed = 10
    min_prediction_difference = 0.1
    buy_threshold_increase = 0.02
    sell_threshold_decrease = 0.02

    def __init__(self) -> None:
        self.sql_wrapper = SQLWrapper()

    def calculate_thresholds(
            self,
            predicted_low: float,
            predicted_high: float
        ) -> tuple[float, float]:
        """
        Calculates the buy and sell thresholds based on the prediction.
        The predicted low price needs at least a 5% increase to be higher than the predicted
        high price, the threshold to buy is set 1% above the predicted low price and the threshold
        to sell is set 1% below the predicted high price.
        
        Parameters
        ----------
        prediction : list
            The predicted stock prices for the next period. The first element is the predicted
            low price and the second element is the predicted high price.
        """
        if predicted_low >= predicted_high:
            return (None, None)

        if predicted_low < 0 or predicted_high < 0:
            return (None, None)

        if predicted_low * (1 + self.min_prediction_difference) <= predicted_high:
            buy_threshold = predicted_low * (1 + self.buy_threshold_increase)
            sell_threshold = predicted_high * (1 - self.sell_threshold_decrease)
            return (buy_threshold, sell_threshold)

        return (None, None)

    def calculate_fee(self, ticker, price_per_share: float, number_of_shares: int) -> float:
        """
        Calculates the fee for a transaction based on the price per share and the number of shares.
        Follows the brokerage fees of Nordnet's Mini class, with lower prices in the Nordics.
        https://www.nordnet.no/no/kundeservice/prisliste

        Parameters
        ----------
        price_per_share : float
            The price per share.
        number_of_shares : int
            The number of shares.
        """
        percentage_nordics = 0.0015
        minimum_fee_nordics = 29

        precentage = 0.002
        minimum_fee = 49

        # Check if the stock's ticker is listed in the Nordics or not
        nordic_exchanges = ['STO', 'CPH', 'HEL', 'OSL']
        stock_info = yf.Ticker(ticker).info
        exchange = stock_info.get('exchange', '')

        if any(exchange.endswith(nordic) for nordic in nordic_exchanges):
            return min(minimum_fee_nordics, percentage_nordics * price_per_share * number_of_shares)
        return min(minimum_fee, precentage * price_per_share * number_of_shares)

    def calculate_number_of_shares(self, ticker: str, buy_threshold: float) -> int:
        """
        Calculates maximum number of shares to buy without exceeding the allowed value per stock.

        Returns
        -------
        int
            The maximum number of shares to buy.
        """
        portfolio_value = self.sql_wrapper.get_portfolio_value()
        allowed_value_per_stock = portfolio_value / self.number_of_stocks_allowed

        max_shares = int(allowed_value_per_stock // buy_threshold)
        while max_shares > 0:
            fee = self.calculate_fee(ticker, buy_threshold, max_shares)
            total_cost = max_shares * buy_threshold + fee
            if total_cost <= allowed_value_per_stock:
                break
            max_shares -= 1

        return max_shares

    def populate_prediction_with_orders(
            self,
            predictions: List[StockPrediction]
        ) -> List[StockPrediction]:
        """
        Sorts the predictions by profitability and creates possible orders for the top predictions.

        Parameters
        ----------
        predictions : List[StockPrediction]
            The predictions to be sorted.
        
        Returns
        -------
        List[StockPrediction]
            The sorted predictions.
        """
        for prediction in predictions:
            buy_threshold, sell_threshold = self.calculate_thresholds(
                prediction.predicted_low,
                prediction.predicted_high
            )
            if buy_threshold and sell_threshold:
                # Calculate the profit for each prediction
                number_of_shares = self.calculate_number_of_shares(prediction.ticker, buy_threshold)
                buy_fee = self.calculate_fee(prediction.ticker, buy_threshold, number_of_shares)
                sell_fee = self.calculate_fee(prediction.ticker, sell_threshold, number_of_shares)
                total_buy_cost = number_of_shares * buy_threshold + buy_fee
                total_sell_value = number_of_shares * sell_threshold - sell_fee
                prediction.profit = total_sell_value - total_buy_cost
                prediction.number_of_shares = number_of_shares
                prediction.buy_threshold = buy_threshold
                prediction.sell_threshold = sell_threshold
            else:
                # Prediction difference < min_prediction_difference
                prediction.profit = 0

        # Sort the predictions by profitability
        predictions.sort(key=lambda x: x.profit, reverse=True)

    def round_prediction_to_tick_size(self, prediction: List[float]) -> tuple[float, float]:
        """
        Rounds the prediction according to the tick size.

        Parameters
        ----------
        prediction : List[float]
            The prediction to be rounded.

        Returns
        -------
        List[float]
            The rounded prediction.
        """
        tick_size = 0.1
        return (
            round(prediction[0] / tick_size) * tick_size,
            round(prediction[1] / tick_size) * tick_size
        )

    def check_exchange_open_today(self, tickers: List[str]) -> List[str]:
        """
        Checks if the exchange was open today for the given list of tickers.

        Parameters
        ----------
        tickers : List[str]
            The list of stock tickers to check.

        Returns
        -------
        List[str]
            The list of tickers for which the exchange was open today.
        """
        open_tickers = []
        for ticker in tickers:
            todays_prices = yf.download(ticker, period='1d')
            todays_prices.reset_index(inplace=True)
            last_traded_date = todays_prices['Date'].iloc[-1].to_pydatetime().date()
            if last_traded_date == datetime.now(timezone('Europe/Oslo')).date():
                open_tickers.append(ticker)
        return open_tickers

    def conclude_pending_orders(self, tickers: List[str]) -> None:
        """
        Concludes pending orders for the given list of tickers.
        Executes the order if the price threshold was met, otherwise cancels the order.

        Parameters
        ----------
        tickers : List[str]
            The list of stock tickers for which to conclude pending orders.
        """
        pending_orders = self.sql_wrapper.get_pending_orders()
        for ticker in tickers:
            for order in pending_orders:
                if order[2] == ticker:
                    todays_prices = yf.download(ticker, period='1d')
                    todays_prices.reset_index(inplace=True)

                    # If todays lowest price was lower than our buy threshold, execute the order
                    # If todays highest price was higher than our sell threshold, execute the order
                    if (
                        (order[1] == 'BUY' and todays_prices['Low'].values[0][0] <= order[3]) or
                        (order[1] == 'SELL' and todays_prices['High'].values[0][0] >= order[3])
                    ):
                        self.sql_wrapper.execute_order(order[0])
                    else:
                        self.sql_wrapper.cancel_order(order[0])
                    break

    def create_orders(self, predictions: List[StockPrediction]) -> None:
        """
        Creates orders for the top predictions.
        """
        # Filter predictions with positive profit
        predictions = [p for p in predictions if p.profit > 0]

        # Limit the number of predictions to the maximum allowed stocks
        predictions = predictions[:self.number_of_stocks_allowed]

        for prediction in predictions:
            stock_in_portfolio = self.sql_wrapper.get_stock_in_portfolio(prediction.ticker)
            if stock_in_portfolio:
                number_of_shares = stock_in_portfolio[2]
                self.sql_wrapper.create_sell_order(
                    stock_symbol=prediction.ticker,
                    price_per_share=prediction.sell_threshold,
                    number_of_shares=number_of_shares,
                    fee=self.calculate_fee(
                        prediction.ticker,
                        prediction.sell_threshold,
                        number_of_shares
                    )
                )
            else:
                self.sql_wrapper.create_buy_order(
                    stock_symbol=prediction.ticker,
                    price_per_share=prediction.buy_threshold,
                    number_of_shares=prediction.number_of_shares,
                    fee=self.calculate_fee(
                        prediction.ticker,
                        prediction.buy_threshold,
                        prediction.number_of_shares
                    )
                )
