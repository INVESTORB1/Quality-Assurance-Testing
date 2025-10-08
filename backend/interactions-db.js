import fs from 'fs';
import { connect } from './mongo.js';
const FILE = './interactions.json';

async function getCol() {
  try {
    const db = await connect();
    if (db) {
      console.debug('[interactions-db] using MongoDB for interactions collection');
      return db.collection('interactions');
    }
    console.debug('[interactions-db] MongoDB not available, falling back to file interactions.json');
    return null;
  } catch (err) {
    console.debug('[interactions-db] error checking MongoDB availability:', err && err.message ? err.message : err);
    return null;
  }
}

export async function readInteractions() {
  const col = await getCol();
  if (col) {
    const docs = await col.find().toArray();
    return docs.map(d => {
      const { _id, ...rest } = d;
      return { id: rest.id ?? String(_id), ...rest };
    });
  }
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

export async function writeInteractions(interactions) {
  const col = await getCol();
  if (col) {
    console.debug('[interactions-db] writeInteractions: writing to MongoDB (replace collection)');
    await col.deleteMany({});
    if (interactions.length) {
      const docs = interactions.map(i => {
        const copy = { ...i };
        if (copy._id) delete copy._id;
        return copy;
      });
      await col.insertMany(docs);
    }
    return;
  }
  console.debug('[interactions-db] writeInteractions: writing to file', FILE);
  fs.writeFileSync(FILE, JSON.stringify(interactions, null, 2));
}
