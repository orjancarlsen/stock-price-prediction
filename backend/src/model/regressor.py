"""Module providing regressor class for stock price prediction"""

import os
import pathlib
import glob
from datetime import datetime
import joblib
import numpy as np
import matplotlib.pyplot as plt

# Suppress tensorflow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

from pytz import timezone
from keras._tf_keras.keras.models import Sequential
from keras._tf_keras.keras.layers import Dense, Dropout, LSTM, Input
from keras._tf_keras.keras.optimizers import Adam
from keras._tf_keras.keras.metrics import MeanAbsoluteError
from keras._tf_keras.keras.losses import MeanSquaredError
from keras._tf_keras.keras.callbacks import EarlyStopping
from keras._tf_keras.keras.utils import set_random_seed
import tensorflow as tf
set_random_seed(42)
tf.config.experimental.enable_op_determinism()

from src.data.data_transformer import DataTransformer # pylint: disable=import-error

class Regressor:
    """
    Representation of a machine learning model performing a regression to
    predict stock prices.

    Attributes
    ----------
    name : str
        Name of the regressor.
    data : DataTransformer
        Transormed data used for training and testing the model.
    model : Sequential
        Model with plain stack of layers where each layer has exactly
        one input tensor and one output tensor.

    Methods
    -------
    train()
        Fit the parameters of the model to the training set.
    predict()
        Use the trained model to predict the label features for the test set.
    save()
        Save the model parameters to file.
    load()
        Load the model parameters from file.
    """

    epochs = 100
    batch_size = 32

    y_pred = None
    y_true = None

    def __init__(self, ticker: str, data: DataTransformer) -> None:
        """
        Parameters
        ----------
        ticker : str
            Ticker of stock.
        data : DataTransformer
            Transormed data used for training and testing the model.
        """
        self.ticker = ticker
        self.data = data

        # Set seed for reproducibility
        np.random.seed(42)
        tf.random.set_seed(42)

        model = Sequential()

        input_layer = Input(
            shape=(self.data.x_train.shape[1], self.data.x_train.shape[2]),
            batch_size=self.batch_size,
            dtype='float32',
            sparse=False
        )
        model.add(input_layer)

        model.add(LSTM(units=50, return_sequences=True))
        model.add(Dropout(0.2))

        model.add(LSTM(units=100, return_sequences=True))
        model.add(Dropout(0.2))

        model.add(LSTM(units=200, return_sequences=True))
        model.add(Dropout(0.2))

        model.add(LSTM(units=100, return_sequences=True))
        model.add(Dropout(0.2))

        model.add(LSTM(units=50, return_sequences=False))
        model.add(Dropout(0.2))

        model.add(Dense(units=self.data.y_train.shape[1]))

        model.compile(
            optimizer=Adam(learning_rate=1e-4),
            loss=MeanSquaredError(),
            metrics=[MeanAbsoluteError()]
        )

        model.summary()

        self.model = model

    def train(self) -> None:
        """
        Fit the parameters of the model to the training set.
        """
        self.model.fit(
            self.data.x_train,
            self.data.y_train,
            epochs=self.epochs,
            batch_size=self.batch_size,
            validation_data=(self.data.x_test, self.data.y_test),
            callbacks=[EarlyStopping(monitor='val_loss', patience=5)]
        )

    def predict(self) -> None:
        """
        Use the trained model to predict the label features for the test set.
        """
        self.y_pred = self.model.predict(self.data.x_test)
        self.y_pred[:, 0] = self.data.scales['Low'].inverse_transform(
            self.y_pred[:, 0].reshape(-1, 1)).reshape(-1)
        self.y_pred[:, 1] = self.data.scales['High'].inverse_transform(
            self.y_pred[:, 1].reshape(-1, 1)).reshape(-1)

        self.y_true = self.data.y_test.copy()
        self.y_true[:, 0] = self.data.scales['Low'].inverse_transform(
            self.y_true[:, 0].reshape(-1, 1)).reshape(-1)
        self.y_true[:, 1] = self.data.scales['High'].inverse_transform(
            self.y_true[:, 1].reshape(-1, 1)).reshape(-1)

    def predict_next_period(
            self,
            n_days: int,
            start_date: datetime = None,
            end_date: datetime = None
        ) -> np.ndarray:
        """
        Predict the lowest and highest stock price in the next 10 days.

        Parameters
        ----------
        n_days : int
            Number of days used for prediction.
        start_date : datetime
            A date which is a year ago from the date to predict.

        Returns
        -------
        np.ndarray
            Array containing the predicted stock prices for the next period.
        """
        past_n_days = self.data.get_past_n_days(n_days, start_date=start_date, end_date=end_date)
        prediction_next_period = self.model.predict(past_n_days.reshape(1, n_days, 5))

        prediction_next_period[:, 0] = self.data.scales['Low'].inverse_transform(
            prediction_next_period[:, 0].reshape(-1, 1)).reshape(-1)
        prediction_next_period[:, 1] = self.data.scales['High'].inverse_transform(
            prediction_next_period[:, 1].reshape(-1, 1)).reshape(-1)
        return prediction_next_period[0]

    def plot(self, feature: str) -> None:
        """
        Plots predicted values against true values for one feature.

        Parameters
        ----------
        feature : str
            Feature's values to be plotted.

        Raises
        ------
        Exception
            If feature which is not predicted is tried to be plotted.
        """
        if feature not in self.data.y_features:
            raise NameError(f'{feature} not found in y_features: {self.data.y_features}')

        plt.plot(
            self.y_true[feature].values,
            '-',
            color='red',
            label=f'Real Stock Price {feature}'
        )
        plt.plot(
            self.y_pred[:, self.data.y_features.index(feature)],
            '--',
            color='red',
            label=f'Predicted Stock Price {feature}'
        )
        plt.title('Stock Price Prediction')
        plt.xlabel('Time')
        plt.ylabel('Stock Price')
        plt.legend()

    def save(self) -> None:
        """
        Save the model parameters to file.
        """
        timezone_norway = timezone('Europe/Oslo')
        date = datetime.now(timezone_norway).strftime('%Y-%m-%d_%H-%M-%S')
        filepath = pathlib.Path(__file__).parent.resolve()
        filename = filepath / f'models/{self.ticker}-{date}.joblib'
        joblib.dump(self, filename)

    @staticmethod
    def load(ticker) -> 'Regressor':
        """
        Load the newest model parameters from file based on the date in the filename.
        """
        filepath = pathlib.Path(__file__).parent.resolve()
        files = glob.glob(str(filepath / f'models/{ticker}-*.joblib'))
        if not files:
            raise FileNotFoundError(f"No model files found for ticker {ticker}")

        # Extract timestamps from filenames and sort by date
        def extract_date(filename) -> datetime:
            basename = os.path.basename(filename)
            # Split only on the first hyphen
            parts = basename.split('-', 1)
            date_str = parts[1].replace('.joblib', '')
            try:
                return datetime.strptime(date_str, '%Y-%m-%d_%H-%M-%S')
            except ValueError as e:
                print(f"Error parsing date from filename {filename}: {e}")
                raise

        files.sort(key=extract_date, reverse=True)
        latest_file = files[0]
        return joblib.load(latest_file)

    @staticmethod
    def get_trained_models() -> set[str]:
        """
        Return a list of tickers for which there exist a model.
        """
        filepath = pathlib.Path(__file__).parent.resolve()
        files = glob.glob(str(filepath / 'models/*.joblib'))

        trained_models = set()
        for filename in files:
            basename = os.path.basename(filename)
            ticker = basename.split('-', 1)[0]
            trained_models.add(ticker)

        return trained_models
