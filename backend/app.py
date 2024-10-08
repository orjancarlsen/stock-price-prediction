"""API to interact with the stock price regressor."""

from typing import List
from flask import Flask, jsonify
from flask_cors import CORS
from pytickersymbols import PyTickerSymbols
import yfinance as yf

from data.data_transformer import DataTransformer # pylint: disable=import-error
from model.regressor import Regressor             # pylint: disable=import-error


app = Flask(__name__)
CORS(app, origins=['http://localhost:8080'])


@app.route('/train/<ticker>', methods=['GET'])
def train(ticker: str):
    """
    Train regressor to predict stock prices.
    """
    n_days = 200

    data = DataTransformer(ticker=ticker)
    data.create_train_and_test_data(n_days=n_days)

    regressor = Regressor(ticker=ticker, data=data)
    regressor.train()

    # Save regressor to filesystem
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


@app.route('/companies/available', methods=['GET'])
def available_companies() -> List[str]:
    """
    Get available companies through the yahoo finance api.
    """
    stock_data = PyTickerSymbols()
    sp500 = stock_data.get_stocks_by_index('S&P 500')
    sp500_ticker_name = [{'symbol': stock['symbol'], 'name': stock['name']} for stock in sp500]
    print('/companies/available: ' + str(sp500_ticker_name))
    return jsonify(sp500_ticker_name)


@app.route('/companies/trained', methods=['GET'])
def get_trained_models() -> List[str]:
    """
    Return a list of stocks which there exist 
    """
    trained_models = Regressor.get_trained_models()

    symbol_name = []
    for ticker in trained_models:
        symbol_name.append(
            {
                "symbol": ticker,
                "name": yf.Ticker(ticker).info.get('longName', '')
            }
        )

    return jsonify(symbol_name)


if __name__ == '__main__':
    app.run()
