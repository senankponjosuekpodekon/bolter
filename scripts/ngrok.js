#!/usr/bin/env node
const ngrok = require('ngrok');

const port = process.env.NGROK_PORT || process.env.PORT || '3000';
const proto = process.env.NGROK_PROTO || 'http';
const region = process.env.NGROK_REGION || 'eu';
const authToken = process.env.NGROK_AUTH_TOKEN || process.env.NGROK_AUTHTOKEN;

async function main() {
  try {
    const url = await ngrok.connect({
      proto,
      addr: port,
      region,
      authtoken: authToken,
      bind_tls: true,
    });

    console.log('ngrok tunnel started successfully.');
    console.log(`Public URL: ${url}`);
    console.log(`Forwarding to: ${proto}://localhost:${port}`);
    console.log('Press Ctrl+C to stop the tunnel.');
  } catch (error) {
    console.error('Failed to start ngrok tunnel:', error);
    process.exit(1);
  }
}

main();
