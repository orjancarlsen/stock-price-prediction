"""Broker module to handle trading"""

from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
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
        The predicted low price needs at least a `min_prediction_difference` increase to be higher
        than the predicted high price for it to be consider a big enough difference to place an 
        order. The threshold to buy is set 1% above the predicted low price and the threshold
        to sell is set 1% below the predicted high price, adjusted to fit the tick size.
        
        Parameters
        ----------
        predicted_low : float
            Predicted lowest price for the next period.
        predicted_high : float
            Predicted highest price for the next period.

        Returns
        -------
        tuple[float, float]
            The buy and sell thresholds.
        """
        if predicted_low >= predicted_high:
            return (None, None)

        if predicted_low < 0 or predicted_high < 0:
            return (None, None)

        if predicted_low * (1 + self.min_prediction_difference) < predicted_high:
            buy_threshold = self.round_to_tick_size(
                predicted_low * (1 + self.buy_threshold_increase)
            )
            sell_threshold = self.round_to_tick_size(
                predicted_high * (1 - self.sell_threshold_decrease)
            )
            return (buy_threshold, sell_threshold)

        return (None, None)

    def calculate_fee(self, price_per_share: float, number_of_shares: int) -> float:
        """
        Calculates the fee for a transaction based on the price per share and the number of shares.
        Follows the brokerage fees of Nordnet's Mini class.
        https://www.nordnet.no/no/kundeservice/prisliste

        Parameters
        ----------
        price_per_share : float
            The price per share.
        number_of_shares : int
            The number of shares.
        """
        percentage = 0.0015
        minimum_fee = 29

        return max(minimum_fee, percentage * price_per_share * number_of_shares)

    def calculate_number_of_shares(self, buy_threshold: float) -> int:
        """
        Calculates maximum number of shares to buy without exceeding the allowed value per stock.

        Returns
        -------
        int
            The maximum number of shares to buy.
        """
        cash_available = self.sql_wrapper.get_cash_available()
        number_of_stocks_in_portfolio = len(self.sql_wrapper.get_portfolio()) - 1
        try:
            allowed_value_per_stock = cash_available / (self.number_of_stocks_allowed
                - number_of_stocks_in_portfolio)
        except ZeroDivisionError:
            allowed_value_per_stock = 0

        max_shares = int(allowed_value_per_stock // buy_threshold)
        while max_shares > 0:
            fee = self.calculate_fee(buy_threshold, max_shares)
            if buy_threshold * max_shares + fee <= allowed_value_per_stock:
                break
            max_shares -= 1

        return max_shares

    def populate_prediction_with_orders(
            self,
            predictions: List[StockPrediction],
            date: datetime = datetime.now(timezone('Europe/Oslo')).date()
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
        # Valid predictions are all stocks in portifolio to be sold
        # and those not in portfolio and have a buy/sell threshold and positive profit
        sell_predictions = []
        buy_predictions = []
        stock_symbols_in_portfolio = self.sql_wrapper.get_stock_symbols_in_portfolio()

        for prediction in predictions:
            buy_threshold, sell_threshold = self.calculate_thresholds(
                prediction.predicted_low,
                prediction.predicted_high
            )

            if prediction.ticker in stock_symbols_in_portfolio:
                # If the stock is already in the portfolio, only sell orders are considered
                number_of_shares = self.sql_wrapper.get_stock_in_portfolio(
                    prediction.ticker
                ).number_of_shares
                sell_fee = self.calculate_fee(sell_threshold, number_of_shares)
                total_sell_value = number_of_shares * sell_threshold - sell_fee
                prediction.number_of_shares = number_of_shares
                prediction.sell_threshold = sell_threshold
                sell_predictions.append(prediction)

            else:
                # Predicted spread is too small to make a profit for buying a stock
                if ((buy_threshold is None) or (sell_threshold is None)):
                    continue

                # Only proceed if we can afford at least one share
                number_of_shares = self.calculate_number_of_shares(buy_threshold)
                if number_of_shares <= 0:
                    continue

                buy_fee = self.calculate_fee(buy_threshold, number_of_shares)
                sell_fee = self.calculate_fee(sell_threshold, number_of_shares)
                total_buy_cost = number_of_shares * buy_threshold + buy_fee
                total_sell_value = number_of_shares * sell_threshold - sell_fee
                prediction.profit = total_sell_value - total_buy_cost
                prediction.number_of_shares = number_of_shares
                prediction.buy_threshold = buy_threshold
                prediction.sell_threshold = sell_threshold

                # Only buy stocks that are predicted to have a profit
                if prediction.profit > 0:
                    share_value = yf.Ticker(prediction.ticker).history(
                        start=date - timedelta(days=10),
                        end=date + timedelta(days=1),
                        auto_adjust=False
                    )['Close'].values[-1]

                    # If buy treshold much lower than current share value, don't place order
                    if not buy_threshold*1.03 < share_value:
                        buy_predictions.append(prediction)

        # Sort the buy predictions by profitability
        buy_predictions.sort(key=lambda x: x.profit, reverse=True)

        # Limit the number of predictions to the maximum allowed stocks
        return sell_predictions + buy_predictions[
            :self.number_of_stocks_allowed - len(sell_predictions)
        ]

    def round_to_tick_size(self, number: float) -> float:
        """
        Rounds the stock price according to the tick size.

        Parameters
        ----------
        number : float
            The stock price to be rounded.

        Returns
        -------
        float
            The rounded number.
        """
        tick_size = 0.1
        return round(round(number / tick_size) * tick_size, 1)

    def conclude_pending_orders_for_traded_stocks(
            self,
            todays_date: datetime = datetime.now(timezone('Europe/Oslo')).date()
        ) -> List[tuple]:
        """
        Checks if the exchange was open today for the given list of tickers.
        If it was open, all pending orders for the tickers are checked and executed if the price
        threshold was met, otherwise the order is cancelled.

        Parameters
        ----------
        todays_date : datetime
            The date to check for open exchange.
        """
        pending_orders = self.sql_wrapper.get_orders_by_status(['PENDING'])
        for order in pending_orders:
            end_date = todays_date + relativedelta(days=1)
            try:
                todays_prices = yf.download(order.stock_symbol, start=todays_date, end=end_date,
                                            auto_adjust=False)
                todays_prices.reset_index(inplace=True)
                last_traded_date = todays_prices['Date'].iloc[-1].to_pydatetime().date()
            except IndexError:
                self.sql_wrapper.cancel_order(order.id, date=todays_date)
                continue

            # Check if the exchange was open today and stock was traded
            if last_traded_date != todays_date:
                self.sql_wrapper.cancel_order(order.id, date=todays_date)
                continue

            if (order.order_type == 'BUY'
                and todays_prices['Open'].values[0][0] <= order.price_per_share):
                # If the order was a buy order and the open price was lower than the buy
                # threshold, the order was executed at opening with the open price
                self.sql_wrapper.execute_order(
                    order_id=order.id,
                    _price_per_share=todays_prices['Open'].values[0][0],
                    _fee=self.calculate_fee(
                        todays_prices['Open'].values[0][0],
                        order.number_of_shares
                    ),
                    _date=todays_date
                )
            elif (order.order_type == 'BUY'
                    and todays_prices['Low'].values[0][0] <= order.price_per_share):
                # If the order was a buy order and the lowest price was lower than the buy
                # threshold, the order was executed
                self.sql_wrapper.execute_order(order.id, _date=todays_date)
            elif (order.order_type == 'SELL'
                    and todays_prices['Open'].values[0][0] >= order.price_per_share):
                # If the order was a sell order and the open price was higher than the sell
                # threshold, the order was executed at opening with the open price
                self.sql_wrapper.execute_order(
                    order_id=order.id,
                    _price_per_share=todays_prices['Open'].values[0][0],
                    _fee=self.calculate_fee(
                        todays_prices['Open'].values[0][0],
                        order.number_of_shares
                    ),
                    _date=todays_date
                )
            elif (order.order_type == 'SELL' and
                    todays_prices['High'].values[0][0] >= order.price_per_share):
                # If the order was a sell order and the highest price was higher than the sell
                # threshold, the order was executed
                self.sql_wrapper.execute_order(order.id, _date=todays_date)
            else:
                # If the price threshold was not met, the order is cancelled
                self.sql_wrapper.cancel_order(order.id, date=todays_date)

    def create_orders(
            self,
            predictions: List[StockPrediction],
            date: datetime = datetime.now(timezone('Europe/Oslo')).date()
        ) -> None:
        """
        Creates orders for the top predictions.
        """
        for prediction in predictions:
            stock_in_portfolio = self.sql_wrapper.get_stock_in_portfolio(prediction.ticker)
            if stock_in_portfolio:
                self.sql_wrapper.create_sell_order(
                    stock_symbol=prediction.ticker,
                    price_per_share=prediction.sell_threshold,
                    number_of_shares=prediction.number_of_shares,
                    fee=self.calculate_fee(
                        prediction.sell_threshold,
                        prediction.number_of_shares
                    ),
                    date=date
                )
            else:
                try:
                    self.sql_wrapper.create_buy_order(
                        stock_symbol=prediction.ticker,
                        price_per_share=prediction.buy_threshold,
                        number_of_shares=prediction.number_of_shares,
                        fee=self.calculate_fee(
                            prediction.buy_threshold,
                            prediction.number_of_shares
                        ),
                        date=date
                    )
                except ValueError as e:
                    print(f"Error creating buy order for {prediction.ticker}: {e}")
                    continue

    def dividend_payout(
            self,
            date: datetime = datetime.now(timezone('Europe/Oslo')).date()
        ) -> None:
        """
        Pays out dividends to the user.
        """
        portfolio = self.sql_wrapper.get_portfolio()
        for stock in portfolio:
            if stock.stock_symbol is not None:
                try:
                    dividend_per_share = yf.Ticker(stock.stock_symbol).history(
                        start=date,
                        end=date + timedelta(days=1),
                        auto_adjust=False
                    )['Dividends'].values[0]
                except KeyError:
                    continue
                if dividend_per_share > 0:
                    self.sql_wrapper.receive_dividend(
                        stock.stock_symbol,
                        dividend_per_share,
                        date
                    )

    def get_market_value_of_stocks_in_portfolio(
            self,
            date: datetime = datetime.now(timezone('Europe/Oslo'))
        ) -> float:
        """
        Calculates the market value of the stocks in the portfolio.

        Returns
        -------
        float
            The market value of the stocks in the portfolio.
        """
        market_value = 0
        portfolio = self.sql_wrapper.get_portfolio()
        for stock in portfolio:
            if stock.stock_symbol is not None:
                # Adjust start date by 1+0 days to be sure we get a period with a valid close price
                share_value = yf.Ticker(stock.stock_symbol).history(
                    start=date - timedelta(days=10),
                    end=date + timedelta(days=1),
                    auto_adjust=False
                )['Close'].values[-1]
                market_value += stock.number_of_shares * share_value
        return market_value

    def update_portfolio_value(
            self,
            date: datetime = datetime.now(timezone('Europe/Oslo')).date()
        ) -> None:
        """
        Updates the portfolio value in the database.
        """
        cash = self.sql_wrapper.get_cash_balance()
        try:
            stock_value = self.get_market_value_of_stocks_in_portfolio(date)
            self.sql_wrapper.set_portfolio_values(date, cash + stock_value)
            print(f"PORTFOLIO VALUE UPDATED TO {cash + stock_value} ON {date}")
        except IndexError:
            print(f"Error updating portfolio value on {date}")
