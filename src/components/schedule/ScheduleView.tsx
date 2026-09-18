import React, { useState, useMemo, useEffect } from 'react';
import { useResto } from '../../context/RestoContext';
import { EmployeeShiftSchedule, ShiftType, UserRole } from '../../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User as UserIcon, 
  Users, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Copy, 
  Sparkles, 
  Filter, 
  Sun, 
  Sunset, 
  Moon, 
  Coffee, 
  HeartPulse, 
  Plane,
  X,
  Sliders,
  Save,
  Settings
} from 'lucide-react';
import * as XLSX from 'xlsx';

const SHIFT_CONFIG: Record<ShiftType, { label: string; time: string; color: string; bgBadge: string; icon: React.ComponentType<{ className?: string }> }> = {
  'Pagi (Opening)': { label: 'Pagi (Opening)', time: '07:00 - 15:00', color: 'text-amber-800 border-amber-300', bgBadge: 'bg-amber-100 text-amber-900 border-amber-300', icon: Sun },
  'Siang (Middle)': { label: 'Siang (Middle)', time: '11:00 - 19:00', color: 'text-blue-800 border-blue-300', bgBadge: 'bg-blue-100 text-blue-900 border-blue-300', icon: Sunset },
  'Malam (Closing)': { label: 'Malam (Closing)', time: '15:00 - 23:00', color: 'text-indigo-800 border-indigo-300', bgBadge: 'bg-indigo-100 text-indigo-900 border-indigo-300', icon: Moon },
  'Full Shift': { label: 'Full Shift', time: '09:00 - 21:00', color: 'text-purple-800 border-purple-300', bgBadge: 'bg-purple-100 text-purple-900 border-purple-300', icon: Clock },
  'Libur (Off)': { label: 'Libur (Off)', time: 'Off / Day Off', color: 'text-slate-600 border-slate-300', bgBadge: 'bg-slate-100 text-slate-700 border-slate-300', icon: Coffee },
  'Cuti': { label: 'Cuti Resmi', time: 'Annual Leave', color: 'text-emerald-800 border-emerald-300', bgBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: Plane },
  'Sakit': { label: 'Izin Sakit', time: 'Medical Leave', color: 'text-rose-800 border-rose-300', bgBadge: 'bg-rose-100 text-rose-900 border-rose-300', icon: HeartPulse },
};

