import chai from 'chai';
import { MongoClient, ObjectId } from 'mongodb';
import * as Cooperatives from '../cooperatives';

chai.should();

let db;

before(() => MongoClient.connect('mongodb://localhost:27017/testing')
  .then(conn => {
    db = conn;
  })
);

describe('Cooperatives Service', () => {
  const cooperatives = [
    { _id: new ObjectId() },
    { _id: new ObjectId() },
    { _id: new ObjectId() },
  ];

  before(() => db.collection('cooperatives').insert(cooperatives));

  after(() => db.collection('cooperatives').remove({}));

  it(
    'should load cooperatives from database',
    () => Cooperatives.load(db)
      .then(res => {
        res.should.have.length(3);
      })
  );

  it(
    'should update cooperative in database',
    () => Cooperatives.update(db, Object.assign({}, { _id: cooperatives[0]._id, title: 'test' }))
      .then(res => {
        res.should.have.property('title').equal('test');
      })
  );

  it(
    'should create cooperative in database',
    () => Cooperatives.create(db, Object.assign({}, { title: 'test' }))
      .then(res => {
        res.should.have.property('title').equal('test');
      })
  );
});
