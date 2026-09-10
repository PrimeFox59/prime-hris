import { spawn } from 'node:child_process';

const script = [
  "const path = require('path');",
  "process.chdir('D:/0 Running apps/agy-integration-hub/agy-project-manager');",
  "const { getDb } = require('D:/0 Running apps/agy-integration-hub/agy-project-manager/db');",
  "const db = getDb();",
  "",
  "const sql = `",
  "  INSERT OR REPLACE INTO client_apps (",
  "    name, client_name, client_email, assigned_user_id, description,",
  "    category, icon, internal_port, pm2_service_name, public_url, app_dir, status",
  "  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  "`;",
  "",
  "const stmt = db.prepare(sql);",
  "stmt.run(",
  "  'Prime HRIS Enterprise',",
  "  'PT Dwi Martha Jaya',",
  "  'dmj@primeprojectx.net',",
  "  1,",
  "  'Sistem Tata Kelola HRIS, Presensi Kamera Selfie Watermark & Payroll PT Dwi Martha Jaya',",
  "  'Web Application',",
  "  'fa-id-card',",
  "  8566,",
  "  'dmj-hris',",
  "  'https://dmj.primeprojectx.net',",
  "  'D:\\\\0 Running apps\\\\dmj-hris',",
  "  'active'",
  ");",
  "",
  "console.log('[DEV20] Successfully registered dmj-hris into AGY Hub Master Database!');",
  "const row = db.prepare('SELECT * FROM client_apps WHERE pm2_service_name = ?').get('dmj-hris');",
  "console.log('[DEV20] Registered App Record:', { id: row.id, name: row.name, port: row.internal_port, url: row.public_url, status: row.status });"
].join('\n');

const scriptB64 = Buffer.from(script).toString('base64');
const remoteCommand = `node -e "eval(Buffer.from('${scriptB64}', 'base64').toString('utf8'))"`;

console.log('[MC18] Registering app in AGY Hub on DEV20...');
const proc = spawn('ssh', ['dev20', remoteCommand], { stdio: 'inherit' });
proc.on('close', code => {
  console.log('[MC18] AGY Hub registration exited with code:', code);
});
