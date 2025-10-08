import { connect, close } from './mongo.js';
import dotenv from 'dotenv';
import { readUsers, writeUsers } from './db.js';
import { readMessages, writeMessages } from './messages-db.js';
import { readInteractions, writeInteractions } from './interactions-db.js';

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('No MONGODB_URI set. Create a .env with MONGODB_URI or set environment variable. See .env.example');
    return;
  }
  try {
    await connect();
    console.log('Connected to MongoDB. Inserting sample documents...');

    const users = await readUsers();
    users.push({ id: '000999', name: 'Test User', email: 'test@example.com', password: 'hashed', status: 'active' });
    await writeUsers(users);

    const msgs = await readMessages();
    msgs.push({ id: '000001', name: 'Contact', email: 'c@example.com', subject: 'Hi', message: 'Hello', timestamp: new Date().toISOString() });
    await writeMessages(msgs);

    const interactions = await readInteractions();
    interactions.push({ id: 'i0001', type: 'test', timestamp: new Date().toISOString() });
    await writeInteractions(interactions);

    console.log('Inserted. Reading back...');
    console.log('Users:', await readUsers());
    console.log('Messages:', await readMessages());
    console.log('Interactions:', await readInteractions());
  } catch (err) {
    console.error('Test failed:', err.message);
  } finally {
    await close();
  }
}

run();
