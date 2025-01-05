"""Module providing class to process stock data"""

from typing import Tuple

import yfinance as yf
from yfinance.exceptions import YFPricesMissingError
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler


class DataTransformer:
    """
    A class that represents a dataset over a period of time for a single stock.
    Used to process the data and prepare it for a machine learning model.

    Attributes
    ----------
    df : pd.DataFrame
        DataFrame with stock data from path.
    x_features : list
        Chosen features used to perform training and predictions.
    y_features : list
        Chosen features used as ground truth.
    x_train : np.ndarray
        Feature training set
    y_train : np.ndarray
        Ground truth training set
    x_test : np.ndarray
        Feature testing set
    y_test : np.ndarray
        Ground truth testing set
    scales : dict
        Mapping between the different features and their scales.
        Needs to be used later for inversion of the scaling. 

    Methods
    -------
    split_and_scale(date)
        Splits the dataset into fractions for both training and testing
        based on a date, and feature and target. Then each feature is scaled,
        and mapping of scaling stored for inversion later.
    create_train_and_test_data(n_days)
        Separate the splitted data into complete ndarrays that can be used
        for training and testing a machine learning model.
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

    def split_and_scale(self, date: str) -> Tuple[np.ndarray]:
        """
        Splits the dataset into fractions for both training and testing
        based on a date, and feature and target. Then each feature is scaled,
        and mapping of scaling stored for inversion later.

        Parameters
        ----------
        date : str
            Date to use for splitting between training and testing.
        """
        df_train = self.df[self.df['Date'] < date]
        df_test = self.df[self.df['Date'] >= date]

        if df_train.empty or df_test.empty:
            raise ValueError(
                f"Insufficient data for splitting: "
                f"Train shape {df_train.shape}, Test shape {df_test.shape}"
            )

        df_train_x = df_train[self.x_features].copy()
        df_train_y = df_train[self.y_features].copy()
        df_test_x = df_test[self.x_features].copy()
        df_test_y = df_test[self.y_features].copy()

        # Calculate minimum Low and maximum High of rolling period of 10 days
        df_train_y['Low'] = df_train_y['Low'].rolling(window=10, min_periods=10).min().shift(-9)
        df_train_y['High'] = df_train_y['High'].rolling(window=10, min_periods=10).max().shift(-9)
        df_test_y['Low'] = df_test_y['Low'].rolling(window=10, min_periods=10).min().shift(-9)
        df_test_y['High'] = df_test_y['High'].rolling(window=10, min_periods=10).max().shift(-9)
        df_train_y.dropna(inplace=True)
        df_test_y.dropna(inplace=True)

        self.scales = {}

        # Apply normalization on features
        scale_features = ['Open', 'High', 'Low', 'Close', 'Volume']
        for feature in scale_features:
            # Fit on training data column
            scale = MinMaxScaler(feature_range=(0, 1)).fit(df_train_x[[feature]])

            df_train_x[feature] = scale.transform(df_train_x[[feature]])
            df_test_x[feature] = scale.transform(df_test_x[[feature]])

            # Transform test data column
            if feature in self.y_features:
                df_train_y[feature] = scale.transform(df_train_y[[feature]])
                df_test_y[feature] = scale.transform(df_test_y[[feature]])

            # Store the scale for inversion later
            self.scales[feature] = scale

        return df_train_x, df_train_y, df_test_x, df_test_y

    def create_train_and_test_data(self, n_days: int) -> None:
        """
        Separate the splitted data into complete ndarrays that can be used
        for training and testing a machine learning model.

        Parameters
        ----------
        n_days : int
            Number of days used for prediction
        """
        df_train_x, df_train_y, df_test_x, df_test_y = self.split_and_scale('2023-01-01')

        # Create training data
        self.x_train = []
        self.y_train = []
        for i in range(n_days, df_train_x.shape[0] - 10):
            self.x_train.append(df_train_x.iloc[i - n_days:i])
            self.y_train.append(df_train_y.iloc[i])
        self.x_train = np.array(self.x_train)
        self.y_train = np.array(self.y_train)

        # Create testing data
        df_test_x_inputs = pd.concat((df_train_x.iloc[-n_days:], df_test_x), axis=0)
        self.x_test = []
        self.y_test = []
        for i in range(n_days, df_test_x_inputs.shape[0] - 10):
            self.x_test.append(df_test_x_inputs.iloc[i - n_days:i])
            self.y_test.append(df_test_y.iloc[i - n_days])
        self.x_test = np.array(self.x_test)
        self.y_test = np.array(self.y_test)

    def get_past_n_days(self, n_days: int) -> np.ndarray:
        """
        Get the last n_days of data from the dataset to do a prediction.

        Parameters
        ----------
        n_days : int
            Number of days to retrieve.

        Returns
        -------
        np.ndarray
            Array containing the last n_days of data.
        """
        past_n_days = yf.download(self.ticker, period='1y').tail(n_days)
        past_n_days = past_n_days[self.x_features].copy()

        # Apply the stored scales to the past n days data
        for feature in self.x_features:
            scale = self.scales.get(feature)
            if scale:
                past_n_days[feature] = scale.transform(past_n_days[[feature]])

        return past_n_days.values
