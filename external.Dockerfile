FROM node:14.19.1-alpine

WORKDIR /app

RUN apk update && apk -y add cmake

COPY package*.json ./

RUN npm ci
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

RUN npm run install-assets

CMD [ "node", "server-external.js" ]