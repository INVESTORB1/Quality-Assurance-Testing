#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const EXPECTED = 'bob-academy-homepage.html';

function findHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // skip node_modules and backend
      if (e.name === 'node_modules' || e.name === 'backend') continue;
      files = files.concat(findHtmlFiles(full));
    } else if (e.isFile() && full.toLowerCase().endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function getVisibleText(el) {
  // return trimmed visible text for anchors
  return (el.textContent || '').trim();
}

function checkFiles(files) {
  const failures = [];
  for (const f of files) {
    const raw = fs.readFileSync(f, 'utf8');
    const dom = new JSDOM(raw);
    const document = dom.window.document;
    const anchors = Array.from(document.querySelectorAll('a'));
    for (const a of anchors) {
      const text = getVisibleText(a);
      if (text === 'Home') {
        const href = a.getAttribute('href') || '';
        if (href !== EXPECTED) {
          failures.push({ file: f, text, href });
        }
      }
    }
  }
  return failures;
}

function main() {
  // ensure jsdom is available
  try {
    require.resolve('jsdom');
  } catch (err) {
    console.error('Dependency missing: please run `npm install jsdom` in the project root.');
    process.exit(2);
  }

  const files = findHtmlFiles(ROOT);
  const failures = checkFiles(files);
  if (failures.length === 0) {
    console.log(`OK — all Home links point to ${EXPECTED} (${files.length} html files checked)`);
    process.exit(0);
  }

  console.error(`Found ${failures.length} Home link(s) with incorrect href:`);
  for (const f of failures) {
    console.error(` - ${path.relative(ROOT, f.file)} -> href="${f.href}"`);
  }
  process.exit(1);
}

if (require.main === module) main();
