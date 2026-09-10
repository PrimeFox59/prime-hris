import React, { useState, useEffect, useRef } from 'react';
import { Shield, Clock, Sparkles, Wifi, WifiOff, Users, ChevronDown, CheckCircle2, Award, ArrowRight, Globe, Database, Crown, UserCheck, Lock, Bell, Building2, AlertTriangle, Radio, X, MapPin, Laptop, ShieldCheck, Zap, LogOut } from 'lucide-react';
import { Employee, UserRole, SystemRole, getEffectiveSystemRole, AuthUser } from '../types';
import { rtcService } from '../services/rtcService';

interface NavbarProps {
  currentUser: Employee;
  allUsers: Employee[];
  onSwitchUser: (user: Employee) => void;
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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
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
  onLogout
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isNetworkPopoverOpen, setIsNetworkPopoverOpen] = useState(false);
  const [isRtcLiveConnected, setIsRtcLiveConnected] = useState(false);
  const [isClockTampered, setIsClockTampered] = useState(false);
  const networkPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubRtc = rtcService.onConnectionChange(setIsRtcLiveConnected);
    const updateTime = () => {
      setTimeStr(rtcService.formatWibClock());
      setIsClockTampered(rtcService.isDeviceClockTampered());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => {
      clearInterval(interval);
      unsubRtc();
    };
  }, []);

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

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentRole: SystemRole = getEffectiveSystemRole(currentUser);

  return (
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
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#FF6B00] uppercase font-mono-code">
                PRIME HRIS
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
                  <span className="font-bold tracking-tight">DMJ Corporate Network</span>
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
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 text-left font-sans animate-in fade-in zoom-in-95 duration-150">
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
                        PT Dwi Martha Jaya • Zero-Trust Geofence
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
                        Koneksi Anda cocok dengan Whitelist Gateway Resmi PT DMJ. Presensi mandiri dinyatakan sah sebagai jam kerja WFO tanpa memerlukan disposisi persetujuan manajer.
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

          {/* Live Digital Clock (Server RTC Authoritative Clock) */}
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/5 border border-slate-200 text-xs font-mono-code text-slate-700 font-semibold shadow-inner cursor-help"
            title="Waktu Resmi Server RTC (Asia/Jakarta WIB) • Anti-Manipulasi Jam HP/Device"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold">{timeStr || '08:00:00 WIB'}</span>
            <span className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-100/90 text-[9.5px] font-black text-emerald-800 tracking-wider">
              RTC SYNC
            </span>
          </div>

          {/* Clock Tamper Alert Warning (if employee modified phone clock) */}
          {isClockTampered && (
            <div 
              className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-300 text-[10px] font-mono-code text-rose-800 font-bold animate-bounce"
              title="Jam perangkat Anda berbeda dari waktu resmi server. Sistem otomatis mengunci presensi ke Jam Server RTC!"
            >
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>Jam HP Diubah • Terkunci ke Server</span>
            </div>
          )}

          {/* Real-Time Communication Live Status (SSE) */}
          <div 
            className={`hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-mono-code border transition-all ${
              isRtcLiveConnected 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90 shadow-2xs' 
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title={isRtcLiveConnected ? 'RTC Live Sync Aktif: Data presensi dan persetujuan tersinkronisasi seketika antar perangkat' : 'Menghubungkan Real-Time Stream...'}
          >
            <Zap className={`w-3 h-3 ${isRtcLiveConnected ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span className="font-bold">{isRtcLiveConnected ? 'RTC LIVE' : 'SYNCING'}</span>
          </div>
        </div>

        {/* User Switcher Dropdown & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
                    {/* Tour Demo Button */}
          <button
            id="tour-start-button"
            onClick={onStartTour}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8533] hover:from-[#e56000] hover:to-[#ff771a] text-white font-black text-xs shadow-md shadow-orange-500/25 transition-all active:scale-95 cursor-pointer animate-pulse"
            title="Mulai Panduan Tour Demo Interaktif Komponen dan Menu"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono-code">Tour Demo</span>
            <span className="sm:hidden font-mono-code">Tour</span>
          </button>

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

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-100 mb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono-code">RBAC Persona Switcher</p>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold font-mono-code uppercase bg-orange-100 text-orange-700">
                      Multi-Role
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">Pilih akun untuk menguji batasan hak akses RBAC:</p>
                </div>

                <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
                  {/* Group 1: Superuser */}
                  <div className="px-2 pt-1">
                    <span className="text-[10px] font-black uppercase text-amber-700 font-mono-code flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-600" /> Superuser (Akses Penuh)
                    </span>
                  </div>
                  {allUsers.filter(u => getEffectiveSystemRole(u) === 'superuser').map(user => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">{user.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{user.position}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}

                  {/* Group 2: Admin */}
                  <div className="px-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-blue-700 font-mono-code flex items-center gap-1">
                      <Shield className="w-3 h-3 text-blue-600" /> Admin (HR & Operations)
                    </span>
                  </div>
                  {allUsers.filter(u => getEffectiveSystemRole(u) === 'admin').map(user => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">{user.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{user.position}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}

                  {/* Group 3: Staff Biasa */}
                  <div className="px-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-emerald-700 font-mono-code flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-600" /> Staff Biasa (Data Sendiri Saja)
                    </span>
                  </div>
                  {allUsers.filter(u => getEffectiveSystemRole(u) === 'staff').map(user => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">{user.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{user.position}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Direct Shortcut to User Performance / ESS Portal */}
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
    </header>
  );
};
