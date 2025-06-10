# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Add a build argument for the version
ARG REACT_APP_VERSION=1.0.0
ENV REACT_APP_VERSION=$REACT_APP_VERSION

RUN npm run build

# Stage 2: Serve the application from a lightweight Nginx server
FROM nginx:stable-alpine

# MODIFIED: Add a label to the final image for verification
LABEL version="2.0.0"

COPY --from=builder /usr/src/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
