"""API to interact with the stock price regressor."""

from typing import List

from flask import Flask, jsonify, request
from flask_cors import CORS
from pytickersymbols import PyTickerSymbols
import yfinance as yf

from src.data.data_transformer import DataTransformer # pylint: disable=import-error
from src.model.regressor import Regressor             # pylint: disable=import-error

N_DAYS = 200

app = Flask(__name__)

# Enable CORS with different origins for local and production environments
CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:2001", 
                "https://stock-price-prediction-frontend.onrender.com"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
            "allow_headers": ["Content-Type", "Authorization"]
        }
    }
)


@app.route('/train/<ticker>', methods=['POST'])
def train(ticker: str):
    """
    Train regressor to predict stock prices.
    """
    data = DataTransformer(ticker=ticker)
    data.create_train_and_test_data(n_days=N_DAYS)

    regressor = Regressor(ticker=ticker, data=data)
    regressor.train()
    regressor.save()

    return jsonify({}), 200


@app.route('/predict/<ticker>', methods=['GET'])
def predict(ticker: str):
    """
    Make stock price prediction.
    """
    regressor = Regressor.load(ticker)
    regressor.predict()

    y_pred_list = regressor.y_pred.tolist()
    y_true_list = regressor.y_true.tolist()
    return jsonify({'prediction': y_pred_list, 'true_values': y_true_list}), 200


@app.route('/predict_next/<ticker>', methods=['GET'])
def predict_next_day(ticker: str):
    """
    Make stock price prediction for the specified number of days.
    """
    regressor = Regressor.load(ticker)
    prediction_next_period = regressor.predict_next_day(n_days=N_DAYS)

    return jsonify(prediction_next_period.tolist())


@app.route('/companies/available', methods=['GET'])
def available_companies() -> List[str]:
    """
    Get available companies through the yahoo finance api.
    """
    stock_data = PyTickerSymbols()
    sp500 = stock_data.get_stocks_by_index('S&P 500')
    sp500_ticker_name = [{'symbol': stock['symbol'], 'name': stock['name']} for stock in sp500]

    return jsonify(sp500_ticker_name)


@app.route('/companies/trained', methods=['GET'])
def get_trained_models() -> List[str]:
    """
    Return a list of stocks for which there exist trained models.
    """
    trained_models = Regressor.get_trained_models()

    symbol_name = []
    for ticker in trained_models:
        symbol_name.append(
            {
                "symbol": ticker,
                "name": yf.Ticker(ticker).info
            }
        )

    return jsonify(symbol_name)


@app.route('/companies/price/<string:ticker>', methods=['GET'])
def get_stock_price(ticker: str):
    """
    Return the stock price for the given ticker within the specified date range.
    """
    from_date = request.args.get('fromDate')
    to_date = request.args.get('toDate')

    stock = yf.Ticker(ticker)
    price_data = stock.history(start=from_date, end=to_date)
    prices = price_data['Close'].tolist()
    dates = price_data.index.strftime('%Y-%m-%d').tolist()

    print("Number of dates: ", len(dates))

    return jsonify({'dates': dates, 'prices': prices})


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=2000)
