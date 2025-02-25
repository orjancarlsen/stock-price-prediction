"""Trading logic to be ran daily."""

from src.app import N_DAYS, available_tickers
from src.business.broker import Broker, StockPrediction
from src.model.regressor import Regressor


def trading():
    """Trading logic to be ran daily."""
    broker = Broker()
    regressor = Regressor.load()

    broker.dividend_payout()

    # Checking orders and making predictions is only necessary if there have been
    # activity in the stock since last time. Either set existing orders as executed or cancel them.
    broker.conclude_pending_orders_for_traded_stocks()

    broker.update_portfolio_value()

    # Make prediction for next N_DAYS
    predictions = []
    for ticker in available_tickers:
        prediction_next_period = regressor.predict_next_period(
            n_days=N_DAYS,
            ticker=ticker
        )
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


if __name__ == "__main__":
    trading()
