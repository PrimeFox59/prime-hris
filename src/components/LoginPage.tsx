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
  Sparkles,
  MapPin,
  Wifi,
  Database,
  Shield,
  Clock,
  ChevronRight,
  Maximize2,
  Minimize2,
  ArrowRight
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
  code: string;
  username: string;
  password: string;
  name: string;
  icon: React.ReactNode;
  colorTheme: string;
  desc: string;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'employee',
    code: '01',
    roleTitle: 'Teknisi Lapangan',
    badge: 'Staff',
    username: 'karyawan',
    password: 'staff123',
    name: 'Hendra Wijaya, A.Md.T.',
    icon: <HardHat className="w-4 h-4 text-blue-500" />,
    colorTheme: 'border-blue-200 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-900',
    desc: 'Presensi selfie kamera, geotag GPS, validasi WiFi & slip gaji'
  },
  {
    id: 'hr_manager',
    code: '02',
    roleTitle: 'HR Admin',
    badge: 'Admin',
    username: 'hrmanager',
    password: 'hr123',
    name: 'Siti Rahmawati, S.Psi.',
    icon: <Briefcase className="w-4 h-4 text-amber-500" />,
    colorTheme: 'border-amber-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 text-amber-900',
    desc: 'Approval cuti & lembur, master karyawan, payroll & aturan gaji'
  },
  {
    id: 'superadmin',
    code: '04',
    roleTitle: 'Direktur / Superadmin',
    badge: 'Superuser',
    username: 'admin',
    password: 'admin123',
    name: 'Galih Primananda, S.E.',
    icon: <Sparkles className="w-4 h-4 text-purple-500" />,
    colorTheme: 'border-purple-200 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-50 text-purple-900',
    desc: 'Kontrol penuh: Dashboard analitik, finance, DB SQLite & reset'
  },
  {
    id: 'project_manager',
    code: '03',
    roleTitle: 'Project Manager',
    badge: 'Admin',
    username: 'projmanager',
    password: 'pm123',
    name: 'Budi Santoso, S.T.',
    icon: <Users className="w-4 h-4 text-emerald-500" />,
    colorTheme: 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900',
    desc: 'Monitoring presensi tim site, approval dinas luar & jam proyek'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isFullscreenDiagram, setIsFullscreenDiagram] = useState<boolean>(false);

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
    <div className="min-h-screen bg-[#F4F8FC] text-slate-800 flex flex-col justify-between selection:bg-[#0066FF] selection:text-white">
      {/* TOP HEADER BAR */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0066FF] text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight text-base">Prime HRIS</span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0066FF] border border-blue-200">
                Enterprise v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Integrated Workforce & Payroll Ecosystem
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Server status badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>DEV20 : 8567</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-bold">RTC ONLINE</span>
          </div>

          {/* Diagram Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreenDiagram(!isFullscreenDiagram)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-xs"
            title={isFullscreenDiagram ? "Kembali ke mode login" : "Perbesar tampilan diagram ekosistem"}
          >
            {isFullscreenDiagram ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Tampilkan Form Login</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Mode Diagram Penuh</span>
                <span className="sm:hidden">Diagram</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <div className={`grid grid-cols-1 ${isFullscreenDiagram ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6 lg:gap-8 items-center`}>
          
          {/* LEFT SECTION: THE ECOSYSTEM OPERATIONAL PRESENTATION (MATCHING THE USER SCREENSHOT) */}
          <div className={`${isFullscreenDiagram ? 'lg:col-span-12' : 'lg:col-span-7'} bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden`}>
            
            {/* Ambient subtle light glow */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* HEADER OF THE SLIDE / DIAGRAM */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 relative z-10">
              <div>
                {/* ECOSYSTEM BADGE */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0066FF] text-white text-[11px] font-bold uppercase tracking-wider mb-2.5 shadow-sm shadow-blue-500/25">
                  <span className="text-xs">🔗</span>
                  <span>ECOSYSTEM</span>
                </div>

                {/* MAIN TITLE */}
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Ecosystem <span className="text-[#0066FF]">Operational</span>
                </h1>
                
                {/* SUBTITLE */}
                <p className="text-sm font-semibold text-slate-500 mt-1 tracking-wide">
                  Terintegrasi. Real-time. Aman.
                </p>
              </div>

              {/* RIGHT HEADER NOTE */}
              <div className="text-left sm:text-right">
                <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                  Satu Ekosistem
                </p>
                <p className="text-xs font-semibold text-slate-600">
                  untuk Operasional HR
                </p>
                <div className="h-0.5 w-12 bg-[#0066FF] mt-1.5 rounded-full sm:ml-auto"></div>
              </div>
            </div>

            {/* CENTER: THE 3D ISOMETRIC ECOSYSTEM GRAPHIC */}
            <div className="relative my-2 rounded-2xl overflow-hidden group">
              <img
                src="/ecosystem_hero.png"
                alt="Prime HRIS Ecosystem Operational Architecture"
                className="w-full h-auto object-contain rounded-2xl transition-transform duration-500 group-hover:scale-[1.01]"
              />

              {/* Interactive Quick Hotspots for 1-Click Login Directly from the Graphic */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                {/* Top Row Hotspots: Teknisi Lapangan (Left) & HR Admin (Right) */}
                <div className="flex justify-between items-start pointer-events-auto">
                  <button
                    onClick={() => applyPreset(ROLE_PRESETS[0])}
                    className="group/btn text-left px-3 py-1.5 rounded-xl bg-white/90 hover:bg-blue-600 hover:text-white backdrop-blur-md border border-blue-200 shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5"
                    title="Klik untuk langsung login sebagai 01 Teknisi Lapangan"
                  >
                    <div className="text-[10px] font-bold text-blue-600 group-hover/btn:text-white uppercase tracking-wider">
                      ⚡ Klik Cepat
                    </div>
                    <div className="text-xs font-extrabold text-slate-800 group-hover/btn:text-white flex items-center gap-1">
                      <span>01 Teknisi Lapangan</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </div>
                  </button>

                  <button
                    onClick={() => applyPreset(ROLE_PRESETS[1])}
                    className="group/btn text-right px-3 py-1.5 rounded-xl bg-white/90 hover:bg-amber-600 hover:text-white backdrop-blur-md border border-amber-200 shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5"
                    title="Klik untuk langsung login sebagai 02 HR Admin"
                  >
                    <div className="text-[10px] font-bold text-amber-600 group-hover/btn:text-white uppercase tracking-wider">
                      ⚡ Klik Cepat
                    </div>
                    <div className="text-xs font-extrabold text-slate-800 group-hover/btn:text-white flex items-center justify-end gap-1">
                      <span>02 HR Admin</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </div>
                  </button>
                </div>

                {/* Bottom Row Hotspots: Data Real-time (Left) & Keamanan Data (Right) */}
                <div className="flex justify-between items-end pointer-events-auto">
                  <button
                    onClick={() => applyPreset(ROLE_PRESETS[2])}
                    className="group/btn text-left px-3 py-1.5 rounded-xl bg-white/90 hover:bg-purple-600 hover:text-white backdrop-blur-md border border-purple-200 shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5"
                    title="Klik untuk langsung login sebagai Direktur / Superadmin"
                  >
                    <div className="text-[10px] font-bold text-purple-600 group-hover/btn:text-white uppercase tracking-wider">
                      ⚡ Direktur
                    </div>
                    <div className="text-xs font-extrabold text-slate-800 group-hover/btn:text-white flex items-center gap-1">
                      <span>04 Real-time Master</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </div>
                  </button>

                  <button
                    onClick={() => applyPreset(ROLE_PRESETS[3])}
                    className="group/btn text-right px-3 py-1.5 rounded-xl bg-white/90 hover:bg-emerald-600 hover:text-white backdrop-blur-md border border-emerald-200 shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5"
                    title="Klik untuk langsung login sebagai Project Manager"
                  >
                    <div className="text-[10px] font-bold text-emerald-600 group-hover/btn:text-white uppercase tracking-wider">
                      ⚡ PM Proyek
                    </div>
                    <div className="text-xs font-extrabold text-slate-800 group-hover/btn:text-white flex items-center justify-end gap-1">
                      <span>03 Site Supervisor</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* BOTTOM FEATURE PILL (MATCHING THE USER SCREENSHOT) */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-4 sm:gap-6 px-5 py-2.5 rounded-full bg-white/95 border border-slate-200/90 shadow-sm text-slate-600 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span>Lokasi</span>
                </div>

                <div className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></div>

                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <Wifi className="w-3.5 h-3.5" />
                  </div>
                  <span>Konektivitas</span>
                </div>

                <div className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></div>

                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <span>Data Terpusat</span>
                </div>

                <div className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></div>

                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span>Keamanan</span>
                </div>

                <div className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></div>

                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span>Efisiensi</span>
                </div>
              </div>
            </div>

            {/* Quick Button to open Login if in Fullscreen Mode */}
            {isFullscreenDiagram && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsFullscreenDiagram(false)}
                  className="py-2.5 px-6 rounded-xl bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition cursor-pointer"
                >
                  Buka Panel Login & Pilih Akun
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SECTION: MODERN ENTERPRISE LOGIN CARD & ROLE PRESETS */}
          {!isFullscreenDiagram && (
            <div className="lg:col-span-5 bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <Zap className="w-3 h-3 text-blue-600 animate-pulse" />
                    <span>Autentikasi Aman</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Masuk ke Sistem</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Gunakan kredensial resmi atau klik preset peran di bawah untuk demonstrasi instan.
                  </p>
                </div>

                {/* Error Box */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                    <div className="flex-1">{errorMessage}</div>
                  </div>
                )}

                {/* Main Form */}
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email atau Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="admin, hrmanager, atau karyawan"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-3.5 h-3.5 text-[#0066FF] rounded border-slate-300 focus:ring-[#0066FF]"
                      />
                      <span>Ingat sesi 7 hari</span>
                    </label>
                    <span className="text-[#0066FF] hover:underline cursor-pointer font-medium">
                      Bantuan login
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#0066FF] hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Memverifikasi...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Masuk ke Prime HRIS</span>
                      </>
                    )}
                  </button>
                </form>

                {/* 1-CLICK ROLE PRESET SWITCHER */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Akses Cepat Pengujian (1-Klik):
                    </span>
                    <span className="text-[10px] text-slate-400">Instan</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {ROLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        disabled={isLoading}
                        className={`text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                          preset.colorTheme
                        } ${
                          activePresetId === preset.id
                            ? 'ring-2 ring-[#0066FF] border-transparent shadow-xs'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {preset.icon}
                            <span className="text-[11px] font-bold truncate">
                              {preset.roleTitle}
                            </span>
                          </div>
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-white shadow-2xs">
                            {preset.code}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600 truncate font-medium">
                          {preset.name.split(',')[0]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom footer note */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 flex items-center justify-center gap-2">
                <Server className="w-3 h-3 text-emerald-500" />
                <span>DEV20 Native Cluster • Zero Downtime Isolation</span>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white/70 backdrop-blur-sm border-t border-slate-200/60 py-3 px-4 text-center text-xs text-slate-500">
        &copy; 2026 Prime HRIS Enterprise. Hosted on Linux DEV20 High-Availability Cluster.
      </footer>
    </div>
  );
};
