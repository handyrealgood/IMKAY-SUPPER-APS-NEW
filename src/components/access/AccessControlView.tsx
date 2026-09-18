import React, { useState, useEffect, useMemo } from 'react';
import { useResto, NavigationTab } from '../../context/RestoContext';
import { UserRole, RoleMenuPermissions } from '../../types';
import { INITIAL_ROLE_PERMISSIONS } from '../../data/initialData';
import { 
  Shield, 
  ShieldCheck, 
  KeyRound, 
  Users, 
  Check, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  LayoutDashboard, 
  Package, 
  ChefHat, 
  Truck, 
  Trash2, 
  ShoppingCart, 
  ArrowLeftRight, 
  Receipt, 
  TrendingDown, 
  ClipboardCheck,
  Edit2,
  Store,
  ShoppingBag,
  Mail,
  Search,
  CheckCheck,
  Sparkles,
  Info,
  SlidersHorizontal,
  CheckSquare,
  X,
  Zap,
  Calendar,
  UserCheck,
  Network
} from 'lucide-react';
import { ResetDataModal } from '../settings/ResetDataModal';
import { RestaurantBrandingTab } from './RestaurantBrandingTab';
import { UserManagementTab } from './UserManagementTab';
import { LanInstallationGuideTab } from './LanInstallationGuideTab';

interface MenuMeta {
  id: NavigationTab;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isCore?: boolean;
}

const ALL_MENUS: MenuMeta[] = [
  { 
    id: 'dashboard', 
    title: 'Dashboard Live', 
    description: 'Ringkasan performa penjualan real-time, stok menipis, dan alert operasional per shift', 
    category: 'Utama & POS',
    icon: LayoutDashboard,
    badge: 'Wajib Semua Peran',
    isCore: true
  },
  { 
    id: 'pos', 
    title: 'Point of Sales (POS)', 
    description: 'Sistem kasir kasir sentuh, nomor meja dine-in, takeaway, diskon promo & cetak struk', 
    category: 'Utama & POS',
    icon: Store,
    badge: 'Fitur Kasir'
  },
  { 
    id: 'inventory', 
    title: 'Data Barang & Stok', 
    description: 'Katalog bahan baku basah & kering, stok fisik gudang, satuan & batas minimum buffer', 
    category: 'Dapur & Inventaris',
    icon: Package 
  },
  { 
    id: 'recipes', 
    title: 'Input Menu & HPP', 
    description: 'Formula resep makanan/minuman, gramasi bahan baku, kalkulasi HPP otomatis & food cost', 
    category: 'Dapur & Inventaris',
    icon: ChefHat 
  },
  { 
    id: 'waste', 
    title: 'Input Waste & Spoil', 
    description: 'Pencatatan bahan kedaluwarsa, tumpah, atau rusak di dapur dengan lampiran bukti foto', 
    category: 'Dapur & Inventaris',
    icon: Trash2 
  },
  { 
    id: 'stockopname', 
    title: 'Stock Opname (SO)', 
    description: 'Jadwal audit hitung fisik, selisih kuantitas & nominal, dan approval penyesuaian stok', 
    category: 'Dapur & Inventaris',
    icon: ClipboardCheck 
  },
  { 
    id: 'purchasing', 
    title: 'Purchasing & PO', 
    description: 'Pengajuan order belanja bahan (PO), perbandingan supplier & persetujuan pengadaan', 
    category: 'Pengadaan & Logistik',
    icon: ShoppingBag,
    badge: 'Fitur Pengadaan'
  },
  { 
    id: 'receiving', 
    title: 'Receiving Supplier', 
    description: 'Penerimaan fisik barang datang, pencocokan nota/faktur supplier & penambahan stok', 
    category: 'Pengadaan & Logistik',
    icon: Truck 
  },
  { 
    id: 'transfers', 
    title: 'Transfer Antar Outlet', 
    description: 'Mutasi kirim & terima stok bahan baku antar cabang restoran atau central kitchen', 
    category: 'Pengadaan & Logistik',
    icon: ArrowLeftRight 
  },
  { 
    id: 'sales', 
    title: 'Laporan Penjualan', 
    description: 'Rekap transaksi penjualan harian, shift kasir, pemotongan stok & riwayat pesanan', 
    category: 'Keuangan & Laporan',
    icon: ShoppingCart 
  },
  { 
    id: 'pettycash', 
    title: 'Kas Kecil (Petty Cash)', 
    description: 'Pencatatan uang kas masuk & belanja mendadak kasir/operasional dengan bukti nota', 
    category: 'Keuangan & Laporan',
    icon: Receipt 
  },
  { 
    id: 'variable_costs', 
    title: 'Biaya Utilitas & Variabel', 
    description: 'Pencatatan tagihan listrik PLN, air PDAM, gas LPG, internet WiFi, sanitasi & maintenance outlet', 
    category: 'Keuangan & Laporan',
    icon: Zap,
    badge: 'Fitur Baru'
  },
  { 
    id: 'cogs', 
    title: 'Laporan COGS & Tren', 
    description: 'Analisis laba kotor, persentase HPP makanan, arus kas (cashflow) & tren biaya', 
    category: 'Keuangan & Laporan',
    icon: TrendingDown 
  },
  { 
    id: 'schedules', 
    title: 'Jadwal Kerja Karyawan', 
    description: 'Roster shift kerja mingguan, plotting staf, konfigurasi jam masuk & jam pulang operasional', 
    category: 'SDM & Operasional',
    icon: Calendar,
    badge: 'Fitur Baru'
  },
  { 
    id: 'attendance', 
    title: 'Absensi GPS & Selfie', 
    description: 'Absen masuk/pulang selfie live kamera, validasi geofencing GPS radius 50m & rekap laporan', 
    category: 'SDM & Operasional',
    icon: UserCheck,
    badge: 'Fitur Baru'
  },
  { 
    id: 'memorandum', 
    title: 'Memorandum Internal', 
    description: 'Papan pengumuman resmi outlet, memo tugas, ucapan ultah staf & broadcast internal', 
    category: 'Komunikasi & Sistem',
    icon: Mail 
  },
  { 
    id: 'access_control', 
    title: 'Hak Akses & Pengaturan', 
    description: 'Pengaturan matriks izin menu, manajemen akun password staff, reset data & identitas resto', 
    category: 'Komunikasi & Sistem',
    icon: ShieldCheck,
    badge: 'Khusus Manager'
  },
];

