# ---- Base Node ----
FROM node:14.19.1-alpine AS base
# set working directory
WORKDIR /app

COPY package.json .
COPY . .

RUN npm install
RUN npm run install-assets

# Can be mutli stage build
RUN npm ci --only=production
CMD [ "node", "server-external.js" ]