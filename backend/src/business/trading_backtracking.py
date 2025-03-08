"""Module for backtracking trading logic to test performance."""

import time
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

# Make sure these imports match your actual project structure
from src.app import N_DAYS, available_tickers
from src.business.broker import Broker, StockPrediction
from src.model.regressor import Regressor

# Improvements:
# - Load n_days in the beginning, and use that thgoughout the loop
# - Take stock splits into account
# - Skip days Oslo Stock Exchange is closed

def backtrack_trading():
    """
    Iterate over all weekdays starting from 1st of January 2024 until 'today',
    running the trading logic for each day as if we were back in time.
    """

    broker = Broker()
    regressor = Regressor.load()

    start_date = date(2025, 3, 5)
    end_date = date(2025, 3, 7)

    current_day = start_date

    while current_day <= end_date:
        print(f"\n\nProcessing {current_day}")

        # Check if it's Monday (0) through Friday (4)
        if current_day.weekday() < 5:
            # Handle dividend payouts for all stocks in the portfolio at the start of the day
            broker.dividend_payout(date=current_day)

            # --- 1) Conclude/cancel/execute any pending orders ---
            broker.conclude_pending_orders_for_traded_stocks(
                todays_date=current_day
            )

            # --- 2) Update portfolio value for the current day ---
            broker.update_portfolio_value(date=current_day)

            # --- 3) Make predictions for the next N_DAYS ---
            predictions = []
            for ticker in available_tickers:
                try:
                    # Optional start_date 1 year before "current_day"
                    prediction_next_period = regressor.predict_next_period(
                        n_days=N_DAYS,
                        ticker=ticker,
                        start_date=current_day - relativedelta(years=1),
                        end_date=current_day + relativedelta(days=1)
                    )

                    predictions.append(
                        StockPrediction(
                            ticker,
                            prediction_next_period[0],
                            prediction_next_period[1]
                        )
                    )
                except ValueError as e:
                    print(f"Error processing {ticker}: {e}")
                    continue

            # --- 4) Sort predictions by profitability and create possible orders ---
            predictions = broker.populate_prediction_with_orders(predictions)

            # --- 5) Decide which orders to create in the exchange ---
            broker.create_orders(predictions, date=current_day)

            # --- 6) Sleep to not overload yfinance ---
            time.sleep(8)

        # Move to the next calendar day
        current_day += timedelta(days=1)


if __name__ == "__main__":
    backtrack_trading()