interface RoleColumnMeta {
  role: UserRole;
  title: string;
  subtitle: string;
  badgeClass: string;
  checkboxColor: string;
  isManager?: boolean;
}

const ROLE_COLUMNS: RoleColumnMeta[] = [
  {
    role: 'manager',
    title: 'Manager Resto',
    subtitle: 'Master Admin',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
    checkboxColor: 'accent-purple-600',
    isManager: true,
  },
  {
    role: 'head_kitchen',
    title: 'Head Kitchen',
    subtitle: 'Divisi Dapur',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
    checkboxColor: 'accent-amber-600',
  },
  {
    role: 'head_floor',
    title: 'Head Floor',
    subtitle: 'Bar & Servis',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-200',
    checkboxColor: 'accent-blue-600',
  },
  {
    role: 'kasir',
    title: 'Kasir',
    subtitle: 'Front Desk & Kas',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    checkboxColor: 'accent-emerald-600',
  },
  {
    role: 'staff',
    title: 'Staff Operasional',
    subtitle: 'Kru Lapangan',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    checkboxColor: 'accent-indigo-600',
  },
  {
    role: 'purchasing',
    title: 'Purchasing',
    subtitle: 'Pengadaan & Logistik',
    badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-200',
    checkboxColor: 'accent-cyan-600',
  },
  {
    role: 'owner',
    title: 'Owner',
    subtitle: 'Direksi / Owner',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-200',
    checkboxColor: 'accent-rose-600',
  },
];

const CATEGORIES = [
  'Semua Kategori',
  'Utama & POS',
  'Dapur & Inventaris',
  'Pengadaan & Logistik',
  'Keuangan & Laporan',
  'SDM & Operasional',
  'Komunikasi & Sistem'
] as const;

