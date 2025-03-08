"""API to interact with the stock price regressor."""

from typing import List

from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
from yfinance.exceptions import YFPricesMissingError
from sklearn.preprocessing import MinMaxScaler

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

available_tickers = [
    'AFG.OL',
    'AFK.OL',
    'AKER.OL',
    'AKRBP.OL',
    'AKSO.OL',
    'ATEA.OL',
    'AUSS.OL',
    'AUTO.OL',
    'B2I.OL',
    'BAKKA.OL',
    'BONHR.OL',
    'BOUV.OL',
    'BWLPG.OL',
    'BRG.OL',
    'CADLR.OL',
    'CLOUD.OL',
    'CRAYN.OL',
    'DNB.OL',
    'DNO.OL',
    'ELK.OL',
    'ELMRA.OL',
    'ENTRA.OL',
    'EQNR.OL',
    'EPR.OL',
    'FLNG.OL',
    'FRO.OL',
    'GJF.OL',
    'GOGL.OL',
    'HAFNI.OL',
    'HAUTO.OL',
    'KID.OL',
    'KIT.OL',
    'KOA.OL',
    'KOG.OL',
    'LSG.OL',
    'MPCC.OL',
    'NEL.OL',
    'MOWI.OL',
    'MULTI.OL',
    'NHY.OL',
    'NOD.OL',
    'NAS.OL',
    'ORK.OL',
    'PHO.OL',
    'RECSI.OL',
    'SALM.OL',
    'SCHB.OL',
    'SCATC.OL',
    'SB1NO.OL',
    'SNI.OL',
    'STB.OL',
    'SUBC.OL',
    'TEL.OL',
    'TGS.OL',
    'TOM.OL',
    'VEI.OL',
    'VAR.OL',
    'WAWI.OL',
    'YAR.OL',
]
available_companies = []
for _ticker in available_tickers:
    available_companies.append(
        {
            "symbol": _ticker,
            "name": yf.Ticker(_ticker).info.get('longName', '')
        }
    )
available_companies.sort(key=lambda x: x['name'])


@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to keep the application alive.
    """
    return jsonify({'status': 'alive'}), 200


@app.route('/train', methods=['POST'])
def train():
    """
    Train regressor to predict stock prices.
    """

    data_dict = {}
    raw_train_frames = []
    try:
        for ticker in available_tickers:
            data = DataTransformer(ticker=ticker)
            # Get raw training data (without scaling) for building the common scaler.
            df_train_x, _, _, _ = data.split_data('2023-01-01')
            raw_train_frames.append(df_train_x)
            data_dict[ticker] = data
    except YFPricesMissingError as e:
        return jsonify({'error': str(e)}), 400
    except ValueError as e:
        return jsonify({'error': f"Data preparation error: {e}"}), 400

    all_train_df = pd.concat(raw_train_frames, axis=0)
    common_scales = {}
    for feature in DataTransformer.x_features:
        scaler = MinMaxScaler(feature_range=(0,1))
        scaler.fit(all_train_df[feature].values.reshape(-1, 1))
        common_scales[feature] = scaler

    for ticker in available_tickers:
        data_dict[ticker].create_train_and_test_data(n_days=N_DAYS, common_scales=common_scales)

    regressor = Regressor(data_dict=data_dict)
    regressor.train()
    regressor.save()

    return jsonify({}), 200


@app.route('/predict_next/<ticker>', methods=['GET'])
def predict_next_period(ticker: str):
    """
    Make stock price prediction for the specified number of days.
    """
    regressor = Regressor.load()
    prediction_next_period = regressor.predict_next_period(n_days=N_DAYS, ticker=ticker)

    return jsonify(prediction_next_period.tolist())


@app.route('/companies/available', methods=['GET'])
def get_available_companies() -> List[str]:
    """
    Get available companies.
    """
    return jsonify(available_companies)


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
                (model['name'] for model in available_companies
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
            (model['name'] for model in available_companies
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
                (model['name'] for model in available_companies
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
