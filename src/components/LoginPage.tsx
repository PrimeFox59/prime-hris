import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  MapPin,
  Wifi,
  Database,
  Shield,
  Clock,
  Sparkles,
  Briefcase,
  HardHat,
  Users,
  AlertCircle
} from 'lucide-react';
import { AuthUser } from '../types';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
}

const PRESETS = [
  { id: 'superadmin', role: 'Direktur', user: 'admin', pass: 'admin123', icon: <Sparkles className="w-3.5 h-3.5 text-purple-600" /> },
  { id: 'hr', role: 'HR Admin', user: 'hrmanager', pass: 'hr123', icon: <Briefcase className="w-3.5 h-3.5 text-amber-600" /> },
  { id: 'pm', role: 'PM Proyek', user: 'projmanager', pass: 'pm123', icon: <Users className="w-3.5 h-3.5 text-emerald-600" /> },
  { id: 'staff', role: 'Teknisi', user: 'karyawan', pass: 'staff123', icon: <HardHat className="w-3.5 h-3.5 text-blue-600" /> }
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginUser = customUser !== undefined ? customUser : identifier;
    const loginPass = customPass !== undefined ? customPass : password;

    if (!loginUser.trim()) {
      setErrorMessage('Masukkan email atau username');
      return;
    }
    if (!loginPass) {
      setErrorMessage('Masukkan password');
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
      setErrorMessage(err.message || 'Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (p: typeof PRESETS[0]) => {
    setIdentifier(p.user);
    setPassword(p.pass);
    setErrorMessage(null);
    handleLogin(undefined, p.user, p.pass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFBFD] via-[#FFFFFF] to-[#F1F6FB] flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-[#0066FF] selection:text-white">
      {/* WRAPPER CONTAINER */}
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col justify-between">
        
        {/* HEADER: MATCHING THE SLIDE EXACTLY */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pt-2">
          <div>
            {/* Pill: 🔗 ECOSYSTEM */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0066FF] text-white text-[11px] font-bold tracking-wider shadow-sm shadow-blue-500/20 mb-2">
              <span className="text-xs">🔗</span>
              <span>ECOSYSTEM</span>
            </div>

            {/* Title: Ecosystem Operational */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Ecosystem <span className="text-[#0066FF]">Operational</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm font-semibold text-slate-400 mt-1">
              Terintegrasi. Real-time. Aman.
            </p>
          </div>

          {/* Right Label */}
          <div className="text-left sm:text-right">
            <p className="text-xs font-bold text-slate-500">
              Satu Ekosistem
            </p>
            <p className="text-xs font-semibold text-slate-500">
              untuk Operasional HR
            </p>
            <div className="h-0.5 w-10 bg-[#0066FF] mt-1.5 sm:ml-auto rounded-full"></div>
          </div>
        </div>

        {/* MAIN BODY: 3D GRAPHIC (LEFT/CENTER) + MINIMALIST FROSTED LOGIN CARD (RIGHT) */}
        <div className="my-auto py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* THE 3D ISOMETRIC ILLUSTRATION (CLEAN, NO OVERLAYS) */}
          <div className="lg:col-span-8 flex items-center justify-center">
            <img
              src="/ecosystem_hero.png"
              alt="Prime HRIS Ecosystem"
              className="w-full max-w-4xl h-auto object-contain rounded-2xl drop-shadow-sm"
            />
          </div>

          {/* COMPACT & TIDY GLASS LOGIN CARD */}
          <div className="lg:col-span-4 w-full max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Masuk ke Sistem</h2>
                <p className="text-[11px] text-slate-400 font-medium">Prime HRIS Enterprise Platform</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#0066FF] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
                P
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Clean Form */}
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email atau Username"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#0066FF] hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 text-xs transition cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Masuk</span>
                  </>
                )}
              </button>
            </form>

            {/* 1-CLICK ROLE PRESETS */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Akses Cepat (1-Klik):
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 text-[11px] font-bold transition cursor-pointer active:scale-95"
                  >
                    {p.icon}
                    <span className="truncate">{p.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM PILL: MATCHING THE SLIDE EXACTLY */}
        <div className="flex justify-center pb-2">
          <div className="inline-flex flex-wrap items-center justify-center gap-4 sm:gap-7 px-6 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>Lokasi</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-cyan-500" />
              <span>Konektivitas</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-500" />
              <span>Data Terpusat</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Keamanan</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Efisiensi</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
