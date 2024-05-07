FROM node:18-buster
WORKDIR /app

ENV NODE_ENV production

RUN apt update -y \
    && apt install -y libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0
COPY . .

RUN npm ci --only=production

EXPOSE 3000
RUN node node_modules/puppeteer/install.mjs
CMD ["npm", "run", "start:prod"]