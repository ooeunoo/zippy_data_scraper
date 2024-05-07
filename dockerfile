FROM node:18-buster
WORKDIR /app
COPY package*.json ./ 
RUN npm ci --only=production

ENV NODE_ENV production

COPY . .

USER node

EXPOSE 3000
RUN npm install -g @nestjs/cli
RUN npm run build
CMD ["npm", "run", "start:prod"]