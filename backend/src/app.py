"""API to interact with the stock price regressor."""

from typing import List

from flask import Flask, jsonify, request
from flask_cors import CORS
from pytickersymbols import PyTickerSymbols
import yfinance as yf
from yfinance.exceptions import YFPricesMissingError

from src.data.data_transformer import DataTransformer # pylint: disable=import-error
from src.model.regressor import Regressor             # pylint: disable=import-error
from src.storage.sql_wrapper import SQLWrapper

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

trained_models = Regressor.get_trained_models()
trained_models_names = []
for stock_symbol in trained_models:
    trained_models_names.append(
        {
            "symbol": stock_symbol,
            "name": yf.Ticker(stock_symbol).info.get('longName', '')
        }
    )
trained_models_names.sort(key=lambda x: x['name'])


@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to keep the application alive.
    """
    return jsonify({'status': 'alive'}), 200


@app.route('/train/<ticker>', methods=['POST'])
def train(ticker: str):
    """
    Train regressor to predict stock prices.
    """
    try:
        data = DataTransformer(ticker=ticker)
        data.create_train_and_test_data(n_days=N_DAYS)
    except YFPricesMissingError as e:
        return jsonify({'error': str(e)}), 400
    except ValueError as e:
        return jsonify({'error': f"Data preparation error: {e}"}), 400

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
def predict_next_period(ticker: str):
    """
    Make stock price prediction for the specified number of days.
    """
    regressor = Regressor.load(ticker)
    prediction_next_period = regressor.predict_next_period(n_days=N_DAYS)

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

    return jsonify(trained_models_names)


@app.route('/companies/price/<string:ticker>', methods=['GET'])
def get_stock_price(ticker: str):
    """
    Return the stock price for the given ticker within the specified date range.
    """
    from_date = request.args.get('fromDate')
    to_date = request.args.get('toDate')

    stock = yf.Ticker(ticker)
    if from_date and to_date:
        price_data = stock.history(start=from_date, end=to_date)
    else:
        price_data = stock.history(period='max')

    prices = price_data['Close'].tolist()
    dates = price_data.index.strftime('%Y-%m-%d').tolist()

    return jsonify({'dates': dates, 'prices': prices})


@app.route('/transactions', methods=['GET'])
def get_transactions():
    """
    Get all transactions from the database.
    """
    sql_wrapper = SQLWrapper()
    transactions = sql_wrapper.get_transactions()
    transactions_with_names = []
    for transaction in transactions:
        transaction_dict = transaction.__dict__
        if transaction_dict['transaction_type'] in ['BUY', 'SELL', 'DIVIDEND']:
            transaction_dict['name'] = next(
                (model['name'] for model in trained_models_names
                    if model['symbol'] == transaction.stock_symbol),
                ''
            )
            transactions_with_names.append(transaction_dict)
    return jsonify(transactions_with_names)


@app.route('/orders', methods=['GET'])
def get_orders():
    """
    Get all orders from the database.
    """
    limit = request.args.get('limit', default=100, type=int)
    sql_wrapper = SQLWrapper()
    orders = sql_wrapper.get_orders_by_status(limit=limit, statuses=['PENDING'])
    orders_with_names = []
    for order in orders:
        order_dict = order.__dict__
        order_dict['name'] = next(
            (model['name'] for model in trained_models_names
                if model['symbol'] == order.stock_symbol),
            ''
        )
        orders_with_names.append(order_dict)
    return jsonify(orders_with_names)


@app.route('/portfolio', methods=['GET'])
def get_portfolio():
    """
    Get the portfolio from the database.
    """
    sql_wrapper = SQLWrapper()
    portfolio = sql_wrapper.get_portfolio()
    for port in portfolio:
        if port.asset_type != "CASH":
            port.todays_value = yf.Ticker(port.stock_symbol).history(period='1d')['Close'].values[0]
            port.name = next(
                (model['name'] for model in trained_models_names
                    if model['symbol'] == port.stock_symbol),
                ''
            )
    return jsonify([port.__dict__ for port in portfolio])


@app.route('/portfolio/values', methods=['GET'])
def get_portfolio_values():
    """
    Get the portfolio values from the database.
    """
    sql_wrapper = SQLWrapper()
    portfolio_values = sql_wrapper.get_portfolio_values()
    return jsonify([value.__dict__ for value in portfolio_values])

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=2000)
