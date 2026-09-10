import React, { useState, useMemo } from 'react';
import {
  User,
  Banknote,
  Clock,
  Calendar,
  Receipt,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Plus,
  FileText,
  Printer,
  ChevronRight,
  Wifi,
  MapPin,
  Sliders,
  Eye,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  Building,
  DollarSign,
  X,
  CreditCard,
  Briefcase
} from 'lucide-react';
import {
  Employee,
  Project,
  AttendanceRecord,
  ApprovalItem,
  SalaryRuleConfig,
  ReimbursementClaim,
  ReimbursementCategory
} from '../types';
import { calculateEmployeePayroll, formatIDR } from '../utils/payrollCalculator';

interface UserPerformanceTabProps {
  currentUser: Employee;
  employees: Employee[];
  projects: Project[];
  attendances: AttendanceRecord[];
  approvals: ApprovalItem[];
  salaryRules: SalaryRuleConfig;
  reimbursements: ReimbursementClaim[];
  onAddReimbursement: (claim: ReimbursementClaim) => void;
  onSubmitNewLeaveRequest: (item: ApprovalItem) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const UserPerformanceTab: React.FC<UserPerformanceTabProps> = ({
  currentUser,
  employees,
  projects,
  attendances,
  approvals,
  salaryRules,
  reimbursements,
  onAddReimbursement,
  onSubmitNewLeaveRequest,
  onNavigateToTab
}) => {
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'SALARY' | 'ATTENDANCE' | 'LEAVE' | 'REIMBURSE' | 'PROJECTION'>('OVERVIEW');
  const [isNewReimburseModalOpen, setIsNewReimburseModalOpen] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [simulatedOtHours, setSimulatedOtHours] = useState<number>(10);

  // Form states for new reimbursement
  const [reimbTitle, setReimbTitle] = useState('');
  const [reimbCategory, setReimbCategory] = useState<ReimbursementCategory>('TRANSPORT_BBM');
  const [reimbAmount, setReimbAmount] = useState<number>(250000);
  const [reimbDesc, setReimbDesc] = useState('');
  const [reimbProjectId, setReimbProjectId] = useState(currentUser.assignedProjectId || 'DMJ-ENG-01');

  // Filter personal data for currentUser
  const personalAttendances = useMemo(() => {
    return attendances.filter(a => a.employeeId === currentUser.id);
  }, [attendances, currentUser.id]);

  const todayAttendance = personalAttendances[0] || null;

  const personalApprovals = useMemo(() => {
    return approvals.filter(a => a.employeeId === currentUser.id);
  }, [approvals, currentUser.id]);

  const personalReimbursements = useMemo(() => {
    return reimbursements.filter(r => r.employeeId === currentUser.id);
  }, [reimbursements, currentUser.id]);

  // Calculate current official payroll for currentUser
  const personalPayroll = useMemo(() => {
    return calculateEmployeePayroll(currentUser, attendances, projects, salaryRules, "September 2026");
  }, [currentUser, attendances, projects, salaryRules]);

  // Assigned Project
  const assignedProject = projects.find(p => p.id === currentUser.assignedProjectId);

  // Leave stats
  const remainingLeave = Math.max(0, currentUser.leaveQuota - currentUser.usedLeave);
  const leavePercentage = Math.round((currentUser.usedLeave / currentUser.leaveQuota) * 100);

  // Attendance rate
  const totalCheckIns = personalAttendances.length;
  const onTimeCheckIns = personalAttendances.filter(a => !a.isLate && a.mode === 'WFO').length;
  const lateCheckIns = personalAttendances.filter(a => a.isLate).length;
  const dinasCheckIns = personalAttendances.filter(a => a.mode === 'DINAS_LUAR').length;

  // Salary Projection calculations
  const hourlyBaseRate = Math.round(currentUser.baseSalary / salaryRules.overtimeFormula.hourlyRateDivisor);
  const currentOtPay = personalPayroll.overtimePay;
  const simulatedAdditionalOtPay = Math.round(
    simulatedOtHours * (salaryRules.overtimeFormula.subsequentHourRateMultiplier * hourlyBaseRate)
  );
  const projectedNetSalary = personalPayroll.netSalary + simulatedAdditionalOtPay;

  // Submit new Reimbursement handler
  const handleCreateReimbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reimbTitle || reimbAmount <= 0) return;

