import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useResto } from '../../context/RestoContext';
import { AttendanceRecord, ShiftType } from '../../types';
import { RESTO_LOCATION, calculateDistanceMeters, isWithinRestoRadius } from '../../utils/geoUtils';
import { 
  Camera, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Navigation, 
  UserCheck, 
  Users, 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  ExternalLink, 
  RotateCw, 
  Eye, 
  Sparkles, 
  ShieldAlert, 
  ChevronRight,
  Filter,
  Search,
  Timer,
  Check,
  X,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const AttendanceView: React.FC = () => {
  const { 
    currentUser, 
    users, 
    attendanceRecords, 
    submitAttendance, 
    deleteAttendanceRecord, 
    shiftSchedules, 
    shiftTimeConfigs,
    branding 
  } = useResto();

  const isLeaderOrManager = currentUser.role === 'manager' || 
                            currentUser.role === 'head_kitchen' || 
                            currentUser.role === 'head_floor' || 
                            currentUser.isMasterAdmin;

  // Active view tab: 'self_attendance' or 'manager_report'
  const [activeSubTab, setActiveSubTab] = useState<'self' | 'report'>('self');

  // Selected date for manager report (default today)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [reportDate, setReportDate] = useState<string>(todayStr);
  const [reportShiftFilter, setReportShiftFilter] = useState<string>('all');
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');

  // Selected photo for modal zoom
  const [zoomPhoto, setZoomPhoto] = useState<{ url: string; title: string } | null>(null);

  // --- SELF ATTENDANCE STATE ---
  const [selectedShift, setSelectedShift] = useState<ShiftType>('Pagi (Opening)');
  const [attendanceNotes, setAttendanceNotes] = useState<string>('');
  
  // GPS State
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);
  const [gpsWithinRadius, setGpsWithinRadius] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSimulatedGps, setIsSimulatedGps] = useState<boolean>(false);

  // Camera & Photo State
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Today's live time
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's attendance record for current user
  const myTodayAttendance = useMemo(() => {
    return attendanceRecords.find(r => r.userId === currentUser.id && r.date === todayStr);
  }, [attendanceRecords, currentUser.id, todayStr]);

  // Find user's scheduled shift for today if available
  useEffect(() => {
    const todaySchedule = shiftSchedules.find(s => s.userId === currentUser.id && s.date === todayStr);
    if (todaySchedule && todaySchedule.shiftType) {
      setSelectedShift(todaySchedule.shiftType);
    }
  }, [shiftSchedules, currentUser.id, todayStr]);

  // Acquire GPS Location
  const requestLocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Perangkat Anda tidak mendukung fitur Geolocation GPS.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserCoords({ latitude: lat, longitude: lon });
        
        const check = isWithinRestoRadius(lat, lon, RESTO_LOCATION.maxRadiusMeters);
        setGpsDistance(check.distanceMeters);
        setGpsWithinRadius(check.isWithin);
        setIsSimulatedGps(false);
        setGpsLoading(false);
      },
      (error) => {
        let msg = 'Gagal mengakses GPS perangkat.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Izin lokasi GPS ditolak oleh browser / HP. Silakan aktifkan izin lokasi di pengaturan browser Anda.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Sinyal GPS tidak terdeteksi. Pastikan GPS HP Anda aktif.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Waktu permintaan GPS habis. Coba ulangi kembali.';
        }
        setGpsError(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Start with acquiring GPS automatically
  useEffect(() => {
    requestLocation();
  }, []);

  // Simulator for testing when browser GPS is blocked or tested on desktop
  const handleSimulateRestoLocation = () => {
    // Add small random jitter (2 - 8 meters) around Imah Kayu Jatinangor
    const jitterLat = RESTO_LOCATION.latitude + (Math.random() - 0.5) * 0.00005;
    const jitterLon = RESTO_LOCATION.longitude + (Math.random() - 0.5) * 0.00005;
    setUserCoords({ latitude: jitterLat, longitude: jitterLon });
    const check = isWithinRestoRadius(jitterLat, jitterLon, RESTO_LOCATION.maxRadiusMeters);
    setGpsDistance(check.distanceMeters);
    setGpsWithinRadius(check.isWithin);
    setIsSimulatedGps(true);
    setGpsError(null);
  };

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera langsung (getUserMedia).');
      }

      let stream: MediaStream;
      try {
        // Try ideal selfie webcam constraints first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user', 
            width: { ideal: 640 }, 
            height: { ideal: 480 } 
          },
          audio: false,
        });
      } catch (constraintErr) {
        console.warn('Ideal video constraints failed, trying default video...', constraintErr);
        // Fallback for webcams with strict or unsupported constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);

      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(playErr => console.warn('Video play error on start:', playErr));
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      const isHttp = window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      if (isHttp) {
        setCameraError('Browser memblokir kamera di jaringan HTTP lokal (fitur keamanan browser). Silakan gunakan tombol Ambil Foto File/Kamera di bawah sebagai alternatif.');
      } else {
        setCameraError('Kamera tidak dapat diakses atau izin ditolak. Pastikan izin kamera telah diizinkan pada icon gembok browser.');
      }
      setCameraActive(false);
    }
  };

  // Ensure video element plays stream as soon as it is mounted in the DOM
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(err => console.warn('Video play error in effect:', err));
    }
  }, [cameraActive]);

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

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`Imah Kayu Jatinangor • ${currentUser.name} • ${todayStr} ${currentTime}`, 12, canvas.height - 15);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  // Fallback photo capture via file input (e.g. if browser blocks getUserMedia on HTTP LAN)
  const handlePhotoFileFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = img.width || 480;
        canvas.height = img.height || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Add watermark
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`Imah Kayu Jatinangor • ${currentUser.name} • ${todayStr} ${currentTime}`, 12, canvas.height - 15);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUrl);
        stopCamera();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Submit Clock In
  const handleClockIn = () => {
    if (!capturedPhoto) {
      alert('Wajib mengambil foto selfie untuk absensi masuk!');
      return;
    }
    if (!gpsWithinRadius || !userCoords || gpsDistance === null) {
      alert('Lokasi GPS berada di luar radius maksimal 50 meter dari Imah Kayu Jatinangor!');
      return;
    }

    const nowTimeStr = new Date().toTimeString().slice(0, 5);
    
    // Evaluate if on time or late based on configured shift time
    const shiftConfig = shiftTimeConfigs[selectedShift];
    let clockInStatus: 'Tepat Waktu' | 'Terlambat' = 'Tepat Waktu';
    if (shiftConfig && shiftConfig.startTime) {
      // 10 minutes tolerance
      const [shH, shM] = shiftConfig.startTime.split(':').map(Number);
      const [nowH, nowM] = nowTimeStr.split(':').map(Number);
      const shiftStartMinutes = shH * 60 + shM;
      const nowMinutes = nowH * 60 + nowM;
      if (nowMinutes > shiftStartMinutes + 10) {
        clockInStatus = 'Terlambat';
      }
    }

    const res = submitAttendance({
      userId: currentUser.id,
      employeeName: currentUser.name,
      employeeId: (currentUser as any).employeeId || `IK-STF-${currentUser.id.slice(-3)}`,
      role: currentUser.role,
      roleTitle: currentUser.roleTitle || 'Staf Resto',
      date: todayStr,
      shiftType: selectedShift,
      clockInTime: nowTimeStr,
      clockInPhoto: capturedPhoto,
      clockInLocation: {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        distanceMeters: gpsDistance,
        isWithinRadius: true,
      },
      clockInStatus,
      clockInNotes: attendanceNotes.trim(),
    });

    if (res.success) {
      alert(`Absen Masuk Berhasil! Status: ${clockInStatus} (${nowTimeStr}).`);
      setCapturedPhoto(null);
      setAttendanceNotes('');
    }
  };

  // Submit Clock Out
  const handleClockOut = () => {
    if (!capturedPhoto) {
      alert('Wajib mengambil foto selfie untuk absensi pulang!');
      return;
    }
    if (!gpsWithinRadius || !userCoords || gpsDistance === null) {
      alert('Lokasi GPS berada di luar radius maksimal 50 meter dari Imah Kayu Jatinangor!');
      return;
    }

    const nowTimeStr = new Date().toTimeString().slice(0, 5);

    const res = submitAttendance({
      userId: currentUser.id,
      employeeName: currentUser.name,
      employeeId: (currentUser as any).employeeId || `IK-STF-${currentUser.id.slice(-3)}`,
      role: currentUser.role,
      roleTitle: currentUser.roleTitle || 'Staf Resto',
      date: todayStr,
      shiftType: myTodayAttendance?.shiftType || selectedShift,
      clockOutTime: nowTimeStr,
      clockOutPhoto: capturedPhoto,
      clockOutLocation: {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        distanceMeters: gpsDistance,
        isWithinRadius: true,
      },
      clockOutNotes: attendanceNotes.trim(),
    });

    if (res.success) {
      alert(`Absen Pulang Berhasil dicatat (${nowTimeStr})! Terima kasih atas dedikasi kerja hari ini.`);
      setCapturedPhoto(null);
      setAttendanceNotes('');
    }
  };

  // --- MANAGER REPORT METRICS & FILTERING ---
  const reportFilteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const matchDate = record.date === reportDate;
      const matchShift = reportShiftFilter === 'all' || record.shiftType === reportShiftFilter;
      const matchSearch = reportSearchQuery === '' || 
        record.employeeName.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        record.roleTitle.toLowerCase().includes(reportSearchQuery.toLowerCase());
      return matchDate && matchShift && matchSearch;
    });
  }, [attendanceRecords, reportDate, reportShiftFilter, reportSearchQuery]);

  const reportKPIs = useMemo(() => {
    const totalPresent = reportFilteredRecords.filter(r => r.clockInTime).length;
    const onTimeCount = reportFilteredRecords.filter(r => r.clockInStatus === 'Tepat Waktu').length;
    const lateCount = reportFilteredRecords.filter(r => r.clockInStatus === 'Terlambat').length;
    const completedShifts = reportFilteredRecords.filter(r => r.clockInTime && r.clockOutTime).length;
    const totalWorkMinutes = reportFilteredRecords.reduce((sum, r) => sum + (r.workDurationMinutes || 0), 0);
    const avgHours = totalPresent > 0 ? (totalWorkMinutes / (totalPresent * 60)).toFixed(1) : '0';

    return {
      totalPresent,
      onTimeCount,
      lateCount,
      completedShifts,
      avgHours,
    };
  }, [reportFilteredRecords]);

  // Export Attendance Report to Excel
  const handleExportAttendanceExcel = () => {
    const wsData = [
      [`LAPORAN REKAPITULASI ABSENSI KARYAWAN`],
      [`Nama Restoran`, branding.outletName || 'Imah Kayu Jatinangor'],
      [`Alamat Restoran`, RESTO_LOCATION.address],
      [`Titik Koordinat Valid`, `${RESTO_LOCATION.latitude}, ${RESTO_LOCATION.longitude} (Radius Maks: 50 Meter)`],
      [`Tanggal Laporan`, `${reportDate}`],
      [`Filter Shift`, `${reportShiftFilter === 'all' ? 'Semua Shift' : reportShiftFilter}`],
      [`Waktu Export`, new Date().toLocaleString('id-ID')],
      [],
      [
        'No',
        'ID Karyawan',
        'Nama Karyawan',
        'Jabatan / Role',
        'Shift Kerja',
        'Jam Masuk',
        'Status Masuk',
        'Jarak Masuk (m)',
        'Jam Pulang',
        'Jarak Pulang (m)',
        'Durasi Kerja (Menit)',
        'Durasi (Jam:Menit)',
        'Catatan Karyawan'
      ],
      ...reportFilteredRecords.map((r, idx) => {
        const durHours = r.workDurationMinutes ? Math.floor(r.workDurationMinutes / 60) : 0;
        const durMins = r.workDurationMinutes ? r.workDurationMinutes % 60 : 0;
        return [
          idx + 1,
          r.employeeId,
          r.employeeName,
          r.roleTitle,
          r.shiftType,
          r.clockInTime || '-',
          r.clockInStatus || '-',
          r.clockInLocation?.distanceMeters !== undefined ? `${r.clockInLocation.distanceMeters}m` : '-',
          r.clockOutTime || '-',
          r.clockOutLocation?.distanceMeters !== undefined ? `${r.clockOutLocation.distanceMeters}m` : '-',
          r.workDurationMinutes || 0,
          r.workDurationMinutes ? `${durHours}j ${durMins}m` : '-',
          r.clockInNotes || r.clockOutNotes || '-'
        ];
      })
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Absensi');
    XLSX.writeFile(wb, `Rekap_Absensi_Imah_Kayu_${reportDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5 text-amber-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Absensi Karyawan (GPS & Selfie)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Wajib foto selfie dan aktifkan GPS • Radius maksimal 50 meter dari titik koordinat resmi Imah Kayu Jatinangor
          </p>
        </div>

        {/* Tab Toggle for Managers & Staff */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('self')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'self' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-600" />
            <span>Form Absen Saya</span>
          </button>

          {isLeaderOrManager && (
            <button
              type="button"
              onClick={() => setActiveSubTab('report')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'report' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Laporan Absensi Karyawan</span>
            </button>
          )}
        </div>
      </div>

      {/* RESTO GEO LOCATION BADGE INFO */}
      <div className="bg-gradient-to-r from-amber-50 via-emerald-50 to-blue-50 p-4 rounded-2xl border border-amber-200 text-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-sm">Titik Resmi: {RESTO_LOCATION.name}</span>
              <span className="px-2 py-0.5 bg-amber-600 text-white font-bold text-[10px] rounded-full">
                Radius Maks: 50 Meter
              </span>
            </div>
            <div className="text-slate-600 mt-0.5">
              {RESTO_LOCATION.address}
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
              Koordinat: {RESTO_LOCATION.latitude}, {RESTO_LOCATION.longitude}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <a
            href={RESTO_LOCATION.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Buka Google Maps</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* SUBTAB 1: FORM ABSEN SAYA */}
      {activeSubTab === 'self' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: LIVE VALIDATION (GPS & CAMERA) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. GPS STATUS CARD */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">1. Validasi Lokasi GPS Perangkat</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={requestLocation}
                    disabled={gpsLoading}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                    <span>Perbarui GPS</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateRestoLocation}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                    title="Simulasi berada di lokasi resto (sangat berguna jika GPS desktop/container tidak dapat mendeteksi satelit)"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Set Titik Resto (Demo)</span>
                  </button>
                </div>
              </div>

              {/* GPS Result Indicator */}
              {gpsLoading ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 text-xs text-slate-600 animate-pulse">
                  <RotateCw className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Sedang mendeteksi sinyal GPS dan menghitung jarak ke resto...</span>
                </div>
              ) : gpsError ? (
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{gpsError}</span>
                  </div>
                  <p className="text-[11px] text-rose-600">
                    Pastikan GPS di HP aktif dan berikan izin browser. Untuk pengujian cepat di laptop, Anda dapat mengklik tombol "Set Titik Resto (Demo)".
                  </p>
                </div>
              ) : userCoords && gpsDistance !== null ? (
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                  gpsWithinRadius 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900' 
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-sm">
                      {gpsWithinRadius ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>GPS VALID: Di Dalam Area Imah Kayu</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                          <span>DI LUAR RADIUS RESTO (Maks 70m)</span>
                        </>
                      )}
                    </div>
                    <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-white border shadow-2xs">
                      Jarak: {gpsDistance} meter
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-slate-500">Koordinat Anda: </span>
                      <span className="font-mono font-bold">{userCoords.latitude.toFixed(6)}, {userCoords.longitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Batas Toleransi: </span>
                      <span className="font-bold">Maksimal 70 Meter</span>
                    </div>
                  </div>

                  {isSimulatedGps && (
                    <div className="text-[10px] text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded font-medium inline-block">
                      * Menggunakan Mode Titik Resto Simulasi untuk Kemudahan Pengujian
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>Silakan klik "Perbarui GPS" untuk membaca lokasi saat ini.</span>
                </div>
              )}
            </div>

            {/* 2. CAMERA SELFIE CARD */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-sm">2. Wajib Foto Selfie Karyawan</h3>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md border border-amber-300">
                    Live Kamera Only
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!cameraActive && !capturedPhoto && (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Buka Kamera</span>
                    </button>
                  )}

                  {cameraActive && (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all"
                    >
                      Tutup Kamera
                    </button>
                  )}
                </div>
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Camera Preview or Captured Photo Box */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video sm:aspect-[4/3] flex items-center justify-center border-2 border-dashed border-slate-300">
                {capturedPhoto ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={capturedPhoto} 
                      alt="Selfie Absensi" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedPhoto(null);
                          startCamera();
                        }}
                        className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold rounded-xl backdrop-blur-sm shadow-md flex items-center gap-1 transition-all"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Foto Ulang</span>
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md">
                      <Check className="w-3.5 h-3.5" />
                      <span>Foto Selfie Siap</span>
                    </div>
                  </div>
                ) : cameraActive ? (
                  <div className="relative w-full h-full bg-black">
                    <video 
                      ref={(el) => {
                        videoRef.current = el;
                        if (el && streamRef.current && el.srcObject !== streamRef.current) {
                          el.srcObject = streamRef.current;
                          el.play().catch(e => console.warn('Video play error in ref:', e));
                        }
                      }} 
                      autoPlay 
                      playsInline 
                      muted 
                      onLoadedMetadata={(e) => {
                        const target = e.currentTarget;
                        target.play().catch(err => console.warn('Metadata play error:', err));
                      }}
                      className="w-full h-full object-cover mirror scale-x-[-1]"
                    />
                    <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-full shadow-lg flex items-center gap-2 transition-all border-2 border-white cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Ambil Foto Selfie Sekarang</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-2 bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-xs rounded-full shadow backdrop-blur-sm"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-xs">Kamera Belum Aktif</p>
                      <p className="text-slate-400 text-[11px] mt-0.5 max-w-sm mx-auto">
                        Wajib foto selfie langsung melalui kamera perangkat untuk verifikasi kehadiran.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Buka Kamera Selfie (Live Webcam)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Gunakan kamera sistem jika browser memblokir video live di LAN HTTP"
                      >
                        <span>Foto via Kamera HP / File</span>
                      </button>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      capture="user" 
                      className="hidden" 
                      onChange={handlePhotoFileFallback} 
                    />
                  </div>
                )}
                {/* Hidden canvas for taking snapshot */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: ATTENDANCE ACTION & STATUS */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* CURRENT USER & SHIFT CARD */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{currentUser.name}</h3>
                    <p className="text-xs text-slate-500">{currentUser.roleTitle || 'Staf Operasional'}</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-sm text-slate-900">{currentTime}</div>
                  <div className="text-[10px] text-slate-500">{todayStr}</div>
                </div>
              </div>

              {/* Shift Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Shift Kerja Hari Ini:
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value as ShiftType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Pagi (Opening)">
                    Pagi (Opening) • {shiftTimeConfigs['Pagi (Opening)']?.startTime || '07:00'} - {shiftTimeConfigs['Pagi (Opening)']?.endTime || '15:00'}
                  </option>
                  <option value="Siang (Middle)">
                    Siang (Middle) • {shiftTimeConfigs['Siang (Middle)']?.startTime || '11:00'} - {shiftTimeConfigs['Siang (Middle)']?.endTime || '19:00'}
                  </option>
                  <option value="Malam (Closing)">
                    Malam (Closing) • {shiftTimeConfigs['Malam (Closing)']?.startTime || '15:00'} - {shiftTimeConfigs['Malam (Closing)']?.endTime || '23:00'}
                  </option>
                  <option value="Full Shift">
                    Full Shift • {shiftTimeConfigs['Full Shift']?.startTime || '09:00'} - {shiftTimeConfigs['Full Shift']?.endTime || '21:00'}
                  </option>
                </select>
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Karyawan (Opsional):
                </label>
                <input
                  type="text"
                  value={attendanceNotes}
                  onChange={(e) => setAttendanceNotes(e.target.value)}
                  placeholder="Misal: Siap briefing pagi / serah terima shift..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* CLOCK IN & CLOCK OUT ACTION BUTTONS */}
              <div className="pt-2 space-y-3">
                {/* Clock In Button */}
                {!myTodayAttendance?.clockInTime ? (
                  <button
                    type="button"
                    onClick={handleClockIn}
                    disabled={!capturedPhoto || !gpsWithinRadius}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all ${
                      capturedPhoto && gpsWithinRadius
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Absen Masuk (Clock In)</span>
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold">Sudah Absen Masuk</div>
                        <div className="text-[11px] text-emerald-700">
                          Pukul {myTodayAttendance.clockInTime} ({myTodayAttendance.clockInStatus})
                        </div>
                      </div>
                    </div>
                    {myTodayAttendance.clockInPhoto && (
                      <button
                        type="button"
                        onClick={() => setZoomPhoto({ url: myTodayAttendance.clockInPhoto!, title: `Selfie Masuk - ${myTodayAttendance.employeeName}` })}
                        className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-300 hover:opacity-80 transition-opacity"
                      >
                        <img src={myTodayAttendance.clockInPhoto} alt="Selfie Masuk" className="w-full h-full object-cover" />
                      </button>
                    )}
                  </div>
                )}

                {/* Clock Out Button */}
                {myTodayAttendance?.clockInTime && !myTodayAttendance?.clockOutTime && (
                  <button
                    type="button"
                    onClick={handleClockOut}
                    disabled={!capturedPhoto || !gpsWithinRadius}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all ${
                      capturedPhoto && gpsWithinRadius
                        ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-98'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Absen Pulang (Clock Out)</span>
                  </button>
                )}

                {myTodayAttendance?.clockOutTime && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-bold">Sudah Absen Pulang</div>
                        <div className="text-[11px] text-blue-700">
                          Pukul {myTodayAttendance.clockOutTime} • Durasi: {Math.floor((myTodayAttendance.workDurationMinutes || 0) / 60)}j {(myTodayAttendance.workDurationMinutes || 0) % 60}m
                        </div>
                      </div>
                    </div>
                    {myTodayAttendance.clockOutPhoto && (
                      <button
                        type="button"
                        onClick={() => setZoomPhoto({ url: myTodayAttendance.clockOutPhoto!, title: `Selfie Pulang - ${myTodayAttendance.employeeName}` })}
                        className="w-8 h-8 rounded-lg overflow-hidden border border-blue-300 hover:opacity-80 transition-opacity"
                      >
                        <img src={myTodayAttendance.clockOutPhoto} alt="Selfie Pulang" className="w-full h-full object-cover" />
                      </button>
                    )}
                  </div>
                )}

                {/* Requirements Checklist */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Syarat Absensi:</div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">1. Foto Selfie Wajah:</span>
                    {capturedPhoto ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Siap
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Wajib Ambil Foto
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">2. GPS Radius &lt; 50 Meter:</span>
                    {gpsWithinRadius ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> ({gpsDistance}m) Valid
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> {gpsDistance !== null ? `${gpsDistance}m (Jauh)` : 'Belum Terbaca'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SUMMARY CARD FOR TODAY */}
            {myTodayAttendance && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-3">
                <h4 className="font-black text-slate-900 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-amber-600" />
                  <span>Ringkasan Absen Anda Hari Ini</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Jam Masuk</span>
                    <div className="font-black text-slate-900 text-sm">{myTodayAttendance.clockInTime || '-'}</div>
                    <div className="text-[10px] text-slate-500">
                      Jarak: {myTodayAttendance.clockInLocation?.distanceMeters || 0}m
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Jam Pulang</span>
                    <div className="font-black text-slate-900 text-sm">{myTodayAttendance.clockOutTime || 'Belum Pulang'}</div>
                    <div className="text-[10px] text-slate-500">
                      {myTodayAttendance.clockOutLocation ? `Jarak: ${myTodayAttendance.clockOutLocation.distanceMeters}m` : '-'}
                    </div>
                  </div>
                </div>

                {myTodayAttendance.workDurationMinutes !== undefined && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between">
                    <span className="font-bold">Total Jam Kerja Efektif:</span>
                    <span className="font-black text-sm">
                      {Math.floor(myTodayAttendance.workDurationMinutes / 60)} Jam {myTodayAttendance.workDurationMinutes % 60} Menit
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* SUBTAB 2: LAPORAN ABSENSI KARYAWAN (MANAGER & LEADER REPORT) */}
      {activeSubTab === 'report' && isLeaderOrManager && (
        <div className="space-y-6">
          
          {/* FILTER BAR: DATE SELECTOR & SEARCH */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Date Selector */}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-700">Pilih Tanggal:</span>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Shift Filter */}
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-700">Shift:</span>
                <select
                  value={reportShiftFilter}
                  onChange={(e) => setReportShiftFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="all">Semua Shift</option>
                  <option value="Pagi (Opening)">Pagi (Opening)</option>
                  <option value="Siang (Middle)">Siang (Middle)</option>
                  <option value="Malam (Closing)">Malam (Closing)</option>
                  <option value="Full Shift">Full Shift</option>
                </select>
              </div>

              {/* Search Staff */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama karyawan..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none w-48 sm:w-60"
                />
              </div>
            </div>

            {/* Actions: Export Excel & Print */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportAttendanceExcel}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Cetak Laporan</span>
              </button>
            </div>
          </div>

          {/* REPORT SUMMARY KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Karyawan Hadir</span>
              <div className="text-2xl font-black text-slate-900">{reportKPIs.totalPresent} Orang</div>
              <div className="text-[11px] text-slate-500">Pada tanggal {reportDate}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-600">Tepat Waktu</span>
              <div className="text-2xl font-black text-emerald-700">{reportKPIs.onTimeCount} Orang</div>
              <div className="text-[11px] text-emerald-600 font-medium">Sesuai jam masuk shift</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-500">Terlambat</span>
              <div className="text-2xl font-black text-rose-700">{reportKPIs.lateCount} Orang</div>
              <div className="text-[11px] text-rose-600 font-medium">&gt; 10 menit toleransi</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-blue-500">Rata-rata Durasi Kerja</span>
              <div className="text-2xl font-black text-blue-700">{reportKPIs.avgHours} Jam</div>
              <div className="text-[11px] text-blue-600 font-medium">{reportKPIs.completedShifts} staf selesai shift</div>
            </div>
          </div>

          {/* ATTENDANCE TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <h3 className="font-black text-slate-900 text-sm">
                  Daftar Absensi Staf ({reportFilteredRecords.length} Data)
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Tanggal: <strong className="text-slate-800">{reportDate}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <th className="p-3 pl-4">Karyawan</th>
                    <th className="p-3">Shift</th>
                    <th className="p-3">Foto Masuk</th>
                    <th className="p-3">Jam Masuk</th>
                    <th className="p-3">Status Masuk</th>
                    <th className="p-3">Foto Pulang</th>
                    <th className="p-3">Jam Pulang</th>
                    <th className="p-3">Durasi Kerja</th>
                    <th className="p-3">Lokasi GPS</th>
                    <th className="p-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportFilteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        Tidak ada catatan absensi karyawan pada tanggal dan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    reportFilteredRecords.map((r) => {
                      const durHours = r.workDurationMinutes ? Math.floor(r.workDurationMinutes / 60) : 0;
                      const durMins = r.workDurationMinutes ? r.workDurationMinutes % 60 : 0;

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Employee */}
                          <td className="p-3 pl-4">
                            <div className="font-bold text-slate-900">{r.employeeName}</div>
                            <div className="text-[11px] text-slate-500">{r.roleTitle}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{r.employeeId}</div>
                          </td>

                          {/* Shift */}
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-bold text-[11px] text-slate-700">
                              {r.shiftType}
                            </span>
                          </td>

                          {/* Selfie In */}
                          <td className="p-3">
                            {r.clockInPhoto ? (
                              <button
                                type="button"
                                onClick={() => setZoomPhoto({ url: r.clockInPhoto!, title: `Foto Masuk: ${r.employeeName}` })}
                                className="w-10 h-10 rounded-xl overflow-hidden border border-slate-300 hover:scale-105 transition-transform shadow-2xs relative group"
                              >
                                <img src={r.clockInPhoto} alt="Foto Masuk" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Tidak ada foto</span>
                            )}
                          </td>

                          {/* Clock In Time */}
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {r.clockInTime || '-'}
                          </td>

                          {/* Status In */}
                          <td className="p-3">
                            {r.clockInStatus ? (
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                r.clockInStatus === 'Tepat Waktu' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {r.clockInStatus}
                              </span>
                            ) : '-'}
                          </td>

                          {/* Selfie Out */}
                          <td className="p-3">
                            {r.clockOutPhoto ? (
                              <button
                                type="button"
                                onClick={() => setZoomPhoto({ url: r.clockOutPhoto!, title: `Foto Pulang: ${r.employeeName}` })}
                                className="w-10 h-10 rounded-xl overflow-hidden border border-slate-300 hover:scale-105 transition-transform shadow-2xs relative group"
                              >
                                <img src={r.clockOutPhoto} alt="Foto Pulang" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Belum pulang</span>
                            )}
                          </td>

                          {/* Clock Out Time */}
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {r.clockOutTime || '-'}
                          </td>

                          {/* Work Duration */}
                          <td className="p-3 font-mono">
                            {r.workDurationMinutes ? (
                              <span className="font-bold text-slate-800">
                                {durHours}j {durMins}m
                              </span>
                            ) : '-'}
                          </td>

                          {/* GPS Validation */}
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{r.clockInLocation?.distanceMeters || 0}m (&lt;70m Valid)</span>
                            </div>
                          </td>

                          {/* Notes */}
                          <td className="p-3 text-slate-600 max-w-xs truncate">
                            {r.clockInNotes || r.clockOutNotes || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* PHOTO ZOOM MODAL */}
      {zoomPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">{zoomPhoto.title}</h3>
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex justify-center bg-slate-950">
              <img src={zoomPhoto.url} alt="Selfie" className="max-h-[70vh] rounded-xl object-contain" />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-500 font-mono">Verifikasi Resmi Absensi Imah Kayu Jatinangor</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
