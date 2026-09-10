import fs from 'node:fs';
import { spawn } from 'node:child_process';

const b64 = fs.readFileSync('dmj-hris.b64', 'utf8');

// The receiver script to run on DEV20
const receiverScript = `
const fs = require('fs');
const { execSync } = require('child_process');

let b64Data = '';
process.stdin.on('data', chunk => { b64Data += chunk; });
process.stdin.on('end', () => {
  const destDir = 'D:/0 Running apps/dmj-hris';
  const destTar = destDir + '/dmj-hris.tar.gz';
  fs.writeFileSync(destTar, Buffer.from(b64Data.trim(), 'base64'));
  console.log('[DEV20] Received archive, size:', fs.statSync(destTar).size, 'bytes');
  execSync('tar -xzf \"' + destTar + '\" -C \"' + destDir + '\"', { stdio: 'inherit' });
  fs.unlinkSync(destTar);
  console.log('[DEV20] Extracted archive successfully to:', destDir);
});
`;

// Encode receiver script in base64 to avoid all Windows shell quoting issues!
const receiverScriptB64 = Buffer.from(receiverScript).toString('base64');
const remoteCommand = `node -e "eval(Buffer.from('${receiverScriptB64}', 'base64').toString('utf8'))"`;

console.log('[MC18] Connecting to DEV20 and piping archive payload...');
const proc = spawn('ssh', ['dev20-lan', remoteCommand], {
  stdio: ['pipe', 'inherit', 'inherit']
});

proc.stdin.write(b64);
proc.stdin.end();

proc.on('close', code => {
  console.log('[MC18] Deployment pipeline exited with code:', code);
});
