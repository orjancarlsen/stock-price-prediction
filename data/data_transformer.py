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
    df_train_x : pd.DataFrame
        DataFrame with features for training
    df_train_y : pd.DataFrame
        DataFrame with ground truth labels for training
    df_test_x : pd.DataFrame
        DataFrame with features for testing
    df_test_y : pd.DataFrame
        DataFrame with ground truth labels for testing
    scales : dict
        Mapping between the different features and their scales.
        Needs to be used later for inversion of the scaling. 
    x_train : np.ndarray
        Feature training set
    y_test : np.ndarray
        Ground truth training set
    x_test : np.ndarray
        Feature testing set
    y_test : np.ndarray
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

    df_train_x = None
    df_train_y = None
    df_test_x = None
    df_test_y = None
    x_train = None
    y_train = None
    x_test = None
    y_test = None
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

        self.df_train_x = df_train[self.X_features]
        self.df_train_y = df_train[self.Y_features]
        self.df_test_x = df_test[self.X_features]
        self.df_test_y = df_test[self.Y_features]

    def scale(self) -> None:
        """
        Scales the datasets, and stores mapping of scaling for inversion later.
        """

        self.scales = {}

        # Apply normalization on features
        scale_features = ['Open', 'High', 'Low', 'Close', 'Volume']
        for feature in scale_features:
            # Fit on training data column
            scale = MinMaxScaler(feature_range=(0, 1)).fit(self.df_train_x[[feature]])

            self.df_train_x[feature] = scale.transform(self.df_train_x[[feature]])
            self.df_test_x[feature] = scale.transform(self.df_test_x[[feature]])

            # Transform test data column
            if feature in self.Y_features:
                self.df_train_y[feature] = scale.transform(self.df_train_y[[feature]])
                self.df_test_y[feature] = scale.transform(self.df_test_y[[feature]])

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
        self.x_train = []
        self.y_train = []
        for i in range(n_days + 1, self.df_train_x.shape[0]):
            self.x_train.append(self.df_train_x.iloc[i - 1 - n_days:i - 1])
            self.y_train.append(self.df_train_y.iloc[i])
        self.x_train = np.array(self.x_train)
        self.y_train = np.array(self.y_train)

        # Create testing data
        df_test_inputs = pd.concat((self.df_train_x.iloc[-n_days:], self.df_test_x), axis=0)
        self.x_test = []
        for i in range(n_days + 1, df_test_inputs.shape[0]):
            self.x_test.append(df_test_inputs.iloc[i - 1 - n_days:i - 1])
        self.x_test = np.array(self.x_test)
        self.y_test = np.array(self.df_test_y.copy())
