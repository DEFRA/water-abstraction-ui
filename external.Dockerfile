FROM node:14.19.1-alpine

# Create app directory
WORKDIR /app

RUN apt-get update && apt-get -y install cmake
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm ci
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

RUN npm run install-assets

CMD [ "node", "server-external.js" ]