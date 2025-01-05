# Stock Price Prediction

## Deployment

You can access the deployed application at [Stock Price Prediction](https://stock-price-prediction-frontend.onrender.com/).

## Setup Guide

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
