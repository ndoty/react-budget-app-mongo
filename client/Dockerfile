# react-budget-app-mongo-main/client/Dockerfile

# --- Development Stage ---
FROM node:18-alpine AS development

ENV NODE_ENV development

WORKDIR /usr/src/app

# Copy package.json AND package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN echo "[Client Dockerfile - Dev Stage] Running npm install..." && \
    npm install --legacy-peer-deps && \
    echo "[Client Dockerfile - Dev Stage] npm install complete."

# DO NOT COPY a .env file here if variables are set by docker-compose env_file
# COPY .env /usr/src/app/.env # REMOVE THIS LINE

# Copy the rest of the application code
COPY . .

# PORT is set by docker-compose's 'environment' block using ${CLIENT_PORT} from root .env
CMD ["npm", "start"]
