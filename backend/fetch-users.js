import http from 'http';

function run() {
  http.get('http://localhost:4000/admin/users', res => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(raw);
        console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        console.error('Failed to parse response:', err.message);
        process.exit(1);
      }
    });
  }).on('error', err => {
    console.error('Request failed:', err.message);
    process.exit(1);
  });
}

run();
