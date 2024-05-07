FROM node:18-buster
WORKDIR /app

ENV NODE_ENV production
RUN sudo apt update -y \
    sudo apt install -y libnss3


COPY . .

RUN npm ci --only=production

EXPOSE 3000
RUN node node_modules/puppeteer/install.mjs
CMD ["npm", "run", "start:prod"]