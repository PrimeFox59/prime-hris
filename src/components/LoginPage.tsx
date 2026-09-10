import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  Briefcase,
  HardHat,
  Users,
  AlertCircle,
  X,
  Zap
} from 'lucide-react';
import { AuthUser } from '../types';
import { api } from '../services/api';
import { EcosystemMotionOverlay } from './EcosystemMotionOverlay';

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
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(true);
  const [isMotionActive, setIsMotionActive] = useState<boolean>(true);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

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
    <div className="h-screen w-screen overflow-hidden relative flex flex-col justify-between bg-[#F4F8FE] selection:bg-[#0066FF] selection:text-white">
      
      {/* FULLSCREEN PANORAMIC 3D ECOSYSTEM HERO WITH LIVE FLOW MOTION */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none z-0">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* High-definition Image 5 Master Artwork spanning fullscreen */}
          <img
            src="/ecosystem_hero.png"
            alt="PRIME hris Ecosystem Operational"
            className="w-full h-full object-cover lg:object-contain object-center select-none pointer-events-none"
          />

          {/* SVG Live Data Flow Motion Layer (1672 x 941) */}
          <EcosystemMotionOverlay
            activeRole={hoveredRole}
            isMotionActive={isMotionActive}
          />
        </div>
      </div>

      {/* FLOATING TOP BAR */}
      <header className="w-full px-4 sm:px-8 py-3 flex items-center justify-between z-30 relative bg-gradient-to-b from-white/80 via-white/30 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0066FF] text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
            P
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900 drop-shadow-xs">
              PRIME <span className="text-[#0066FF] font-black">hris</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-50/90 text-[#0066FF] border border-blue-200 shadow-xs">
              v2.4
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Server indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 backdrop-blur-md border border-slate-200/80 text-[11px] font-mono text-slate-600 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>DEV20 : 8567</span>
          </div>

          {/* Motion Effect Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMotionActive(!isMotionActive)}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer border backdrop-blur-md ${
              isMotionActive
                ? 'bg-blue-50/90 text-[#0066FF] border-blue-200 shadow-2xs hover:bg-blue-100/80'
                : 'bg-white/80 text-slate-400 border-slate-200 hover:bg-slate-100'
            }`}
            title="Nyalakan / Matikan Efek Aliran Data Motion"
          >
            <Zap className={`w-3 h-3 ${isMotionActive ? 'fill-[#0066FF] text-[#0066FF]' : 'text-slate-400'}`} />
            <span>Aliran Data: {isMotionActive ? 'Live' : 'Jeda'}</span>
          </button>

          {/* Toggle Login Button */}
          <button
            onClick={() => setIsLoginOpen(!isLoginOpen)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${
              isLoginOpen
                ? 'bg-white/85 hover:bg-white text-slate-700 border border-slate-200 shadow-xs backdrop-blur-md'
                : 'bg-[#0066FF] hover:bg-blue-700 text-white shadow-blue-500/25 animate-pulse'
            }`}
          >
            {isLoginOpen ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Tutup Form</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk ke PRIME hris</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* FLOATING FROSTED GLASS LOGIN CARD (RIGHT OVERLAY) */}
      <main className="flex-1 w-full relative z-20 pointer-events-none flex items-center justify-end px-4 sm:px-8 lg:px-14 py-2">
        {isLoginOpen && (
          <div className="pointer-events-auto w-[310px] sm:w-[340px] bg-white/94 backdrop-blur-2xl border border-white/85 shadow-2xl shadow-blue-900/10 rounded-3xl p-5 z-20 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-base text-slate-900 tracking-tight">
                      PRIME <span className="text-[#0066FF]">hris</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Masuk ke sistem operasional</p>
                </div>

                <button
                  onClick={() => setIsLoginOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                  title="Sembunyikan form login untuk melihat slide penuh"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-3 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span className="truncate">{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-2.5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email atau Username"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
                    disabled={isLoading}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 px-3 bg-[#0066FF] hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 text-xs transition cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Masuk ke PRIME hris</span>
                    </>
                  )}
                </button>
              </form>

              {/* 1-CLICK ROLE PRESETS */}
              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Akses Cepat 1-Klik:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p)}
                      onMouseEnter={() => setHoveredRole(p.id)}
                      onMouseLeave={() => setHoveredRole(null)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-[11px] font-semibold transition cursor-pointer active:scale-95"
                    >
                      {p.icon}
                      <span className="truncate">{p.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
      </main>

      {/* MINIMAL FOOTER */}
      <footer className="w-full py-2 px-4 text-center text-[11px] text-slate-400/80 z-20 relative pointer-events-none bg-gradient-to-t from-white/60 to-transparent">
        &copy; 2026 PRIME hris • PT Prime Infinity Systems
      </footer>
    </div>
  );
};
