const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DBNAME || 'test';

let client;
let db;

async function connect() {
  if (db) return db;

  // Enable TLS for Atlas/remote connections only
  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net');
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ...(isAtlas ? { tls: true } : {})
  };

  client = await MongoClient.connect(uri, options);
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