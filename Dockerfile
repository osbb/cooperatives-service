FROM node:6

EXPOSE 10101

WORKDIR /app

COPY . /app/

RUN npm install --production

CMD node module.js
