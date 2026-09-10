import React, { useState, useEffect } from 'react';
import {
  User,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Wifi,
  ChevronRight,
  Calendar,
  ShieldCheck,
  Banknote,
  FileCheck2,
  Sparkles,
  PieChart,
  DollarSign,
  Layers,
  ArrowRight,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { Employee, Project, AttendanceRecord, ApprovalItem, SalaryRuleConfig, ReimbursementClaim, getEffectiveSystemRole } from '../types';
import { formatIDR } from '../utils/payrollCalculator';
import { HrisTimelineChart } from './HrisTimelineChart';
import { FinanceTimelineChart } from './FinanceTimelineChart';
import { UserPerformanceTab } from './UserPerformanceTab';

interface DashboardTabProps {
  currentUser: Employee;
  employees: Employee[];
  projects: Project[];
  attendances: AttendanceRecord[];
  approvals: ApprovalItem[];
  salaryRules: SalaryRuleConfig;
  reimbursements: ReimbursementClaim[];
  onAddReimbursement: (claim: ReimbursementClaim) => void;
  onSubmitNewLeaveRequest: (item: ApprovalItem) => void;
  onNavigateToTab: (tabId: string, projectIdFilter?: string) => void;
  currentWifiSsid: string;
  initialSubView?: 'hris' | 'finance' | 'performance';
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  currentUser,
  employees,
  projects,
  attendances,
  approvals,
  salaryRules,
  reimbursements,
  onAddReimbursement,
  onSubmitNewLeaveRequest,
  onNavigateToTab,
  currentWifiSsid,
  initialSubView = 'hris'
}) => {
  const currentRole = getEffectiveSystemRole(currentUser);
  const isStaff = currentRole === 'staff';

  // Staff is strictly locked to personal performance view
  const [subView, setSubView] = useState<'hris' | 'finance' | 'performance'>(isStaff ? 'performance' : initialSubView);

  useEffect(() => {
    if (isStaff) {
      setSubView('performance');
    } else if (initialSubView) {
      setSubView(initialSubView);
    }
  }, [initialSubView, isStaff]);

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
  const todayAttendances = attendances.slice(0, 4);

  // Financial aggregates
  const totalAllocatedBudget = projects.reduce((acc, p) => acc + p.allocatedBudget, 0);
  const totalActualLaborCost = projects.reduce((acc, p) => acc + p.actualLaborCost, 0);
  const overallBurnPercentage = Math.round((totalActualLaborCost / totalAllocatedBudget) * 100);

  // HR aggregates
  const onTimeCount = attendances.filter(a => !a.isLate && a.mode === 'WFO').length;
  const lateCount = attendances.filter(a => a.isLate).length;
  const dinasCount = attendances.filter(a => a.mode === 'DINAS_LUAR').length;
  const inGeofenceCount = attendances.filter(a => a.location.inGeofence).length;

  // Monthly payroll estimate
  const totalBaseSalary = employees.reduce((acc, e) => acc + e.baseSalary, 0);
  const totalAllowances = employees.reduce((acc, e) => acc + e.fixedAllowance + (e.dailyAllowance * 22), 0);
  const totalOvertimeEst = 4750000;
  const totalGrossPayroll = totalBaseSalary + totalAllowances + totalOvertimeEst;
  const totalNetPayrollDisbursement = Math.round(totalGrossPayroll * 0.91);

  return (
    <div className="space-y-6">
      
      {/* Dual Dashboard Segmented Switcher Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-2 rounded-3xl border border-slate-200/80 shadow-xs motion-fade-in-down">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-[#FF8533] text-white flex items-center justify-center font-mono-code font-black text-sm shadow-md shadow-orange-500/20">
            PX
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono-code block">
              SISTEM MONITORING TERPADU • PT DWI MARTHA JAYA
            </span>
            <span className="text-xs font-bold text-slate-900">
              Pilih Sudut Pandang Dashboard:
            </span>
          </div>
        </div>

        {/* Executive Switcher Buttons (Staff is locked to personal performance) */}
        {isStaff ? (
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-2xl border border-emerald-200 text-emerald-800">
            <User className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold font-mono-code">PORTAL KINERJA PRIBADI</span>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-2 py-0.5 rounded-full font-mono-code uppercase">
              STAFF BIASA
            </span>
          </div>
        ) : (
          <div id="tour-dashboard-subview" className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setSubView('hris')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subView === 'hris'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>DASHBOARD HRIS</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono-code ${
                subView === 'hris' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                SDM & Shift
              </span>
            </button>

            <button
              onClick={() => setSubView('finance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subView === 'finance'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8533] text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>DASHBOARD FINANCE</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono-code ${
                subView === 'finance' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                Payroll & Kas
              </span>
            </button>

            <button
              onClick={() => setSubView('performance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                subView === 'performance'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>KINERJA SAYA</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono-code ${
                subView === 'performance' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                Personal
              </span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          VIEW 1: DASHBOARD HRIS & OPERASIONAL SDM
         ========================================================================= */}
      {subView === 'hris' && (
        <div className="space-y-6 motion-fade-in-up">
          
          {/* Executive Welcome Banner for HRIS */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#00E2B0]/20 to-teal-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="prime-cut-corner bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 tracking-wider uppercase font-mono-code">
                    PORTAL OPERASIONAL SDM • PT DWI MARTHA JAYA
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1 border border-emerald-500/30 font-mono-code">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    PRESENSI KAMERA LIVE & WIFI GATE AKTIF
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Dashboard HRIS & Manajemen Tenaga Kerja
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Monitoring terpusat kehadiran presensi kamera, shift timeline 24 jam, verifikasi jaringan resmi WiFi kantor (<code className="text-[#00E2B0] font-mono-code">DMJ-Corporate-5G</code>), serta alur persetujuan dinas luar untuk seluruh staf <strong className="text-white">PT Dwi Martha Jaya</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigateToTab('attendance')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8533] hover:from-[#e56000] text-white text-xs font-bold shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  Presensi Kamera Sekarang
                </button>
                <button
                  onClick={() => onNavigateToTab('approvals')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#00E2B0]" />
                  Pusat Approval ({pendingApprovals.length})
                </button>
              </div>
            </div>
          </div>

          {/* 4 HRIS KPI Cards */}
          <div id="tour-dashboard-metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Total Karyawan */}
            <div className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all border border-slate-200/80 card-interactive">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono-code">
                  Total Tenaga Kerja
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono-code">
                {employees.length} <span className="text-sm font-normal text-slate-500">Personel</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>100% data profil, MAC & bank terdata</span>
              </div>
            </div>

            {/* Metric 2: Kehadiran Hari Ini */}
            <div className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all border border-slate-200/80 card-interactive">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono-code">
                  Kehadiran Terlapor
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono-code">
                {attendances.length} / {employees.length}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <span>{onTimeCount} Tepat Waktu</span>
                <span>•</span>
                <span className="text-blue-700">{dinasCount} Dinas Luar</span>
              </div>
            </div>

            {/* Metric 3: Kepatuhan Geofence & WiFi */}
            <div className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all border border-slate-200/80 card-interactive">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono-code">
                  Kepatuhan Lokasi DMJ
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Wifi className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-teal-700 font-mono-code">
                {attendances.length > 0 ? Math.round((inGeofenceCount / attendances.length) * 100) : 100}%
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Radius Workshop & Site Pomalaa</span>
              </div>
            </div>

            {/* Metric 4: Antrean Approval */}
            <div className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all border border-slate-200/80 card-interactive">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono-code">
                  Persetujuan Pending
                </span>
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-orange-600 font-mono-code">
                {pendingApprovals.length} <span className="text-sm font-normal text-slate-500">Berkas</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {lateCount > 0 ? `${lateCount} justifikasi keterlambatan` : 'Semua berkas telah ditinjau'}
              </div>
            </div>

          </div>

          {/* INTERACTIVE TIMELINE CHART FOR HRIS */}
          <div id="tour-dashboard-charts">
            <HrisTimelineChart
            employees={employees}
            attendances={attendances}
            approvals={approvals}
            onNavigateToTab={onNavigateToTab}
          />
          </div>

          {/* Operational Feeds: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Sebaran Tenaga Kerja per Divisi & Proyek */}
            <div className="lg:col-span-2 glass-card rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#FF6B00]" />
                    Sebaran Tenaga Kerja & Penugasan Divisi PT Dwi Martha Jaya
                  </h3>
                  <p className="text-xs text-slate-500">
                    Alokasi personel aktif di Workshop Pusat Manyar dan Site Luar Pomalaa.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTab('users')}
                  className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer flex items-center gap-1"
                >
                  Buka User Management <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {employees.map((emp, idx) => {
                  const assignedProj = projects.find(p => p.id === emp.assignedProjectId);
                  return (
                    <div
                      key={emp.id}
                      className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 transition-all flex items-center gap-3 card-interactive"
                    >
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-black text-slate-900 truncate">{emp.name}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 font-mono-code shrink-0">
                            {emp.employmentType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{emp.position}</p>
                        <p className="text-[10px] text-orange-600 font-mono-code font-bold truncate mt-0.5">
                          ⚡ {assignedProj ? assignedProj.name : 'Workshop HQ'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Antrean Approval & Presensi Feed */}
            <div className="space-y-4">
              
              {/* Approval Quick Queue */}
              <div className="glass-card rounded-2xl p-5 border border-slate-200/80 space-y-3 card-interactive">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Antrean Approval Cepat
                  </h3>
                  <button
                    onClick={() => onNavigateToTab('approvals')}
                    className="text-[11px] font-bold text-[#FF6B00] hover:underline cursor-pointer"
                  >
                    Buka Hub
                  </button>
                </div>

                {pendingApprovals.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                    Tidak ada permohonan pending saat ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingApprovals.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onNavigateToTab('approvals')}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50/60 border border-slate-200/60 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-mono-code">
                            {item.type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono-code">{item.startDate}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate">{item.employeeName}</p>
                        <p className="text-[11px] text-slate-600 line-clamp-1">{item.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feed Presensi Hari Ini */}
              <div className="glass-card rounded-2xl p-5 border border-slate-200/80 space-y-3 card-interactive">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#FF6B00]" />
                    Feed Presensi Kamera Live
                  </h3>
                  <button
                    onClick={() => onNavigateToTab('attendance')}
                    className="text-[11px] font-bold text-[#FF6B00] hover:underline cursor-pointer"
                  >
                    Kamera
                  </button>
                </div>

                <div className="space-y-2.5">
                  {todayAttendances.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2.5"
                    >
                      <img
                        src={item.photoUrl}
                        alt="Check In"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-300 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.employeeName}</p>
                          <span className="text-[10px] font-mono-code font-bold text-emerald-600">
                            {item.checkInTime}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <Wifi className="w-3 h-3 text-[#FF6B00]" />
                          {item.wifi.ssid}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW 2: DASHBOARD FINANCE & AKUNTANSI PROYEK
         ========================================================================= */}
      {subView === 'finance' && (
        <div className="space-y-6 motion-fade-in-up">
          
          {/* Executive Welcome Banner for Finance */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FF6B00]/25 to-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="prime-cut-corner bg-[#FF6B00] text-white text-[10px] font-black px-2.5 py-0.5 tracking-wider uppercase font-mono-code">
                    PORTAL FINANCE & COST ACCOUNTING • PT DWI MARTHA JAYA
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-semibold flex items-center gap-1 border border-orange-500/30 font-mono-code">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping"></span>
                    SIMULASI BEBAN PAYROLL & PROYEK AKTIF
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Dashboard Finance, Payroll & Anggaran Proyek
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Pemantauan realisasi gaji bersih (THP), beban upah lembur regulasi Depnaker RI, estimasi burn-rate anggaran proyek DMJ, serta timeline arus kas pencairan bank rekanan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigateToTab('payroll')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8533] hover:from-[#e56000] text-white text-xs font-bold shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Banknote className="w-4 h-4" />
                  Buka Payroll Hub DMJ
                </button>
                <button
                  onClick={() => onNavigateToTab('salary_rules')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#00E2B0]" />
                  Aturan Gaji Depnaker
                </button>
              </div>
            </div>
          </div>

          {/* 4 Finance KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Estimasi Pengeluaran Payroll Bersih (THP) */}
            <div className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all border border-slate-200/80 card-interactive">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono-code">
                  Estimasi Payroll Bersih (THP)
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono-code">
                {formatIDR(totalNetPayrollDisbursement)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Jadwal transfer: 25 September 2026</span>
              </div>
            </div>

            {/* Metric 2: Akumulasi Lembur Depnaker */}
            <div className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all border border-slate-200/80 card-interactive">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono-code">
                  Beban Lembur Depnaker
                </span>
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-orange-600 font-mono-code">
                {formatIDR(totalOvertimeEst)}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Formula 1/173 x Upah Pokok Jam Kerja
              </div>
            </div>

            {/* Metric 3: Total Budget Tenaga Kerja Proyek DMJ */}
            <div className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all border border-slate-200/80 card-interactive">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono-code">
                  Total Budget Labor Proyek
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono-code">
                {formatIDR(totalAllocatedBudget)}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Terbagi ke 4 Proyek Aktif DMJ
              </div>
            </div>

            {/* Metric 4: Burn Rate Anggaran Proyek */}
            <div className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all border border-slate-200/80 card-interactive">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono-code">
                  Burn Rate Keseluruhan
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#FF6B00] font-mono-code">
                {overallBurnPercentage}%
              </div>
              <div className="mt-2 text-xs text-emerald-600 font-semibold">
                Sisa Cadangan: {formatIDR(totalAllocatedBudget - totalActualLaborCost)}
              </div>
            </div>

          </div>

          {/* INTERACTIVE TIMELINE CHART FOR FINANCE */}
          <FinanceTimelineChart
            projects={projects}
            employees={employees}
            salaryRules={salaryRules}
            onNavigateToTab={onNavigateToTab}
          />

          {/* Project Cost Allocation Table & Budget Burn Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Project EAC & Budget Status */}
            <div className="lg:col-span-2 glass-card rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#FF6B00]" />
                    Status Realisasi Gaji & Proyeksi Anggaran EAC Proyek DMJ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Alokasi biaya tenaga kerja langsung terhadap pagu anggaran kontrak proyek PT Dwi Martha Jaya.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTab('payroll')}
                  className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer flex items-center gap-1"
                >
                  Buka Payroll <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((proj) => {
                  const burn = Math.round((proj.actualLaborCost / proj.allocatedBudget) * 100);
                  const isOverrunRisk = proj.projectedLaborCost > proj.allocatedBudget;

                  return (
                    <div
                      key={proj.id}
                      className="p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-3 card-interactive"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[#FF6B00] text-[10px] font-black uppercase font-mono-code">
                          {proj.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOverrunRisk ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOverrunRisk ? 'Risiko Overrun' : 'On Track'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{proj.name}</h4>

                      <div className="space-y-1.5 pt-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Budget Awal:</span>
                          <span className="font-bold text-slate-800 font-mono-code">{formatIDR(proj.allocatedBudget)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Realisasi Saat Ini:</span>
                          <span className="font-black text-emerald-700 font-mono-code">{formatIDR(proj.actualLaborCost)}</span>
                        </div>
                      </div>

                      {/* Burn Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] font-mono-code text-slate-500">
                          <span>Burn Rate Anggaran</span>
                          <span className="font-bold text-slate-800">{burn}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              burn > 85 ? 'bg-rose-500' : burn > 60 ? 'bg-amber-500' : 'bg-[#00E2B0]'
                            }`}
                            style={{ width: `${burn}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex justify-end">
                        <button
                          onClick={() => onNavigateToTab('payroll', proj.id)}
                          className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Filter Gaji Proyek Ini <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Komposisi Beban Payroll & Aksi Cepat */}
            <div className="space-y-4">
              
              {/* Komposisi Komponen Payroll */}
              <div className="glass-card rounded-2xl p-5 border border-slate-200/80 space-y-3 card-interactive">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  Komposisi Komponen Biaya Gaji
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Gaji Pokok Karyawan</span>
                    <span className="font-bold text-slate-900 font-mono-code">{formatIDR(totalBaseSalary)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Tunjangan Tetap & Jabatan</span>
                    <span className="font-bold text-slate-900 font-mono-code">{formatIDR(employees.reduce((acc, e) => acc + e.fixedAllowance, 0))}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Uang Makan / Harian</span>
                    <span className="font-bold text-slate-900 font-mono-code">{formatIDR(employees.reduce((acc, e) => acc + (e.dailyAllowance * 22), 0))}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Upah Lembur Depnaker</span>
                    <span className="font-bold text-orange-600 font-mono-code">+{formatIDR(totalOvertimeEst)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 font-black text-slate-900 text-xs">
                    <span>Total Beban Bruto</span>
                    <span className="font-mono-code">{formatIDR(totalGrossPayroll)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Finance */}
              <div className="glass-card rounded-2xl p-5 border border-slate-200/80 space-y-3 card-interactive">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#FF6B00]" />
                  Aksi Laporan Finansial
                </h3>

                <div className="space-y-2">
                  <button
                    onClick={() => onNavigateToTab('payroll')}
                    className="w-full px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-white font-bold text-xs transition-all flex items-center justify-between cursor-pointer shadow-xs"
                  >
                    <span>Cetak Rekap Gaji & Slip</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onNavigateToTab('salary_rules')}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>Konfigurasi Tarif BPJS & Lembur</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW 3: DASHBOARD USER PERFORMANCE & PORTAL KARYAWAN
         ========================================================================= */}
      {subView === 'performance' && (
        <UserPerformanceTab
          currentUser={currentUser}
          employees={employees}
          projects={projects}
          attendances={attendances}
          approvals={approvals}
          salaryRules={salaryRules}
          reimbursements={reimbursements}
          onAddReimbursement={onAddReimbursement}
          onSubmitNewLeaveRequest={onSubmitNewLeaveRequest}
          onNavigateToTab={onNavigateToTab}
        />
      )}

    </div>
  );
};
