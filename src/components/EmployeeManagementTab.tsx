import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CreditCard,
  Wifi,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle2,
  Briefcase,
  X,
  Lock,
  ShieldCheck,
  UserCheck,
  Shield,
  Crown
} from 'lucide-react';
import { Employee, Project, SystemRole, getEffectiveSystemRole } from '../types';
import { formatIDR } from '../utils/payrollCalculator';

interface EmployeeManagementTabProps {
  currentUser?: Employee;
  employees: Employee[];
  projects: Project[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export const EmployeeManagementTab: React.FC<EmployeeManagementTabProps> = ({
  currentUser,
  employees,
  projects,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee
}) => {
  const currentRole: SystemRole = getEffectiveSystemRole(currentUser);
  const isStaff = currentRole === 'staff';
  const isSuperuser = currentRole === 'superuser';

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form fields
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+62 8');
  const [department, setDepartment] = useState('Engineering & Digital Transformation');
  const [position, setPosition] = useState('Senior Machining Engineer');
  const [role, setRole] = useState<'Employee' | 'HR_Manager' | 'Project_Manager' | 'Director'>('Employee');
  const [systemRole, setSystemRole] = useState<SystemRole>('staff');
  const [employmentType, setEmploymentType] = useState<'TETAP' | 'KONTRAK' | 'PROJECT_HIRE'>('TETAP');
  const [assignedProjectId, setAssignedProjectId] = useState(projects[0]?.id || 'PRJ-FPT-01');
  const [baseSalary, setBaseSalary] = useState(10000000);
  const [fixedAllowance, setFixedAllowance] = useState(2000000);
  const [dailyAllowance, setDailyAllowance] = useState(50000);
  const [leaveQuota, setLeaveQuota] = useState(12);
  const [bankName, setBankName] = useState('Bank Central Asia (BCA)');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [deviceMac, setDeviceMac] = useState('74:D2:1D:9A:88:FF');

  const openAddModal = () => {
    setEditingEmployee(null);
    setNik(`DMJ-2026-${String(employees.length + 1).padStart(3, '0')}`);
    setName('');
    setEmail('');
    setPhone('+62 8');
    setDepartment('Engineering & Mechanical Services');
    setPosition('Field Machining Specialist');
    setRole('Employee');
    setSystemRole('staff');
    setEmploymentType('TETAP');
    setAssignedProjectId(projects[0]?.id || 'DMJ-ENG-01');
    setBaseSalary(10000000);
    setFixedAllowance(2000000);
    setDailyAllowance(50000);
    setLeaveQuota(12);
    setBankName('Bank Central Asia (BCA)');
    setAccountNumber('');
    setAccountHolder('');
    setDeviceMac('8C:15:C8:33:AA:10');
    setModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setNik(emp.nik);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone);
    setDepartment(emp.department);
    setPosition(emp.position);
    setRole(emp.role);
    setSystemRole(getEffectiveSystemRole(emp));
    setEmploymentType(emp.employmentType);
    setAssignedProjectId(emp.assignedProjectId);
    setBaseSalary(emp.baseSalary);
    setFixedAllowance(emp.fixedAllowance);
    setDailyAllowance(emp.dailyAllowance);
    setLeaveQuota(emp.leaveQuota);
    setBankName(emp.bankAccount.bankName);
    setAccountNumber(emp.bankAccount.accountNumber);
    setAccountHolder(emp.bankAccount.accountHolder);
    setDeviceMac(emp.deviceMac || '8C:15:C8:33:AA:10');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const empData: Employee = {
      id: editingEmployee ? editingEmployee.id : `EMP-${Date.now()}`,
      nik,
      name,
      email,
      phone,
      avatar: editingEmployee?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role,
      systemRole,
      department,
      position,
      employmentType,
      joinDate: editingEmployee ? editingEmployee.joinDate : '2026-09-01',
      assignedProjectId,
      baseSalary: Number(baseSalary),
      fixedAllowance: Number(fixedAllowance),
      dailyAllowance: Number(dailyAllowance),
      leaveQuota: Number(leaveQuota),
      usedLeave: editingEmployee ? editingEmployee.usedLeave : 0,
      bankAccount: {
        bankName,
        accountNumber,
        accountHolder: accountHolder || name
      },
      deviceMac
    };

    if (editingEmployee) {
      onUpdateEmployee(empData);
    } else {
      onAddEmployee(empData);
    }
    setModalOpen(false);
  };

  const departments = Array.from(new Set(employees.map(e => e.department)));

  const baseEmployees = isStaff
    ? employees.filter(e => e.id === currentUser?.id)
    : employees;

  const filteredEmployees = baseEmployees.filter(e => {
    const matchSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter === 'ALL' || e.department === deptFilter;
    const matchProject = projectFilter === 'ALL' || e.assignedProjectId === projectFilter;
    const matchRole = roleFilter === 'ALL' || getEffectiveSystemRole(e) === roleFilter;
    return matchSearch && matchDept && matchProject && matchRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Banner */}
      <div id="tour-employee-header" className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 motion-fade-in-down">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="prime-cut-corner bg-[#FF6B00] text-white text-[10px] font-black px-2.5 py-0.5 tracking-wider uppercase font-mono-code">
              {isStaff ? 'PROFIL PRIBADI STAF' : 'WORKFORCE REPOSITORY'}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {isStaff ? 'Terkunci ke Data Diri Sendiri' : 'Human Resource Master Data'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isStaff ? 'Profil Data Pribadi Karyawan' : 'User Management & Direktori Karyawan PT Dwi Martha Jaya'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {isStaff
              ? 'Berikut rincian master profil Anda: NIK resmi, alokasi kuota cuti tahunan, nomor rekening payroll, dan binding MAC WiFi.'
              : 'Database pengguna resmi, pengaturan struktur gaji, tracking saldo cuti, dan binding keamanan perangkat WiFi PT Dwi Martha Jaya.'}
          </p>
        </div>

        {!isStaff && (
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-2xl btn-orange font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Karyawan Baru</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div id="tour-employee-filters" className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 motion-fade-in-up stagger-1">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="ALL">Semua Departemen</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium font-mono-code"
          >
            <option value="ALL">Semua Alokasi Proyek</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.name.substring(0, 24)}...</option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium font-mono-code"
          >
            <option value="ALL">Semua Role Sistem</option>
            <option value="superuser">👑 Superuser</option>
            <option value="admin">🛡️ Admin HR</option>
            <option value="staff">👤 Staff Biasa</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, NIK, jabatan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full glass-input rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800"
          />
        </div>
      </div>

      {/* Employees Grid Table */}
      <div id="tour-employee-table" className="glass-card rounded-3xl p-5 sm:p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-mono-code">
                <th className="py-2.5 px-3">Karyawan</th>
                <th className="py-2.5 px-3">Posisi & Penugasan</th>
                <th className="py-2.5 px-3">Role & Hak Akses</th>
                <th className="py-2.5 px-3">Gaji Pokok & Tunjangan</th>
                <th className="py-2.5 px-3">Saldo Cuti</th>
                <th className="py-2.5 px-3">Rekening Bank</th>
                <th className="py-2.5 px-3">MAC / Keamanan</th>
                {!isStaff && <th className="py-2.5 px-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp, idx) => {
                const assignedProj = projects.find(p => p.id === emp.assignedProjectId);
                const remainingLeave = emp.leaveQuota - emp.usedLeave;
                const effRole = getEffectiveSystemRole(emp);

                return (
                  <tr
                    key={emp.id}
                    style={{ animationDelay: `${(idx + 1) * 45}ms` }}
                    className="hover:bg-slate-50/70 transition-colors table-row-animate"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{emp.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono-code">{emp.nik} • {emp.employmentType}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{emp.position}</div>
                      <div className="text-[10px] text-slate-500">{emp.department}</div>
                      {assignedProj && (
                        <span className="inline-block mt-0.5 text-[9px] font-mono-code font-bold text-orange-600 bg-orange-50 px-1.5 py-0.2 rounded">
                          {assignedProj.code}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {effRole === 'superuser' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-black text-[10px] uppercase font-mono-code shadow-xs">
                          <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>SUPERUSER</span>
                        </div>
                      ) : effRole === 'admin' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-300 font-black text-[10px] uppercase font-mono-code shadow-xs">
                          <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>ADMIN HR</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] uppercase font-mono-code">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>STAFF BIASA</span>
                        </div>
                      )}
                      <div className="text-[9px] text-slate-500 font-mono-code mt-0.5 capitalize">
                        {emp.role.replace('_', ' ')}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 font-mono-code">{formatIDR(emp.baseSalary)}</div>
                      <div className="text-[10px] text-slate-500 font-mono-code">
                        Tunj. Tetap: {formatIDR(emp.fixedAllowance)}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          remainingLeave > 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          Sisa: {remainingLeave} Hari
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Kuota: {emp.leaveQuota} | Terpakai: {emp.usedLeave}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{emp.bankAccount.bankName}</div>
                      <div className="text-[10px] text-slate-500 font-mono-code">{emp.bankAccount.accountNumber}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 font-mono-code text-[11px] text-slate-700">
                        <Wifi className="w-3 h-3 text-emerald-600" />
                        <span>{emp.deviceMac || 'Belum Terikat'}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 uppercase">WiFi Hardware Lock</span>
                    </td>

                    {!isStaff && (
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#FF6B00] hover:bg-orange-50 transition-colors cursor-pointer"
                            title="Edit Karyawan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isSuperuser && (
                            <button
                              onClick={() => {
                                if (confirm(`Yakin hapus data karyawan ${emp.name}?`)) {
                                  onDeleteEmployee(emp.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Karyawan (Superuser)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8 border border-slate-200 modal-dialog-animate">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                </h3>
                <p className="text-xs text-slate-500">Isi parameter gaji, jatah cuti, dan MAC device WiFi</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Nomor Induk Karyawan (NIK)</label>
                  <input
                    type="text"
                    value={nik}
                    onChange={e => setNik(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 font-mono-code"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Email Perusahaan</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 font-mono-code"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Departemen</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Jabatan / Posisi</label>
                  <input
                    type="text"
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2"
                    required
                  />
                </div>
              </div>

              {/* RBAC System Role & Functional Role Settings */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 font-mono-code">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    Hak Akses Sistem (RBAC) & Role Jabatan
                  </span>
                  <span className="text-[10px] font-black font-mono-code text-indigo-700 bg-white/80 px-2 py-0.5 rounded-md border border-indigo-200">
                    {systemRole === 'superuser' ? '👑 FULL ACCESS' : systemRole === 'admin' ? '🛡️ MANAGEMENT' : '👤 PERSONAL SCOPE'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center justify-between">
                      <span>Tingkat Akses (RBAC)</span>
                      <span className="text-[9px] font-mono-code text-indigo-600 font-semibold">Security Level</span>
                    </label>
                    <select
                      value={systemRole}
                      onChange={e => {
                        const newSysRole = e.target.value as SystemRole;
                        setSystemRole(newSysRole);
                        if (newSysRole === 'superuser' && role === 'Employee') {
                          setRole('Director');
                        }
                      }}
                      className="w-full glass-input rounded-xl px-3 py-2 font-bold text-slate-900 mt-1 bg-white border border-indigo-200 focus:border-indigo-500"
                    >
                      <option value="staff">👤 Staff Biasa (Hanya Akses Data Sendiri)</option>
                      <option value="admin">🛡️ Admin (HR, Proyek, Approval & Master Data)</option>
                      {(isSuperuser || editingEmployee?.systemRole === 'superuser') && (
                        <option value="superuser">👑 Superuser (Direktur & Hak Akses Penuh)</option>
                      )}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      {systemRole === 'superuser' && '👑 Superuser memiliki otoritas mutlak seluruh sistem, bypass verifikasi, dan konfigurasi master.'}
                      {systemRole === 'admin' && '🛡️ Admin HR mengelola data seluruh karyawan, approval berjenjang, timesheet, dan payroll.'}
                      {systemRole === 'staff' && '👤 Staff biasa dibatasi ketat hanya dapat melihat profil, absensi, cuti, dan slip gaji sendiri.'}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center justify-between">
                      <span>Role Jabatan Organisasi</span>
                      <span className="text-[9px] font-mono-code text-orange-600 font-semibold">Title Hierarchy</span>
                    </label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as any)}
                      className="w-full glass-input rounded-xl px-3 py-2 font-bold text-orange-600 mt-1 bg-white border border-indigo-200 focus:border-orange-500"
                    >
                      <option value="Employee">Employee (Staff / Teknis Lapangan)</option>
                      <option value="HR_Manager">HR Manager</option>
                      <option value="Project_Manager">Project Manager</option>
                      <option value="Director">Director / Superadmin</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Menentukan titel hierarki fungsional jabatan dan rantai persetujuan berjenjang.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Tipe Kontrak</label>
                  <select
                    value={employmentType}
                    onChange={e => setEmploymentType(e.target.value as any)}
                    className="w-full glass-input rounded-xl px-3 py-2"
                  >
                    <option value="TETAP">Karyawan Tetap (PKWTT)</option>
                    <option value="KONTRAK">Karyawan Kontrak (PKWT)</option>
                    <option value="PROJECT_HIRE">Project-Based Hire</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Alokasi Proyek Utama</label>
                  <select
                    value={assignedProjectId}
                    onChange={e => setAssignedProjectId(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 font-mono-code"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name.substring(0, 20)}...</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Jatah Cuti Tahunan (Hari)</label>
                  <input
                    type="number"
                    value={leaveQuota}
                    onChange={e => setLeaveQuota(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold"
                    min={0}
                    max={30}
                    required
                  />
                </div>
              </div>

              {/* Salary Section */}
              <div className="p-3 rounded-2xl bg-orange-50/50 border border-orange-200/80 space-y-3">
                <p className="text-[11px] font-bold text-[#FF6B00] uppercase tracking-wider">
                  Pengaturan Skema Gaji & Tunjangan
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Gaji Pokok (IDR)</label>
                    <input
                      type="number"
                      step={500000}
                      value={baseSalary}
                      onChange={e => setBaseSalary(Number(e.target.value))}
                      className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Tunjangan Tetap (IDR)</label>
                    <input
                      type="number"
                      step={100000}
                      value={fixedAllowance}
                      onChange={e => setFixedAllowance(Number(e.target.value))}
                      className="w-full glass-input rounded-xl px-3 py-2 font-mono-code"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Uang Harian Makan/Transp</label>
                    <input
                      type="number"
                      step={5000}
                      value={dailyAllowance}
                      onChange={e => setDailyAllowance(Number(e.target.value))}
                      className="w-full glass-input rounded-xl px-3 py-2 font-mono-code"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Bank & Hardware Security */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Nama Bank</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Nomor Rekening</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 font-mono-code"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">MAC Address Perangkat</label>
                  <input
                    type="text"
                    value={deviceMac}
                    onChange={e => setDeviceMac(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 font-mono-code"
                    placeholder="XX:XX:XX:XX:XX:XX"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl btn-orange text-white text-xs font-bold cursor-pointer"
                >
                  Simpan Data Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
