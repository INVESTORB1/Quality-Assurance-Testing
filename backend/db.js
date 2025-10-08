// Simple file-based user database
import fs from 'fs';
import { connect, getDb } from './mongo.js';
const DB_FILE = './users.json';

async function useMongo() {
  try {
    const db = await connect();
    return db ? db.collection('users') : null;
  } catch (err) {
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
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}
