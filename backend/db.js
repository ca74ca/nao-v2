const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'; // Use your actual connection string for production
const dbName = process.env.MONGODB_DBNAME || 'test'; // Set your DB name or use 'test'

let client;
let db;

async function connect() {
  if (db) return db;
  client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  db = client.db(dbName);
  return db;
}

module.exports = {
  connect,
  get users() {
    if (!db) throw new Error('Database not connected. Call connect() first.');
    return db.collection('users');
  }
};