#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = '5000';

console.log('🚀 Starting Baartal Application...');
console.log(`📍 Environment: ${process.env.NODE_ENV}`);
console.log(`🌐 Server will run on: http://0.0.0.0:5000`);
console.log(`🎨 Frontend proxy via Vite on backend port 5000`);

// Start the backend server
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '5000'
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