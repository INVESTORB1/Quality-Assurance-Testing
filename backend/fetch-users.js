import http from 'http';

function postLogin(password) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ password });
    const opts = {
      hostname: 'localhost',
      port: 4000,
      path: '/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        // DEBUG: show status and raw response
        console.error('[fetch-users] /admin/login status=', res.statusCode, 'raw=', raw);
        try {
          const data = JSON.parse(raw || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300 && data.token) return resolve(data.token);
          return reject(new Error(data.error || `Login failed with status ${res.statusCode}`));
        } catch (err) {
          return reject(new Error('Failed to parse /admin/login response: ' + err.message + ' raw=' + raw));
        }
      });
    });
    req.on('error', err => reject(err));
    req.write(body);
    req.end();
  });
}

function getUsers(token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 4000,
      path: '/admin/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    const req = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        // DEBUG: show status and raw response
        console.error('[fetch-users] /admin/users status=', res.statusCode, 'raw=', raw);
        if (res.statusCode === 401) return reject(new Error('Unauthorized - invalid token'));
        try {
          const data = JSON.parse(raw || '[]');
          return resolve(data);
        } catch (err) {
          return reject(new Error('Failed to parse /admin/users response: ' + err.message + ' raw=' + raw));
        }
      });
    });
    req.on('error', err => reject(err));
    req.end();
  });
}

async function run() {
  const password = process.env.ADMIN_PASSWORD || process.argv[2];
  if (!password) {
    console.error('Provide admin password via ADMIN_PASSWORD env var or as first CLI arg');
    process.exit(1);
  }
  try {
    const token = await postLogin(password);
    // console.log('Received token:', token);
    const users = await getUsers(token);
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
