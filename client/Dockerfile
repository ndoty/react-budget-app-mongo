# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package.json. npm will generate a lockfile during install.
COPY package.json ./

# We removed 'COPY package-lock.json ./' because it's no longer needed.

# Using 'npm install' which is resilient to missing lockfiles.
RUN npm install

# Copy the rest of the application source code.
COPY . .

# Build arguments for environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL
ARG REACT_APP_VERSION

# Set environment variables for the build process
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_VERSION=$REACT_APP_VERSION

# Build the application.
RUN npm run build

# Stage 2: Serve the application from a lightweight Nginx server
FROM nginx:stable-alpine
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]