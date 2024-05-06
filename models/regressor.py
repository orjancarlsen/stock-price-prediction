"""Module providing regressor class for stock price prediction"""

import matplotlib.pyplot as plt
from keras.models import Sequential, load_model
from keras.layers import Dense, Dropout, LSTM

from data.data_transformer import DataTransformer


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

    epochs = 100
    batch_size = 32

    y_pred = None
    y_true = None

    def __init__(self, name: str, data: DataTransformer) -> None:
        """
        Parameters
        ----------
        name : str
            Name of the regressor, used for storing the model parameters.
        data : DataTransformer
            Transormed data used for training and testing the model.
        """

        self.name = name
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

        self.y_true = self.data.df_test_y.copy()
        self.y_true['Open'] = self.data.scale_dict['Open'].inverse_transform(
            self.y_true['Open'].values.reshape(-1, 1)).reshape(-1)
        self.y_true['Close'] = self.data.scale_dict['Close'].inverse_transform(
            self.y_true['Close'].values.reshape(-1, 1)).reshape(-1)


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

        if feature not in self.data.Y_features:
            raise NameError(f'{feature} not found in Y_features: {self.data.Y_features}')

        plt.plot(
            self.y_true[feature].values,
            '-',
            color='red',
            label=f'Real NOD Stock Price {feature}'
        )
        plt.plot(
            self.y_pred[:, self.data.Y_features.index(feature)],
            '--',
            color='red',
            label=f'Predicted NOD Stock Price {feature}'
        )
        plt.title('NOD Stock Price Prediction')
        plt.xlabel('Time')
        plt.ylabel('NOD Stock Price')
        plt.legend()

    def save(self) -> None:
        """
        Save the model parameters to file.
        """

        self.regressor.save(f'{self.name}.keras')

    def load(self) -> None:
        """
        Load the model parameters from file.
        """

        self.regressor = load_model(f'{self.name}.keras')
