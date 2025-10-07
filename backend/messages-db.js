// Simple file-based messages database
import fs from 'fs';
const MSG_FILE = './messages.json';

export function readMessages() {
  if (!fs.existsSync(MSG_FILE)) return [];
  return JSON.parse(fs.readFileSync(MSG_FILE, 'utf-8'));
}

export function writeMessages(messages) {
  fs.writeFileSync(MSG_FILE, JSON.stringify(messages, null, 2));
}
