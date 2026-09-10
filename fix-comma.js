import { spawn } from 'node:child_process';

const script = [
  "const fs = require('fs');",
  "const p = 'D:/0 Running apps/ecosystem.config.js';",
  "let c = fs.readFileSync(p, 'utf8');",
  "c = c.replace(/\\}\\s*\\/\\/ 21\\. DMJ/g, '},\\n    // 21. DMJ');",
  "fs.writeFileSync(p, c, 'utf8');",
  "console.log('[DEV20] Comma fixed in ecosystem.config.js');"
].join('\n');

const scriptB64 = Buffer.from(script).toString('base64');
const remoteCommand = `node -e "eval(Buffer.from('${scriptB64}', 'base64').toString('utf8'))"`;

const proc = spawn('ssh', ['dev20', remoteCommand], { stdio: 'inherit' });
proc.on('close', code => {
  console.log('[MC18] Fixed with code:', code);
});
