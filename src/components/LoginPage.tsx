import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  Zap,
  CheckCircle2,
  Building2,
  Briefcase,
  HardHat,
  Users,
  Server,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { AuthUser } from '../types';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
}

interface RolePreset {
  id: string;
  roleTitle: string;
  badge: string;
  username: string;
  password: string;
  name: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderHover: string;
  desc: string;
}

const PRESETS: RolePreset[] = [
  {
    id: 'superadmin',
    roleTitle: 'Superadmin / Direktur',
    badge: 'Superuser',
    username: 'admin',
    password: 'admin123',
    name: 'Galih Primananda, S.E.',
    icon: <Sparkles className="w-5 h-5 text-amber-500" />,
    bgColor: 'bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/20 dark:hover:bg-amber-900/30',
    textColor: 'text-amber-800 dark:text-amber-300',
    borderHover: 'hover:border-amber-400',
    desc: 'Akses penuh: Seluruh modul, Master Payroll, Salary Rules & Sistem DB'
  },
  {
    id: 'hr_manager',
    roleTitle: 'HR Manager',
    badge: 'Admin',
    username: 'hrmanager',
    password: 'hr123',
    name: 'Siti Rahmawati, S.Psi.',
    icon: <Briefcase className="w-5 h-5 text-blue-500" />,
    bgColor: 'bg-blue-50/80 hover:bg-blue-100/90 dark:bg-blue-950/20 dark:hover:bg-blue-900/30',
    textColor: 'text-blue-800 dark:text-blue-300',
    borderHover: 'hover:border-blue-400',
    desc: 'Approval Cuti & Reimburse, Manajemen Karyawan & Penggajian'
  },
  {
    id: 'project_manager',
    roleTitle: 'Project Manager',
    badge: 'Admin',
    username: 'projmanager',
    password: 'pm123',
    name: 'Budi Santoso, S.T.',
    icon: <HardHat className="w-5 h-5 text-emerald-500" />,
    bgColor: 'bg-emerald-50/80 hover:bg-emerald-100/90 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    borderHover: 'hover:border-emerald-400',
    desc: 'Monitoring presensi tim site/mining, approval dinas & lembur proyek'
  },
  {
    id: 'employee',
    roleTitle: 'Karyawan / Staff',
    badge: 'Staff',
    username: 'karyawan',
    password: 'staff123',
    name: 'Hendra Wijaya, A.Md.T.',
    icon: <Users className="w-5 h-5 text-purple-500" />,
    bgColor: 'bg-purple-50/80 hover:bg-purple-100/90 dark:bg-purple-950/20 dark:hover:bg-purple-900/30',
    textColor: 'text-purple-800 dark:text-purple-300',
    borderHover: 'hover:border-purple-400',
    desc: 'Presensi Kamera Selfie, Pengajuan Izin/Klaim & Cek Slip Gaji Pribadi'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginUser = customUser !== undefined ? customUser : identifier;
    const loginPass = customPass !== undefined ? customPass : password;

    if (!loginUser.trim()) {
      setErrorMessage('Silakan masukkan email atau username Anda');
      return;
    }
    if (!loginPass) {
      setErrorMessage('Silakan masukkan password');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await api.login(loginUser.trim(), loginPass);
      if (data.success && data.user && data.token) {
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMessage((data as any).error || 'Autentikasi gagal');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat menghubungi server');
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (preset: RolePreset) => {
    setActivePresetId(preset.id);
    setIdentifier(preset.username);
    setPassword(preset.password);
    setErrorMessage(null);
    handleLogin(undefined, preset.username, preset.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background Decor Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-5xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: BRANDING & SYSTEM INFO */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-8 text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Enterprise HR & Payroll System</span>
            </div>

            {/* Title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 font-bold text-2xl text-white">
                P
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Prime HRIS</h1>
                <p className="text-xs text-blue-300 font-medium">Smart Workforce & Payroll Automation</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mt-4 leading-relaxed">
              Platform manajemen SDM komprehensif dengan engine sinkronisasi real-time (RTC), anti-tamper server clock, dan kontrol hak akses multi-peran (RBAC).
            </p>

            {/* Key Capabilities */}
            <div className="mt-8 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Real-Time Event Stream (SSE)</h4>
                  <p className="text-xs text-slate-400">Sinkronisasi presensi, approval, dan notifikasi instan tanpa reload.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Role-Based Access Control (RBAC)</h4>
                  <p className="text-xs text-slate-400">Pemisahan wewenang ketat untuk Direktur, HR, PM, dan Karyawan.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Multi-Project Labor Costing</h4>
                  <p className="text-xs text-slate-400">Pelacakan jam kerja dan distribusi biaya gaji per kode proyek.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>DEV20 Node.js 24 + SQLite WAL</span>
            </div>
            <span className="font-mono text-slate-500">v2.4 Live</span>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM & ROLE PRESETS */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Masuk ke Akun Anda</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Gunakan kredensial resmi atau pilih preset peran di bawah untuk demonstrasi.
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Email atau Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin, hrmanager, atau staff@primeprojectx.net"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                  />
                  <span>Ingat sesi perangkat ini (7 Hari)</span>
                </label>
                <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  Lupa password?
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memverifikasi kredensial...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Sistem</span>
                  </>
                )}
              </button>
            </form>

            {/* QUICK PRESET ROLE SWITCHER FOR DEMO / TESTING */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Akses Cepat Pengujian (1-Klik Role Preset):
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Klik untuk langsung login</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    disabled={isLoading}
                    className={`text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                      preset.bgColor
                    } ${preset.borderHover} ${
                      activePresetId === preset.id
                        ? 'ring-2 ring-blue-500 border-transparent shadow-md'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        {preset.icon}
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {preset.roleTitle}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${preset.textColor} bg-white/70 dark:bg-slate-800/80 shadow-xs`}>
                        {preset.badge}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                      {preset.name}
                    </div>

                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {preset.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 text-center text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
            &copy; 2026 Prime HRIS Enterprise. Hosted on Linux DEV20 High-Availability Cluster.
          </div>
        </div>
      </div>
    </div>
  );
};
