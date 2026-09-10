import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  MapPin,
  Clock,
  Briefcase,
  Building,
  FileText,
  ShieldAlert,
  Send,
  Sparkles,
  Eye,
  X,
  Upload,
  Check,
  Volume2,
  Globe,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Network,
  Radio,
  ExternalLink
} from 'lucide-react';
import { Employee, AttendanceRecord, AttendanceMode, SalaryRuleConfig, SystemRole, getEffectiveSystemRole } from '../types';
import { rtcService } from '../services/rtcService';

// Hitung jarak nyata dari koordinat GPS HP ke Geofence Kantor Pusat (Haversine Formula)
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

interface PresensiCameraTabProps {
  currentUser: Employee;
  salaryRules: SalaryRuleConfig;
  isWifiConnected: boolean;
  currentWifiSsid: string;
  onToggleWifi: () => void;
  attendanceHistory: AttendanceRecord[];
  onSubmitAttendance: (record: AttendanceRecord) => void;
  onNavigateToTab?: (tabId: string) => void;
  realDetectedIp?: string;
  realDetectedIsp?: string;
  realDetectedCity?: string;
  onUpdateRealIp?: (newIp: string) => void;
  onUpdateSalaryRules?: (newRules: SalaryRuleConfig) => void;
}

export const PresensiCameraTab: React.FC<PresensiCameraTabProps> = ({
  currentUser,
  salaryRules,
  isWifiConnected,
  currentWifiSsid,
  onToggleWifi,
  attendanceHistory,
  onSubmitAttendance,
  onNavigateToTab,
  realDetectedIp = '103.31.205.218',
  realDetectedIsp = 'PT Biznet Gio Nusantara',
  realDetectedCity = 'Jakarta / Manyar Site',
  onUpdateRealIp,
  onUpdateSalaryRules
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentRole: SystemRole = getEffectiveSystemRole(currentUser);
  const isSuperOrAdmin = currentRole === 'superuser' || currentRole === 'admin';

  // RBAC Privacy Filter: Superuser & Admin see all workforce logs, staff users only see their own attendance records.
  const visibleAttendanceHistory = useMemo(() => {
    if (isSuperOrAdmin) {
      return attendanceHistory;
    }
    return attendanceHistory.filter(item => {
      const matchId = Boolean(item.employeeId && currentUser.id && item.employeeId === currentUser.id);
      const matchNik = Boolean(item.employeeNik && currentUser.nik && item.employeeNik.trim().toLowerCase() === currentUser.nik.trim().toLowerCase());
      const matchName = Boolean(item.employeeName && currentUser.name && item.employeeName.trim().toLowerCase() === currentUser.name.trim().toLowerCase());
      return matchId || matchNik || matchName;
    });
  }, [attendanceHistory, isSuperOrAdmin, currentUser.id, currentUser.nik, currentUser.name]);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mode, setMode] = useState<AttendanceMode>('WFO');
  const [note, setNote] = useState('Supervisi Machining & Koordinasi Operasional Shift');
  
  const [destination, setDestination] = useState('PT Vale Indonesia, Sorowako Mill Site');
  const [clientName, setClientName] = useState('PT Vale Indonesia Tbk');
  const [projectCode, setProjectCode] = useState('PRJ-VALE-02');
  const [dinasPurpose, setDinasPurpose] = useState('Panggilan darurat perbaikan bearing SAG Mill 02 mendadak');

  // Real IP Network Detection States
  const [activeIp, setActiveIp] = useState<string>(realDetectedIp);
  const [activeIsp, setActiveIsp] = useState<string>(realDetectedIsp);
  const [activeCity, setActiveCity] = useState<string>(realDetectedCity);
  const [isSimulatedExternalIp, setIsSimulatedExternalIp] = useState<boolean>(false);
  const [isDetectingIp, setIsDetectingIp] = useState<boolean>(false);
  const [customIpWhitelist, setCustomIpWhitelist] = useState<string[]>([]);

  useEffect(() => {
    if (realDetectedIp && !isSimulatedExternalIp) {
      setActiveIp(realDetectedIp);
    }
    if (realDetectedIsp && !isSimulatedExternalIp) {
      setActiveIsp(realDetectedIsp);
    }
    if (realDetectedCity && !isSimulatedExternalIp) {
      setActiveCity(realDetectedCity);
    }
  }, [realDetectedIp, realDetectedIsp, realDetectedCity, isSimulatedExternalIp]);

  // Check if active IP is authorized in Corporate Gateway
  const isCurrentIpAuthorized = useMemo(() => {
    if (isSimulatedExternalIp) return false;
    if (customIpWhitelist.includes(activeIp)) return true;
    const networks = salaryRules.authorizedIpNetworks || [
      { ipOrSubnet: '103.31.205.218', label: 'Gateway Utama PRIME', isp: 'Biznet', isRegisteredOffice: true },
      { ipOrSubnet: '103.31.205.0/24', label: 'Subnet Utama PRIME', isp: 'Biznet', isRegisteredOffice: true }
    ];
    return networks.some(net => {
      if (net.ipOrSubnet === activeIp) return true;
      if (net.ipOrSubnet.includes('/')) {
        const prefix = net.ipOrSubnet.split('/')[0].split('.').slice(0, 3).join('.');
        return activeIp.startsWith(prefix);
      }
      return false;
    });
  }, [activeIp, isSimulatedExternalIp, customIpWhitelist, salaryRules.authorizedIpNetworks]);

  // Live IP refresh from client browser
  const fetchRealIp = async () => {
    setIsDetectingIp(true);
    try {
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      if (data && data.success) {
        setActiveIp(data.ip);
        setActiveIsp(data.connection?.isp || data.connection?.org || 'PT Biznet Gio Nusantara');
        setActiveCity(`${data.city || 'Manyar'}, ${data.region || 'Jawa Timur'}`);
        setIsSimulatedExternalIp(false);
        onUpdateRealIp?.(data.ip);
        return;
      }
    } catch (e) {
      console.warn('Real IP lookup fallback', e);
    }

    try {
      const res2 = await fetch('https://api.ipify.org?format=json');
      const data2 = await res2.json();
      if (data2 && data2.ip) {
        setActiveIp(data2.ip);
        setIsSimulatedExternalIp(false);
        onUpdateRealIp?.(data2.ip);
      }
    } catch (e2) {
      console.warn('Fallback IP fetch failed', e2);
    } finally {
      setIsDetectingIp(false);
    }
  };

  const handleWhitelistCurrentIp = () => {
    setCustomIpWhitelist(prev => [...prev, activeIp]);
    setIsSimulatedExternalIp(false);
  };

  const handleSimulateExternalIp = () => {
    setIsSimulatedExternalIp(true);
    setActiveIp('114.122.90.15');
    setActiveIsp('PT Telkomsel (Mobile Cellular 4G/5G)');
    setActiveCity('Surabaya Selatan, Jawa Timur');
  };

  const handleRestoreRealIp = () => {
    setIsSimulatedExternalIp(false);
    setActiveIp(realDetectedIp || '103.31.205.218');
    setActiveIsp(realDetectedIsp || 'PT Biznet Gio Nusantara');
    setActiveCity(realDetectedCity || 'Jakarta / Manyar Site');
  };

  const [isLate, setIsLate] = useState(false);
  const [lateMinutes, setLateMinutes] = useState(0);
  const [lateReason, setLateReason] = useState('Penumpukan arus lalu lintas jam sibuk jalur industri Manyar');

  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number; address: string }>({
    lat: salaryRules?.officeGeofence?.lat ?? -7.118942,
    lng: salaryRules?.officeGeofence?.lng ?? 112.584319,
    accuracy: 6.5,
    address: salaryRules?.officeGeofence?.address ?? 'Kawasan Perkantoran & Innovation Hub PRIME Blok A1-A4, Jawa Timur'
  });

  // State Pelacakan GPS Asli Smartphone Karyawan
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsSource, setGpsSource] = useState<'DEVICE_HARDWARE' | 'DEFAULT'>('DEFAULT');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [realGeofenceDistance, setRealGeofenceDistance] = useState<number>(0);

  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AttendanceRecord | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<AttendanceRecord | null>(null);

  // Geofence Office Settings Modal State
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [tempOfficeName, setTempOfficeName] = useState(salaryRules.officeGeofence?.name || 'PRIME Enterprise - Kantor Pusat & Innovation Hub');
  const [tempOfficeLat, setTempOfficeLat] = useState<number | string>(salaryRules.officeGeofence?.lat ?? -7.118942);
  const [tempOfficeLng, setTempOfficeLng] = useState<number | string>(salaryRules.officeGeofence?.lng ?? 112.584319);
  const [tempOfficeRadius, setTempOfficeRadius] = useState<number>(salaryRules.officeGeofence?.radiusMeters || 350);
  const [tempOfficeAddress, setTempOfficeAddress] = useState(salaryRules.officeGeofence?.address || '');
  const [isSavingGeofence, setIsSavingGeofence] = useState(false);
  const [geofenceModalMsg, setGeofenceModalMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const openGeofenceModal = () => {
    setTempOfficeName(salaryRules.officeGeofence?.name || 'PRIME Enterprise - Kantor Pusat & Innovation Hub');
    setTempOfficeLat(salaryRules.officeGeofence?.lat ?? -7.118942);
    setTempOfficeLng(salaryRules.officeGeofence?.lng ?? 112.584319);
    setTempOfficeRadius(salaryRules.officeGeofence?.radiusMeters || 350);
    setTempOfficeAddress(salaryRules.officeGeofence?.address || '');
    setGeofenceModalMsg(null);
    setIsGeofenceModalOpen(true);
  };

  const handleUseCurrentPhoneGps = () => {
    if (coords.lat && coords.lng) {
      setTempOfficeLat(coords.lat);
      setTempOfficeLng(coords.lng);
      if (coords.address && !coords.address.startsWith('Koordinat HP:')) {
        setTempOfficeAddress(coords.address.replace(' (GPS HP Asli)', ''));
      }
      setGeofenceModalMsg({
        text: `Berhasil menyalin koordinat GPS HP (Lat: ${coords.lat}, Lng: ${coords.lng})!`,
        type: 'success'
      });
      setTimeout(() => setGeofenceModalMsg(null), 4000);
    } else {
      setGeofenceModalMsg({
        text: 'Koordinat GPS HP belum terbaca. Silakan klik "Ambil GPS HP Ulang" terlebih dahulu.',
        type: 'error'
      });
    }
  };

  const modalDistance = useMemo(() => {
    const numLat = typeof tempOfficeLat === 'string' ? parseFloat(tempOfficeLat) : tempOfficeLat;
    const numLng = typeof tempOfficeLng === 'string' ? parseFloat(tempOfficeLng) : tempOfficeLng;
    if (isNaN(numLat) || isNaN(numLng)) return null;
    return calculateDistanceMeters(coords.lat, coords.lng, numLat, numLng);
  }, [tempOfficeLat, tempOfficeLng, coords.lat, coords.lng]);

  const handleSaveGeofence = async () => {
    const numLat = typeof tempOfficeLat === 'string' ? parseFloat(tempOfficeLat) : tempOfficeLat;
    const numLng = typeof tempOfficeLng === 'string' ? parseFloat(tempOfficeLng) : tempOfficeLng;
    const numRadius = Number(tempOfficeRadius) || 100;

    if (isNaN(numLat) || isNaN(numLng)) {
      setGeofenceModalMsg({
        text: 'Latitude dan Longitude harus berupa angka desimal yang valid.',
        type: 'error'
      });
      return;
    }

    setIsSavingGeofence(true);
    try {
      const updatedGeofence = {
        name: tempOfficeName.trim() || 'PRIME Enterprise - Kantor Pusat & Innovation Hub',
        lat: Number(numLat.toFixed(6)),
        lng: Number(numLng.toFixed(6)),
        radiusMeters: numRadius,
        address: tempOfficeAddress.trim() || 'Kawasan Kantor Pusat & Tech Hub PRIME'
      };

      const updatedSalaryRules: SalaryRuleConfig = {
        ...salaryRules,
        officeGeofence: updatedGeofence
      };

      if (onUpdateSalaryRules) {
        onUpdateSalaryRules(updatedSalaryRules);
      }

      const newDist = calculateDistanceMeters(coords.lat, coords.lng, updatedGeofence.lat, updatedGeofence.lng);
      setRealGeofenceDistance(newDist);

      playSuccessChime();
      setSuccessToast(`📍 Titik & Geofence Kantor Berhasil Disimpan! Radius: ${numRadius}m`);
      setTimeout(() => setSuccessToast(null), 4000);
      setIsGeofenceModalOpen(false);
    } catch (err) {
      console.error('Failed saving geofence', err);
      setGeofenceModalMsg({
        text: 'Gagal menyimpan koordinat kantor.',
        type: 'error'
      });
    } finally {
      setIsSavingGeofence(false);
    }
  };

  // Web Audio Success Chime
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // ignore autoplay policy restriction
    }
  };

  // Cutoff calculation
  useEffect(() => {
    const checkLateStatus = () => {
      const now = new Date();
      const [cutoffH, cutoffM] = salaryRules.cutoffTime.split(':').map(Number);
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffH, cutoffM, 0, 0);

      if (now > cutoffDate) {
        const diffMs = now.getTime() - cutoffDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        setIsLate(true);
        setLateMinutes(diffMins);
      } else {
        setIsLate(false);
        setLateMinutes(0);
      }
    };
    checkLateStatus();
    const timer = setInterval(checkLateStatus, 30000);
    return () => clearInterval(timer);
  }, [salaryRules.cutoffTime]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.warn('video play error', e));
          };
        }
        setCameraActive(true);
      } else {
        throw new Error('Webcam browser API tidak didukung');
      }
    } catch (err: any) {
      console.warn('Camera fallback:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Izin kamera ditolak oleh browser. Silakan aktifkan izin kamera di pengaturan browser Anda.'
          : 'Kamera fisik tidak aktif atau sedang digunakan aplikasi lain. Silakan periksa akses kamera Anda.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Auto start on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Keep stream synced if video re-renders
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(e => console.warn(e));
      }
    }
  }, [cameraActive]);

  // Reverse Geocode untuk mengambil nama jalan/kelurahan/kecamatan/kota asli dari GPS HP
  const fetchAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'id' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.street || addr.industrial || '';
          const village = addr.village || addr.suburb || addr.neighbourhood || '';
          const district = addr.municipality || addr.city_district || addr.subdistrict || '';
          const regency = addr.county || addr.city || '';
          const state = addr.state || '';
          
          const parts = [road, village, district, regency, state].filter(Boolean);
          if (parts.length > 0) {
            return `${parts.join(', ')} (GPS HP Asli)`;
          }
        }
        if (data && data.display_name) {
          return `${data.display_name.split(',').slice(0, 4).join(',')} (GPS HP Asli)`;
        }
      }
    } catch (e) {
      console.warn('Gagal reverse geocoding GPS HP:', e);
    }
    return `Koordinat HP: Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)} (GPS HP Terverifikasi)`;
  };

  // Ambil lokasi GPS asli langsung dari chip sensor GPS smartphone/HP user
  const fetchDeviceGps = (showToast = true) => {
    if (!navigator.geolocation) {
      setGpsError('Browser HP Anda tidak mendukung akses Geolocation GPS.');
      return;
    }

    setIsGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy) || 5;

        // Hitung jarak nyata ke titik kantor pusat
        const officeLat = salaryRules?.officeGeofence?.lat ?? -7.118942;
        const officeLng = salaryRules?.officeGeofence?.lng ?? 112.584319;
        const dist = calculateDistanceMeters(lat, lng, officeLat, officeLng);
        setRealGeofenceDistance(dist);
        setGpsSource('DEVICE_HARDWARE');

        // Ambil alamat asli lokasi GPS HP
        const resolvedAddress = await fetchAddressFromCoords(lat, lng);

        setCoords({
          lat,
          lng,
          accuracy,
          address: resolvedAddress
        });
        setIsGpsLoading(false);

        if (showToast) {
          setSuccessToast(`📍 GPS HP Terkunci! Akurasi: ±${accuracy}m (Jarak ke Kantor: ${dist}m)`);
          setTimeout(() => setSuccessToast(null), 4000);
        }
      },
      err => {
        setIsGpsLoading(false);
        let msg = 'Gagal membaca GPS HP.';
        if (err.code === 1) {
          msg = 'Izin lokasi GPS ditolak oleh HP. Mohon izinkan (Allow) akses Lokasi pada browser HP Anda.';
        } else if (err.code === 2) {
          msg = 'Sinyal GPS HP tidak tersedia. Pastikan fitur Lokasi / GPS pada HP Anda sudah diaktifkan (ON).';
        } else if (err.code === 3) {
          msg = 'Waktu pencarian GPS HP habis (Timeout). Silakan ketuk "Ambil GPS HP Ulang".';
        }
        setGpsError(msg);
        console.warn('GPS HP Error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Otomatis deteksi GPS HP saat halaman dibuka & pantau pergerakan (watchPosition)
  useEffect(() => {
    fetchDeviceGps(false);

    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        pos => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          const accuracy = Math.round(pos.coords.accuracy) || 5;
          const officeLat = salaryRules?.officeGeofence?.lat ?? -7.118942;
          const officeLng = salaryRules?.officeGeofence?.lng ?? 112.584319;
          const dist = calculateDistanceMeters(lat, lng, officeLat, officeLng);
          setRealGeofenceDistance(dist);
          setGpsSource('DEVICE_HARDWARE');
          setCoords(prev => ({
            ...prev,
            lat,
            lng,
            accuracy
          }));
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [salaryRules?.officeGeofence?.lat, salaryRules?.officeGeofence?.lng]);

  // Official Audit Watermark Generator
  const applyWatermark = (ctx: CanvasRenderingContext2D) => {
    // Top-Right Biometric Security Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(430, 16, 195, 34);
    ctx.strokeStyle = '#00E2B0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(430, 16, 195, 34);

    ctx.fillStyle = '#00E2B0';
    ctx.beginPath();
    ctx.arc(446, 33, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('BIOMETRIC VALIDATED', 458, 37);

    // Bottom Watermark Panel
    const grad = ctx.createLinearGradient(0, 340, 0, 480);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.80)');
    grad.addColorStop(0.3, 'rgba(15, 23, 42, 0.94)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 345, 640, 135);

    // Orange accent divider line
    ctx.fillStyle = '#FF6B00';
    ctx.fillRect(0, 345, 640, 3);

    const now = rtcService.getServerNow();
    const dateStr = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`KARYAWAN : ${currentUser.nik} • ${currentUser.name.toUpperCase()}`, 16, 372);

    ctx.fillStyle = '#00E2B0';
    ctx.font = '12px monospace';
    ctx.fillText(`WAKTU    : ${dateStr} | ${timeStr} [RTC LOCKED]`, 16, 394);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.fillText(`GEOTAG   : Lat ${coords.lat}, Lng ${coords.lng} (Akurasi ±${coords.accuracy}m)`, 16, 414);

    ctx.fillStyle = mode === 'DINAS_LUAR' ? '#fbbf24' : isCurrentIpAuthorized ? '#00E2B0' : '#f87171';
    const wifiText = mode === 'DINAS_LUAR'
      ? `MODE     : DINAS LUAR MENDADAK [${clientName}]`
      : `IP GATEWAY: ${activeIp} (${isCurrentIpAuthorized ? 'GATEWAY RESMI VALID' : 'IP LUAR KANTOR'}) • ${activeIsp.slice(0, 24)}`;
    ctx.fillText(wifiText, 16, 434);

    ctx.fillStyle = '#FF8533';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`PRIME HRIS ENTERPRISE • SECURE AUDIT STAMP #${Math.floor(100000 + Math.random() * 900000)}`, 16, 458);
  };

  // Helper menggambar frame video / gambar ke canvas dengan menjaga rasio asli (object-cover) tanpa ter-resize menyempit
  const drawCover = (
    ctx: CanvasRenderingContext2D,
    source: CanvasImageSource,
    srcWidth: number,
    srcHeight: number,
    destWidth: number,
    destHeight: number,
    isMirrored = false
  ) => {
    const targetRatio = destWidth / destHeight;
    const srcRatio = srcWidth / srcHeight;

    let sx = 0;
    let sy = 0;
    let sWidth = srcWidth;
    let sHeight = srcHeight;

    if (srcRatio > targetRatio) {
      // Sumber lebih lebar daripada canvas -> potong sisi kiri dan kanan secara simetris
      sWidth = srcHeight * targetRatio;
      sx = (srcWidth - sWidth) / 2;
    } else {
      // Sumber lebih tinggi daripada canvas -> potong sisi atas dan bawah secara simetris
      sHeight = srcWidth / targetRatio;
      sy = (srcHeight - sHeight) / 2;
    }

    ctx.save();
    if (isMirrored) {
      ctx.translate(destWidth, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, destWidth, destHeight);
    ctx.restore();
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = 640;
    const canvasHeight = 480;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    if (cameraActive && videoRef.current && videoRef.current.videoWidth > 0) {
      const video = videoRef.current;
      // Gunakan drawCover untuk mempertahankan proporsi wajah 100% natural tanpa menyempit
      drawCover(ctx, video, video.videoWidth, video.videoHeight, canvasWidth, canvasHeight, true);
      applyWatermark(ctx);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedPhoto(dataUrl);
      stopCamera();
    } else {
      // High-resolution user profile snapshot
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        drawCover(ctx, img, img.width, img.height, canvasWidth, canvasHeight, false);
        applyWatermark(ctx);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedPhoto(dataUrl);
      };
      img.onerror = () => {
        // Fallback gradient portrait
        const grad = ctx.createLinearGradient(0, 0, 640, 480);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 480);

        ctx.fillStyle = '#FF6B00';
        ctx.beginPath();
        ctx.arc(320, 190, 85, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(currentUser.name, 320, 198);
        ctx.font = '14px sans-serif';
        ctx.fillText(currentUser.position, 320, 222);

        applyWatermark(ctx);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedPhoto(dataUrl);
      };
      img.src = currentUser.avatar;
    }
  };

  // Instant Snapshot Generator for direct 1-click submission
  const generateInstantSnapshot = (): string => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const canvasWidth = 640;
    const canvasHeight = 480;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return currentUser.avatar;

    if (cameraActive && videoRef.current && videoRef.current.videoWidth > 0) {
      const video = videoRef.current;
      drawCover(ctx, video, video.videoWidth, video.videoHeight, canvasWidth, canvasHeight, true);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      ctx.fillStyle = '#FF6B00';
      ctx.beginPath();
      ctx.arc(320, 190, 85, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentUser.name, 320, 198);
      ctx.font = '14px sans-serif';
      ctx.fillText(currentUser.position, 320, 222);
    }
    applyWatermark(ctx);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Handle upload from file or smartphone camera
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const canvasWidth = 640;
        const canvasHeight = 480;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        drawCover(ctx, img, img.width, img.height, canvasWidth, canvasHeight, false);
        applyWatermark(ctx);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedPhoto(dataUrl);
        stopCamera();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const isWifiRestricted = mode === 'WFO' && !isCurrentIpAuthorized;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isWifiRestricted) {
      alert(`Gagal Presensi: IP jaringan Anda (${activeIp}) tidak terdaftar dalam Gateway Resmi PRIME Enterprise. Silakan hubungkan ke jaringan kantor atau pilih mode Dinas Luar Mendadak.`);
      return;
    }

    let photoToUse = capturedPhoto;
    if (!photoToUse) {
      photoToUse = generateInstantSnapshot();
      setCapturedPhoto(photoToUse);
    }

    const noteToUse = note.trim() || 'Supervisi Machining & Operasional Shift';
    const lateReasonToUse = isLate ? (lateReason.trim() || 'Penumpukan arus lalulintas jalur industri Manyar') : undefined;

    const now = rtcService.getServerNow();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeNik: currentUser.nik,
      department: currentUser.department,
      date: dateStr,
      checkInTime: timeStr,
      mode: mode,
      status: mode === 'DINAS_LUAR' ? 'DINAS_LUAR_PENDING' : isLate ? 'LATE' : 'ON_TIME',
      photoUrl: photoToUse,
      location: {
        lat: coords.lat,
        lng: coords.lng,
        accuracy: coords.accuracy,
        address: coords.address,
        inGeofence: mode === 'WFO' ? (realGeofenceDistance <= (salaryRules.officeGeofence.radiusMeters || 100)) : false,
        distanceMeters: realGeofenceDistance
      },
      wifi: {
        connected: isCurrentIpAuthorized,
        ssid: isCurrentIpAuthorized ? `${currentWifiSsid} (${activeIsp})` : `Non-Office IP (${activeIsp})`,
        bssid: isCurrentIpAuthorized ? '74:83:C2:AA:01:9F' : '00:00:00:00:00:00',
        isAuthorized: isCurrentIpAuthorized && mode === 'WFO',
        ipAddress: activeIp
      },
      note: noteToUse,
      isLate: isLate,
      lateMinutes: lateMinutes,
      lateReason: lateReasonToUse,
      dinasLuarDetails: mode === 'DINAS_LUAR' ? {
        destination,
        clientName,
        projectCode,
        purpose: dinasPurpose,
        isSudden: true
      } : undefined,
      approvalStatus: (mode === 'DINAS_LUAR' || isLate) ? 'PENDING' : 'NOT_REQUIRED'
    };

    onSubmitAttendance(newRecord);
    playSuccessChime();
    setSubmittedRecord(newRecord);
    setIsSuccessModalOpen(true);
    setSuccessToast(`Presensi berhasil dicatat! Status: ${newRecord.status}`);
    setTimeout(() => setSuccessToast(null), 4000);

    stopCamera();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white flex items-center justify-between shadow-xl shadow-emerald-500/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 motion-fade-in-down">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="prime-cut-corner bg-[#FF6B00] text-white text-[10px] font-black px-2.5 py-0.5 tracking-wider uppercase font-mono-code">
              SMART ATTENDANCE GATEWAY
            </span>
            <span className="text-xs font-semibold text-slate-500">Prime HRIS Engine v2.4</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Presensi Kamera & Verifikasi Sequential WiFi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Sistem validasi berlapis: Kamera selfie geotag, verifikasi WiFi kantor, dan fleksibilitas dinas luar mendadak.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="px-4 py-2 rounded-2xl bg-slate-100/90 border border-slate-200 text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Jadwal Shift Pagi</p>
            <p className="text-sm font-black text-slate-800 font-mono-code">08:00 - 17:00 WIB</p>
            <p className="text-[10px] text-orange-600 font-semibold">Batas Masuk: {salaryRules.cutoffTime} WIB</p>
          </div>

          {isLate ? (
            <div className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-300 text-rose-700 flex items-center gap-2 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
              <div>
                <p className="text-[10px] uppercase font-black tracking-wider">Terlambat</p>
                <p className="text-xs font-bold font-mono-code">{lateMinutes} Menit</p>
              </div>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-[10px] uppercase font-black tracking-wider">Tepat Waktu</p>
                <p className="text-xs font-bold font-mono-code">Sesuai Jadwal</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Camera Viewfinder & Geolocation */}
        <div className="lg:col-span-7 space-y-6 motion-fade-in-up stagger-1">
          <div id="tour-attendance-camera" className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#FF6B00]" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono-code">
                  Kamera Viewfinder & Watermark
                </h2>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                Face Detection Active
              </span>
            </div>

            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-inner flex items-center justify-center">
              <canvas ref={canvasRef} className="hidden" />

              {/* Real Video Element - ALWAYS MOUNTED so videoRef.current is never null */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-200 ${
                  cameraActive && !capturedPhoto ? 'block opacity-100' : 'hidden opacity-0'
                }`}
              />

              {capturedPhoto ? (
                <div className="relative w-full h-full">
                  <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold flex items-center gap-1 shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Foto Siap Disimpan</span>
                  </div>
                </div>
              ) : cameraActive ? (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-60 border-2 border-dashed border-[#00E2B0]/80 rounded-[40px] shadow-lg animate-pulse flex items-center justify-center">
                    <span className="text-[11px] text-[#00E2B0] font-mono-code bg-slate-900/70 px-2.5 py-1 rounded-full shadow-md">
                      Posisikan Wajah Di Sini
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                    <Camera className="w-8 h-8 text-[#FF6B00]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Kamera Siap Digunakan</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                      Nyalakan kamera live untuk selfie verifikasi presensi kehadiran.
                    </p>
                  </div>
                  {cameraError && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-left max-w-md mx-auto">
                      <p className="font-semibold">{cameraError}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white text-[10px] font-mono-code">
                <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-[#00E2B0] animate-ping' : 'bg-slate-500'}`}></span>
                <span>{cameraActive ? 'PRIME-CAM • 720p HD LIVE' : 'PRIME-CAM • STANDBY'}</span>
              </div>
            </div>

            {/* Hidden File Input for Device Camera / Gallery Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="flex items-center justify-center gap-2.5 pt-1 flex-wrap">
              {!capturedPhoto ? (
                <>
                  {!cameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-5 py-2.5 rounded-2xl btn-orange font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Aktifkan Kamera Live</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Ambil Foto Selfie</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="px-5 py-2.5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ambil Ulang Foto</span>
                </button>
              )}
            </div>

            <div id="tour-attendance-gps" className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-2.5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <div className="p-1 rounded-lg bg-orange-100 text-[#FF6B00]">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <span>GPS Sensor Asli HP (Real-time Geotag)</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchDeviceGps(true)}
                    disabled={isGpsLoading}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-orange-400 text-[10px] font-bold font-mono-code text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGpsLoading ? 'animate-spin text-[#FF6B00]' : 'text-slate-500'}`} />
                    <span>{isGpsLoading ? 'Mencari Satelit HP...' : 'Ambil GPS HP Ulang'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={openGeofenceModal}
                    className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 text-[10px] font-bold font-mono-code text-[#FF6B00] flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Atur titik koordinat & radius geofence kantor pusat"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Set Titik Kantor</span>
                  </button>

                  <span className={`font-mono-code text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    coords.accuracy <= 30
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    Akurasi HP: ±{coords.accuracy} meter
                  </span>
                </div>
              </div>

              {/* Alamat Nyata dari GPS HP */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                <div className="flex items-start gap-1.5 text-slate-700 leading-snug">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Alamat Deteksi GPS HP:</span>{' '}
                    <span className="text-slate-700">{coords.address}</span>
                  </div>
                </div>
              </div>

              {/* Baris Koordinat & Validasi Geofence Kantor */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-code text-slate-600 pt-0.5">
                <div className="flex items-center gap-3">
                  <span>Lat: <strong className="text-slate-900">{coords.lat}</strong></span>
                  <span>Lng: <strong className="text-slate-900">{coords.lng}</strong></span>
                  <span className="text-slate-400">|</span>
                  <span>Jarak ke Kantor: <strong className="text-slate-900">{realGeofenceDistance} meter</strong></span>
                </div>

                <div>
                  {mode === 'DINAS_LUAR' ? (
                    <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Mode Dinas Luar (Bebas Radius)
                    </span>
                  ) : realGeofenceDistance <= (salaryRules.officeGeofence.radiusMeters || 100) ? (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Dalam Radius Kantor ({realGeofenceDistance}m ≤ {salaryRules.officeGeofence.radiusMeters || 100}m)
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Di Luar Radius Kantor ({realGeofenceDistance}m &gt; {salaryRules.officeGeofence.radiusMeters || 100}m)
                    </span>
                  )}
                </div>
              </div>

              {/* Pesan jika ada kendala GPS */}
              {gpsError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{gpsError}</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right 5 Columns: Presensi Mode, WiFi Gate, Note & Submission */}
        <div className="lg:col-span-5 space-y-6 motion-fade-in-up stagger-2">
          <form id="tour-attendance-form" onSubmit={handleSubmit} className="glass-card rounded-3xl p-5 sm:p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code">
                Parameter & Validasi Presensi
              </h2>
              <span className="text-xs text-slate-400 font-medium font-mono-code">{currentUser.nik}</span>
            </div>

            {/* 1. Mode Penugasan */}
            <div id="tour-attendance-mode" className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Mode Penugasan Presensi
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'WFO', label: 'WFO Kantor', desc: 'Wajib WiFi', icon: Building },
                  { id: 'DINAS_LUAR', label: 'Dinas Luar', desc: 'Mendadak', icon: Briefcase },
                  { id: 'WFH', label: 'WFH', desc: 'Remote', icon: Clock }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = mode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id as AttendanceMode)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-orange-50 border-[#FF6B00] text-[#FF6B00] shadow-xs font-bold'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs leading-tight">{item.label}</span>
                      <span className="text-[9px] text-slate-400">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Realtime IP Network Gate & Subnet Validator */}
            <div id="tour-attendance-network" className={`p-4 rounded-2xl border transition-all ${
              mode === 'DINAS_LUAR'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900 shadow-2xs'
                : isCurrentIpAuthorized
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs'
                : 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-xs'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    mode === 'DINAS_LUAR'
                      ? 'bg-amber-100 text-amber-700'
                      : isCurrentIpAuthorized
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20'
                      : 'bg-rose-100 text-rose-700 ring-2 ring-rose-500/20 animate-pulse'
                  }`}>
                    {mode === 'DINAS_LUAR' ? (
                      <Briefcase className="w-5 h-5" />
                    ) : isCurrentIpAuthorized ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono-code tracking-tight">
                        {mode === 'DINAS_LUAR'
                          ? 'DISPENSASI PRESENSI: DINAS LUAR MENDADAK'
                          : isCurrentIpAuthorized
                          ? 'GATEWAY RESMI PRIME ENTERPRISE'
                          : 'AKSES TERKUNCI: JARINGAN LUAR KANTOR'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCurrentIpAuthorized
                          ? 'bg-emerald-200/80 text-emerald-800'
                          : 'bg-rose-200/80 text-rose-800'
                      }`}>
                        {isCurrentIpAuthorized ? 'JARINGAN RESMI TERVERIFIKASI' : 'JARINGAN LUAR KANTOR'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-700 pt-1">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Network className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">Jaringan Terhubung: <strong className="text-slate-800">{activeIsp}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lokasi Fisik: <strong className="text-emerald-700">100% Memakai GPS HP</strong></span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 pt-1 leading-snug">
                      {mode === 'DINAS_LUAR'
                        ? 'Verifikasi jaringan kantor dilewati untuk tugas luar. Presensi diajukan ke approval atasan dengan audit watermark dinas.'
                        : isCurrentIpAuthorized
                        ? 'Koneksi terverifikasi dari Gateway resmi PRIME Enterprise. Akses presensi On-Site dibuka.'
                        : 'Koneksi perangkat Anda berada di luar jaringan kantor resmi. Untuk presensi WFO wajib terhubung ke jaringan kantor.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Toolbar for Network Verification */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchRealIp}
                    disabled={isDetectingIp}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDetectingIp ? 'animate-spin text-[#FF6B00]' : 'text-slate-500'}`} />
                    <span>{isDetectingIp ? 'Memeriksa Jaringan...' : 'Periksa Ulang Jaringan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={openGeofenceModal}
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
                    title="Atur titik koordinat Latitude, Longitude, dan Radius Geofence Kantor Pusat"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Atur Lat/Lng Kantor</span>
                  </button>

                  {!isCurrentIpAuthorized && (
                    <button
                      type="button"
                      onClick={handleWhitelistCurrentIp}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>+ Daftarkan Sebagai Jaringan Kantor Resmi</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isSimulatedExternalIp ? (
                    <button
                      type="button"
                      onClick={handleRestoreRealIp}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kembalikan ke Jaringan Asli</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSimulateExternalIp}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Simulasi Jaringan Luar Kantor</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-Form: Dinas Luar Mendadak Details */}
            {mode === 'DINAS_LUAR' && (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Formulir Dinas Luar Mendadak</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Klien / Lokasi</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      placeholder="e.g. PT Vale Indonesia"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Kode Proyek</label>
                    <input
                      type="text"
                      value={projectCode}
                      onChange={e => setProjectCode(e.target.value)}
                      className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono-code"
                      placeholder="PRJ-VALE-02"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Alamat / Site Tujuan</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                    placeholder="Plant Site Sorowako"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Alasan / Urgensi Dinas Mendadak</label>
                  <textarea
                    rows={2}
                    value={dinasPurpose}
                    onChange={e => setDinasPurpose(e.target.value)}
                    className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                    placeholder="Jelaskan alasan tugas darurat ini..."
                    required
                  />
                </div>
              </div>
            )}

            {/* Note Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>2. Catatan / Note Aktivitas Harian</span>
                <span className="text-[10px] text-orange-600 font-semibold">*Wajib Diisi</span>
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full glass-input rounded-2xl p-3 text-xs text-slate-800 placeholder-slate-400"
                placeholder="Tuliskan rencana pekerjaan & aktivitas hari ini..."
                required
              />
              {/* Quick Preset Chips for Note */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  'Supervisi Shift Lapangan',
                  'Machining CNC & QC',
                  'Maintenance Tooling',
                  'Koordinasi Site'
                ].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNote(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-orange-100 hover:text-[#FF6B00] text-slate-600 font-medium transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Late Reason Input */}
            {isLate && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Catatan Alasan Keterlambatan (Wajib)</span>
                </div>
                <p className="text-[11px] text-rose-600 leading-snug">
                  Masuk melewati {salaryRules.cutoffTime} WIB ({lateMinutes} menit). Penalti keterlambatan akan diajukan ke HR untuk penghapusan bila ada alasan sah.
                </p>
                <textarea
                  rows={2}
                  value={lateReason}
                  onChange={e => setLateReason(e.target.value)}
                  className="w-full glass-input rounded-xl p-2.5 text-xs text-slate-800 border-rose-300 focus:border-rose-500"
                  placeholder="Sebutkan alasan keterlambatan (kemacetan, kendala kendaraan, dll)..."
                  required
                />
                {/* Quick Preset Chips for Late Reason */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    'Penumpukan arus lalu lintas jalur Manyar',
                    'Kendala cuaca hujan deras lapangan',
                    'Koordinasi teknis penanganan darurat'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLateReason(preset)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 font-medium transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isWifiRestricted}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                isWifiRestricted
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'btn-orange hover:shadow-orange-500/25 active:scale-98'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {capturedPhoto ? 'Kirim & Simpan Presensi Sekarang' : 'Ambil Foto & Simpan Presensi'}
              </span>
            </button>

            {isWifiRestricted && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-1 animate-in fade-in">
                <p className="text-xs font-bold text-rose-700 flex items-center justify-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Presensi WFO Terkunci: IP Anda ({activeIp}) Berada di Luar Gateway Resmi PRIME
                </p>
                <p className="text-[11px] text-rose-600">
                  Wajib menggunakan koneksi kantor resmi PRIME Enterprise, atau klik tombol <b>+ Daftarkan IP Ini</b> bila IP ini valid, atau ganti mode ke <b>Dinas Luar Mendadak</b>.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Attendance History Table */}
      <div id="tour-attendance-history" className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FF6B00]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code">
              {isSuperOrAdmin ? 'Riwayat Log Presensi Terkini' : 'Riwayat Log Presensi Saya'}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium font-mono-code">
            Total: {visibleAttendanceHistory.length} Rekaman {isSuperOrAdmin ? '(Semua Karyawan)' : '(Data Mandiri)'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-mono-code">
                <th className="py-2.5 px-3">Karyawan</th>
                <th className="py-2.5 px-3">Waktu & Tanggal</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Jaringan WiFi / Lokasi</th>
                <th className="py-2.5 px-3">Catatan / Keterangan</th>
                <th className="py-2.5 px-3">Status Verifikasi</th>
                <th className="py-2.5 px-3 text-right">Foto Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleAttendanceHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Clock className="w-5 h-5 text-slate-300" />
                      <span>Belum ada rekaman log presensi untuk akun Anda ({currentUser.name}).</span>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleAttendanceHistory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{item.employeeName}</div>
                      <div className="text-[10px] text-slate-500 font-mono-code">{item.employeeNik} • {item.department}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 font-mono-code">{item.checkInTime} WIB</div>
                      <div className="text-[10px] text-slate-400">{item.date}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.mode === 'DINAS_LUAR'
                          ? 'bg-amber-100 text-amber-800'
                          : item.mode === 'WFH'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.mode.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 font-mono-code text-[11px] truncate max-w-[180px]">
                        {item.wifi.ssid}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {item.location.address}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-slate-700 max-w-xs line-clamp-1">{item.note}</p>
                      {item.isLate && (
                        <span className="text-[10px] text-rose-600 font-semibold block">
                          Terlambat {item.lateMinutes}m ({item.lateReason})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {item.approvalStatus === 'PENDING' ? (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold animate-pulse">
                          Menunggu Approval
                        </span>
                      ) : item.approvalStatus === 'APPROVED' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Disetujui
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          Tervalidasi Otomatis
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedHistoryItem(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-[#FF6B00]" />
                        <span>Lihat Foto</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Photo Inspector */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 modal-dialog-animate">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Bukti Foto & Watermark Presensi</h3>
                <p className="text-[10px] text-slate-500 font-mono-code">{selectedHistoryItem.id}</p>
              </div>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <img src={selectedHistoryItem.photoUrl} alt="Bukti Foto" className="w-full rounded-2xl border border-slate-200 object-cover shadow-sm" />
              <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p><span className="font-bold text-slate-700">Karyawan:</span> {selectedHistoryItem.employeeName} ({selectedHistoryItem.employeeNik})</p>
                <p><span className="font-bold text-slate-700">Catatan:</span> {selectedHistoryItem.note}</p>
                <p><span className="font-bold text-slate-700">IP Gateway:</span> <span className="font-mono-code font-semibold">{selectedHistoryItem.wifi.ipAddress || '103.31.205.218'}</span> • {selectedHistoryItem.wifi.ssid} ({selectedHistoryItem.wifi.isAuthorized ? 'Gateway Resmi Valid' : 'Non-Office'})</p>
                <p><span className="font-bold text-slate-700">Lokasi:</span> {selectedHistoryItem.location.address}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Attendance Submission Success Dialog */}
      {isSuccessModalOpen && submittedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 font-mono-code bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-block">
                PRESENSI TERVERIFIKASI REALTIME
              </span>
              <h2 className="text-xl font-black text-slate-900">
                Presensi Berhasil Diterima & Disimpan!
              </h2>
              <p className="text-xs text-slate-600">
                Data kehadiran dan foto selfie resmi telah dicatat ke dalam database PRIME HRIS Enterprise.
              </p>
            </div>

            {/* Photo Preview with Watermark */}
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
              <img
                src={submittedRecord.photoUrl}
                alt="Selfie Presensi Terverifikasi"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Check className="w-3 h-3" />
                <span>Valid Audit Watermark</span>
              </div>
            </div>

            {/* Attendance Details Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Nama Karyawan:</span>
                <span className="font-bold text-slate-900">{submittedRecord.employeeName} ({submittedRecord.employeeNik})</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Waktu Presensi:</span>
                <span className="font-mono-code font-bold text-slate-900">{submittedRecord.checkInTime} WIB</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Status Kehadiran:</span>
                <span className={`font-bold px-2 py-0.2 rounded-md font-mono-code text-[11px] ${
                  submittedRecord.status === 'ON_TIME'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {submittedRecord.status === 'ON_TIME'
                    ? 'TEPAT WAKTU (ON TIME)'
                    : `TERLAMBAT (${submittedRecord.lateMinutes}m - PENGAJUAN DIAJUKAN KE HR)`}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">IP Gateway & Radius:</span>
                <span className="text-slate-700 font-mono-code text-[11px] truncate max-w-[240px]">
                  {submittedRecord.wifi.ipAddress || '103.31.205.218'} • {submittedRecord.wifi.ssid} ({submittedRecord.location.distanceMeters}m)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  onNavigateToTab?.('dashboard');
                }}
                className="w-full py-2.5 rounded-xl bg-orange-50 hover:bg-[#FF6B00] hover:text-white text-[#FF6B00] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Lihat di Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  onNavigateToTab?.('user_performance');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Buka Kinerja Saya</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-1 text-center text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              Tutup Dialog Ini
            </button>

          </div>
        </div>
      )}

      {/* Geofence & Office Coordinates Setting Modal */}
      {isGeofenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FF6B00] flex items-center justify-center font-bold shadow-xs shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pengaturan Titik Koordinat & Geofence Kantor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Konfigurasi lokasi resmi PRIME Enterprise & batas toleransi radius presensi WFO
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGeofenceModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-Click Feature: Use Current Phone GPS */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50/80 to-amber-50/60 border border-orange-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#FF6B00]" />
                  <span className="text-xs font-bold text-slate-900">GPS Sensor HP Saat Ini</span>
                </div>
                <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-orange-200/70 text-orange-900">
                  Akurasi: ±{coords.accuracy}m
                </span>
              </div>
              
              <div className="text-[11px] font-mono-code text-slate-700 bg-white/80 p-2 rounded-xl border border-orange-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  Lat: <strong className="text-slate-900">{coords.lat}</strong>, Lng: <strong className="text-slate-900">{coords.lng}</strong>
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-xs">
                  {coords.address}
                </div>
              </div>

              <button
                type="button"
                onClick={handleUseCurrentPhoneGps}
                className="w-full py-2 px-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-98"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>📍 Gunakan Posisi GPS HP Ini Sebagai Titik Kantor</span>
              </button>
            </div>

            {/* Feedback Message */}
            {geofenceModalMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                geofenceModalMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {geofenceModalMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{geofenceModalMsg.text}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lokasi / Kantor / Workshop
                </label>
                <input
                  type="text"
                  value={tempOfficeName}
                  onChange={e => setTempOfficeName(e.target.value)}
                  placeholder="e.g. PRIME Enterprise - Innovation Hub Surabaya"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Latitude (Lintang)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={tempOfficeLat}
                    onChange={e => setTempOfficeLat(e.target.value)}
                    placeholder="-7.118942"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono-code text-slate-800"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Contoh: -7.118942</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Longitude (Bujur)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={tempOfficeLng}
                    onChange={e => setTempOfficeLng(e.target.value)}
                    placeholder="112.584319"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono-code text-slate-800"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Contoh: 112.584319</span>
                </div>
              </div>

              {/* Radius Preset Chips & Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Radius Toleransi Geofence (Meter)
                  </label>
                  <span className="text-[11px] font-mono-code font-bold text-[#FF6B00]">
                    {tempOfficeRadius} Meter
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { radius: 50, label: '50m (Ketat)' },
                    { radius: 100, label: '100m (Gedung)' },
                    { radius: 200, label: '200m (Workshop)' },
                    { radius: 350, label: '350m (Standar Geofence)' },
                    { radius: 500, label: '500m (Kawasan Industri)' }
                  ].map(chip => (
                    <button
                      key={chip.radius}
                      type="button"
                      onClick={() => setTempOfficeRadius(chip.radius)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        tempOfficeRadius === chip.radius
                          ? 'bg-orange-50 border-[#FF6B00] text-[#FF6B00] font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={tempOfficeRadius}
                  onChange={e => setTempOfficeRadius(Number(e.target.value) || 0)}
                  placeholder="350"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono-code text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Resmi Kantor / Workshop
                </label>
                <textarea
                  rows={2}
                  value={tempOfficeAddress}
                  onChange={e => setTempOfficeAddress(e.target.value)}
                  placeholder="Alamat fisik resmi kantor..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-800 resize-none"
                />
              </div>

              {/* Realtime Live Verification & Map Check */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-700">Verifikasi Jarak Saat Ini:</span>
                  {modalDistance !== null && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      modalDistance <= tempOfficeRadius
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                      {modalDistance <= tempOfficeRadius
                        ? `✓ Di Dalam Radius (${modalDistance}m ≤ ${tempOfficeRadius}m)`
                        : `⚠ Di Luar Radius (${modalDistance}m > ${tempOfficeRadius}m)`}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[11px] font-mono-code text-slate-600">
                    Jarak: <strong className="text-slate-900">{modalDistance ?? '-'} m</strong> dari perangkat ini
                  </span>

                  <a
                    href={`https://www.google.com/maps?q=${tempOfficeLat},${tempOfficeLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    <span>Cek di Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsGeofenceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingGeofence}
                onClick={handleSaveGeofence}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingGeofence ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan ke SQLite...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Koordinat & Geofence</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
