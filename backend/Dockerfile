FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend source code
COPY . .

# Expose the port your backend is running on
EXPOSE 2000

# Set PYTHONPATH to current working directory
ENV PYTHONPATH=/app

# Command to run the application
CMD ["python", "app.py"]
