import { Employee, Project, PayrollRecord, SalaryRuleConfig, AttendanceRecord } from '../types';

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function calculateEmployeePayroll(
  employee: Employee,
  attendances: AttendanceRecord[],
  projects: Project[],
  rules: SalaryRuleConfig,
  periodStr: string = "September 2026"
): PayrollRecord {
  // Count attendance stats
  const empAttendances = attendances.filter(a => a.employeeId === employee.id);
  const presentDays = empAttendances.length > 0 ? empAttendances.length : 21; // fallback default
  const workingDays = rules.standardWorkDaysPerMonth;
  
  // Calculate unapproved late deductions
  const unapprovedLates = empAttendances.filter(a => a.isLate && a.approvalStatus !== 'APPROVED');
  const lateDays = unapprovedLates.length;
  let unapprovedLateDeduction = 0;
  unapprovedLates.forEach(late => {
    const blocks = Math.ceil(Math.max(0, late.lateMinutes - rules.lateGracePeriodMinutes) / 15);
    unapprovedLateDeduction += blocks * rules.latePenaltyPerBlock;
  });

  // Calculate Overtime
  // Assuming standard OT 10-18 hours for active engineers
  const hourlyBaseRate = Math.round(employee.baseSalary / rules.overtimeFormula.hourlyRateDivisor);
  const overtimeHours = employee.role === 'Director' ? 0 : 16; // 16 hours sample OT
  const overtimePay = Math.round(
    overtimeHours * (rules.overtimeFormula.subsequentHourRateMultiplier * hourlyBaseRate)
  );

  // Allowances
  const dailyAllowanceTotal = presentDays * (employee.dailyAllowance || rules.defaultDailyAllowance);
  const isRemoteSite = employee.assignedProjectId !== 'PRJ-HQ-04';
  const projectAllowance = isRemoteSite ? rules.remoteProjectAllowance : 0;
  const grossSalary = employee.baseSalary + employee.fixedAllowance + dailyAllowanceTotal + projectAllowance + overtimePay;

  // Deductions
  const bpjsKetenagakerjaan = Math.round(employee.baseSalary * rules.bpjsKetenagakerjaanRate);
  const bpjsKesehatan = Math.round(employee.baseSalary * rules.bpjsKesehatanRate);
  
  // Tax PPh 21 estimation (progressive basic tier 5% on taxable income after PTKP)
  const annualGross = grossSalary * 12;
  const ptkp = 54000000; // PTKP Single
  const taxableAnnual = Math.max(0, annualGross - ptkp - (bpjsKetenagakerjaan * 12));
  const pph21 = Math.round((taxableAnnual * 0.05) / 12);

  const totalDeductions = unapprovedLateDeduction + bpjsKetenagakerjaan + bpjsKesehatan + pph21;
  const netSalary = grossSalary - totalDeductions;

  // Project Allocation:
  // Primary project gets 75%, Secondary project or HQ gets 25%
  const primaryProject = projects.find(p => p.id === employee.assignedProjectId) || projects[0];
  const secondaryProject = projects.find(p => p.id !== employee.assignedProjectId) || projects[1];

  const projectAllocations = [
    {
      projectId: primaryProject.id,
      projectCode: primaryProject.code,
      projectName: primaryProject.name,
      allocatedHours: 125,
      allocatedCost: Math.round(grossSalary * 0.75),
      percentage: 75
    },
    {
      projectId: secondaryProject.id,
      projectCode: secondaryProject.code,
      projectName: secondaryProject.name,
      allocatedHours: 42,
      allocatedCost: Math.round(grossSalary * 0.25),
      percentage: 25
    }
  ];

  return {
    id: `PAY-${employee.id}-${periodStr.replace(/\s+/g, '')}`,
    employeeId: employee.id,
    employeeName: employee.name,
    nik: employee.nik,
    department: employee.department,
    position: employee.position,
    period: periodStr,
    workingDays,
    presentDays,
    lateDays,
    unapprovedLateDeduction,
    overtimeHours,
    overtimePay,
    baseSalary: employee.baseSalary,
    fixedAllowance: employee.fixedAllowance,
    dailyAllowanceTotal,
    projectAllowance,
    grossSalary,
    bpjsKetenagakerjaan,
    bpjsKesehatan,
    pph21,
    totalDeductions,
    netSalary,
    projectAllocations,
    status: 'APPROVED',
    paymentDate: '2026-09-25'
  };
}
