# react-budget-app-mongo-main/client/Dockerfile

# --- Development Stage ---
FROM node:18-alpine AS development # Naming the stage is still good practice

# Set environment to development - this is often set by react-scripts start anyway
ENV NODE_ENV development

WORKDIR /usr/src/app

# Copy package.json AND package-lock.json (or yarn.lock)
# This is done first to leverage Docker's build cache.
COPY package*.json ./

# Install dependencies
# Using --legacy-peer-deps as it was in your original file and might be needed for your specific dependency tree
RUN echo "[Client Dockerfile - Dev Stage] Running npm install..." && \
    npm install --legacy-peer-deps && \
    echo "[Client Dockerfile - Dev Stage] npm install complete."

# Copy the .env file that react-scripts will use.
# Create React App will look for '.env' by default.
# If you use '.env.development', ensure it exists in your ./client directory.
# This line assumes you have a general '.env' in your ./client directory for development variables
# like REACT_APP_API_URL and WDS_SOCKET_URL.
COPY .env /usr/src/app/.env
# If you prefer to use .env.development specifically, change the line above to:
# COPY .env.development /usr/src/app/.env

# Copy the rest of the application code
COPY . .

# The PORT environment variable (e.g., 3000) will be set by docker-compose.
# react-scripts start will automatically pick up this PORT.
# EXPOSE is for documentation; docker-compose 'ports' handles actual mapping.
# EXPOSE 3000 

# Default command for the development stage
CMD ["npm", "start"]
