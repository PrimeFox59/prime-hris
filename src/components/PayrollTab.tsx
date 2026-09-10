import React, { useState } from 'react';
import {
  Banknote,
  FileSpreadsheet,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  Eye,
  X,
  CreditCard,
  Building,
  Shield,
  QrCode,
  Briefcase,
  Filter,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Employee, PayrollRecord, Project, SalaryRuleConfig, AttendanceRecord, SystemRole, getEffectiveSystemRole } from '../types';
import { formatIDR, calculateEmployeePayroll } from '../utils/payrollCalculator';

interface PayrollTabProps {
  currentUser?: Employee;
  employees: Employee[];
  projects: Project[];
  attendances: AttendanceRecord[];
  salaryRules: SalaryRuleConfig;
  selectedProjectId?: string;
  onSelectProjectId?: (projectId: string) => void;
}

export const PayrollTab: React.FC<PayrollTabProps> = ({
  currentUser,
  employees,
  projects,
  attendances,
  salaryRules,
  selectedProjectId = 'ALL',
  onSelectProjectId
}) => {
  const currentRole: SystemRole = getEffectiveSystemRole(currentUser);
  const isStaff = currentRole === 'staff';

  const [selectedPeriod, setSelectedPeriod] = useState('September 2026');
  const [currentProjectFilter, setCurrentProjectFilter] = useState<string>(selectedProjectId);
  const [activeSubView, setActiveSubView] = useState<'REKAP_GAJI' | 'ALOKASI_PROYEK' | 'PROYEKSI_EAC'>('REKAP_GAJI');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlip, setSelectedSlip] = useState<PayrollRecord | null>(null);

  // Sync external project selection if prop changes
  React.useEffect(() => {
    if (selectedProjectId) {
      setCurrentProjectFilter(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleFilterChange = (projId: string) => {
    setCurrentProjectFilter(projId);
    if (onSelectProjectId) {
      onSelectProjectId(projId);
    }
  };

  // Calculate full payroll records for all employees
  const allPayrollRecords: PayrollRecord[] = employees.map(emp =>
    calculateEmployeePayroll(emp, attendances, projects, salaryRules, selectedPeriod)
  );

  // For staff, strictly limit to their own payroll record
  const basePayrollRecords = isStaff
    ? allPayrollRecords.filter(p => p.employeeId === currentUser?.id)
    : allPayrollRecords;

  // Filter records based on selected project & search
  const filteredRecords = basePayrollRecords.filter(p => {
    // Search query filter
    const matchesSearch =
      p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Staff bypasses project filter (only sees own data)
    if (isStaff) return true;

    // Project filter
    if (currentProjectFilter === 'ALL') return true;

    // Check if employee assigned to this project or has allocations in it
    const emp = employees.find(e => e.id === p.employeeId);
    const isAssigned = emp?.assignedProjectId === currentProjectFilter;
    const hasAllocation = p.projectAllocations.some(a => a.projectId === currentProjectFilter);

    return isAssigned || hasAllocation;
  });

  const selectedProjectObj = projects.find(p => p.id === currentProjectFilter);

  // Aggregated totals
  const totalPayrollBudget = filteredRecords.reduce((acc, p) => acc + p.netSalary, 0);
  const totalOvertimeSpent = filteredRecords.reduce((acc, p) => acc + p.overtimePay, 0);
  const totalLateDeductions = filteredRecords.reduce((acc, p) => acc + p.unapprovedLateDeduction, 0);

  // Total allocated cost specifically for selected project
  const projectSpecificCost = currentProjectFilter === 'ALL'
    ? totalPayrollBudget
    : filteredRecords.reduce((acc, p) => {
        const alloc = p.projectAllocations.find(a => a.projectId === currentProjectFilter);
        return acc + (alloc ? alloc.allocatedCost : 0);
      }, 0);

  const exportCSV = () => {
    const headers = [
      'NIK', 'Nama', 'Departemen', 'Posisi', 'Proyek Utama', 'Gaji Pokok', 'Tunjangan Tetap',
      'Uang Harian', 'Tunjangan Proyek', 'Lembur', 'Potongan Terlambat',
      'BPJS Ketenagakerjaan', 'BPJS Kesehatan', 'PPh 21', 'Gaji Bersih (THP)'
    ];

    const rows = filteredRecords.map(p => {
      const emp = employees.find(e => e.id === p.employeeId);
      const proj = projects.find(prj => prj.id === emp?.assignedProjectId);
      return [
        p.nik,
        `"${p.employeeName}"`,
        `"${p.department}"`,
        `"${p.position}"`,
        `"${proj?.name || '-'}"`,
        p.baseSalary,
        p.fixedAllowance,
        p.dailyAllowanceTotal,
        p.projectAllowance,
        p.overtimePay,
        p.unapprovedLateDeduction,
        p.bpjsKetenagakerjaan,
        p.bpjsKesehatan,
        p.pph21,
        p.netSalary
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Payroll_PRIME_${currentProjectFilter}_${selectedPeriod.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner - PRIME Enterprise */}
      <div id="tour-payroll-header" className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-200/80 shadow-md motion-fade-in-down">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="prime-cut-corner bg-[#FF6B00] text-white text-[10px] font-black px-2.5 py-0.5 tracking-wider uppercase font-mono-code">
              {isStaff ? 'SLIP GAJI PERSONAL' : 'PAYROLL & PROJECT ACCOUNTING'}
            </span>
            <span className="text-xs font-bold text-slate-500">PRIME ENTERPRISE</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono-code">
              Periode: {selectedPeriod}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isStaff ? 'Rincian Slip Gaji & Penerimaan Saya' : 'Penggajian Karyawan & Alokasi Anggaran Berbasis Proyek'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {isStaff
              ? 'Rincian resmi kalkulasi upah pokok, tunjangan kerja harian, upah lembur, potongan BPJS & Take Home Pay (THP) Anda.'
              : 'Kalkulasi komprehensif gaji pokok, formula lembur Depnaker RI, tunjangan site, serta pembebanan biaya ke proyek PRIME Enterprise.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {!isStaff && (
            <button
              onClick={exportCSV}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Export CSV
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8533] hover:from-[#e56000] text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak {isStaff ? 'Slip Gaji' : 'Laporan'}
          </button>
        </div>
      </div>

      {/* Prominent Project Filter Toolbar (Hidden for Staff) */}
      {!isStaff ? (
        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 motion-fade-in-up stagger-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Project Dropdown Selector */}
            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <div className="p-2 rounded-xl bg-orange-50 text-[#FF6B00] border border-orange-200 shrink-0">
                <Filter className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono-code">
                  Filter Berdasarkan Proyek Kontrak:
                </label>
                <select
                  value={currentProjectFilter}
                  onChange={e => handleFilterChange(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 transition-all cursor-pointer"
                >
                  <option value="ALL">📁 Semua Proyek (Konsolidasi Total Perusahaan)</option>
                  {projects.map(prj => (
                    <option key={prj.id} value={prj.id}>
                      ⚡ [{prj.code}] {prj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search bar & Sub-view Switcher */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari nama, NIK, divisi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-44 sm:w-56"
              />
            </div>
          </div>

          {/* Sub-view Navigation Tabs */}
          <div id="tour-payroll-subviews" className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto">
            {[
              { id: 'REKAP_GAJI', label: 'Rekap Gaji & Slip', icon: Banknote },
              { id: 'ALOKASI_PROYEK', label: 'Alokasi Jam & Biaya Proyek', icon: Briefcase },
              { id: 'PROYEKSI_EAC', label: 'Proyeksi Anggaran EAC', icon: TrendingUp }
            ].map(view => {
              const Icon = view.icon;
              const isActive = activeSubView === view.id;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveSubView(view.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#FF6B00] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {view.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-3.5 border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tampilan dibatasi: Anda hanya dapat meninjau rincian gaji dan mencetak slip gaji pribadi Anda.</span>
          </div>
          <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 uppercase">
            STAFF BIASA
          </span>
        </div>
      )}

      {/* Selected Project Dossier Card (if specific project filtered) */}
      {selectedProjectObj && (
        <div className="rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-white p-4 sm:p-5 border border-orange-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 motion-scale-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#FF6B00] text-white text-[10px] font-black uppercase font-mono-code">
                {selectedProjectObj.code}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {selectedProjectObj.client}
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              {selectedProjectObj.name}
            </h3>
            <p className="text-xs text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {selectedProjectObj.location}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-white/80 rounded-xl p-2.5 border border-orange-200/60 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Budget Labor</span>
              <span className="text-sm font-black text-slate-900 font-mono-code">
                {formatIDR(selectedProjectObj.allocatedBudget)}
              </span>
            </div>
            <div className="bg-white/80 rounded-xl p-2.5 border border-orange-200/60 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Realisasi Payroll</span>
              <span className="text-sm font-black text-emerald-700 font-mono-code">
                {formatIDR(selectedProjectObj.actualLaborCost)}
              </span>
            </div>
            <div className="bg-white/80 rounded-xl p-2.5 border border-orange-200/60 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Burn Rate</span>
              <span className="text-sm font-black text-[#FF6B00] font-mono-code">
                {Math.round((selectedProjectObj.actualLaborCost / selectedProjectObj.allocatedBudget) * 100)}%
              </span>
            </div>
            <button
              onClick={() => handleFilterChange('ALL')}
              className="px-3 py-1.5 rounded-xl bg-white text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}

      {/* Top 3 Metric Summary Cards */}
      <div id="tour-payroll-kpi" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 motion-fade-in-up stagger-2 card-interactive">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono-code">
            {currentProjectFilter === 'ALL' ? 'Total Payroll Bersih (THP)' : 'Beban Payroll Proyek Ini'}
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono-code mt-1">
            {formatIDR(projectSpecificCost)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {filteredRecords.length} Karyawan Terdaftar
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 motion-fade-in-up stagger-3 card-interactive">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono-code">
            Total Upah Lembur Depnaker
          </span>
          <div className="text-xl sm:text-2xl font-black text-orange-600 font-mono-code mt-1">
            {formatIDR(totalOvertimeSpent)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Formula 1/173 Upah Pokok Jam Kerja
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-200/80 motion-fade-in-up stagger-4 card-interactive">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono-code">
            Potongan Keterlambatan
          </span>
          <div className="text-xl sm:text-2xl font-black text-rose-600 font-mono-code mt-1">
            {formatIDR(totalLateDeductions)}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Terkena sanksi tanpa persetujuan
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBVIEW 1: REKAP GAJI & SLIP GAJI                                         */}
      {/* ========================================================================= */}
      {activeSubView === 'REKAP_GAJI' && (
        <div id="tour-payroll-table" className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 shadow-md">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Rekapitulasi Gaji Karyawan PRIME Enterprise
              </h2>
              <p className="text-xs text-slate-500">
                {currentProjectFilter === 'ALL'
                  ? 'Menampilkan seluruh staf karyawan perusahaan'
                  : `Menampilkan personel yang teralokasi pada proyek ${selectedProjectObj?.code || ''}`}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono-code">
              Menampilkan {filteredRecords.length} Data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 uppercase font-mono-code text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">NIK & Karyawan</th>
                  <th className="px-4 py-3">Departemen / Posisi</th>
                  <th className="px-4 py-3 text-right">Gaji Pokok</th>
                  <th className="px-4 py-3 text-right">Tunjangan</th>
                  <th className="px-4 py-3 text-right">Lembur Depnaker</th>
                  <th className="px-4 py-3 text-right">Potongan</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-900">Gaji Bersih (THP)</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada karyawan yang sesuai dengan filter proyek ini.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item, idx) => {
                    const totalTunjangan = item.fixedAllowance + item.dailyAllowanceTotal + item.projectAllowance;

                    return (
                      <tr
                        key={item.id}
                        style={{ animationDelay: `${(idx + 1) * 60}ms` }}
                        className="hover:bg-slate-50/70 transition-colors table-row-animate"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF6B00] to-[#FF8533] text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {item.employeeName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{item.employeeName}</p>
                              <span className="text-[10px] font-mono-code text-slate-500">{item.nik}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-slate-800 font-semibold">{item.position}</p>
                          <span className="text-[10px] text-slate-400">{item.department}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono-code text-slate-700">
                          {formatIDR(item.baseSalary)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono-code text-slate-700">
                          {formatIDR(totalTunjangan)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono-code text-orange-600 font-semibold">
                          +{formatIDR(item.overtimePay)}
                          <span className="block text-[9px] text-slate-400 font-normal">
                            ({item.overtimeHours} Jam)
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono-code text-rose-600">
                          -{formatIDR(item.totalDeductions)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono-code font-black text-emerald-600 text-sm">
                          {formatIDR(item.netSalary)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => setSelectedSlip(item)}
                            className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-white border border-orange-200 text-xs font-bold transition-all flex items-center gap-1.5 mx-auto cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Cetak Slip
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 2: ALOKASI JAM & BIAYA PROYEK                                     */}
      {/* ========================================================================= */}
      {activeSubView === 'ALOKASI_PROYEK' && (
        <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-md space-y-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#FF6B00]" />
              Alokasi Biaya Tenaga Kerja Antar-Proyek (Cost Accounting)
            </h2>
            <p className="text-xs text-slate-500">
              Rincian jam kerja operasional dan pembagian proporsi gaji yang dibebankan langsung ke anggaran proyek PRIME Enterprise.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 uppercase font-mono-code text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Nama Karyawan & NIK</th>
                  <th className="px-4 py-3">Kode & Nama Proyek</th>
                  <th className="px-4 py-3 text-right">Jam Terlapor</th>
                  <th className="px-4 py-3 text-right">Persentase Alokasi</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-900">Beban Biaya Gaji Proyek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.flatMap(rec =>
                  rec.projectAllocations
                    .filter(alloc => currentProjectFilter === 'ALL' || alloc.projectId === currentProjectFilter)
                    .map((alloc, idx) => (
                      <tr key={`${rec.id}-${alloc.projectId}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{rec.employeeName}</p>
                          <span className="text-[10px] font-mono-code text-slate-400">{rec.nik}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[#FF6B00] text-[10px] font-mono-code font-bold mr-1.5">
                            {alloc.projectCode}
                          </span>
                          <span className="text-slate-800">{alloc.projectName}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono-code font-bold text-slate-800">
                          {alloc.allocatedHours} Jam
                        </td>
                        <td className="px-4 py-3 text-right font-mono-code text-slate-600">
                          {alloc.percentage}%
                        </td>
                        <td className="px-4 py-3 text-right font-mono-code font-black text-emerald-700">
                          {formatIDR(alloc.allocatedCost)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBVIEW 3: PROYEKSI ANGGARAN & EAC                                        */}
      {/* ========================================================================= */}
      {activeSubView === 'PROYEKSI_EAC' && (
        <div className="glass-card rounded-3xl p-5 border border-slate-200/80 shadow-md space-y-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FF6B00]" />
              Proyeksi Anggaran & Estimate at Completion (EAC) Proyek Operasional
            </h2>
            <p className="text-xs text-slate-500">
              Model estimasi biaya tenaga kerja hingga proyek selesai, monitoring burn-rate, dan deteksi dini risiko pembengkakan anggaran.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(currentProjectFilter === 'ALL' ? projects : projects.filter(p => p.id === currentProjectFilter)).map(proj => {
              const variance = proj.allocatedBudget - proj.projectedLaborCost;
              const isOverBudget = variance < 0;
              const burnPercentage = Math.round((proj.actualLaborCost / proj.allocatedBudget) * 100);

              return (
                <div key={proj.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[#FF6B00] text-[10px] font-black uppercase font-mono-code">
                      {proj.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOverBudget ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {isOverBudget ? 'Risiko Overrun' : 'On Track'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{proj.name}</h3>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] text-slate-400 block font-mono-code">Anggaran Awal:</span>
                      <span className="font-bold text-slate-800 font-mono-code">{formatIDR(proj.allocatedBudget)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] text-slate-400 block font-mono-code">Proyeksi Akhir (EAC):</span>
                      <span className="font-bold text-slate-800 font-mono-code">{formatIDR(proj.projectedLaborCost)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono-code">
                      <span className="text-slate-500">Burn Rate Jam: {proj.actualHoursSpent} / {proj.totalEstimatedHours} Jam</span>
                      <span className="font-bold text-slate-800">{burnPercentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          burnPercentage > 85 ? 'bg-rose-500' : burnPercentage > 60 ? 'bg-amber-500' : 'bg-[#00E2B0]'
                        }`}
                        style={{ width: `${burnPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OFFICIAL SLIP GAJI MODAL FOR PRIME ENTERPRISE                               */}
      {/* ========================================================================= */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 modal-dialog-animate">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedSlip(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer no-print"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Official Letterhead - PRIME HRIS Enterprise */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-[#FF8533] text-white flex items-center justify-center font-mono-code font-black text-sm tracking-tighter shadow-sm shadow-orange-500/30">
                      PRIME
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 font-mono-code leading-none">
                        PRIME HRIS ENTERPRISE
                      </h2>
                      <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                        PT Prime Infinity Systems • Advanced HR & Payroll Engineering Platform
                      </p>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 font-mono-code">
                    NPWP: 01.892.411.2-054.000 • Komp. Perkantoran & Innovation Hub • Email: payroll@primeprojectx.net
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase font-mono-code">
                    SLIP GAJI RESMI
                  </span>
                  <p className="text-[10px] font-mono-code text-slate-500 mt-1">Periode: {selectedSlip.period}</p>
                </div>
              </div>
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-mono-code uppercase block">Nama Karyawan</span>
                <span className="font-bold text-slate-900">{selectedSlip.employeeName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono-code uppercase block">Nomor Induk (NIK)</span>
                <span className="font-bold text-slate-900 font-mono-code">{selectedSlip.nik}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono-code uppercase block">Departemen</span>
                <span className="font-semibold text-slate-700">{selectedSlip.department}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono-code uppercase block">Jabatan / Posisi</span>
                <span className="font-semibold text-slate-700">{selectedSlip.position}</span>
              </div>
            </div>

            {/* Earnings and Deductions Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
              {/* Penerimaan */}
              <div className="space-y-2">
                <h4 className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider font-mono-code border-b border-emerald-200 pb-1">
                  A. PENERIMAAN / PENGHASILAN
                </h4>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Gaji Pokok:</span>
                  <span className="font-mono-code font-semibold">{formatIDR(selectedSlip.baseSalary)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Tunjangan Tetap / Jabatan:</span>
                  <span className="font-mono-code font-semibold">{formatIDR(selectedSlip.fixedAllowance)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Uang Makan / Harian ({selectedSlip.presentDays} Hari):</span>
                  <span className="font-mono-code font-semibold">{formatIDR(selectedSlip.dailyAllowanceTotal)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Tunjangan Penugasan Proyek:</span>
                  <span className="font-mono-code font-semibold">{formatIDR(selectedSlip.projectAllowance)}</span>
                </div>
                <div className="flex justify-between py-0.5 text-orange-700 font-medium">
                  <span>Upah Lembur ({selectedSlip.overtimeHours} Jam Depnaker):</span>
                  <span className="font-mono-code font-bold">{formatIDR(selectedSlip.overtimePay)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                  <span>Total Penghasilan Bruto:</span>
                  <span className="font-mono-code">{formatIDR(selectedSlip.grossSalary)}</span>
                </div>
              </div>

              {/* Potongan */}
              <div className="space-y-2">
                <h4 className="font-bold text-rose-800 text-[11px] uppercase tracking-wider font-mono-code border-b border-rose-200 pb-1">
                  B. POTONGAN / DEDUCTIONS
                </h4>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">BPJS Ketenagakerjaan (3%):</span>
                  <span className="font-mono-code text-rose-600">-{formatIDR(selectedSlip.bpjsKetenagakerjaan)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">BPJS Kesehatan (1%):</span>
                  <span className="font-mono-code text-rose-600">-{formatIDR(selectedSlip.bpjsKesehatan)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Estimasi Pajak PPh 21:</span>
                  <span className="font-mono-code text-rose-600">-{formatIDR(selectedSlip.pph21)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Potongan Keterlambatan:</span>
                  <span className="font-mono-code text-rose-600">-{formatIDR(selectedSlip.unapprovedLateDeduction)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                  <span>Total Potongan:</span>
                  <span className="font-mono-code text-rose-600">-{formatIDR(selectedSlip.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 font-mono-code">
                  TOTAL GAJI BERSIH DITERIMA (TAKE HOME PAY)
                </span>
                <p className="text-xs text-emerald-700">Ditransfer ke rekening resmi payroll karyawan</p>
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-800 font-mono-code">
                {formatIDR(selectedSlip.netSalary)}
              </span>
            </div>

            {/* Footer with QR and Signatures */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl border border-slate-300 p-1 bg-white flex items-center justify-center shrink-0">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 font-mono-code block">DIGITAL VERIFICATION CODE</span>
                  <span className="text-[10px] font-mono-code font-bold text-slate-700">PRIME-VERIFIED-2026-PAYROLL</span>
                  <p className="text-[9px] text-slate-500 mt-0.5">Sistem Dokumen Sah PRIME HRIS Enterprise</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-mono-code">Surabaya, 08 September 2026</p>
                <p className="text-xs font-bold text-slate-800 mt-4">Direksi PT Prime Infinity Systems</p>
                <span className="text-[9px] text-emerald-600 font-semibold font-mono-code">✓ Digitally Signed & Stamped</span>
              </div>
            </div>

            {/* Print button on modal */}
            <div className="mt-5 flex justify-end gap-2 no-print">
              <button
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e56000] text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Slip Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
