"""Broker module to handle trading"""

import yfinance as yf

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

    min_prediction_difference = 0.05
    buy_threshold_increase = 0.01
    sell_threshold_decrease = 0.01

    def __init__(self, ticker: str, predictions: list) -> None:
        self.ticker = ticker

        buy_threshold, sell_threshold = self.calculate_thresholds(predictions)
        self.evaluate_action(buy_threshold, sell_threshold)

    def evaluate_action(self, buy_threshold, sell_threshold) -> None:
        """
        Evaluates the action to be taken based on today's prices and the calculated thresholds.
        
        Parameters
        ----------
        buy_threshold : float
            The threshold price to trigger a buy action.
        sell_threshold : float
            The threshold price to trigger a sell action.
        """
        todays_prices = yf.download(self.ticker, period='1d')

        if buy_threshold and sell_threshold:
            if todays_prices['Low'][0] >= buy_threshold:
                self.did_buy = True
                self.did_sell = False
            elif todays_prices['High'][0] <= sell_threshold:
                self.did_buy = False
                self.did_sell = True
            else:
                self.did_buy = False
                self.did_sell = False

    def calculate_thresholds(self, prediction: list) -> list:
        """
        Calculates the buy and sell thresholds based on the prediction.
        If the predicted low price needs at least a 5% increase to be higher than the predicted
        high price, the threshold to buy is set 1% above the predicted low price and the threshold
        to sell is set 1% below the predicted high price.
        
        Parameters
        ----------
        prediction : list
            The predicted stock prices for the next period. The first element is the predicted
            low price and the second element is the predicted high price.
        
        Returns
        -------
        list
            A list containing the buy and sell thresholds.
        """
        if not prediction:
            return [None, None]

        if prediction[0] >= prediction[1]:
            return [None, None]

        if prediction[0] < 0 or prediction[1] < 0:
            return [None, None]

        predicted_low, predicted_high = prediction
        if predicted_low * (1 + self.min_prediction_difference) <= predicted_high:
            buy_threshold = predicted_low * (1 + self.buy_threshold_increase)
            sell_threshold = predicted_high * (1 - self.sell_threshold_decrease)
        else:
            buy_threshold = None
            sell_threshold = None
        return [buy_threshold, sell_threshold]
