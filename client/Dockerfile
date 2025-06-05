# react-budget-app-mongo-main/client/Dockerfile

# --- Development Stage ---
FROM node:18-alpine AS development

# Set environment to development
ENV NODE_ENV development

WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
# Using --legacy-peer-deps as it was in your original file and might be needed for your specific dependency tree with React 17 + react-scripts 5
RUN npm install --legacy-peer-deps

# Copy the .env file specific to the client application.
# This .env file (e.g., client/.env or client/.env.development) should contain
# REACT_APP_API_URL and WDS_SOCKET_URL (if attempting to fix WebSockets).
# If you intend to use .env.development, ensure it exists in your ./client directory.
# Create React App will automatically pick up .env, .env.development, etc.
# This COPY command assumes you might have a specific .env.development you want to ensure is named .env in the image for this stage.
# If you are relying on docker-compose to set these via its 'environment' or 'env_file' that maps to client/.env, this specific COPY might be redundant or could be COPY .env ./.env
COPY .env /usr/src/app/.env
# If you use a single .env in your client directory for development, you might use:
# COPY .env /usr/src/app/.env

# Copy the rest of the application code
COPY . .

# The PORT environment variable (e.g., 3000) will be set by docker-compose for the frontend service.
# react-scripts start will automatically pick up this PORT.
# EXPOSE is for documentation; docker-compose 'ports' handles actual mapping.
# EXPOSE 3000

CMD ["npm", "start"]
