import fs from 'node:fs';
import { execSync, spawn } from 'node:child_process';

console.log('[MC18] Packing dist/ and server/index.js...');
execSync('tar -czf dist.tar.gz -C dist .', { stdio: 'inherit' });

const tarBuffer = fs.readFileSync('dist.tar.gz');
const serverIndexBuffer = fs.readFileSync('server/index.js');

const payload = JSON.stringify({
  distB64: tarBuffer.toString('base64'),
  serverIndexB64: serverIndexBuffer.toString('base64')
});

const b64Data = Buffer.from(payload).toString('base64');
console.log(`[MC18] Packed payload size: ${b64Data.length} chars`);

const receiverScript = `
const fs = require('fs');
const { execSync } = require('child_process');

let b64 = '';
process.stdin.on('data', chunk => { b64 += chunk; });
process.stdin.on('end', () => {
  const json = JSON.parse(Buffer.from(b64.trim(), 'base64').toString('utf8'));
  const destDir = 'D:/0 Running apps/dmj-hris/dist';
  const destTar = 'D:/0 Running apps/dmj-hris/dist_update.tar.gz';
  const serverIndexDest = 'D:/0 Running apps/dmj-hris/server/index.js';

  fs.writeFileSync(destTar, Buffer.from(json.distB64, 'base64'));
  console.log('[DEV20] Received dist_update.tar.gz (' + fs.statSync(destTar).size + ' bytes)');
  execSync('tar -xzf "' + destTar + '" -C "' + destDir + '"', { stdio: 'inherit' });
  fs.unlinkSync(destTar);
  console.log('[DEV20] Extracted dist successfully to ' + destDir);

  fs.writeFileSync(serverIndexDest, Buffer.from(json.serverIndexB64, 'base64'));
  console.log('[DEV20] Updated server/index.js successfully (' + fs.statSync(serverIndexDest).size + ' bytes)');
});
`;

const receiverB64 = Buffer.from(receiverScript).toString('base64');
const remoteCommand = `node -e "eval(Buffer.from('${receiverB64}', 'base64').toString('utf8'))"`;

console.log('[MC18] Streaming payload to DEV20 via SSH...');
const proc = spawn('ssh', ['dev20-lan', remoteCommand], {
  stdio: ['pipe', 'inherit', 'inherit']
});

proc.stdin.write(b64Data);
proc.stdin.end();

proc.on('close', code => {
  console.log('[MC18] Deployment completed with exit code:', code);
  try {
    fs.unlinkSync('dist.tar.gz');
  } catch (e) {}
});
