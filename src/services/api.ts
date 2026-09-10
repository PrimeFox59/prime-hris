import {
  Employee,
  Project,
  AttendanceRecord,
  ApprovalItem,
  SalaryRuleConfig,
  ReimbursementClaim
} from '../types';

export interface BootstrapResponse {
  employees: Employee[];
  projects: Project[];
  attendances: AttendanceRecord[];
  approvals: ApprovalItem[];
  reimbursements: ReimbursementClaim[];
  salaryRules: SalaryRuleConfig;
  dbInfo: {
    engine: string;
    journalMode: string;
    dbPath: string;
    sizeBytes: number;
    sizeKb: number;
  };
}

export const api = {
  // 1. Load all data from SQLite
  async getBootstrapData(): Promise<BootstrapResponse> {
    const res = await fetch('/api/bootstrap');
    if (!res.ok) {
      throw new Error(`Gagal memuat data dari SQLite: ${res.statusText}`);
    }
    return res.json();
  },

  // 2. Health & DB Info
  async getDatabaseInfo(): Promise<any> {
    const res = await fetch('/api/health');
    if (!res.ok) {
      throw new Error(`Gagal membaca status SQLite: ${res.statusText}`);
    }
    return res.json();
  },

  // 3. Save Attendance Record to SQLite
  async saveAttendance(record: AttendanceRecord): Promise<{ success: boolean; record: AttendanceRecord }> {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!res.ok) {
      throw new Error(`Gagal menyimpan presensi ke SQLite: ${res.statusText}`);
    }
    return res.json();
  },

  // 4. Update Approval in SQLite
  async updateApproval(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewNote?: string,
    reviewedBy: string = 'Direksi / HR DMJ'
  ): Promise<{ success: boolean; item: ApprovalItem }> {
    const res = await fetch('/api/approval', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, reviewNote, reviewedBy })
    });
    if (!res.ok) {
      throw new Error(`Gagal memperbarui status approval di SQLite: ${res.statusText}`);
    }
    return res.json();
  },

  // 5. Save/Update Employee in SQLite
  async saveEmployee(emp: Employee): Promise<{ success: boolean; employee: Employee }> {
    const res = await fetch('/api/employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emp)
    });
    if (!res.ok) {
      throw new Error(`Gagal menyimpan data karyawan ke SQLite: ${res.statusText}`);
    }
    return res.json();
  },

  // 6. Save Reimbursement Claim in SQLite
  async saveReimbursement(claim: ReimbursementClaim): Promise<{ success: boolean; claim: ReimbursementClaim }> {
    const res = await fetch('/api/reimbursement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claim)
    });
    if (!res.ok) {
      throw new Error(`Gagal menyimpan klaim reimbursement ke SQLite: ${res.statusText}`);
    }
    return res.json();
  },

  // 7. Save Salary Rules in SQLite
  async saveSalaryRules(rules: SalaryRuleConfig): Promise<{ success: boolean; rules: SalaryRuleConfig }> {
    const res = await fetch('/api/salary-rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules)
    });
    if (!res.ok) {
      throw new Error(`Gagal memperbarui aturan gaji di SQLite: ${res.statusText}`);
    }
    return res.json();
  },

  // 8. Reset SQLite database to default initial state
  async resetDatabase(): Promise<BootstrapResponse> {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Gagal me-reset database SQLite: ${res.statusText}`);
    }
    return res.json();
  },

  // 9. Download link for SQLite file
  getDownloadDbUrl(): string {
    return '/api/download-db';
  }
};
