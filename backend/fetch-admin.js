import http from 'http';

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/admin/users',
  method: 'GET',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  let data = '';
  res.setEncoding('utf8');
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch (err) {
      console.error('Non-JSON response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});
req.on('timeout', () => {
  console.error('Request timed out');
  req.destroy();
});
req.end();
