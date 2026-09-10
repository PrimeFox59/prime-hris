import {
  Employee,
  Project,
  AttendanceRecord,
  ApprovalItem,
  SalaryRuleConfig,
  ReimbursementClaim,
  AuthUser,
  AuditLogItem,
  PaginatedAuditLogs
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

let currentAuthToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('prime_hris_token') : null;

export const api = {
  setAuthToken(token: string | null) {
    currentAuthToken = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('prime_hris_token', token);
      else localStorage.removeItem('prime_hris_token');
    }
  },

  getAuthToken(): string | null {
    return currentAuthToken;
  },

  getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (currentAuthToken) {
      headers['Authorization'] = `Bearer ${currentAuthToken}`;
    }
    return headers;
  },

  // 0. Auth Endpoints
  async login(identifier: string, password: string): Promise<{ success: boolean; token: string; user: AuthUser }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal login. Periksa kembali email/username dan password.');
    }
    api.setAuthToken(data.token);
    return data;
  },

  async getMe(): Promise<{ success: boolean; user: AuthUser }> {
    if (!currentAuthToken) {
      throw new Error('No auth token');
    }
    const res = await fetch('/api/auth/me', {
      headers: api.getAuthHeaders()
    });
    if (!res.ok) {
      api.setAuthToken(null);
      throw new Error('Sesi telah berakhir atau tidak valid');
    }
    return res.json();
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: api.getAuthHeaders()
      });
    } catch (e) {}
    api.setAuthToken(null);
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: api.getAuthHeaders(),
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal mengubah password');
    return data;
  },

  async getAccounts(): Promise<{ success: boolean; accounts: any[] }> {
    const res = await fetch('/api/auth/accounts', {
      headers: api.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Gagal memuat akun pengguna');
    return res.json();
  },

  // 1. Load all data from SQLite
  async getBootstrapData(): Promise<BootstrapResponse> {
    const res = await fetch('/api/bootstrap', {
      headers: api.getAuthHeaders()
    });
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
      headers: api.getAuthHeaders(),
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
    reviewedBy: string = 'Direksi / HR Lead'
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

  // 5b. Save/Update Project in SQLite
  async saveProject(project: Project): Promise<{ success: boolean; project: Project }> {
    const res = await fetch('/api/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    if (!res.ok) {
      throw new Error(`Gagal menyimpan data proyek ke SQLite: ${res.statusText}`);
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
  },

  // 10. Audit Logs with 10-Item Infinite Scroll Pagination
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    search?: string;
    module?: string;
    role?: string;
    status?: string;
  } = {}): Promise<PaginatedAuditLogs> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    query.set('limit', String(params.limit || 10)); // Default 10 per request
    if (params.search) query.set('search', params.search);
    if (params.module && params.module !== 'ALL') query.set('module', params.module);
    if (params.role && params.role !== 'ALL') query.set('role', params.role);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);

    const res = await fetch(`/api/audit-logs?${query.toString()}`, {
      headers: api.getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Gagal memuat audit log: ${res.statusText}`);
    }
    return res.json();
  },

  // 11. Client Activity Logger
  async logActivity(entry: {
    action: string;
    entity?: string;
    entityId?: string;
    details: string;
    userName?: string;
    userNik?: string;
    userRole?: string;
    module?: string;
    ipAddress?: string;
    status?: 'SUCCESS' | 'WARNING' | 'FAILED';
    metadata?: any;
  }): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: api.getAuthHeaders(),
        body: JSON.stringify(entry)
      });
      return res.json();
    } catch (e) {
      console.warn('[Audit Logger Warning]', e);
      return { success: false };
    }
  }
};