export const AccessControlView: React.FC = () => {
  const { 
    currentUser, 
    rolePermissions, 
    updateAllRolePermissions,
    resetRolePermissionsToDefault,
  } = useResto();

  const [activeTab, setActiveTab] = useState<'branding' | 'matrix' | 'users' | 'maintenance' | 'lan_guide'>('branding');
  const [tempPermissions, setTempPermissions] = useState<RoleMenuPermissions>(rolePermissions);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');

  // Modal Reset Data
  const [showResetModal, setShowResetModal] = useState(false);

  // Sync tempPermissions when context rolePermissions changes
  useEffect(() => {
    setTempPermissions(rolePermissions);
  }, [rolePermissions]);

  // Check unsaved changes
  const isDirty = useMemo(() => {
    return JSON.stringify(tempPermissions) !== JSON.stringify(rolePermissions);
  }, [tempPermissions, rolePermissions]);

  const handleTogglePermission = (role: UserRole, menuId: NavigationTab) => {
    // Prevent removing dashboard or access_control for manager
    if (menuId === 'dashboard') return;
    if (role === 'manager' && menuId === 'access_control') return;

    const currentRoleTabs = tempPermissions[role] || [];
    let updatedTabs: NavigationTab[];

    if (currentRoleTabs.includes(menuId)) {
      updatedTabs = currentRoleTabs.filter(t => t !== menuId);
    } else {
      updatedTabs = [...currentRoleTabs, menuId];
    }

    setTempPermissions(prev => ({
      ...prev,
      [role]: updatedTabs,
    }));
  };

  const handleSelectAllForRole = (role: UserRole) => {
    if (role === 'manager') return;
    const allIds = ALL_MENUS.map(m => m.id);
    setTempPermissions(prev => ({
      ...prev,
      [role]: allIds,
    }));
  };

  const handleDeselectAllForRole = (role: UserRole) => {
    if (role === 'manager') return;
    setTempPermissions(prev => ({
      ...prev,
      [role]: ['dashboard'],
    }));
  };

  const handleResetRoleToDefault = (role: UserRole) => {
    setTempPermissions(prev => ({
      ...prev,
      [role]: INITIAL_ROLE_PERMISSIONS[role] || ['dashboard'],
    }));
  };

  const handleToggleMenuForAllStaff = (menuId: NavigationTab) => {
    if (menuId === 'dashboard' || menuId === 'access_control') return;
    const nonManagerRoles: UserRole[] = ROLE_COLUMNS.filter(c => !c.isManager).map(c => c.role);
    const allStaffHaveIt = nonManagerRoles.every(r => (tempPermissions[r] || []).includes(menuId));

    setTempPermissions(prev => {
      const next = { ...prev };
      nonManagerRoles.forEach(r => {
        const cur = next[r] || [];
        if (allStaffHaveIt) {
          next[r] = cur.filter(id => id !== menuId);
        } else {
          if (!cur.includes(menuId)) {
            next[r] = [...cur, menuId];
          }
        }
      });
      return next;
    });
  };

  const handleResetAllToDefault = () => {
    if (window.confirm('Kembalikan konfigurasi seluruh izin menu ke standar rekomendasi pabrik?')) {
      setTempPermissions(INITIAL_ROLE_PERMISSIONS);
      resetRolePermissionsToDefault();
      setSaveSuccessMsg('Semua matriks izin menu berhasil dikembalikan ke standar rekomendasi sistem!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }
  };

  const handleDiscardChanges = () => {
    setTempPermissions(rolePermissions);
  };

  const handleSavePermissions = () => {
    updateAllRolePermissions(tempPermissions);
    setSaveSuccessMsg('Matriks hak akses berhasil disimpan! Perubahan langsung otomatis aktif di menu sidebar semua peran.');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Filtered menus
  const filteredMenus = useMemo(() => {
    return ALL_MENUS.filter(menu => {
      const matchesSearch = 
        menu.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        menu.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        menu.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        menu.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'Semua Kategori' || menu.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Pengaturan Hak Akses & Akun Staff</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kustomisasi izin menu per divisi dan pengelolaan akun password staff restoran.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            Otoritas: Admin Master
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('branding')}
          className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'branding'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4 text-amber-500" />
          <span>Identitas & Logo Resto</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Matriks Izin Menu</span>
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Ada perubahan belum disimpan" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Pengguna & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'maintenance'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset & Pembersihan Data</span>
        </button>

        <button
          onClick={() => setActiveTab('lan_guide')}
          className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'lan_guide'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Network className="w-4 h-4 text-indigo-600" />
          <span>Panduan Instalasi LAN (Offline)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            PDF
          </span>
        </button>
      </div>

      {/* 0. BRANDING & IDENTITY TAB */}
      {activeTab === 'branding' && <RestaurantBrandingTab />}

      {/* 1. PERMISSION MATRIX TAB */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          
          {/* Top Controls Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Matriks Izin Menu & Fitur Restoran</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {ALL_MENUS.length} Total Modul
                </span>
                {isDirty && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                    Perubahan Belum Disimpan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Atur menu & modul yang dapat diakses oleh masing-masing peran (Dapur, Floor, Kasir, Staff, Purchasing & Owner). Seluruh modul termasuk Absensi GPS & Selfie, Jadwal Kerja Karyawan, Biaya Utilitas, Purchasing, dan POS dapat dikustomisasi secara leluasa oleh Manager.
              </p>
            </div>

            {/* Global Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetAllToDefault}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                title="Kembalikan semua centang ke rekomendasi sistem"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Standar Rekomendasi</span>
              </button>

              {isDirty && (
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal Ubah</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSavePermissions}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 ${
                  isDirty 
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isDirty ? 'Simpan Perubahan Akses *' : 'Simpan Hak Akses'}</span>
              </button>
            </div>
          </div>

          {/* Success Message Banner */}
          {saveSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Search and Category Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari modul (contoh: POS, Purchasing, Resep, Kasir)..."
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 mr-0.5" />
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
            <table className="w-full text-left text-xs min-w-[980px]">
              <thead>
                <tr className="bg-slate-100 text-slate-800 uppercase font-bold text-[11px] border-b border-slate-200">
                  <th className="py-4 px-4 w-80">
                    <span className="text-slate-900 block font-black">Modul / Menu Restoran</span>
                    <span className="text-[10px] text-slate-500 font-normal lowercase">
                      menampilkan {filteredMenus.length} dari {ALL_MENUS.length} fitur
                    </span>
                  </th>

                  {ROLE_COLUMNS.map(col => {
                    const activeCount = (tempPermissions[col.role] || []).length;
                    return (
                      <th key={col.role} className="py-3 px-3 text-center w-36 align-top">
                        <div className="flex flex-col items-center">
                          <span className="text-slate-900 font-black block">{col.title}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{col.subtitle}</span>
                          
                          <div className="mt-1.5 flex items-center gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${col.badgeClass}`}>
                              {col.isManager ? 'Semua (Full)' : `${activeCount}/${ALL_MENUS.length}`}
                            </span>
                          </div>

                          {/* Quick Column Actions */}
                          {!col.isManager ? (
                            <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold">
                              <button
                                type="button"
                                onClick={() => handleSelectAllForRole(col.role)}
                                className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                                title="Beri semua akses untuk peran ini"
                              >
                                Semua
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResetRoleToDefault(col.role)}
                                className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 text-amber-700 border border-slate-200 transition-colors"
                                title="Reset peran ini ke rekomendasi awal"
                              >
                                Standar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeselectAllForRole(col.role)}
                                className="px-1.5 py-0.5 rounded bg-white hover:bg-rose-100 text-rose-700 border border-slate-200 transition-colors"
                                title="Hapus semua akses (kecuali Dashboard)"
                              >
                                Kosongkan
                              </button>
                            </div>
                          ) : (
                            <div className="mt-2 text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>Permanen</span>
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredMenus.length === 0 ? (
                  <tr>
                    <td colSpan={ROLE_COLUMNS.length + 1} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada modul yang cocok dengan pencarian "<strong>{searchQuery}</strong>".
                    </td>
                  </tr>
                ) : (
                  filteredMenus.map(menu => {
                    const Icon = menu.icon;
                    const nonManagerRoles: UserRole[] = ROLE_COLUMNS.filter(c => !c.isManager).map(c => c.role);
                    const allStaffHaveIt = nonManagerRoles.every(r => (tempPermissions[r] || []).includes(menu.id));

                    return (
                      <tr key={menu.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Module Info & Row Quick Toggle */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900">{menu.title}</span>
                                {menu.badge && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    menu.badge === 'Wajib Semua Peran'
                                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                      : menu.badge === 'Khusus Manager'
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {menu.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                {menu.description}
                              </p>

                              {/* Row Quick Action: Toggle to all staff */}
                              {menu.id !== 'dashboard' && menu.id !== 'access_control' && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleMenuForAllStaff(menu.id)}
                                  className="mt-1 text-[10px] font-semibold text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckSquare className="w-3 h-3 text-slate-400" />
                                  <span>{allStaffHaveIt ? 'Cabut dari semua staff' : 'Beri akses ke semua staff'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Dynamic columns mapped per role in ROLE_COLUMNS */}
                        {ROLE_COLUMNS.map(col => {
                          const isMgr = col.isManager;
                          const isChecked = isMgr ? true : (tempPermissions[col.role] || []).includes(menu.id);
                          const isDashboard = menu.id === 'dashboard';

                          return (
                            <td 
                              key={col.role} 
                              className={`py-3 px-3 text-center align-middle ${isMgr ? 'bg-purple-50/20' : ''}`}
                            >
                              <div className="flex flex-col items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(col.role, menu.id)}
                                  disabled={isMgr || isDashboard}
                                  className={`w-4 h-4 rounded ${col.checkboxColor} cursor-pointer transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60`}
                                />
                                {isMgr ? (
                                  <span className="text-[9px] text-purple-800 font-bold mt-0.5">Full</span>
                                ) : isDashboard ? (
                                  <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Wajib</span>
                                ) : null}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Informational Guidance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Otoritas Master Admin:</span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Manager Resto selalu memegang otoritas penuh ke seluruh modul untuk audit sengketa stok, resep rahasia, serta perubahan konfigurasi.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Sinkronisasi Real-Time:</span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Saat tombol simpan ditekan, sidebar navigasi staff langsung menyesuaikan tampilan tanpa perlu refresh atau login ulang.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
              <LayoutDashboard className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Modul Dashboard Live:</span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Dashboard wajib aktif untuk setiap staf sebagai beranda ringkasan informasi operasional, target harian, dan notifikasi shift.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. USER ACCOUNTS & PASSWORD MANAGEMENT TAB */}
      {activeTab === 'users' && <UserManagementTab />}

      {/* 3. MAINTENANCE & RESET TO ZERO TAB */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Pembersihan & Reset Data Operasional Restoran</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Panduan dan kendali untuk mengosongkan seluruh riwayat demo sebelum sistem digunakan secara nyata (*Go-Live*).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Action Card: Kosongkan ke 0 */}
            <div className="p-5 rounded-2xl border border-red-200 bg-red-50/40 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black">
                <RotateCcw className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-sm font-black text-red-950">Kosongkan Semua Data & Buat Stok = 0</h4>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  Menghapus semua riwayat transaksi kasir, penerimaan supplier, petty cash, waste, dan transfer. Semua stok bahan baku dijadikan 0, siap untuk input stok awal asli.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowResetModal(true)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Buka Dialog Pengosongan Data (Set ke 0)</span>
                </button>
              </div>
            </div>

            {/* Instruction Card */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 text-xs text-slate-700">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cara Menggunakan Setelah Reset ke 0:</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                <li><strong>Stok Awal</strong>: Lakukan penerimaan barang di menu <em>Receiving Supplier</em> atau sesuaikan langsung di <em>Stock Opname (SO)</em>.</li>
                <li><strong>Resep & Menu</strong>: Resep tetap aman tersimpan, HPP otomatis terhitung mengikuti harga beli bahan baku baru.</li>
                <li><strong>Kas Operasional</strong>: Input modal awal kasir di menu <em>Kas Kecil (Petty Cash)</em> dengan kategori <em>Top-up / Drop Dana Pusat</em>.</li>
                <li><strong>Mulai Jual</strong>: Setiap menu yang terjual akan langsung memotong stok bahan baku aktual yang baru Anda input.</li>
              </ol>
            </div>

          </div>
        </div>
      )}

      {/* 5. LAN INSTALLATION GUIDE TAB */}
      {activeTab === 'lan_guide' && <LanInstallationGuideTab />}

      {/* Reset Modal Triggered */}
      <ResetDataModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />

    </div>
  );
};
