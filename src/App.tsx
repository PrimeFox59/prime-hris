import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Zap } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/DashboardTab';
import { PresensiCameraTab } from './components/PresensiCameraTab';
import { ApprovalHubTab } from './components/ApprovalHubTab';
import { EmployeeManagementTab } from './components/EmployeeManagementTab';
import { SalaryRulesTab } from './components/SalaryRulesTab';
import { PayrollTab } from './components/PayrollTab';
import { CommercialProposalTab } from './components/CommercialProposalTab';
import { UserPerformanceTab } from './components/UserPerformanceTab';
import { NotificationApprovalModal } from './components/NotificationApprovalModal';
import { TourDemoModal } from './components/TourDemoModal';
import { LoginPage } from './components/LoginPage';
import { AuditLogTab } from './components/AuditLogTab';
import { ProjectManagementTab } from './components/ProjectManagementTab';

import {
  INITIAL_EMPLOYEES,
  INITIAL_PROJECTS,
  INITIAL_ATTENDANCE,
  INITIAL_APPROVALS,
  INITIAL_SALARY_RULES,
  INITIAL_REIMBURSEMENTS
} from './data/mockData';
import { Employee, AttendanceRecord, ApprovalItem, Project, SalaryRuleConfig, ReimbursementClaim, getEffectiveSystemRole, AuthUser } from './types';
import { api } from './services/api';
import { rtcService } from './services/rtcService';

