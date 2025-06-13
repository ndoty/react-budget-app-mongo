# --- Upstream server definitions ---
upstream backend_api {
  # The backend service name and port as defined in docker-compose.yml
  server backend:5000;
}

upstream backend_ws {
  # The backend service for WebSocket connections
  server backend:5000;
}

server {
  # Nginx will listen on port 3000 inside the container
  listen 3000;

  # --- API Reverse Proxy ---
  location /api/ {
    # This block handles the OPTIONS preflight requests sent by browsers.
    if ($request_method = 'OPTIONS') {
       # Use 'always' to ensure headers are added, even for some error responses.
       add_header 'Access-Control-Allow-Origin' 'https://budget.technickservices.com' always;
       add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
       add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With' always;
       add_header 'Access-Control-Allow-Credentials' 'true' always;
       add_header 'Access-Control-Max-Age' 86400 always;
       # Return a 204 No Content for successful preflight checks, which is the standard.
       return 204;
    }

    # For actual API requests (GET, POST, etc.), these headers ensure that even
    # if the backend also adds them, the browser gets a valid response.
    add_header 'Access-Control-Allow-Origin' 'https://budget.technickservices.com' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;

    # Pass the request to the upstream backend service.
    proxy_pass http://backend_api;
    proxy_redirect off;

    # Pass essential headers to the backend application.
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # --- WebSocket Reverse Proxy ---
  location /ws {
    proxy_pass http://backend_ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }

  # --- Static File Serving ---
  location / {
    root /usr/share/nginx/html;
    try_files $uri /index.html;
  }
}
