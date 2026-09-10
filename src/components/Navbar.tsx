import React, { useState, useEffect, useRef } from 'react';
import { Shield, Clock, Sparkles, Wifi, WifiOff, Users, ChevronDown, CheckCircle2, Award, ArrowRight, Globe, Database, Crown, UserCheck, Lock, Bell, Building2, AlertTriangle, Radio, X, MapPin, Laptop, ShieldCheck, Zap, LogOut, Camera, KeyRound, User } from 'lucide-react';
import { Employee, UserRole, SystemRole, getEffectiveSystemRole, AuthUser } from '../types';
import { rtcService } from '../services/rtcService';
import { ProfileSettingsModal, ProfileTabId } from './ProfileSettingsModal';

interface NavbarProps {
  currentUser: Employee;
  allUsers: Employee[];
  onSwitchUser: (user: Employee) => void;
  onUpdateEmployee?: (user: Employee) => void;
  isWifiConnected: boolean;
  onToggleWifi: () => void;
  currentWifiSsid: string;
  pendingApprovalsCount: number;
  onStartTour?: () => void;
  onNavigateToTab: (tabId: string) => void;
  onOpenNotificationModal?: () => void;
  realDetectedIp?: string;
  realDetectedIsp?: string;
  realDetectedCity?: string;
  isOfficeNetwork?: boolean;
  simulatedNetworkMode?: 'auto' | 'office' | 'remote';
  onSetSimulatedNetworkMode?: (mode: 'auto' | 'office' | 'remote') => void;
  onWhitelistCurrentIp?: () => void;
  authUser?: AuthUser | null;
  onLogout?: () => void;
  isProfileModalOpenControlled?: boolean;
  onOpenProfileModalControlled?: (tab?: ProfileTabId) => void;
  onCloseProfileModalControlled?: () => void;
  profileModalInitialTabControlled?: ProfileTabId;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onUpdateEmployee,
  isWifiConnected,
  onToggleWifi,
  currentWifiSsid,
  pendingApprovalsCount,
  onStartTour,
  onNavigateToTab,
  onOpenNotificationModal,
  realDetectedIp,
  realDetectedIsp,
  realDetectedCity,
  isOfficeNetwork = true,
  simulatedNetworkMode = 'auto',
  onSetSimulatedNetworkMode,
  onWhitelistCurrentIp,
  authUser,
  onLogout,
  isProfileModalOpenControlled,
  onOpenProfileModalControlled,
  onCloseProfileModalControlled,
  profileModalInitialTabControlled
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isNetworkPopoverOpen, setIsNetworkPopoverOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<ProfileTabId>('profile');
  const networkPopoverRef = useRef<HTMLDivElement | null>(null);

  const effectiveIsProfileModalOpen = isProfileModalOpenControlled !== undefined ? isProfileModalOpenControlled : isProfileModalOpen;
  const effectiveProfileModalInitialTab = profileModalInitialTabControlled !== undefined ? profileModalInitialTabControlled : profileModalInitialTab;

  const openProfileModal = (tab: ProfileTabId = 'profile') => {
    if (onOpenProfileModalControlled) {
      onOpenProfileModalControlled(tab);
    } else {
      setProfileModalInitialTab(tab);
      setIsProfileModalOpen(true);
    }
    setUserDropdownOpen(false);
  };

  const closeProfileModal = () => {
    if (onCloseProfileModalControlled) {
      onCloseProfileModalControlled();
    } else {
      setIsProfileModalOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (networkPopoverRef.current && !networkPopoverRef.current.contains(e.target as Node)) {
        setIsNetworkPopoverOpen(false);
      }
    };
    if (isNetworkPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNetworkPopoverOpen]);

