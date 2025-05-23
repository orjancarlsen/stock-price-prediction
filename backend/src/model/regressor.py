"""Module providing regressor class for stock price prediction"""

import os
import tempfile
import boto3
from datetime import datetime
import joblib
import numpy as np

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

from src.data.data_transformer import DataTransformer  # pylint: disable=import-error

import dotenv
dotenv.load_dotenv()

# Ensure that S3_BUCKET is set in your environment
S3_BUCKET = os.environ.get('S3_BUCKET')
if not S3_BUCKET:
    raise ValueError(
        "Environment variable S3_BUCKET is not set. Please set it to your S3 bucket name."
    )

class Regressor:
    """
    A regression model for stock price prediction trained on data from multiple companies.
    Uses a common scaler (built from all raw training data) for all scaling during training
    and prediction.
    """

    epochs = 100
    batch_size = 32

    y_pred = None
    y_true = None

    def __init__(self, data_dict: dict[str, DataTransformer]) -> None:
        """
        Parameters
        ----------
        data_dict : dict[str, DataTransformer]
            Mapping of ticker symbols to their respective DataTransformer instances.
            (Each DataTransformer should already have been scaled with the common scaler.)
        """
        self.data_dict = data_dict
        self.tickers = list(data_dict.keys())
        # Assume all DataTransformers now share the same scales.
        self.common_scales = data_dict[self.tickers[0]].scales

        # Aggregate training and testing data from all companies.
        self.x_train = np.concatenate([data_dict[ticker].x_train for ticker in self.tickers],axis=0)
        self.y_train = np.concatenate([data_dict[ticker].y_train for ticker in self.tickers],axis=0)
        self.x_test = np.concatenate([data_dict[ticker].x_test for ticker in self.tickers], axis=0)
        self.y_test = np.concatenate([data_dict[ticker].y_test for ticker in self.tickers], axis=0)

        # Build the model.
        model = Sequential()
        input_layer = Input(
            shape=(self.x_train.shape[1], self.x_train.shape[2]),
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
        model.add(Dense(units=self.y_train.shape[1]))

        model.compile(
            optimizer=Adam(learning_rate=1e-4),
            loss=MeanSquaredError(),
            metrics=[MeanAbsoluteError()]
        )

        model.summary()
        self.model = model

    def train(self) -> None:
        """
        Fit the model to the aggregated training data.
        """
        self.model.fit(
            self.x_train,
            self.y_train,
            epochs=self.epochs,
            batch_size=self.batch_size,
            validation_data=(self.x_test, self.y_test),
            callbacks=[EarlyStopping(monitor='val_loss', patience=5)]
        )

    def predict_next_period(
            self,
            n_days: int,
            ticker: str,
            start_date: datetime = None,
            end_date: datetime = None
        ) -> np.ndarray:
        """
        Predict the next period's stock prices for the given ticker.
        
        Parameters
        ----------
        n_days : int
            Number of days for input sequence.
        ticker : str
            Ticker symbol to retrieve recent data for prediction.
        start_date : datetime, optional
            Start date for data retrieval.
        end_date : datetime, optional
            End date for data retrieval.
        
        Returns
        -------
        np.ndarray
            Predicted stock prices for the next period.
        """
        # Use the provided ticker’s DataTransformer if available,
        # otherwise create a temporary one.
        data = self.data_dict.get(ticker, DataTransformer(ticker))
        past_n_days = data.get_past_n_days(
            n_days,
            start_date=start_date,
            end_date=end_date,
            scales=self.common_scales
        )
        prediction_next_period = self.model.predict(past_n_days.reshape(1, n_days, 5))

        prediction_next_period[:, 0] = self.common_scales['Low'].inverse_transform(
            prediction_next_period[:, 0].reshape(-1, 1)
        ).reshape(-1)
        prediction_next_period[:, 1] = self.common_scales['High'].inverse_transform(
            prediction_next_period[:, 1].reshape(-1, 1)
        ).reshape(-1)
        return prediction_next_period[0]

    def save(self) -> None:
        """
        Save the trained model to S3.
        """
        timezone_norway = timezone('Europe/Oslo')
        date = datetime.now(timezone_norway).strftime('%Y-%m-%d_%H-%M-%S')
        filename = f'{date}.joblib'
        s3_key = f'models/{filename}'

        # Save the model to a temporary file
        with tempfile.NamedTemporaryFile() as temp_file:
            joblib.dump(self, temp_file.name)
            temp_file.seek(0)
            # Upload the file to S3
            s3 = boto3.client('s3')
            s3.upload_file(temp_file.name, S3_BUCKET, s3_key)
            print(f"Model saved to s3://{S3_BUCKET}/{s3_key}")

    @staticmethod
    def load() -> 'Regressor':
        """
        Load the most recent model from S3.
        """
        s3 = boto3.client('s3')
        prefix = 'models/'
        response = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
        if 'Contents' not in response:
            raise FileNotFoundError(f"No model files found in s3://{S3_BUCKET}/{prefix}")

        # Filter out keys that end with '.joblib'
        files = [obj['Key'] for obj in response['Contents'] if obj['Key'].endswith('.joblib')]
        if not files:
            raise FileNotFoundError(f"No model files found in s3://{S3_BUCKET}/{prefix}")

        def extract_date(key: str) -> datetime:
            # Assumes key format is "models/YYYY-MM-DD_HH-MM-SS.joblib"
            basename = os.path.basename(key)
            date_str = basename.replace('.joblib', '')
            try:
                return datetime.strptime(date_str, '%Y-%m-%d_%H-%M-%S')
            except ValueError as e:
                print(f"Error parsing date from key {key}: {e}")
                raise

        files.sort(key=extract_date, reverse=True)
        latest_key = files[0]
        # Download the latest file to a temporary file and load it
        with tempfile.NamedTemporaryFile() as temp_file:
            s3.download_file(S3_BUCKET, latest_key, temp_file.name)
            model = joblib.load(temp_file.name)
            print(f"Model loaded from s3://{S3_BUCKET}/{latest_key}")
            return model
