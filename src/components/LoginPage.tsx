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
      setErrorMessage('Masukkan kata sandi');
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
              PRIME <span className="text-[#0066FF]">HRIS</span>
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#0066FF] border border-blue-200">
              Enterprise v2.4
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
      <main className="flex-1 w-full max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-14 my-auto">
        
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
        {/* RIGHT COLUMN: DEDICATED PROPER ENTERPRISE LOGIN CARD (GAMBAR 2 DESIGN)  */}
        {/* ----------------------------------------------------------------------- */}
        <div className="w-full lg:w-[420px] xl:w-[450px] shrink-0">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl shadow-blue-900/8">
            
            {/* Card Header Typography (Aligned with Gambar 2 Signature Style) */}
            <div className="flex items-start gap-3 mb-6">
              <div className="w-1.5 h-11 bg-gradient-to-b from-[#0066FF] to-blue-700 rounded-full mt-0.5 shrink-0" />
              <div>
                <div className="text-[21px] sm:text-[23px] font-black tracking-tight text-slate-900 leading-none">
                  PRIME HRIS <span className="text-[#0066FF]">ENTERPRISE</span>
                </div>
                <p className="text-[12.5px] text-slate-500 font-medium mt-1.5 leading-snug">
                  Ekosistem SDM Terintegrasi: Presensi Kamera Watermark &amp; Otomasi Penggajian.
                </p>
              </div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600 mb-1.5">
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
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-[13.5px] text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent focus:bg-white transition"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-[13.5px] text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent focus:bg-white transition"
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
                className="w-full py-3 px-4 bg-gradient-to-r from-[#0066FF] to-blue-700 hover:from-blue-600 hover:to-blue-800 active:scale-[0.99] text-white font-extrabold rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 text-[13px] tracking-wide uppercase transition cursor-pointer disabled:opacity-60 mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke PRIME HRIS</span>
                  </>
                )}
              </button>
            </form>

            {/* 1-CLICK ROLE PRESETS (PILL-STYLE ALIGNED WITH GAMBAR 2) */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                  Akses Cepat Peran (1-Klik):
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                  Demo Ready
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    disabled={isLoading}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-blue-50/70 hover:border-blue-300 text-slate-700 transition cursor-pointer active:scale-95 group text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                      {p.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-slate-800 leading-tight group-hover:text-[#0066FF] transition truncate">
                        {p.role}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        @{p.user}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Security Guarantee Pill */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-slate-600">Enkripsi Sesi Aktif</span>
              </div>
              <span className="font-mono text-[10.5px] text-slate-400">10-Tier RBAC Protected</span>
            </div>

          </div>
        </div>

      </main>

      {/* ========================================================================= */}
      {/* 3. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="w-full py-3.5 px-4 text-center text-[11.5px] text-slate-400 border-t border-slate-200/60 bg-white/50 tracking-tight font-medium">
        &copy; 2026 PRIME HRIS ENTERPRISE • PT PRIME INFINITY SYSTEMS • ALL RIGHTS RESERVED
      </footer>
    </div>
  );
};
