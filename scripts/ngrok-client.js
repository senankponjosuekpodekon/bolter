#!/usr/bin/env node
/**
 * Ngrok tunnel for client access
 * Creates public URLs for both frontend (client) and backend API
 * 
 * Usage:
 *   npm run tunnel:client     # Tunnel client only (port 5173)
 *   npm run tunnel:api        # Tunnel API only (port 3000) 
 *   npm run tunnel:all        # Tunnel both client + API
 */

const ngrok = require('ngrok');

const command = process.argv[2] || 'api';
const authToken = process.env.NGROK_AUTH_TOKEN || process.env.NGROK_AUTHTOKEN;

async function tunnelClient() {
  const url = await ngrok.connect({
    proto: 'http',
    addr: '5173',
    region: process.env.NGROK_REGION || 'eu',
    authtoken: authToken,
    bind_tls: true,
  });
  console.log('\n🌐 Client Tunnel (Frontend)');
  console.log(`   Public URL: ${url}`);
  console.log(`   Local: http://localhost:5173`);
  return url;
}

async function tunnelApi() {
  const url = await ngrok.connect({
    proto: 'http',
    addr: '3000',
    region: process.env.NGROK_REGION || 'eu',
    authtoken: authToken,
    bind_tls: true,
  });
  console.log('\n🔌 API Tunnel (Backend)');
  console.log(`   Public URL: ${url}`);
  console.log(`   Local: http://localhost:3000`);
  console.log(`   Swagger: ${url}/api/docs`);
  return url;
}

async function tunnelAdmin() {
  const url = await ngrok.connect({
    proto: 'http',
    addr: '5174',
    region: process.env.NGROK_REGION || 'eu',
    authtoken: authToken,
    bind_tls: true,
  });
  console.log('\n🔧 Admin Tunnel');
  console.log(`   Public URL: ${url}`);
  console.log(`   Local: http://localhost:5174`);
  return url;
}

async function main() {
  try {
    console.log('🚀 Starting ngrok tunnels...\n');
    
    let clientUrl, apiUrl, adminUrl;

    switch (command) {
      case 'client':
        clientUrl = await tunnelClient();
        console.log('\n✅ Client tunnel ready!');
        console.log(`   Share this URL: ${clientUrl}`);
        break;
        
      case 'api':
        apiUrl = await tunnelApi();
        console.log('\n✅ API tunnel ready!');
        console.log(`   API Base URL: ${apiUrl}`);
        break;
        
      case 'admin':
        adminUrl = await tunnelAdmin();
        console.log('\n✅ Admin tunnel ready!');
        console.log(`   Share this URL: ${adminUrl}`);
        break;
        
      case 'all':
        [clientUrl, apiUrl, adminUrl] = await Promise.all([
          tunnelClient(),
          tunnelApi(),
          tunnelAdmin()
        ]);
        console.log('\n✅ All tunnels ready!');
        console.log('\n📋 Summary for client:');
        console.log(`   Frontend: ${clientUrl}`);
        console.log(`   API:      ${apiUrl}`);
        console.log(`   Admin:    ${adminUrl}`);
        break;
        
      default:
        console.log('Usage: node scripts/ngrok-client.js [client|api|admin|all]');
        process.exit(1);
    }

    console.log('\n⚠️  Press Ctrl+C to stop all tunnels');
    
  } catch (error) {
    console.error('\n❌ Failed to start tunnel:', error.message);
    if (!authToken) {
      console.log('\n💡 Tip: Set NGROK_AUTH_TOKEN environment variable');
      console.log('   Get your token at: https://dashboard.ngrok.com/get-started/your-authtoken');
    }
    process.exit(1);
  }
}

main();
