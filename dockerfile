FROM node:18-buster
WORKDIR /app

ENV NODE_ENV production
ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    udev \
    ttf-freefont \
    chromium 

COPY . .

COPY package*.json ./ 
RUN npm ci --only=production

EXPOSE 3000
# RUN node node_modules/puppeteer/install.js
CMD ["npm", "run", "start:prod"]