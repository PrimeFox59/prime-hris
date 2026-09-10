import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MapPin,
  Wifi,
  Briefcase,
  Sparkles,
  Info,
  X,
  ArrowRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { Employee, AttendanceRecord, ApprovalItem } from '../types';

interface HrisTimelineChartProps {
  employees: Employee[];
  attendances: AttendanceRecord[];
  approvals: ApprovalItem[];
  onNavigateToTab: (tabId: string) => void;
}

export const HrisTimelineChart: React.FC<HrisTimelineChartProps> = ({
  employees,
  attendances,
  approvals,
  onNavigateToTab
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ON_TIME' | 'LATE' | 'DINAS_LUAR'>('ALL');
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [activeShiftFilter, setActiveShiftFilter] = useState<'ALL' | 'PAGI' | 'LEMBUR'>('ALL');

  // Timeline hours from 06:00 to 20:00 (14 hours)
  const startHour = 6;
  const endHour = 20;
  const totalHours = endHour - startHour;

  // Hourly slots array
  const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

  // Helper to convert "HH:mm:ss" to decimal hours
  const parseTimeToDecimal = (timeStr?: string): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parts[2] ? parseInt(parts[2], 10) : 0;
    return h + m / 60 + s / 3600;
  };

  // Map employee with their attendance status
  const employeeTimelineData = useMemo(() => {
    return employees.map(emp => {
      const att = attendances.find(a => a.employeeId === emp.id);
      const decTime = att ? parseTimeToDecimal(att.checkInTime) : null;
      const approval = approvals.find(ap => ap.employeeId === emp.id && ap.status === 'PENDING');
      
      let status: 'ON_TIME' | 'LATE' | 'DINAS_LUAR' | 'ABSENT' = 'ABSENT';
      if (att) {
        if (att.mode === 'DINAS_LUAR') status = 'DINAS_LUAR';
        else if (att.isLate) status = 'LATE';
        else status = 'ON_TIME';
      }

      return {
        employee: emp,
        attendance: att,
        decimalTime: decTime,
        status,
        approval
      };
    });
  }, [employees, attendances, approvals]);

  // Filtered list
  const filteredData = useMemo(() => {
    return employeeTimelineData.filter(item => {
      if (selectedFilter !== 'ALL' && item.status !== selectedFilter) return false;
      if (activeShiftFilter === 'PAGI' && item.decimalTime && item.decimalTime >= 15) return false;
      if (activeShiftFilter === 'LEMBUR' && item.decimalTime && item.decimalTime < 15) return false;
      return true;
    });
  }, [employeeTimelineData, selectedFilter, activeShiftFilter]);

  // Punctuality stats
  const onTimeCount = employeeTimelineData.filter(d => d.status === 'ON_TIME').length;
  const lateCount = employeeTimelineData.filter(d => d.status === 'LATE').length;
  const dinasLuarCount = employeeTimelineData.filter(d => d.status === 'DINAS_LUAR').length;
  const totalPresent = onTimeCount + lateCount + dinasLuarCount;
  const punctualityRate = totalPresent > 0 ? Math.round((onTimeCount / totalPresent) * 100) : 0;

  // Calculate position percentage on timeline
  const getPositionPercent = (decHour: number) => {
    const clamped = Math.max(startHour, Math.min(endHour, decHour));
    return ((clamped - startHour) / totalHours) * 100;
  };

  return (
    <div className="glass-card rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-md space-y-5 motion-fade-in-up w-full max-w-full min-w-0 overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-50 text-[#FF6B00]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Timeline Presensi Hari Ini
            </h2>
            <p className="text-xs text-slate-500">
              Monitoring kedatangan & aktivitas shift karyawan
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/60 text-xs">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({employees.length})
            </button>
            <button
              onClick={() => setSelectedFilter('ON_TIME')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'ON_TIME'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tepat Waktu ({onTimeCount})
            </button>
            <button
              onClick={() => setSelectedFilter('LATE')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'LATE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Terlambat ({lateCount})
            </button>
            <button
              onClick={() => setSelectedFilter('DINAS_LUAR')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'DINAS_LUAR'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Dinas Luar ({dinasLuarCount})
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Mini Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-mono-code block">
            Kedisiplinan
          </span>
          <div className="text-lg font-black text-emerald-900 font-mono-code mt-0.5">
            {punctualityRate}%
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-200/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00] font-mono-code block">
            Puncak Masuk
          </span>
          <div className="text-lg font-black text-slate-900 font-mono-code mt-0.5">
            07:45 – 08:15
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 font-mono-code block">
            Rata-rata Check-In
          </span>
          <div className="text-lg font-black text-blue-900 font-mono-code mt-0.5">
            08:05 WIB
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono-code block">
            Batas Cutoff
          </span>
          <div className="text-lg font-black text-rose-600 font-mono-code mt-0.5">
            08:30 WIB
          </div>
        </div>
      </div>

      {/* Interactive Timeline Canvas / Swimlane */}
      <div className="relative pt-5 pb-4 bg-slate-900/5 rounded-3xl p-4 sm:p-5 border border-slate-200 overflow-x-auto">
        
        {/* Timeline Horizontal Axis with Zones */}
        <div className="min-w-[680px]">
          {/* Shift Zones Background Banner */}
          <div className="relative h-7 rounded-xl overflow-hidden mb-3 border border-slate-200/80 bg-white flex text-[10px] font-mono-code font-bold">
            {/* Early / Prep Zone */}
            <div
              style={{ width: `${((7 - 6) / totalHours) * 100}%` }}
              className="bg-slate-100 text-slate-500 flex items-center justify-center border-r border-slate-200"
              title="06:00 - 07:00: Persiapan"
            >
              06:00 - 07:00
            </div>

            {/* On-Time Zone: 07:00 - 08:30 (1.5 hours) */}
            <div
              style={{ width: `${((8.5 - 7) / totalHours) * 100}%` }}
              className="bg-emerald-100/90 text-emerald-800 flex items-center justify-center border-r-2 border-dashed border-rose-400 relative"
              title="07:00 - 08:30: Tepat Waktu"
            >
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Tepat Waktu (07:00-08:30)
              </span>
            </div>

            {/* Late Zone: 08:30 - 12:00 */}
            <div
              style={{ width: `${((12 - 8.5) / totalHours) * 100}%` }}
              className="bg-rose-50/80 text-rose-700 flex items-center justify-center border-r border-slate-200"
              title="08:30+: Terlambat"
            >
              Terlambat
            </div>

            {/* Lunch: 12:00 - 13:00 */}
            <div
              style={{ width: `${(1 / totalHours) * 100}%` }}
              className="bg-amber-100/80 text-amber-800 flex items-center justify-center border-r border-slate-200"
              title="12:00 - 13:00: Istirahat"
            >
              Istirahat
            </div>

            {/* Normal Work: 13:00 - 17:00 */}
            <div
              style={{ width: `${(4 / totalHours) * 100}%` }}
              className="bg-slate-50 text-slate-600 flex items-center justify-center border-r border-slate-200"
              title="13:00 - 17:00: Reguler"
            >
              Reguler
            </div>

            {/* Overtime Zone: 17:00 - 20:00 */}
            <div
              style={{ width: `${(3 / totalHours) * 100}%` }}
              className="bg-orange-100/90 text-[#FF6B00] flex items-center justify-center font-black"
              title="17:00 - 20:00: Lembur"
            >
              ⚡ Lembur
            </div>
          </div>

          {/* Time Ticks */}
          <div className="relative h-6 flex justify-between text-[11px] font-mono-code font-bold text-slate-400 select-none border-b border-slate-200 mb-4 pb-1">
            {hours.map(hr => (
              <div
                key={hr}
                onMouseEnter={() => setHoveredHour(hr)}
                onMouseLeave={() => setHoveredHour(null)}
                className={`flex flex-col items-center cursor-pointer transition-colors ${
                  hoveredHour === hr ? 'text-[#FF6B00] scale-110 font-black' : ''
                }`}
              >
                <span>{String(hr).padStart(2, '0')}:00</span>
                <span className="w-0.5 h-1.5 bg-slate-300 mt-0.5"></span>
              </div>
            ))}

            {/* Cutoff Indicator Pin at 08:30 */}
            <div
              style={{ left: `${getPositionPercent(8.5)}%` }}
              className="absolute -top-6 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
            >
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase font-mono-code shadow-xs whitespace-nowrap animate-bounce">
                Cutoff 08:30
              </span>
              <div className="w-0.5 h-8 bg-rose-500 border-l border-dashed"></div>
            </div>
          </div>

          {/* Employee Swimlanes */}
          <div className="space-y-3">
            {filteredData.map((item, idx) => {
              const { employee, attendance, decimalTime, status } = item;
              const hasCheckIn = decimalTime !== null;
              const position = hasCheckIn ? getPositionPercent(decimalTime) : null;

              return (
                <div
                  key={employee.id}
                  style={{ animationDelay: `${(idx + 1) * 60}ms` }}
                  className="group relative bg-white/90 hover:bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex items-center gap-3"
                >
                  {/* Left: Employee Info */}
                  <div className="w-52 shrink-0 flex items-center gap-2.5">
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-xs font-black text-slate-900 truncate leading-tight group-hover:text-[#FF6B00] transition-colors">
                        {employee.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono-code">
                        <span>{employee.nik ? employee.nik.replace(/^DMJ-/i, 'PRIME-') : ''}</span>
                        <span>•</span>
                        <span className="text-slate-600 font-medium truncate">{employee.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Timeline Track */}
                  <div className="flex-1 relative h-10 bg-slate-50 rounded-xl border border-slate-200/60 overflow-hidden flex items-center px-2">
                    
                    {/* Shift Guide Grid lines */}
                    <div className="absolute inset-0 flex justify-between pointer-events-none opacity-30">
                      {hours.map(h => (
                        <div key={h} className="w-px h-full bg-slate-300" />
                      ))}
                    </div>

                    {/* Cutoff Vertical Line */}
                    <div
                      style={{ left: `${getPositionPercent(8.5)}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-300/80 border-l border-dashed border-rose-400 pointer-events-none"
                    />

                    {/* Check-In Marker Point */}
                    {hasCheckIn && position !== null && (
                      <div
                        style={{ left: `${position}%` }}
                        onClick={() => attendance && setSelectedRecord(attendance)}
                        className="absolute -translate-x-1/2 flex items-center gap-1.5 cursor-pointer z-20 group/pin"
                      >
                        {/* Interactive Pin Bubble */}
                        <div
                          className={`px-2.5 py-1 rounded-full text-[11px] font-black font-mono-code text-white shadow-md flex items-center gap-1 transition-all group-hover/pin:scale-110 active:scale-95 ${
                            status === 'ON_TIME'
                              ? 'bg-emerald-600 ring-2 ring-emerald-300'
                              : status === 'LATE'
                              ? 'bg-rose-600 ring-2 ring-rose-300 animate-pulse'
                              : 'bg-blue-600 ring-2 ring-blue-300'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{attendance?.checkInTime}</span>
                        </div>

                        {/* Tag details on hover */}
                        <div className="hidden group-hover/pin:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950 text-white rounded-xl p-2 text-[10px] font-medium shadow-xl whitespace-nowrap z-50 pointer-events-none">
                          <p className="font-bold text-[#FF6B00]">{employee.name}</p>
                          <p>Masuk: {attendance?.checkInTime} WIB ({status})</p>
                          <p className="text-slate-400">WiFi: {attendance?.wifi.ssid}</p>
                        </div>
                      </div>
                    )}

                    {/* Active Work Span Bar (from check-in to end of regular shift or current time) */}
                    {hasCheckIn && position !== null && (
                      <div
                        style={{
                          left: `${position}%`,
                          width: `${Math.max(10, getPositionPercent(17) - position)}%`
                        }}
                        className={`h-2 rounded-full opacity-60 ${
                          status === 'ON_TIME'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : status === 'LATE'
                            ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-400'
                        }`}
                      />
                    )}

                    {!hasCheckIn && (
                      <span className="text-[10px] font-mono-code text-slate-400 italic mx-auto">
                        Belum melakukan presensi hari ini / Sedang cuti resmi
                      </span>
                    )}
                  </div>

                  {/* Far Right: Status Pill & Action */}
                  <div className="w-36 shrink-0 flex items-center justify-end gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono-code ${
                        status === 'ON_TIME'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'LATE'
                          ? 'bg-rose-100 text-rose-800'
                          : status === 'DINAS_LUAR'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {status === 'ON_TIME'
                        ? 'Tepat Waktu'
                        : status === 'LATE'
                        ? `Telat ${attendance?.lateMinutes}m`
                        : status === 'DINAS_LUAR'
                        ? 'Dinas Luar'
                        : 'Belum Masuk'}
                    </span>

                    {attendance && (
                      <button
                        onClick={() => setSelectedRecord(attendance)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#FF6B00] text-slate-600 hover:text-white transition-all cursor-pointer"
                        title="Lihat Detail Selfie & Verifikasi"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Detail Rekaman Presensi */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative modal-dialog-animate">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-md bg-[#FF6B00] text-white text-[10px] font-black uppercase font-mono-code">
                DETAIL PRESENSI LIVE
              </span>
              <span className="text-xs font-mono-code text-slate-500">
                ID: {selectedRecord.id}
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4">
              <img
                src={selectedRecord.photoUrl}
                alt="Selfie Presensi"
                className="w-16 h-16 rounded-xl object-cover border-2 border-[#FF6B00] shadow-xs shrink-0"
              />
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedRecord.employeeName}</h3>
                <p className="text-xs text-slate-500 font-mono-code">{selectedRecord.employeeNik ? selectedRecord.employeeNik.replace(/^DMJ-/i, 'PRIME-') : ''}</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">{selectedRecord.department}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">Waktu Presensi Kamera:</span>
                <span className="font-mono-code font-bold text-slate-900">
                  {selectedRecord.date} • {selectedRecord.checkInTime} WIB
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">Status Validasi:</span>
                <span
                  className={`font-mono-code font-bold px-2 py-0.5 rounded-md ${
                    selectedRecord.isLate
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {selectedRecord.isLate ? `Terlambat ${selectedRecord.lateMinutes} Menit` : 'Tepat Waktu (On-Time)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">Koneksi WiFi Kantor:</span>
                <span className="font-mono-code font-semibold text-slate-800 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-[#FF6B00]" />
                  {selectedRecord.wifi.ssid} ({selectedRecord.wifi.isAuthorized ? 'Terverifikasi Resmi' : 'Jaringan Publik'})
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">Geolokasi Terdeteksi:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 text-right max-w-xs truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {selectedRecord.location.address}
                </span>
              </div>

              {selectedRecord.lateReason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  <span className="font-bold block text-[11px] uppercase font-mono-code">Alasan Keterlambatan:</span>
                  <p className="mt-0.5">{selectedRecord.lateReason}</p>
                </div>
              )}

              {selectedRecord.dinasLuarDetails && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                  <span className="font-bold block text-[11px] uppercase font-mono-code">Detail Penugasan Dinas:</span>
                  <p className="mt-0.5"><strong>Tujuan:</strong> {selectedRecord.dinasLuarDetails.destination}</p>
                  <p><strong>Proyek:</strong> {selectedRecord.dinasLuarDetails.projectCode}</p>
                  <p><strong>Keperluan:</strong> {selectedRecord.dinasLuarDetails.purpose}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  onNavigateToTab('approvals');
                }}
                className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e56000] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Buka di Pusat Approval</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
