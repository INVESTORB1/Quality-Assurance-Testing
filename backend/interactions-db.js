import fs from 'fs';
import { connect } from './mongo.js';
const FILE = './interactions.json';

async function getCol() {
  try {
    const db = await connect();
    return db ? db.collection('interactions') : null;
  } catch (err) {
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
  fs.writeFileSync(FILE, JSON.stringify(interactions, null, 2));
}
