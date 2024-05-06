"""Module providing class to process stock data"""

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
    X_features : list
        Chosen features used to perform training and predictions.
    Y_features : list
        Chosen features used as ground truth.
    df_train_X : pd.DataFrame
        DataFrame with features for training
    df_train_Y : pd.DataFrame
        DataFrame with ground truth labels for training
    df_test_X : pd.DataFrame
        DataFrame with features for testing
    df_test_Y : pd.DataFrame
        DataFrame with ground truth labels for testing
    scales : dict
        Mapping between the different features and their scales.
        Needs to be used later for inversion of the scaling. 
    X_train : np.ndarray
        Feature training set
    Y_test : np.ndarray
        Ground truth training set
    X_test : np.ndarray
        Feature testing set
    Y_test : np.ndarray
        Ground truth testing set

    Methods
    -------
    split(date)
        Splits the dataset into fractions for both training and test
        based on a date, and feature and target.
    scale()
        Scales the datasets, and stores mapping of scaling for inversion later.
    create_train_and_test_data(n_days)
        Separate the splitted data into complete ndarrays that can be used
        for training and testing a machine learning model.
    """

    X_features = ['Open', 'High', 'Low', 'Close', 'Volume']
    Y_features = ['Open', 'Close']

    df_train_X = None
    df_train_Y = None
    df_test_X = None
    df_test_Y = None
    X_train = None
    Y_train = None
    X_test = None
    Y_test = None
    scales = None

    def __init__(self, path: str) -> None:
        """
        Parameters
        ----------
        path : str
            Path to csv file with stock data.
        """

        self.df = pd.read_csv(path, parse_dates=['Date'])

    def split(self, date: str) -> None:
        """
        Splits the dataset into fractions for both training and testing
        based on a date, and feature and target.
        """

        df_train = self.df[self.df['Date'] < date]
        df_test = self.df[self.df['Date'] >= date]

        self.df_train_X = df_train[self.X_features]
        self.df_train_Y = df_train[self.Y_features]
        self.df_test_X = df_test[self.X_features]
        self.df_test_Y = df_test[self.Y_features]

    def scale(self) -> None:
        """
        Scales the datasets, and stores mapping of scaling for inversion later.
        """

        self.scales = {}

        # Apply normalization on features
        scale_features = ['Open', 'High', 'Low', 'Close', 'Volume']
        for feature in scale_features:
            # Fit on training data column
            scale = MinMaxScaler(feature_range=(0, 1)).fit(self.df_train_X[[feature]])

            self.df_train_X[feature] = scale.transform(self.df_train_X[[feature]])
            self.df_test_X[feature] = scale.transform(self.df_test_X[[feature]])

            # Transform test data column
            if feature in self.Y_features:
                self.df_train_Y[feature] = scale.transform(self.df_train_Y[[feature]])
                self.df_test_Y[feature] = scale.transform(self.df_test_Y[[feature]])

            # Store the scale for inversion later
            self.scales[feature] = scale

    def create_train_and_test_data(self, n_days: int) -> None:
        """
        Separate the splitted data into complete ndarrays that can be used
        for training and testing a machine learning model.

        Parameters
        ----------
        n_days : int
            Number of days used for prediction
        """

        # Create training data
        self.X_train = []
        self.Y_train = []
        for i in range(n_days + 1, self.df_train_X.shape[0]):
            self.X_train.append(self.df_train_X.iloc[i - 1 - n_days:i - 1])
            self.Y_train.append(self.df_train_Y.iloc[i])
        self.X_train = np.array(self.X_train)
        self.Y_train = np.array(self.Y_train)

        # Create testing data
        df_test_inputs = pd.concat((self.df_train_X.iloc[-n_days:], self.df_test_X), axis=0)
        self.X_test = []
        for i in range(n_days + 1, df_test_inputs.shape[0]):
            self.X_test.append(df_test_inputs.iloc[i - 1 - n_days:i - 1])
        self.X_test = np.array(self.X_test)
        self.Y_test = np.array(self.df_test_Y.copy())
