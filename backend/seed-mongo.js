import fs from 'fs';
import dotenv from 'dotenv';
import { connect, close } from './mongo.js';
import { writeUsers } from './db.js';

dotenv.config();

const USERS_FILE = './users.json';

async function run() {
  if (!fs.existsSync(USERS_FILE)) {
    console.error('No users.json file found to seed.');
    return;
  }
  const raw = fs.readFileSync(USERS_FILE, 'utf8');
  const users = JSON.parse(raw);
  if (!Array.isArray(users) || users.length === 0) {
    console.error('users.json is empty or invalid.');
    return;
  }
  try {
    await connect();
    await writeUsers(users);
    console.log(`Seeded ${users.length} users into MongoDB.`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await close();
  }
}

run();
