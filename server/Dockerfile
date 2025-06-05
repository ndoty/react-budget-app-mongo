# react-budget-app-mongo-main/server/Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

# Step 1: Copy package files
COPY package*.json ./

# Step 2: Clean install dependencies with verbose output
RUN echo "---- Running 'npm install --verbose' in server Dockerfile ----" && \
    npm install --verbose && \
    echo "---- 'npm install --verbose' complete ----"

# If you want to use npm ci (recommended if package-lock.json is reliable):
# First, ensure package-lock.json is copied along with package.json
# COPY package-lock.json ./ 
# RUN echo "---- Running 'npm ci --verbose' in server Dockerfile ----" && \
#     npm ci --verbose && \
#     echo "---- 'npm ci --verbose' complete ----"


# Step 3: Copy the rest of your application code
COPY . .

CMD ["node", "index.js"]

