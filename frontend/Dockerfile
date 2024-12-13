# Save this as frontend/Dockerfile
FROM node:20.10.0-slim

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install -g npm@10.9.2 --include=dev

# Copy the rest of the frontend source code
COPY . .

# Expose the port your frontend is running on
EXPOSE 2001

# Command to start the webpack dev server
CMD ["npm", "start"]
