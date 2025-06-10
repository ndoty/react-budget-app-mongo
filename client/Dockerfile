# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

# RUN npm cache clean --force && npm install --legacy-peer-deps
# NOTE: The cache clean command is often only needed once to fix a specific error.
# If builds are working, you can use the standard install command.
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# Stage 2: Serve the application from a lightweight Nginx server
FROM nginx:stable-alpine

# Copy the static build files from the 'builder' stage
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# MODIFIED: Copy our custom Nginx configuration file into the container
# This will overwrite the default Nginx config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# MODIFIED: Expose port 3000 to match our custom configuration
EXPOSE 3000

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
