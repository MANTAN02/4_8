#!/usr/bin/env node

// Simple server startup without clustering for Replit compatibility
// This ensures single process operation and proper port binding

import { spawn } from 'child_process';

// Set environment to disable clustering
process.env.NODE_ENV = 'development';
process.env.PORT = '5000';
process.env.DISABLE_CLUSTERING = 'true';

console.log('🚀 Starting Prebucks Server (Simple Mode)');
console.log('📍 Single process mode for Replit compatibility');
console.log('🌐 Server will run on: http://0.0.0.0:5000');

// Start the backend server with clustering disabled
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '5000',
    DISABLE_CLUSTERING: 'true'
  }
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`🔚 Server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});