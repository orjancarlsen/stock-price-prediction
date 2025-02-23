"""Module providing class to process stock data"""

from datetime import datetime
from typing import Tuple

import yfinance as yf
from yfinance.exceptions import YFPricesMissingError
import numpy as np
import pandas as pd


class DataTransformer:
    """
    A class that represents a dataset over a period of time for a single stock.
    Used to process the data and prepare it for a machine learning model.
    """

    x_features = ['Open', 'High', 'Low', 'Close', 'Volume']
    y_features = ['Low', 'High']

    x_train = None
    y_train = None
    x_test = None
    y_test = None
    scales = None

    def __init__(self, ticker: str) -> None:
        """
        Parameters
        ----------
        ticker : str
            Ticker for stock.
        """
        self.ticker = ticker

        # Download data from Yahoo Finance API
        try:
            self.df = yf.download(self.ticker, end='2024-01-01')
        except Exception as e:
            raise YFPricesMissingError(self.ticker, f"Error downloading data: {e}") from e

        if self.df.empty:
            raise YFPricesMissingError(self.ticker, "No data available for the ticker.")

        # Convert index to a column
        self.df.reset_index(inplace=True)

        # Ensure the 'Date' column is of datetime type
        self.df['Date'] = pd.to_datetime(self.df['Date'])

    def split_data(self, date: str) -> Tuple[
        pd.DataFrame,
        pd.DataFrame,
        pd.DataFrame,
        pd.DataFrame
    ]:
        """
        Splits the DataFrame into raw training and testing parts without scaling.
        
        Parameters
        ----------
        date : str
            Date to use for splitting.
        
        Returns
        -------
        tuple of pd.DataFrame
            (df_train_x, df_train_y, df_test_x, df_test_y)
        """
        df_train = self.df[self.df['Date'] < date].copy()
        df_test = self.df[self.df['Date'] >= date].copy()

        df_train_x = df_train[self.x_features].copy()
        df_test_x = df_test[self.x_features].copy()

        df_train_y = df_train[self.y_features].copy()
        df_test_y = df_test[self.y_features].copy()

        # Calculate rolling min/max for targets (window=10 days, shifted by -9)
        df_train_y['Low'] = df_train_y['Low'].rolling(window=10, min_periods=10).min().shift(-9)
        df_train_y['High'] = df_train_y['High'].rolling(window=10, min_periods=10).max().shift(-9)
        df_test_y['Low'] = df_test_y['Low'].rolling(window=10, min_periods=10).min().shift(-9)
        df_test_y['High'] = df_test_y['High'].rolling(window=10, min_periods=10).max().shift(-9)
        df_train_y.dropna(inplace=True)
        df_test_y.dropna(inplace=True)

        return df_train_x, df_train_y, df_test_x, df_test_y

    def split_and_scale(self, date: str, common_scales: dict) -> Tuple[
        pd.DataFrame,
        pd.DataFrame,
        pd.DataFrame,
        pd.DataFrame
    ]:
        """
        Splits the dataset and then scales it. If a common scaler is provided,
        it is used to transform the data. Otherwise, scalers are fitted per stock.
        
        Parameters
        ----------
        date : str
            Date to use for splitting.
        common_scales : dict, optional
            Dictionary of pre-fitted scalers to use for all features.
        
        Returns
        -------
        tuple of pd.DataFrame
            (df_train_x, df_train_y, df_test_x, df_test_y)
        """
        df_train_x, df_train_y, df_test_x, df_test_y = self.split_data(date)
        scale_features = self.x_features

        self.scales = common_scales
        for feature in scale_features:
            scaler = common_scales[feature]
            df_train_x[feature] = scaler.transform(df_train_x[[feature]]).flatten()
            df_test_x[feature] = scaler.transform(df_test_x[[feature]]).flatten()
            if feature in self.y_features:
                df_train_y[feature] = scaler.transform(df_train_y[[feature]]).flatten()
                df_test_y[feature] = scaler.transform(df_test_y[[feature]]).flatten()

        return df_train_x, df_train_y, df_test_x, df_test_y

    def create_train_and_test_data(
            self,
            n_days: int,
            common_scales: dict = None
        ) -> None:
        """
        Creates training and testing arrays from the split (and scaled) data.
        
        Parameters
        ----------
        n_days : int
            Number of days to use for the input sequence.
        common_scales : dict, optional
            Dictionary of pre-fitted scalers to use.
        """
        df_train_x, df_train_y, df_test_x, df_test_y = self.split_and_scale('2023-01-01', common_scales)

        # Build training arrays
        self.x_train = []
        self.y_train = []
        for i in range(n_days, df_train_x.shape[0] - 10):
            self.x_train.append(df_train_x.iloc[i - n_days:i])
            self.y_train.append(df_train_y.iloc[i])
        self.x_train = np.array(self.x_train)
        self.y_train = np.array(self.y_train)

        # Build testing arrays
        df_test_x_inputs = pd.concat((df_train_x.iloc[-n_days:], df_test_x), axis=0)
        self.x_test = []
        self.y_test = []
        for i in range(n_days, df_test_x_inputs.shape[0] - 10):
            self.x_test.append(df_test_x_inputs.iloc[i - n_days:i])
            self.y_test.append(df_test_y.iloc[i - n_days])
        self.x_test = np.array(self.x_test)
        self.y_test = np.array(self.y_test)

    def get_past_n_days(
            self,
            n_days: int,
            start_date: datetime = None,
            end_date: datetime = None,
            scales: dict = None
        ) -> np.ndarray:
        """
        Get the last n_days of data to do a prediction. Uses the provided scales
        (if any) so that unseen stocks are transformed with the same parameters.
        
        Parameters
        ----------
        n_days : int
            Number of days to retrieve.
        start_date : datetime, optional
            Start date for data retrieval.
        end_date : datetime, optional
            End date for data retrieval.
        scales : dict, optional
            Pre-fitted scales to use. If not provided, the instance’s own scales are used.
        
        Returns
        -------
        np.ndarray
            Array containing the last n_days of transformed data.
        """
        if start_date and end_date:
            past_n_days = yf.download(self.ticker, start=start_date, end=end_date).tail(n_days)
        else:
            past_n_days = yf.download(self.ticker, period='1y').tail(n_days)
        past_n_days = past_n_days[self.x_features].copy()

        used_scales = scales if scales is not None else self.scales
        for feature in self.x_features:
            scaler = used_scales.get(feature)
            if scaler:
                past_n_days[feature] = scaler.transform(past_n_days[[feature]]).flatten()
        return past_n_days.values
