import type { Employee, Project, AttendanceRecord, ApprovalItem, SalaryRuleConfig, ReimbursementClaim } from '../types/index.ts';

export const INITIAL_SALARY_RULES: SalaryRuleConfig = {
  standardWorkDaysPerMonth: 22,
  standardHoursPerDay: 8,
  cutoffTime: "08:30",
  lateGracePeriodMinutes: 10,
  latePenaltyPerBlock: 25000, // Rp 25.000 / 15 menit jika tidak diapprove
  overtimeFormula: {
    firstHourRateMultiplier: 1.5,
    subsequentHourRateMultiplier: 2.0,
    holidayRateMultiplier: 2.5,
    hourlyRateDivisor: 173 // Depnaker RI standard
  },
  bpjsKetenagakerjaanRate: 0.03, // 3%
  bpjsKesehatanRate: 0.01, // 1%
  defaultDailyAllowance: 50000,
  remoteProjectAllowance: 1500000,
  authorizedWifiNetworks: [
    {
      ssid: "PRIME-Corporate-5G",
      bssid: "74:83:C2:AA:01:9F",
      locationName: "PRIME HRIS - Kantor Pusat & Innovation Hub",
      description: "Jaringan Resmi High-Speed 5G PRIME Enterprise"
    },
    {
      ssid: "PRIME-SiteOffice-Manyar",
      bssid: "18:E8:29:FE:44:12",
      locationName: "Site Office & Workshop Manyar",
      description: "Jaringan Lapangan Proyek Konstruksi & Fabrikasi"
    },
    {
      ssid: "PRIME-Mining-Pomalaa",
      bssid: "00:25:9C:12:88:BB",
      locationName: "Field Camp & Basecamp Mining Pomalaa",
      description: "Jaringan Khusus Service Alat Berat Tambang"
    }
  ],
  authorizedIpNetworks: [
    {
      ipOrSubnet: "103.31.205.218",
      label: "Gateway Utama PRIME (Biznet Fiber Dedicated)",
      isp: "PT Biznet Gio Nusantara",
      isRegisteredOffice: true
    },
    {
      ipOrSubnet: "103.31.205.0/24",
      label: "Subnet Enterprise Kantor Pusat & Workshop",
      isp: "PT Biznet Gio Nusantara",
      isRegisteredOffice: true
    },
    {
      ipOrSubnet: "180.252.0.0/16",
      label: "Telkom Astinet Dedicated Site Manyar",
      isp: "PT Telkom Indonesia",
      isRegisteredOffice: true
    },
    {
      ipOrSubnet: "192.168.10.0/24",
      label: "Local Intranet Subnet Workshop & Engineering",
      isp: "LAN DHCP Subnet",
      isRegisteredOffice: true
    }
  ],
  officeGeofence: {
    name: "PRIME Enterprise - Kantor Pusat & Innovation Hub",
    lat: -7.118942,
    lng: 112.584319,
    radiusMeters: 350,
    address: "Kawasan Industri Terpadu, Jl. Raya Utama Prime Blok A1-A4, Jawa Timur"
  }
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP-001",
    nik: "PRIME-2022-001",
    name: "Ir. Galih Primananda, S.T., M.T.",
    email: "galih@primeprojectx.net",
    phone: "+62 895 2425 7778",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "Director",
    systemRole: "superuser",
    department: "Engineering & Digital Transformation",
    position: "Technical Director & Platform Architect",
    employmentType: "TETAP",
    joinDate: "2017-05-01",
    assignedProjectId: "PRIME-ENG-01",
    baseSalary: 18500000,
    fixedAllowance: 4500000,
    dailyAllowance: 75000,
    leaveQuota: 12,
    usedLeave: 2,
    bankAccount: {
      bankName: "Bank Central Asia (BCA)",
      accountNumber: "8290-192-881",
      accountHolder: "Galih Primananda"
    },
    deviceMac: "E4:5F:01:88:92:AA"
  },
  {
    id: "EMP-002",
    nik: "PRIME-2023-018",
    name: "Budi Santoso, S.T.",
    email: "budi.santoso@primeprojectx.net",
    phone: "+62 812 3456 7890",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "Project_Manager",
    systemRole: "admin",
    department: "Mining & Heavy Equipment Services",
    position: "Senior Project Manager Site Pomalaa",
    employmentType: "TETAP",
    joinDate: "2021-03-15",
    assignedProjectId: "PRIME-MINING-02",
    baseSalary: 15000000,
    fixedAllowance: 3500000,
    dailyAllowance: 65000,
    leaveQuota: 12,
    usedLeave: 4,
    bankAccount: {
      bankName: "Bank Mandiri",
      accountNumber: "142-00-1982312-3",
      accountHolder: "Budi Santoso"
    },
    deviceMac: "AC:BC:32:91:02:11"
  },
  {
    id: "EMP-003",
    nik: "PRIME-2024-045",
    name: "Siti Rahmawati, S.Psi.",
    email: "siti.rahmawati@primeprojectx.net",
    phone: "+62 813 9988 1234",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    role: "HR_Manager",
    systemRole: "admin",
    department: "Human Capital & General Affairs",
    position: "HR & People Operations Manager",
    employmentType: "TETAP",
    joinDate: "2022-08-01",
    assignedProjectId: "PRIME-CIVIL-03",
    baseSalary: 12500000,
    fixedAllowance: 2500000,
    dailyAllowance: 50000,
    leaveQuota: 12,
    usedLeave: 1,
    bankAccount: {
      bankName: "Bank Negara Indonesia (BNI)",
      accountNumber: "034-889-1244",
      accountHolder: "Siti Rahmawati"
    },
    deviceMac: "78:4F:43:55:12:D1"
  },
  {
    id: "EMP-004",
    nik: "PRIME-2024-089",
    name: "Hendra Wijaya, A.Md.T.",
    email: "hendra.wijaya@primeprojectx.net",
    phone: "+62 857 1122 3344",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    role: "Employee",
    systemRole: "staff",
    department: "Mechanical & Field Service",
    position: "Senior Mechanical & Lathe Specialist",
    employmentType: "KONTRAK",
    joinDate: "2023-01-10",
    assignedProjectId: "PRIME-ENG-01",
    baseSalary: 9500000,
    fixedAllowance: 2000000,
    dailyAllowance: 50000,
    leaveQuota: 12,
    usedLeave: 3,
    bankAccount: {
      bankName: "Bank Central Asia (BCA)",
      accountNumber: "511-098-7612",
      accountHolder: "Hendra Wijaya"
    },
    deviceMac: "9C:14:63:F1:8A:2C"
  },
  {
    id: "EMP-005",
    nik: "PRIME-2025-012",
    name: "Dian Lestari, S.Kom.",
    email: "dian.lestari@primeprojectx.net",
    phone: "+62 878 5544 3322",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    role: "Employee",
    systemRole: "staff",
    department: "QA/QC & Document Control",
    position: "Project Quality & Safety Document Controller",
    employmentType: "TETAP",
    joinDate: "2023-09-01",
    assignedProjectId: "PRIME-PLANT-04",
    baseSalary: 8500000,
    fixedAllowance: 1800000,
    dailyAllowance: 50000,
    leaveQuota: 12,
    usedLeave: 0,
    bankAccount: {
      bankName: "Bank Syariah Indonesia (BSI)",
      accountNumber: "712-445-9901",
      accountHolder: "Dian Lestari"
    },
    deviceMac: "E8:65:D4:99:A1:33"
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "PRIME-ENG-01",
    code: "PRIME-ENG-01",
    name: "Konstruksi Pabrik & Instalasi Mekanikal Smelter",
    client: "PT Freeport Indonesia (Smelter Project)",
    location: "Kawasan Industri Terpadu Manyar, Gresik",
    status: "ACTIVE",
    startDate: "2026-01-10",
    targetEndDate: "2026-11-30",
    allocatedBudget: 480000000,
    actualLaborCost: 265000000,
    projectedLaborCost: 445000000,
    totalEstimatedHours: 4200,
    actualHoursSpent: 2380,
    hourlyRateMultiplier: 1.25
  },
  {
    id: "PRIME-MINING-02",
    code: "PRIME-MINING-02",
    name: "Overhaul & Maintenance Alat Berat Tambang Pomalaa",
    client: "PT Vale Indonesia Tbk (Mining Service)",
    location: "Site Pomalaa, Kolaka, Sulawesi Tenggara",
    status: "ACTIVE",
    startDate: "2026-03-01",
    targetEndDate: "2026-09-30",
    allocatedBudget: 350000000,
    actualLaborCost: 195000000,
    projectedLaborCost: 320000000,
    totalEstimatedHours: 3100,
    actualHoursSpent: 1720,
    hourlyRateMultiplier: 1.35
  },
  {
    id: "PRIME-CIVIL-03",
    code: "PRIME-CIVIL-03",
    name: "Pembangunan Pergudangan & Workshop Logistik Hub",
    client: "PT Pakarti Riken Indonesia (Expansion)",
    location: "Kawasan Workshop Utama Prime, Jawa Timur",
    status: "ACTIVE",
    startDate: "2026-05-15",
    targetEndDate: "2026-12-15",
    allocatedBudget: 410000000,
    actualLaborCost: 142000000,
    projectedLaborCost: 388000000,
    totalEstimatedHours: 3600,
    actualHoursSpent: 1250,
    hourlyRateMultiplier: 1.30
  },
  {
    id: "PRIME-PLANT-04",
    code: "PRIME-PLANT-04",
    name: "Fabrikasi Struktur Baja & Piping System Plant",
    client: "PT Petrokimia Gresik (Industrial Plant)",
    location: "Workshop Fabrikasi Pusat Prime",
    status: "ACTIVE",
    startDate: "2026-01-01",
    targetEndDate: "2026-12-31",
    allocatedBudget: 280000000,
    actualLaborCost: 160000000,
    projectedLaborCost: 275000000,
    totalEstimatedHours: 3000,
    actualHoursSpent: 1710,
    hourlyRateMultiplier: 1.00
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "ATT-20260908-01",
    employeeId: "EMP-001",
    employeeName: "Ir. Galih Primananda, S.T., M.T.",
    employeeNik: "PRIME-2022-001",
    department: "Engineering & Digital Transformation",
    date: "2026-09-08",
    checkInTime: "07:54:12",
    mode: "WFO",
    status: "ON_TIME",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    location: {
      lat: -7.119011,
      lng: 112.584402,
      accuracy: 5.8,
      address: "Workshop Utama PRIME Enterprise, Blok A1-A4",
      inGeofence: true,
      distanceMeters: 22
    },
    wifi: {
      connected: true,
      ssid: "PRIME-Corporate-5G",
      bssid: "74:83:C2:AA:01:9F",
      isAuthorized: true,
      ipAddress: "192.168.10.45"
    },
    note: "Dandori alat ukur & calibrator mesin CNC Fabrikasi Line A",
    isLate: false,
    lateMinutes: 0,
    approvalStatus: "NOT_REQUIRED"
  },
  {
    id: "ATT-20260908-02",
    employeeId: "EMP-002",
    employeeName: "Budi Santoso, S.T.",
    employeeNik: "PRIME-2023-018",
    department: "Mining & Heavy Equipment Services",
    date: "2026-09-08",
    checkInTime: "08:52:30",
    mode: "WFO",
    status: "LATE",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    location: {
      lat: -7.118890,
      lng: 112.584110,
      accuracy: 8.5,
      address: "Main Gate Pos 1, PRIME Enterprise Site",
      inGeofence: true,
      distanceMeters: 38
    },
    wifi: {
      connected: true,
      ssid: "PRIME-Corporate-5G",
      bssid: "74:83:C2:AA:01:9F",
      isAuthorized: true,
      ipAddress: "192.168.10.58"
    },
    note: "Inspeksi safety morning briefing terlambat akibat antrean gerbang barat",
    isLate: true,
    lateMinutes: 22,
    lateReason: "Kemacetan parah di jembatan akses tol Manyar dan antrean screening gate",
    approvalStatus: "PENDING"
  },
  {
    id: "ATT-20260908-03",
    employeeId: "EMP-004",
    employeeName: "Hendra Wijaya, A.Md.T.",
    employeeNik: "PRIME-2024-089",
    department: "Mechanical & Field Service",
    date: "2026-09-08",
    checkInTime: "08:15:00",
    mode: "DINAS_LUAR",
    status: "DINAS_LUAR_PENDING",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    location: {
      lat: -4.554311,
      lng: 121.604112,
      accuracy: 11.0,
      address: "Workshop Site Pomalaa, Kolaka, Sulawesi Tenggara",
      inGeofence: false,
      distanceMeters: 790000
    },
    wifi: {
      connected: false,
      ssid: "Telkomsel-Enterprise-4G",
      bssid: "00:00:00:00:00:00",
      isAuthorized: false,
      ipAddress: "10.24.88.19"
    },
    note: "Emergency overhaul excavator & alignment trunnion bearing site Pomalaa",
    isLate: false,
    lateMinutes: 0,
    dinasLuarDetails: {
      destination: "Site Pomalaa, Kolaka",
      clientName: "PT Vale Indonesia Tbk",
      projectCode: "PRIME-MINING-02",
      purpose: "Penggantian darurat sleeve bearing & balancing unit",
      isSudden: true
    },
    approvalStatus: "PENDING"
  }
];

