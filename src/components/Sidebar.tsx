import React, { useState } from 'react';
import {
  LayoutDashboard,
  Camera,
  CheckSquare,
  Users,
  Banknote,
  Sliders,
  FileSpreadsheet,
  ChevronRight,
  UserCheck,
  Shield,
  Crown
} from 'lucide-react';
import { UserRole, SystemRole } from '../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  userRole: UserRole;
  systemRole?: SystemRole;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  systemRole = 'staff',
  pendingApprovalsCount
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Build tailored menus based on RBAC role
  const getMenuItems = () => {
    if (systemRole === 'staff') {
      return [
        {
          id: 'dashboard',
          title: 'PORTAL KINERJA SAYA',
          desc: 'Ringkasan kehadiran pribadi, sisa cuti tahunan, slip gaji & proyeksi lembur Anda',
          icon: LayoutDashboard,
          badge: 'SAYA'
        },
        {
          id: 'attendance',
          title: 'PRESENSI KAMERA SAYA',
          desc: 'Presensi selfie kamera geotag, validasi IP resmi kantor & dinas luar mendadak',
          icon: Camera,
          badge: null
        },
        {
          id: 'payroll',
          title: 'SLIP GAJI SAYA',
          desc: 'Rincian penerimaan gaji pokok, tunjangan kerja, upah lembur & cetak slip resmi Prime HRIS',
          icon: Banknote,
          badge: 'SLIP'
        },
        {
          id: 'users',
          title: 'PROFIL DATA SAYA',
          desc: 'Cek data NIK, departemen, rekening bank payroll, kuota cuti & device MAC terikat',
          icon: UserCheck,
          badge: null
        },
        {
          id: 'proposal',
          title: 'PROPOSAL KOMERSIAL',
          desc: 'Proposal penawaran implementasi Prime HRIS Enterprise Platform',
          icon: FileSpreadsheet,
          badge: 'PRIME'
        }
      ];
    }

    if (systemRole === 'admin') {
      return [
        {
          id: 'dashboard',
          title: 'DASHBOARD HRIS & SDM',
          desc: 'Monitoring operasional SDM, headcount workshop & rekapitulasi kehadiran harian',
          icon: LayoutDashboard,
          badge: 'HR'
        },
        {
          id: 'attendance',
          title: 'PRESENSI & IP GATEWAY',
          desc: 'Verifikasi selfie kamera, validasi IP kantor & pendaftaran presensi dinas luar',
          icon: Camera,
          badge: null
        },
        {
          id: 'users',
          title: 'DATA KARYAWAN',
          desc: 'Manajemen master karyawan, penugasan proyek, kuota cuti & rekening payroll',
          icon: Users,
          badge: null
        },
        {
          id: 'payroll',
          title: 'PAYROLL & PROYEK',
          desc: 'Penggajian rapi per proyek, rekap upah lembur Depnaker & slip gaji resmi Prime HRIS',
          icon: Banknote,
          badge: null
        },
        {
          id: 'proposal',
          title: 'PROPOSAL KOMERSIAL',
          desc: 'Proposal penawaran implementasi Prime HRIS Enterprise Platform',
          icon: FileSpreadsheet,
          badge: 'PRIME'
        }
      ];
    }

    // Default: Superuser (Full Menus without approvals)
    return [
      {
        id: 'dashboard',
        title: 'DASHBOARD TERPADU',
        desc: 'Pusat monitoring terpadu: HRIS SDM, Finance Kas & Kinerja Saya',
        icon: LayoutDashboard,
        badge: 'SUPER'
      },
      {
        id: 'attendance',
        title: 'PRESENSI KAMERA & WIFI',
        desc: 'Presensi selfie kamera, WiFi gate, geotag & dinas luar',
        icon: Camera,
        badge: null
      },
      {
        id: 'users',
        title: 'USER MANAGEMENT',
        desc: 'Manajemen pengguna & staf, jatah cuti, data rekening & MAC device',
        icon: Users,
        badge: null
      },
      {
        id: 'payroll',
        title: 'PAYROLL & PROYEK',
        desc: 'Penggajian rapi dengan filter per proyek & slip gaji resmi Prime HRIS',
        icon: Banknote,
        badge: null
      },
      {
        id: 'proposal',
        title: 'PROPOSAL KOMERSIAL',
        desc: 'Proposal penawaran implementasi Prime HRIS Enterprise Platform',
        icon: FileSpreadsheet,
        badge: 'PRIME'
      }
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="fixed left-3 sm:left-5 top-1/2 -translate-y-1/2 z-40 select-none hidden md:block">
      {/* Translucent White Glass Pill Container */}
      <div id="tour-sidebar" className="bg-white/85 backdrop-blur-md border border-white/90 rounded-full p-2 flex flex-col items-center gap-2.5 shadow-xl shadow-slate-900/10 motion-slide-left">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          const isDashboard = item.id === 'dashboard' && (activeTab === 'dashboard' || activeTab === 'dashboard_hris' || activeTab === 'dashboard_finance' || activeTab === 'user_performance');
          const isActive = activeTab === item.id || isDashboard;
          const isHovered = hoveredTab === item.id;

          return (
            <div
              key={item.id}
              style={{ animationDelay: `${(idx + 1) * 40}ms` }}
              className="relative motion-scale-in"
              onMouseEnter={() => setHoveredTab(item.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              {/* Circular Icon Button */}
              <button
                id={`tour-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-tr from-[#FF6B00] to-[#FF8533] text-white shadow-lg shadow-orange-500/30 scale-110 motion-pulse-glow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 hover:scale-105 active:scale-95'
                }`}
                title={item.title}
              >
                <Icon className="w-5 h-5 transition-transform" />
                
                {/* Badge for Pending Approvals or Special */}
                {item.badge !== null && (
                  <span className={`absolute -top-1 -right-1 text-[9px] font-black rounded-full px-1.5 py-0.2 shadow-xs ${
                    typeof item.badge === 'number'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-emerald-500 text-white font-mono-code'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Flyout Hover Card Tooltip */}
              {isHovered && (
                <div className="absolute left-14 top-1/2 -translate-y-1/2 w-64 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl border border-slate-700/60 pointer-events-none z-50 animate-in fade-in slide-in-from-left-2 duration-150">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black tracking-wider uppercase text-[#FF8533] font-mono-code">
                      {item.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    {item.desc}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
