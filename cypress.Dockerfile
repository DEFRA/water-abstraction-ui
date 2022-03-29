FROM node:12.1.0

RUN apt-get update && \
  apt-get install --no-install-recommends -y \
  libgtk2.0-0 \
  libgtk-3-0 \
  libnotify-dev \
  libgconf-2-4 \
  libnss3 \
  libxss1 \
  libasound2 \
  libxtst6 \
  xauth \
  bash \
  xvfb && \
  rm -rf /var/lib/apt/lists/*

ENV CI=1

WORKDIR /e2e

COPY ["package.json", "package-lock.json*", "./"]

COPY . .

RUN npm i

RUN ls

RUN echo "whoami: $(whoami)"
RUN npm config -g set user $(whoami)

# versions of local tools
RUN echo  " node version:    $(node -v) \n" \
  "npm version:     $(npm -v) \n" \
  "yarn version:    $(yarn -v) \n" \
  "debian version:  $(cat /etc/debian_version) \n" \
  "user:            $(whoami) \n" \
  "cypress:            $(node_modules/.bin/cypress -v ) \n"

ENTRYPOINT [ "/bin/bash", "-l", "-c" ]