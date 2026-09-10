// Production Standalone Server for Prime HRIS SQLite API with RTC & Real-Time Sync
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getAllData,
  saveAttendance,
  updateApproval,
  saveEmployee,
  saveSalaryRules,
  saveReimbursement,
  resetDatabase,
  getDbInfo,
  authenticateUser,
  getCurrentUserFromToken,
  changeUserPassword,
  listUserAccounts,
  verifyToken
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dbPath = path.join(projectRoot, 'data', 'hris.sqlite');
const distPath = path.join(projectRoot, 'dist');
const PORT = process.env.PORT || 5173;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

// ==========================================
// REAL-TIME COMMUNICATION (SSE ENGINE)
// ==========================================
const sseClients = new Set();

function broadcastRealtimeEvent(type, payload) {
  const packet = JSON.stringify({
    type,
    payload,
    serverTimeMs: Date.now(),
    serverTimestamp: new Date().toISOString()
  });
  const sseMessage = `event: message\ndata: ${packet}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(sseMessage);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

// Keep-alive heartbeat ping every 25 seconds for Cloudflare Tunnel / proxies
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(':ping\n\n');
    } catch (err) {
      sseClients.delete(client);
    }
  }
}, 25000);

const server = http.createServer(async (req, res) => {
  const url = req.url || '';
  const cleanUrl = url.split('?')[0];
  const method = req.method?.toUpperCase() || 'GET';

  // Helper for JSON
  const sendJson = (status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
  };

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // Parse JSON Body
  const readBody = () => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); }
      });
      req.on('error', reject);
    });
  };

  const getAuthToken = () => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      return parsedUrl.searchParams.get('token');
    } catch (e) {
      return null;
    }
  };

  // API Routes
  if (cleanUrl.startsWith('/api/')) {
    try {
      // 0. Auth Routes
      if (cleanUrl === '/api/auth/login' && method === 'POST') {
        const body = await readBody();
        const result = authenticateUser(body.identifier || body.username || body.email, body.password);
        if (!result.success) {
          return sendJson(401, result);
        }
        return sendJson(200, result);
      }

      if (cleanUrl === '/api/auth/me' && method === 'GET') {
        const token = getAuthToken();
        const user = getCurrentUserFromToken(token);
        if (!user) {
          return sendJson(401, { success: false, error: 'Unauthorized or session expired' });
        }
        return sendJson(200, { success: true, user });
      }

      if (cleanUrl === '/api/auth/logout' && method === 'POST') {
        return sendJson(200, { success: true, message: 'Berhasil logout' });
      }

      if (cleanUrl === '/api/auth/change-password' && method === 'POST') {
        const token = getAuthToken();
        const user = getCurrentUserFromToken(token);
        if (!user) {
          return sendJson(401, { success: false, error: 'Unauthorized' });
        }
        const body = await readBody();
        const result = changeUserPassword(user.id, body.oldPassword, body.newPassword);
        return sendJson(result.success ? 200 : 400, result);
      }

      if (cleanUrl === '/api/auth/accounts' && method === 'GET') {
        const token = getAuthToken();
        const user = getCurrentUserFromToken(token);
        if (!user || user.systemRole !== 'superuser') {
          return sendJson(403, { success: false, error: 'Forbidden: Superuser access required' });
        }
        return sendJson(200, { success: true, accounts: listUserAccounts() });
      }

      // 1. Health check
      if (cleanUrl === '/api/health' && method === 'GET') {
        return sendJson(200, {
          status: 'online',
          rtcLiveConnectedClients: sseClients.size,
          ...getDbInfo()
        });
      }

      // 2. Real-Time Communication (SSE Live Stream)
      if (cleanUrl === '/api/realtime/stream' && method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });
        const initialPayload = JSON.stringify({
          connected: true,
          clientsCount: sseClients.size + 1,
          serverTimeMs: Date.now(),
          serverTimestamp: new Date().toISOString(),
          timeZone: 'Asia/Jakarta (WIB)'
        });
        res.write(`event: connected\ndata: ${initialPayload}\n\n`);
        sseClients.add(res);

        req.on('close', () => {
          sseClients.delete(res);
        });
        return;
      }

      // 3. RTC Authoritative Server Time Lock (Anti-Tamper NTP Clock)
      if (cleanUrl === '/api/server-time' && method === 'GET') {
        const now = new Date();
        const timeZone = 'Asia/Jakarta';
        const wibTime = now.toLocaleTimeString('id-ID', {
          timeZone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) + ' WIB';
        const wibDate = now.toLocaleDateString('en-CA', { timeZone });
        return sendJson(200, {
          serverTimeMs: now.getTime(),
          serverTimestamp: now.toISOString(),
          serverWibTime: wibTime,
          serverDate: wibDate,
          timeZone: 'Asia/Jakarta (UTC+7)',
          isNtpAuthoritative: true
        });
      }

      // 4. Client Network Gateway
      if (cleanUrl === '/api/my-network' && method === 'GET') {
        const clientIp = req.headers['cf-connecting-ip'] || 
                         req.headers['x-real-ip'] || 
                         (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
                         req.socket.remoteAddress || 
                         '127.0.0.1';
        return sendJson(200, {
          ip: clientIp,
          country: req.headers['cf-ipcountry'] || 'ID',
          city: req.headers['cf-ipcity'] || null,
          serverTimeMs: Date.now(),
          serverTimestamp: new Date().toISOString()
        });
      }

      // 5. Bootstrap all data from SQLite
      if (cleanUrl === '/api/bootstrap' && method === 'GET') {
        return sendJson(200, getAllData());
      }

      // 6. Save Attendance with Server RTC Time Lock & Instant Broadcast
      if (cleanUrl === '/api/attendance' && method === 'POST') {
        const body = await readBody();
        const serverNow = new Date();
        const serverWibTime = serverNow.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        const serverDate = serverNow.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

        // Enforce Server RTC Authoritative Time (Anti-Tamper)
        body.serverVerifiedTime = serverWibTime;
        body.serverVerifiedDate = serverDate;
        body.serverTimeMs = serverNow.getTime();

        const result = saveAttendance(body);
        broadcastRealtimeEvent('ATTENDANCE_SAVED', result.record || body);
        return sendJson(200, result);
      }

      // 7. Update Approval with Instant Broadcast
      if (cleanUrl === '/api/approval' && (method === 'PUT' || method === 'POST')) {
        const body = await readBody();
        const result = updateApproval(body.id, body.status, body.reviewNote, body.reviewedBy);
        broadcastRealtimeEvent('APPROVAL_UPDATED', { id: body.id, status: body.status, reviewNote: body.reviewNote, reviewedBy: body.reviewedBy });
        return sendJson(200, result);
      }

      // 8. Save Employee with Broadcast
      if (cleanUrl === '/api/employee' && method === 'POST') {
        const body = await readBody();
        const result = saveEmployee(body);
        broadcastRealtimeEvent('EMPLOYEE_SAVED', result.employee || body);
        return sendJson(200, result);
      }

      // 9. Save Reimbursement with Broadcast
      if (cleanUrl === '/api/reimbursement' && method === 'POST') {
        const body = await readBody();
        const result = saveReimbursement(body);
        broadcastRealtimeEvent('REIMBURSEMENT_SAVED', result.claim || body);
        return sendJson(200, result);
      }

      // 10. Update Salary Rules with Broadcast
      if (cleanUrl === '/api/salary-rules' && (method === 'PUT' || method === 'POST')) {
        const body = await readBody();
        const result = saveSalaryRules(body);
        broadcastRealtimeEvent('SALARY_RULES_UPDATED', body);
        return sendJson(200, result);
      }

      // 11. Reset Database with Broadcast
      if (cleanUrl === '/api/reset' && method === 'POST') {
        const result = resetDatabase();
        broadcastRealtimeEvent('DATABASE_RESET', {});
        return sendJson(200, { success: true, ...result });
      }
      if (cleanUrl === '/api/download-db' && method === 'GET') {
        if (!fs.existsSync(dbPath)) return sendJson(404, { error: 'Database not found' });
        res.writeHead(200, {
          'Content-Type': 'application/x-sqlite3',
          'Content-Disposition': 'attachment; filename="prime_hris.sqlite"'
        });
        return fs.createReadStream(dbPath).pipe(res);
      }
      return sendJson(404, { error: 'Not found' });
    } catch (err) {
      console.error(err);
      return sendJson(500, { error: err.message });
    }
  }

  // Static File Serving (from dist/)
  let filePath = path.join(distPath, cleanUrl === '/' ? 'index.html' : cleanUrl);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distPath, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Video Streaming with HTTP 206 Partial Content (Range requests)
  if (ext === '.mp4' || ext === '.webm') {
    try {
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
        fileStream.pipe(res);
        return;
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Accept-Ranges': 'bytes',
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    } catch (err) {
      res.writeHead(500);
      res.end('Server Error streaming media');
      return;
    }
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error loading asset');
      return;
    }
    const headers = { 'Content-Type': contentType };
    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    } else {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }
    res.writeHead(200, headers);
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`[Prime HRIS SQLite Server] Berjalan di http://localhost:${PORT}`);
  console.log(`[Database] File: ${dbPath}`);
});
