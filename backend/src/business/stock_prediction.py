"""Data class for stock prediction."""

class StockPrediction:
    """Store stock prediction data."""
    def __init__(
        self,
        ticker: str,
        predicted_low: float,
        predicted_high: float,
        number_of_shares: int = None,
        buy_threshold: float = None,
        sell_threshold: float = None,
        profit: float = None
    ) -> None:
        self.ticker = ticker
        self.predicted_low = predicted_low
        self.predicted_high = predicted_high
        self.number_of_shares = number_of_shares
        self.buy_threshold = buy_threshold
        self.sell_threshold = sell_threshold
        self.profit = profit

    def __repr__(self):
        return (f"StockPrediction(ticker={self.ticker}, predicted_low={self.predicted_low}, "
                f"predicted_high={self.predicted_high}, number_of_shares={self.number_of_shares}, "
                f"buy_threshold={self.buy_threshold}, sell_threshold={self.sell_threshold}, "
                f"profit={self.profit})")
