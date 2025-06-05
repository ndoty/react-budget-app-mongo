FROM node:18-alpine AS development

ENV NODE_ENV development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY .env.development /usr/src/app/.env # This line was in your original; ensure .env.development has correct vars if used
# If you are using a single .env file mounted via docker-compose, this line might be redundant or copy an unintended file.
# For CRA, it typically looks for .env, .env.development, etc.

COPY . .

# EXPOSE 3000 # PORT is usually set by react-scripts or via environment variable in docker-compose

CMD ["npm", "start"]