    const selectedProj = projects.find(p => p.id === reimbProjectId);
    const newClaim: ReimbursementClaim = {
      id: `REIMB-${Date.now().toString().slice(-4)}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeNik: currentUser.nik,
      category: reimbCategory,
      title: reimbTitle,
      description: reimbDesc || 'Klaim biaya operasional lapangan.',
      amount: reimbAmount,
      date: new Date().toISOString().split('T')[0],
      projectId: reimbProjectId,
      projectName: selectedProj ? selectedProj.name : 'Workshop DMJ',
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    onAddReimbursement(newClaim);
    setIsNewReimburseModalOpen(false);
    setReimbTitle('');
    setReimbDesc('');
    setReimbAmount(250000);
  };

  return (
    <div className="space-y-6 motion-fade-in-up">
      
      {/* 1. Header Profile Banner for Current User */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FF6B00]/20 to-[#00E2B0]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#FF6B00] shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase font-mono-code shadow-xs">
                ONLINE
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="prime-cut-corner bg-[#FF6B00] text-white text-[10px] font-black px-2 py-0.5 tracking-wider uppercase font-mono-code">
                  PORTAL PERSONAL KARYAWAN
                </span>
                <span className="text-xs font-mono-code text-slate-400 font-bold">
                  {currentUser.nik}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono-code">
                  Status: {currentUser.employmentType}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {currentUser.name}
              </h1>

              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                <span>{currentUser.position}</span>
                <span>•</span>
                <span className="text-slate-400">{currentUser.department}</span>
                <span>•</span>
                <span className="text-[#FF8533] font-mono-code font-semibold">
                  ⚡ {assignedProject ? assignedProject.code : 'Workshop Pusat'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsSlipModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#00E2B0]" />
              Cetak Slip Gaji
            </button>
            <button
              onClick={() => setIsNewReimburseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8533] hover:from-[#e56000] text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajukan Reimburse
            </button>
          </div>
        </div>

        {/* Status Strip */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-mono-code text-slate-400 block uppercase">Presensi Hari Ini:</span>
            <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
              {todayAttendance ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{todayAttendance.checkInTime} WIB ({todayAttendance.status})</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Belum Check-In Hari Ini</span>
                </>
              )}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono-code text-slate-400 block uppercase">Sisa Kuota Cuti 2026:</span>
            <span className="font-bold text-emerald-400 font-mono-code text-sm mt-0.5">
              {remainingLeave} Hari <span className="text-[10px] text-slate-400 font-normal">/ {currentUser.leaveQuota} Hari</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono-code text-slate-400 block uppercase">Take Home Pay Terkini:</span>
            <span className="font-black text-[#FF8533] font-mono-code text-sm mt-0.5">
              {formatIDR(personalPayroll.netSalary)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono-code text-slate-400 block uppercase">Rekening Payroll:</span>
            <span className="font-semibold text-slate-300 truncate block mt-0.5">
              {currentUser.bankAccount.bankName} ({currentUser.bankAccount.accountNumber})
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs for User Performance */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Ringkasan Kinerja', icon: User },
          { id: 'SALARY', label: 'Cek Gaji & Slip', icon: Banknote },
          { id: 'ATTENDANCE', label: 'Presensi & Jam Kerja', icon: Clock },
          { id: 'LEAVE', label: `Sisa Cuti (${remainingLeave} Hari)`, icon: Calendar },
          { id: 'REIMBURSE', label: `Reimburse (${personalReimbursements.length})`, icon: Receipt },
          { id: 'PROJECTION', label: 'Proyeksi Gaji & Lembur', icon: TrendingUp }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#FF6B00] text-white shadow-xs scale-[1.02]'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB CONTENT 1: OVERVIEW (RINGKASAN CEPAT)
         ========================================================================= */}
      {activeSection === 'OVERVIEW' && (
        <div className="space-y-6 motion-fade-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="glass-card rounded-2xl p-5 border border-slate-200/80 card-interactive">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono-code block">
                Take Home Pay Bulan Ini
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono-code mt-1">
                {formatIDR(personalPayroll.netSalary)}
              </div>
              <button
                onClick={() => setActiveSection('SALARY')}
                className="mt-2 text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Rincian Slip Gaji <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* KPI 2 */}
            <div className="glass-card rounded-2xl p-5 border border-slate-200/80 card-interactive">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono-code block">
                Kehadiran & Disiplin Masuk
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono-code mt-1">
                {personalPayroll.presentDays} / 22 Hari
              </div>
              <span className="mt-2 text-xs text-slate-500 block">
                {lateCheckIns > 0 ? `${lateCheckIns}x Terlambat` : '100% Tepat Waktu'}
              </span>
            </div>

            {/* KPI 3 */}
            <div className="glass-card rounded-2xl p-5 border border-slate-200/80 card-interactive">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono-code block">
                Saldo Cuti Tersisa
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono-code mt-1">
                {remainingLeave} Hari
              </div>
              <button
                onClick={() => setActiveSection('LEAVE')}
                className="mt-2 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ajukan Cuti Baru <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* KPI 4 */}
            <div className="glass-card rounded-2xl p-5 border border-slate-200/80 card-interactive">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono-code block">
                Total Klaim Reimburse
              </span>
              <div className="text-xl sm:text-2xl font-black text-orange-600 font-mono-code mt-1">
                {formatIDR(personalReimbursements.reduce((acc, r) => acc + r.amount, 0))}
              </div>
              <button
                onClick={() => setActiveSection('REIMBURSE')}
                className="mt-2 text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {personalReimbursements.length} Klaim Tercatat <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick 2 Col Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Presensi Terkini */}
            <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF6B00]" />
                  Presensi Kamera Hari Ini
                </h3>
                <button
                  onClick={() => onNavigateToTab('attendance')}
                  className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
                >
                  Buka Kamera
                </button>
              </div>

              {todayAttendance ? (
                <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <img
                    src={todayAttendance.photoUrl}
                    alt="Selfie Presensi"
                    className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shrink-0"
                  />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-900">
                      Waktu Masuk: <span className="font-mono-code text-emerald-700">{todayAttendance.checkInTime} WIB</span>
                    </p>
                    <p className="text-slate-600 flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5 text-[#FF6B00]" />
                      WiFi: <span className="font-mono-code font-semibold">{todayAttendance.wifi.ssid}</span>
                    </p>
                    <p className="text-slate-500 truncate flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {todayAttendance.location.address}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center text-xs space-y-2">
                  <p className="font-bold text-amber-900">Anda belum melakukan presensi kamera hari ini.</p>
                  <p className="text-amber-700">Pastikan terhubung ke WiFi DMJ-Corporate-5G sebelum melakukan selfie check-in.</p>
                  <button
                    onClick={() => onNavigateToTab('attendance')}
                    className="px-4 py-2 rounded-xl bg-[#FF6B00] text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Buka Presensi Kamera
                  </button>
                </div>
              )}
            </div>

            {/* Proyeksi Gaji Singkat */}
            <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Proyeksi Gaji Periode Ini
                </h3>
                <button
                  onClick={() => setActiveSection('PROJECTION')}
                  className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
                >
                  Simulasi Lembur
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Estimasi Bersih (THP):</span>
                  <span className="font-mono-code font-black text-base text-slate-900">{formatIDR(personalPayroll.netSalary)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Jadwal Pencairan Kas:</span>
                  <span className="font-bold text-slate-800">25 September 2026</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Alokasi Beban Proyek:</span>
                  <span className="font-mono-code text-orange-700 font-bold">{assignedProject?.code || 'DMJ-ENG-01'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 2: CEK GAJI & SLIP GAJI
         ========================================================================= */}
      {activeSection === 'SALARY' && (
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-5 motion-fade-in-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-[#FF6B00]" />
                Rincian Penghasilan & Slip Gaji Karyawan
              </h2>
              <p className="text-xs text-slate-500">
                Periode: <strong>September 2026</strong> • Berdasarkan regulasi ketenagakerjaan Depnaker RI & SOP PT Dwi Martha Jaya.
              </p>
            </div>

            <button
              onClick={() => setIsSlipModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8533] text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Slip Gaji Resmi DMJ
            </button>
          </div>

          {/* Detailed Salary Component Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Penerimaan */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider font-mono-code border-b border-emerald-200 pb-1.5 flex items-center justify-between">
                <span>A. Penerimaan / Kompensasi</span>
                <span className="text-[10px] font-normal text-emerald-600">Hak Karyawan</span>
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Gaji Pokok:</span>
                  <span className="font-mono-code font-bold text-slate-900">{formatIDR(personalPayroll.baseSalary)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Tunjangan Tetap & Jabatan:</span>
                  <span className="font-mono-code font-bold text-slate-900">{formatIDR(personalPayroll.fixedAllowance)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Uang Makan ({personalPayroll.presentDays} Hari Hadir):</span>
                  <span className="font-mono-code font-bold text-slate-900">{formatIDR(personalPayroll.dailyAllowanceTotal)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Tunjangan Penugasan Proyek Site:</span>
                  <span className="font-mono-code font-bold text-slate-900">{formatIDR(personalPayroll.projectAllowance)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-orange-700 font-semibold">
                  <span>Upah Lembur ({personalPayroll.overtimeHours} Jam Depnaker):</span>
                  <span className="font-mono-code font-bold">+{formatIDR(personalPayroll.overtimePay)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-300 font-black text-slate-900 text-sm">
                  <span>Total Penghasilan Bruto:</span>
                  <span className="font-mono-code text-emerald-700">{formatIDR(personalPayroll.grossSalary)}</span>
                </div>
              </div>
            </div>

            {/* Potongan */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <h4 className="font-bold text-rose-800 text-xs uppercase tracking-wider font-mono-code border-b border-rose-200 pb-1.5 flex items-center justify-between">
                <span>B. Potongan & Kewajiban</span>
                <span className="text-[10px] font-normal text-rose-600">Pajak & Jamsostek</span>
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">BPJS Ketenagakerjaan (3% JHT/JKK):</span>
                  <span className="font-mono-code font-bold text-slate-900">{formatIDR(personalPayroll.bpjsKetenagakerjaan)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">BPJS Kesehatan (1%):</span>
                  <span className="font-mono-code font-bold text-slate-900">{formatIDR(personalPayroll.bpjsKesehatan)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Estimasi PPh 21 Pasal 21:</span>
                  <span className="font-mono-code font-bold text-slate-900">{formatIDR(personalPayroll.pph21)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
                  <span>Denda Keterlambatan Tanpa Izin:</span>
                  <span className="font-mono-code font-bold">-{formatIDR(personalPayroll.unapprovedLateDeduction)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-300 font-black text-slate-900 text-sm">
                  <span>Total Potongan:</span>
                  <span className="font-mono-code text-rose-700">-{formatIDR(personalPayroll.totalDeductions)}</span>
                </div>
              </div>

              {/* THP Final Box */}
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono-code uppercase font-bold text-emerald-800">GAJI BERSIH (TAKE HOME PAY):</span>
                  <div className="text-lg sm:text-xl font-black text-emerald-800 font-mono-code">
                    {formatIDR(personalPayroll.netSalary)}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold font-mono-code">
                  Siap Ditransfer
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 3: PRESENSI & JAM KERJA
         ========================================================================= */}
      {activeSection === 'ATTENDANCE' && (
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-5 motion-fade-in-up">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FF6B00]" />
                Log Riwayat Presensi & Verifikasi Kehadiran
              </h2>
              <p className="text-xs text-slate-500">
                Data sinkronisasi kamera selfie, WiFi gate DMJ, dan koordinat GPS.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('attendance')}
              className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-white font-bold text-xs transition-all cursor-pointer"
            >
              Buka Kamera Presensi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono-code text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Tanggal & Waktu</th>
                  <th className="px-4 py-3">Mode & Status</th>
                  <th className="px-4 py-3">Verifikasi WiFi</th>
                  <th className="px-4 py-3">Geolokasi Terdeteksi</th>
                  <th className="px-4 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {personalAttendances.map(att => (
                  <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{att.date}</p>
                      <span className="text-[10px] font-mono-code text-slate-500">{att.checkInTime} WIB</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono-code ${
                          att.status === 'ON_TIME'
                            ? 'bg-emerald-100 text-emerald-800'
                            : att.status === 'LATE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {att.status === 'ON_TIME' ? 'Tepat Waktu' : att.status === 'LATE' ? `Telat ${att.lateMinutes}m` : 'Dinas Luar'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono-code flex items-center gap-1 text-slate-700">
                        <Wifi className="w-3 h-3 text-[#FF6B00]" />
                        {att.wifi.ssid}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600 truncate max-w-xs block">
                        {att.location.address}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {att.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 4: SISA CUTI & PENGAJUAN
         ========================================================================= */}
      {activeSection === 'LEAVE' && (
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-5 motion-fade-in-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Manajemen Saldo Cuti & Izin Karyawan
              </h2>
              <p className="text-xs text-slate-500">
                Hak cuti tahunan PT Dwi Martha Jaya tahun kalender 2026.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('approvals')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Ajukan Permohonan Cuti
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-[10px] font-mono-code font-bold uppercase text-blue-700 block">Total Hak Cuti Tahunan</span>
              <span className="text-2xl font-black text-blue-900 font-mono-code">{currentUser.leaveQuota} Hari</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-mono-code font-bold uppercase text-slate-500 block">Cuti Sudah Digunakan</span>
              <span className="text-2xl font-black text-slate-800 font-mono-code">{currentUser.usedLeave} Hari</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] font-mono-code font-bold uppercase text-emerald-700 block">Sisa Saldo Cuti Tersedia</span>
              <span className="text-2xl font-black text-emerald-800 font-mono-code">{remainingLeave} Hari</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 5: REIMBURSE & KLAIM OPERASIONAL
         ========================================================================= */}
      {activeSection === 'REIMBURSE' && (
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-5 motion-fade-in-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#FF6B00]" />
                Klaim Reimbursement Operasional & Biaya Proyek
              </h2>
              <p className="text-xs text-slate-500">
                Penggantian biaya transport, bensin, konsumsi lembur, dan kebutuhan teknis site DMJ.
              </p>
            </div>

            <button
              onClick={() => setIsNewReimburseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8533] text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajukan Klaim Baru
            </button>
          </div>

          <div className="space-y-3">
            {personalReimbursements.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
                Belum ada klaim reimbursement yang diajukan.
              </div>
            ) : (
              personalReimbursements.map(claim => (
                <div
                  key={claim.id}
                  className="p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black font-mono-code px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        {claim.category}
                      </span>
                      <span className="text-[10px] font-mono-code text-slate-400">{claim.date}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{claim.title}</h4>
                    <p className="text-xs text-slate-600">{claim.description}</p>
                    {claim.projectName && (
                      <span className="text-[10px] font-mono-code text-orange-600 font-semibold block">
                        Alokasi: {claim.projectName}
                      </span>
                    )}
                    {claim.rejectReason && (
                      <p className="text-[11px] text-rose-700 font-semibold mt-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        ⚠️ Alasan Reject: {claim.rejectReason}
                      </p>
                    )}
                  </div>

                  <div className="text-right sm:text-right shrink-0">
                    <div className="text-base font-black text-slate-900 font-mono-code">
                      {formatIDR(claim.amount)}
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase font-mono-code inline-block mt-1 ${
                        claim.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : claim.status === 'DISBURSED'
                          ? 'bg-blue-100 text-blue-800'
                          : claim.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {claim.status === 'APPROVED'
                        ? 'Disetujui'
                        : claim.status === 'DISBURSED'
                        ? 'Telah Cair'
                        : claim.status === 'REJECTED'
                        ? 'Ditolak'
                        : 'Menunggu Review'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 6: PROYEKSI GAJI & SIMULASI LEMBUR
         ========================================================================= */}
      {activeSection === 'PROJECTION' && (
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6 motion-fade-in-up">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Simulator & Proyeksi Penghasilan Bersih (THP)
            </h2>
            <p className="text-xs text-slate-500">
              Kalkulasi peramalan gaji akhir bulan jika menambah jam lembur resmi atau penugasan site luar kota.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono-code text-slate-400 uppercase">Simulasi Tambahan Jam Lembur:</span>
                <div className="text-2xl font-black text-[#FF6B00] font-mono-code mt-0.5">
                  +{simulatedOtHours} Jam Kerja Lembur
                </div>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={simulatedOtHours}
                  onChange={e => setSimulatedOtHours(parseInt(e.target.value, 10))}
                  className="w-full accent-[#FF6B00] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono-code text-slate-400 mt-1">
                  <span>+0 Jam</span>
                  <span>+20 Jam</span>
                  <span>+40 Jam</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
              <div className="p-3 rounded-2xl bg-slate-850">
                <span className="text-[10px] text-slate-400 block font-mono-code">Estimasi Tambahan Upah Lembur:</span>
                <span className="text-base font-black text-[#00E2B0] font-mono-code mt-0.5 block">
                  +{formatIDR(simulatedAdditionalOtPay)}
                </span>
                <span className="text-[9px] text-slate-500">Formula Depnaker 1/173 Upah Pokok</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-850">
                <span className="text-[10px] text-slate-400 block font-mono-code">Gaji Bersih Saat Ini:</span>
                <span className="text-base font-black text-slate-300 font-mono-code mt-0.5 block">
                  {formatIDR(personalPayroll.netSalary)}
                </span>
                <span className="text-[9px] text-slate-500">Periode berjalan</span>
              </div>

              <div className="p-3 rounded-2xl bg-orange-950/60 border border-orange-500/40">
                <span className="text-[10px] text-[#FF8533] block font-mono-code font-bold uppercase">PROYEKSI GAJI BERSIH BARU:</span>
                <span className="text-lg font-black text-[#FF6B00] font-mono-code mt-0.5 block">
                  {formatIDR(projectedNetSalary)}
                </span>
                <span className="text-[9px] text-emerald-400 font-semibold">
                  Potensi kenaikan +{Math.round((simulatedAdditionalOtPay / personalPayroll.netSalary) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: AJUKAN REIMBURSEMENT BARU
         ========================================================================= */}
      {isNewReimburseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative modal-dialog-animate">
            <button
              onClick={() => setIsNewReimburseModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-md bg-[#FF6B00] text-white text-[10px] font-black uppercase font-mono-code">
                FORM KLAIM REIMBURSE
              </span>
              <span className="text-xs text-slate-500 font-mono-code">PT Dwi Martha Jaya</span>
            </div>

            <h3 className="text-base font-black text-slate-900 mb-4">Pengajuan Klaim Biaya Operasional Baru</h3>

            <form onSubmit={handleCreateReimbursement} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Judul Pengeluaran / Klaim:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BBM Mobil Operasional Kunjungan Smelter Manyar"
                  value={reimbTitle}
                  onChange={e => setReimbTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kategori Biaya:</label>
                  <select
                    value={reimbCategory}
                    onChange={e => setReimbCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
                  >
                    <option value="TRANSPORT_BBM">Transport & BBM</option>
                    <option value="KONSUMSI_LEMBUR">Konsumsi Lembur</option>
                    <option value="PENGINAPAN_SITE">Penginapan Site</option>
                    <option value="ALAT_MATERIAL">Alat / Material Darurat</option>
                    <option value="MEDIS">Biaya Medis / K3</option>
                    <option value="LAINNYA">Lain-lain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nominal (IDR):</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={10000}
                    value={reimbAmount}
                    onChange={e => setReimbAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono-code font-bold focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Bebankan ke Proyek DMJ:</label>
                <select
                  value={reimbProjectId}
                  onChange={e => setReimbProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Keterangan / Alasan Kebutuhan:</label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan kebutuhan pengeluaran secara singkat..."
                  value={reimbDesc}
                  onChange={e => setReimbDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
                />
              </div>

              <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 text-[11px] text-slate-600">
                ℹ️ Pastikan kuitansi atau nota pembelian asli jelas dan berstempel resmi untuk menghindari penolakan (*reject*) dari tim audit Finance.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewReimburseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e56000] text-white font-bold shadow-md shadow-orange-500/25"
                >
                  Kirim Pengajuan Klaim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CETAK SLIP GAJI RESMI DMJ
         ========================================================================= */}
      {isSlipModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 modal-dialog-animate">
            <button
              onClick={() => setIsSlipModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer no-print"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Slip Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono-code font-black text-sm tracking-tighter">
                      DM<span className="text-[#FF6B00]">J</span>
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 font-mono-code leading-none">
                        PT DWI MARTHA JAYA
                      </h2>
                      <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                        General Contractor, Mining Services & Industrial Engineering
                      </p>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 font-mono-code">
                    NPWP: 01.892.411.2-054.000 • Komp. Industri Terpadu Blok A1-A4 • finance@dwimarthajaya.co.id
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase font-mono-code">
                    SLIP GAJI RESMI
                  </span>
                  <p className="text-[10px] font-mono-code text-slate-500 mt-1">
                    Periode: September 2026
                  </p>
                </div>
              </div>
            </div>

            {/* Employee ID details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-mono-code uppercase block">Nama Karyawan</span>
                <span className="font-bold text-slate-900">{currentUser.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono-code uppercase block">Nomor Induk (NIK)</span>
                <span className="font-bold text-slate-900 font-mono-code">{currentUser.nik}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono-code uppercase block">Departemen</span>
                <span className="font-semibold text-slate-700">{currentUser.department}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono-code uppercase block">Jabatan / Posisi</span>
                <span className="font-semibold text-slate-700">{currentUser.position}</span>
              </div>
            </div>

            {/* Salary Breakdown 2 Cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
              {/* Penerimaan */}
              <div className="space-y-2">
                <h4 className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider font-mono-code border-b border-emerald-200 pb-1">
                  A. PENERIMAAN / PENGHASILAN
                </h4>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Gaji Pokok:</span>
                  <span className="font-mono-code font-semibold">{formatIDR(personalPayroll.baseSalary)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Tunjangan Tetap / Jabatan:</span>
                  <span className="font-mono-code font-semibold">{formatIDR(personalPayroll.fixedAllowance)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Uang Makan ({personalPayroll.presentDays} Hari):</span>
                  <span className="font-mono-code font-semibold">{formatIDR(personalPayroll.dailyAllowanceTotal)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Tunjangan Penugasan Proyek:</span>
                  <span className="font-mono-code font-semibold">{formatIDR(personalPayroll.projectAllowance)}</span>
                </div>
                <div className="flex justify-between py-0.5 text-orange-700 font-medium">
                  <span>Upah Lembur ({personalPayroll.overtimeHours} Jam Depnaker):</span>
                  <span className="font-mono-code font-bold">+{formatIDR(personalPayroll.overtimePay)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                  <span>Total Penghasilan Bruto:</span>
                  <span className="font-mono-code">{formatIDR(personalPayroll.grossSalary)}</span>
                </div>
              </div>

              {/* Potongan */}
              <div className="space-y-2">
                <h4 className="font-bold text-rose-800 text-[11px] uppercase tracking-wider font-mono-code border-b border-rose-200 pb-1">
                  B. POTONGAN
                </h4>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">BPJS Ketenagakerjaan (3%):</span>
                  <span className="font-mono-code font-semibold">{formatIDR(personalPayroll.bpjsKetenagakerjaan)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">BPJS Kesehatan (1%):</span>
                  <span className="font-mono-code font-semibold">{formatIDR(personalPayroll.bpjsKesehatan)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Pajak Penghasilan (PPh 21):</span>
                  <span className="font-mono-code font-semibold">{formatIDR(personalPayroll.pph21)}</span>
                </div>
                {personalPayroll.unapprovedLateDeduction > 0 && (
                  <div className="flex justify-between py-0.5 text-rose-600">
                    <span>Sanksi Keterlambatan ({personalPayroll.lateDays} Hari):</span>
                    <span className="font-mono-code font-semibold">-{formatIDR(personalPayroll.unapprovedLateDeduction)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                  <span>Total Potongan:</span>
                  <span className="font-mono-code text-rose-600">-{formatIDR(personalPayroll.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Total Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 font-mono-code block">
                  PENGHASILAN BERSIH DITERIMA (TAKE HOME PAY)
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono-code">
                  {formatIDR(personalPayroll.netSalary)}
                </div>
              </div>
              <div className="text-right text-[11px] font-mono-code text-slate-500">
                <p className="font-semibold text-slate-700">{currentUser.bankAccount.bankName}</p>
                <p>No: {currentUser.bankAccount.accountNumber}</p>
                <p>A.n: {currentUser.bankAccount.accountHolder}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 no-print">
              <button
                onClick={() => setIsSlipModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8533] text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Slip Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
