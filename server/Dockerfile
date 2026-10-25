# Node 20, small always-on image for Azure Container Apps / App Service
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY scripts ./scripts

EXPOSE 8080
CMD ["node", "src/index.js"]

