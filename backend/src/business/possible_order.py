class PossibleOrder:
    def __init__(self, ticker: str, number_of_shares: int, buy_threshold: float, sell_threshold: float) -> None:
        self.ticker = ticker
        self.number_of_shares = number_of_shares
        self.buy_threshold = buy_threshold
        self.sell_threshold = sell_threshold
    
    def __repr__(self):
        return (f"PossibleOrder(ticker={self.ticker}, number_of_shares={self.number_of_shares}, "
                f"buy_threshold={self.buy_threshold}, sell_threshold={self.sell_threshold})")
