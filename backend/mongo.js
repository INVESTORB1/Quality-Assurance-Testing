import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || '';
let client;
let db;

function getRedactedHost(u) {
  if (!u) return null;
  try {
    // remove protocol and credentials, keep host(s)
    // e.g. mongodb+srv://user:pass@cluster0.xyz.mongodb.net/db -> cluster0.xyz.mongodb.net
    const withoutProto = u.replace(/^mongodb(?:\+srv)?:\/\//, '');
    const afterAuth = withoutProto.includes('@') ? withoutProto.split('@').pop() : withoutProto;
    const hostPart = afterAuth.split('/')[0];
    return hostPart;
  } catch (err) {
    return 'unknown-host';
  }
}

export async function connect() {
  if (!uri) return null;
  if (client && db) return db;
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  await client.connect();
  // verify connection with a ping
  await client.db('admin').command({ ping: 1 });
  // use database name from env or default to 'qa_app'
  const dbName = process.env.MONGODB_DB || 'qa_app';
  db = client.db(dbName);
  try {
    const host = getRedactedHost(uri);
    console.log(`MongoDB connected to host=${host} db=${dbName}`);
  } catch (err) {
    // ignore logging errors
  }
  return db;
}

export function getDb() {
  if (!db) throw new Error('MongoDB not connected. Call connect() first.');
  return db;
}

export async function close() {
  if (client) await client.close();
  client = null;
  db = null;
}
