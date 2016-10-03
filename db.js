import { ObjectId } from 'mongodb';
import _ from 'lodash';

const COLLECTION = 'cooperatives';

export function load(db) {
  return db.collection(COLLECTION).find({}).toArray();
}

export function update(db, data) {
  return db.collection(COLLECTION)
    .updateOne({ _id: ObjectId(data._id) }, { $set: _.omit(data, '_id') })
    .then(() => db.collection(COLLECTION).findOne({ _id: ObjectId(data._id) }, {}));
}

export function create(db, data) {
  return db.collection(COLLECTION)
    .insertOne(_.omit(data, '_id'), {})
    .then(res => db.collection(COLLECTION).findOne({ _id: ObjectId(res.insertedId) }, {}));
}
