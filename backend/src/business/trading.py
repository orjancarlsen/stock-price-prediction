"""Trading logic to be ran daily."""

from src.app import N_DAYS
from src.business.broker import Broker, StockPrediction
from src.model.regressor import Regressor


def trading():
    """Trading logic to be ran daily."""
    broker = Broker()
    tickers = Regressor.get_trained_models()

    # Checking orders and making predictions is only necessary if there have been 
    # activity in the stock since last time
    tickers = broker.check_exchange_open_today(tickers)

    # Either set existing orders as executed or cancel them
    broker.conclude_pending_orders(tickers)

    # Make prediction for next N_DAYS
    predictions = []
    for ticker in tickers:
        regressor = Regressor.load(ticker)
        prediction_next_period = regressor.predict_next_day(n_days=N_DAYS)
        prediction_low, prediction_high = broker.round_prediction_to_tick_size(
            prediction_next_period
        )
        predictions.append(
            StockPrediction(
                ticker,
                prediction_low,
                prediction_high
            )
        )

    # Sort predictions by profitability and create possible orders
    broker.sort_prediction_profitability(predictions)

    print("Predictions:", predictions)


if __name__ == "__main__":
    trading()
  