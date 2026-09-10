import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  INITIAL_EMPLOYEES,
  INITIAL_PROJECTS,
  INITIAL_ATTENDANCE,
  INITIAL_APPROVALS,
  INITIAL_SALARY_RULES,
  INITIAL_REIMBURSEMENTS
} from '../src/data/mockData.ts';
import type {
  Employee,
  Project,
  AttendanceRecord,
  ApprovalItem,
  SalaryRuleConfig,
  ReimbursementClaim
} from '../src/types/index.ts';

// Determine root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');
const dbPath = path.join(dataDir, 'hris.sqlite');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
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

function initializeSchema(db: DatabaseSync) {
  // Enterprise SQLite configuration
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Employees Table
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

  // 2. Projects Table
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

  // 3. Attendances Table
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

  // 4. Approvals Table
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

  // 5. Reimbursements Table
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

  // 6. Salary Rules Config Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS salary_rules (
      id TEXT PRIMARY KEY,
      config_json TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Audit Logs Table
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

  // Auto-seed if database is new or empty
  const empCount = (db.prepare('SELECT count(*) as count FROM employees;').get() as any)?.count || 0;
  if (empCount === 0) {
    seedInitialData(db);
  }
}

export function seedInitialData(db: DatabaseSync) {
  console.log('[SQLite] Inisialisasi awal & seeding database hris.sqlite...');

  // 1. Seed Employees
  const insertEmp = db.prepare(`
    INSERT OR REPLACE INTO employees (
      id, nik, name, email, phone, role, department, position,
      employmentType, joinDate, assignedProjectId, baseSalary,
      fixedAllowance, dailyAllowance, leaveQuota, usedLeave,
      bankAccount, avatar, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  for (const emp of INITIAL_EMPLOYEES) {
    insertEmp.run(
      emp.id,
      emp.nik,
      emp.name,
      emp.email,
      emp.phone,
      emp.role,
      emp.department,
      emp.position,
      emp.employmentType,
      emp.joinDate,
      emp.assignedProjectId,
      emp.baseSalary,
      emp.fixedAllowance,
      emp.dailyAllowance,
      emp.leaveQuota,
      emp.usedLeave,
      JSON.stringify(emp.bankAccount),
      emp.avatar,
      JSON.stringify(emp)
    );
  }

  // 2. Seed Projects
  const insertProj = db.prepare(`
    INSERT OR REPLACE INTO projects (
      id, code, name, client, location, status, startDate,
      targetEndDate, allocatedBudget, actualLaborCost, projectedLaborCost,
      totalEstimatedHours, actualHoursSpent, hourlyRateMultiplier, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  for (const proj of INITIAL_PROJECTS) {
    insertProj.run(
      proj.id,
      proj.code,
      proj.name,
      proj.client,
      proj.location,
      proj.status,
      proj.startDate,
      proj.targetEndDate,
      proj.allocatedBudget,
      proj.actualLaborCost,
      proj.projectedLaborCost,
      proj.totalEstimatedHours,
      proj.actualHoursSpent,
      proj.hourlyRateMultiplier,
      JSON.stringify(proj)
    );
  }

  // 3. Seed Attendances
  const insertAtt = db.prepare(`
    INSERT OR REPLACE INTO attendances (
      id, employeeId, employeeName, employeeNik, department,
      date, checkInTime, checkOutTime, mode, status,
      photoUrl, isLate, lateMinutes, lateReason,
      approvalStatus, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  for (const att of INITIAL_ATTENDANCE) {
    insertAtt.run(
      att.id,
      att.employeeId,
      att.employeeName,
      att.employeeNik,
      att.department,
      att.date,
      att.checkInTime,
      att.checkOutTime || null,
      att.mode,
      att.status,
      att.photoUrl,
      att.isLate ? 1 : 0,
      att.lateMinutes,
      att.lateReason || null,
      att.approvalStatus,
      JSON.stringify(att)
    );
  }

  // 4. Seed Approvals
  const insertAppr = db.prepare(`
    INSERT OR REPLACE INTO approvals (
      id, type, employeeId, employeeName, employeeNik, department,
      title, description, startDate, endDate, daysCount, lateMinutes,
      status, submittedAt, reviewedBy, reviewedAt, reviewNote, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  for (const appr of INITIAL_APPROVALS) {
    insertAppr.run(
      appr.id,
      appr.type,
      appr.employeeId,
      appr.employeeName,
      appr.employeeNik,
      appr.department,
      appr.title,
      appr.description,
      appr.startDate,
      appr.endDate || null,
      appr.daysCount || null,
      appr.lateMinutes || null,
      appr.status,
      appr.submittedAt,
      appr.reviewedBy || null,
      appr.reviewedAt || null,
      appr.reviewNote || null,
      JSON.stringify(appr)
    );
  }

  // 5. Seed Reimbursements
  const insertReimb = db.prepare(`
    INSERT OR REPLACE INTO reimbursements (
      id, employeeId, employeeName, employeeNik, category,
      title, description, amount, date, receiptAttachment,
      projectId, projectName, status, submittedAt,
      reviewedBy, reviewedAt, rejectReason, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  for (const reimb of INITIAL_REIMBURSEMENTS) {
    insertReimb.run(
      reimb.id,
      reimb.employeeId,
      reimb.employeeName,
      reimb.employeeNik,
      reimb.category,
      reimb.title,
      reimb.description,
      reimb.amount,
      reimb.date,
      reimb.receiptAttachment || null,
      reimb.projectId || null,
      reimb.projectName || null,
      reimb.status,
      reimb.submittedAt,
      reimb.reviewedBy || null,
      reimb.reviewedAt || null,
      reimb.rejectReason || null,
      JSON.stringify(reimb)
    );
  }

  // 6. Seed Salary Rules
  const insertRules = db.prepare(`
    INSERT OR REPLACE INTO salary_rules (id, config_json, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP);
  `);
  insertRules.run('default', JSON.stringify(INITIAL_SALARY_RULES));

  // Log to audit trail
  const insertLog = db.prepare(`
    INSERT INTO audit_logs (action, entity, entityId, details)
    VALUES (?, ?, ?, ?);
  `);
  insertLog.run(
    'INIT_DATABASE',
    'DATABASE',
    'hris.sqlite',
    'Initial database seeding executed successfully for PRIME HRIS Enterprise'
  );

  console.log('[SQLite] Seeding selesai! Database hris.sqlite siap digunakan.');
}

// ==========================================
// CRUD Query Functions
// ==========================================

export function getAllData() {
  const db = getDatabase();

  const employees: Employee[] = (db.prepare('SELECT data_json FROM employees ORDER BY name ASC;').all() as any[])
    .map(row => JSON.parse(row.data_json));

  const projects: Project[] = (db.prepare('SELECT data_json FROM projects ORDER BY code ASC;').all() as any[])
    .map(row => JSON.parse(row.data_json));

  const attendances: AttendanceRecord[] = (db.prepare('SELECT data_json FROM attendances ORDER BY date DESC, checkInTime DESC;').all() as any[])
    .map(row => JSON.parse(row.data_json));

  const approvals: ApprovalItem[] = (db.prepare('SELECT data_json FROM approvals ORDER BY submittedAt DESC;').all() as any[])
    .map(row => JSON.parse(row.data_json));

  const reimbursements: ReimbursementClaim[] = (db.prepare('SELECT data_json FROM reimbursements ORDER BY submittedAt DESC;').all() as any[])
    .map(row => JSON.parse(row.data_json));

  const rulesRow = db.prepare('SELECT config_json FROM salary_rules WHERE id = ?;').get('default') as any;
  const salaryRules: SalaryRuleConfig = rulesRow ? JSON.parse(rulesRow.config_json) : INITIAL_SALARY_RULES;

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

export function saveAttendance(record: AttendanceRecord): { success: boolean; record: AttendanceRecord } {
  const db = getDatabase();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO attendances (
      id, employeeId, employeeName, employeeNik, department,
      date, checkInTime, checkOutTime, mode, status,
      photoUrl, isLate, lateMinutes, lateReason,
      approvalStatus, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);

  insert.run(
    record.id,
    record.employeeId,
    record.employeeName,
    record.employeeNik,
    record.department,
    record.date,
    record.checkInTime,
    record.checkOutTime || null,
    record.mode,
    record.status,
    record.photoUrl,
    record.isLate ? 1 : 0,
    record.lateMinutes,
    record.lateReason || null,
    record.approvalStatus,
    JSON.stringify(record)
  );

  // If this attendance needs approval (Dinas Luar or Late), create approval item in SQLite
  if (record.approvalStatus === 'PENDING') {
    const isDinasLuar = record.mode === 'DINAS_LUAR';
    const approvalId = `APPR-${record.id}`;
    const approvalItem: ApprovalItem = {
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

    const insertAppr = db.prepare(`
      INSERT OR REPLACE INTO approvals (
        id, type, employeeId, employeeName, employeeNik, department,
        title, description, startDate, endDate, daysCount, lateMinutes,
        status, submittedAt, reviewedBy, reviewedAt, reviewNote, data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    insertAppr.run(
      approvalItem.id,
      approvalItem.type,
      approvalItem.employeeId,
      approvalItem.employeeName,
      approvalItem.employeeNik,
      approvalItem.department,
      approvalItem.title,
      approvalItem.description,
      approvalItem.startDate,
      null,
      null,
      approvalItem.lateMinutes || null,
      approvalItem.status,
      approvalItem.submittedAt,
      null,
      null,
      null,
      JSON.stringify(approvalItem)
    );
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (action, entity, entityId, details)
    VALUES (?, ?, ?, ?);
  `).run('INSERT_ATTENDANCE', 'attendances', record.id, `Presensi ${record.employeeName} (${record.mode}) berhasil disimpan ke SQLite`);

  return { success: true, record };
}

export function updateApproval(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  reviewNote?: string,
  reviewedBy: string = 'Direksi / HR Lead'
) {
  const db = getDatabase();
  const row = db.prepare('SELECT data_json FROM approvals WHERE id = ?;').get(id) as any;
  if (!row) {
    throw new Error(`Approval item with ID ${id} not found in SQLite database`);
  }

  const item: ApprovalItem = JSON.parse(row.data_json);
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

  // If tied to attendance record, update that attendance record too
  if (item.attendanceRecordId) {
    const attRow = db.prepare('SELECT data_json FROM attendances WHERE id = ?;').get(item.attendanceRecordId) as any;
    if (attRow) {
      const attRecord: AttendanceRecord = JSON.parse(attRow.data_json);
      attRecord.approvalStatus = status;
      attRecord.approvedBy = reviewedBy;
      attRecord.approvalDate = now;
      attRecord.approvalNote = reviewNote;

      if (status === 'APPROVED' && attRecord.status === 'LATE') {
        attRecord.status = 'ON_TIME'; // forgiven
      }

      db.prepare(`
        UPDATE attendances
        SET approvalStatus = ?, status = ?, data_json = ?
        WHERE id = ?;
      `).run(status, attRecord.status, JSON.stringify(attRecord), item.attendanceRecordId);
    }
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (action, entity, entityId, details)
    VALUES (?, ?, ?, ?);
  `).run('UPDATE_APPROVAL', 'approvals', id, `Approval ${id} diubah ke status ${status} oleh ${reviewedBy}`);

  return { success: true, item };
}

export function saveEmployee(emp: Employee) {
  const db = getDatabase();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO employees (
      id, nik, name, email, phone, role, department, position,
      employmentType, joinDate, assignedProjectId, baseSalary,
      fixedAllowance, dailyAllowance, leaveQuota, usedLeave,
      bankAccount, avatar, data_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
  `);

  insert.run(
    emp.id,
    emp.nik,
    emp.name,
    emp.email,
    emp.phone,
    emp.role,
    emp.department,
    emp.position,
    emp.employmentType,
    emp.joinDate,
    emp.assignedProjectId,
    emp.baseSalary,
    emp.fixedAllowance,
    emp.dailyAllowance,
    emp.leaveQuota,
    emp.usedLeave,
    JSON.stringify(emp.bankAccount),
    emp.avatar,
    JSON.stringify(emp)
  );

  db.prepare(`
    INSERT INTO audit_logs (action, entity, entityId, details)
    VALUES (?, ?, ?, ?);
  `).run('SAVE_EMPLOYEE', 'employees', emp.id, `Karyawan ${emp.name} (${emp.nik}) disimpan ke SQLite`);

  return { success: true, employee: emp };
}

export function saveSalaryRules(rules: SalaryRuleConfig) {
  const db = getDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO salary_rules (id, config_json, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP);
  `).run('default', JSON.stringify(rules));

  db.prepare(`
    INSERT INTO audit_logs (action, entity, entityId, details)
    VALUES (?, ?, ?, ?);
  `).run('SAVE_SALARY_RULES', 'salary_rules', 'default', 'Aturan gaji & IP Gateway diperbarui di SQLite');

  return { success: true, rules };
}

export function saveReimbursement(claim: ReimbursementClaim) {
  const db = getDatabase();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO reimbursements (
      id, employeeId, employeeName, employeeNik, category,
      title, description, amount, date, receiptAttachment,
      projectId, projectName, status, submittedAt,
      reviewedBy, reviewedAt, rejectReason, data_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
  `);

  insert.run(
    claim.id,
    claim.employeeId,
    claim.employeeName,
    claim.employeeNik,
    claim.category,
    claim.title,
    claim.description,
    claim.amount,
    claim.date,
    claim.receiptAttachment || null,
    claim.projectId || null,
    claim.projectName || null,
    claim.status,
    claim.submittedAt,
    claim.reviewedBy || null,
    claim.reviewedAt || null,
    claim.rejectReason || null,
    JSON.stringify(claim)
  );

  db.prepare(`
    INSERT INTO audit_logs (action, entity, entityId, details)
    VALUES (?, ?, ?, ?);
  `).run('SAVE_REIMBURSEMENT', 'reimbursements', claim.id, `Reimbursement ${claim.title} (Rp ${claim.amount}) disimpan ke SQLite`);

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
