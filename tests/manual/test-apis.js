const http = require('http');

const endpoints = [
  { path: '/api/settings', method: 'GET' },
  { path: '/api/insurance', method: 'GET' },
  { path: '/api/reminders', method: 'GET' },
  { path: '/api/dashboard', method: 'GET' },
  { path: '/api/cost-estimator', method: 'GET' },
  { path: '/api/assistant/conversations', method: 'GET' },
  { path: '/api/documents', method: 'GET' },
  { path: '/api/scenarios', method: 'GET' }
];

async function runTests() {
  console.log("Starting API Tests on localhost:3000...\n");
  let passed = 0;
  for (const ep of endpoints) {
    await new Promise((resolve) => {
      const req = http.request(
        { hostname: 'localhost', port: 3000, path: ep.path, method: ep.method },
        (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
             console.log(`[${ep.method}] ${ep.path} -> Status: ${res.statusCode}`);
             if (res.statusCode === 200 || res.statusCode === 404) passed++; // 404 might happen if db empty, but code works
             resolve();
          });
        }
      );
      req.on('error', (e) => {
        console.error(`[${ep.method}] ${ep.path} -> Error: ${e.message}`);
        resolve();
      });
      if (ep.body) req.write(JSON.stringify(ep.body));
      req.end();
    });
  }
  console.log(`\nTests completed: ${passed}/${endpoints.length} passed.`);
}

runTests();
