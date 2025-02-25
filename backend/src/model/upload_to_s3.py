"""Script to initially upload the model to S3 bucket."""
import boto3
import os

from dotenv import load_dotenv
load_dotenv()

# Make sure the S3_BUCKET environment variable is set or replace it with your bucket name directly.
BUCKET_NAME = os.environ.get("S3_BUCKET", "stock-price-prediction-s3")
LOCAL_FILE_PATH = "src/model/models/2025-02-23_09-05-10.joblib"
S3_KEY = "models/2025-02-23_09-05-10.joblib"

# Create an S3 client
s3 = boto3.client('s3')

# Upload the file
s3.upload_file(LOCAL_FILE_PATH, BUCKET_NAME, S3_KEY)
print(f"File '{LOCAL_FILE_PATH}' uploaded to s3://{BUCKET_NAME}/{S3_KEY}")
