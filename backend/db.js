// Simple file-based user database
import fs from 'fs';
import { connect, getDb } from './mongo.js';
const DB_FILE = './users.json';

async function useMongo() {
  try {
    const db = await connect();
    if (db) {
      console.debug('[db] using MongoDB for users collection');
      return db.collection('users');
    }
    console.debug('[db] MongoDB not available, falling back to file users.json');
    return null;
  } catch (err) {
    console.debug('[db] error checking MongoDB availability:', err && err.message ? err.message : err);
    return null;
  }
}

export async function readUsers() {
  const col = await useMongo();
  if (col) {
    const docs = await col.find().toArray();
    // Map Mongo documents so the API returns an `id` string.
    // If a legacy numeric `id` field exists, keep it; otherwise use the Mongo _id.
    return docs.map(d => {
      const { _id, ...rest } = d;
      return { id: rest.id ?? String(_id), ...rest };
    });
  }
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

export async function writeUsers(users) {
  const col = await useMongo();
  if (col) {
    console.debug('[db] writeUsers: writing to MongoDB (replacing collection)');
    // replace collection contents
    await col.deleteMany({});
    if (users.length) {
      // remove any existing _id fields to avoid insert conflicts
      const docs = users.map(u => {
        const copy = { ...u };
        if (copy._id) delete copy._id;
        return copy;
      });
      await col.insertMany(docs);
    }
    return;
  }
  console.debug('[db] writeUsers: writing to file', DB_FILE);
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}