export const ScheduleView: React.FC = () => {
  const { 
    currentUser, 
    users, 
    shiftSchedules, 
    addShiftSchedule, 
    updateShiftSchedule, 
    deleteShiftSchedule, 
    bulkAssignShiftSchedules,
    shiftTimeConfigs,
    updateShiftTimeConfigs,
    branding 
  } = useResto();

  // Leaders / Managers can edit schedules
  const canEdit = currentUser.role === 'manager' || 
                  currentUser.role === 'head_kitchen' || 
                  currentUser.role === 'head_floor' || 
                  currentUser.isMasterAdmin;

  // View state: 'week' | 'today' | 'my_schedule'
  const [viewTab, setViewTab] = useState<'week' | 'today' | 'my_schedule'>('week');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');

  // Week offset state (0 = current week, 1 = next week, -1 = prev week)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EmployeeShiftSchedule | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Custom Shift Time Config Modal (Manager)
  const [isConfigShiftModalOpen, setIsConfigShiftModalOpen] = useState(false);
  const [tempShiftConfigs, setTempShiftConfigs] = useState(shiftTimeConfigs);

  useEffect(() => {
    setTempShiftConfigs(shiftTimeConfigs);
  }, [shiftTimeConfigs]);

  // Form State
  const [formData, setFormData] = useState({
    userId: '',
    date: new Date().toISOString().slice(0, 10),
    shiftType: 'Pagi (Opening)' as ShiftType,
    startTime: shiftTimeConfigs['Pagi (Opening)']?.startTime || '07:00',
    endTime: shiftTimeConfigs['Pagi (Opening)']?.endTime || '15:00',
    notes: '',
  });

  // Calculate days of current viewed week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Distance to Monday
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const days: { dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const todayStr = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        dateStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [weekOffset]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filtered employees
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (selectedUserFilter !== 'all' && u.id !== selectedUserFilter) return false;
      if (departmentFilter !== 'all') {
        if (departmentFilter === 'kitchen' && u.role !== 'head_kitchen' && u.role !== 'staff') return false;
        if (departmentFilter === 'floor' && u.role !== 'head_floor' && u.role !== 'kasir') return false;
        if (departmentFilter === 'management' && u.role !== 'manager' && u.role !== 'purchasing') return false;
      }
      return true;
    });
  }, [users, departmentFilter, selectedUserFilter]);

  // Open modal for assign or edit
  const handleOpenAssign = (user?: { id: string; name: string }, dateStr?: string) => {
    const targetUser = user || users[0];
    const targetDate = dateStr || todayStr;
    const existing = shiftSchedules.find(s => s.userId === targetUser?.id && s.date === targetDate);

    if (existing) {
      setEditingSchedule(existing);
      setFormData({
        userId: existing.userId,
        date: existing.date,
        shiftType: existing.shiftType,
        startTime: existing.startTime || '07:00',
        endTime: existing.endTime || '15:00',
        notes: existing.notes || '',
      });
    } else {
      setEditingSchedule(null);
      const defaultPagi = shiftTimeConfigs['Pagi (Opening)'] || { startTime: '07:00', endTime: '15:00' };
      setFormData({
        userId: targetUser ? targetUser.id : (users[0]?.id || ''),
        date: targetDate,
        shiftType: 'Pagi (Opening)',
        startTime: defaultPagi.startTime,
        endTime: defaultPagi.endTime,
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleShiftTypeChange = (st: ShiftType) => {
    let startTime = '';
    let endTime = '';

    if (shiftTimeConfigs[st]) {
      startTime = shiftTimeConfigs[st].startTime;
      endTime = shiftTimeConfigs[st].endTime;
    } else if (st === 'Pagi (Opening)') {
      startTime = '07:00';
      endTime = '15:00';
    } else if (st === 'Siang (Middle)') {
      startTime = '11:00';
      endTime = '19:00';
    } else if (st === 'Malam (Closing)') {
      startTime = '15:00';
      endTime = '23:00';
    } else if (st === 'Full Shift') {
      startTime = '09:00';
      endTime = '21:00';
    }

    setFormData(prev => ({
      ...prev,
      shiftType: st,
      startTime,
      endTime,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = users.find(u => u.id === formData.userId);
    if (!targetUser) {
      setFeedback({ type: 'error', message: 'Karyawan tidak ditemukan!' });
      return;
    }

    if (editingSchedule) {
      const res = updateShiftSchedule(editingSchedule.id, {
        userId: formData.userId,
        employeeName: targetUser.name,
        role: targetUser.role,
        department: targetUser.roleTitle || targetUser.role,
        date: formData.date,
        shiftType: formData.shiftType,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        notes: formData.notes.trim() || undefined,
        assignedBy: currentUser.name,
        assignedRole: currentUser.role,
      });
      setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    } else {
      const res = addShiftSchedule({
        userId: formData.userId,
        employeeName: targetUser.name,
        role: targetUser.role,
        department: targetUser.roleTitle || targetUser.role,
        date: formData.date,
        shiftType: formData.shiftType,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        notes: formData.notes.trim() || undefined,
        assignedBy: currentUser.name,
        assignedRole: currentUser.role,
      });
      setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    }

    setIsModalOpen(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDelete = (id: string) => {
    const res = deleteShiftSchedule(id);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    setIsModalOpen(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Copy schedule from this week to next week
  const handleCopyWeekToNext = () => {
    const thisWeekDateStrs = weekDays.map(d => d.dateStr);
    const thisWeekSchedules = shiftSchedules.filter(s => thisWeekDateStrs.includes(s.date));

    if (thisWeekSchedules.length === 0) {
      setFeedback({ type: 'error', message: 'Tidak ada jadwal di minggu ini yang dapat disalin.' });
      return;
    }

    const nextWeekSchedules = thisWeekSchedules.map(s => {
      const d = new Date(s.date);
      d.setDate(d.getDate() + 7);
      const nextDateStr = d.toISOString().slice(0, 10);
      return {
        userId: s.userId,
        employeeName: s.employeeName,
        role: s.role,
        department: s.department,
        date: nextDateStr,
        shiftType: s.shiftType,
        startTime: s.startTime,
        endTime: s.endTime,
        notes: s.notes,
        assignedBy: currentUser.name,
        assignedRole: currentUser.role,
      };
    });

    const res = bulkAssignShiftSchedules(nextWeekSchedules);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    setWeekOffset(prev => prev + 1); // Move view to next week to show result
    setTimeout(() => setFeedback(null), 4000);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = shiftSchedules.map((s, idx) => ({
      'No': idx + 1,
      'Tanggal': s.date,
      'Nama Karyawan': s.employeeName,
      'Peran / Jabatan': s.department || s.role,
      'Tipe Shift': s.shiftType,
      'Jam Kerja': s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.shiftType === 'Libur (Off)' ? 'Libur' : '-'),
      'Catatan Tugas': s.notes || '-',
      'Ditetapkan Oleh': `${s.assignedBy} (${s.assignedRole})`
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Info': 'Tidak ada data jadwal shift' }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Roster Shift Karyawan');
    XLSX.writeFile(workbook, `Jadwal_Shift_${branding.outletName.replace(/\s+/g, '_')}_${weekDays[0].dateStr}.xlsx`);
  };

  // Today's shift list
  const todaySchedules = useMemo(() => {
    return shiftSchedules.filter(s => s.date === todayStr);
  }, [shiftSchedules, todayStr]);

  // My shift list
  const mySchedules = useMemo(() => {
    return shiftSchedules
      .filter(s => s.userId === currentUser.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [shiftSchedules, currentUser.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            Manajemen Tim & Sumber Daya Manusia
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Jadwal Shift Kerja (Roster)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar jam kerja & pembagian giliran kerja operasional resto (Pagi, Siang, Malam, Libur, Cuti)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-xs"
            title="Download Excel Jadwal Roster"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Export Excel
          </button>

          {canEdit && (
            <>
              <button
                onClick={() => {
                  setTempShiftConfigs(shiftTimeConfigs);
                  setIsConfigShiftModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors shadow-xs"
                title="Atur jam masuk dan pulang setiap shift operasional resto"
              >
                <Sliders className="w-4 h-4 text-amber-700" />
                Custom Jam Shift
              </button>

              <button
                onClick={handleCopyWeekToNext}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-blue-300 bg-blue-50 text-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors shadow-xs"
                title="Salin pola jadwal minggu ini ke minggu berikutnya"
              >
                <Copy className="w-4 h-4 text-blue-700" />
                Salin ke Minggu Depan
              </button>

              <button
                onClick={() => handleOpenAssign()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tetapkan Shift
              </button>
            </>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          {feedback.message}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setViewTab('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewTab === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matriks Mingguan
          </button>
          <button
            onClick={() => setViewTab('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewTab === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shift Hari Ini
          </button>
          <button
            onClick={() => setViewTab('my_schedule')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewTab === 'my_schedule' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jadwal Saya ({currentUser.name})
          </button>
        </div>

        {/* Week Navigator */}
        {viewTab === 'week' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Minggu Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2">
              {weekDays[0].dateStr} s/d {weekDays[6].dateStr}
            </span>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Minggu Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-[11px] font-bold text-amber-600 hover:underline px-1"
              >
                Minggu Ini
              </button>
            )}
          </div>
        )}
      </div>

      {/* VIEW: WEEKLY MATRIX */}
      {viewTab === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-3.5 px-4 w-48 shrink-0 bg-slate-50 sticky left-0 z-10 border-r border-slate-200">
                    Karyawan & Divisi
                  </th>
                  {weekDays.map(day => (
                    <th 
                      key={day.dateStr} 
                      className={`py-3 px-3 text-center min-w-[130px] border-r border-slate-200 last:border-r-0 ${
                        day.isToday ? 'bg-amber-50/80 text-amber-950 font-black' : ''
                      }`}
                    >
                      <div className="text-[11px] uppercase tracking-wider text-slate-500">
                        {day.dayName}
                      </div>
                      <div className={`text-sm mt-0.5 ${day.isToday ? 'text-amber-600 font-black' : 'text-slate-800'}`}>
                        {day.dayNumber} {new Date(day.dateStr).toLocaleString('id-ID', { month: 'short' })}
                      </div>
                      {day.isToday && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-slate-950 font-black">
                          HARI INI
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => {
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Employee Info Header Column */}
                      <td className="py-3 px-4 bg-white sticky left-0 z-10 border-r border-slate-200 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160'} 
                            alt={user.name} 
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <div className="truncate">
                            <div className="font-bold text-slate-900 truncate">{user.name}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{user.roleTitle || user.role}</div>
                          </div>
                        </div>
                      </td>

                      {/* Day Columns */}
                      {weekDays.map(day => {
                        const sched = shiftSchedules.find(s => s.userId === user.id && s.date === day.dateStr);
                        const cfg = sched ? (SHIFT_CONFIG[sched.shiftType] || SHIFT_CONFIG['Pagi (Opening)']) : null;

                        return (
                          <td 
                            key={day.dateStr} 
                            className={`py-2 px-2 text-center border-r border-slate-100 last:border-r-0 align-top ${
                              day.isToday ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            {sched && cfg ? (
                              <div 
                                onClick={() => canEdit && handleOpenAssign(user, day.dateStr)}
                                className={`group p-2 rounded-xl border text-left cursor-pointer transition-all hover:shadow-xs ${cfg.bgBadge}`}
                                title={canEdit ? 'Klik untuk mengubah shift' : sched.shiftType}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-[11px] truncate">
                                    {sched.shiftType}
                                  </span>
                                  {canEdit && <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </div>
                                <div className="text-[10px] opacity-85 mt-0.5">
                                  {sched.startTime && sched.endTime ? `${sched.startTime} - ${sched.endTime}` : cfg.time}
                                </div>
                                {sched.notes && (
                                  <div className="text-[9px] truncate opacity-75 mt-1 border-t border-current/20 pt-0.5 italic">
                                    {sched.notes}
                                  </div>
                                )}
                              </div>
                            ) : (
                              canEdit ? (
                                <button
                                  onClick={() => handleOpenAssign(user, day.dateStr)}
                                  className="w-full h-12 rounded-xl border border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-300 hover:text-amber-600 flex items-center justify-center transition-all group"
                                  title={`Tetapkan shift untuk ${user.name} (${day.dateStr})`}
                                >
                                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-300 block py-4">-</span>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: TODAY'S SHIFTS */}
      {viewTab === 'today' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-black text-slate-900 text-sm">Daftar Shift Karyawan Hari Ini</h3>
                <p className="text-xs text-slate-500">Tanggal: {todayStr}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {todaySchedules.length} Karyawan Terjadwal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {todaySchedules.length === 0 ? (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
                Belum ada pembagian shift untuk hari ini. Leader/Manager dapat menetapkan shift di tab Matriks Mingguan.
              </div>
            ) : (
              todaySchedules.map(sched => {
                const cfg = SHIFT_CONFIG[sched.shiftType] || SHIFT_CONFIG['Pagi (Opening)'];
                const Icon = cfg.icon;

                return (
                  <div key={sched.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${cfg.bgBadge}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{sched.employeeName}</div>
                        <div className="text-xs text-slate-400">{sched.department || sched.role}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.bgBadge}`}>
                            {sched.shiftType}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {sched.startTime && sched.endTime ? `${sched.startTime} - ${sched.endTime}` : cfg.time}
                          </span>
                        </div>
                        {sched.notes && (
                          <div className="text-[11px] text-slate-500 italic mt-1.5">
                            Catatan: {sched.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => handleOpenAssign({ id: sched.userId, name: sched.employeeName }, sched.date)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                        title="Edit Shift"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW: MY SCHEDULE */}
      {viewTab === 'my_schedule' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <img 
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160'} 
                alt={currentUser.name} 
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h3 className="font-black text-slate-900 text-sm">Jadwal Shift Kerja Pribadi: {currentUser.name}</h3>
                <p className="text-xs text-slate-500">{currentUser.roleTitle || currentUser.role} • Restoran {branding.outletName}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              {mySchedules.length} Hari Shift Terdaftar
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {mySchedules.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada jadwal shift yang terdaftar atas nama akun Anda. Silakan hubungi Leader / Manager resto.
              </div>
            ) : (
              mySchedules.map(sched => {
                const cfg = SHIFT_CONFIG[sched.shiftType] || SHIFT_CONFIG['Pagi (Opening)'];
                const isToday = sched.date === todayStr;

                return (
                  <div key={sched.id} className={`py-3 flex items-center justify-between ${isToday ? 'bg-amber-50/50 px-3 rounded-xl' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 text-center">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          {new Date(sched.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                        </div>
                        <div className="text-base font-black text-slate-900">
                          {new Date(sched.date).getDate()}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.bgBadge}`}>
                            {sched.shiftType}
                          </span>
                          {isToday && (
                            <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-md">
                              HARI INI
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {sched.startTime && sched.endTime ? `${sched.startTime} - ${sched.endTime} WIB` : cfg.time}
                        </div>
                        {sched.notes && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5">Catatan: {sched.notes}</div>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      <div>Ditugaskan oleh:</div>
                      <div className="font-semibold text-slate-700">{sched.assignedBy}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Assign / Edit Shift Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingSchedule ? 'Ubah Shift Karyawan' : 'Tetapkan Shift Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Pengaturan jadwal kerja tim operasional</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Karyawan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Karyawan *</label>
                <select
                  required
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-amber-400 focus:bg-white font-medium cursor-pointer"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleTitle || u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Shift *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              {/* Tipe Shift */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipe Shift *</label>
                <select
                  value={formData.shiftType}
                  onChange={(e) => handleShiftTypeChange(e.target.value as ShiftType)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-amber-400 focus:bg-white font-semibold cursor-pointer"
                >
                  <option value="Pagi (Opening)">☀️ Pagi (Opening) 07:00 - 15:00</option>
                  <option value="Siang (Middle)">⛅ Siang (Middle) 11:00 - 19:00</option>
                  <option value="Malam (Closing)">🌙 Malam (Closing) 15:00 - 23:00</option>
                  <option value="Full Shift">⚡ Full Shift 09:00 - 21:00</option>
                  <option value="Libur (Off)">☕ Libur (Day Off)</option>
                  <option value="Cuti">✈️ Cuti Resmi</option>
                  <option value="Sakit">🏥 Izin Sakit</option>
                </select>
              </div>

              {formData.shiftType !== 'Libur (Off)' && formData.shiftType !== 'Cuti' && formData.shiftType !== 'Sakit' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jam Mulai</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-amber-400 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jam Selesai</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-amber-400 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Catatan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tugas / Penugasan Khusus</label>
                <input
                  type="text"
                  placeholder="Contoh: Bertugas di Bar, Prep Sayur Dapur, Kasir 1"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingSchedule ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingSchedule.id)}
                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs cursor-pointer"
                  >
                    Simpan Jadwal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CUSTOM JAM SHIFT KERJA (MANAGER CONFIG) */}
      {isConfigShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Custom Jam Kerja Shift (Manager)</h3>
                  <p className="text-xs text-slate-500">Atur jam masuk dan pulang setiap shift untuk operasional resto</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigShiftModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Perubahan jam kerja ini akan menjadi acuan baku jam masuk dan pulang saat penetapan jadwal baru serta validasi keterlambatan absensi GPS karyawan.
                </span>
              </div>

              {/* Shift 1: Pagi (Opening) */}
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span>Shift Pagi (Opening)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Jam Masuk</label>
                    <input
                      type="time"
                      value={tempShiftConfigs['Pagi (Opening)']?.startTime || '07:00'}
                      onChange={(e) => setTempShiftConfigs(prev => ({
                        ...prev,
                        'Pagi (Opening)': { ...prev['Pagi (Opening)'], startTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Jam Pulang</label>
                    <input
                      type="time"
                      value={tempShiftConfigs['Pagi (Opening)']?.endTime || '15:00'}
                      onChange={(e) => setTempShiftConfigs(prev => ({
                        ...prev,
                        'Pagi (Opening)': { ...prev['Pagi (Opening)'], endTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Shift 2: Siang (Middle) */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-950 text-xs">
                  <Sunset className="w-4 h-4 text-blue-600" />
                  <span>Shift Siang (Middle)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Jam Masuk</label>
                    <input
                      type="time"
                      value={tempShiftConfigs['Siang (Middle)']?.startTime || '11:00'}
                      onChange={(e) => setTempShiftConfigs(prev => ({
                        ...prev,
                        'Siang (Middle)': { ...prev['Siang (Middle)'], startTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Jam Pulang</label>
                    <input
                      type="time"
                      value={tempShiftConfigs['Siang (Middle)']?.endTime || '19:00'}
                      onChange={(e) => setTempShiftConfigs(prev => ({
                        ...prev,
                        'Siang (Middle)': { ...prev['Siang (Middle)'], endTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Shift 3: Malam (Closing) */}
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-950 text-xs">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>Shift Malam (Closing)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Jam Masuk</label>
                    <input
                      type="time"
                      value={tempShiftConfigs['Malam (Closing)']?.startTime || '15:00'}
                      onChange={(e) => setTempShiftConfigs(prev => ({
                        ...prev,
                        'Malam (Closing)': { ...prev['Malam (Closing)'], startTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Jam Pulang</label>
                    <input
                      type="time"
                      value={tempShiftConfigs['Malam (Closing)']?.endTime || '23:00'}
                      onChange={(e) => setTempShiftConfigs(prev => ({
                        ...prev,
                        'Malam (Closing)': { ...prev['Malam (Closing)'], endTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Shift 4: Full Shift */}
              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-950 text-xs">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Full Shift</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Jam Masuk</label>
                    <input
                      type="time"
                      value={tempShiftConfigs['Full Shift']?.startTime || '09:00'}
                      onChange={(e) => setTempShiftConfigs(prev => ({
                        ...prev,
                        'Full Shift': { ...prev['Full Shift'], startTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Jam Pulang</label>
                    <input
                      type="time"
                      value={tempShiftConfigs['Full Shift']?.endTime || '21:00'}
                      onChange={(e) => setTempShiftConfigs(prev => ({
                        ...prev,
                        'Full Shift': { ...prev['Full Shift'], endTime: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfigShiftModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = updateShiftTimeConfigs(tempShiftConfigs);
                  setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
                  setIsConfigShiftModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Jam Shift</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
