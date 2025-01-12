"""Trading logic to be ran daily."""

from src.app import N_DAYS
from src.business.broker import Broker, StockPrediction
from src.model.regressor import Regressor


def trading():
    """Trading logic to be ran daily."""
    broker = Broker()
    tickers = Regressor.get_trained_models()

    # Checking orders and making predictions is only necessary if there have been
    # activity in the stock since last time. Either set existing orders as executed or cancel them.
    tickers = broker.conclude_pending_orders_for_traded_stocks(tickers)

    # Make prediction for next N_DAYS
    predictions = []
    for ticker in tickers:
        regressor = Regressor.load(ticker)
        prediction_next_period = regressor.predict_next_period(n_days=N_DAYS)
        predictions.append(
            StockPrediction(
                ticker,
                prediction_next_period[0],
                prediction_next_period[1]
            )
        )

    # Sort predictions by profitability and create possible orders
    predictions = broker.populate_prediction_with_orders(predictions)

    # Decide orders to create
    broker.create_orders(predictions)

    broker.update_portfolio_value()


if __name__ == "__main__":
    trading()
