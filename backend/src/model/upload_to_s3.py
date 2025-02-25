import boto3
import os

from dotenv import load_dotenv
load_dotenv()

# Make sure the S3_BUCKET environment variable is set or replace it with your bucket name directly.
bucket_name = os.environ.get("S3_BUCKET", "stock-price-prediction-s3")
print(f"Uploading file to bucket '{bucket_name}'")
local_file_path = "src/model/models/2025-02-23_09-05-10.joblib"
s3_key = "models/2025-02-23_09-05-10.joblib"

# Create an S3 client
s3 = boto3.client('s3')

# Upload the file
s3.upload_file(local_file_path, bucket_name, s3_key)
print(f"File '{local_file_path}' uploaded to s3://{bucket_name}/{s3_key}")
