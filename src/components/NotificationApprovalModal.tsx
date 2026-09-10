import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Calendar,
  FileText,
  Filter,
  Plus,
  Search,
  Sparkles,
  Send,
  X,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  MessageSquare,
  Shield,
  Banknote,
  Check,
  ChevronRight,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Employee, ApprovalItem, LeaveType, SystemRole, ReimbursementClaim, getEffectiveSystemRole } from '../types';

interface NotificationApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvals: ApprovalItem[];
  reimbursements?: ReimbursementClaim[];
  employees: Employee[];
  currentUser: Employee;
  onApprove: (id: string, reviewerNote?: string) => void;
  onReject: (id: string, reviewerNote?: string) => void;
  onRequestRevision: (id: string, reviewerNote?: string) => void;
  onSubmitNewLeaveRequest: (item: ApprovalItem) => void;
  onNavigateToTab?: (tabId: string) => void;
}

export const NotificationApprovalModal: React.FC<NotificationApprovalModalProps> = ({
  isOpen,
  onClose,
  approvals,
  reimbursements = [],
  employees,
  currentUser,
  onApprove,
  onReject,
  onRequestRevision,
  onSubmitNewLeaveRequest,
  onNavigateToTab
}) => {
  const currentRole: SystemRole = getEffectiveSystemRole(currentUser);
  const isStaff = currentRole === 'staff';
  const isApprover = currentRole === 'superuser' || currentRole === 'admin';

  // Modal active tab: 'reviews' | 'notifications' | 'new_request'
  const [activeTab, setActiveTab] = useState<'reviews' | 'notifications' | 'new_request'>('reviews');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Review confirmation / note state
  const [activeReviewAction, setActiveReviewAction] = useState<{
    item: ApprovalItem;
    action: 'APPROVE' | 'REJECT' | 'REVISE';
  } | null>(null);
  const [reviewerNote, setReviewerNote] = useState('');

  // Submit Leave Request State
  const [newRequestType, setNewRequestType] = useState<'LEAVE' | 'PERMIT'>('LEAVE');
  const [newLeaveType, setNewLeaveType] = useState<LeaveType>('CUTI_TAHUNAN');
  const [newStartDate, setNewStartDate] = useState('2026-09-18');
  const [newEndDate, setNewEndDate] = useState('2026-09-19');
  const [newDaysCount, setNewDaysCount] = useState(2);
  const [newTitle, setNewTitle] = useState('Permohonan Cuti Tahunan');
  const [newDescription, setNewDescription] = useState('Keperluan keluarga di luar kota.');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filtered approvals
  const relevantApprovals = isStaff
    ? approvals.filter(a => a.employeeId === currentUser.id)
    : approvals;

  const pendingApprovals = relevantApprovals.filter(a => a.status === 'PENDING');
  const historyApprovals = relevantApprovals.filter(a => a.status !== 'PENDING');

  const pendingCount = pendingApprovals.length;

  // Handle Review Execution
  const executeReviewAction = () => {
    if (!activeReviewAction) return;
    const { item, action } = activeReviewAction;

    if (action === 'APPROVE') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      onApprove(item.id, reviewerNote || 'Disetujui.');
    } else if (action === 'REJECT') {
      onReject(item.id, reviewerNote || 'Ditolak.');
    } else {
      onRequestRevision(item.id, reviewerNote || 'Mohon revisi data pendukung.');
    }

    setActiveReviewAction(null);
    setReviewerNote('');
  };

  // Handle New Request Submit
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
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 }
    });

    setActiveTab('reviews');
    // Reset form
    setNewTitle('Permohonan Cuti Tahunan');
    setNewDescription('');
  };

  // Notification Feed Generator based on system events
  const generateNotifications = () => {
    const list: Array<{
      id: string;
      title: string;
      desc: string;
      time: string;
      type: 'success' | 'warning' | 'info' | 'error';
      icon: any;
      unread: boolean;
    }> = [];

    // Notifications from approvals
    relevantApprovals.forEach(app => {
      if (app.status === 'APPROVED') {
        list.push({
          id: `notif-app-${app.id}`,
          title: `Pengajuan Disetujui: ${app.title}`,
          desc: `${app.employeeName} • Ditinjau oleh ${app.reviewedBy || 'Manajemen'} pada ${app.reviewedAt || 'hari ini'}. ${app.reviewNote ? `Catatan: "${app.reviewNote}"` : ''}`,
          time: app.reviewedAt || app.submittedAt,
          type: 'success',
          icon: CheckCircle2,
          unread: false
        });
      } else if (app.status === 'REJECTED') {
        list.push({
          id: `notif-rej-${app.id}`,
          title: `Pengajuan Ditolak: ${app.title}`,
          desc: `${app.employeeName} • Alasan: "${app.reviewNote || 'Ditolak oleh manajemen.'}"`,
          time: app.reviewedAt || app.submittedAt,
          type: 'error',
          icon: XCircle,
          unread: true
        });
      } else if (app.status === 'REVISION_REQUESTED') {
        list.push({
          id: `notif-rev-${app.id}`,
          title: `Perlu Revisi: ${app.title}`,
          desc: `Catatan Reviewer: "${app.reviewNote || 'Mohon melengkapi lampiran berkas.'}"`,
          time: app.reviewedAt || app.submittedAt,
          type: 'warning',
          icon: AlertTriangle,
          unread: true
        });
      } else if (app.status === 'PENDING' && isApprover) {
        list.push({
          id: `notif-pend-${app.id}`,
          title: `Tiket Baru Butuh Review: ${app.title}`,
          desc: `${app.employeeName} (${app.department}) mengajukan permohonan baru dan menunggu persetujuan Anda.`,
          time: app.submittedAt,
          type: 'info',
          icon: Clock,
          unread: true
        });
      }
    });

    // Notifications from reimbursements
    const relevantReimbursements = isStaff
      ? reimbursements.filter(r => r.employeeId === currentUser.id)
      : reimbursements;

    relevantReimbursements.forEach(reimb => {
      if (reimb.status === 'REJECTED') {
        list.push({
          id: `notif-reimb-rej-${reimb.id}`,
          title: `Klaim Reimburse Ditolak: ${reimb.title}`,
          desc: `${reimb.employeeName} • Alasan: "${reimb.rejectReason || 'Berkas kuitansi tidak memenuhi standar audit akuntansi DMJ.'}" • Nilai: Rp ${reimb.amount.toLocaleString('id-ID')}`,
          time: reimb.reviewedAt || reimb.submittedAt,
          type: 'error',
          icon: XCircle,
          unread: true
        });
      } else if (reimb.status === 'APPROVED' || reimb.status === 'DISBURSED') {
        list.push({
          id: `notif-reimb-app-${reimb.id}`,
          title: `Klaim Reimburse Disetujui: ${reimb.title}`,
          desc: `${reimb.employeeName} • Telah diverifikasi oleh ${reimb.reviewedBy || 'Finance Lead'} dan siap dicairkan (Nilai: Rp ${reimb.amount.toLocaleString('id-ID')}).`,
          time: reimb.reviewedAt || reimb.submittedAt,
          type: 'success',
          icon: CheckCircle2,
          unread: false
        });
      }
    });

    // General Corporate Notifications
    list.push({
      id: 'notif-payroll-sep',
      title: 'Slip Gaji Periode September 2026 Siap Diterbitkan',
      desc: 'Perhitungan lembur Depnaker 173 jam & tunjangan site Manyar telah disinkronisasikan.',
      time: 'Hari ini, 07:00 WIB',
      type: 'info',
      icon: Banknote,
      unread: false
    });

    list.push({
      id: 'notif-sys-policy',
      title: 'Sistem Kebijakan Absensi & Shift On-Site PT DMJ',
      desc: 'Batas masuk shift normal pukul 08:00 WIB dengan toleransi keterlambatan 15 menit.',
      time: 'Kemarin, 16:30 WIB',
      type: 'info',
      icon: Shield,
      unread: false
    });

    return list;
  };

  const notificationFeed = generateNotifications();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Dialog Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-orange-50/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00] shadow-xs">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono-code">
                  Pusat Notifikasi & Approval
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono-code bg-orange-100 text-[#FF6B00]">
                  PT DMJ
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isApprover
                  ? 'Review pengajuan cuti, izin sakit, justifikasi telat & linimasa aktivitas tim'
                  : 'Status pengajuan pribadi, persetujuan cuti & notifikasi aktivitas kerja Anda'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs Switcher */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-slate-50/70 border-b border-slate-200/70 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setActiveTab('reviews'); setActiveReviewAction(null); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-[#FF6B00] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isApprover ? 'Butuh Review' : 'Pengajuan Saya'}</span>
              {pendingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'reviews' ? 'bg-white text-[#FF6B00]' : 'bg-[#FF6B00] text-white'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('notifications'); setActiveReviewAction(null); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#FF6B00] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Aktivitas & Notifikasi</span>
            </button>

            <button
              onClick={() => { setActiveTab('new_request'); setActiveReviewAction(null); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'new_request'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Ajukan Cuti / Izin</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono-code text-slate-500">
            <span>Role:</span>
            <span className="font-bold text-slate-800 uppercase">{currentRole}</span>
          </div>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* TAB 1: BUTUH REVIEW (APPROVAL & STATUS TIKET) */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              
              {/* Filter Pills for Review items */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
                <div className="flex items-center gap-1.5">
                  {['ALL', 'LEAVE', 'LATE_JUSTIFICATION', 'DINAS_LUAR'].map(ft => (
                    <button
                      key={ft}
                      onClick={() => setFilterType(ft)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        filterType === ft
                          ? 'bg-slate-900 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {ft === 'ALL' ? 'Semua Tipe' : ft === 'LEAVE' ? 'Cuti & Izin' : ft === 'LATE_JUSTIFICATION' ? 'Keterlambatan' : 'Dinas Luar'}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-slate-500 font-mono-code">
                  {pendingCount} Tiket Menunggu Tindakan
                </span>
              </div>

              {/* Action Form Confirmation Popup (Inline within modal) */}
              {activeReviewAction && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-amber-900 font-mono-code uppercase">
                        Konfirmasi: {activeReviewAction.action === 'APPROVE' ? 'Setujui Permohonan' : activeReviewAction.action === 'REJECT' ? 'Tolak Permohonan' : 'Minta Revisi Berkas'}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveReviewAction(null)}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-700">
                    Pemohon: <strong>{activeReviewAction.item.employeeName}</strong> — <em>"{activeReviewAction.item.title}"</em>
                  </p>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Catatan Reviewer / Alasan (Opsional):
                    </label>
                    <input
                      type="text"
                      value={reviewerNote}
                      onChange={e => setReviewerNote(e.target.value)}
                      placeholder={
                        activeReviewAction.action === 'APPROVE'
                          ? 'Contoh: Disetujui, pekerjaan telah didelegasikan.'
                          : activeReviewAction.action === 'REJECT'
                          ? 'Contoh: Kuota cuti tidak mencukupi / jadwal proyek mendesak.'
                          : 'Contoh: Mohon lampirkan surat dokter / bukti dinas.'
                      }
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-300 focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveReviewAction(null)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={executeReviewAction}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer ${
                        activeReviewAction.action === 'APPROVE'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : activeReviewAction.action === 'REJECT'
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      Eksekusi Keputusan
                    </button>
                  </div>
                </div>
              )}

              {/* Pending Approvals List */}
              {pendingApprovals.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono-code">
                    Semua Pengajuan Telah Selesai!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {isApprover
                      ? 'Tidak ada tiket persetujuan yang menunggu tindakan Anda saat ini.'
                      : 'Semua pengajuan cuti dan permohonan Anda telah diproses oleh manajemen.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals
                    .filter(item => filterType === 'ALL' || item.type === filterType)
                    .map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 transition-all shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                              {item.employeeName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 font-mono-code">
                                  {item.employeeName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono-code">
                                  • {item.employeeNik}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">{item.department}</p>
                            </div>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                            {item.type === 'LEAVE' ? 'Cuti / Izin' : item.type === 'LATE_JUSTIFICATION' ? 'Keterlambatan' : 'Dinas Luar'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono-code pt-1 border-t border-slate-100">
                          <span>Periode: <strong>{item.startDate} {item.endDate ? `s/d ${item.endDate}` : ''}</strong></span>
                          <span>Diajukan: {item.submittedAt}</span>
                        </div>

                        {/* Approver Action Buttons */}
                        {isApprover && (
                          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReviewAction({ item, action: 'REVISE' });
                                setReviewerNote('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Minta Revisi</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveReviewAction({ item, action: 'REJECT' });
                                setReviewerNote('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveReviewAction({ item, action: 'APPROVE' });
                                setReviewerNote('');
                              }}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* History / Processed Approvals */}
              {historyApprovals.length > 0 && (
                <div className="pt-3 border-t border-slate-200/70">
                  <h4 className="text-xs font-bold text-slate-700 font-mono-code uppercase mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Riwayat Tiket yang Telah Diproses ({historyApprovals.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {historyApprovals.slice(0, 5).map(h => (
                      <div key={h.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-800">{h.title} — <span className="text-slate-500 font-normal">{h.employeeName}</span></p>
                          <p className="text-[11px] text-slate-400 font-mono-code">{h.reviewedAt || h.submittedAt} {h.reviewedBy ? `• Oleh ${h.reviewedBy}` : ''}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono-code uppercase shrink-0 ${
                          h.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : h.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {h.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: AKTIVITAS & NOTIFIKASI REALTIME */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-700 font-mono-code uppercase">
                  Linimasa Aktivitas & Info Kerja
                </span>
                <span className="text-[11px] text-slate-500 font-mono-code">
                  {notificationFeed.length} Pembaruan
                </span>
              </div>

              <div className="space-y-2.5">
                {notificationFeed.map(nt => {
                  const Icon = nt.icon;
                  return (
                    <div
                      key={nt.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                        nt.unread
                          ? 'bg-orange-50/40 border-orange-200 shadow-2xs'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${
                        nt.type === 'success'
                          ? 'bg-emerald-100 text-emerald-700'
                          : nt.type === 'error'
                          ? 'bg-rose-100 text-rose-700'
                          : nt.type === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {nt.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono-code whitespace-nowrap shrink-0">
                            {nt.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {nt.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FORM AJUKAN CUTI / IZIN CEPAT */}
          {activeTab === 'new_request' && (
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Pengajuan yang dibuat akan langsung masuk ke antrean persetujuan HRD dan Direksi PT Dwi Martha Jaya.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Jenis Pengajuan</label>
                  <select
                    value={newRequestType}
                    onChange={e => {
                      const val = e.target.value as any;
                      setNewRequestType(val);
                      if (val === 'LEAVE') setNewTitle('Permohonan Cuti Tahunan');
                      else setNewTitle('Permohonan Izin / Sakit');
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-semibold"
                  >
                    <option value="LEAVE">Cuti Karyawan</option>
                    <option value="PERMIT">Izin Tidak Masuk / Sakit</option>
                  </select>
                </div>

                {newRequestType === 'LEAVE' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Kategori Cuti</label>
                    <select
                      value={newLeaveType}
                      onChange={e => setNewLeaveType(e.target.value as LeaveType)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-semibold"
                    >
                      <option value="CUTI_TAHUNAN">Cuti Tahunan (Potong Jatah)</option>
                      <option value="CUTI_BESAR">Cuti Besar</option>
                      <option value="CUTI_MELAHIRKAN">Cuti Melahirkan</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono-code font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={e => setNewEndDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono-code font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Total Hari</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newDaysCount}
                    onChange={e => setNewDaysCount(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono-code font-bold"
                    required
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Judul Ringkas</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="text-xs">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Alasan / Keterangan Lengkap</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300"
                  placeholder="Jelaskan kebutuhan pengajuan atau pendelegasian tugas selama berhalangan hadir..."
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-orange text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirimkan Permohonan</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono-code shrink-0">
          <span>PT Dwi Martha Jaya • Workflow Engine</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
          >
            Tutup Jendela (Esc)
          </button>
        </div>

      </div>
    </div>
  );
};
