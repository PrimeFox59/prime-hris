import React, { useState, useRef, useEffect } from 'react';
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
  ShieldCheck
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
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay handled by muted property
      });
    }
  }, []);

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
    <div className="min-h-screen w-full bg-[#F4F8FE] flex flex-col justify-between selection:bg-[#0066FF] selection:text-white font-sans text-slate-800 relative">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER                                                             */}
      {/* ========================================================================= */}
      <header className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0066FF] text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20">
            P
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-black text-xl tracking-tight text-slate-900">
              PRIME <span className="text-[#0066FF]">hris</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#0066FF] border border-blue-200">
              v2.4
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Server Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold">DEV20 : 8567</span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN PROPER SPLIT STAGE                                                */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 my-auto">
        
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: THE 3D ECOSYSTEM OPERATIONAL SHOWCASE (SEAMLESS VIDEO)     */}
        {/* ----------------------------------------------------------------------- */}
        <div className="w-full lg:flex-1 flex items-center justify-center relative select-none">
          {/* Ambient Radial Soft Glow */}
          <div className="absolute inset-0 bg-radial from-blue-100/40 via-blue-50/10 to-transparent -z-10 blur-2xl pointer-events-none" />

          {/* Seamless Video Stage (No border, No shadow, No buttons) */}
          <div className="relative w-full max-w-[960px] aspect-video flex items-center justify-center overflow-hidden">
            {/* Background Base matching page */}
            <div className="absolute inset-0 bg-[#F4F8FE] -z-10" />

            {/* Loop Video with feathered radial mask */}
            <video
              ref={videoRef}
              src="/ecosystem_hero.mp4"
              poster="/ecosystem_hero.png"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain pointer-events-none select-none"
              style={{
                maskImage: 'radial-gradient(ellipse 96% 92% at 50% 50%, black 80%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 96% 92% at 50% 50%, black 80%, transparent 100%)',
              }}
            />

            {/* Seamless Edge Dissolves (Direct into page background #F4F8FE) */}
            <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#F4F8FE] via-[#F4F8FE]/80 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#F4F8FE] via-[#F4F8FE]/80 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[#F4F8FE] via-[#F4F8FE]/80 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#F4F8FE] via-[#F4F8FE]/80 to-transparent pointer-events-none z-10" />

            {/* 4 Seamless Corner Dissolves for 100% borderless blend */}
            <div className="absolute top-0 left-0 w-20 h-20 bg-radial from-[#F4F8FE] to-transparent pointer-events-none z-10" />
            <div className="absolute top-0 right-0 w-20 h-20 bg-radial from-[#F4F8FE] to-transparent pointer-events-none z-10" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-radial from-[#F4F8FE] to-transparent pointer-events-none z-10" />
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-radial from-[#F4F8FE] to-transparent pointer-events-none z-10" />
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: DEDICATED PROPER ENTERPRISE LOGIN CARD                    */}
        {/* ----------------------------------------------------------------------- */}
        <div className="w-full lg:w-[420px] xl:w-[450px] shrink-0">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl shadow-blue-900/8">
            
            {/* Card Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-2xl tracking-tight text-slate-900">
                  PRIME <span className="text-[#0066FF]">hris</span>
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-800">Masuk ke Sistem</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola data karyawan, presensi satelit, dan slip gaji digital.
              </p>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
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
                    placeholder="misal: admin atau hr@primeprojectx.net"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
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
                    placeholder="Masukkan password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#0066FF] hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 text-xs transition cursor-pointer disabled:opacity-60 mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke PRIME hris</span>
                  </>
                )}
              </button>
            </form>

            {/* 1-CLICK ROLE PRESETS */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Akses Cepat 1-Klik:
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Demo Ready</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-xs font-semibold transition cursor-pointer active:scale-95"
                  >
                    {p.icon}
                    <span className="truncate">{p.role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Security Guarantee Pill */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Enkripsi Sesi Aktif</span>
              </div>
              <span>10-Tier RBAC Protected</span>
            </div>

          </div>
        </div>

      </main>

      {/* ========================================================================= */}
      {/* 3. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="w-full py-3 px-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
        &copy; 2026 PRIME hris • PT Prime Infinity Systems • All Rights Reserved
      </footer>
    </div>
  );
};
