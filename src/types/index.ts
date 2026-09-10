export type UserRole = 'Employee' | 'HR_Manager' | 'Project_Manager' | 'Director';

export type SystemRole = 'superuser' | 'admin' | 'staff';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  systemRole: SystemRole;
  status: 'active' | 'suspended';
  employeeId?: string;
  lastLogin?: string;
  employee?: Employee | null;
}

export function getEffectiveSystemRole(emp?: { role: UserRole; systemRole?: SystemRole } | null): SystemRole {
  if (!emp) return 'staff';
  if (emp.systemRole) return emp.systemRole;
  if (emp.role === 'Director') return 'superuser';
  if (emp.role === 'HR_Manager' || emp.role === 'Project_Manager') return 'admin';
  return 'staff';
}

export type AttendanceMode = 'WFO' | 'DINAS_LUAR' | 'WFH';

export type AttendanceStatus = 'ON_TIME' | 'LATE' | 'DINAS_LUAR_PENDING' | 'WFH_APPROVED';

export interface Employee {
  id: string;
  nik: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  systemRole?: SystemRole; // RBAC: superuser | admin | staff
  department: string;
  position: string;
  employmentType: 'TETAP' | 'KONTRAK' | 'PROJECT_HIRE';
  joinDate: string;
  assignedProjectId: string;
  baseSalary: number;
  fixedAllowance: number;
  dailyAllowance: number;
  leaveQuota: number;
  usedLeave: number;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  deviceMac?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNik: string;
  department: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm:ss
  checkOutTime?: string;
  mode: AttendanceMode;
  status: AttendanceStatus;
  photoUrl: string;
  location: {
    lat: number;
    lng: number;
    accuracy: number;
    address: string;
    inGeofence: boolean;
    distanceMeters: number;
  };
  wifi: {
    connected: boolean;
    ssid: string;
    bssid: string;
    isAuthorized: boolean;
    ipAddress: string;
  };
  note: string;
  isLate: boolean;
  lateMinutes: number;
  lateReason?: string;
  dinasLuarDetails?: {
    destination: string;
    clientName: string;
    projectCode: string;
    purpose: string;
    isSudden: boolean;
  };
  approvalStatus: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvalDate?: string;
  approvalNote?: string;
}

export type LeaveType = 'CUTI_TAHUNAN' | 'CUTI_SAKIT' | 'CUTI_MELAHIRKAN' | 'CUTI_MENIKAH' | 'IZIN_KEPERLUAN_PRIBADI' | 'IZIN_DUKA';

export type ReimbursementCategory = 'TRANSPORT_BBM' | 'KONSUMSI_LEMBUR' | 'PENGINAPAN_SITE' | 'ALAT_MATERIAL' | 'MEDIS' | 'LAINNYA';

export interface ReimbursementClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNik: string;
  category: ReimbursementCategory;
  title: string;
  description: string;
  amount: number;
  date: string;
  receiptAttachment?: string;
  projectId?: string;
  projectName?: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectReason?: string;
}

export interface ApprovalItem {
  id: string;
  type: 'LEAVE' | 'PERMIT' | 'LATE_JUSTIFICATION' | 'DINAS_LUAR' | 'REIMBURSEMENT';
  employeeId: string;
  employeeName: string;
  employeeNik: string;
  department: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  daysCount?: number;
  lateMinutes?: number;
  leaveType?: LeaveType;
  reimbursementAmount?: number;
  proofAttachment?: string;
  attendanceRecordId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string;
  status: 'ACTIVE' | 'PLANNING' | 'COMPLETED';
  startDate: string;
  targetEndDate: string;
  allocatedBudget: number; // in IDR
  actualLaborCost: number; // in IDR
  projectedLaborCost: number; // in IDR
  totalEstimatedHours: number;
  actualHoursSpent: number;
  hourlyRateMultiplier: number;
}

export interface ProjectPayrollAllocation {
  projectId: string;
  projectCode: string;
  projectName: string;
  allocatedHours: number;
  allocatedCost: number;
  percentage: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  nik: string;
  department: string;
  position: string;
  period: string; // e.g. "September 2026"
  workingDays: number;
  presentDays: number;
  lateDays: number;
  unapprovedLateDeduction: number;
  overtimeHours: number;
  overtimePay: number;
  baseSalary: number;
  fixedAllowance: number;
  dailyAllowanceTotal: number;
  projectAllowance: number;
  grossSalary: number;
  bpjsKetenagakerjaan: number;
  bpjsKesehatan: number;
  pph21: number;
  totalDeductions: number;
  netSalary: number;
  projectAllocations: ProjectPayrollAllocation[];
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  paymentDate?: string;
}

export interface SalaryRuleConfig {
  standardWorkDaysPerMonth: number;
  standardHoursPerDay: number;
  cutoffTime: string; // e.g. "08:30"
  lateGracePeriodMinutes: number; // e.g. 15 mins
  latePenaltyPerBlock: number; // IDR per 15 min if unapproved
  overtimeFormula: {
    firstHourRateMultiplier: number; // e.g. 1.5
    subsequentHourRateMultiplier: number; // e.g. 2.0
    holidayRateMultiplier: number; // e.g. 2.0 - 3.0
    hourlyRateDivisor: number; // 173 as per Depnaker
  };
  bpjsKetenagakerjaanRate: number; // 3%
  bpjsKesehatanRate: number; // 1%
  defaultDailyAllowance: number; // IDR 50,000 / day
  remoteProjectAllowance: number; // IDR 1,500,000 / month
  authorizedWifiNetworks: Array<{
    ssid: string;
    bssid: string;
    locationName: string;
    description: string;
  }>;
  authorizedIpNetworks?: Array<{
    ipOrSubnet: string;
    label: string;
    isp: string;
    isRegisteredOffice: boolean;
  }>;
  officeGeofence: {
    name: string;
    lat: number;
    lng: number;
    radiusMeters: number;
    address: string;
  };
}

export interface CommercialProposal {
  title: string;
  client: string;
  vendor: string;
  version: string;
  date: string;
  packages: Array<{
    id: string;
    name: string;
    tagline: string;
    price: number;
    period: string;
    isPopular?: boolean;
    features: string[];
  }>;
}

export type AuditModule = 'AUTH' | 'ATTENDANCE' | 'APPROVALS' | 'EMPLOYEES' | 'PAYROLL' | 'HR_RULES' | 'SYSTEM';

export type AuditStatus = 'SUCCESS' | 'WARNING' | 'FAILED';

export interface AuditLogItem {
  id: number;
  timestamp: string;
  userName: string;
  userNik?: string;
  userRole: SystemRole | 'system';
  action: string;
  module: AuditModule;
  entity?: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
  status: AuditStatus;
  metadata?: string;
}

export interface PaginatedAuditLogs {
  logs: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    totalRows: number;
    totalPages: number;
    hasMore: boolean;
  };
}
