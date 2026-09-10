import React, { useState } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Briefcase,
  Calendar,
  FileText,
  Filter,
  Plus,
  Search,
  Sparkles,
  Send,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Employee, ApprovalItem, LeaveType, SystemRole, getEffectiveSystemRole } from '../types';

interface ApprovalHubTabProps {
  approvals: ApprovalItem[];
  employees: Employee[];
  currentUser: Employee;
  onApprove: (id: string, reviewerNote?: string) => void;
  onReject: (id: string, reviewerNote?: string) => void;
  onRequestRevision: (id: string, reviewerNote?: string) => void;
  onSubmitNewLeaveRequest: (item: ApprovalItem) => void;
}

export const ApprovalHubTab: React.FC<ApprovalHubTabProps> = ({
  approvals,
  employees,
  currentUser,
  onApprove,
  onReject,
  onRequestRevision,
  onSubmitNewLeaveRequest
}) => {
  const currentRole: SystemRole = getEffectiveSystemRole(currentUser);
  const isStaff = currentRole === 'staff';
  const isApprover = (currentRole === 'superuser' || currentRole === 'admin') && !isStaff;

  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Review Modal State
  const [reviewModalItem, setReviewModalItem] = useState<{
    item: ApprovalItem;
    action: 'APPROVE' | 'REJECT' | 'REVISE';
  } | null>(null);
  const [reviewerNote, setReviewerNote] = useState('');

  // Submit Leave Request Modal State
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newRequestType, setNewRequestType] = useState<'LEAVE' | 'PERMIT'>('LEAVE');
  const [newLeaveType, setNewLeaveType] = useState<LeaveType>('CUTI_TAHUNAN');
  const [newStartDate, setNewStartDate] = useState('2026-09-18');
  const [newEndDate, setNewEndDate] = useState('2026-09-19');
  const [newDaysCount, setNewDaysCount] = useState(2);
  const [newTitle, setNewTitle] = useState('Permohonan Cuti Tahunan');
  const [newDescription, setNewDescription] = useState('Keperluan keluarga di luar kota.');

  const handleActionClick = (item: ApprovalItem, action: 'APPROVE' | 'REJECT' | 'REVISE') => {
    setReviewModalItem({ item, action });
    setReviewerNote('');
  };

  const confirmAction = () => {
    if (!reviewModalItem) return;
    const { item, action } = reviewModalItem;

    if (action === 'APPROVE') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      onApprove(item.id, reviewerNote);
    } else if (action === 'REJECT') {
      onReject(item.id, reviewerNote);
    } else {
      onRequestRevision(item.id, reviewerNote);
    }

    setReviewModalItem(null);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();

    const newItem: ApprovalItem = {
      id: `APP-${Date.now()}`,
      type: newRequestType,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeNik: currentUser.nik,
      department: currentUser.department,
      title: newTitle,
      description: newDescription,
      startDate: newStartDate,
      endDate: newEndDate,
      daysCount: newDaysCount,
      leaveType: newRequestType === 'LEAVE' ? newLeaveType : undefined,
      status: 'PENDING',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    onSubmitNewLeaveRequest(newItem);
    setShowNewRequestModal(false);
  };

  // For staff, strictly limit to their own submissions
  const baseApprovals = isStaff
    ? approvals.filter(item => item.employeeId === currentUser.id)
    : approvals;

  const filteredApprovals = baseApprovals.filter(item => {
    const matchType = filterType === 'ALL' || item.type === filterType;
    const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchSearch =
      item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeNik.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  const pendingCount = baseApprovals.filter(a => a.status === 'PENDING').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 motion-fade-in-down">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="prime-cut-corner bg-[#FF6B00] text-white text-[10px] font-black px-2.5 py-0.5 tracking-wider uppercase font-mono-code">
              {isStaff ? 'PORTAL PENGAJUAN SAYA' : 'MULTI-TIER APPROVAL SYSTEM'}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {isStaff ? 'Status Pengajuan Izin / Cuti Pribadi' : isApprover ? 'Mode Reviewer (Direksi & HR)' : 'Mode Akses Terbatas'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isStaff ? 'Pengajuan & Status Persetujuan Saya' : 'Pusat Persetujuan Izin, Cuti, Telat & Dinas Luar'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {isStaff
              ? 'Pantau status permohonan dispensasi kehadiran, sisa saldo cuti tahunan, dan justifikasi keterlambatan kerja Anda.'
              : 'Otorisasi berjenjang dengan audit trail digital, pemotongan kuota cuti otomatis, dan mitigasi penalti gaji.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="px-4 py-2 rounded-2xl bg-orange-50 border border-orange-200 text-right">
            <p className="text-[10px] uppercase font-bold text-orange-600">{isStaff ? 'Pengajuan Aktif' : 'Menunggu Persetujuan'}</p>
            <p className="text-xl font-black text-[#FF6B00] font-mono-code">{pendingCount} Pengajuan</p>
          </div>

          <button
            onClick={() => setShowNewRequestModal(true)}
            className="px-5 py-2.5 rounded-2xl btn-orange font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Cuti / Izin Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 motion-fade-in-up stagger-1">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Semua Kategori' },
            { id: 'LEAVE', label: 'Cuti Tahunan' },
            { id: 'PERMIT', label: 'Izin Sakit/Pribadi' },
            { id: 'LATE_JUSTIFICATION', label: 'Keterlambatan' },
            { id: 'DINAS_LUAR', label: 'Dinas Luar Mendadak' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white/80 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="glass-input rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu Persetujuan</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
            <option value="REVISION_REQUESTED">Minta Revisi</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari karyawan / NIK..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="glass-input rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 w-44 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Approval Cards List */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Tidak Ada Pengajuan Menunggu</h3>
            <p className="text-xs text-slate-500">Semua pengajuan cuti, izin, dan keterlambatan telah diproses.</p>
          </div>
        ) : (
          filteredApprovals.map((item, idx) => {
            const emp = employees.find(e => e.id === item.employeeId);
            const isPending = item.status === 'PENDING';

            return (
              <div
                key={item.id}
                style={{ animationDelay: `${(idx + 1) * 60}ms` }}
                className="glass-card rounded-3xl p-5 sm:p-6 transition-all hover:shadow-lg border border-white/90 space-y-4 motion-fade-in-up card-interactive"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                      {emp?.avatar ? (
                        <img src={emp.avatar} alt={item.employeeName} className="w-full h-full object-cover" />
                      ) : (
                        item.employeeName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.employeeName}</span>
                        <span className="text-[11px] font-mono-code text-slate-400">({item.employeeNik})</span>
                      </div>
                      <p className="text-xs text-slate-500">{item.department} • {emp?.position}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase font-mono-code ${
                      item.type === 'DINAS_LUAR'
                        ? 'bg-amber-100 text-amber-800'
                        : item.type === 'LATE_JUSTIFICATION'
                        ? 'bg-rose-100 text-rose-800'
                        : item.type === 'LEAVE'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.type.replace('_', ' ')}
                    </span>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      item.status === 'PENDING'
                        ? 'bg-orange-100 text-orange-800 animate-pulse'
                        : item.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-8 space-y-2">
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[11px] pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mulai: <b className="text-slate-800">{item.startDate}</b></span>
                      </span>
                      {item.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Sampai: <b className="text-slate-800">{item.endDate}</b> ({item.daysCount} hari)</span>
                        </span>
                      )}
                      {item.lateMinutes && (
                        <span className="flex items-center gap-1 text-rose-600 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Keterlambatan: {item.lateMinutes} Menit</span>
                        </span>
                      )}
                      {item.leaveType && (
                        <span className="font-mono-code font-bold text-slate-700">
                          Tipe Cuti: {item.leaveType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quota & Review History */}
                  <div className="md:col-span-4 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Status Saldo Cuti</p>
                      {emp ? (
                        <div className="mt-1 flex items-center justify-between text-xs">
                          <span className="text-slate-600">Jatah Tahunan:</span>
                          <span className="font-bold text-slate-900">{emp.leaveQuota} Hari</span>
                        </div>
                      ) : null}
                      {emp ? (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Sisa Kuota:</span>
                          <span className="font-black text-emerald-600">{emp.leaveQuota - emp.usedLeave} Hari</span>
                        </div>
                      ) : null}
                    </div>

                    {item.reviewedBy && (
                      <div className="pt-2 border-t border-slate-200/70 text-[11px]">
                        <p className="text-slate-500">Direview oleh: <b className="text-slate-800">{item.reviewedBy}</b></p>
                        {item.reviewNote && (
                          <p className="text-slate-600 italic mt-0.5">"{item.reviewNote}"</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar for Approver */}
                {isPending && isApprover && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 flex-wrap">
                    <button
                      onClick={() => handleActionClick(item, 'REVISE')}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Minta Revisi
                    </button>
                    <button
                      onClick={() => handleActionClick(item, 'REJECT')}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                    <button
                      onClick={() => handleActionClick(item, 'APPROVE')}
                      className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Setujui (Approve)</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review Action Confirmation Modal */}
      {reviewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 modal-dialog-animate">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Konfirmasi {reviewModalItem.action === 'APPROVE' ? 'Persetujuan' : reviewModalItem.action === 'REJECT' ? 'Penolakan' : 'Permintaan Revisi'}
              </h3>
              <button
                onClick={() => setReviewModalItem(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin memproses pengajuan <b>{reviewModalItem.item.title}</b> dari <b>{reviewModalItem.item.employeeName}</b>?
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Catatan Reviewer / Alasan (Opsional)</label>
              <textarea
                rows={3}
                value={reviewerNote}
                onChange={e => setReviewerNote(e.target.value)}
                placeholder="Tuliskan alasan persetujuan, penolakan, atau poin yang perlu direvisi..."
                className="w-full glass-input rounded-2xl p-3 text-xs text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReviewModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmAction}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                  reviewModalItem.action === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : reviewModalItem.action === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Konfirmasi Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Submission Modal for New Leave / Permit */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 modal-dialog-animate">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Formulir Permohonan Cuti / Izin</h3>
                <p className="text-xs text-slate-500">Pemohon: {currentUser.name} ({currentUser.nik})</p>
              </div>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Kategori Permohonan</label>
                  <select
                    value={newRequestType}
                    onChange={e => setNewRequestType(e.target.value as 'LEAVE' | 'PERMIT')}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="LEAVE">Cuti Kerja</option>
                    <option value="PERMIT">Izin Resmi / Sakit</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Jenis Cuti / Izin</label>
                  <select
                    value={newLeaveType}
                    onChange={e => setNewLeaveType(e.target.value as LeaveType)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="CUTI_TAHUNAN">Cuti Tahunan (Potong Jatah)</option>
                    <option value="CUTI_SAKIT">Cuti Sakit</option>
                    <option value="CUTI_MELAHIRKAN">Cuti Melahirkan</option>
                    <option value="CUTI_MENIKAH">Cuti Menikah</option>
                    <option value="IZIN_KEPERLUAN_PRIBADI">Izin Pribadi</option>
                    <option value="IZIN_DUKA">Izin Duka Cita</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Judul Pengajuan</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="w-full glass-input rounded-xl px-2 py-1.5 text-xs text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Tanggal Akhir</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={e => setNewEndDate(e.target.value)}
                    className="w-full glass-input rounded-xl px-2 py-1.5 text-xs text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Jumlah Hari</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={newDaysCount}
                    onChange={e => setNewDaysCount(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-2 py-1.5 text-xs text-slate-800 font-mono-code"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Alasan & Penjelasan Detail</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full glass-input rounded-2xl p-3 text-xs text-slate-800"
                  placeholder="Jelaskan kebutuhan izin atau cuti ini..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl btn-orange text-white text-xs font-bold cursor-pointer"
                >
                  Kirim Permohonan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
