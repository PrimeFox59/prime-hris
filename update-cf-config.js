import { spawn } from 'node:child_process';

const script = [
  "const fs = require('fs');",
  "const p = 'C:/Users/DEV/.cloudflared/config.yml';",
  "let c = fs.readFileSync(p, 'utf8');",
  "if (!c.includes('dmj.primeprojectx.net')) {",
  "  const newRoute = '  - hostname: dmj.primeprojectx.net\\n    service: http://localhost:8566\\n';",
  "  c = c.replace('  - service: http_status:404', newRoute + '  - service: http_status:404');",
  "  fs.writeFileSync(p, c, 'utf8');",
  "  console.log('[DEV20] Added dmj.primeprojectx.net to cloudflared config.yml');",
  "} else {",
  "  console.log('[DEV20] dmj.primeprojectx.net already in cloudflared config.yml');",
  "}"
].join('\n');

const scriptB64 = Buffer.from(script).toString('base64');
const remoteCommand = `node -e "eval(Buffer.from('${scriptB64}', 'base64').toString('utf8'))"`;

console.log('[MC18] Updating cloudflared config.yml on DEV20...');
const proc = spawn('ssh', ['dev20', remoteCommand], { stdio: 'inherit' });
proc.on('close', code => {
  console.log('[MC18] Update completed with code:', code);
});
