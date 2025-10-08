

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';

import { readUsers, writeUsers } from './db.js';
import { readMessages, writeMessages } from './messages-db.js';
import { readInteractions, writeInteractions } from './interactions-db.js';
import { connect } from './mongo.js';
import fs from 'fs';

// Simple in-memory admin token store (dev-only). Tokens expire after 12 hours.
const adminTokens = new Map();
function genToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
function createAdminToken() {
  const token = genToken();
  const expires = Date.now() + 12 * 60 * 60 * 1000; // 12h
  adminTokens.set(token, expires);
  return token;
}
function isValidAdminToken(token) {
  if (!token) return false;
  const exp = adminTokens.get(token);
  if (!exp) return false;
  if (Date.now() > exp) {
    adminTokens.delete(token);
    return false;
  }
  return true;
}

// middleware to protect admin routes
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || req.headers['x-admin-token'];
  let token = null;
  if (auth && auth.startsWith('Bearer ')) token = auth.slice(7);
  if (!token && auth && !auth.startsWith('Bearer ')) token = auth;
  if (isValidAdminToken(token)) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(bodyParser.json());

// global error handlers to avoid silent exits and log useful info
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Health endpoint
app.get('/health', async (req, res) => {
  // quick DB check
  try {
    const db = await connect();
    if (db) {
      // ping
      await db.command({ ping: 1 });
      return res.json({ ok: true, db: 'connected' });
    }
    return res.json({ ok: true, db: 'not-configured' });
  } catch (err) {
    return res.status(500).json({ ok: false, db: 'error', error: err.message });
  }
});

// Contact form: receive and store messages
app.post('/messages', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const messages = await readMessages();
  const newMsg = {
    id: (messages.length + 1).toString().padStart(6, '0'),
    name,
    email,
    subject: subject || '',
    message,
    timestamp: new Date().toISOString()
  };
  messages.push(newMsg);
  await writeMessages(messages);
  // Log interaction
  const interactions = await readInteractions();
  interactions.push({
    type: 'contact',
    name,
    email,
    subject: subject || '',
    message,
    timestamp: newMsg.timestamp
  });
  await writeInteractions(interactions);
  res.json({ success: true });
});

// Admin: get all contact messages
app.get('/messages', async (req, res) => {
  const messages = await readMessages();
  res.json(messages);
});

// Admin login - returns a token when correct password provided
app.post('/admin/login', async (req, res) => {
  const { password } = req.body;
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  if (!password || password !== adminPass) return res.status(401).json({ error: 'Invalid password' });
  const token = createAdminToken();
  res.json({ token });
});

// Admin: reject (delete) user
app.post('/admin/reject', requireAdmin, async (req, res) => {
  const { id } = req.body;
  let users = await readUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  users = users.filter(u => u.id !== id);
  await writeUsers(users);
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
app.post('/signup', async (req, res) => {
  const { name, email, password, ...rest } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const users = await readUsers();
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
  await writeUsers(users);
  // Log interaction
  const interactions = await readInteractions();
  interactions.push({
    type: 'signup',
    name,
    email,
    timestamp: new Date().toISOString()
  });
  await writeInteractions(interactions);
  res.json({ success: true });
});

// Admin: list all users
app.get('/admin/users', requireAdmin, async (req, res) => {
  const users = await readUsers();
  res.json(users);
});

// Admin: approve user
app.post('/admin/approve', requireAdmin, async (req, res) => {
  const { id } = req.body;
  const users = await readUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.status = 'active';
  await writeUsers(users);
  res.json({ success: true });
});

// Admin: create user directly
app.post('/admin/create', requireAdmin, async (req, res) => {
  const { name, email, password, ...rest } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const users = await readUsers();
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
  await writeUsers(users);
  // Log interaction
  const interactions = await readInteractions();
  interactions.push({
    type: 'admin_create_user',
    name,
    email,
    timestamp: new Date().toISOString()
  });
  await writeInteractions(interactions);
  res.json({ success: true });
});

// Admin: deactivate (set user status to 'inactive')
app.post('/admin/deactivate', requireAdmin, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const users = await readUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.status = 'inactive';
  await writeUsers(users);
  res.json({ success: true });
});

// Admin: reset user password. If newPassword not provided, generate a temporary one and return it.
app.post('/admin/reset-password', requireAdmin, async (req, res) => {
  const { id, newPassword } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const users = await readUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  // generate temp password if not provided
  let temp = newPassword;
  if (!temp) {
    temp = Math.random().toString(36).slice(-8);
  }
  const hashed = bcrypt.hashSync(temp, 10);
  user.password = hashed;
  await writeUsers(users);
  // return the (plaintext) temp password so admin can communicate it to the user
  res.json({ success: true, tempPassword: newPassword ? undefined : temp });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = await readUsers();
  const user = users.find(u => u.email === email && u.status === 'active');
  if (!user) return res.status(401).json({ error: 'Invalid credentials or not approved' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  // Log interaction
  const interactions = await readInteractions();
  interactions.push({
    type: 'login',
    email,
    timestamp: new Date().toISOString()
  });
  await writeInteractions(interactions);
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});
// Admin: get all user interactions
app.get('/admin/interactions', requireAdmin, async (req, res) => {
  const interactions = await readInteractions();
  res.json(interactions);
});

// Admin: get admin menu (from Mongo or fallback file)
app.get('/admin/menu', requireAdmin, async (req, res) => {
  try {
    const db = await connect();
    if (db) {
      const items = await db.collection('admin_menu').find().sort({ order: 1 }).toArray();
      return res.json(items.map(i => ({ id: i.id ?? String(i._id), ...i })));
    }
  } catch (err) {
    // fall through to file-based
  }
  // fallback to file
  const file = './admin-menu.json';
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return res.json(data);
  }
  res.json([]);
});

// Admin debug endpoint (non-secret) — reports whether ADMIN_PASSWORD and MONGODB_URI are set
function redactHost(uri) {
  if (!uri) return null;
  try {
    const withoutProto = uri.replace(/^mongodb(?:\+srv)?:\/\//, '');
    const afterAuth = withoutProto.includes('@') ? withoutProto.split('@').pop() : withoutProto;
    const hostPart = afterAuth.split('/')[0];
    // hide any possible credentials (already removed) and only return host names
    return hostPart;
  } catch (err) {
    return null;
  }
}

app.get('/admin/env', (req, res) => {
  const adminPasswordSet = typeof process.env.ADMIN_PASSWORD !== 'undefined' && process.env.ADMIN_PASSWORD !== null && process.env.ADMIN_PASSWORD !== '';
  const usingDefaultPassword = !adminPasswordSet;
  const mongoConfigured = typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.trim() !== '';
  const mongoHost = redactHost(process.env.MONGODB_URI || '');
  res.json({ adminPasswordSet, usingDefaultPassword, mongoConfigured, mongoHost });
});

// Connect to Mongo (if configured) before starting server
async function start() {
  try {
    await connect();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to connect to MongoDB, starting with file-based DBs', err.message);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }
}

start();
