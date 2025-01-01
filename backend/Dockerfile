FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Install system dependencies, including git
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend source code
COPY . .

# Expose the port your backend is running on
EXPOSE 2000

# Command to run the application
CMD ["python", "-m", "src.app"]
