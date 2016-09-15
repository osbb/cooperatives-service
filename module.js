import amqp from 'amqplib';
import { MongoClient, ObjectId } from 'mongodb';
import winston from 'winston';

const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const connection = MongoClient.connect(mongoUrl); // connection promise
const cooperativesCollectionPromise = connection.then(db => db.collection('cooperatives'));

function loadCooperatives() {
  return cooperativesCollectionPromise
    .then(c => c.find({}).toArray());
}

function updateCooperative(cooperative) {
  const { title, answer } = cooperative;

  return cooperativesCollectionPromise
    .then(c => c.updateOne({ _id: ObjectId(cooperative._id) }, { $set: { title, answer } }))
    .then(() => cooperativesCollectionPromise
      .then(c => c.findOne({ _id: ObjectId(cooperative._id) }, {}))
    );
}

function createCooperative(cooperative) {
  const { title, answer } = cooperative;

  return cooperativesCollectionPromise
    .then(c => c.insertOne({ title, answer }, {}))
    .then(res => cooperativesCollectionPromise
      .then(c => c.findOne({ _id: ObjectId(res.insertedId) }, {}))
    );
}

const connectToRabbitMQ = new Promise(resolve => {
  function openConnection() {
    winston.info('Connecting to RabbitMQ...');
    amqp.connect(rabbitmqUrl)
      .then(conn => {
        winston.info('Connected!');
        resolve(conn);
      })
      .catch(() => {
        winston.info('Connection failure. Retry in 5 sec.');
        setTimeout(() => {
          openConnection();
        }, 5000);
      });
  }
  openConnection();
});

connectToRabbitMQ
  .then(conn => conn.createChannel())
  .then(ch => {
    ch.assertExchange('events', 'topic', { durable: true });
    ch.assertQueue('cooperatives-service', { durable: true })
      .then(q => {
        ch.prefetch(1);
        ch.bindQueue(q.queue, 'events', 'cooperatives.*');

        ch.consume(q.queue, msg => {
          let data;

          try {
            data = JSON.parse(msg.content.toString());
          } catch (err) {
            winston.error(err, msg.content.toString());
            return;
          }

          switch (msg.fields.routingKey) {
            case 'cooperatives.load':
              loadCooperatives(ch, data)
                .then(cooperatives => {
                  ch.sendToQueue(
                    msg.properties.replyTo,
                    new Buffer(JSON.stringify(cooperatives)),
                    { correlationId: msg.properties.correlationId }
                  );
                  ch.ack(msg);
                });
              break;
            case 'cooperatives.update':
              updateCooperative(data)
                .then(cooperative => {
                  ch.sendToQueue(
                    msg.properties.replyTo,
                    new Buffer(JSON.stringify(cooperative)),
                    { correlationId: msg.properties.correlationId }
                  );
                  ch.ack(msg);
                });
              break;
            case 'cooperatives.create':
              createCooperative(data)
                .then(cooperative => {
                  ch.sendToQueue(
                    msg.properties.replyTo,
                    new Buffer(JSON.stringify(cooperative)),
                    { correlationId: msg.properties.correlationId }
                  );
                  ch.ack(msg);
                });
              break;
            default:
              ch.nack(msg);
              return;
          }
        }, { noAck: false });
      });
  });
