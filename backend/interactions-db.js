import fs from 'fs';
const FILE = './interactions.json';

export function readInteractions() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

export function writeInteractions(interactions) {
  fs.writeFileSync(FILE, JSON.stringify(interactions, null, 2));
}
