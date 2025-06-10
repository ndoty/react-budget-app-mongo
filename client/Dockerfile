# react-budget-app-mongo-main/client/Dockerfile

# --- Development Stage ---
FROM node:18-alpine AS development

ENV NODE_ENV development

# Install dependencies
# Using --legacy-peer-deps if you have peer dependency conflicts, otherwise remove it.
RUN npm install --legacy-peer-deps

CMD ["npm", "start"]
