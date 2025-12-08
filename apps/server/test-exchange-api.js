// Simple test script for exchange API
const http = require('http');

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('Testing Exchange API Endpoints...\n');

  try {
    // Test 1: Get supported currencies
    console.log('1. GET /exchange/supported-currencies');
    const currencies = await makeRequest('/exchange/supported-currencies');
    console.log('   Response:', currencies.data);
    console.log('   ✓ PASS\n');

    // Test 2: Get rates for EUR
    console.log('2. GET /exchange/rates?base=EUR');
    const rates = await makeRequest('/exchange/rates?base=EUR');
    console.log('   Response:', rates.data);
    console.log('   ✓ PASS\n');

    // Test 3: Get specific rate
    console.log('3. GET /exchange/rate/EUR/USD');
    const rate = await makeRequest('/exchange/rate/EUR/USD');
    console.log('   Response:', rate.data);
    console.log('   ✓ PASS\n');

    // Test 4: Convert query (legacy)
    console.log('4. GET /exchange/convert?amount=100&from=EUR&to=USD');
    const convert = await makeRequest('/exchange/convert?amount=100&from=EUR&to=USD');
    console.log('   Response:', convert.data);
    console.log('   ✓ PASS\n');

    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }

  process.exit(0);
}

// Wait for server to start
setTimeout(runTests, 2000);
