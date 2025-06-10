# Stage 1: Build the React application
# Using a specific version of Node.js like 18-alpine is recommended for consistency.
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker's layer caching
COPY package.json ./
COPY package-lock.json ./

# Clean npm cache to help resolve "idealTree" errors, then run install.
# The --legacy-peer-deps flag is kept as you were using it before.
RUN npm cache clean --force && npm install --legacy-peer-deps

# Copy the rest of your client application source code
COPY . .

# Create the production build. This command also sets NODE_ENV=production.
RUN npm run build

# Stage 2: Serve the application from a lightweight Nginx server
FROM nginx:stable-alpine

# Copy the static build files from the 'builder' stage to the Nginx public directory
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# If you have a custom nginx.conf file for handling client-side routing,
# you would uncomment the following line.
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
