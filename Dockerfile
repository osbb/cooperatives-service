FROM node:6

WORKDIR /app

COPY . /app/

RUN npm install --production

CMD npm start
