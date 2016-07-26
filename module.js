const seneca = require('seneca');
const mongo = require('mongodb').MongoClient;

const mongoHost = process.env.MONGO_PORT_27017_TCP_ADDR;
const mongoPort = process.env.MONGO_PORT_27017_TCP_PORT;
const mongoConnection = mongo.connect(`mongodb://${mongoHost}:${mongoPort}`);

seneca()
    .client({
        host: process.env.ACL_PORT_10101_TCP_ADDR,
        port: process.env.ACL_PORT_10101_TCP_PORT,
    })
    .use('./plugins/create', { mongoConnection })
    .listen();
