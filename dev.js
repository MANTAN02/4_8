#!/usr/bin/env node

// This script replaces the vite dev command to run our backend server instead
// which includes the Vite dev server as middleware

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment variables for development
process.env.NODE_ENV = 'development';
process.env.PORT = '5000';

console.log('🚀 Starting Baartal Development Server...');
console.log('📍 Environment: development');
console.log('🌐 Server will run on: http://0.0.0.0:5000');
console.log('🎨 Frontend via Vite middleware');

// Start the backend server with Vite middleware
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