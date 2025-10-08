const https = require('https');
const http = require('http');
const { URL } = require('url');

function check(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const lib = u.protocol === 'https:' ? https : http;
      const req = lib.request(u, { method: 'GET', timeout: 10000 }, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({ url, statusCode: res.statusCode, body: body.slice(0, 2000) });
        });
      });
      req.on('error', (err) => resolve({ url, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ url, error: 'timeout' }); });
      req.end();
    } catch (err) {
      resolve({ url, error: err.message });
    }
  });
}

(async () => {
  const urls = [
    'https://quality-assurance-testing.onrender.com/',
    'https://quality-assurance-testing.onrender.com/messages',
    'https://quality-assurance-testing.onrender.com/admin/users'
  ];
  for (const u of urls) {
    const r = await check(u);
    if (r.error) {
      console.log(`${u} -> ERROR: ${r.error}`);
    } else {
      console.log(`${u} -> ${r.statusCode}`);
      if (r.body) console.log('BODY:', r.body);
    }
    console.log('---');
  }
})();
