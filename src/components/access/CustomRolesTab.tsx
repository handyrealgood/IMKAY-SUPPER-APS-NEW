import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { RoleDefinition, NavigationTab } from '../../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Briefcase, 
  ArrowRight,
  Palette,
  Check,
  Building,
  HelpCircle,
  X
} from 'lucide-react';

interface CustomRolesTabProps {
  onGoToMatrix?: () => void;
}

const BADGE_COLOR_OPTIONS: { id: RoleDefinition['badgeColor']; label: string; bg: string; text: string; border: string; ring: string }[] = [
  { id: 'purple', label: 'Ungu Royal', bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-200', ring: 'ring-purple-500' },
  { id: 'amber', label: 'Amber Gold', bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-200', ring: 'ring-amber-500' },
  { id: 'blue', label: 'Biru Ocean', bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-200', ring: 'ring-blue-500' },
  { id: 'emerald', label: 'Hijau Emerald', bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-200', ring: 'ring-emerald-500' },
  { id: 'indigo', label: 'Indigo Modern', bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-200', ring: 'ring-indigo-500' },
  { id: 'cyan', label: 'Cyan Fresh', bg: 'bg-cyan-100', text: 'text-cyan-900', border: 'border-cyan-200', ring: 'ring-cyan-500' },
  { id: 'rose', label: 'Rose Pink', bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-200', ring: 'ring-rose-500' },
  { id: 'teal', label: 'Teal Mint', bg: 'bg-teal-100', text: 'text-teal-900', border: 'border-teal-200', ring: 'ring-teal-500' },
  { id: 'orange', label: 'Orange Sunset', bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-200', ring: 'ring-orange-500' },
  { id: 'slate', label: 'Slate Netral', bg: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-200', ring: 'ring-slate-500' },
];

const DEPARTMENT_PRESETS = [
  'Layanan & Bar',
  'Dapur & Produksi',
  'Kasir & Depan',
  'Pengadaan & Logistik',
  'Keuangan & Akuntansi',
  'Operasional Umum',
  'Manajemen & Audit',
  'Quality & Hygiene'
];

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  tabs: NavigationTab[];
}

const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'barista',
    name: '☕ Layanan & Barista',
    description: 'POS, Stok Barang, Waste/Spoil, Memorandum',
    tabs: ['dashboard', 'pos', 'inventory', 'waste', 'memorandum']
  },
  {
    id: 'kitchen_prep',
    name: '🍳 Dapur & Cook Helper',
    description: 'Bahan Baku, Resep & HPP, Waste, Stock Opname, Memorandum',
    tabs: ['dashboard', 'inventory', 'recipes', 'waste', 'stockopname', 'memorandum']
  },
  {
    id: 'cashier',
    name: '💰 Kasir & Front',
    description: 'POS Kasir, Laporan Penjualan, Kas Kecil (Petty Cash), Memorandum',
    tabs: ['dashboard', 'pos', 'sales', 'pettycash', 'memorandum']
  },
  {
    id: 'purchasing_logistics',
    name: '📦 Logistik & Gudang',
    description: 'Purchasing PO, Receiving Supplier, Transfer Outlet, Bahan Baku, Memo',
    tabs: ['dashboard', 'purchasing', 'receiving', 'inventory', 'transfers', 'memorandum']
  },
  {
    id: 'supervisor',
    name: '⭐ Supervisor Outlet',
    description: 'POS, Laporan Penjualan, Inventaris, SO, Waste, Kas Kecil, Memo',
    tabs: ['dashboard', 'pos', 'inventory', 'waste', 'sales', 'transfers', 'pettycash', 'stockopname', 'memorandum']
  },
  {
    id: 'full_staff',
    name: '⚡ Akses Menyeluruh (Staf)',
    description: 'Semua modul operasional aktif (tanpa Hak Akses)',
    tabs: ['dashboard', 'pos', 'inventory', 'recipes', 'purchasing', 'receiving', 'waste', 'sales', 'transfers', 'memorandum', 'pettycash', 'cogs', 'stockopname']
  },
  {
    id: 'minimal',
    name: '🔒 Akses Minimal',
    description: 'Hanya Dashboard Live saja',
    tabs: ['dashboard']
  }
];

export const CustomRolesTab: React.FC<CustomRolesTabProps> = ({ onGoToMatrix }) => {
  const { roles, addRole, updateRole, deleteRole, users, rolePermissions, currentUser } = useResto();

  const isMasterAdmin = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleDefinition | null>(null);
  const [fallbackRoleId, setFallbackRoleId] = useState<string>('staff');

  // Form State for Adding / Editing
  const [roleTitle, setRoleTitle] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [department, setDepartment] = useState('Layanan & Bar');
  const [description, setDescription] = useState('');
  const [badgeColor, setBadgeColor] = useState<RoleDefinition['badgeColor']>('indigo');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('barista');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const resetForm = () => {
    setRoleTitle('');
    setRoleId('');
    setIsCustomSlug(false);
    setDepartment('Layanan & Bar');
    setDescription('');
    setBadgeColor('indigo');
    setSelectedTemplate('barista');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRoleTitle(val);
    if (!isCustomSlug) {
      const generatedSlug = val
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 24);
      setRoleId(generatedSlug);
    }
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim()) {
      setFeedback({ type: 'error', text: 'Nama peran / jabatan wajib diisi.' });
      return;
    }

    const template = PERMISSION_TEMPLATES.find(t => t.id === selectedTemplate);
    const initialTabs = (template ? template.tabs : ['dashboard', 'pos']) as NavigationTab[];

    const result = addRole(
      {
        id: roleId.trim() || undefined,
        title: roleTitle.trim(),
        department: department.trim(),
        description: description.trim(),
        badgeColor,
      },
      initialTabs
    );

    if (result.success) {
      setFeedback({ type: 'success', text: result.message });
      setIsAddModalOpen(false);
      resetForm();
    } else {
      setFeedback({ type: 'error', text: result.message });
    }
  };

  const handleOpenEditModal = (role: RoleDefinition) => {
    setEditingRole(role);
    setRoleTitle(role.title);
    setDepartment(role.department || '');
    setDescription(role.description || '');
    setBadgeColor(role.badgeColor || 'indigo');
  };

  const handleSaveEditRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    if (!roleTitle.trim()) {
      setFeedback({ type: 'error', text: 'Nama peran / jabatan wajib diisi.' });
      return;
    }

    const result = updateRole(editingRole.id, {
      title: roleTitle.trim(),
      department: department.trim(),
      description: description.trim(),
      badgeColor,
    });

    if (result.success) {
      setFeedback({ type: 'success', text: result.message });
      setEditingRole(null);
      resetForm();
    } else {
      setFeedback({ type: 'error', text: result.message });
    }
  };

  const handleOpenDeleteModal = (role: RoleDefinition) => {
    setDeletingRole(role);
    // Find an appropriate fallback role that isn't this role
    const defaultFallback = roles.find(r => r.id !== role.id && r.id !== 'manager')?.id || 'staff';
    setFallbackRoleId(defaultFallback);
  };

  const handleConfirmDelete = () => {
    if (!deletingRole) return;
    const result = deleteRole(deletingRole.id, fallbackRoleId);
    if (result.success) {
      setFeedback({ type: 'success', text: result.message });
      setDeletingRole(null);
    } else {
      setFeedback({ type: 'error', text: result.message });
    }
  };

  const getBadgeClass = (color?: string) => {
    const found = BADGE_COLOR_OPTIONS.find(c => c.id === color);
    if (found) {
      return `${found.bg} ${found.text} ${found.border}`;
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900">Peran & Struktur Jabatan Sistem Restoran</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {roles.length} Total Peran
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Tulis sendiri peran atau posisi kerja operasional (misal: <em>Barista</em>, <em>Supervisor Shift</em>, <em>Cook Helper</em>, <em>Finance</em>, dll.). Peran baru langsung otomatis muncul di <strong>Matriks Izin Menu</strong> dan <strong>Manajemen Akun Staf</strong>.
          </p>
        </div>

        {isMasterAdmin && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Tulis Peran / Role Baru</span>
          </button>
        )}
      </div>

      {/* Notification Feedback */}
      {feedback && (
        <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 animate-fadeIn ${
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
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(role => {
          const userCount = users.filter(u => u.role === role.id).length;
          const assignedTabs = rolePermissions[role.id] || ['dashboard'];
          const isManager = role.id === 'manager';

          return (
            <div
              key={role.id}
              className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
                isManager 
                  ? 'bg-purple-50/30 border-purple-200 shadow-xs' 
                  : 'bg-white hover:bg-slate-50/50 border-slate-200'
              }`}
            >
              <div>
                {/* Card Top: Department & Badge */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBadgeClass(role.badgeColor)}`}>
                      {role.department || 'Operasional'}
                    </span>
                    {role.isSystem ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                        Sistem Inti
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                        Peran Kustom
                      </span>
                    )}
                  </div>

                  {/* Edit/Delete Actions */}
                  {isMasterAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(role)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit nama / titel peran ini"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!role.isSystem && role.id !== 'manager' && (
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(role)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus peran kustom ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Role Title & ID slug */}
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {role.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <span>ID:</span>
                    <code className="bg-slate-100 px-1 py-0.2 rounded text-slate-600 font-bold">
                      {role.id}
                    </code>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {role.description || 'Tidak ada keterangan tanggung jawab khusus.'}
                </p>
              </div>

              {/* Card Footer: Users count & Permission status */}
              <div className="pt-4 mt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{userCount} Staf Pengguna</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">
                      {isManager ? 'Semua Modul (Master)' : `${assignedTabs.length}/14 Modul`}
                    </span>
                  </div>
                </div>

                {/* Quick Link to Matrix */}
                {onGoToMatrix && (
                  <button
                    type="button"
                    onClick={onGoToMatrix}
                    className="w-full py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Atur Izin di Matriks</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Tambah Role Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Tulis Peran / Jabatan Baru</h3>
                  <p className="text-[11px] text-slate-500">Definisikan posisi kerja khusus untuk tim restoran Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              
              {/* Nama Peran & ID Slug */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Peran / Jabatan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Barista & Beverage Specialist"
                  value={roleTitle}
                  onChange={handleTitleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              {/* Slug ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Kode ID Sistem (Slug) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomSlug(!isCustomSlug)}
                    className="text-[10px] font-semibold text-indigo-600 hover:underline"
                  >
                    {isCustomSlug ? 'Otomatis' : 'Kustomisasi ID'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  disabled={!isCustomSlug}
                  placeholder="barista_specialist"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white disabled:opacity-60"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Digunakan sistem sebagai identitas unik kode izin & penugasan staf.
                </p>
              </div>

              {/* Departemen & Divisi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Departemen / Divisi Restoran
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DEPARTMENT_PRESETS.map(dep => (
                    <button
                      key={dep}
                      type="button"
                      onClick={() => setDepartment(dep)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                        department === dep
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {dep}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Atau ketik nama departemen lainnya..."
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Tanggung Jawab
                </label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan peran tugas dan tanggung jawab staf dengan peran ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
                />
              </div>

              {/* Warna Badge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span>Warna Tanda Pengenal / Badge</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {BADGE_COLOR_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBadgeColor(opt.id)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        opt.bg
                      } ${opt.border} ${
                        badgeColor === opt.id 
                          ? `ring-2 ${opt.ring} scale-105 font-black` 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className={`text-[10px] font-bold ${opt.text}`}>{opt.label.split(' ')[0]}</span>
                      {badgeColor === opt.id && <Check className={`w-3 h-3 ${opt.text}`} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Izin Awal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Template Izin Modul Awal
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                  {PERMISSION_TEMPLATES.map(tpl => (
                    <label
                      key={tpl.id}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                        selectedTemplate === tpl.id
                          ? 'bg-white border-indigo-400 shadow-xs'
                          : 'bg-transparent border-transparent hover:bg-white/80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="permission_template"
                        value={tpl.id}
                        checked={selectedTemplate === tpl.id}
                        onChange={() => setSelectedTemplate(tpl.id)}
                        className="mt-0.5 w-3.5 h-3.5 text-indigo-600 accent-indigo-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900">{tpl.name}</div>
                        <div className="text-[10px] text-slate-500">{tpl.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Anda tetap dapat mengubah centang modul peran ini kapan saja lewat Matriks Izin Menu.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Simpan Peran Baru</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: Edit Peran */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Ubah Peran: {editingRole.title}</h3>
                  <p className="text-[11px] text-slate-500">ID Sistem: <code className="font-mono font-bold text-slate-700">@{editingRole.id}</code></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Peran / Jabatan Resmi *
                </label>
                <input
                  type="text"
                  required
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Departemen / Divisi
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Tanggung Jawab
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span>Warna Tanda Pengenal / Badge</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {BADGE_COLOR_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBadgeColor(opt.id)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        opt.bg
                      } ${opt.border} ${
                        badgeColor === opt.id 
                          ? `ring-2 ${opt.ring} scale-105 font-black` 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className={`text-[10px] font-bold ${opt.text}`}>{opt.label.split(' ')[0]}</span>
                      {badgeColor === opt.id && <Check className={`w-3 h-3 ${opt.text}`} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: Hapus Peran */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Hapus Peran: {deletingRole.title}</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus peran ini dari sistem.</p>
              </div>
            </div>

            {users.filter(u => u.role === deletingRole.id).length > 0 && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <p className="text-xs font-bold text-amber-900">
                  Terdapat {users.filter(u => u.role === deletingRole.id).length} akun pengguna yang saat ini memiliki peran ini.
                </p>
                <p className="text-[11px] text-amber-800">
                  Silakan pilih peran pengganti untuk mengalihkan pengguna tersebut:
                </p>
                <select
                  value={fallbackRoleId}
                  onChange={(e) => setFallbackRoleId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  {roles
                    .filter(r => r.id !== deletingRole.id && r.id !== 'manager')
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        Alihkan ke: {r.title} ({r.department || 'Operasional'})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin melanjutkan penghapusan peran <strong>{deletingRole.title}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingRole(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Hapus Peran
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
