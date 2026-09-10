import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Wifi,
  MapPin,
  DollarSign,
  Calculator,
  Save,
  Plus,
  Trash2,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { SalaryRuleConfig, Employee, SystemRole, getEffectiveSystemRole } from '../types';
import { formatIDR } from '../utils/payrollCalculator';

interface SalaryRulesTabProps {
  currentUser?: Employee;
  salaryRules: SalaryRuleConfig;
  onUpdateSalaryRules: (rules: SalaryRuleConfig) => void;
}

export const SalaryRulesTab: React.FC<SalaryRulesTabProps> = ({
  currentUser,
  salaryRules,
  onUpdateSalaryRules
}) => {
  const currentRole: SystemRole = getEffectiveSystemRole(currentUser);
  const isSuperuser = currentRole === 'superuser';

  const [config, setConfig] = useState<SalaryRuleConfig>(salaryRules);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Simulator State
  const [simBase, setSimBase] = useState(12000000);
  const [simPresentDays, setSimPresentDays] = useState(21);
  const [simLateMinutes, setSimLateMinutes] = useState(30);
  const [simLateApproved, setSimLateApproved] = useState(false);
  const [simOtHours, setSimOtHours] = useState(14);
  const [simIsRemote, setSimIsRemote] = useState(true);

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperuser) return;
    onUpdateSalaryRules(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Staff Access Lock Screen
  if (currentRole === 'staff') {
    return (
      <div className="glass-card rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto my-12 border border-rose-200 bg-rose-50/30 motion-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-mono-code font-bold text-[10px] tracking-wider uppercase mb-3">
          AKSES DITOLAK • RESTRICTED MODULE
        </div>
        <h2 className="text-xl font-black text-slate-900 font-mono-code mb-2">
          Area Khusus Manajemen & Direksi
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          Modul konfigurasi aturan gaji, formula lembur Depnaker RI, persentase BPJS, dan registry IP Gateway kantor hanya dapat diakses oleh level <b>Superuser (Direksi)</b> dan <b>Admin HR</b>.
        </p>
        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200 text-left flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Pengguna Saat Ini</p>
            <p className="text-xs font-bold text-slate-800">{currentUser?.name || 'Staff'}</p>
          </div>
          <span className="text-[10px] font-mono-code font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Role: STAFF BIASA
          </span>
        </div>
      </div>
    );
  }

  // Live calculation based on current config and sim values
  const simHourlyRate = Math.round(simBase / config.overtimeFormula.hourlyRateDivisor);
  const simOtPay = Math.round(simOtHours * config.overtimeFormula.subsequentHourRateMultiplier * simHourlyRate);
  const simDailyTotal = simPresentDays * config.defaultDailyAllowance;
  const simRemoteAllowance = simIsRemote ? config.remoteProjectAllowance : 0;
  
  // Late deduction
  let simLateDeduction = 0;
  if (!simLateApproved && simLateMinutes > config.lateGracePeriodMinutes) {
    const blocks = Math.ceil((simLateMinutes - config.lateGracePeriodMinutes) / 15);
    simLateDeduction = blocks * config.latePenaltyPerBlock;
  }

  const simGross = simBase + simDailyTotal + simRemoteAllowance + simOtPay;
  const simBpjsTk = Math.round(simBase * config.bpjsKetenagakerjaanRate);
  const simBpjsKes = Math.round(simBase * config.bpjsKesehatanRate);
  const simTotalDeduct = simLateDeduction + simBpjsTk + simBpjsKes;
  const simTakeHomePay = simGross - simTotalDeduct;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Banner */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 motion-fade-in-down">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="prime-cut-corner bg-[#FF6B00] text-white text-[10px] font-black px-2.5 py-0.5 tracking-wider uppercase font-mono-code">
              POLICY & CALCULATION ENGINE
            </span>
            <span className="text-xs font-semibold text-slate-500">Kemenaker RI & Prime Enterprise Standard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Aturan Set Gaji, Lembur, Penalti & Registry WiFi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Konfigurasi formula lembur 173 Depnaker, ambang penalti keterlambatan, whitelist WiFi kantor, dan geofence radius.
          </p>
        </div>

        {saveSuccess && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Aturan Berhasil Diperbarui!</span>
          </div>
        )}
      </div>

      {/* Security notice for non-superusers */}
      {!isSuperuser && (
        <div className="glass-card rounded-2xl p-4 bg-amber-50/80 border border-amber-300 text-amber-900 flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Mode Terkunci (Read-Only) • Hak Akses Terbatas</p>
              <p className="text-[11px] text-amber-800">
                Formula lembur Depnaker RI, persentase BPJS, dan registry IP Gateway kantor hanya dapat diubah oleh <b>Superuser (Direktur PT Dwi Martha Jaya)</b>.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono-code font-bold uppercase px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 shrink-0 border border-amber-300">
            READ-ONLY
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6 motion-fade-in-up stagger-1">
          <form onSubmit={handleSave} className="glass-card rounded-3xl p-5 sm:p-6 space-y-5 text-xs">
            <fieldset disabled={!isSuperuser} className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF6B00]" />
                <span>1. Parameter Jam Kerja & Penalti Keterlambatan</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Batas Jam Masuk</label>
                <input
                  type="text"
                  value={config.cutoffTime}
                  onChange={e => setConfig({ ...config, cutoffTime: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold text-slate-800"
                  placeholder="08:30"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Toleransi / Grace (Menit)</label>
                <input
                  type="number"
                  value={config.lateGracePeriodMinutes}
                  onChange={e => setConfig({ ...config, lateGracePeriodMinutes: Number(e.target.value) })}
                  className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Penalti / 15 Menit (IDR)</label>
                <input
                  type="number"
                  step={5000}
                  value={config.latePenaltyPerBlock}
                  onChange={e => setConfig({ ...config, latePenaltyPerBlock: Number(e.target.value) })}
                  className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold text-rose-600"
                  required
                />
              </div>
            </div>

            <div className="border-b border-slate-100 pt-3 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#FF6B00]" />
                <span>2. Formula Lembur (Depnaker RI)</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Pembagi Gaji (Jam)</label>
                <input
                  type="number"
                  value={config.overtimeFormula.hourlyRateDivisor}
                  onChange={e => setConfig({
                    ...config,
                    overtimeFormula: { ...config.overtimeFormula, hourlyRateDivisor: Number(e.target.value) }
                  })}
                  className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold text-slate-800"
                  required
                />
                <span className="text-[9px] text-slate-400">Standar Depnaker: 173</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Multiplier Jam ke-1</label>
                <input
                  type="number"
                  step={0.1}
                  value={config.overtimeFormula.firstHourRateMultiplier}
                  onChange={e => setConfig({
                    ...config,
                    overtimeFormula: { ...config.overtimeFormula, firstHourRateMultiplier: Number(e.target.value) }
                  })}
                  className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold text-slate-800"
                  required
                />
                <span className="text-[9px] text-slate-400">1.5x Upah per Jam</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Multiplier Jam ke-2+</label>
                <input
                  type="number"
                  step={0.1}
                  value={config.overtimeFormula.subsequentHourRateMultiplier}
                  onChange={e => setConfig({
                    ...config,
                    overtimeFormula: { ...config.overtimeFormula, subsequentHourRateMultiplier: Number(e.target.value) }
                  })}
                  className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold text-slate-800"
                  required
                />
                <span className="text-[9px] text-slate-400">2.0x Upah per Jam</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Multiplier Hari Libur</label>
                <input
                  type="number"
                  step={0.1}
                  value={config.overtimeFormula.holidayRateMultiplier}
                  onChange={e => setConfig({
                    ...config,
                    overtimeFormula: { ...config.overtimeFormula, holidayRateMultiplier: Number(e.target.value) }
                  })}
                  className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold text-slate-800"
                  required
                />
                <span className="text-[9px] text-slate-400">2.0x - 3.0x</span>
              </div>
            </div>

            <div className="border-b border-slate-100 pt-3 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#FF6B00]" />
                <span>3. Tarif BPJS & Tunjangan Standar</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">BPJS Ketenagakerjaan</label>
                <input
                  type="number"
                  step={0.005}
                  value={config.bpjsKetenagakerjaanRate}
                  onChange={e => setConfig({ ...config, bpjsKetenagakerjaanRate: Number(e.target.value) })}
                  className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold text-slate-800"
                  required
                />
                <span className="text-[9px] text-slate-400">3% (JHT 2% + JP 1%)</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">BPJS Kesehatan</label>
                <input
                  type="number"
                  step={0.005}
                  value={config.bpjsKesehatanRate}
                  onChange={e => setConfig({ ...config, bpjsKesehatanRate: Number(e.target.value) })}
                  className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold text-slate-800"
                  required
                />
                <span className="text-[9px] text-slate-400">1% Pekerja</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Uang Harian Standar</label>
                <input
                  type="number"
                  step={5000}
                  value={config.defaultDailyAllowance}
                  onChange={e => setConfig({ ...config, defaultDailyAllowance: Number(e.target.value) })}
                  className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold text-slate-800"
                  required
                />
                <span className="text-[9px] text-slate-400">Makan & Transport</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Tunj. Remote Site / Bln</label>
                <input
                  type="number"
                  step={50000}
                  value={config.remoteProjectAllowance}
                  onChange={e => setConfig({ ...config, remoteProjectAllowance: Number(e.target.value) })}
                  className="w-full glass-input rounded-xl px-3 py-2 font-mono-code font-bold text-slate-800"
                  required
                />
                <span className="text-[9px] text-slate-400">Mining & Smelter Site</span>
              </div>
            </div>

            {/* Whitelist WiFi Networks */}
            <div className="border-b border-slate-100 pt-3 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[#FF6B00]" />
                <span>4. Daftar Jaringan WiFi Resmi Kantor (Gate Whitelist)</span>
              </h2>
            </div>

            <div className="space-y-2">
              {config.authorizedWifiNetworks.map((net, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900 font-mono-code">
                      <span>{net.ssid}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {net.bssid}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{net.locationName} • {net.description}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    Otorisasi Aktif
                  </span>
                </div>
              ))}
            </div>
            </fieldset>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={!isSuperuser}
                className={`px-6 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition-all ${
                  isSuperuser
                    ? 'btn-orange text-white cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
              >
                {isSuperuser ? <Save className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isSuperuser ? 'Simpan Seluruh Perubahan Aturan' : 'Hanya Superuser yang Dapat Mengubah Aturan'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Salary & Penalty Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6 motion-fade-in-up stagger-2">
          <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4 card-interactive">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#FF6B00]" />
                <span>Simulasi Perhitungan Gaji & Penalti Realtime</span>
              </h2>
              <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full font-mono-code">
                Interactive
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Uji coba formula di sebelah kiri terhadap skenario kehadiran dan lembur karyawan:
            </p>

            {/* Controls */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Gaji Pokok:</span>
                  <span className="font-mono-code font-bold text-slate-900">{formatIDR(simBase)}</span>
                </div>
                <input
                  type="range"
                  min={5000000}
                  max={25000000}
                  step={500000}
                  value={simBase}
                  onChange={e => setSimBase(Number(e.target.value))}
                  className="w-full accent-[#FF6B00]"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Hari Hadir Aktual:</span>
                  <span className="font-mono-code font-bold text-slate-900">{simPresentDays} Hari</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={25}
                  value={simPresentDays}
                  onChange={e => setSimPresentDays(Number(e.target.value))}
                  className="w-full accent-[#FF6B00]"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Total Jam Lembur:</span>
                  <span className="font-mono-code font-bold text-slate-900">{simOtHours} Jam</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={simOtHours}
                  onChange={e => setSimOtHours(Number(e.target.value))}
                  className="w-full accent-[#FF6B00]"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>Keterlambatan Kumulatif:</span>
                  <span className={`font-mono-code font-bold ${simLateMinutes > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {simLateMinutes} Menit
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={simLateMinutes}
                  onChange={e => setSimLateMinutes(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-700">Status Approval Keterlambatan:</span>
                <button
                  type="button"
                  onClick={() => setSimLateApproved(!simLateApproved)}
                  className={`px-3 py-1 rounded-lg font-bold text-[10px] cursor-pointer transition-all ${
                    simLateApproved
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {simLateApproved ? 'Disetujui (Bebas Penalti)' : 'Belum Diapprove (Kena Penalti)'}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-700">Penugasan Remote Site / Mining:</span>
                <input
                  type="checkbox"
                  checked={simIsRemote}
                  onChange={e => setSimIsRemote(e.target.checked)}
                  className="w-4 h-4 accent-[#FF6B00]"
                />
              </div>
            </div>

            {/* Calculation Result Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5 shadow-xl">
              <p className="text-[10px] uppercase font-bold text-[#FF8533] tracking-widest font-mono-code">
                HASIL KALKULASI PENGGAJIAN
              </p>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Upah per Jam (1/173):</span>
                  <span className="font-mono-code">{formatIDR(simHourlyRate)}/jam</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Uang Lembur ({simOtHours} Jam × 2x):</span>
                  <span className="font-mono-code text-emerald-400">+{formatIDR(simOtPay)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Uang Harian ({simPresentDays} Hari):</span>
                  <span className="font-mono-code text-emerald-400">+{formatIDR(simDailyTotal)}</span>
                </div>
                {simIsRemote && (
                  <div className="flex justify-between text-slate-300">
                    <span>Tunjangan Site Remote:</span>
                    <span className="font-mono-code text-emerald-400">+{formatIDR(simRemoteAllowance)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>Potongan BPJS (TK 3% + Kes 1%):</span>
                  <span className="font-mono-code text-rose-400">-{formatIDR(simBpjsTk + simBpjsKes)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Penalti Keterlambatan:</span>
                  <span className={`font-mono-code ${simLateDeduction > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                    {simLateDeduction > 0 ? `-${formatIDR(simLateDeduction)}` : 'Rp 0'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Estimasi Gaji Bersih (THP)</p>
                  <p className="text-lg font-black text-[#00E2B0] font-mono-code">
                    {formatIDR(simTakeHomePay)}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono-code">
                  Net Salary
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
