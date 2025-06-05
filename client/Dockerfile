# client/Dockerfile
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
# Use package*.json to copy both if both exist
COPY package*.json ./

# Install dependencies
# Using --legacy-peer-deps if you have peer dependency conflicts, otherwise remove it.
RUN npm install --legacy-peer-deps

# Copy the rest of the application code from the host's client directory to /usr/src/app in the container
COPY . .

# The PORT environment variable will be set by docker-compose's `environment` block.
# react-scripts start will automatically pick up this PORT.
CMD ["npm", "start"]
