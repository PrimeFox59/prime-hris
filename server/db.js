import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Determine root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');
const dbPath = path.join(dataDir, 'hris.sqlite');
const seedPath = path.join(dataDir, 'seedData.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Persistent Auth Secret for HMAC Signatures
const secretPath = path.join(dataDir, 'auth.secret');
let AUTH_SECRET = '';
if (fs.existsSync(secretPath)) {
  AUTH_SECRET = fs.readFileSync(secretPath, 'utf-8').trim();
} else {
  AUTH_SECRET = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(secretPath, AUTH_SECRET, 'utf-8');
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  try {
    const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
  } catch (e) {
    return false;
  }
}

export function generateToken(user) {
  const payload = {
    userId: user.id,
    employeeId: user.employee_id,
    role: user.role,
    systemRole: user.system_role,
    username: user.username,
    email: user.email,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days expiration
  };
  const json = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(json).digest('base64url');
  return `${json}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [json, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(json).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(json, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(dbPath);
    initializeSchema(dbInstance);
  }
  return dbInstance;
}

export function getDbInfo() {
  let sizeBytes = 0;
  if (fs.existsSync(dbPath)) {
    sizeBytes = fs.statSync(dbPath).size;
  }
  return {
    engine: 'SQLite 3 (Native node:sqlite)',
    journalMode: 'WAL (Write-Ahead Logging)',
    dbPath,
    sizeBytes,
    sizeKb: Math.round(sizeBytes / 1024 * 10) / 10
  };
}

function initializeSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      nik TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT,
      department TEXT,
      position TEXT,
      employmentType TEXT,
      joinDate TEXT,
      assignedProjectId TEXT,
      baseSalary REAL,
      fixedAllowance REAL,
      dailyAllowance REAL,
      leaveQuota INTEGER,
      usedLeave INTEGER,
      bankAccount TEXT,
      avatar TEXT,
      data_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      client TEXT,
      location TEXT,
      status TEXT,
      startDate TEXT,
      targetEndDate TEXT,
      allocatedBudget REAL,
      actualLaborCost REAL,
      projectedLaborCost REAL,
      totalEstimatedHours REAL,
      actualHoursSpent REAL,
      hourlyRateMultiplier REAL,
      data_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS attendances (
      id TEXT PRIMARY KEY,
      employeeId TEXT NOT NULL,
      employeeName TEXT NOT NULL,
      employeeNik TEXT NOT NULL,
      department TEXT,
      date TEXT NOT NULL,
      checkInTime TEXT NOT NULL,
      checkOutTime TEXT,
      mode TEXT NOT NULL,
      status TEXT NOT NULL,
      photoUrl TEXT,
      isLate INTEGER DEFAULT 0,
      lateMinutes INTEGER DEFAULT 0,
      lateReason TEXT,
      approvalStatus TEXT DEFAULT 'NOT_REQUIRED',
      data_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      employeeId TEXT NOT NULL,
      employeeName TEXT NOT NULL,
      employeeNik TEXT NOT NULL,
      department TEXT,
      title TEXT NOT NULL,
      description TEXT,
      startDate TEXT,
      endDate TEXT,
      daysCount INTEGER,
      lateMinutes INTEGER,
      status TEXT NOT NULL,
      submittedAt TEXT NOT NULL,
      reviewedBy TEXT,
      reviewedAt TEXT,
      reviewNote TEXT,
      data_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reimbursements (
      id TEXT PRIMARY KEY,
      employeeId TEXT NOT NULL,
      employeeName TEXT NOT NULL,
      employeeNik TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      receiptAttachment TEXT,
      projectId TEXT,
      projectName TEXT,
      status TEXT NOT NULL,
      submittedAt TEXT NOT NULL,
      reviewedBy TEXT,
      reviewedAt TEXT,
      rejectReason TEXT,
      data_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS salary_rules (
      id TEXT PRIMARY KEY,
      config_json TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entityId TEXT,
      details TEXT,
      userName TEXT DEFAULT 'System',
      userNik TEXT,
      userRole TEXT DEFAULT 'system',
      module TEXT DEFAULT 'SYSTEM',
      ipAddress TEXT DEFAULT '127.0.0.1',
      status TEXT DEFAULT 'SUCCESS',
      metadata TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure audit_logs columns exist (backward-compatible schema migration)
  try {
    const existingAuditCols = db.prepare('PRAGMA table_info(audit_logs);').all().map(c => c.name);
    const newAuditCols = [
      { name: 'userName', def: "TEXT DEFAULT 'System'" },
      { name: 'userNik', def: "TEXT" },
      { name: 'userRole', def: "TEXT DEFAULT 'system'" },
      { name: 'module', def: "TEXT DEFAULT 'SYSTEM'" },
      { name: 'ipAddress', def: "TEXT DEFAULT '127.0.0.1'" },
      { name: 'status', def: "TEXT DEFAULT 'SUCCESS'" },
      { name: 'metadata', def: "TEXT" }
    ];
    for (const col of newAuditCols) {
      if (!existingAuditCols.includes(col.name)) {
        try {
          db.exec(`ALTER TABLE audit_logs ADD COLUMN ${col.name} ${col.def};`);
        } catch (e) {}
      }
    }
  } catch (e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_accounts (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL,
      system_role TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      last_login TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure systemRole is populated in existing employees data_json
  try {
    const rows = db.prepare('SELECT id, data_json FROM employees;').all();
    const updateEmpStmt = db.prepare('UPDATE employees SET data_json = ? WHERE id = ?;');
    for (const r of rows) {
      let parsed = JSON.parse(r.data_json);
      if (!parsed.systemRole) {
        if (parsed.id === 'EMP-001') parsed.systemRole = 'superuser';
        else if (parsed.id === 'EMP-002' || parsed.id === 'EMP-003') parsed.systemRole = 'admin';
        else parsed.systemRole = 'staff';
        updateEmpStmt.run(JSON.stringify(parsed), r.id);
      }
    }
  } catch (e) {
    console.warn('[SQLite] Failed migration of systemRole in employees', e);
  }

  const empCount = db.prepare('SELECT count(*) as count FROM employees;').get()?.count || 0;
  if (empCount === 0) {
    seedInitialData(db);
  }

  const userCount = db.prepare('SELECT count(*) as count FROM user_accounts;').get()?.count || 0;
  if (userCount === 0) {
    seedDefaultUsers(db);
  }

  const logCount = db.prepare('SELECT count(*) as count FROM audit_logs;').get()?.count || 0;
  if (logCount < 10) {
    seedRealisticAuditLogs(db);
  }
}

export function seedInitialData(db) {
  console.log('[SQLite] Inisialisasi & Seeding data awal Prime HRIS Enterprise...');
  if (!fs.existsSync(seedPath)) {
    console.warn('[SQLite] seedData.json tidak ditemukan di:', seedPath);
    return;
  }

  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

  // 1. Employees
  const insertEmp = db.prepare(`
    INSERT OR REPLACE INTO employees (
      id, nik, name, email, phone, role, department, position,
      employmentType, joinDate, assignedProjectId, baseSalary,
      fixedAllowance, dailyAllowance, leaveQuota, usedLeave,
      bankAccount, avatar, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  for (const emp of seed.INITIAL_EMPLOYEES || []) {
    insertEmp.run(
      emp.id, emp.nik, emp.name, emp.email, emp.phone, emp.role,
      emp.department, emp.position, emp.employmentType, emp.joinDate,
      emp.assignedProjectId, emp.baseSalary, emp.fixedAllowance,
      emp.dailyAllowance, emp.leaveQuota, emp.usedLeave,
      JSON.stringify(emp.bankAccount), emp.avatar, JSON.stringify(emp)
    );
  }

  // 2. Projects
  const insertProj = db.prepare(`
    INSERT OR REPLACE INTO projects (
      id, code, name, client, location, status, startDate,
      targetEndDate, allocatedBudget, actualLaborCost, projectedLaborCost,
      totalEstimatedHours, actualHoursSpent, hourlyRateMultiplier, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  for (const proj of seed.INITIAL_PROJECTS || []) {
    insertProj.run(
      proj.id, proj.code, proj.name, proj.client, proj.location,
      proj.status, proj.startDate, proj.targetEndDate, proj.allocatedBudget,
      proj.actualLaborCost, proj.projectedLaborCost, proj.totalEstimatedHours,
      proj.actualHoursSpent, proj.hourlyRateMultiplier, JSON.stringify(proj)
    );
  }

  // 3. Attendances
  const insertAtt = db.prepare(`
    INSERT OR REPLACE INTO attendances (
      id, employeeId, employeeName, employeeNik, department,
      date, checkInTime, checkOutTime, mode, status,
      photoUrl, isLate, lateMinutes, lateReason,
      approvalStatus, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  for (const att of seed.INITIAL_ATTENDANCE || []) {
    insertAtt.run(
      att.id, att.employeeId, att.employeeName, att.employeeNik,
      att.department, att.date, att.checkInTime, att.checkOutTime || null,
      att.mode, att.status, att.photoUrl, att.isLate ? 1 : 0,
      att.lateMinutes, att.lateReason || null, att.approvalStatus,
      JSON.stringify(att)
    );
  }

  // 4. Approvals
  const insertAppr = db.prepare(`
    INSERT OR REPLACE INTO approvals (
      id, type, employeeId, employeeName, employeeNik, department,
      title, description, startDate, endDate, daysCount, lateMinutes,
      status, submittedAt, reviewedBy, reviewedAt, reviewNote, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  for (const appr of seed.INITIAL_APPROVALS || []) {
    insertAppr.run(
      appr.id, appr.type, appr.employeeId, appr.employeeName,
      appr.employeeNik, appr.department, appr.title, appr.description,
      appr.startDate, appr.endDate || null, appr.daysCount || null,
      appr.lateMinutes || null, appr.status, appr.submittedAt,
      appr.reviewedBy || null, appr.reviewedAt || null, appr.reviewNote || null,
      JSON.stringify(appr)
    );
  }

  // 5. Reimbursements
  const insertReimb = db.prepare(`
    INSERT OR REPLACE INTO reimbursements (
      id, employeeId, employeeName, employeeNik, category,
      title, description, amount, date, receiptAttachment,
      projectId, projectName, status, submittedAt,
      reviewedBy, reviewedAt, rejectReason, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  for (const reimb of seed.INITIAL_REIMBURSEMENTS || []) {
    insertReimb.run(
      reimb.id, reimb.employeeId, reimb.employeeName, reimb.employeeNik,
      reimb.category, reimb.title, reimb.description, reimb.amount,
      reimb.date, reimb.receiptAttachment || null, reimb.projectId || null,
      reimb.projectName || null, reimb.status, reimb.submittedAt,
      reimb.reviewedBy || null, reimb.reviewedAt || null,
      reimb.rejectReason || null, JSON.stringify(reimb)
    );
  }

  // 6. Salary Rules
  if (seed.INITIAL_SALARY_RULES) {
    db.prepare(`
      INSERT OR REPLACE INTO salary_rules (id, config_json, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP);
    `).run('default', JSON.stringify(seed.INITIAL_SALARY_RULES));
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (action, entity, entityId, details)
    VALUES (?, ?, ?, ?);
  `).run('INIT_DATABASE', 'DATABASE', 'hris.sqlite', 'Initial database seeding executed successfully');

  console.log('[SQLite] Seeding selesai!');
}

export function getAllData() {
  const db = getDatabase();
  const employees = db.prepare('SELECT data_json FROM employees ORDER BY name ASC;').all().map(r => JSON.parse(r.data_json));
  const projects = db.prepare('SELECT data_json FROM projects ORDER BY code ASC;').all().map(r => JSON.parse(r.data_json));
  const attendances = db.prepare('SELECT data_json FROM attendances ORDER BY date DESC, checkInTime DESC;').all().map(r => JSON.parse(r.data_json));
  const approvals = db.prepare('SELECT data_json FROM approvals ORDER BY submittedAt DESC;').all().map(r => JSON.parse(r.data_json));
  const reimbursements = db.prepare('SELECT data_json FROM reimbursements ORDER BY submittedAt DESC;').all().map(r => JSON.parse(r.data_json));
  const rulesRow = db.prepare('SELECT config_json FROM salary_rules WHERE id = ?;').get('default');
  const salaryRules = rulesRow ? JSON.parse(rulesRow.config_json) : null;

  return {
    employees,
    projects,
    attendances,
    approvals,
    reimbursements,
    salaryRules,
    dbInfo: getDbInfo()
  };
}

export function saveAttendance(record) {
  const db = getDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO attendances (
      id, employeeId, employeeName, employeeNik, department,
      date, checkInTime, checkOutTime, mode, status,
      photoUrl, isLate, lateMinutes, lateReason,
      approvalStatus, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `).run(
    record.id, record.employeeId, record.employeeName, record.employeeNik,
    record.department, record.date, record.checkInTime, record.checkOutTime || null,
    record.mode, record.status, record.photoUrl, record.isLate ? 1 : 0,
    record.lateMinutes, record.lateReason || null, record.approvalStatus,
    JSON.stringify(record)
  );

  if (record.approvalStatus === 'PENDING') {
    const isDinasLuar = record.mode === 'DINAS_LUAR';
    const approvalId = `APPR-${record.id}`;
    const approvalItem = {
      id: approvalId,
      type: isDinasLuar ? 'DINAS_LUAR' : 'LATE_JUSTIFICATION',
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      employeeNik: record.employeeNik,
      department: record.department,
      title: isDinasLuar
        ? `Pengajuan Dinas Luar Mendadak: ${record.dinasLuarDetails?.clientName || 'Klien Luar'}`
        : `Justifikasi Keterlambatan (${record.lateMinutes} Menit)`,
      description: isDinasLuar
        ? `Tujuan: ${record.dinasLuarDetails?.destination} | Alasan: ${record.dinasLuarDetails?.purpose}`
        : `Alasan Keterlambatan: ${record.lateReason}`,
      startDate: record.date,
      lateMinutes: record.lateMinutes,
      attendanceRecordId: record.id,
      proofAttachment: record.photoUrl,
      status: 'PENDING',
      submittedAt: `${record.date} ${record.checkInTime}`
    };

    db.prepare(`
      INSERT OR REPLACE INTO approvals (
        id, type, employeeId, employeeName, employeeNik, department,
        title, description, startDate, endDate, daysCount, lateMinutes,
        status, submittedAt, reviewedBy, reviewedAt, reviewNote, data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(
      approvalItem.id, approvalItem.type, approvalItem.employeeId,
      approvalItem.employeeName, approvalItem.employeeNik, approvalItem.department,
      approvalItem.title, approvalItem.description, approvalItem.startDate,
      null, null, approvalItem.lateMinutes || null, approvalItem.status,
      approvalItem.submittedAt, null, null, null, JSON.stringify(approvalItem)
    );
  }

  addAuditLog({
    action: record.mode === 'DINAS_LUAR' ? 'CHECKIN_DINAS_LUAR' : 'CHECKIN_WFO',
    entity: 'attendances',
    entityId: record.id,
    userName: record.employeeName,
    userNik: record.employeeNik,
    userRole: 'staff',
    module: 'ATTENDANCE',
    ipAddress: record.ipAddress || '103.31.205.218',
    status: record.isLate ? 'WARNING' : 'SUCCESS',
    details: `Presensi ${record.mode} ${record.employeeName} (${record.employeeNik}) berhasil dicatat. Status: ${record.status}, Terlambat: ${record.lateMinutes} menit.`,
    metadata: {
      location: record.location,
      checkInTime: record.checkInTime,
      wifiSsid: record.wifiSsid,
      hasPhoto: Boolean(record.photoUrl)
    }
  });

  return { success: true, record };
}

export function updateApproval(id, status, reviewNote, reviewedBy = 'Direksi / HR Lead') {
  const db = getDatabase();
  const row = db.prepare('SELECT data_json FROM approvals WHERE id = ?;').get(id);
  if (!row) throw new Error(`Approval item with ID ${id} not found`);

  const item = JSON.parse(row.data_json);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  item.status = status;
  item.reviewNote = reviewNote;
  item.reviewedBy = reviewedBy;
  item.reviewedAt = now;

  db.prepare(`
    UPDATE approvals
    SET status = ?, reviewedBy = ?, reviewedAt = ?, reviewNote = ?, data_json = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?;
  `).run(status, reviewedBy, now, reviewNote || null, JSON.stringify(item), id);

  if (item.attendanceRecordId) {
    const attRow = db.prepare('SELECT data_json FROM attendances WHERE id = ?;').get(item.attendanceRecordId);
    if (attRow) {
      const attRecord = JSON.parse(attRow.data_json);
      attRecord.approvalStatus = status;
      attRecord.approvedBy = reviewedBy;
      attRecord.approvalDate = now;
      attRecord.approvalNote = reviewNote;
      if (status === 'APPROVED' && attRecord.status === 'LATE') {
        attRecord.status = 'ON_TIME';
      }
      db.prepare(`UPDATE attendances SET approvalStatus = ?, status = ?, data_json = ? WHERE id = ?;`)
        .run(status, attRecord.status, JSON.stringify(attRecord), item.attendanceRecordId);
    }
  }

  db.prepare('INSERT INTO audit_logs (action, entity, entityId, details) VALUES (?, ?, ?, ?);')
    .run('UPDATE_APPROVAL', 'approvals', id, `Approval ${id} diubah ke ${status} oleh ${reviewedBy}`);

  return { success: true, item };
}

export function saveEmployee(emp) {
  const db = getDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO employees (
      id, nik, name, email, phone, role, department, position,
      employmentType, joinDate, assignedProjectId, baseSalary,
      fixedAllowance, dailyAllowance, leaveQuota, usedLeave,
      bankAccount, avatar, data_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
  `).run(
    emp.id, emp.nik, emp.name, emp.email, emp.phone, emp.role,
    emp.department, emp.position, emp.employmentType, emp.joinDate,
    emp.assignedProjectId, emp.baseSalary, emp.fixedAllowance,
    emp.dailyAllowance, emp.leaveQuota, emp.usedLeave,
    JSON.stringify(emp.bankAccount), emp.avatar, JSON.stringify(emp)
  );

  addAuditLog({
    action: 'SAVE_EMPLOYEE',
    entity: 'employees',
    entityId: emp.id,
    userName: 'Admin HR',
    userRole: 'admin',
    module: 'EMPLOYEES',
    status: 'SUCCESS',
    details: `Data master karyawan ${emp.name} (${emp.nik}) - Jabatan ${emp.position} di departemen ${emp.department} diperbarui.`
  });

  return { success: true, employee: emp };
}

export function saveSalaryRules(rules) {
  const db = getDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO salary_rules (id, config_json, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP);
  `).run('default', JSON.stringify(rules));

  addAuditLog({
    action: 'UPDATE_SALARY_RULES',
    entity: 'salary_rules',
    entityId: 'default',
    userName: 'Direksi / Superuser',
    userRole: 'superuser',
    module: 'HR_RULES',
    status: 'SUCCESS',
    details: `Konfigurasi kebijakan gaji & geofence kantor (${rules.officeGeofence?.name || 'Kantor Pusat'}, radius ${rules.officeGeofence?.radiusMeters}m) diperbarui.`
  });

  return { success: true, rules };
}

export function saveReimbursement(claim) {
  const db = getDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO reimbursements (
      id, employeeId, employeeName, employeeNik, category,
      title, description, amount, date, receiptAttachment,
      projectId, projectName, status, submittedAt,
      reviewedBy, reviewedAt, rejectReason, data_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
  `).run(
    claim.id, claim.employeeId, claim.employeeName, claim.employeeNik,
    claim.category, claim.title, claim.description, claim.amount,
    claim.date, claim.receiptAttachment || null, claim.projectId || null,
    claim.projectName || null, claim.status, claim.submittedAt,
    claim.reviewedBy || null, claim.reviewedAt || null,
    claim.rejectReason || null, JSON.stringify(claim)
  );

  addAuditLog({
    action: 'SUBMIT_REIMBURSEMENT',
    entity: 'reimbursements',
    entityId: claim.id,
    userName: claim.employeeName,
    userNik: claim.employeeNik,
    userRole: 'staff',
    module: 'PAYROLL',
    status: 'SUCCESS',
    details: `Klaim reimbursement baru diajukan: "${claim.title}" sebesar Rp ${claim.amount?.toLocaleString('id-ID')} untuk proyek ${claim.projectName || claim.projectId}.`
  });

  return { success: true, claim };
}

export function resetDatabase() {
  const db = getDatabase();
  db.exec('DELETE FROM employees;');
  db.exec('DELETE FROM projects;');
  db.exec('DELETE FROM attendances;');
  db.exec('DELETE FROM approvals;');
  db.exec('DELETE FROM reimbursements;');
  db.exec('DELETE FROM salary_rules;');
  db.exec('DELETE FROM audit_logs;');
  db.exec('DELETE FROM user_accounts;');
  seedInitialData(db);
  seedDefaultUsers(db);
  return getAllData();
}

export function seedDefaultUsers(db) {
  console.log('[SQLite] Seeding akun pengguna default Prime HRIS...');
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO user_accounts (
      id, employee_id, email, username, password_hash, salt, role, system_role, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);

  const defaults = [
    {
      id: 'USR-001',
      employee_id: 'EMP-001',
      email: 'admin@primeprojectx.net',
      username: 'admin',
      pass: 'admin123',
      role: 'Director',
      system_role: 'superuser'
    },
    {
      id: 'USR-002',
      employee_id: 'EMP-001',
      email: 'galih@primeprojectx.net',
      username: 'galih',
      pass: 'prime123',
      role: 'Director',
      system_role: 'superuser'
    },
    {
      id: 'USR-003',
      employee_id: 'EMP-003',
      email: 'hr@primeprojectx.net',
      username: 'hrmanager',
      pass: 'hr123',
      role: 'HR_Manager',
      system_role: 'admin'
    },
    {
      id: 'USR-004',
      employee_id: 'EMP-002',
      email: 'pm@primeprojectx.net',
      username: 'projmanager',
      pass: 'pm123',
      role: 'Project_Manager',
      system_role: 'admin'
    },
    {
      id: 'USR-005',
      employee_id: 'EMP-004',
      email: 'staff@primeprojectx.net',
      username: 'karyawan',
      pass: 'staff123',
      role: 'Employee',
      system_role: 'staff'
    }
  ];

  for (const u of defaults) {
    const { hash, salt } = hashPassword(u.pass);
    insertUser.run(
      u.id, u.employee_id, u.email, u.username, hash, salt, u.role, u.system_role, 'active'
    );
  }
  console.log('[SQLite] 5 akun default Prime HRIS berhasil di-seed.');
}

export function authenticateUser(identifier, password) {
  const db = getDatabase();
  const trimmed = (identifier || '').trim().toLowerCase();
  const user = db.prepare(`
    SELECT * FROM user_accounts 
    WHERE LOWER(email) = ? OR LOWER(username) = ?;
  `).get(trimmed, trimmed);

  if (!user) {
    return { success: false, error: 'Email atau Username tidak terdaftar' };
  }

  if (user.status !== 'active') {
    return { success: false, error: 'Akun Anda sedang dinonaktifkan. Hubungi Administrator.' };
  }

  const isValid = verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) {
    return { success: false, error: 'Password yang Anda masukkan salah' };
  }

  // Update last_login
  const now = new Date().toISOString();
  db.prepare('UPDATE user_accounts SET last_login = ? WHERE id = ?;').run(now, user.id);

  // Get Employee profile if linked
  let employee = null;
  if (user.employee_id) {
    const empRow = db.prepare('SELECT data_json FROM employees WHERE id = ?;').get(user.employee_id);
    if (empRow) {
      try { employee = JSON.parse(empRow.data_json); } catch (e) {}
    }
  }

  const token = generateToken(user);

  addAuditLog({
    action: 'AUTH_LOGIN',
    entity: 'user_accounts',
    entityId: user.id,
    userName: employee?.name || user.username,
    userNik: employee?.nik,
    userRole: user.system_role,
    module: 'AUTH',
    status: 'SUCCESS',
    details: `Pengguna ${user.username} (${user.role} / ${user.system_role}) berhasil login ke sistem PRIME HRIS.`
  });

  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      systemRole: user.system_role,
      status: user.status,
      employeeId: user.employee_id,
      lastLogin: now,
      employee
    }
  };
}

export function getCurrentUserFromToken(token) {
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;

  const db = getDatabase();
  const user = db.prepare('SELECT * FROM user_accounts WHERE id = ?;').get(payload.userId);
  if (!user || user.status !== 'active') return null;

  let employee = null;
  if (user.employee_id) {
    const empRow = db.prepare('SELECT data_json FROM employees WHERE id = ?;').get(user.employee_id);
    if (empRow) {
      try { employee = JSON.parse(empRow.data_json); } catch (e) {}
    }
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    systemRole: user.system_role,
    status: user.status,
    employeeId: user.employee_id,
    lastLogin: user.last_login,
    employee
  };
}

export function changeUserPassword(userId, oldPassword, newPassword) {
  const db = getDatabase();
  const user = db.prepare('SELECT * FROM user_accounts WHERE id = ?;').get(userId);
  if (!user) return { success: false, error: 'User tidak ditemukan' };

  if (oldPassword) {
    const isValid = verifyPassword(oldPassword, user.password_hash, user.salt);
    if (!isValid) return { success: false, error: 'Password lama salah' };
  }

  if (!newPassword || newPassword.length < 5) {
    return { success: false, error: 'Password baru minimal 5 karakter' };
  }

  const { hash, salt } = hashPassword(newPassword);
  db.prepare('UPDATE user_accounts SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;')
    .run(hash, salt, userId);

  addAuditLog({
    action: 'PASSWORD_CHANGE',
    entity: 'user_accounts',
    entityId: userId,
    userName: user.username,
    userRole: user.system_role,
    module: 'AUTH',
    status: 'SUCCESS',
    details: `Password akun pengguna ${user.username} berhasil diubah.`
  });

  return { success: true };
}

export function listUserAccounts() {
  const db = getDatabase();
  return db.prepare(`
    SELECT id, employee_id, email, username, role, system_role, status, last_login, created_at 
    FROM user_accounts 
    ORDER BY created_at ASC;
  `).all();
}


export function seedRealisticAuditLogs(db) {
  const seedItems = [
    {
      timestamp: '2026-09-06 08:00:00',
      userName: 'System Initialization',
      userNik: 'SYS-INIT',
      userRole: 'system',
      action: 'INIT_DATABASE',
      module: 'SYSTEM',
      entity: 'database',
      entityId: 'hris.sqlite',
      details: 'Inisialisasi awal database SQLite hris.sqlite untuk PRIME HRIS Enterprise.',
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      metadata: JSON.stringify({ version: '1.0.0', platform: 'PRIME HRIS Enterprise' })
    },
    {
      timestamp: '2026-09-07 08:15:30',
      userName: 'Galih Primananda',
      userNik: 'PRIME-2022-001',
      userRole: 'admin',
      action: 'CHECKIN_WFO',
      module: 'ATTENDANCE',
      entity: 'attendances',
      entityId: 'ATT-20260907-001',
      details: 'Presensi On-Site WFO shift pagi berhasil diverifikasi di kantor pusat.',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ wifi: 'PRIME-Corporate-5G' })
    },
    {
      timestamp: '2026-09-07 09:00:15',
      userName: 'Direksi PT Prime',
      userNik: 'PRIME-2021-001',
      userRole: 'superuser',
      action: 'AUTH_LOGIN',
      module: 'AUTH',
      entity: 'user_accounts',
      entityId: 'USR-004',
      details: 'Login superuser (Direksi) dari IP terpercaya Gateway Utama.',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ role: 'Director', systemRole: 'superuser' })
    },
    {
      timestamp: '2026-09-07 16:45:00',
      userName: 'System Backup Daemon',
      userNik: 'SYS-DAEMON',
      userRole: 'system',
      action: 'DATABASE_BACKUP',
      module: 'SYSTEM',
      entity: 'database',
      entityId: 'hris.sqlite',
      details: 'Snapshot harian database hris.sqlite berhasil disimpan ke direktori backup DEV20.',
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      metadata: JSON.stringify({ destination: 'D:/0 Running apps/dev20-db-backup/snapshots' })
    },
    {
      timestamp: '2026-09-08 08:20:10',
      userName: 'Ahmad Fauzi',
      userNik: 'PRIME-2022-003',
      userRole: 'staff',
      action: 'CHECKIN_WFO',
      module: 'ATTENDANCE',
      entity: 'attendances',
      entityId: 'ATT-20260908-002',
      details: 'Presensi selfie WFO berhasil dicatat tepat waktu pukul 08:20 WIB.',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ checkInTime: '08:20:10', onTime: true })
    },
    {
      timestamp: '2026-09-08 10:30:00',
      userName: 'Siti Nurhaliza',
      userNik: 'PRIME-2022-002',
      userRole: 'admin',
      action: 'SIMULATE_PAYROLL',
      module: 'PAYROLL',
      entity: 'payroll',
      entityId: 'SIM-001',
      details: 'Menjalankan simulasi interim formula lembur Depnaker 1/173 untuk 8 karyawan aktif.',
      ipAddress: '192.168.3.122',
      status: 'SUCCESS',
      metadata: JSON.stringify({ formula: '1/173 * Upah Pokok', activeEmployees: 8 })
    },
    {
      timestamp: '2026-09-08 14:00:25',
      userName: 'Budi Santoso',
      userNik: 'PRIME-2022-005',
      userRole: 'admin',
      action: 'APPROVAL_REJECTED',
      module: 'APPROVALS',
      entity: 'approvals',
      entityId: 'REIMB-9021',
      details: 'Menolak klaim reimbursement REIMB-9021. Alasan: Nota kuitansi tidak memiliki stempel resmi vendor.',
      ipAddress: '103.31.205.218',
      status: 'FAILED',
      metadata: JSON.stringify({ reason: 'Nota kuitansi tidak memiliki stempel resmi vendor', amount: 180000 })
    },
    {
      timestamp: '2026-09-08 17:10:00',
      userName: 'Galih Primananda',
      userNik: 'PRIME-2022-001',
      userRole: 'admin',
      action: 'PAYSLIP_PRINTED',
      module: 'PAYROLL',
      entity: 'payroll',
      entityId: 'SLIP-001',
      details: 'Mencetak Slip Gaji Resmi digital periode September 2026 ber-QR code validasi Direksi.',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ period: 'September 2026', employeeNik: 'PRIME-2022-001' })
    },
    {
      timestamp: '2026-09-09 08:15:00',
      userName: 'Galih Primananda',
      userNik: 'PRIME-2022-001',
      userRole: 'admin',
      action: 'CHECKIN_WFO',
      module: 'ATTENDANCE',
      entity: 'attendances',
      entityId: 'ATT-20260909-001',
      details: 'Presensi On-Site WFO berhasil divalidasi. Kamera cerdas mendeteksi wajah dengan rasio 1:1.',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ distanceMeters: 14, wifi: 'PRIME-Corporate-5G' })
    },
    {
      timestamp: '2026-09-09 08:35:12',
      userName: 'Doni Prasetyo',
      userNik: 'PRIME-2023-012',
      userRole: 'staff',
      action: 'CHECKIN_WFO',
      module: 'ATTENDANCE',
      entity: 'attendances',
      entityId: 'ATT-20260909-006',
      details: 'Presensi terlambat 5 menit. Alasan: Kemacetan perlintasan jalur logistik industri Manyar.',
      ipAddress: '103.31.205.218',
      status: 'WARNING',
      metadata: JSON.stringify({ lateMinutes: 5, reason: 'Kemacetan perlintasan jalur logistik industri Manyar' })
    },
    {
      timestamp: '2026-09-09 10:05:18',
      userName: 'Direksi PT Prime',
      userNik: 'PRIME-2021-001',
      userRole: 'superuser',
      action: 'GEOFENCE_UPDATE',
      module: 'HR_RULES',
      entity: 'salary_rules',
      entityId: 'default',
      details: 'Pembaruan titik koordinat Geofence: Lat -7.118942, Lng 112.584319, radius 350 meter (Kawasan Kantor Pusat & Hub PRIME).',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ lat: -7.118942, lng: 112.584319, radiusMeters: 350 })
    },
    {
      timestamp: '2026-09-09 11:20:45',
      userName: 'System Watchdog',
      userNik: 'SYS-DAEMON',
      userRole: 'system',
      action: 'INTEGRITY_CHECK',
      module: 'SYSTEM',
      entity: 'database',
      entityId: 'hris.sqlite',
      details: 'Pemeriksaan integritas basis data SQLite hris.sqlite: WAL mode aktif, zero corrupted pages terdeteksi.',
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      metadata: JSON.stringify({ journalMode: 'wal', integrity: 'ok', sizeKb: 145 })
    },
    {
      timestamp: '2026-09-09 14:15:05',
      userName: 'Siti Nurhaliza',
      userNik: 'PRIME-2022-002',
      userRole: 'admin',
      action: 'APPROVAL_APPROVED',
      module: 'APPROVALS',
      entity: 'approvals',
      entityId: 'APPR-002',
      details: 'Menyetujui klaim reimbursement konsumsi lembur proyek PT Freeport Indonesia sebesar Rp 375.000.',
      ipAddress: '192.168.3.122',
      status: 'SUCCESS',
      metadata: JSON.stringify({ amount: 375000, project: 'PT Freeport Indonesia' })
    },
    {
      timestamp: '2026-09-09 15:40:22',
      userName: 'Galih Primananda',
      userNik: 'PRIME-2022-001',
      userRole: 'admin',
      action: 'SAVE_EMPLOYEE',
      module: 'EMPLOYEES',
      entity: 'employees',
      entityId: 'EMP-007',
      details: 'Pembaruan nomor rekening bank & validasi MAC Address hardware (FC:FB:FB:12:34:56) untuk karyawan Doni Prasetyo.',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ employeeId: 'EMP-007', macAddress: 'FC:FB:FB:12:34:56' })
    },
    {
      timestamp: '2026-09-09 16:30:00',
      userName: 'Rahmat Hidayat',
      userNik: 'PRIME-2023-014',
      userRole: 'staff',
      action: 'SUBMIT_REIMBURSEMENT',
      module: 'PAYROLL',
      entity: 'reimbursements',
      entityId: 'REIMB-4412',
      details: 'Mengajukan klaim reimbursement: "BBM Mobil Operasional Kunjungan Smelter Manyar" sebesar Rp 250.000 (Proyek PRIME-ENG-01).',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ amount: 250000, category: 'TRANSPORT_BBM', project: 'PRIME-ENG-01' })
    },
    {
      timestamp: '2026-09-09 17:05:12',
      userName: 'Budi Santoso',
      userNik: 'PRIME-2022-005',
      userRole: 'admin',
      action: 'CHECKOUT_WFO',
      module: 'ATTENDANCE',
      entity: 'attendances',
      entityId: 'ATT-20260909-002',
      details: 'Check-out kepulangan shift reguler berhasil dicatat. Total durasi kerja efektif: 8 jam 50 menit.',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ durationHours: 8.83, workTime: '08:15 - 17:05' })
    },
    {
      timestamp: '2026-09-10 07:55:18',
      userName: 'Hendra Wijaya',
      userNik: 'PRIME-2023-009',
      userRole: 'staff',
      action: 'CHECKIN_DINAS_LUAR',
      module: 'ATTENDANCE',
      entity: 'attendances',
      entityId: 'ATT-20260910-005',
      details: 'Presensi Dinas Luar Mendadak diajukan: PT Vale Indonesia Sorowako Mill Site. Disposisi diajukan ke manajer.',
      ipAddress: '114.122.45.89',
      status: 'SUCCESS',
      metadata: JSON.stringify({ client: 'PT Vale Indonesia Tbk', destination: 'Sorowako Mill Site' })
    },
    {
      timestamp: '2026-09-10 08:12:30',
      userName: 'Galih Primananda',
      userNik: 'PRIME-2022-001',
      userRole: 'admin',
      action: 'CHECKIN_WFO',
      module: 'ATTENDANCE',
      entity: 'attendances',
      entityId: 'ATT-20260910-001',
      details: 'Presensi On-Site WFO berhasil divalidasi melalui Gateway Utama PRIME. Koordinat GPS akurat (akurasi 5.2m).',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ distanceMeters: 15, wifi: 'PRIME-Corporate-5G', auditHash: '#901233' })
    },
    {
      timestamp: '2026-09-10 08:18:02',
      userName: 'Budi Santoso',
      userNik: 'PRIME-2022-005',
      userRole: 'admin',
      action: 'CHECKIN_WFO',
      module: 'ATTENDANCE',
      entity: 'attendances',
      entityId: 'ATT-20260910-002',
      details: 'Presensi selfie WFO berhasil diverifikasi. Watermark audit hash #789211 terekam dalam database.',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ distanceMeters: 28, wifi: 'PRIME-Corporate-5G', auditHash: '#789211' })
    },
    {
      timestamp: '2026-09-10 08:25:44',
      userName: 'Ahmad Fauzi',
      userNik: 'PRIME-2022-003',
      userRole: 'staff',
      action: 'CHECKIN_WFO',
      module: 'ATTENDANCE',
      entity: 'attendances',
      entityId: 'ATT-20260910-003',
      details: 'Presensi selfie WFO berhasil diverifikasi. Jarak GPS: 42 meter dari pusat Geofence kantor. SSID: PRIME-Corporate-5G.',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ distanceMeters: 42, wifi: 'PRIME-Corporate-5G', auditHash: '#892144' })
    },
    {
      timestamp: '2026-09-10 08:32:10',
      userName: 'Rahmat Hidayat',
      userNik: 'PRIME-2023-014',
      userRole: 'staff',
      action: 'CHECKIN_WFO',
      module: 'ATTENDANCE',
      entity: 'attendances',
      entityId: 'ATT-20260910-004',
      details: 'Presensi WFO tercatat pukul 08:32 WIB (Terlambat 2 menit di luar batas toleransi 08:30 WIB). Disposisi justifikasi otomatis dibuat.',
      ipAddress: '103.31.205.218',
      status: 'WARNING',
      metadata: JSON.stringify({ checkInTime: '08:32:10', lateMinutes: 2, tolerance: '08:30' })
    },
    {
      timestamp: '2026-09-10 09:15:40',
      userName: 'Siti Nurhaliza',
      userNik: 'PRIME-2022-002',
      userRole: 'admin',
      action: 'EXPORT_PAYROLL',
      module: 'PAYROLL',
      entity: 'payroll',
      entityId: 'PAY-SEP-2026',
      details: 'Ekspor berkas konsolidasi payroll periode September 2026 ke format CSV untuk audit perbankan.',
      ipAddress: '192.168.3.122',
      status: 'SUCCESS',
      metadata: JSON.stringify({ format: 'CSV', recordCount: 8, totalDisbursement: 61850000 })
    },
    {
      timestamp: '2026-09-10 10:30:15',
      userName: 'Direksi PT Prime',
      userNik: 'PRIME-2021-001',
      userRole: 'superuser',
      action: 'UPDATE_SALARY_RULES',
      module: 'HR_RULES',
      entity: 'salary_rules',
      entityId: 'default',
      details: 'Pembaruan toleransi keterlambatan 15 menit dan verifikasi subnet Gateway Utama PRIME (103.31.205.0/24).',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ gracePeriod: 15, subnet: '103.31.205.0/24' })
    },
    {
      timestamp: '2026-09-10 11:45:10',
      userName: 'Galih Primananda',
      userNik: 'PRIME-2022-001',
      userRole: 'admin',
      action: 'APPROVAL_APPROVED',
      module: 'APPROVALS',
      entity: 'approvals',
      entityId: 'APPR-001',
      details: 'Menyetujui pengajuan Cuti Tahunan untuk Ahmad Fauzi (3 hari kerja). Catatan: Disetujui, pekerjaan telah di-handover.',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ applicant: 'Ahmad Fauzi', days: 3, category: 'CUTI_TAHUNAN' })
    },
    {
      timestamp: '2026-09-10 12:15:22',
      userName: 'Galih Primananda',
      userNik: 'PRIME-2022-001',
      userRole: 'admin',
      action: 'AUTH_LOGIN',
      module: 'AUTH',
      entity: 'user_accounts',
      entityId: 'USR-001',
      details: 'Login berhasil ke sesi HRIS Enterprise melalui Google Chrome (WFO Terverifikasi).',
      ipAddress: '103.31.205.218',
      status: 'SUCCESS',
      metadata: JSON.stringify({ browser: 'Chrome 128', platform: 'Windows 11 NT' })
    }
  ];

  const insert = db.prepare(`
    INSERT INTO audit_logs (
      action, entity, entityId, details,
      userName, userNik, userRole, module,
      ipAddress, status, metadata, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);

  for (const item of seedItems) {
    insert.run(
      item.action,
      item.entity,
      item.entityId,
      item.details,
      item.userName,
      item.userNik,
      item.userRole,
      item.module,
      item.ipAddress,
      item.status,
      item.metadata,
      item.timestamp
    );
  }
  console.log('[SQLite] 25 rekaman audit log awal berhasil di-seed.');
}

export function addAuditLog(entry) {
  const db = getDatabase();
  const pad = n => String(n).padStart(2, '0');
  const d = new Date();
  const localNow = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const now = entry.timestamp || localNow;
  const metaStr = entry.metadata ? (typeof entry.metadata === 'string' ? entry.metadata : JSON.stringify(entry.metadata)) : null;

  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      action, entity, entityId, details,
      userName, userNik, userRole, module,
      ipAddress, status, metadata, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);

  stmt.run(
    entry.action || 'ACTIVITY',
    entry.entity || 'SYSTEM',
    entry.entityId || null,
    entry.details || '',
    entry.userName || 'System',
    entry.userNik || null,
    entry.userRole || 'system',
    entry.module || 'SYSTEM',
    entry.ipAddress || '127.0.0.1',
    entry.status || 'SUCCESS',
    metaStr,
    now
  );
}

export function getAuditLogsPaginated({
  page = 1,
  limit = 10,
  search = '',
  module = '',
  role = '',
  status = ''
} = {}) {
  const db = getDatabase();
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (safePage - 1) * safeLimit;

  let whereClauses = [];
  let params = [];

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    whereClauses.push(`(
      LOWER(details) LIKE ? OR
      LOWER(userName) LIKE ? OR
      LOWER(COALESCE(userNik, '')) LIKE ? OR
      LOWER(action) LIKE ? OR
      LOWER(COALESCE(ipAddress, '')) LIKE ?
    )`);
    params.push(term, term, term, term, term);
  }

  if (module && module !== 'ALL') {
    whereClauses.push(`module = ?`);
    params.push(module);
  }

  if (role && role !== 'ALL') {
    whereClauses.push(`LOWER(userRole) = ?`);
    params.push(role.toLowerCase());
  }

  if (status && status !== 'ALL') {
    whereClauses.push(`status = ?`);
    params.push(status);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM audit_logs ${whereSql};`).get(...params);
  const totalRows = countRow?.total || 0;
  const totalPages = Math.ceil(totalRows / safeLimit) || 1;

  const rows = db.prepare(`
    SELECT * FROM audit_logs
    ${whereSql}
    ORDER BY timestamp DESC, id DESC
    LIMIT ? OFFSET ?;
  `).all(...params, safeLimit, offset);

  return {
    logs: rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalRows,
      totalPages,
      hasMore: safePage < totalPages
    }
  };
}
