# react-budget-app-mongo-main/server/Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) first
# to leverage Docker's build cache.
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of your server application code
COPY . .

# The PORT environment variable will be set by docker-compose.
# Your server/index.js should use process.env.PORT.
# EXPOSE is for documentation; docker-compose 'ports' handles the actual mapping.
# Example: EXPOSE 5000 (if your server typically runs on 5000 internally)

CMD [ "node", "index.js" ]
