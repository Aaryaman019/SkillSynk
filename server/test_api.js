const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ name: "test", description: "test" });
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', (e) => resolve({ error: e.message }));
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log("Testing /projects/suggest-tech-stack...");
  const res1 = await testEndpoint('/projects/suggest-tech-stack');
  console.log(res1);

  console.log("\nTesting /api/projects/suggest-tech-stack...");
  const res2 = await testEndpoint('/api/projects/suggest-tech-stack');
  console.log(res2);
}

main();
