import { getRabbitConnection } from './rabbit-connection';
import { getMongoConnection } from './mongo-connection';
import winston from 'winston';
import * as Cooperatives from './db';

function sendResponseToMsg(ch, msg, data) {
  return ch.sendToQueue(
    msg.properties.replyTo,
    new Buffer(JSON.stringify(data)),
    { correlationId: msg.properties.correlationId }
  );
}

Promise
// wait for connection to RabbitMQ and MongoDB
  .all([getRabbitConnection(), getMongoConnection()])
  // create channel rabbit
  .then(([conn, db]) => Promise.all([conn.createChannel(), db]))
  .then(([ch, db]) => {
    // create topic
    ch.assertExchange('events', 'topic', { durable: true });
    // create queue
    ch.assertQueue('cooperatives-service', { durable: true })
      .then(q => {
        // fetch by one message from queue
        ch.prefetch(1);
        // bind queue to topic
        ch.bindQueue(q.queue, 'events', 'cooperatives.*');
        // listen to new messages
        ch.consume(q.queue, msg => {
          let data;

          try {
            // messages always should be JSONs
            data = JSON.parse(msg.content.toString());
          } catch (err) {
            // log error and exit
            winston.error(err, msg.content.toString());
            return;
          }

          // map a routing key with actual logic
          switch (msg.fields.routingKey) {
            case 'cooperatives.load':
              // logic call
              Cooperatives.load(db)
              // send response to queue
                .then(cooperatives => sendResponseToMsg(ch, msg, cooperatives))
                // notify queue message was processed
                .then(() => ch.ack(msg));
              break;
            case 'cooperatives.update':
              // logic call
              Cooperatives.update(db, data)
              // send response to queue
                .then(cooperative => sendResponseToMsg(ch, msg, cooperative))
                // notify queue message was processed
                .then(() => ch.ack(msg));
              break;
            case 'cooperatives.create':
              // logic call
              Cooperatives.create(db, data)
              // send response to queue
                .then(cooperative => sendResponseToMsg(ch, msg, cooperative))
                // notify queue message was processed
                .then(() => ch.ack(msg));
              break;
            case 'cooperatives.delete':
              // logic call
              Cooperatives.remove(db, data)
              // send response to queue
                .then(cooperative => sendResponseToMsg(ch, msg, cooperative))
                // notify queue message was processed
                .then(() => ch.ack(msg));
              break;
            default:
              // if we can't process this message, we should send it back to queue
              ch.nack(msg);
              return;
          }
        });
      });
  });
