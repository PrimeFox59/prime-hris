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
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

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

  db.prepare('INSERT INTO audit_logs (action, entity, entityId, details) VALUES (?, ?, ?, ?);')
    .run('INSERT_ATTENDANCE', 'attendances', record.id, `Presensi ${record.employeeName} (${record.mode}) berhasil disimpan`);

  return { success: true, record };
}

export function updateApproval(id, status, reviewNote, reviewedBy = 'Direksi / HR DMJ') {
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

  db.prepare('INSERT INTO audit_logs (action, entity, entityId, details) VALUES (?, ?, ?, ?);')
    .run('SAVE_EMPLOYEE', 'employees', emp.id, `Karyawan ${emp.name} disimpan`);

  return { success: true, employee: emp };
}

export function saveSalaryRules(rules) {
  const db = getDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO salary_rules (id, config_json, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP);
  `).run('default', JSON.stringify(rules));

  db.prepare('INSERT INTO audit_logs (action, entity, entityId, details) VALUES (?, ?, ?, ?);')
    .run('SAVE_SALARY_RULES', 'salary_rules', 'default', 'Aturan gaji diperbarui');

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

  db.prepare('INSERT INTO audit_logs (action, entity, entityId, details) VALUES (?, ?, ?, ?);')
    .run('SAVE_REIMBURSEMENT', 'reimbursements', claim.id, `Reimbursement ${claim.title} disimpan`);

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

  db.prepare('INSERT INTO audit_logs (action, entity, entityId, details) VALUES (?, ?, ?, ?);')
    .run('LOGIN_SUCCESS', 'user_accounts', user.id, `User ${user.username} (${user.role}) berhasil login`);

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

  db.prepare('INSERT INTO audit_logs (action, entity, entityId, details) VALUES (?, ?, ?, ?);')
    .run('CHANGE_PASSWORD', 'user_accounts', userId, `Password user ${user.username} diubah`);

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

