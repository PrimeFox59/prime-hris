import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ShieldCheck,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  X,
  Save,
  Check,
  Palmtree,
  Wifi,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  Info,
  Lock
} from 'lucide-react';
import {
  Project,
  Employee,
  SalaryRuleConfig,
  ProjectCustomRules,
  ProjectWorkSchedule,
  ProjectLeavePolicy,
  ProjectAllowanceRule,
  ProjectGeofenceRule,
  SystemRole,
  getEffectiveSystemRole
} from '../types';
import { formatIDR } from '../utils/payrollCalculator';

interface ProjectManagementTabProps {
  currentUser: Employee;
  employees: Employee[];
  projects: Project[];
  salaryRules: SalaryRuleConfig;
  onSaveProject: (project: Project, updatedEmployees?: Employee[]) => void;
  onUpdateEmployee?: (employee: Employee) => void;
  onNavigateToTab?: (tabId: string, projectIdFilter?: string) => void;
}

export const ProjectManagementTab: React.FC<ProjectManagementTabProps> = ({
  currentUser,
  employees,
  projects,
  salaryRules,
  onSaveProject,
  onUpdateEmployee,
  onNavigateToTab
}) => {
  const currentRole: SystemRole = getEffectiveSystemRole(currentUser);
  const canManage = currentRole === 'admin' || currentRole === 'superuser';

  // State Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PLANNING' | 'COMPLETED'>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Modal State for Project Editing / Creation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'details' | 'personnel' | 'schedule' | 'leave' | 'allowance'>('details');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Staged employee reassignments inside the modal
  const [stagedAssignedEmployeeIds, setStagedAssignedEmployeeIds] = useState<string[]>([]);
  const [employeeToAddId, setEmployeeToAddId] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Quick personnel filter inside modal
  const [personnelSearch, setPersonnelSearch] = useState('');

  // Statistics Calculations
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.allocatedBudget || 0), 0);
    const totalLaborCost = projects.reduce((sum, p) => sum + (p.actualLaborCost || 0), 0);
    const assignedCount = employees.filter(e => e.assignedProjectId).length;

    return { totalProjects, activeProjects, totalBudget, totalLaborCost, assignedCount };
  }, [projects, employees]);

  // Filtered Projects List
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [projects, statusFilter, searchQuery]);

  // Default empty project template for new creation
  const createBlankProject = (): Project => {
    const nextNum = projects.length + 1;
    const code = `PRJ-${new Date().getFullYear()}-${String(nextNum).padStart(2, '0')}`;
    return {
      id: code,
      code,
      name: '',
      client: '',
      location: '',
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      targetEndDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      allocatedBudget: 250000000,
      actualLaborCost: 0,
      projectedLaborCost: 200000000,
      totalEstimatedHours: 2000,
      actualHoursSpent: 0,
      hourlyRateMultiplier: 1.25,
      description: '',
      assignedEmployeeIds: [],
      customRules: {
        workSchedule: {
          enabled: false,
          workDays: 6,
          checkInTime: '07:30',
          checkOutTime: '16:30',
          lateGraceMinutes: 15,
          saturdayWork: true,
          saturdayCheckIn: '07:30',
          saturdayCheckOut: '12:30',
          allowFlexibleHours: false
        },
        leavePolicy: {
          enabled: false,
          rosterPattern: '6_ON_2_OFF',
          customRosterDesc: '',
          extraRemoteLeaveDays: 2,
          minimumNoticeDays: 7,
          requiresHandover: true,
          customLeaveNotes: ''
        },
        allowance: {
          enabled: false,
          dailySiteAllowance: 75000,
          monthlyRemoteAllowance: 1500000
        },
        geofence: {
          enabled: false,
          siteName: '',
          latitude: -7.15,
          longitude: 112.65,
          radiusMeters: 300,
          allowedWifiSsid: ''
        }
      }
    };
  };

  // Open Modal for Editing an existing project
  const handleOpenEdit = (project: Project, tab: 'details' | 'personnel' | 'schedule' | 'leave' | 'allowance' = 'details') => {
    setEditingProject(JSON.parse(JSON.stringify(project)));
    setIsCreatingNew(false);
    setModalTab(tab);

    // Compute assigned employees based on both project.assignedEmployeeIds and employee.assignedProjectId
    const assignedIds = new Set<string>(project.assignedEmployeeIds || []);
    employees.forEach(emp => {
      if (emp.assignedProjectId === project.id) {
        assignedIds.add(emp.id);
      }
    });

    setStagedAssignedEmployeeIds(Array.from(assignedIds));
    setIsModalOpen(true);
  };

  // Open Modal for Creating a new project
  const handleOpenCreate = () => {
    setEditingProject(createBlankProject());
    setIsCreatingNew(true);
    setModalTab('details');
    setStagedAssignedEmployeeIds([]);
    setIsModalOpen(true);
  };

  // Assign employee to project in modal state
  const handleAssignEmployee = (empId: string) => {
    if (!empId) return;
    if (!stagedAssignedEmployeeIds.includes(empId)) {
      setStagedAssignedEmployeeIds(prev => [...prev, empId]);
    }
    setEmployeeToAddId('');
  };

  // Remove employee from project in modal state
  const handleUnassignEmployee = (empId: string) => {
    setStagedAssignedEmployeeIds(prev => prev.filter(id => id !== empId));
  };

  // Save Modal Project & Employee Reassignments
  const handleSaveModal = () => {
    if (!editingProject) return;
    if (!editingProject.name.trim() || !editingProject.code.trim()) {
      alert('Mohon lengkapi Nama Proyek dan Kode Proyek.');
      return;
    }

    const updatedProject: Project = {
      ...editingProject,
      assignedEmployeeIds: stagedAssignedEmployeeIds
    };

    // Prepare list of employees whose assignedProjectId changed
    const updatedEmployeesList: Employee[] = [];

    // 1. Employees added to this project
    stagedAssignedEmployeeIds.forEach(empId => {
      const emp = employees.find(e => e.id === empId);
      if (emp && emp.assignedProjectId !== updatedProject.id) {
        const updatedEmp: Employee = { ...emp, assignedProjectId: updatedProject.id };
        updatedEmployeesList.push(updatedEmp);
        if (onUpdateEmployee) onUpdateEmployee(updatedEmp);
      }
    });

    // 2. Employees removed from this project (set to default first active project or empty)
    employees.forEach(emp => {
      if (emp.assignedProjectId === updatedProject.id && !stagedAssignedEmployeeIds.includes(emp.id)) {
        // Unassign: fallback to another project or first project
        const fallbackProj = projects.find(p => p.id !== updatedProject.id && p.status === 'ACTIVE') || projects[0];
        const updatedEmp: Employee = { ...emp, assignedProjectId: fallbackProj ? fallbackProj.id : '' };
        updatedEmployeesList.push(updatedEmp);
        if (onUpdateEmployee) onUpdateEmployee(updatedEmp);
      }
    });

    onSaveProject(updatedProject, updatedEmployeesList);

    setSaveSuccessMsg(`Proyek "${updatedProject.name}" dan penugasan ${stagedAssignedEmployeeIds.length} personel berhasil disimpan.`);
    setTimeout(() => {
      setSaveSuccessMsg(null);
      setIsModalOpen(false);
    }, 1500);
  };

  // Helper to fetch employee counts for each project
  const getProjectPersonnel = (projectId: string) => {
    return employees.filter(e => e.assignedProjectId === projectId);
  };

  // Employees available to add (not currently staged in this project)
  const availableEmployeesToAdd = useMemo(() => {
    return employees.filter(e => !stagedAssignedEmployeeIds.includes(e.id));
  }, [employees, stagedAssignedEmployeeIds]);

  return (
    <div className="space-y-6 pb-20 motion-fade-in-up">
      {/* Top Banner & KPI Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border border-slate-800 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/4 -bottom-16 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold border border-orange-500/30 mb-3">
              <Briefcase className="w-3.5 h-3.5 text-orange-400" />
              <span>SISTEM MANAJEMEN PROYEK & SITE LAPANGAN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Manajemen Proyek & Penempatan Personel
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl leading-relaxed">
              Otorisasi penempatan teknisi & engineer ke proyek, atur jam kerja in/out site khusus, serta tetapkan kebijakan cuti roster lapangan independen per lokasi kerja.
            </p>
          </div>

          {canManage && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 transition-all transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Proyek Baru</span>
            </button>
          )}
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Proyek Aktif / Berjalan</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5">
              {stats.activeProjects} <span className="text-xs font-normal text-slate-400">/ {stats.totalProjects} Proyek</span>
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>High-Priority Sites</span>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Pagu Anggaran Disetujui</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-white mt-1.5 truncate">
              {formatIDR(stats.totalBudget)}
            </div>
            <div className="text-xs text-blue-400 font-medium mt-1">
              Alokasi Tenaga Kerja
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Realisasi Upah Tenaga Kerja</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-300 mt-1.5 truncate">
              {formatIDR(stats.totalLaborCost)}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">
              {((stats.totalLaborCost / (stats.totalBudget || 1)) * 100).toFixed(1)}% Penyerapan Anggaran
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Teknisi & Staf Lapangan</span>
              <Users className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5">
              {stats.assignedCount} <span className="text-xs font-normal text-slate-400">/ {employees.length} Personel</span>
            </div>
            <div className="text-xs text-orange-400 font-medium mt-1">
              Terdistribusi di Site
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto overflow-x-auto">
          {(
            [
              { id: 'ALL', label: 'Semua Proyek' },
              { id: 'ACTIVE', label: 'Aktif / Berjalan' },
              { id: 'PLANNING', label: 'Perencanaan' },
              { id: 'COMPLETED', label: 'Selesai' }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, klien, kode site..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-800 dark:text-slate-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Tidak ada proyek yang sesuai kriteria</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau ganti filter status proyek di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map(proj => {
            const assignedPeople = getProjectPersonnel(proj.id);
            const budgetUsedPct = Math.min(100, Math.round(((proj.actualLaborCost || 0) / (proj.allocatedBudget || 1)) * 100));

            // Custom Rule Flags
            const hasCustomSchedule = proj.customRules?.workSchedule?.enabled;
            const customSchedule = proj.customRules?.workSchedule;
            const hasCustomLeave = proj.customRules?.leavePolicy?.enabled;
            const customLeave = proj.customRules?.leavePolicy;
            const hasCustomAllowance = proj.customRules?.allowance?.enabled;
            const hasGeofence = proj.customRules?.geofence?.enabled;

            return (
              <div
                key={proj.id}
                className="glass-card rounded-3xl p-6 bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Top: Code, Status & Client */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-black tracking-wider border border-orange-200 dark:border-orange-800/50">
                        {proj.code}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          proj.status === 'ACTIVE'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : proj.status === 'PLANNING'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {proj.status === 'ACTIVE' ? 'BERJALAN / AKTIF' : proj.status === 'PLANNING' ? 'PERENCANAAN' : 'SELESAI'}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Pagu Anggaran</div>
                      <div className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {formatIDR(proj.allocatedBudget)}
                      </div>
                    </div>
                  </div>

                  {/* Project Name & Client */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug">
                    {proj.name}
                  </h3>

                  <div className="flex flex-col gap-1.5 mt-2.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{proj.client}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{proj.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {proj.startDate} s/d {proj.targetEndDate}
                      </span>
                    </div>
                  </div>

                  {/* Budget & Cost Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-500">Realisasi Biaya Upah:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatIDR(proj.actualLaborCost || 0)}{' '}
                        <span className="text-slate-400 font-normal">({budgetUsedPct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          budgetUsedPct > 85 ? 'bg-rose-500' : budgetUsedPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${budgetUsedPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Highlight: Project-Specific Custom Rules Badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* Work Hours Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                        hasCustomSchedule
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {hasCustomSchedule ? (
                        <span>
                          Site In/Out: <strong>{customSchedule?.checkInTime} - {customSchedule?.checkOutTime}</strong>{' '}
                          (Toleransi {customSchedule?.lateGraceMinutes}m)
                        </span>
                      ) : (
                        <span>Jam Kerja Standar Kantor (08:30)</span>
                      )}
                    </div>

                    {/* Leave / Roster Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                        hasCustomLeave
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Palmtree className="w-3.5 h-3.5 text-emerald-500" />
                      {hasCustomLeave ? (
                        <span>
                          Roster:{' '}
                          <strong>
                            {customLeave?.rosterPattern === '6_ON_2_OFF'
                              ? '6:2 On/Off'
                              : customLeave?.rosterPattern === '10_ON_2_OFF'
                              ? '10:2 On/Off'
                              : customLeave?.rosterPattern === '14_ON_14_OFF'
                              ? '14:14 Remote'
                              : customLeave?.rosterPattern}
                          </strong>{' '}
                          (+{customLeave?.extraRemoteLeaveDays} Cuti Remote)
                        </span>
                      ) : (
                        <span>Aturan Cuti Standar (12 Hari)</span>
                      )}
                    </div>

                    {/* Geofence / Wifi Site */}
                    {hasGeofence && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                        <Wifi className="w-3.5 h-3.5 text-blue-500" />
                        <span>Site Geofence Aktif</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Personnel Previews */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-orange-500" />
                        <span>Personel Bertugas ({assignedPeople.length} Orang):</span>
                      </span>
                      {canManage && (
                        <button
                          onClick={() => handleOpenEdit(proj, 'personnel')}
                          className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                        >
                          + Atur Personel
                        </button>
                      )}
                    </div>

                    {assignedPeople.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-1">Belum ada personel yang ditempatkan di proyek ini.</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedPeople.slice(0, 5).map(emp => (
                          <div
                            key={emp.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-600"
                            title={`${emp.name} - ${emp.position} (${emp.nik})`}
                          >
                            <img
                              src={emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`}
                              alt={emp.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="max-w-[120px] truncate">{emp.name}</span>
                          </div>
                        ))}
                        {assignedPeople.length > 5 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-bold">
                            +{assignedPeople.length - 5} lainnya
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      if (onNavigateToTab) {
                        onNavigateToTab('payroll', proj.id);
                      }
                    }}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Lihat Payroll Site</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {canManage ? (
                      <button
                        onClick={() => handleOpenEdit(proj, 'schedule')}
                        className="px-3.5 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-300 font-bold text-xs border border-orange-200 dark:border-orange-800/60 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Kelola Personel & Aturan</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Read-only view</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Project Management & Custom Rules */}
      {isModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {isCreatingNew ? 'Tambah Proyek Baru' : `Pengaturan Proyek: ${editingProject.name || editingProject.code}`}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Konfigurasi penugasan personel, jam masuk/keluar site, serta aturan roster & cuti khusus.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 gap-2 overflow-x-auto">
              {[
                { id: 'details', label: '1. Detail Proyek', icon: Building2 },
                { id: 'personnel', label: `2. Penempatan Personel (${stagedAssignedEmployeeIds.length})`, icon: Users },
                { id: 'schedule', label: '3. Jam Kerja Site (In/Out)', icon: Clock },
                { id: 'leave', label: '4. Aturan Cuti & Roster', icon: Palmtree },
                { id: 'allowance', label: '5. Tunjangan & Geofence', icon: DollarSign }
              ].map(t => {
                const Icon = t.icon;
                const isActive = modalTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setModalTab(t.id as any)}
                    className={`py-3 px-3.5 border-b-2 font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body with Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 dark:text-slate-200">
              {/* TAB 1: DETAILS */}
              {modalTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Kode Proyek <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingProject.code}
                        onChange={e => setEditingProject({ ...editingProject, code: e.target.value })}
                        placeholder="Contoh: PRIME-ENG-01"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500 font-semibold uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Status Proyek
                      </label>
                      <select
                        value={editingProject.status}
                        onChange={e => setEditingProject({ ...editingProject, status: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500 font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE (Berjalan / Lapangan Aktif)</option>
                        <option value="PLANNING">PLANNING (Tahap Persiapan / Perencanaan)</option>
                        <option value="COMPLETED">COMPLETED (Proyek Selesai)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Proyek Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingProject.name}
                      onChange={e => setEditingProject({ ...editingProject, name: e.target.value })}
                      placeholder="Contoh: Instalasi Mekanikal Smelter KIT Gresik"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Klien / Pemilik Proyek
                      </label>
                      <input
                        type="text"
                        value={editingProject.client}
                        onChange={e => setEditingProject({ ...editingProject, client: e.target.value })}
                        placeholder="Contoh: PT Freeport Indonesia"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Lokasi Site / Lapangan
                      </label>
                      <input
                        type="text"
                        value={editingProject.location}
                        onChange={e => setEditingProject({ ...editingProject, location: e.target.value })}
                        placeholder="Contoh: Manyar, Gresik / Site Pomalaa"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        value={editingProject.startDate}
                        onChange={e => setEditingProject({ ...editingProject, startDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Target Selesai
                      </label>
                      <input
                        type="date"
                        value={editingProject.targetEndDate}
                        onChange={e => setEditingProject({ ...editingProject, targetEndDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Pagu Anggaran Upah (IDR)
                      </label>
                      <input
                        type="number"
                        value={editingProject.allocatedBudget}
                        onChange={e => setEditingProject({ ...editingProject, allocatedBudget: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Estimasi Total Jam Kerja
                      </label>
                      <input
                        type="number"
                        value={editingProject.totalEstimatedHours}
                        onChange={e => setEditingProject({ ...editingProject, totalEstimatedHours: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Multiplier Lembur Site
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={editingProject.hourlyRateMultiplier}
                        onChange={e => setEditingProject({ ...editingProject, hourlyRateMultiplier: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Deskripsi / Lingkup Pekerjaan Proyek
                    </label>
                    <textarea
                      rows={3}
                      value={editingProject.description || ''}
                      onChange={e => setEditingProject({ ...editingProject, description: e.target.value })}
                      placeholder="Jelaskan ruang lingkup teknis, spesifikasi kontrak, atau target deliverable utama di site ini..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: PERSONNEL ASSIGNMENT */}
              {modalTab === 'personnel' && (
                <div className="space-y-5">
                  <div className="bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 rounded-2xl p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-orange-800 dark:text-orange-200">
                      <strong>Penempatan Personel Proyek:</strong> Direksi dan HR dapat menugaskan teknisi, engineer, atau staff ke proyek ini. Karyawan yang ditempatkan akan otomatis mengikuti jadwal jam kerja & kebijakan roster yang ditentukan untuk proyek ini.
                    </div>
                  </div>

                  {/* Add Employee Row */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      + Tambah / Tempatkan Karyawan Baru ke Proyek Ini:
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <select
                        value={employeeToAddId}
                        onChange={e => setEmployeeToAddId(e.target.value)}
                        className="w-full flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500 font-medium"
                      >
                        <option value="">-- Pilih Karyawan untuk Ditempatkan --</option>
                        {availableEmployeesToAdd.map(emp => {
                          const currProj = projects.find(p => p.id === emp.assignedProjectId);
                          return (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.nik}) - {emp.position} [{currProj ? `Saat ini di: ${currProj.code}` : 'Belum Ditugaskan'}]
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAssignEmployee(employeeToAddId)}
                        disabled={!employeeToAddId}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Tempatkan</span>
                      </button>
                    </div>
                  </div>

                  {/* Staged Personnel List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Daftar Personel Bertugas ({stagedAssignedEmployeeIds.length} Karyawan):
                      </h4>
                      <div className="relative w-48">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter nama/NIK..."
                          value={personnelSearch}
                          onChange={e => setPersonnelSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>

                    {stagedAssignedEmployeeIds.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <div className="text-xs">Belum ada karyawan yang ditempatkan di proyek ini.</div>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {stagedAssignedEmployeeIds
                          .map(id => employees.find(e => e.id === id))
                          .filter(Boolean)
                          .filter(emp => {
                            if (!personnelSearch) return true;
                            const q = personnelSearch.toLowerCase();
                            return emp!.name.toLowerCase().includes(q) || emp!.nik.toLowerCase().includes(q);
                          })
                          .map(emp => (
                            <div
                              key={emp!.id}
                              className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-orange-300 dark:hover:border-orange-700/60 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={emp!.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp!.name)}&background=random`}
                                  alt={emp!.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                                />
                                <div>
                                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>{emp!.name}</span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                      {emp!.nik}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {emp!.position} • {emp!.department} • <span className="font-semibold">{emp!.employmentType}</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleUnassignEmployee(emp!.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Lepas penugasan dari proyek ini"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                <span>Lepaskan</span>
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: WORK SCHEDULE (JAM KERJA IN/OUT) */}
              {modalTab === 'schedule' && (
                <div className="space-y-6">
                  {/* Enable Switch */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span>Gunakan Jam Kerja Khusus Proyek (In/Out Site)</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Jika diaktifkan, presensi teknisi di site ini akan dievaluasi berdasarkan jam kerja proyek di bawah, bukan jam kantor umum (08:30 WIB).
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingProject.customRules?.workSchedule?.enabled)}
                        onChange={e => {
                          const currentSchedule: ProjectWorkSchedule = editingProject.customRules?.workSchedule || {
                            enabled: false,
                            workDays: 6,
                            checkInTime: '07:30',
                            checkOutTime: '16:30',
                            lateGraceMinutes: 15,
                            saturdayWork: true,
                            saturdayCheckIn: '07:30',
                            saturdayCheckOut: '12:30',
                            allowFlexibleHours: false
                          };
                          setEditingProject({
                            ...editingProject,
                            customRules: {
                              ...editingProject.customRules,
                              workSchedule: { ...currentSchedule, enabled: e.target.checked }
                            }
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  {editingProject.customRules?.workSchedule?.enabled ? (
                    <div className="space-y-4 p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Jam Masuk (Check-In) Site
                          </label>
                          <input
                            type="time"
                            value={editingProject.customRules.workSchedule.checkInTime}
                            onChange={e =>
                              setEditingProject({
                                ...editingProject,
                                customRules: {
                                  ...editingProject.customRules,
                                  workSchedule: {
                                    ...editingProject.customRules!.workSchedule!,
                                    checkInTime: e.target.value
                                  }
                                }
                              })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black focus:ring-2 focus:ring-orange-500"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">Standar site konstruksi/smelter: 07:00 atau 07:30</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Jam Pulang (Check-Out) Site
                          </label>
                          <input
                            type="time"
                            value={editingProject.customRules.workSchedule.checkOutTime}
                            onChange={e =>
                              setEditingProject({
                                ...editingProject,
                                customRules: {
                                  ...editingProject.customRules,
                                  workSchedule: {
                                    ...editingProject.customRules!.workSchedule!,
                                    checkOutTime: e.target.value
                                  }
                                }
                              })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black focus:ring-2 focus:ring-orange-500"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">Presensi checkout sebelum jam ini dihitung pulang cepat</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Toleransi Keterlambatan Site (Menit)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={60}
                            value={editingProject.customRules.workSchedule.lateGraceMinutes}
                            onChange={e =>
                              setEditingProject({
                                ...editingProject,
                                customRules: {
                                  ...editingProject.customRules,
                                  workSchedule: {
                                    ...editingProject.customRules!.workSchedule!,
                                    lateGraceMinutes: Number(e.target.value)
                                  }
                                }
                              })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">Misal 15 menit (Check-in s/d 07:45 tidak terkena penalti)</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Format Hari Kerja Mingguan
                          </label>
                          <select
                            value={editingProject.customRules.workSchedule.workDays}
                            onChange={e =>
                              setEditingProject({
                                ...editingProject,
                                customRules: {
                                  ...editingProject.customRules,
                                  workSchedule: {
                                    ...editingProject.customRules!.workSchedule!,
                                    workDays: Number(e.target.value)
                                  }
                                }
                              })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                          >
                            <option value={5}>5 Hari Kerja (Senin s/d Jumat - 8 Jam/hari)</option>
                            <option value={6}>6 Hari Kerja (Senin s/d Sabtu - Shift Lapangan)</option>
                          </select>
                        </div>
                      </div>

                      {editingProject.customRules.workSchedule.workDays === 6 && (
                        <div className="pt-3 border-t border-amber-200 dark:border-amber-800/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Jam Masuk Hari Sabtu
                            </label>
                            <input
                              type="time"
                              value={editingProject.customRules.workSchedule.saturdayCheckIn || '07:30'}
                              onChange={e =>
                                setEditingProject({
                                  ...editingProject,
                                  customRules: {
                                    ...editingProject.customRules,
                                    workSchedule: {
                                      ...editingProject.customRules!.workSchedule!,
                                      saturdayCheckIn: e.target.value
                                    }
                                  }
                                })
                              }
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Jam Pulang Hari Sabtu
                            </label>
                            <input
                              type="time"
                              value={editingProject.customRules.workSchedule.saturdayCheckOut || '12:30'}
                              onChange={e =>
                                setEditingProject({
                                  ...editingProject,
                                  customRules: {
                                    ...editingProject.customRules,
                                    workSchedule: {
                                      ...editingProject.customRules!.workSchedule!,
                                      saturdayCheckOut: e.target.value
                                    }
                                  }
                                })
                              }
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <div className="text-xs">
                        Saat ini proyek mengikuti jam kerja kantor umum <strong>(Cutoff {salaryRules.cutoffTime} WIB, toleransi {salaryRules.lateGracePeriodMinutes} menit)</strong>.
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Aktifkan switch di atas jika proyek memiliki jam operasional lapangan tersendiri.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LEAVE & ROSTER (ATURAN CUTI PROYEK) */}
              {modalTab === 'leave' && (
                <div className="space-y-6">
                  {/* Enable Switch */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Palmtree className="w-4 h-4 text-emerald-500" />
                        <span>Gunakan Kebijakan Cuti & Roster Khusus Proyek</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tetapkan pola rotasi kerja (Roster On/Off), cuti kompensasi remote, dan syarat serah terima sebelum cuti dapat disetujui HR.
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingProject.customRules?.leavePolicy?.enabled)}
                        onChange={e => {
                          const currentLeave: ProjectLeavePolicy = editingProject.customRules?.leavePolicy || {
                            enabled: false,
                            rosterPattern: '6_ON_2_OFF',
                            customRosterDesc: '',
                            extraRemoteLeaveDays: 2,
                            minimumNoticeDays: 7,
                            requiresHandover: true,
                            customLeaveNotes: ''
                          };
                          setEditingProject({
                            ...editingProject,
                            customRules: {
                              ...editingProject.customRules,
                              leavePolicy: { ...currentLeave, enabled: e.target.checked }
                            }
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {editingProject.customRules?.leavePolicy?.enabled ? (
                    <div className="space-y-4 p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Skema Rotasi / Roster Kerja Site
                        </label>
                        <select
                          value={editingProject.customRules.leavePolicy.rosterPattern}
                          onChange={e =>
                            setEditingProject({
                              ...editingProject,
                              customRules: {
                                ...editingProject.customRules,
                                leavePolicy: {
                                  ...editingProject.customRules!.leavePolicy!,
                                  rosterPattern: e.target.value as any
                                }
                              }
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="6_ON_2_OFF">Roster Lapangan: 6 Minggu On-Duty / 2 Minggu Off-Duty (6:2)</option>
                          <option value="10_ON_2_OFF">Roster Tambang Intensif: 10 Minggu On / 2 Minggu Off (10:2)</option>
                          <option value="14_ON_14_OFF">Roster Rotasi Remote: 14 Hari On / 14 Hari Off (14:14)</option>
                          <option value="NORMAL">Normal 5-Hari Kerja (Tanpa Sistem Roster)</option>
                          <option value="CUSTOM">Skema Roster Kustom (Tuliskan secara manual)</option>
                        </select>
                      </div>

                      {editingProject.customRules.leavePolicy.rosterPattern === 'CUSTOM' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Deskripsi Skema Roster Kustom
                          </label>
                          <input
                            type="text"
                            value={editingProject.customRules.leavePolicy.customRosterDesc || ''}
                            onChange={e =>
                              setEditingProject({
                                ...editingProject,
                                customRules: {
                                  ...editingProject.customRules,
                                  leavePolicy: {
                                    ...editingProject.customRules!.leavePolicy!,
                                    customRosterDesc: e.target.value
                                  }
                                }
                              })
                            }
                            placeholder="Contoh: 4 Minggu On / 10 Hari Off"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Tambahan Kuota Cuti Kompensasi Remote (Hari)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={30}
                            value={editingProject.customRules.leavePolicy.extraRemoteLeaveDays}
                            onChange={e =>
                              setEditingProject({
                                ...editingProject,
                                customRules: {
                                  ...editingProject.customRules,
                                  leavePolicy: {
                                    ...editingProject.customRules!.leavePolicy!,
                                    extraRemoteLeaveDays: Number(e.target.value)
                                  }
                                }
                              })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">
                            Hak kompensasi hari istirahat tambahan setelah periode roster lapangan
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Batas Minimal Pengajuan Cuti (Hari Sebelum Cuti)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={editingProject.customRules.leavePolicy.minimumNoticeDays}
                            onChange={e =>
                              setEditingProject({
                                ...editingProject,
                                customRules: {
                                  ...editingProject.customRules,
                                  leavePolicy: {
                                    ...editingProject.customRules!.leavePolicy!,
                                    minimumNoticeDays: Number(e.target.value)
                                  }
                                }
                              })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">Misal minimal H-7 agar jadwal shift pengganti siap</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProject.customRules.leavePolicy.requiresHandover)}
                            onChange={e =>
                              setEditingProject({
                                ...editingProject,
                                customRules: {
                                  ...editingProject.customRules,
                                  leavePolicy: {
                                    ...editingProject.customRules!.leavePolicy!,
                                    requiresHandover: e.target.checked
                                  }
                                }
                              })
                            }
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Wajib Menunjuk Personel Pengganti (Handover PIC Site) Sebelum Cuti Disetujui
                          </span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Catatan / Kebijakan Tambahan Cuti Site
                        </label>
                        <textarea
                          rows={2}
                          value={editingProject.customRules.leavePolicy.customLeaveNotes || ''}
                          onChange={e =>
                            setEditingProject({
                              ...editingProject,
                              customRules: {
                                ...editingProject.customRules,
                                leavePolicy: {
                                  ...editingProject.customRules!.leavePolicy!,
                                  customLeaveNotes: e.target.value
                                }
                              }
                            })
                          }
                          placeholder="Misal: Dilarang cuti saat fase Commissioning & Pengujian Smelter..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <Palmtree className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <div className="text-xs">
                        Saat ini proyek mengikuti aturan cuti standar kantor (Jatah tahunan 12 hari, permohonan umum).
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Aktifkan switch di atas untuk menerapkan sistem roster lapangan (6:2, 10:2, remote kompensasi).
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ALLOWANCE & GEOFENCE */}
              {modalTab === 'allowance' && (
                <div className="space-y-6">
                  {/* Site Allowance Section */}
                  <div className="p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-blue-500" />
                          <span>Tunjangan Lapangan Khusus Proyek Ini</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Uang saku site harian & tunjangan remote project per bulan untuk teknisi yang bertugas.
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProject.customRules?.allowance?.enabled)}
                          onChange={e => {
                            const currentAllowance: ProjectAllowanceRule = editingProject.customRules?.allowance || {
                              enabled: false,
                              dailySiteAllowance: 75000,
                              monthlyRemoteAllowance: 1500000
                            };
                            setEditingProject({
                              ...editingProject,
                              customRules: {
                                ...editingProject.customRules,
                                allowance: { ...currentAllowance, enabled: e.target.checked }
                              }
                            });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>

                    {editingProject.customRules?.allowance?.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-blue-200 dark:border-blue-800/40">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Uang Saku Lapangan Harian (IDR / Hari Hadir)
                          </label>
                          <input
                            type="number"
                            value={editingProject.customRules.allowance.dailySiteAllowance}
                            onChange={e =>
                              setEditingProject({
                                ...editingProject,
                                customRules: {
                                  ...editingProject.customRules,
                                  allowance: {
                                    ...editingProject.customRules!.allowance!,
                                    dailySiteAllowance: Number(e.target.value)
                                  }
                                }
                              })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Tunjangan Remote Lapangan Bulanan (IDR / Bulan)
                          </label>
                          <input
                            type="number"
                            value={editingProject.customRules.allowance.monthlyRemoteAllowance}
                            onChange={e =>
                              setEditingProject({
                                ...editingProject,
                                customRules: {
                                  ...editingProject.customRules,
                                  allowance: {
                                    ...editingProject.customRules!.allowance!,
                                    monthlyRemoteAllowance: Number(e.target.value)
                                  }
                                }
                              })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Geofence Section */}
                  <div className="p-5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-indigo-500" />
                          <span>Geofence GPS & Wi-Fi Resmi Site Proyek</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Validasi lokasi kamera presensi mandiri saat teknisi melakukan absensi di titik proyek.
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProject.customRules?.geofence?.enabled)}
                          onChange={e => {
                            const currentGeo: ProjectGeofenceRule = editingProject.customRules?.geofence || {
                              enabled: false,
                              siteName: editingProject.location || 'Site Proyek',
                              latitude: -7.15,
                              longitude: 112.65,
                              radiusMeters: 300,
                              allowedWifiSsid: `PRIME-Site-${editingProject.code}`
                            };
                            setEditingProject({
                              ...editingProject,
                              customRules: {
                                ...editingProject.customRules,
                                geofence: { ...currentGeo, enabled: e.target.checked }
                              }
                            });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>

                    {editingProject.customRules?.geofence?.enabled && (
                      <div className="space-y-4 pt-3 border-t border-indigo-200 dark:border-indigo-800/40">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Latitude Titik Site
                            </label>
                            <input
                              type="number"
                              step="0.000001"
                              value={editingProject.customRules.geofence.latitude}
                              onChange={e =>
                                setEditingProject({
                                  ...editingProject,
                                  customRules: {
                                    ...editingProject.customRules,
                                    geofence: {
                                      ...editingProject.customRules!.geofence!,
                                      latitude: Number(e.target.value)
                                    }
                                  }
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Longitude Titik Site
                            </label>
                            <input
                              type="number"
                              step="0.000001"
                              value={editingProject.customRules.geofence.longitude}
                              onChange={e =>
                                setEditingProject({
                                  ...editingProject,
                                  customRules: {
                                    ...editingProject.customRules,
                                    geofence: {
                                      ...editingProject.customRules!.geofence!,
                                      longitude: Number(e.target.value)
                                    }
                                  }
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Radius Toleransi (Meter)
                            </label>
                            <input
                              type="number"
                              min={50}
                              max={2000}
                              value={editingProject.customRules.geofence.radiusMeters}
                              onChange={e =>
                                setEditingProject({
                                  ...editingProject,
                                  customRules: {
                                    ...editingProject.customRules,
                                    geofence: {
                                      ...editingProject.customRules!.geofence!,
                                      radiusMeters: Number(e.target.value)
                                    }
                                  }
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            SSID Wi-Fi Lapangan Resmi (Site Office Access Point)
                          </label>
                          <input
                            type="text"
                            value={editingProject.customRules.geofence.allowedWifiSsid || ''}
                            onChange={e =>
                              setEditingProject({
                                ...editingProject,
                                customRules: {
                                  ...editingProject.customRules,
                                  geofence: {
                                    ...editingProject.customRules!.geofence!,
                                    allowedWifiSsid: e.target.value
                                  }
                                }
                              })
                            }
                            placeholder="Contoh: PRIME-SiteOffice-Manyar"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="text-xs text-slate-500">
                {saveSuccessMsg ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> {saveSuccessMsg}
                  </span>
                ) : (
                  <span>Perubahan akan langsung dicatat ke database SQLite & Audit Trail.</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Proyek & Personel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
