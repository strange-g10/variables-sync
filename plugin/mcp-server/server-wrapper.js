#!/usr/bin/env node

/**
 * Background wrapper for MCP Server
 * This keeps the server running in background by providing a stdin stream
 */

import { spawn } from 'child_process';
import { Readable } from 'stream';

// Create a dummy stdin stream to keep the server alive
const dummyStdin = new Readable({
  read() {
    // Do nothing - just keep the stream open
  }
});

// Start the HTTP server
const serverProcess = spawn('node', ['dist/httpServer.js'], {
  stdio: ['inherit', 'inherit', 'inherit']
});

// No need to pipe stdin for HTTP server
// dummyStdin.pipe(serverProcess.stdin);

console.log(`HTTP Server started with PID: ${serverProcess.pid}`);
console.log('HTTP Server is running on http://localhost:3000');
console.log('Health check: http://localhost:3000/health');

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down server...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down server...');
  serverProcess.kill('SIGINT');
});

// Keep this wrapper process alive
serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code: ${code}`);
  process.exit(code);
});

// Handle errors
serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
