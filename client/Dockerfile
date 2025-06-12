# Stage 1: Build the React application
# MODIFIED: Using the standard node:18 image for maximum compatibility.
FROM node:18 AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and the lock file first. This leverages Docker's layer
# caching, so 'npm install' only runs when dependencies change.
COPY package.json ./
COPY package-lock.json ./

# Install all dependencies, including devDependencies needed for the build.
RUN npm install

# Copy the rest of the application source code into the container.
# The .dockerignore file will prevent the local node_modules directory
# from being copied and overwriting the container's installation.
COPY . .

# Build the React application. npm scripts automatically add node_modules/.bin
# to the path, so this should find react-scripts.
RUN npm run build

# Stage 2: Serve the application from a lightweight Nginx server
FROM nginx:stable-alpine

# Remove the default Nginx configuration file.
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx configuration.
COPY nginx.conf /etc/nginx/conf.d/

# Copy the build output from the builder stage to the Nginx html directory.
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# Expose port 3000 for the Nginx server.
EXPOSE 3000

# Start Nginx when the container launches.
CMD ["nginx", "-g", "daemon off;"]
