FROM node:latest

EXPOSE 10101

WORKDIR /app

COPY . /app/

RUN npm install

CMD node module.js
