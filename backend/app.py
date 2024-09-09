"""API to interact with the stock price regressor."""

from typing import List
from flask import Flask, jsonify
from flask_cors import CORS
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

@app.route('/trained_models', methods=['GET'])
def get_trained_models():
    """
    Return a list of stocks which there exist 
    """
    trained_models = Regressor.get_trained_models()

    def add_company_name(tickers: List[str]):
        """
        Add company name to list of ticker symbols.
        """
        return [f"{ticker} - {yf.Ticker(ticker).info.get('longName', '')}" for ticker in tickers]

    return jsonify(add_company_name(trained_models))

if __name__ == '__main__':
    app.run()
