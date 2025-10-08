#!/usr/bin/env node
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'qa_app';

if (!uri) {
  console.error('MONGODB_URI not set in environment or .env — cannot inspect remote MongoDB.');
  process.exit(1);
}

async function run() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: Number(process.env.MONGO_SELECTION_TIMEOUT_MS) || 5000,
    connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 5000,
  });

  try {
    await client.connect();
    // quick ping
    await client.db('admin').command({ ping: 1 });
    console.log(`MongoDB connected — host (redacted): ${uri.replace(/^(mongodb(?:\+srv)?:\/\/)/, '').split('@').pop().split('/')[0]} db=${dbName}`);

    const db = client.db(dbName);
    const col = db.collection('users');
    const count = await col.countDocuments();
    console.log(`users collection count: ${count}`);

    const docs = await col.find().sort({ _id: -1 }).limit(200).toArray();
    if (!docs.length) {
      console.log('No documents found in users collection.');
    } else {
      console.log('Sample users (most recent first):');
      // print selected fields but include full doc as JSON for exact inspection
      docs.forEach(d => {
        console.log('---');
        console.log(JSON.stringify(d, null, 2));
      });
    }
  } catch (err) {
    console.error('Error connecting to MongoDB or reading collection:', err && err.message ? err.message : err);
    process.exitCode = 2;
  } finally {
    try { await client.close(); } catch (e) { /* ignore */ }
  }
}

run();