export function App() {
  // Global States
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [currentUser, setCurrentUser] = useState<Employee>(INITIAL_EMPLOYEES[0]); // Galih Primananda
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const [salaryRules, setSalaryRules] = useState<SalaryRuleConfig>(INITIAL_SALARY_RULES);
  const [reimbursements, setReimbursements] = useState<ReimbursementClaim[]>(INITIAL_REIMBURSEMENTS);

  // Notification & Approval Modal Popup State
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // SQLite Database Sync State
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);
  const [dbInfo, setDbInfo] = useState<any>(null);

  // Active Tab - Default to URL query (?tab=...) or hash (#...) or 'dashboard'
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const queryTab = searchParams.get('tab');
      if (queryTab) return queryTab;
      const hash = window.location.hash.replace('#', '');
      if (hash) return hash;
    }
    return 'dashboard';
  });
  
  // Project Filter state for Payroll
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // SubView state for Unified Dashboard (hris, finance, performance)
  const [dashboardSubView, setDashboardSubView] = useState<'hris' | 'finance' | 'performance'>('hris');

  // WiFi simulation state
  const [isWifiConnected, setIsWifiConnected] = useState<boolean>(true);
  const [currentWifiSsid, setCurrentWifiSsid] = useState<string>('PRIME-Corporate-5G');

  // Real IP Network Detection & Smart Mapping state (Opsi 2: Status Kantor vs Luar Kantor)
  const [realDetectedIp, setRealDetectedIp] = useState<string>('103.31.205.218');
  const [realDetectedIsp, setRealDetectedIsp] = useState<string>('PT Biznet Gio Nusantara');
  const [realDetectedCity, setRealDetectedCity] = useState<string>('Surabaya / Head Office');
  const [simulatedNetworkMode, setSimulatedNetworkMode] = useState<'auto' | 'office' | 'remote'>('auto');
  const [customIpWhitelist, setCustomIpWhitelist] = useState<string[]>([]);

  // Calculate whether client is inside Office Network based on IP whitelist or simulation
  const isOfficeNetwork = useMemo(() => {
    if (simulatedNetworkMode === 'office') return true;
    if (simulatedNetworkMode === 'remote') return false;

    // 'auto' mode: check custom whitelist first
    if (customIpWhitelist.includes(realDetectedIp)) return true;

    // Check against authorized office IP networks
    const networks = salaryRules?.authorizedIpNetworks || [
      { ipOrSubnet: '103.31.205.218', label: 'Gateway Utama PRIME', isp: 'Biznet', isRegisteredOffice: true },
      { ipOrSubnet: '103.31.205.0/24', label: 'Subnet Enterprise PRIME', isp: 'Biznet', isRegisteredOffice: true },
      { ipOrSubnet: '180.252.0.0/16', label: 'Telkom Astinet Dedicated Site Manyar', isp: 'PT Telkom Indonesia', isRegisteredOffice: true },
      { ipOrSubnet: '192.168.10.0/24', label: 'Local Intranet Subnet Workshop & Engineering', isp: 'LAN DHCP Subnet', isRegisteredOffice: true }
    ];

    return networks.some(net => {
      if (net.ipOrSubnet === realDetectedIp) return true;
      if (net.ipOrSubnet.includes('/')) {
        const prefix = net.ipOrSubnet.split('/')[0].split('.').slice(0, 3).join('.');
        return realDetectedIp.startsWith(prefix);
      }
      return false;
    });
  }, [simulatedNetworkMode, customIpWhitelist, realDetectedIp, salaryRules?.authorizedIpNetworks]);

  const handleWhitelistCurrentIp = () => {
    if (realDetectedIp && !customIpWhitelist.includes(realDetectedIp)) {
      setCustomIpWhitelist(prev => [...prev, realDetectedIp]);
      api.logActivity({
        userName: currentUser.name,
        userNik: currentUser.nik,
        userRole: currentUser.role,
        module: 'SECURITY',
        action: 'IP_WHITELIST_ADD',
        entity: 'NetworkGateway',
        entityId: realDetectedIp,
        details: `Menambahkan IP publik ${realDetectedIp} (${realDetectedIsp || 'ISP'}) ke daftar jaringan resmi kantor`,
        status: 'SUCCESS',
        ipAddress: realDetectedIp
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const detectClientIp = async () => {
      let clientIp = '';
      
      // Step 1: Detect client IP via internal backend (as received by Cloudflare Tunnel)
      try {
        const netRes = await fetch('/api/my-network');
        if (netRes.ok) {
          const netData = await netRes.json();
          if (netData.ip && netData.ip !== '127.0.0.1' && netData.ip !== '::1') {
            clientIp = netData.ip;
            setRealDetectedIp(clientIp);
          }
        }
      } catch (e) {
        console.warn('Backend network lookup fallback', e);
      }

      // Step 2: Query ipwho.is for ISP name and geographic location
      try {
        const targetUrl = clientIp ? `https://ipwho.is/${clientIp}` : 'https://ipwho.is/';
        const res = await fetch(targetUrl);
        const data = await res.json();
        if (data && data.success) {
          setRealDetectedIp(data.ip);
          setRealDetectedIsp(data.connection?.isp || data.connection?.org || 'Provider Internet');
          setRealDetectedCity(`${data.city || 'Surabaya'}, ${data.region || 'Jawa Timur'}`);
          return;
        }
      } catch (err) {
        console.warn('IP detection primary failed, fallback', err);
      }

      // Step 3: Fallback to ipify if ipwho.is is blocked
      try {
        if (!clientIp) {
          const res2 = await fetch('https://api.ipify.org?format=json');
          const data2 = await res2.json();
          if (data2 && data2.ip) {
            setRealDetectedIp(data2.ip);
          }
        }
      } catch (err2) {
        console.warn('IP detection fallback failed', err2);
      }
    };
    detectClientIp();
  }, []);

  // Check persistent authentication session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getAuthToken();
      if (!token) {
        setIsAuthChecking(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setAuthUser(res.user);
          if (res.user.employee) {
            setCurrentUser(res.user.employee);
          }
        } else {
          api.setAuthToken(null);
          setAuthUser(null);
        }
      } catch (err) {
        api.setAuthToken(null);
        setAuthUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (user: AuthUser, token: string) => {
    setAuthUser(user);
    if (user.employee) {
      setCurrentUser(user.employee);
    }
    if (user.systemRole === 'staff') {
      setActiveTab('attendance');
    } else {
      setActiveTab('dashboard');
    }
    const displayName = user.employee?.name || user.username;
    const displayNik = user.employee?.nik || 'NIK-SYSTEM';
    api.logActivity({
      userName: displayName,
      userNik: displayNik,
      userRole: user.role,
      module: 'AUTH',
      action: 'LOGIN_WEB',
      entity: 'UserSession',
      entityId: user.id,
      details: `Pengguna ${displayName} (${user.role}) berhasil masuk ke PRIME HRIS`,
      status: 'SUCCESS',
      ipAddress: realDetectedIp,
      metadata: { systemRole: user.systemRole, username: user.username }
    }).catch(() => {});
  };

  const handleLogout = async () => {
    try {
      api.logActivity({
        userName: currentUser.name,
        userNik: currentUser.nik,
        userRole: currentUser.role,
        module: 'AUTH',
        action: 'USER_LOGOUT',
        entity: 'UserSession',
        entityId: currentUser.id,
        details: `Sesi login berakhir: ${currentUser.name} (${currentUser.nik}) keluar dari sistem`,
        status: 'SUCCESS',
        ipAddress: realDetectedIp
      }).catch(() => {});
    } catch (e) {
      // ignore
    }
    await api.logout();
    setAuthUser(null);
    setActiveTab('dashboard');
  };

  // Load initial dataset directly from SQLite Database
  useEffect(() => {
    const loadFromSqlite = async () => {
      try {
        const data = await api.getBootstrapData();
        if (data.employees && data.employees.length > 0) {
          setEmployees(data.employees);
          const currentToken = api.getAuthToken();
          if (!currentToken) {
            setCurrentUser(data.employees[0]);
          }
        }
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
        }
        if (data.attendances && data.attendances.length > 0) {
          setAttendances(data.attendances);
        }
        if (data.approvals && data.approvals.length > 0) {
          setApprovals(data.approvals);
        }
        if (data.salaryRules) {
          setSalaryRules(data.salaryRules);
        }
        if (data.reimbursements && data.reimbursements.length > 0) {
          setReimbursements(data.reimbursements);
        }
        if (data.dbInfo) {
          setDbInfo(data.dbInfo);
        }
      } catch (err) {
        console.warn('Fallback to local mock data (SQLite loading error)', err);
      } finally {
        setIsDbLoading(false);
      }
    };
    loadFromSqlite();
  }, []);

  // Floating Live Notification Toast (SSE Multi-device Sync)
  const [liveToast, setLiveToast] = useState<{ message: string; type?: 'info' | 'success' | 'warn' } | null>(null);
  const liveToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showLiveToast = (message: string, type: 'info' | 'success' | 'warn' = 'success') => {
    setLiveToast({ message, type });
    if (liveToastTimerRef.current) clearTimeout(liveToastTimerRef.current);
    liveToastTimerRef.current = setTimeout(() => setLiveToast(null), 4500);
  };

  // Real-Time Communication (SSE) multi-device live sync
  useEffect(() => {
    const unsub = rtcService.subscribe('*', (packet) => {
      console.log('[RTC Live Event Received]', packet);
      if (packet.type === 'ATTENDANCE_SAVED') {
        const newAtt: AttendanceRecord = packet.payload;
        setAttendances(prev => {
          if (prev.some(a => a.id === newAtt.id)) return prev;
          return [newAtt, ...prev];
        });
        showLiveToast(`Presensi Baru Masuk: ${newAtt.employeeName} (${newAtt.checkInTime} • ${newAtt.mode})`, 'success');
      } else if (packet.type === 'APPROVAL_UPDATED') {
        const { id, status, reviewNote, reviewedBy } = packet.payload;
        setApprovals(prev => prev.map(a => a.id === id ? { ...a, status, reviewNote, reviewedBy } : a));
        showLiveToast(`Status Pengajuan Diperbarui: ${status}`, 'info');
      } else if (packet.type === 'REIMBURSEMENT_SAVED') {
        const newClaim: ReimbursementClaim = packet.payload;
        setReimbursements(prev => {
          if (prev.some(r => r.id === newClaim.id)) return prev;
          return [newClaim, ...prev];
        });
        showLiveToast(`Klaim Biaya Baru: ${newClaim.title}`, 'info');
      } else if (packet.type === 'EMPLOYEE_SAVED') {
        const newEmp: Employee = packet.payload;
        setEmployees(prev => {
          const idx = prev.findIndex(e => e.id === newEmp.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = newEmp;
            return next;
          }
          return [newEmp, ...prev];
        });
      } else if (packet.type === 'PROJECT_SAVED') {
        const newProj: Project = packet.payload;
        setProjects(prev => {
          const idx = prev.findIndex(p => p.id === newProj.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = newProj;
            return next;
          }
          return [newProj, ...prev];
        });
        showLiveToast(`Proyek ${newProj.name || newProj.code} diperbarui`, 'info');
      } else if (packet.type === 'DATABASE_RESET') {
        api.getBootstrapData().then(data => {
          if (data.employees) setEmployees(data.employees);
          if (data.projects) setProjects(data.projects);
          if (data.attendances) setAttendances(data.attendances);
          if (data.approvals) setApprovals(data.approvals);
          if (data.reimbursements) setReimbursements(data.reimbursements);
        });
        showLiveToast(`Database di-reset ke data awal`, 'warn');
      }
    });

    return () => unsub();
  }, []);

  // Auto-launch Tour Demo immediately on page access (hands-free onboarding)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      // Bypass auto-tour if explicitly disabled via query parameter
      if (
        searchParams.get('tour') === 'false' || 
        searchParams.get('notour') === '1' || 
        searchParams.get('autotour') === '0'
      ) {
        return;
      }
    }
    // Slight 450ms delay for DOM nodes & SQLite bootstrap to cleanly mount
    const timer = setTimeout(() => {
      setIsTourOpen(true);
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  const toggleWifi = () => {
    setIsWifiConnected(prev => !prev);
  };

  const handleSwitchUser = (newEmp: Employee) => {
    const prevEmp = currentUser;
    setCurrentUser(newEmp);
    const role = getEffectiveSystemRole(newEmp);
    if (role === 'staff') {
      if (activeTab === 'salary_rules' || activeTab === 'audit') {
        setActiveTab('dashboard');
        setDashboardSubView('performance');
      } else if (activeTab === 'dashboard') {
        setDashboardSubView('performance');
      }
    }

    // Record persona switch event in audit trail
    api.logActivity({
      userName: prevEmp.name,
      userNik: prevEmp.nik,
      userRole: prevEmp.role,
      module: 'AUTH',
      action: 'ROLE_SWITCH',
      entity: 'UserSession',
      entityId: newEmp.id,
      details: `Beralih persona pengguna ke ${newEmp.name} (${newEmp.role} - ${newEmp.nik})`,
      status: 'SUCCESS',
      ipAddress: realDetectedIp,
      metadata: { previousUser: prevEmp.name, previousNik: prevEmp.nik, switchedTo: newEmp.name, newRole: newEmp.role }
    }).catch(() => {});
  };

  const handleNavigateToTab = (tabId: string, projectIdFilter?: string) => {
    // Sync URL with tabId query parameter without full reload
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabId);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {
        // ignore
      }
    }

    const role = getEffectiveSystemRole(currentUser);
    if (role === 'staff') {
      if (tabId === 'dashboard' || tabId === 'dashboard_hris' || tabId === 'dashboard_finance') {
        setActiveTab('dashboard');
        setDashboardSubView('performance');
        return;
      }
      if (tabId === 'salary_rules' || tabId === 'audit') {
        setActiveTab('dashboard');
        setDashboardSubView('performance');
        return;
      }
    }

    if (tabId === 'dashboard' || tabId === 'dashboard_hris') {
      setActiveTab('dashboard');
      setDashboardSubView('hris');
    } else if (tabId === 'dashboard_finance') {
      setActiveTab('dashboard');
      setDashboardSubView('finance');
    } else if (tabId === 'user_performance') {
      setActiveTab('dashboard');
      setDashboardSubView('performance');
    } else {
      setActiveTab(tabId);
    }
    if (projectIdFilter) {
      setSelectedProjectId(projectIdFilter);
    }
  };

  // Sync browser back/forward or hash changes
  useEffect(() => {
    const handleUrlSync = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const queryTab = searchParams.get('tab');
      if (queryTab) {
        handleNavigateToTab(queryTab);
      } else if (window.location.hash) {
        handleNavigateToTab(window.location.hash.replace('#', ''));
      }
    };
    window.addEventListener('popstate', handleUrlSync);
    window.addEventListener('hashchange', handleUrlSync);
    return () => {
      window.removeEventListener('popstate', handleUrlSync);
      window.removeEventListener('hashchange', handleUrlSync);
    };
  }, [currentUser]);

  // Submit new attendance record
  const handleAttendanceSubmit = (record: AttendanceRecord) => {
    setAttendances(prev => [record, ...prev]);

    // Save to SQLite asynchronously
    api.saveAttendance(record).catch(err => console.error('Failed to save attendance to SQLite', err));

    // If Late or Dinas Luar, automatically register into Approval queue
    if (record.isLate) {
      const lateApproval: ApprovalItem = {
        id: `APP-LATE-${Date.now()}`,
        type: 'LATE_JUSTIFICATION',
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        employeeNik: record.employeeNik,
        department: record.department,
        title: `Justifikasi Keterlambatan Presensi (${record.lateMinutes} Menit)`,
        description: record.lateReason || 'Keterlambatan masuk shift kerja.',
        startDate: record.date,
        lateMinutes: record.lateMinutes,
        attendanceRecordId: record.id,
        status: 'PENDING',
        submittedAt: `${record.date} ${record.checkInTime}`
      };
      setApprovals(prev => [lateApproval, ...prev]);
    } else if (record.mode === 'DINAS_LUAR' && record.dinasLuarDetails) {
      const dinasApproval: ApprovalItem = {
        id: `APP-DINAS-${Date.now()}`,
        type: 'DINAS_LUAR',
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        employeeNik: record.employeeNik,
        department: record.department,
        title: `Persetujuan Dinas Luar Mendadak - ${record.dinasLuarDetails.clientName}`,
        description: `Tujuan: ${record.dinasLuarDetails.destination}. Proyek: ${record.dinasLuarDetails.projectCode}. Alasan: ${record.dinasLuarDetails.purpose}`,
        startDate: record.date,
        daysCount: 1,
        attendanceRecordId: record.id,
        status: 'PENDING',
        submittedAt: `${record.date} ${record.checkInTime}`
      };
      setApprovals(prev => [dinasApproval, ...prev]);
    }
  };

  // Approval actions
  const handleApprove = (id: string, reviewerNote?: string) => {
    api.updateApproval(id, 'APPROVED', reviewerNote, `${currentUser.name} (${currentUser.role})`)
      .catch(err => console.error('Failed to update approval in SQLite', err));

    setApprovals(prev =>
      prev.map(item => {
        if (item.id === id) {
          // If this is a leave request, deduct from employee quota!
          if (item.type === 'LEAVE' && item.daysCount) {
            setEmployees(empList =>
              empList.map(e => {
                if (e.id === item.employeeId) {
                  return { ...e, usedLeave: e.usedLeave + (item.daysCount || 1) };
                }
                return e;
              })
            );
          }

          // If this is a late justification, mark the corresponding attendance as approved
          if (item.attendanceRecordId) {
            setAttendances(attList =>
              attList.map(a => {
                if (a.id === item.attendanceRecordId) {
                  return { ...a, approvalStatus: 'APPROVED' };
                }
                return a;
              })
            );
          }

          return {
            ...item,
            status: 'APPROVED',
            reviewedBy: `${currentUser.name} (${currentUser.role})`,
            reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            reviewNote: reviewerNote || 'Disetujui.'
          };
        }
        return item;
      })
    );
  };

  const handleReject = (id: string, reviewerNote?: string) => {
    api.updateApproval(id, 'REJECTED', reviewerNote, `${currentUser.name} (${currentUser.role})`)
      .catch(err => console.error('Failed to update approval in SQLite', err));

    setApprovals(prev =>
      prev.map(item => {
        if (item.id === id) {
          if (item.attendanceRecordId) {
            setAttendances(attList =>
              attList.map(a => {
                if (a.id === item.attendanceRecordId) {
                  return { ...a, approvalStatus: 'REJECTED' };
                }
                return a;
              })
            );
          }
          return {
            ...item,
            status: 'REJECTED',
            reviewedBy: `${currentUser.name} (${currentUser.role})`,
            reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            reviewNote: reviewerNote || 'Ditolak.'
          };
        }
        return item;
      })
    );
  };

  const handleRequestRevision = (id: string, reviewerNote?: string) => {
    setApprovals(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: 'REVISION_REQUESTED',
            reviewedBy: `${currentUser.name} (${currentUser.role})`,
            reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            reviewNote: reviewerNote || 'Mohon melengkapi berkas pendukung.'
          };
        }
        return item;
      })
    );
  };

  const handleSubmitNewLeaveRequest = (item: ApprovalItem) => {
    setApprovals(prev => [item, ...prev]);
  };

  // Employee CRUD (User Management)
  const handleAddEmployee = (emp: Employee) => {
    setEmployees(prev => [...prev, emp]);
    api.saveEmployee(emp).catch(err => console.error('Failed to save employee to SQLite', err));
  };

  const handleUpdateEmployee = (emp: Employee) => {
    setEmployees(prev => prev.map(e => (e.id === emp.id ? emp : e)));
    if (currentUser.id === emp.id) {
      setCurrentUser(emp);
    }
    if (authUser && authUser.employee && authUser.employee.id === emp.id) {
      setAuthUser(prev => prev ? { ...prev, employee: emp } : null);
    }
    api.saveEmployee(emp).catch(err => console.error('Failed to update employee in SQLite', err));
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const handleAddReimbursement = (claim: ReimbursementClaim) => {
    setReimbursements(prev => [claim, ...prev]);
    api.saveReimbursement(claim).catch(err => console.error('Failed to save reimbursement in SQLite', err));
  };

  const handleUpdateSalaryRules = (newRules: SalaryRuleConfig) => {
    setSalaryRules(newRules);
    api.saveSalaryRules(newRules).catch(err => console.error('Failed to update salary rules in SQLite', err));
  };

  // Project CRUD & Personnel Placement
  const handleSaveProject = (proj: Project, updatedEmployees?: Employee[]) => {
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === proj.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = proj;
        return next;
      }
      return [proj, ...prev];
    });

    api.saveProject(proj).catch(err => console.error('Failed to save project to SQLite', err));

    if (updatedEmployees && updatedEmployees.length > 0) {
      setEmployees(prev => {
        const map = new Map(prev.map(e => [e.id, e]));
        updatedEmployees.forEach(e => {
          map.set(e.id, e);
          api.saveEmployee(e).catch(err => console.error('Failed to save reassigned employee to SQLite', err));
        });
        return Array.from(map.values());
      });
    }
  };

  const pendingApprovalsCount = approvals.filter(a => a.status === 'PENDING').length;

  const userSystemRole = getEffectiveSystemRole(currentUser);
  const effectiveNotificationCount = userSystemRole === 'staff'
    ? approvals.filter(a => a.employeeId === currentUser.id && (a.status === 'PENDING' || a.status === 'REVISION_REQUESTED' || a.status === 'REJECTED')).length +
      reimbursements.filter(r => r.employeeId === currentUser.id && r.status === 'REJECTED').length
    : pendingApprovalsCount;

  // Session verification screen
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-3xl shadow-xl shadow-blue-500/30 mb-4 animate-pulse">
          P
        </div>
        <div className="w-6 h-6 border-2 border-blue-400 border-t-white rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-mono text-slate-400">Memverifikasi Sesi Prime HRIS...</p>
      </div>
    );
  }

  // Not authenticated: render Login Page
  if (!authUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-orange-500 selection:text-white">
      
      {/* Top Glass Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        allUsers={employees}
        onSwitchUser={handleSwitchUser}
        onUpdateEmployee={handleUpdateEmployee}
        isWifiConnected={isWifiConnected}
        onToggleWifi={toggleWifi}
        currentWifiSsid={currentWifiSsid}
        pendingApprovalsCount={effectiveNotificationCount}
        onNavigateToTab={handleNavigateToTab}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onStartTour={() => setIsTourOpen(true)}
        realDetectedIp={realDetectedIp}
        realDetectedIsp={realDetectedIsp}
        realDetectedCity={realDetectedCity}
        isOfficeNetwork={isOfficeNetwork}
        simulatedNetworkMode={simulatedNetworkMode}
        onSetSimulatedNetworkMode={setSimulatedNetworkMode}
        onWhitelistCurrentIp={handleWhitelistCurrentIp}
        authUser={authUser}
        onLogout={handleLogout}
      />

      {/* Floating Pill Sidebar Dock (Desktop) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleNavigateToTab}
        userRole={currentUser.role}
        systemRole={userSystemRole}
        pendingApprovalsCount={effectiveNotificationCount}
      />

      {/* Mobile Navigation Tabs (Screens < 768px) */}
      <div className="md:hidden sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-3 py-2 flex items-center gap-2 overflow-x-auto no-print">
        {(getEffectiveSystemRole(currentUser) === 'staff'
          ? [
              { id: 'dashboard', label: 'Kinerja Saya' },
              { id: 'attendance', label: 'Presensi Kamera' },
              { id: 'approvals', label: 'Pengajuan' },
              { id: 'projects', label: 'Proyek & Site' },
              { id: 'payroll', label: 'Slip Gaji' },
              { id: 'users', label: 'Profil Saya' }
            ]
          : [
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'attendance', label: 'Presensi' },
              { id: 'approvals', label: 'Approval SDM' },
              { id: 'projects', label: 'Proyek & Site' },
              { id: 'users', label: 'Karyawan' },
              { id: 'payroll', label: 'Payroll' },
              { id: 'salary_rules', label: 'Pengaturan' },
              { id: 'audit', label: 'Audit Log' }
            ]
        ).map(tab => {
          const isTabActive = activeTab === tab.id || (tab.id === 'dashboard' && (activeTab === 'dashboard_hris' || activeTab === 'dashboard_finance' || activeTab === 'user_performance'));
          return (
            <button
              key={tab.id}
              onClick={() => handleNavigateToTab(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                isTabActive
                  ? 'bg-[#FF6B00] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area with Dynamic Key for Tab Transition Animation */}
      <main key={activeTab} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:pl-24 transition-all motion-fade-in-up">
        {(activeTab === 'dashboard' || activeTab === 'dashboard_hris' || activeTab === 'dashboard_finance' || activeTab === 'user_performance') && (
          <DashboardTab
            currentUser={currentUser}
            employees={employees}
            projects={projects}
            attendances={attendances}
            approvals={approvals}
            salaryRules={salaryRules}
            reimbursements={reimbursements}
            onAddReimbursement={handleAddReimbursement}
            onSubmitNewLeaveRequest={handleSubmitNewLeaveRequest}
            onNavigateToTab={handleNavigateToTab}
            currentWifiSsid={currentWifiSsid}
            initialSubView={dashboardSubView}
          />
        )}

        {activeTab === 'attendance' && (
          <PresensiCameraTab
            currentUser={currentUser}
            salaryRules={salaryRules}
            isWifiConnected={isWifiConnected}
            currentWifiSsid={currentWifiSsid}
            onToggleWifi={toggleWifi}
            attendanceHistory={attendances}
            onSubmitAttendance={handleAttendanceSubmit}
            onNavigateToTab={handleNavigateToTab}
            realDetectedIp={realDetectedIp}
            realDetectedIsp={realDetectedIsp}
            realDetectedCity={realDetectedCity}
            onUpdateRealIp={setRealDetectedIp}
            onUpdateSalaryRules={handleUpdateSalaryRules}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalHubTab
            approvals={approvals}
            employees={employees}
            currentUser={currentUser}
            onApprove={handleApprove}
            onReject={handleReject}
            onRequestRevision={handleRequestRevision}
            onSubmitNewLeaveRequest={handleSubmitNewLeaveRequest}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectManagementTab
            currentUser={currentUser}
            employees={employees}
            projects={projects}
            salaryRules={salaryRules}
            onSaveProject={handleSaveProject}
            onUpdateEmployee={handleUpdateEmployee}
            onNavigateToTab={handleNavigateToTab}
          />
        )}

        {activeTab === 'users' && (
          <EmployeeManagementTab
            currentUser={currentUser}
            employees={employees}
            projects={projects}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {activeTab === 'payroll' && (
          <PayrollTab
            currentUser={currentUser}
            employees={employees}
            projects={projects}
            attendances={attendances}
            salaryRules={salaryRules}
            selectedProjectId={selectedProjectId}
            onSelectProjectId={setSelectedProjectId}
          />
        )}

        {activeTab === 'salary_rules' && (
          <SalaryRulesTab
            currentUser={currentUser}
            salaryRules={salaryRules}
            onUpdateSalaryRules={handleUpdateSalaryRules}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogTab
            currentUser={currentUser}
            realDetectedIp={realDetectedIp}
            onNavigateToTab={handleNavigateToTab}
          />
        )}

        {activeTab === 'proposal' && (
          <CommercialProposalTab />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 bg-white/40 text-center text-xs text-slate-500 font-mono-code no-print">
        <p>
          PRIME HRIS Enterprise • Production-Grade Human Resource Information System
        </p>
        <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-3">
          <span>Developed by PT Prime Infinity Systems (Prime ProjectX)</span>
          <span>•</span>
          <button
            onClick={() => handleNavigateToTab('proposal')}
            className="text-[#FF6B00] hover:underline cursor-pointer"
          >
            Spesifikasi & Proposal Sistem
          </button>
        </p>
      </footer>

      {/* Pop-up Window: Pusat Notifikasi & Approval Terpadu */}

      {/* Interactive Typewriter Tour Demo Modal */}
      <TourDemoModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateToTab={handleNavigateToTab}
        onSetDashboardSubView={setDashboardSubView}
        activeTab={activeTab}
      />

      <NotificationApprovalModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        approvals={approvals}
        reimbursements={reimbursements}
        employees={employees}
        currentUser={currentUser}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestRevision={handleRequestRevision}
        onSubmitNewLeaveRequest={handleSubmitNewLeaveRequest}
        onNavigateToTab={handleNavigateToTab}
      />

      {/* Floating Real-Time Sync Notification Toast */}
      {liveToast && (
        <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm font-sans no-print">
          <div className={`p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
            liveToast.type === 'warn' 
              ? 'bg-amber-950/95 text-amber-100 border-amber-500/60'
              : liveToast.type === 'info'
              ? 'bg-slate-900/95 text-slate-100 border-sky-500/50'
              : 'bg-slate-950/95 text-emerald-100 border-emerald-500/60'
          }`}>
            <span className="p-2 rounded-xl bg-white/10 text-emerald-400 shrink-0">
              <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            </span>
            <div className="flex-1 text-xs">
              <div className="font-mono-code font-black text-[9.5px] text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>RTC LIVE SYNC</span>
              </div>
              <div className="font-semibold text-white leading-tight">{liveToast.message}</div>
            </div>
            <button 
              onClick={() => setLiveToast(null)} 
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
