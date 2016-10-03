import { MongoClient } from 'mongodb';

export function getMongoConnection() {
  const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
  return MongoClient.connect(mongoUrl);
}