export const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: "APP-2026-001",
    type: "LATE_JUSTIFICATION",
    employeeId: "EMP-002",
    employeeName: "Budi Santoso, S.T.",
    employeeNik: "PRIME-2023-018",
    department: "Mining & Heavy Equipment Services",
    title: "Justifikasi Keterlambatan Presensi 22 Menit",
    description: "Keterlambatan presensi pada tanggal 8 September 2026 akibat macet di akses tol dan antrean gate 1. Mohon pembebasan sanksi potongan penalti keterlambatan.",
    startDate: "2026-09-08",
    lateMinutes: 22,
    attendanceRecordId: "ATT-20260908-02",
    status: "PENDING",
    submittedAt: "2026-09-08 08:55:00"
  },
  {
    id: "APP-2026-002",
    type: "DINAS_LUAR",
    employeeId: "EMP-004",
    employeeName: "Hendra Wijaya, A.Md.T.",
    employeeNik: "PRIME-2024-089",
    department: "Mechanical & Field Service",
    title: "Persetujuan Dinas Luar Mendadak - Site Pomalaa",
    description: "Permintaan darurat penanganan getaran mesin alat berat di site Pomalaa. Berangkat pagi ini dengan jaringan seluler.",
    startDate: "2026-09-08",
    endDate: "2026-09-12",
    daysCount: 5,
    attendanceRecordId: "ATT-20260908-03",
    status: "PENDING",
    submittedAt: "2026-09-08 08:20:00"
  },
  {
    id: "APP-2026-003",
    type: "LEAVE",
    employeeId: "EMP-005",
    employeeName: "Dian Lestari, S.Kom.",
    employeeNik: "PRIME-2025-012",
    department: "QA/QC & Document Control",
    title: "Permohonan Cuti Tahunan (2 Hari Kerja)",
    description: "Pengajuan cuti tahunan untuk keperluan keluarga. Jatah cuti tersisa saat ini 12 hari.",
    startDate: "2026-09-15",
    endDate: "2026-09-16",
    daysCount: 2,
    leaveType: "CUTI_TAHUNAN",
    status: "PENDING",
    submittedAt: "2026-09-07 16:30:00"
  },
  {
    id: "APP-2026-004",
    type: "PERMIT",
    employeeId: "EMP-001",
    employeeName: "Ir. Galih Primananda, S.T., M.T.",
    employeeNik: "PRIME-2022-001",
    department: "Engineering & Digital Transformation",
    title: "Izin Sakit dengan Surat Keterangan Dokter",
    description: "Izin istirahat medis karena flu, surat dokter terlampir.",
    startDate: "2026-08-20",
    endDate: "2026-08-21",
    daysCount: 2,
    proofAttachment: "surat_dokter_galih_aug2026.pdf",
    status: "APPROVED",
    submittedAt: "2026-08-20 07:30:00",
    reviewedBy: "Siti Rahmawati, S.Psi. (HR)",
    reviewedAt: "2026-08-20 09:15:00",
    reviewNote: "Disetujui. Semoga lekas pulih."
  },
  {
    id: "APP-2026-005",
    type: "LATE_JUSTIFICATION",
    employeeId: "EMP-001",
    employeeName: "Ir. Galih Primananda, S.T., M.T.",
    employeeNik: "PRIME-2022-001",
    department: "Engineering & Digital Transformation",
    title: "Justifikasi Dispensasi Telat 35 Menit (Inspeksi Lapangan)",
    description: "Keterlambatan masuk akibat inspeksi rute logistik material baja menuju workshop Manyar.",
    startDate: "2026-08-14",
    lateMinutes: 35,
    status: "REJECTED",
    submittedAt: "2026-08-14 09:10:00",
    reviewedBy: "Direksi Operasional PRIME",
    reviewedAt: "2026-08-14 11:30:00",
    reviewNote: "DITOLAK: Jadwal inspeksi vendor seharusnya dijadwalkan setelah briefing pagi shift kerja dan tidak ada surat tugas tertulis pendukung."
  }
];

