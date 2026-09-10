import fs from 'node:fs';
import { execSync, spawn } from 'node:child_process';

console.log('[MC18] Packaging production bundle for PRIME HRIS...');

// 1. Pack dist/
execSync('tar -czf dist.tar.gz -C dist .', { stdio: 'inherit' });

const tarBuffer = fs.readFileSync('dist.tar.gz');
const serverIndexBuffer = fs.readFileSync('server/index.js');
const serverDbJsBuffer = fs.readFileSync('server/db.js');
const serverDbTsBuffer = fs.readFileSync('server/db.ts');
const seedDataBuffer = fs.readFileSync('data/seedData.json');

const payload = JSON.stringify({
  distB64: tarBuffer.toString('base64'),
  serverIndexB64: serverIndexBuffer.toString('base64'),
  serverDbJsB64: serverDbJsBuffer.toString('base64'),
  serverDbTsB64: serverDbTsBuffer.toString('base64'),
  seedDataB64: seedDataBuffer.toString('base64')
});

const b64Data = Buffer.from(payload).toString('base64');
console.log(`[MC18] Packed payload size: ${b64Data.length} characters`);

const receiverScript = `
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let b64 = '';
process.stdin.on('data', chunk => { b64 += chunk; });
process.stdin.on('end', () => {
  try {
    const json = JSON.parse(Buffer.from(b64.trim(), 'base64').toString('utf8'));
    const appDir = 'D:/0 Running apps/prime-hris';
    const destDir = path.join(appDir, 'dist');
    const destTar = path.join(appDir, 'dist_update.tar.gz');
    const serverDir = path.join(appDir, 'server');
    const dataDir = path.join(appDir, 'data');
    const serverIndexDest = path.join(serverDir, 'index.js');
    const serverDbJsDest = path.join(serverDir, 'db.js');
    const serverDbTsDest = path.join(serverDir, 'db.ts');
    const seedDataDest = path.join(dataDir, 'seedData.json');

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 1. Unpack dist
    fs.writeFileSync(destTar, Buffer.from(json.distB64, 'base64'));
    console.log('[DEV20] Received dist_update.tar.gz (' + fs.statSync(destTar).size + ' bytes)');
    execSync('tar -xzf "' + destTar + '" -C "' + destDir + '"', { stdio: 'inherit' });
    fs.unlinkSync(destTar);
    console.log('[DEV20] Extracted dist successfully to ' + destDir);

    // 2. Write server and data files
    fs.writeFileSync(serverIndexDest, Buffer.from(json.serverIndexB64, 'base64'));
    console.log('[DEV20] Updated server/index.js (' + fs.statSync(serverIndexDest).size + ' bytes)');

    fs.writeFileSync(serverDbJsDest, Buffer.from(json.serverDbJsB64, 'base64'));
    console.log('[DEV20] Updated server/db.js (' + fs.statSync(serverDbJsDest).size + ' bytes)');

    fs.writeFileSync(serverDbTsDest, Buffer.from(json.serverDbTsB64, 'base64'));
    console.log('[DEV20] Updated server/db.ts (' + fs.statSync(serverDbTsDest).size + ' bytes)');

    if (json.seedDataB64) {
      fs.writeFileSync(seedDataDest, Buffer.from(json.seedDataB64, 'base64'));
      console.log('[DEV20] Updated data/seedData.json (' + fs.statSync(seedDataDest).size + ' bytes)');
    }

    // Sanitize DB to PRIME-
    try {
      const dbModule = require(serverDbJsDest);
      const db = dbModule.getDb ? dbModule.getDb() : null;
      if (db) {
        db.prepare("UPDATE employees SET nik = REPLACE(nik, 'DMJ-', 'PRIME-'), email = REPLACE(email, '@dwimarthajaya.co.id', '@primeprojectx.net') WHERE nik LIKE 'DMJ-%' OR email LIKE '%@dwimarthajaya.co.id%'").run();
        console.log('[DEV20] Sanitized SQLite employees NIK & email to PRIME-');
      }
    } catch (dbErr) {
      console.log('[DEV20 DB Note]', dbErr.message);
    }

    // 3. Restart PM2 prime-hris only
    console.log('[DEV20] Restarting PM2 process: prime-hris...');
    execSync('pm2 restart prime-hris', { stdio: 'inherit' });
    console.log('[DEV20] PM2 restart prime-hris completed successfully.');
  } catch (err) {
    console.error('[DEV20 ERROR]', err);
    process.exit(1);
  }
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
