import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
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
}

export function seedInitialData(db) {
  console.log('[SQLite] Inisialisasi & Seeding data awal PT Dwi Martha Jaya...');
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
  seedInitialData(db);
  return getAllData();
}
