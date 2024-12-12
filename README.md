Tasks:
1. Manually load stock price data from yahoo to csv
2. Process data
3. Use imported ML models (LSTM) to predict price in future
4. Automatically load stock prices daily
5. Predict future prices
6. Host on URL
7. Store predictions in DB
8. Plot prediction vs actual price
9. Develop own ML model
10. Automatically load stock exchange announcements and rate how 'positive' they are with LLM
11. Allow these ratings to be part of ML model
12. Include transaction costs in model
13. Connect predictions to bank and use to trade


# Setup Guide

## Docker
Start the Docker container running the following commands from the root folder:
```
docker compose build --no-cache
docker compose up -d
```

## Backend
To start the backend individually, first install the dependencies, then start the server:
```
pip install -r requirements.txt
python backend/app.py
```

## Frontend
To start the frontend individually, run these commands:
```
cd frontend/
npm install
npm start
```
