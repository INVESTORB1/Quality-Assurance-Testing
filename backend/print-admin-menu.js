import dotenv from 'dotenv';
import { connect, close } from './mongo.js';

dotenv.config();

async function run() {
  try {
    const db = await connect();
    if (!db) {
      console.log('MongoDB not configured; nothing to print.');
      return;
    }
    const items = await db.collection('admin_menu').find().toArray();
    console.log('Admin menu items:');
    console.log(JSON.stringify(items, null, 2));
  } catch (err) {
    console.error('Failed to read admin menu:', err.message);
  } finally {
    await close();
  }
}

run();
