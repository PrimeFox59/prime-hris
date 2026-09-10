import React, { useState, useRef } from 'react';
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
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Sparkle,
  Film,
  ShieldCheck
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
  
  // Showcase view mode: 'hd' (crystal sharp vector + SVG motion) or 'video' (MP4 full-motion)
  const [showcaseMode, setShowcaseMode] = useState<'hd' | 'video'>('hd');
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [isFullscreenShowcase, setIsFullscreenShowcase] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

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
        {/* LEFT COLUMN: THE 3D ECOSYSTEM OPERATIONAL SHOWCASE (PROPORTIONAL 16:9)  */}
        {/* ----------------------------------------------------------------------- */}
        <div className="w-full lg:flex-1 flex flex-col items-center justify-center">
          
          {/* Showcase Stage Wrapper */}
          <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/8 border border-slate-200/90 bg-white aspect-[1672/941] flex items-center justify-center group">
            
            {/* Ambient Radial Glow */}
            <div className="absolute inset-0 bg-radial from-blue-50/60 via-transparent to-transparent pointer-events-none -z-10" />

            {/* Mode 1: Crystal Sharp HD Artwork + SVG Flow Motion */}
            {showcaseMode === 'hd' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src="/ecosystem_hero.png"
                  alt="PRIME hris Ecosystem Operational"
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
                <EcosystemMotionOverlay isMotionActive={true} />
              </div>
            ) : (
              /* Mode 2: MP4 Full-Motion Animation Video */
              <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                <video
                  ref={videoRef}
                  src="/ecosystem_hero.mp4"
                  poster="/ecosystem_hero.png"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain select-none"
                />
              </div>
            )}

            {/* Top Showcase Toolbar */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
              
              {/* Mode Switcher Pill */}
              <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShowcaseMode('hd')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition cursor-pointer ${
                    showcaseMode === 'hd'
                      ? 'bg-[#0066FF] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Tampilan Gambar HD Kristal dengan Aliran Vektor Tajam 100%"
                >
                  <Sparkle className="w-3.5 h-3.5" />
                  <span>Mode HD Kristal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowcaseMode('video')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition cursor-pointer ${
                    showcaseMode === 'video'
                      ? 'bg-[#0066FF] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Tampilan Video Animasi MP4 Penuh"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Mode Video Animasi</span>
                </button>
              </div>

              {/* Right Action Buttons */}
              <div className="pointer-events-auto flex items-center gap-2">
                {/* Play/Pause toggle if in video mode */}
                {showcaseMode === 'video' && (
                  <button
                    type="button"
                    onClick={toggleVideo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold backdrop-blur-md border border-slate-200 shadow-sm transition cursor-pointer"
                  >
                    {isVideoPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-[#0066FF]" />
                        <span>Jeda</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-slate-600" />
                        <span>Putar</span>
                      </>
                    )}
                  </button>
                )}

                {/* Fullscreen Showcase Trigger */}
                <button
                  type="button"
                  onClick={() => setIsFullscreenShowcase(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold backdrop-blur-md border border-slate-200 shadow-sm transition cursor-pointer"
                  title="Tampilkan 3D Ecosystem Layar Penuh"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Layar Penuh</span>
                </button>
              </div>
            </div>

            {/* Bottom Caption Badge */}
            <div className="absolute bottom-3 left-4 z-20 pointer-events-none hidden sm:block">
              <span className="px-3 py-1 rounded-full bg-white/85 backdrop-blur-md border border-slate-200 text-[11px] font-medium text-slate-600 shadow-2xs">
                Satu Ekosistem untuk Operasional HR • Terintegrasi, Real-Time, Aman
              </span>
            </div>
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
      {/* 3. FULLSCREEN SHOWCASE MODAL (IF TRIGGERED)                                */}
      {/* ========================================================================= */}
      {isFullscreenShowcase && (
        <div className="fixed inset-0 z-50 bg-[#F4F8FE] flex flex-col items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
          
          {/* Close Fullscreen Floating Toolbar */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFullscreenShowcase(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/95 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-lg text-xs font-bold backdrop-blur-md transition cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Kembali ke Halaman Login</span>
            </button>
          </div>

          {/* Fullscreen Canvas Container */}
          <div className="w-full h-full max-w-[1750px] relative aspect-[1672/941] flex items-center justify-center overflow-hidden rounded-3xl shadow-2xl bg-white border border-slate-200">
            {showcaseMode === 'hd' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src="/ecosystem_hero.png"
                  alt="PRIME hris Ecosystem Operational"
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
                <EcosystemMotionOverlay isMotionActive={true} />
              </div>
            ) : (
              <video
                src="/ecosystem_hero.mp4"
                poster="/ecosystem_hero.png"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain select-none"
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="w-full py-3 px-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
        &copy; 2026 PRIME hris • PT Prime Infinity Systems • All Rights Reserved
      </footer>
    </div>
  );
};
