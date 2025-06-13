# Stage 1: Build the React application
# Using the standard node:18 image for maximum compatibility.
FROM node:18 AS builder

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

# Install all dependencies from the clean lockfile.
RUN npm ci

# Copy the rest of the application source code.
COPY . .

# Pass in environment variables during the build.
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ARG REACT_APP_WS_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ARG REACT_APP_VERSION
ENV REACT_APP_VERSION=$REACT_APP_VERSION

# Build the application.
RUN npm run build

# Stage 2: Serve the application from a lightweight Nginx server
FROM nginx:stable-alpine

# Copy our simplified Nginx configuration.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output from the builder stage.
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# Expose the port.
EXPOSE 3000

# Start Nginx.
CMD ["nginx", "-g", "daemon off;"]
