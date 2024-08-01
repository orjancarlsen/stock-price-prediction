"""Module providing regressor class for stock price prediction"""

from datetime import datetime

import pathlib
import os
import glob
import joblib
import matplotlib.pyplot as plt
from keras.models import Sequential
from keras.layers import Dense, Dropout, LSTM

from data.data_transformer import DataTransformer # pylint: disable=import-error


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
    regressor : Sequential
        Model with plain stack of layers where each layer has exactly
        one input tensor and one output tensor.

    Methods
    -------
    train()
        Fit the parameters of the regressor to the training set.
    predict()
        Use the trained regressor to predict the label features for the test set.
    save()
        Save the model parameters to file.
    load()
        Load the model parameters from file.
    """

    epochs = 1
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

        optimizer = 'adam'
        loss_function = 'mean_squared_error'

        regressor = Sequential()

        regressor.add(LSTM(units=50, return_sequences=True,
                           input_shape=(self.data.x_train.shape[1], self.data.x_train.shape[2])))
        regressor.add(Dropout(0.2))

        regressor.add(LSTM(units=50, return_sequences=True))
        regressor.add(Dropout(0.2))

        regressor.add(LSTM(units=50, return_sequences=True))
        regressor.add(Dropout(0.2))

        regressor.add(LSTM(units=50))
        regressor.add(Dropout(0.2))

        regressor.add(Dense(units=self.data.y_train.shape[1]))

        regressor.compile(optimizer=optimizer, loss=loss_function)

        self.regressor = regressor

    def train(self) -> None:
        """
        Fit the parameters of the regressor to the training set.
        """
        self.regressor.fit(
            self.data.x_train,
            self.data.y_train,
            epochs=self.epochs,
            batch_size=self.batch_size
        )

    def predict(self) -> None:
        """
        Use the trained regressor to predict the label features for the test set.
        """
        self.y_pred = self.regressor.predict(self.data.x_test)
        self.y_pred[:, 0] = self.data.scales['Open'].inverse_transform(
            self.y_pred[:, 0].reshape(-1, 1)).reshape(-1)
        self.y_pred[:, 1] = self.data.scales['Close'].inverse_transform(
            self.y_pred[:, 1].reshape(-1, 1)).reshape(-1)

        self.y_true = self.data.y_test.copy()
        self.y_true[:, 0] = self.data.scales['Open'].inverse_transform(
            self.y_true[:, 0].reshape(-1, 1)).reshape(-1)
        self.y_true[:, 1] = self.data.scales['Close'].inverse_transform(
            self.y_true[:, 1].reshape(-1, 1)).reshape(-1)


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
        date = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
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
        def extract_date(filename):
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
