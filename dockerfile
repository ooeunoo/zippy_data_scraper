FROM node:18-buster
WORKDIR /app
COPY package*.json ./ 
RUN npm ci --only=production

ENV NODE_ENV production

COPY . .

RUN apt-get update && apt-get install -y \
    wget \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update && apt-get install -y \
    google-chrome-stable \
    --no-install-recommends \
    && apt-get purge --auto-remove -y wget \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get install libgbm1 \
    && apt-get install libasound2


EXPOSE 3000
RUN node node_modules/puppeteer/install.js
CMD ["npm", "run", "start:prod"]