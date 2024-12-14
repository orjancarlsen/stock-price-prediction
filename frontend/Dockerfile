FROM node:20.10.0-slim

# Set the working directory
WORKDIR /app

# Arguments defined in .env file
ARG NPM_AUTH_TOKEN
ARG REACT_APP_API_URL
RUN echo "NPM_AUTH_TOKEN: $NPM_AUTH_TOKEN"
RUN echo "REACT_APP_API_URL: $REACT_APP_API_URL"

# Copy the package.json
COPY package.json ./

# NPM_AUTH_TOKEN needed in .npmrc file
COPY .npmrc ./

# Install dependencies
RUN npm install -g npm@10.9.2
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Expose the port your frontend is running on
EXPOSE 2001

# Command to start the webpack dev server
CMD ["npm", "start"]
