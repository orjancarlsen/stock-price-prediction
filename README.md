# Stock Price Prediction

This is an application that trades stocks on the Oslo Stock Exchange.

You can access the deployed application at [Stock Price Prediction](https://stock-price-prediction-frontend.onrender.com/).

Explore how the portfolio is performing...

![alt text](portfolio.png)

... or deepdive into the individual stocks!

![alt text](individual_stock.png)


## Training

Keras is used to train a LSTM model on 59 companies on the Oslo Børs Stock Exchange. The input features are the Open, Close, Low and High price for the stock, and the Volume traded, for each day in the 200 day-period. This is used to predict the lowest and highest price for the next 10 days. For each stock, all available history, until 2022-12-31 is used for training, while the period 2023-01-01 to 2023-12-31 is used for validation during training, and stopping the training when validation loss stops decreasing. The algorithm is backtracked from 2024-01-01 for testing.

This is the structure of the LSTM model:

| Layer (type)        | Output Shape     |    Param # |
|---------------------|-----------------|-----------:|
| lstm (LSTM)        | (32, 200, 50)    |     11,200 |
| dropout (Dropout)  | (32, 200, 50)    |          0 |
| lstm_1 (LSTM)      | (32, 200, 100)   |     60,400 |
| dropout_1 (Dropout)| (32, 200, 100)   |          0 |
| lstm_2 (LSTM)      | (32, 200, 200)   |    240,800 |
| dropout_2 (Dropout)| (32, 200, 200)   |          0 |
| lstm_3 (LSTM)      | (32, 200, 100)   |    120,400 |
| dropout_3 (Dropout)| (32, 200, 100)   |          0 |
| lstm_4 (LSTM)      | (32, 50)         |     30,200 |
| dropout_4 (Dropout)| (32, 50)         |          0 |
| dense (Dense)      | (32, 2)          |        102 |


## Trading

The starting capital was 100k NOK, and the portfolio can consist of up to 10 different stocks.

 If the predicted prices for a stock has at least 10% price increase from the low price to the high price, it will be a potential trade. Buy orders are always placed 2% above the predicted low price, and sell orders are placed 2% below the predicted high price. Each evening, after the exchange is closed, a script is ran to determine if orders were executed or not, based on todays prices. Subsequently, new prices are predicted and orders are placed. Sell orders are placed for all stocks in the portfolio, while buy orders are placed for the predicted most profitable stcoks, not already in the portfolio.


## Setup Guide

### Environment Variables
Add a `.env` file in the both the `backend/` and `frontend/` folder.

In `backend/` with the values:
```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=eu-north-1
S3_BUCKET=stock-price-prediction-s3
```

In `frontend/` it should have the following values:
```
NPM_AUTH_TOKEN=...
REACT_APP_BACKEND_URL=http://localhost:2000
```

### Docker
Start the Docker container running the following commands from the root folder:
```
docker compose build --no-cache
docker compose up -d
```

### Backend
To start the backend individually, first install the dependencies, then start the server:
```
cd backend/
pip install -r requirements.txt
python -m src.app
```

### Frontend
To start the frontend individually, run these commands:
```
cd frontend/
npm install
npm start
```
