# Stage 1: Build the React application
# Use a specific version of Node.js like 18-alpine for consistency.
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker's layer caching
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of your client application source code
COPY . .

# Create the production build. This command creates a 'build' folder with static files.
RUN npm run build

# Stage 2: Serve the application from a lightweight Nginx server
FROM nginx:stable-alpine

# Copy the static build files from the 'builder' stage to the Nginx public directory
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# If you have a custom nginx.conf file for handling client-side routing (e.g., react-router),
# you would uncomment the following line to copy it into the container.
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80, the default port Nginx listens on
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
