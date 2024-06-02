"""API to interact with the stock price regressor."""

from flask import Flask, jsonify

from data.data_transformer import DataTransformer # pylint: disable=import-error
from models.regressor import Regressor            # pylint: disable=import-error


app = Flask(__name__)

@app.route('/', methods=['GET'])
def stock_price_prediction():
    """
    Perform prediction of stock prices.
    """
    ticker_nod = "NOD.OL"
    n_days = 200

    data_nod = DataTransformer(ticker=ticker_nod)
    data_nod.create_train_and_test_data(n_days=n_days)

    regressor = Regressor(name='nod_prediction_test', data=data_nod)
    regressor.train()
    regressor.predict()

    return jsonify({}), 200

if __name__ == '__main__':
    app.run()
