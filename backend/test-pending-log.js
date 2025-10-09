#!/usr/bin/env node
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { connect } from './mongo.js';

const BASE = process.env.BASE_URL || 'http://localhost:4000';

function readInteractions() {
  const file = path.resolve('./interactions.json');
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('failed to read interactions.json', e.message);
    return [];
  }
}

async function signup(email) {
  const res = await fetch(BASE + '/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Pending', email, password: 'pass1234' })
  });
  return res.json().catch(() => ({}));
}

async function adminLogin() {
  const res = await fetch(BASE + '/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD || 'admin123' })
  });
  return res.json().catch(() => ({}));
}

async function approve(id, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-admin-token'] = token;
  const res = await fetch(BASE + '/admin/approve', {
    method: 'POST',
    headers,
    body: JSON.stringify({ id })
  });
  return res.json().catch(() => ({}));
}

function findSignupInteraction(entries, email) {
  return entries.find(e => e.type === 'signup' && (e.email === email || e.name === 'Test Pending')) || null;
}

async function checkMongoForPending(email) {
  try {
    const db = await connect();
    if (!db) return { available: false };
    const doc = await db.collection('pending_approvals').findOne({ 'user.email': email });
    return { available: true, doc };
  } catch (err) {
    return { available: false, error: err.message };
  }
}

(async function main(){
  const unique = Date.now();
  const email = `test.pending.${unique}@example.com`;

  // admin login first to get token
  const admin = await adminLogin();
  console.log('Admin login response:', admin);
  const token = admin.token || admin.accessToken || null;
  if (!token) {
    console.error('Admin login failed, cannot continue');
    process.exit(2);
  }

  console.log('Signing up with email:', email);
  const s = await signup(email);
  console.log('Signup response:', s);

  // wait briefly for DB writes
  await new Promise(r => setTimeout(r, 500));

  // Fetch users via admin endpoint to find created user
  const usersRes = await fetch(BASE + '/admin/users', { headers: { 'x-admin-token': token } });
  const users = await usersRes.json().catch(() => []);
  const user = users.find(u => u.email === email);
  const id = user ? user.id : null;
  console.log('Created user id (from /admin/users):', id);

  // Check admin interactions endpoint
  const interactionsRes = await fetch(BASE + '/admin/interactions', { headers: { 'x-admin-token': token } });
  const interactions = await interactionsRes.json().catch(() => []);
  const signupEntry = interactions.find(i => i.type === 'signup' && (i.email === email || i.name === 'Test Pending'));
  console.log('Admin interactions signup entry found?', !!signupEntry, signupEntry || null);

  // Check Mongo pending_approvals (optional)
  const mongoCheck = await checkMongoForPending(email);
  console.log('Mongo pending_approvals check:', mongoCheck.available ? 'available' : 'not available', mongoCheck.doc || mongoCheck.error || '');

  if (!id) {
    console.error('Could not find created user to approve');
    process.exit(2);
  }

  const ap = await approve(id, token);
  console.log('Approve response:', ap);

  await new Promise(r => setTimeout(r, 400));

  const interactions2Res = await fetch(BASE + '/admin/interactions', { headers: { 'x-admin-token': token } });
  const interactions2 = await interactions2Res.json().catch(() => []);
  const approvedEntry = interactions2.find(e => e.type === 'approve' && e.userId === id);
  console.log('Approve interaction recorded?', !!approvedEntry, approvedEntry || null);

  // check Mongo approved state
  try {
    const db = await connect();
    if (db) {
      const doc = await db.collection('pending_approvals').findOne({ 'user.id': id });
      console.log('Mongo pending_approvals doc after approval:', doc);
    } else {
      console.log('Mongo not configured, skipped Mongo approval check');
    }
  } catch (err) {
    console.log('Mongo check error:', err.message);
  }

  console.log('Test finished');
})();
