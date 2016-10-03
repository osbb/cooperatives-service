import { ObjectId } from 'mongodb';

export function load(db) {
  return db.collection('cooperatives').find({}).toArray();
}

export function update(db, cooperative) {
  return db.collection('cooperatives')
    .updateOne({ _id: ObjectId(cooperative._id) }, { $set: cooperative })
    .then(() => db.collection('cooperatives').findOne({ _id: ObjectId(cooperative._id) }, {}));
}

export function create(db, cooperative) {
  return db.collection('cooperatives')
    .insertOne(cooperative, {})
    .then(res => db.collection('cooperatives').findOne({ _id: ObjectId(res.insertedId) }, {}));
}
