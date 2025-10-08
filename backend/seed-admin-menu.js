import fs from 'fs';
import dotenv from 'dotenv';
import { connect, close } from './mongo.js';

dotenv.config();

const FILE = './admin-menu.json';

async function run() {
  if (!fs.existsSync(FILE)) {
    console.error('No admin-menu.json found to seed.');
    return;
  }
  const items = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (!Array.isArray(items) || items.length === 0) {
    console.error('admin-menu.json is empty or invalid.');
    return;
  }
  try {
    const db = await connect();
    if (!db) {
      console.error('MongoDB not configured; cannot seed.');
      return;
    }
    const col = db.collection('admin_menu');
    await col.deleteMany({});
    await col.insertMany(items.map(i => ({ ...i })));
    console.log(`Seeded ${items.length} admin menu items.`);
  } catch (err) {
    console.error('Seeding admin menu failed:', err.message);
  } finally {
    await close();
  }
}

run();
