import { spawn } from 'node:child_process';

const script = [
  "const fs = require('fs');",
  "const filePath = 'D:/0 Running apps/ecosystem.config.js';",
  "let content = fs.readFileSync(filePath, 'utf8');",
  "if (!content.includes('dmj-hris')) {",
  "  const newApp = [",
  "    '    // 21. DMJ Prime HRIS Enterprise (PT Dwi Martha Jaya) - Port 8566',",
  "    '    {',",
  "    \"      name: 'dmj-hris',\",",
  "    \"      cwd: 'D:\\\\\\\\0 Running apps\\\\\\\\dmj-hris',\",",
  "    \"      script: 'server/index.js',\",",
  "    \"      interpreter: NODE_BIN,\",",
  "    \"      autorestart: true,\",",
  "    \"      restart_delay: 2000,\",",
  "    \"      min_uptime: '5s',\",",
  "    \"      max_restarts: 50,\",",
  "    \"      watch: false,\",",
  "    \"      max_memory_restart: '400M',\",",
  "    \"      env: {\",",
  "    \"        NODE_ENV: 'production',\",",
  "    \"        PORT: 8566\",",
  "    \"      }\",",
  "    '    },'",
  "  ].join('\\n');",
  "  const lastBracketIdx = content.lastIndexOf('  ]');",
  "  if (lastBracketIdx !== -1) {",
  "    content = content.slice(0, lastBracketIdx) + newApp + '\\n  ]\\n};\\n';",
  "    fs.writeFileSync(filePath, content, 'utf8');",
  "    console.log('[DEV20] Successfully inserted dmj-hris into ecosystem.config.js');",
  "  } else {",
  "    console.warn('[DEV20] Could not find closing bracket in ecosystem.config.js');",
  "  }",
  "} else {",
  "  console.log('[DEV20] dmj-hris already present in ecosystem.config.js');",
  "}"
].join('\n');

const scriptB64 = Buffer.from(script).toString('base64');
const remoteCommand = `node -e "eval(Buffer.from('${scriptB64}', 'base64').toString('utf8'))"`;

console.log('[MC18] Updating ecosystem.config.js on DEV20...');
const proc = spawn('ssh', ['dev20', remoteCommand], { stdio: 'inherit' });
proc.on('close', code => {
  console.log('[MC18] Update completed with code:', code);
});
