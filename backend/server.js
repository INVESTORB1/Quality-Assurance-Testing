

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';

import { readUsers, writeUsers } from './db.js';
import { readMessages, writeMessages } from './messages-db.js';
import { readInteractions, writeInteractions } from './interactions-db.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// Contact form: receive and store messages
app.post('/messages', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const messages = readMessages();
  const newMsg = {
    id: (messages.length + 1).toString().padStart(6, '0'),
    name,
    email,
    subject: subject || '',
    message,
    timestamp: new Date().toISOString()
  };
  messages.push(newMsg);
  writeMessages(messages);
  // Log interaction
  const interactions = readInteractions();
  interactions.push({
    type: 'contact',
    name,
    email,
    subject: subject || '',
    message,
    timestamp: newMsg.timestamp
  });
  writeInteractions(interactions);
  res.json({ success: true });
});

// Admin: get all contact messages
app.get('/messages', (req, res) => {
  const messages = readMessages();
  res.json(messages);
});

// Admin: reject (delete) user
app.post('/admin/reject', (req, res) => {
  const { id } = req.body;
  let users = readUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  users = users.filter(u => u.id !== id);
  writeUsers(users);
  res.json({ success: true });
});

// Helper to get next 6-digit user ID (as string, leading zeros)
function getNextUserId(users) {
  // Only consider numeric IDs
  const numericIds = users
    .map(u => u.id)
    .filter(id => /^\d+$/.test(id))
    .map(id => Number(id));
  let next = 1;
  if (numericIds.length) {
    next = Math.max(...numericIds) + 1;
  }
  // Pad to 6 digits
  return next.toString().padStart(6, '0');
}

// Signup endpoint (pending approval)
app.post('/signup', (req, res) => {
  const { name, email, password, ...rest } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const users = readUsers();
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already exists' });
  const hashed = bcrypt.hashSync(password, 10);
  const id = getNextUserId(users);
  users.push({
    id,
    name,
    email,
    password: hashed,
    status: 'pending',
    ...rest
  });
  writeUsers(users);
  // Log interaction
  const interactions = readInteractions();
  interactions.push({
    type: 'signup',
    name,
    email,
    timestamp: new Date().toISOString()
  });
  writeInteractions(interactions);
  res.json({ success: true });
});

// Admin: list all users
app.get('/admin/users', (req, res) => {
  const users = readUsers();
  res.json(users);
});

// Admin: approve user
app.post('/admin/approve', (req, res) => {
  const { id } = req.body;
  const users = readUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.status = 'active';
  writeUsers(users);
  res.json({ success: true });
});

// Admin: create user directly
app.post('/admin/create', (req, res) => {
  const { name, email, password, ...rest } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const users = readUsers();
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already exists' });
  const hashed = bcrypt.hashSync(password, 10);
  const id = getNextUserId(users);
  users.push({
    id,
    name,
    email,
    password: hashed,
    status: 'active',
    ...rest
  });
  writeUsers(users);
  // Log interaction
  const interactions = readInteractions();
  interactions.push({
    type: 'admin_create_user',
    name,
    email,
    timestamp: new Date().toISOString()
  });
  writeInteractions(interactions);
  res.json({ success: true });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.email === email && u.status === 'active');
  if (!user) return res.status(401).json({ error: 'Invalid credentials or not approved' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  // Log interaction
  const interactions = readInteractions();
  interactions.push({
    type: 'login',
    email,
    timestamp: new Date().toISOString()
  });
  writeInteractions(interactions);
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});
// Admin: get all user interactions
app.get('/admin/interactions', (req, res) => {
  const interactions = readInteractions();
  res.json(interactions);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
