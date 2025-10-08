// Simple file-based messages database
import fs from 'fs';
import { connect } from './mongo.js';
const MSG_FILE = './messages.json';

async function getCol() {
  try {
    const db = await connect();
    return db ? db.collection('messages') : null;
  } catch (err) {
    return null;
  }
}

export async function readMessages() {
  const col = await getCol();
  if (col) {
    const docs = await col.find().toArray();
    return docs.map(d => {
      const { _id, ...rest } = d;
      return { id: rest.id ?? String(_id), ...rest };
    });
  }
  if (!fs.existsSync(MSG_FILE)) return [];
  return JSON.parse(fs.readFileSync(MSG_FILE, 'utf-8'));
}

export async function writeMessages(messages) {
  const col = await getCol();
  if (col) {
    await col.deleteMany({});
    if (messages.length) {
      const docs = messages.map(m => {
        const copy = { ...m };
        if (copy._id) delete copy._id;
        return copy;
      });
      await col.insertMany(docs);
    }
    return;
  }
  fs.writeFileSync(MSG_FILE, JSON.stringify(messages, null, 2));
}
