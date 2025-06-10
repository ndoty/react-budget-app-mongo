# Specify a Node.js base image
# Using a version that matches or is compatible with your development environment (e.g., Node.js v22.x.x)
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
# Copying these first takes advantage of Docker's layer caching.
# If these files haven't changed, Docker can use a cached layer for npm install.
COPY package.json ./
COPY package-lock.json ./
# If you were using yarn, it would be:
# COPY yarn.lock ./

# Install dependencies
# This is the crucial step that seems to be missing or incorrect
RUN npm install
# If you were using yarn, it would be:
# RUN yarn install --frozen-lockfile

# Copy the rest of your server application code
COPY . .

# Your application's default port (ensure this matches your .env or default in index.js)
# This is informational; the actual port mapping is in docker-compose.yml
EXPOSE 5000

# The command to run your application
CMD [ "npm", "start" ]
