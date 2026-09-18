import React, { useState, useMemo } from 'react';
import { useResto } from '../../context/RestoContext';
import { User, UserRole, EmployeeContractStatus } from '../../types';
import { 
  UserPlus, 
  Search, 
  KeyRound, 
  Edit3, 
  Trash2, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  X, 
  Upload, 
  Calendar, 
  Phone, 
  MapPin, 
  Mail, 
  FileText, 
  Lock,
  UserCheck,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Briefcase,
  CreditCard,
  HeartHandshake,
  GraduationCap,
  Clock
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';
import { exportEmployeesToExcel } from '../../utils/excelExport';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80'
];

const DEFAULT_ROLE_TITLES: Record<UserRole, string> = {
  manager: 'Restaurant General Manager',
  head_kitchen: 'Head Kitchen & Executive Chef',
  head_floor: 'Head Floor & Beverage Manager',
  kasir: 'Senior Cashier & Front Desk',
  staff: 'Staff Operasional Restoran',
  purchasing: 'Admin Purchasing & Logistik'
};

const CONTRACT_STATUS_LABELS: Record<EmployeeContractStatus, { label: string; badge: string }> = {
  tetap: { label: 'Tetap (PKWTT)', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  kontrak: { label: 'Kontrak (PKWT)', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  dw: { label: 'Daily Worker', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  partime: { label: 'Part Time', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  casual: { label: 'Casual (Harian)', badge: 'bg-slate-100 text-slate-800 border-slate-200' }
};

export const UserManagementTab: React.FC = () => {
  const { 
    currentUser, 
    users, 
    currentOutlet,
    createUser, 
    updateUser, 
    deleteUser, 
    adminResetPassword,
    expiringContractEmployees,
    branding
  } = useResto();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [contractFilter, setContractFilter] = useState<string>('all');

  // Modals & States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Toast / Feedback message
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Auto-generate next employee ID
  const generateEmployeeId = () => {
    const year = new Date().getFullYear();
    const count = users.length + 1;
    return `EMP-${year}-${String(count).padStart(3, '0')}`;
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'staff' as UserRole,
    roleTitle: DEFAULT_ROLE_TITLES.staff,
    email: '',
    password: '',
    avatar: AVATAR_PRESETS[0],
    birthDate: '',
    phone: '',
    address: '',
    bio: '',
    isMasterAdmin: false,
    // HRD Fields
    employeeId: '',
    contractStatus: 'tetap' as EmployeeContractStatus,
    contractStartDate: new Date().toISOString().split('T')[0],
    contractEndDate: '',
    nik: '',
    gender: 'L' as 'L' | 'P',
    bloodType: 'O',
    lastEducation: 'SMA/SMK',
    npwp: '',
    bpjsKetenagakerjaan: '',
    bpjsKesehatan: '',
    bankName: 'BCA',
    bankAccountNumber: '',
    bankAccountHolder: '',
    emergencyContactName: '',
    emergencyContactRelation: 'Orang Tua',
    emergencyContactPhone: '',
  });

  const isMasterAdmin = Boolean(currentUser.isMasterAdmin || currentUser.role === 'manager');

  const resetForm = () => {
    setModalFeedback(null);
    setFormData({
      name: '',
      username: '',
      role: 'staff',
      roleTitle: DEFAULT_ROLE_TITLES.staff,
      email: '',
      password: '1234',
      avatar: AVATAR_PRESETS[0],
      birthDate: '',
      phone: '',
      address: '',
      bio: '',
      isMasterAdmin: false,
      employeeId: generateEmployeeId(),
      contractStatus: 'tetap',
      contractStartDate: new Date().toISOString().split('T')[0],
      contractEndDate: '',
      nik: '',
      gender: 'L',
      bloodType: 'O',
      lastEducation: 'SMA/SMK',
      npwp: '',
      bpjsKetenagakerjaan: '',
      bpjsKesehatan: '',
      bankName: 'BCA',
      bankAccountNumber: '',
      bankAccountHolder: '',
      emergencyContactName: '',
      emergencyContactRelation: 'Orang Tua',
      emergencyContactPhone: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setModalFeedback(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      username: u.username,
      role: u.role,
      roleTitle: u.roleTitle,
      email: u.email,
      password: '', // leave empty unless changing
      avatar: u.avatar,
      birthDate: u.birthDate || '',
      phone: u.phone || '',
      address: u.address || '',
      bio: u.bio || '',
      isMasterAdmin: Boolean(u.isMasterAdmin),
      employeeId: u.employeeId || `EMP-${u.id}`,
      contractStatus: u.contractStatus || 'tetap',
      contractStartDate: u.contractStartDate || u.joinDate || '',
      contractEndDate: u.contractEndDate || '',
      nik: u.nik || '',
      gender: (u.gender === 'P' ? 'P' : 'L') as 'L' | 'P',
      bloodType: u.bloodType || 'O',
      lastEducation: u.lastEducation || 'SMA/SMK',
      npwp: u.npwp || '',
      bpjsKetenagakerjaan: u.bpjsKetenagakerjaan || '',
      bpjsKesehatan: u.bpjsKesehatan || '',
      bankName: u.bankName || 'BCA',
      bankAccountNumber: u.bankAccountNumber || '',
      bankAccountHolder: u.bankAccountHolder || u.name,
      emergencyContactName: u.emergencyContactName || '',
      emergencyContactRelation: u.emergencyContactRelation || 'Orang Tua',
      emergencyContactPhone: u.emergencyContactPhone || '',
    });
  };

  const handleRoleChange = (newRole: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      roleTitle: DEFAULT_ROLE_TITLES[newRole] || prev.roleTitle,
      isMasterAdmin: newRole === 'manager' ? prev.isMasterAdmin : false
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setFeedback({ text: 'Ukuran foto maksimal 8MB.', type: 'error' });
      return;
    }
    try {
      const compressed = await compressImageFile(file, 180, 180, 0.7);
      setFormData(prev => ({ ...prev, avatar: compressed }));
      setFeedback({ text: 'Foto avatar berhasil dimuat dan dioptimasi.', type: 'success' });
    } catch {
      setFeedback({ text: 'Gagal memproses gambar.', type: 'error' });
    }
  };

  const handleExportExcel = () => {
    try {
      exportEmployeesToExcel(users, branding.outletName);
      setFeedback({ text: 'File Excel data karyawan berhasil diunduh.', type: 'success' });
    } catch (err) {
      setFeedback({ text: 'Gagal mengekspor data ke Excel.', type: 'error' });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalFeedback(null);

    const cleanName = formData.name.trim();
    if (!cleanName) {
      setModalFeedback({ text: 'Nama Lengkap karyawan wajib diisi.', type: 'error' });
      return;
    }

    const autoUsername = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || `karyawan${Date.now().toString().slice(-4)}`;
    const cleanUsername = (formData.username.trim() || autoUsername).toLowerCase().replace(/\s+/g, '');
    const cleanPassword = (formData.password && formData.password.trim().length >= 4) 
      ? formData.password.trim() 
      : '1234';

    let resolvedEndDate = formData.contractEndDate;
    if (formData.contractStatus === 'kontrak' && !resolvedEndDate) {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      resolvedEndDate = nextYear.toISOString().split('T')[0];
    }

    const res = createUser({
      name: cleanName,
      username: cleanUsername,
      role: formData.role,
      roleTitle: formData.roleTitle.trim() || DEFAULT_ROLE_TITLES[formData.role] || 'Staf Resto',
      email: formData.email.trim() || `${cleanUsername}@imahkayu.id`,
      password: cleanPassword,
      avatar: formData.avatar || AVATAR_PRESETS[0],
      birthDate: formData.birthDate,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      bio: formData.bio.trim(),
      isMasterAdmin: formData.isMasterAdmin,
      outletId: currentOutlet?.id || 'outlet-1',
      // HRD fields
      employeeId: formData.employeeId.trim() || generateEmployeeId(),
      contractStatus: formData.contractStatus,
      contractStartDate: formData.contractStartDate || new Date().toISOString().split('T')[0],
      contractEndDate: formData.contractStatus === 'kontrak' ? resolvedEndDate : undefined,
      nik: formData.nik.trim(),
      gender: formData.gender,
      bloodType: formData.bloodType,
      lastEducation: formData.lastEducation.trim(),
      npwp: formData.npwp.trim(),
      bpjsKetenagakerjaan: formData.bpjsKetenagakerjaan.trim(),
      bpjsKesehatan: formData.bpjsKesehatan.trim(),
      bankName: formData.bankName.trim(),
      bankAccountNumber: formData.bankAccountNumber.trim(),
      bankAccountHolder: formData.bankAccountHolder.trim() || cleanName,
      emergencyContactName: formData.emergencyContactName.trim(),
      emergencyContactRelation: formData.emergencyContactRelation.trim(),
      emergencyContactPhone: formData.emergencyContactPhone.trim(),
    });

    if (res.success) {
      setFeedback({ text: res.message, type: 'success' });
      setModalFeedback(null);
      setIsCreateModalOpen(false);
      resetForm();
    } else {
      setModalFeedback({ text: res.message, type: 'error' });
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!formData.name.trim() || !formData.username.trim()) {
      setFeedback({ text: 'Nama dan Username wajib diisi.', type: 'error' });
      return;
    }
    if (formData.contractStatus === 'kontrak' && !formData.contractEndDate) {
      setFeedback({ text: 'Untuk status Kontrak, Tanggal Berakhir Kontrak wajib diisi.', type: 'error' });
      return;
    }

    const updates: Partial<User> = {
      name: formData.name.trim(),
      username: formData.username.trim().toLowerCase().replace(/\s+/g, ''),
      role: formData.role,
      roleTitle: formData.roleTitle.trim(),
      email: formData.email.trim(),
      avatar: formData.avatar,
      birthDate: formData.birthDate,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      bio: formData.bio.trim(),
      isMasterAdmin: formData.isMasterAdmin,
      // HRD fields
      employeeId: formData.employeeId.trim(),
      contractStatus: formData.contractStatus,
      contractStartDate: formData.contractStartDate,
      contractEndDate: formData.contractStatus === 'kontrak' ? formData.contractEndDate : undefined,
      nik: formData.nik.trim(),
      gender: formData.gender,
      bloodType: formData.bloodType,
      lastEducation: formData.lastEducation.trim(),
      npwp: formData.npwp.trim(),
      bpjsKetenagakerjaan: formData.bpjsKetenagakerjaan.trim(),
      bpjsKesehatan: formData.bpjsKesehatan.trim(),
      bankName: formData.bankName.trim(),
      bankAccountNumber: formData.bankAccountNumber.trim(),
      bankAccountHolder: formData.bankAccountHolder.trim(),
      emergencyContactName: formData.emergencyContactName.trim(),
      emergencyContactRelation: formData.emergencyContactRelation.trim(),
      emergencyContactPhone: formData.emergencyContactPhone.trim(),
    };

    if (formData.password && formData.password.length >= 4) {
      updates.password = formData.password;
    }

    const res = updateUser(editingUser.id, updates);
    if (res.success) {
      setFeedback({ text: res.message, type: 'success' });
      setEditingUser(null);
    } else {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    const res = deleteUser(deletingUser.id);
    if (res.success) {
      setFeedback({ text: res.message, type: 'success' });
      setDeletingUser(null);
    } else {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset) return;
    if (!newPasswordInput || newPasswordInput.length < 4) {
      setFeedback({ text: 'Password baru minimal 4 karakter.', type: 'error' });
      return;
    }

    const res = adminResetPassword(selectedUserForReset.id, newPasswordInput);
    if (res.success) {
      setFeedback({ text: res.message, type: 'success' });
      setSelectedUserForReset(null);
      setNewPasswordInput('');
    } else {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.nik && u.nik.includes(searchQuery)) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesContract = contractFilter === 'all' || u.contractStatus === contractFilter;
    return matchesSearch && matchesRole && matchesContract;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'head_kitchen':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'head_floor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'kasir':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'staff':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'purchasing':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>Manajemen Pengguna & HRD Karyawan</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {users.length} Karyawan
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola profil lengkap HRD, status kontrak kerja (Casual, Part-time, DW, Kontrak, Tetap), ID otomatis, dan export data ke Excel.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            title="Download seluruh biodata karyawan ke format Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          {isMasterAdmin && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>+ Tambah Karyawan Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Contract Expiration Banner (< 2 Months / 60 Days) */}
      {expiringContractEmployees.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <span>Peringatan Masa Kontrak Karyawan</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px]">
                    {expiringContractEmployees.length} Karyawan Sisa &le; 2 Bulan
                  </span>
                </h4>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                Karyawan di bawah ini memiliki masa kontrak kerja PKWT yang akan berakhir dalam 60 hari ke depan. Segera lakukan peninjauan kinerja dan koordinasikan perpanjangan adendum:
              </p>
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {expiringContractEmployees.map(item => {
                  const u = item.user;
                  const diffDays = item.daysRemaining;
                  const isExpired = diffDays < 0;

                  return (
                    <div key={u.id} className="p-2.5 bg-white/90 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {u.employeeId || `@${u.username}`} • Berakhir: {u.contractEndDate}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                        isExpired 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {isExpired ? 'TELAH HABIS' : `Sisa ${diffDays} Hari`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ID, nama, NIK, username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 transition-colors focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Role filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white cursor-pointer"
            >
              <option value="all">Semua Peran ({users.length})</option>
              <option value="manager">Manager</option>
              <option value="head_kitchen">Head Kitchen</option>
              <option value="head_floor">Head Floor</option>
              <option value="kasir">Kasir</option>
              <option value="staff">Staff</option>
              <option value="purchasing">Purchasing</option>
            </select>
          </div>

          {/* Contract status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Kontrak:</span>
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white cursor-pointer"
            >
              <option value="all">Semua Kontrak</option>
              <option value="tetap">Karyawan Tetap</option>
              <option value="kontrak">Kontrak (PKWT)</option>
              <option value="dw">Daily Worker</option>
              <option value="partime">Part Time</option>
              <option value="casual">Casual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Karyawan & ID</th>
              <th className="py-3 px-4">Peran / Jabatan</th>
              <th className="py-3 px-4">Status Kontrak</th>
              <th className="py-3 px-4">Masa Berlaku</th>
              <th className="py-3 px-4">Kontak & NIK</th>
              <th className="py-3 px-4 text-right">Aksi HRD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                  Tidak ada karyawan yang sesuai dengan pencarian atau filter.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isCurrent = u.id === currentUser.id;
                const statusMeta = CONTRACT_STATUS_LABELS[u.contractStatus || 'tetap'];
                
                // Expiration logic
                let expiryBadge = null;
                if (u.contractStatus === 'kontrak' && u.contractEndDate) {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const end = new Date(u.contractEndDate);
                  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  if (diffDays < 0) {
                    expiryBadge = (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Habis ({Math.abs(diffDays)} hari lalu)
                      </span>
                    );
                  } else if (diffDays <= 60) {
                    expiryBadge = (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-fit animate-pulse">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Sisa {diffDays} hari!
                      </span>
                    );
                  } else {
                    expiryBadge = (
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Sisa {diffDays} hari
                      </span>
                    );
                  }
                }

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* User Identity & ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="truncate">{u.name}</span>
                            {u.isMasterAdmin && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                MASTER ADMIN
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-indigo-600">
                                (Anda)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-mono font-bold text-indigo-600">{u.employeeId || `EMP-${u.id}`}</span>
                            <span>•</span>
                            <span className="font-mono text-slate-400">@{u.username}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadge(u.role)}`}>
                        {u.roleTitle || u.role}
                      </span>
                    </td>

                    {/* Contract Status */}
                    <td className="py-3 px-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${statusMeta.badge}`}>
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Expiration Info */}
                    <td className="py-3 px-4">
                      {u.contractStatus === 'kontrak' ? (
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-bold text-slate-700">
                            s/d {u.contractEndDate || '-'}
                          </div>
                          {expiryBadge}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Mulai: {u.contractStartDate || u.joinDate || '-'}
                        </span>
                      )}
                    </td>

                    {/* Contact & NIK */}
                    <td className="py-3 px-4">
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div className="font-semibold text-slate-800">{u.phone || '-'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          NIK: {u.nik ? `${u.nik.slice(0, 6)}******${u.nik.slice(-4)}` : 'Belum diisi'}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            setSelectedUserForReset(u);
                            setNewPasswordInput('');
                          }}
                          title="Reset Password Pengguna"
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-all border border-amber-200 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit User - Master Admin or Manager */}
                        {isMasterAdmin && (
                          <button
                            onClick={() => openEditModal(u)}
                            title="Edit Biodata & Status HRD Karyawan"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete User */}
                        {isMasterAdmin && (
                          <button
                            onClick={() => setDeletingUser(u)}
                            disabled={isCurrent || (u.isMasterAdmin && u.role === 'manager')}
                            title={isCurrent ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Karyawan'}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Tambah Karyawan Baru & Biodata Lengkap HRD</h3>
                  <p className="text-[11px] text-slate-500">ID karyawan otomatis generate, tentukan status kontrak dan data payroll</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              
              {/* In-Modal Feedback Alert */}
              {modalFeedback && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                  modalFeedback.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {modalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{modalFeedback.text}</span>
                </div>
              )}

              {/* Avatar Selection */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <img
                  src={formData.avatar}
                  alt="preview"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/30 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <span className="text-xs font-bold text-slate-800 block">Foto Profil Karyawan</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatar: preset }))}
                        className={`w-7 h-7 rounded-lg overflow-hidden border transition-all ${
                          formData.avatar === preset ? 'ring-2 ring-indigo-600 scale-105' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <label className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer hover:bg-slate-100 flex items-center gap-1">
                      <Upload className="w-3 h-3 text-indigo-600" />
                      <span>Upload</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Status Kontrak & ID Karyawan */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 border-b border-indigo-100/60 pb-1">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <span>Status Kepegawaian HRD & Kontrak Kerja</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ID Karyawan (Otomatis) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.employeeId}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Status Kontrak Karyawan *
                    </label>
                    <select
                      value={formData.contractStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, contractStatus: e.target.value as EmployeeContractStatus }))}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      <option value="tetap">Tetap (PKWTT)</option>
                      <option value="kontrak">Kontrak (PKWT)</option>
                      <option value="dw">Daily Worker (DW)</option>
                      <option value="partime">Part Time</option>
                      <option value="casual">Casual (Harian Lepas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tanggal Mulai Kerja
                    </label>
                    <input
                      type="date"
                      value={formData.contractStartDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, contractStartDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* If contract: end date */}
                {formData.contractStatus === 'kontrak' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Tanggal Berakhir Kontrak *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.contractEndDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, contractEndDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div className="flex items-center text-xs text-amber-800">
                      <span>
                        ⚠️ Sistem akan memunculkan notifikasi peringatan jika masa kontrak tersisa kurang dari 2 bulan.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rian Pratama"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username Login *</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: rian"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              {/* Role & Role Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role / Peran Sistem *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
                  >
                    <option value="staff">Staff Operasional (Standar)</option>
                    <option value="kasir">Kasir (Front Office)</option>
                    <option value="head_floor">Head Floor (Lantai & Bar)</option>
                    <option value="head_kitchen">Head Kitchen (Dapur)</option>
                    <option value="purchasing">Admin Purchasing (Pengadaan)</option>
                    <option value="manager">Restaurant Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan / Titel Tampilan</label>
                  <input
                    type="text"
                    value={formData.roleTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, roleTitle: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              {/* Password & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password Awal *</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 4 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@resto.id"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              {/* Data Kependudukan & HRD: NIK, Jenis Kelamin, Gol Darah, Pendidikan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">NIK (KTP 16 Digit)</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="3271xxxxxxxxxxxx"
                    value={formData.nik}
                    onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'L' | 'P' }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white cursor-pointer"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Golongan Darah</label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData(prev => ({ ...prev, bloodType: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white cursor-pointer"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
              </div>

              {/* Biodata: Phone & Birthdate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              {/* BPJS & Rekening Bank */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Data BPJS & Rekening Payroll Gaji</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">BPJS Ketenagakerjaan</label>
                    <input
                      type="text"
                      placeholder="No. KPJ"
                      value={formData.bpjsKetenagakerjaan}
                      onChange={(e) => setFormData(prev => ({ ...prev, bpjsKetenagakerjaan: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">BPJS Kesehatan</label>
                    <input
                      type="text"
                      placeholder="000xxxx"
                      value={formData.bpjsKesehatan}
                      onChange={(e) => setFormData(prev => ({ ...prev, bpjsKesehatan: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">NPWP</label>
                    <input
                      type="text"
                      placeholder="xx.xxx.xxx"
                      value={formData.npwp}
                      onChange={(e) => setFormData(prev => ({ ...prev, npwp: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama Bank</label>
                    <input
                      type="text"
                      placeholder="BCA / Mandiri / BRI"
                      value={formData.bankName}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      placeholder="Nomor rekening"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Atas Nama Rekening</label>
                    <input
                      type="text"
                      placeholder="Nama di buku tabungan"
                      value={formData.bankAccountHolder}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankAccountHolder: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Kontak Darurat */}
              <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-2">
                <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-rose-600" />
                  <span>Kontak Darurat (Emergency)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama Kontak</label>
                    <input
                      type="text"
                      placeholder="Nama keluarga"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Hubungan</label>
                    <input
                      type="text"
                      placeholder="Orang Tua / Pasangan"
                      value={formData.emergencyContactRelation}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">No. Telp Darurat</label>
                    <input
                      type="tel"
                      placeholder="08xxxxxxx"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Domisili</label>
                <textarea
                  rows={2}
                  placeholder="Alamat tempat tinggal staf..."
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              {/* Master Admin Checkbox */}
              {formData.role === 'manager' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="create_isMaster"
                    checked={formData.isMasterAdmin}
                    onChange={(e) => setFormData(prev => ({ ...prev, isMasterAdmin: e.target.checked }))}
                    className="w-4 h-4 rounded text-amber-600 accent-amber-600 cursor-pointer"
                  />
                  <label htmlFor="create_isMaster" className="text-xs font-bold text-amber-900 cursor-pointer">
                    Berikan Akses Master Admin (Otoritas penuh audit dan reset)
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Simpan Karyawan Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Edit Biodata & Status HRD Karyawan</h3>
                  <p className="text-[11px] text-slate-500">Perbarui data {editingUser.name} ({formData.employeeId})</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {/* Avatar Selection */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <img
                  src={formData.avatar}
                  alt="preview"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/30 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <span className="text-xs font-bold text-slate-800 block">Foto Profil Karyawan</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatar: preset }))}
                        className={`w-7 h-7 rounded-lg overflow-hidden border transition-all ${
                          formData.avatar === preset ? 'ring-2 ring-indigo-600 scale-105' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <label className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer hover:bg-slate-100 flex items-center gap-1">
                      <Upload className="w-3 h-3 text-indigo-600" />
                      <span>Upload</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Status Kontrak & ID Karyawan */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 border-b border-indigo-100/60 pb-1">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <span>Status Kepegawaian HRD & Kontrak Kerja</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ID Karyawan *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.employeeId}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Status Kontrak Karyawan *
                    </label>
                    <select
                      value={formData.contractStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, contractStatus: e.target.value as EmployeeContractStatus }))}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      <option value="tetap">Tetap (PKWTT)</option>
                      <option value="kontrak">Kontrak (PKWT)</option>
                      <option value="dw">Daily Worker (DW)</option>
                      <option value="partime">Part Time</option>
                      <option value="casual">Casual (Harian Lepas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tanggal Mulai Kerja
                    </label>
                    <input
                      type="date"
                      value={formData.contractStartDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, contractStartDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* If contract: end date */}
                {formData.contractStatus === 'kontrak' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Tanggal Berakhir Kontrak *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.contractEndDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, contractEndDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div className="flex items-center text-xs text-amber-800">
                      <span>
                        ⚠️ Sistem akan memunculkan peringatan otomatis jika masa kontrak tersisa kurang dari 2 bulan.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username Login *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Role & Role Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role / Peran Sistem *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white cursor-pointer"
                  >
                    <option value="staff">Staff Operasional (Standar)</option>
                    <option value="kasir">Kasir (Front Office)</option>
                    <option value="head_floor">Head Floor (Lantai & Bar)</option>
                    <option value="head_kitchen">Head Kitchen (Dapur)</option>
                    <option value="purchasing">Admin Purchasing (Pengadaan)</option>
                    <option value="manager">Restaurant Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan / Titel Tampilan</label>
                  <input
                    type="text"
                    value={formData.roleTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, roleTitle: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password Option & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password Baru (Kosongkan jika tidak diubah)
                  </label>
                  <input
                    type="password"
                    placeholder="Isi jika ingin ganti password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* NIK, Gender, Blood Type, Education */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">NIK (KTP 16 Digit)</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="3271xxxxxxxxxxxx"
                    value={formData.nik}
                    onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'L' | 'P' }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white cursor-pointer"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Golongan Darah</label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData(prev => ({ ...prev, bloodType: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white cursor-pointer"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
              </div>

              {/* Biodata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* BPJS & Rekening Bank */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Data BPJS & Rekening Payroll Gaji</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">BPJS Ketenagakerjaan</label>
                    <input
                      type="text"
                      placeholder="No. KPJ"
                      value={formData.bpjsKetenagakerjaan}
                      onChange={(e) => setFormData(prev => ({ ...prev, bpjsKetenagakerjaan: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">BPJS Kesehatan</label>
                    <input
                      type="text"
                      placeholder="000xxxx"
                      value={formData.bpjsKesehatan}
                      onChange={(e) => setFormData(prev => ({ ...prev, bpjsKesehatan: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">NPWP</label>
                    <input
                      type="text"
                      placeholder="xx.xxx.xxx"
                      value={formData.npwp}
                      onChange={(e) => setFormData(prev => ({ ...prev, npwp: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama Bank</label>
                    <input
                      type="text"
                      placeholder="BCA / Mandiri / BRI"
                      value={formData.bankName}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      placeholder="Nomor rekening"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Atas Nama Rekening</label>
                    <input
                      type="text"
                      placeholder="Nama di buku tabungan"
                      value={formData.bankAccountHolder}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankAccountHolder: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Kontak Darurat */}
              <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-2">
                <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-rose-600" />
                  <span>Kontak Darurat (Emergency)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama Kontak</label>
                    <input
                      type="text"
                      placeholder="Nama keluarga"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Hubungan</label>
                    <input
                      type="text"
                      placeholder="Orang Tua / Pasangan"
                      value={formData.emergencyContactRelation}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">No. Telp Darurat</label>
                    <input
                      type="tel"
                      placeholder="08xxxxxxx"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Domisili</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD POPUP */}
      {selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Reset Password Langsung</span>
              </div>
              <button
                onClick={() => setSelectedUserForReset(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Sebagai Master Admin, Anda dapat mengganti kata sandi untuk akun <strong>{selectedUserForReset.name}</strong> (@{selectedUserForReset.username}) tanpa perlu mengetahui kata sandi lamanya.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Baru Staff *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password baru..."
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForReset(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Terapkan Password Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900">Hapus Akun Pengguna?</h4>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus akun <strong>{deletingUser.name}</strong> (@{deletingUser.username})? Pengguna ini tidak akan bisa login lagi ke sistem.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