export const INITIAL_REIMBURSEMENTS: ReimbursementClaim[] = [
  {
    id: "REIMB-2026-001",
    employeeId: "EMP-001",
    employeeName: "Ir. Galih Primananda, S.T., M.T.",
    employeeNik: "PRIME-2022-001",
    category: "TRANSPORT_BBM",
    title: "BBM & Tol Mobil Operasional Inspeksi Smelter",
    description: "Pembelian Pertamax & e-Toll untuk monitoring instalasi mekanikal di Manyar Gresik.",
    amount: 450000,
    date: "2026-09-04",
    projectId: "PRIME-ENG-01",
    projectName: "Konstruksi Pabrik & Instalasi Mekanikal Smelter",
    status: "APPROVED",
    submittedAt: "2026-09-04 17:30:00",
    reviewedBy: "Finance Lead",
    reviewedAt: "2026-09-05 10:00:00"
  },
  {
    id: "REIMB-2026-002",
    employeeId: "EMP-001",
    employeeName: "Ir. Galih Primananda, S.T., M.T.",
    employeeNik: "PRIME-2022-001",
    category: "KONSUMSI_LEMBUR",
    title: "Klaim Konsumsi Lembur Dandori Line A Workshop",
    description: "Makan malam tim mekanik lembur kalibrasi mesin CNC bubut hingga pukul 21:30 WIB.",
    amount: 275000,
    date: "2026-09-06",
    projectId: "PRIME-ENG-01",
    projectName: "Konstruksi Pabrik & Instalasi Mekanikal Smelter",
    status: "REJECTED",
    submittedAt: "2026-09-06 22:00:00",
    reviewedBy: "Siti Rahmawati (HR) & Finance",
    reviewedAt: "2026-09-07 09:30:00",
    rejectReason: "DITOLAK: Struk kuitansi pembayaran buram, tidak ada cap stempel resto rekanan, dan melebihi pagu konsumsi harian Rp 50.000/orang."
  },
  {
    id: "REIMB-2026-003",
    employeeId: "EMP-002",
    employeeName: "Budi Santoso, S.T.",
    employeeNik: "PRIME-2023-018",
    category: "ALAT_MATERIAL",
    title: "Pembelian Darurat Selang Hidrolik Excavator Site Pomalaa",
    description: "Penggantian selang hidrolik pecah pada unit CAT 320D di area penambangan bijih nikel.",
    amount: 1250000,
    date: "2026-09-05",
    projectId: "PRIME-MINING-02",
    projectName: "Overhaul & Maintenance Alat Berat Tambang Pomalaa",
    status: "REJECTED",
    submittedAt: "2026-09-05 14:00:00",
    reviewedBy: "Finance Lead",
    reviewedAt: "2026-09-06 11:15:00",
    rejectReason: "DITOLAK: Pembelian suku cadang > Rp 1.000.000 wajib melalui sistem Purchase Request (PR) Procurement Site dan bukan melalui jalur reimbursement kas kecil."
  },
  {
    id: "REIMB-2026-004",
    employeeId: "EMP-004",
    employeeName: "Hendra Wijaya, A.Md.T.",
    employeeNik: "PRIME-2024-089",
    category: "PENGINAPAN_SITE",
    title: "Penginapan Darurat Transit Kendari - Pomalaa",
    description: "Akomodasi semalam saat perjalanan dinas mendadak overhaul bearing Pomalaa.",
    amount: 650000,
    date: "2026-09-08",
    projectId: "PRIME-MINING-02",
    projectName: "Overhaul & Maintenance Alat Berat Tambang Pomalaa",
    status: "SUBMITTED",
    submittedAt: "2026-09-08 09:00:00"
  },
  {
    id: "REIMB-2026-005",
    employeeId: "EMP-005",
    employeeName: "Dian Lestari, S.Kom.",
    employeeNik: "PRIME-2025-012",
    category: "ALAT_MATERIAL",
    title: "Pengadaan Kertas Form QC & Toner Printer Workshop",
    description: "Pengadaan kertas sertifikat uji tarik dan dokumen safety QA/QC.",
    amount: 380000,
    date: "2026-09-02",
    projectId: "PRIME-PLANT-04",
    projectName: "Fabrikasi Struktur Baja & Piping System Plant",
    status: "DISBURSED",
    submittedAt: "2026-09-02 11:00:00",
    reviewedBy: "Finance Lead",
    reviewedAt: "2026-09-03 14:00:00"
  }
];

export const INITIAL_ATTENDANCES = INITIAL_ATTENDANCE;

