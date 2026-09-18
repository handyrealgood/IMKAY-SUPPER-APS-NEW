import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { 
  X, 
  User, 
  Camera, 
  Calendar, 
  Phone, 
  MapPin, 
  FileText, 
  Mail, 
  Check, 
  AlertCircle,
  Upload,
  CreditCard,
  Building,
  Shield,
  Briefcase,
  AlertTriangle,
  GraduationCap,
  HeartHandshake
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';
import { EmployeeContractStatus } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile } = useResto();
  const isManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  // Basic Account info
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [birthDate, setBirthDate] = useState(currentUser.birthDate || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [bio, setBio] = useState(currentUser.bio || '');

  // HRD & Employment Info
  const [employeeId, setEmployeeId] = useState(currentUser.employeeId || `EMP-${currentUser.id}`);
  const [contractStatus, setContractStatus] = useState<EmployeeContractStatus>(currentUser.contractStatus || 'tetap');
  const [contractStartDate, setContractStartDate] = useState(currentUser.contractStartDate || currentUser.joinDate || '');
  const [contractEndDate, setContractEndDate] = useState(currentUser.contractEndDate || '');
  const [nik, setNik] = useState(currentUser.nik || '');
  const [gender, setGender] = useState<'L' | 'P' | undefined>(currentUser.gender === 'P' ? 'P' : currentUser.gender === 'L' ? 'L' : undefined);
  const [bloodType, setBloodType] = useState(currentUser.bloodType || '');
  const [lastEducation, setLastEducation] = useState(currentUser.lastEducation || '');
  const [npwp, setNpwp] = useState(currentUser.npwp || '');
  const [bpjsKetenagakerjaan, setBpjsKetenagakerjaan] = useState(currentUser.bpjsKetenagakerjaan || '');
  const [bpjsKesehatan, setBpjsKesehatan] = useState(currentUser.bpjsKesehatan || '');
  
  // Bank Account
  const [bankName, setBankName] = useState(currentUser.bankName || 'BCA');
  const [bankAccountNumber, setBankAccountNumber] = useState(currentUser.bankAccountNumber || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(currentUser.bankAccountHolder || currentUser.name);

  // Emergency Contact
  const [emergencyContactName, setEmergencyContactName] = useState(currentUser.emergencyContactName || '');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState(currentUser.emergencyContactRelation || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(currentUser.emergencyContactPhone || '');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  // Check 2 months contract expiration
  const contractExpiryInfo = React.useMemo(() => {
    if (contractStatus !== 'kontrak' || !contractEndDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(contractEndDate);
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      daysRemaining: diffDays,
      isExpired: diffDays < 0,
      isExpiringSoon: diffDays >= 0 && diffDays <= 60
    };
  }, [contractStatus, contractEndDate]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setMessage({ text: 'Ukuran file terlalu besar (maks 8MB).', type: 'error' });
      return;
    }

    try {
      const compressed = await compressImageFile(file, 180, 180, 0.7);
      setAvatar(compressed);
      setMessage({ text: 'Foto berhasil dimuat. Klik Simpan untuk memperbarui.', type: 'success' });
    } catch {
      setMessage({ text: 'Gagal memproses gambar.', type: 'error' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ text: 'Nama lengkap wajib diisi.', type: 'error' });
      return;
    }

    setSaving(true);
    const res = updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      avatar: avatar.trim(),
      birthDate,
      phone: phone.trim(),
      address: address.trim(),
      bio: bio.trim(),
      employeeId: employeeId.trim(),
      contractStatus,
      contractStartDate,
      contractEndDate: contractStatus === 'kontrak' ? contractEndDate : undefined,
      nik: nik.trim(),
      gender,
      bloodType: bloodType.trim(),
      lastEducation: lastEducation.trim(),
      npwp: npwp.trim(),
      bpjsKetenagakerjaan: bpjsKetenagakerjaan.trim(),
      bpjsKesehatan: bpjsKesehatan.trim(),
      bankName: bankName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankAccountHolder: bankAccountHolder.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactRelation: emergencyContactRelation.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
    });

    setSaving(false);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Biodata & Profil Karyawan Lengkap (HRD)</h3>
              <p className="text-[11px] text-slate-500">
                Informasi identitas resmi, status kontrak kerja, BPJS, rekening gaji & kontak darurat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Contract Expiration Alert (Sisa Masa Kontrak < 2 Bulan) */}
        {contractExpiryInfo && (contractExpiryInfo.isExpiringSoon || contractExpiryInfo.isExpired) && (
          <div className={`mx-6 mt-4 p-3.5 rounded-2xl flex items-start gap-3 border ${
            contractExpiryInfo.isExpired 
              ? 'bg-red-50 text-red-900 border-red-200' 
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}>
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${contractExpiryInfo.isExpired ? 'text-red-600' : 'text-amber-600'}`} />
            <div>
              <div className="text-xs font-black uppercase tracking-wide">
                {contractExpiryInfo.isExpired ? 'Masa Kontrak Telah Berakhir' : 'Peringatan Masa Kontrak Karyawan (< 2 Bulan)'}
              </div>
              <p className="text-xs mt-0.5">
                {contractExpiryInfo.isExpired 
                  ? `Kontrak kerja berakhir pada tanggal ${contractEndDate}. Harap segera koordinasikan perpanjangan dengan HRD/Manager.`
                  : `Masa kontrak kerja tersisa ${contractExpiryInfo.daysRemaining} hari lagi (berakhir pada ${contractEndDate}). Segera siapkan evaluasi kinerja atau adendum perpanjangan.`
                }
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="relative group shrink-0">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80'}
                alt={name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-md"
              />
              <label className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-bold">Ganti</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Foto Profil Karyawan</span>
                <span className="text-[11px] text-slate-500">Upload foto wajah Anda atau pilih avatar preset</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <label className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upload Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Preset Avatars */}
                <div className="flex items-center gap-1">
                  {AVATAR_PRESETS.slice(0, 5).map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(presetUrl)}
                      className={`w-7 h-7 rounded-lg overflow-hidden border transition-all ${
                        avatar === presetUrl ? 'ring-2 ring-indigo-600 scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={presetUrl} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Data Identitas Akun & Kontrak Kerja */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Status Kepegawaian & Kontrak HRD</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* ID Karyawan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ID Karyawan (Otomatis)
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={!isManager}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 disabled:opacity-80"
                />
              </div>

              {/* Status Kontrak */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Status Kontrak Kerja *
                </label>
                <select
                  value={contractStatus}
                  onChange={(e) => setContractStatus(e.target.value as EmployeeContractStatus)}
                  disabled={!isManager}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white disabled:opacity-80 cursor-pointer"
                >
                  <option value="tetap">Karyawan Tetap (PKWTT)</option>
                  <option value="kontrak">Karyawan Kontrak (PKWT)</option>
                  <option value="dw">Daily Worker (DW)</option>
                  <option value="partime">Part Time</option>
                  <option value="casual">Casual (Harian Lepas)</option>
                </select>
              </div>

              {/* Tgl Mulai Kerja */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tgl Mulai Bekerja
                </label>
                <input
                  type="date"
                  value={contractStartDate}
                  onChange={(e) => setContractStartDate(e.target.value)}
                  disabled={!isManager}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white disabled:opacity-80"
                />
              </div>
            </div>

            {/* If Kontrak: Show End Date */}
            {contractStatus === 'kontrak' && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Tanggal Berakhir Kontrak *
                  </label>
                  <input
                    type="date"
                    required
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    disabled={!isManager}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div className="flex items-center text-xs text-amber-800">
                  <span>
                    Sistem akan otomatis memunculkan notifikasi kepada Leader/Manager saat sisa masa kontrak tersisa kurang dari 2 bulan (60 hari).
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Data Pribadi & NIK */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Data Pribadi & Kependudukan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">NIK (Nomor KTP 16 Digit)</label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="3271xxxxxxxxxxxx"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                <select
                  value={gender || ''}
                  onChange={(e) => setGender(e.target.value as any || undefined)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white cursor-pointer"
                >
                  <option value="">-- Pilih Jenis Kelamin --</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Golongan Darah</label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white cursor-pointer"
                >
                  <option value="">-- Pilih Gol. Darah --</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Pendidikan Terakhir</label>
                <input
                  type="text"
                  placeholder="Contoh: SMA/SMK Tata Boga, D3 Perhotelan, S1"
                  value={lastEducation}
                  onChange={(e) => setLastEducation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">No. HP / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="0812-xxxx-xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Alamat Domisili KTP / Tempat Tinggal</label>
              <textarea
                rows={2}
                placeholder="Alamat lengkap..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white resize-none"
              />
            </div>
          </div>

          {/* Section 3: Data BPJS & Perpajakan */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>BPJS & Perpajakan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">No. BPJS Ketenagakerjaan</label>
                <input
                  type="text"
                  placeholder="No. KPJ / Kartu Peserta"
                  value={bpjsKetenagakerjaan}
                  onChange={(e) => setBpjsKetenagakerjaan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">No. BPJS Kesehatan</label>
                <input
                  type="text"
                  placeholder="000xxxxxxxx"
                  value={bpjsKesehatan}
                  onChange={(e) => setBpjsKesehatan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor NPWP</label>
                <input
                  type="text"
                  placeholder="xx.xxx.xxx.x-xxx.xxx"
                  value={npwp}
                  onChange={(e) => setNpwp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Rekening Bank Payroll */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Rekening Bank untuk Payroll / Gaji</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Bank</label>
                <input
                  type="text"
                  placeholder="BCA / Mandiri / BRI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  placeholder="Nomor rekening bank..."
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Atas Nama Rekening</label>
                <input
                  type="text"
                  placeholder="Nama pemilik buku tabungan"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Kontak Darurat */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              <HeartHandshake className="w-4 h-4 text-rose-600" />
              <span>Kontak Darurat (Emergency Contact)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Kontak Darurat</label>
                <input
                  type="text"
                  placeholder="Nama kerabat/keluarga"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Hubungan</label>
                <input
                  type="text"
                  placeholder="Orang Tua / Pasangan / Saudara"
                  value={emergencyContactRelation}
                  onChange={(e) => setEmergencyContactRelation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">No. Telp Darurat</label>
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Bio / Catatan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Catatan Tambahan (Bio)</label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan staf, keahlian khusus..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Biodata & HRD'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