  const getCleanIspName = (rawIsp?: string): string => {
    if (!rawIsp) return 'Koneksi Publik';
    if (rawIsp.toLowerCase().includes('biznet')) return 'Biznet Gio';
    if (rawIsp.toLowerCase().includes('telkomsel')) return 'Telkomsel';
    if (rawIsp.toLowerCase().includes('indihome')) return 'Indihome';
    if (rawIsp.toLowerCase().includes('iforte')) return 'iForte Fiber';
    if (rawIsp.toLowerCase().includes('solusinet')) return 'Solusinet';
    if (rawIsp.toLowerCase().includes('first media')) return 'First Media';
    if (rawIsp.toLowerCase().includes('xl')) return 'XL Axiata';
    if (rawIsp.toLowerCase().includes('indosat')) return 'Indosat';
    if (rawIsp.toLowerCase().includes('telkom')) return 'Telkom';
    return rawIsp.replace(/^PT\s+/i, '').split(' ').slice(0, 2).join(' ');
  };

  const currentRole: SystemRole = getEffectiveSystemRole(currentUser);

  return (
    <>
      <header className="sticky top-0 z-50 glass-nav border-b border-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo & System Badge */}
        <div id="tour-brand-logo" className="flex items-center gap-3 select-none cursor-pointer motion-slide-right" onClick={() => onNavigateToTab('dashboard')}>
          <div className="flex items-center gap-2">
            {/* Prime ProjectX Vector Brand Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 border border-slate-700/80 shadow-md flex items-center justify-center relative overflow-hidden group-hover:border-[#FF6B00] transition-colors">
                <div className="absolute -inset-1 bg-gradient-to-tr from-[#FF6B00] to-[#00E2B0] opacity-25 blur-xs"></div>
                <span className="relative font-mono-code font-black text-white text-base tracking-tighter">
                  P<span className="text-[#FF6B00]">X</span>
                </span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-black tracking-wider text-slate-900 font-mono-code leading-none">
                  PRIME<span className="text-[#FF6B00]">PROJECTX</span>
                </span>
                <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase font-mono-code">
                  PT Prime Infinity Systems
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-200/80 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200/70 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-[#FF6B00] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-[#FF6B00] font-mono-code">
                PRIME hris
              </span>
            </div>
          </div>
        </div>

        {/* Center / Status info: Clock & Smart Network Gateway */}
        <div className="hidden md:flex items-center gap-3 motion-fade-in-down">
          
          {/* Live Network Gateway Status (Opsi 2: Smart Mapping Status Kantor vs Luar Kantor) */}
          <div className="relative" ref={networkPopoverRef}>
            <button
              id="tour-network-gateway"
              onClick={() => setIsNetworkPopoverOpen(prev => !prev)}
              className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono-code transition-all cursor-pointer shadow-xs border ${
                isOfficeNetwork
                  ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-900 shadow-emerald-500/5'
                  : 'bg-amber-50 hover:bg-amber-100/80 border-amber-300 text-amber-950 shadow-amber-500/5'
              }`}
              title="Klik untuk melihat status audit jaringan atau beralih simulasi"
            >
              {isOfficeNetwork ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold tracking-tight">PRIME Corporate Network</span>
                  <span className="text-emerald-300">•</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-200/80 text-[9.5px] font-black text-emerald-900">
                    WFO SAH
                  </span>
                  <ChevronDown className="w-3 h-3 text-emerald-700/60" />
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <Globe className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold tracking-tight">
                    Jaringan Luar: {getCleanIspName(realDetectedIsp)}
                  </span>
                  <span className="text-amber-300">•</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-200/80 text-[9.5px] font-black text-amber-900">
                    LUAR KANTOR
                  </span>
                  <ChevronDown className="w-3 h-3 text-amber-700/60" />
                </>
              )}
            </button>

            {/* Smart Network Audit Popover */}
            {isNetworkPopoverOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 text-left font-sans animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${isOfficeNetwork ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                      {isOfficeNetwork ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        Smart Gateway & Network Audit
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono-code">
                        PRIME Enterprise • Zero-Trust Geofence
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsNetworkPopoverOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Card */}
                <div className="mt-3">
                  {isOfficeNetwork ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Jaringan Kantor Terverifikasi (WFO Sah)</span>
                      </div>
                      <p className="text-[11.5px] text-emerald-800/90 leading-relaxed font-sans">
                        Koneksi Anda cocok dengan Whitelist Gateway Resmi PRIME Enterprise. Presensi mandiri dinyatakan sah sebagai jam kerja WFO tanpa memerlukan disposisi persetujuan manajer.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Terdeteksi di Luar Jaringan Kantor (Remote)</span>
                      </div>
                      <p className="text-[11.5px] text-amber-900/90 leading-relaxed font-sans">
                        Anda mengakses melalui jaringan publik/seluler eksternal ({getCleanIspName(realDetectedIsp)}). Presensi membutuhkan pengisian form justifikasi <strong>Dinas Luar</strong> agar disetujui atasan.
                      </p>
                    </div>
                  )}
                </div>

                {/* Network Parameter Details */}
                <div className="mt-3 bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 space-y-1.5 text-xs font-mono-code">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">IP Publik Anda:</span>
                    <span className="font-bold text-slate-900">{realDetectedIp || '103.31.205.218'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Provider / ISP:</span>
                    <span className="font-bold text-slate-800 text-right truncate max-w-[190px]">
                      {realDetectedIsp || 'PT Biznet Gio Nusantara'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Lokasi Geografis:</span>
                    <span className="text-slate-700">{realDetectedCity || 'Surabaya / Manyar Site'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                    <span className="text-slate-500 text-[11px]">Kantor Whitelist:</span>
                    <span className="text-emerald-700 font-bold">Biznet 103.31.205.218</span>
                  </div>
                </div>

                {/* Simulation & Mode Switcher Controls */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Mode Pengujian & Demo:</span>
                    <span className="text-[10px] text-orange-600 font-mono-code font-normal">Pilih skenario</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => onSetSimulatedNetworkMode?.('auto')}
                      className={`px-2 py-1.5 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer ${
                        simulatedNetworkMode === 'auto'
                          ? 'bg-[#FF6B00] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Otomatis Asli
                    </button>
                    <button
                      onClick={() => onSetSimulatedNetworkMode?.('office')}
                      className={`px-2 py-1.5 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer ${
                        simulatedNetworkMode === 'office'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Simulasi WFO
                    </button>
                    <button
                      onClick={() => onSetSimulatedNetworkMode?.('remote')}
                      className={`px-2 py-1.5 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer ${
                        simulatedNetworkMode === 'remote'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Simulasi Luar
                    </button>
                  </div>

                  {/* Whitelist Current IP Quick Button */}
                  {!isOfficeNetwork && onWhitelistCurrentIp && (
                    <button
                      onClick={() => {
                        onWhitelistCurrentIp();
                        setIsNetworkPopoverOpen(false);
                      }}
                      className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-orange-400" />
                      <span>Daftarkan IP Ini sebagai Whitelist Kantor Resmi Prime HRIS</span>
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>

        {/* User Switcher Dropdown & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Approvals & Notification Hub Trigger */}
          <button
            id="tour-notification-bell"
            onClick={onOpenNotificationModal}
            className="relative p-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#FF6B00] transition-colors cursor-pointer shadow-xs active:scale-95"
            title={`Pusat Notifikasi & Approval Terpadu (${pendingApprovalsCount} menunggu persetujuan)`}
          >
            <Shield className="w-4 h-4" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF6B00] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse font-mono-code">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* User Profile Selector (Simulate Multiple Personnel & RBAC) */}
          <div className="relative">
            <button
              id="tour-user-switcher"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-full bg-white/90 hover:bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer text-left"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-orange-400 shadow-2xs"
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name.split(',')[0]}
                </span>
                {currentRole === 'superuser' ? (
                  <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 font-mono-code">
                    <Crown className="w-2.5 h-2.5 text-amber-600" />
                    SUPERUSER
                  </span>
                ) : currentRole === 'admin' ? (
                  <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1 font-mono-code">
                    <Shield className="w-2.5 h-2.5 text-blue-600" />
                    ADMIN HR
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 font-mono-code">
                    <UserCheck className="w-2.5 h-2.5 text-emerald-600" />
                    STAFF BIASA
                  </span>
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Profile Settings Dropdown */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-84 max-w-sm rounded-3xl bg-white border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                {/* User Identity Banner Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white mb-2.5 relative overflow-hidden shadow-md">
                  <div className="absolute -top-6 -right-6 w-28 h-28 bg-[#FF6B00]/20 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="relative group cursor-pointer" onClick={() => openProfileModal('photo')}>
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/90 shadow-md group-hover:opacity-80 transition-opacity"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-white truncate leading-tight">
                        {currentUser.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono-code truncate mt-0.5">
                        {currentUser.nik} • {currentUser.department}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`text-[9px] font-black px-2 py-0.2 rounded-full uppercase tracking-wider font-mono-code ${
                          currentRole === 'superuser'
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : currentRole === 'admin'
                            ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                            : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                        }`}>
                          {currentRole === 'superuser' ? '👑 SUPERUSER' : currentRole === 'admin' ? '🛡️ ADMIN HR' : '👤 STAFF'}
                        </span>
                        <span className="text-[10px] text-slate-300 font-medium truncate max-w-[110px]">
                          {currentUser.position}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Actions List */}
                <div className="space-y-1">
                  <div className="px-2 pt-1 pb-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono-code">
                      Pengaturan Profil & Akun
                    </span>
                  </div>

                  {/* Option 1: Edit Profile */}
                  <button
                    onClick={() => openProfileModal('profile')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/70 text-[#FF6B00] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-[#FF6B00] transition-colors leading-tight">
                          Edit Data Diri & Kontak
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Nama, No. WhatsApp, Email & Rekening
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF6B00] group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Option 2: Change Photo */}
                  <button
                    onClick={() => openProfileModal('photo')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/70 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                          Ganti Foto Profil
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Unggah foto baru atau pilih avatar resmi
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Option 3: Change Password */}
                  <button
                    onClick={() => openProfileModal('password')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors leading-tight">
                          Ganti Kata Sandi (Password)
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Perbarui kredensial keamanan akun Anda
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Option 4: Sesi & Keamanan */}
                  <button
                    onClick={() => openProfileModal('security')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200/70 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition-colors leading-tight">
                          Keamanan & Info Jaringan
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {isOfficeNetwork ? 'WFO Kantor Terverifikasi' : 'Remote Luar Kantor'} • IP {realDetectedIp || '103.31.205.218'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>

                {/* Direct Shortcut to User Performance & Logout */}
                <div className="pt-2 mt-2 border-t border-slate-100 space-y-1.5">
                  <button
                    onClick={() => {
                      onNavigateToTab('user_performance');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 text-[#FF6B00] font-bold text-xs transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-[#FF6B00]" />
                      Buka Portal Kinerja Saya
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF6B00]" />
                  </button>

                  {onLogout && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        Keluar dari Sistem (Logout)
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={effectiveIsProfileModalOpen}
        onClose={closeProfileModal}
        currentUser={currentUser}
        authUser={authUser}
        onUpdateEmployee={onUpdateEmployee || (() => {})}
        initialTab={effectiveProfileModalInitialTab}
        realDetectedIp={realDetectedIp}
        realDetectedIsp={realDetectedIsp}
        realDetectedCity={realDetectedCity}
        isOfficeNetwork={isOfficeNetwork}
        onLogout={onLogout}
      />
    </header>

    {/* Floating Tour Demo Button in Bottom-Left Corner (Hidden on narrow mobile screens to avoid dock overlap) */}
    {onStartTour && (
      <div className="fixed bottom-20 md:bottom-6 left-4 sm:left-6 z-40 no-print hidden sm:flex">
        <button
          id="tour-start-button"
          onClick={onStartTour}
          className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8533] hover:from-[#e56000] hover:to-[#ff771a] text-white shadow-xl shadow-orange-500/35 hover:shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/30 backdrop-blur-md"
          title="Mulai Panduan Tour Demo Interaktif"
        >
          <Sparkles className="w-4 h-4 animate-pulse shrink-0 text-white" />
          <span className="font-bold text-xs tracking-wide font-sans">
            Tour Demo
          </span>
        </button>
      </div>
    )}
  </>
);
};
