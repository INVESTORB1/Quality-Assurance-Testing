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
    const users = await db.collection('users').find().toArray();
    console.log('Users in MongoDB:');
    console.log(users.map(u => ({ id: u.id ?? String(u._id), name: u.name, email: u.email, status: u.status })));
  } catch (err) {
    console.error('Failed to read users:', err.message);
  } finally {
    await close();
  }
}

run();
