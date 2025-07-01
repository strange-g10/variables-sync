#!/usr/bin/env node

// Background wrapper for the MCP server
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the server as a detached process
const serverProcess = spawn('node', [join(__dirname, 'dist/index.js')], {
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe']
});

// Keep server running even after parent exits
serverProcess.unref();

console.log(`Background server started with PID: ${serverProcess.pid}`);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down background server...');
  serverProcess.kill();
  process.exit(0);
});

// Keep the wrapper process alive
process.stdin.resume();
