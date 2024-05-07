FROM node:18-buster
WORKDIR /app

ENV NODE_ENV production

RUN apt update -y \
    && apt install -y libnss \
    && apt install -y libnss3-dev libgdk-pixbuf2.0-dev libgtk-3-dev libxss-dev




COPY . .

RUN npm ci --only=production

EXPOSE 3000
RUN node node_modules/puppeteer/install.mjs
CMD ["npm", "run", "start:prod"]