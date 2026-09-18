import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { PosPromoConfig, PosTaxServiceConfig, MenuItem, PosTableConfig } from '../../types';
import { safeStorage } from '../../utils/safeStorage';
import { 
  Percent, 
  Receipt, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  DollarSign, 
  ShieldCheck, 
  Sparkles, 
  Tag, 
  AlertCircle,
  AlertTriangle,
  SlidersHorizontal,
  CreditCard,
  Printer,
  LayoutGrid,
  Armchair
} from 'lucide-react';

export const PosBackOfficeTab: React.FC = () => {
  const { 
    restoTables,
    addPosTable,
    updatePosTable,
    deletePosTable,
    promos, 
    addPromo, 
    updatePromo, 
    deletePromo, 
    taxServiceConfig, 
    updateTaxServiceConfig, 
    menuItems,
    currentUser,
    formatRupiah
  } = useResto();

  const isManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const [activeSection, setActiveSectionState] = useState<'tables' | 'promos' | 'tax_service'>(() => {
    try {
      const saved = safeStorage.getItem('resto_pos_backoffice_section');
      if (saved) return saved as any;
    } catch {}
    return 'tables';
  });

  const setActiveSection = (section: 'tables' | 'promos' | 'tax_service') => {
    setActiveSectionState(section);
    try {
      safeStorage.setItem('resto_pos_backoffice_section', section);
    } catch {}
  };

  // Table Management State
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState<number>(4);
  const [tableArea, setTableArea] = useState<'Indoor' | 'Outdoor' | 'VIP' | 'Bar' | 'Terrace'>('Indoor');
  const [tableNotes, setTableNotes] = useState('');
  const [isTableActive, setIsTableActive] = useState<boolean>(true);
  const [tableFeedback, setTableFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [tableToDelete, setTableToDelete] = useState<PosTableConfig | null>(null);

  // Promo Form State
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoName, setPromoName] = useState('');
  const [promoPercent, setPromoPercent] = useState<number>(10);
  const [promoApplyTo, setPromoApplyTo] = useState<'all' | 'specific'>('all');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [minOrder, setMinOrder] = useState<number>(0);
  const [isPromoActive, setIsPromoActive] = useState<boolean>(true);
  const [menuSearch, setMenuSearch] = useState('');

  // Tax & Service Form State
  const [taxRate, setTaxRate] = useState<number>(taxServiceConfig.taxPercent);
  const [isTaxActive, setIsTaxActive] = useState<boolean>(taxServiceConfig.isTaxActive);
  const [serviceRate, setServiceRate] = useState<number>(taxServiceConfig.servicePercent);
  const [isServiceActive, setIsServiceActive] = useState<boolean>(taxServiceConfig.isServiceActive);
  const [taxFeedback, setTaxFeedback] = useState<string | null>(null);

  if (!isManager) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-red-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Akses Terbatas: Manager Only</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Menu Back Office POS ini dikhususkan bagi Manager & Administrator untuk mengonfigurasi meja restoran, promo diskon, persentase pajak PB1, dan service charge resto.
        </p>
      </div>
    );
  }

  // Open Add Table
  const handleOpenAddTable = () => {
    setEditingTableId(null);
    setTableNumber('');
    setTableName('');
    setTableCapacity(4);
    setTableArea('Indoor');
    setTableNotes('');
    setIsTableActive(true);
    setTableFeedback(null);
    setShowTableModal(true);
  };

  // Open Edit Table (Allows editing name and number)
  const handleOpenEditTable = (table: PosTableConfig) => {
    setEditingTableId(table.id);
    setTableNumber(table.number);
    setTableName(table.name);
    setTableCapacity(table.capacity || 4);
    setTableArea(table.area || 'Indoor');
    setTableNotes(table.notes || '');
    setIsTableActive(table.isActive);
    setTableFeedback(null);
    setShowTableModal(true);
  };

  // Save Table (Create or Update)
  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setTableFeedback({ type: 'error', message: 'Nomor meja wajib diisi!' });
      return;
    }
    if (!tableName.trim()) {
      setTableFeedback({ type: 'error', message: 'Nama meja wajib diisi!' });
      return;
    }

    if (editingTableId) {
      const res = updatePosTable(editingTableId, {
        number: tableNumber.trim(),
        name: tableName.trim(),
        capacity: Number(tableCapacity) || 1,
        area: tableArea,
        notes: tableNotes.trim() || undefined,
        isActive: isTableActive,
      });
      if (res.success) {
        setTableFeedback({ type: 'success', message: res.message });
        setShowTableModal(false);
      } else {
        setTableFeedback({ type: 'error', message: res.message });
      }
    } else {
      const res = addPosTable({
        number: tableNumber.trim(),
        name: tableName.trim(),
        capacity: Number(tableCapacity) || 1,
        area: tableArea,
        notes: tableNotes.trim() || undefined,
        isActive: isTableActive,
      });
      if (res.success) {
        setTableFeedback({ type: 'success', message: res.message });
        setShowTableModal(false);
      } else {
        setTableFeedback({ type: 'error', message: res.message });
      }
    }
  };

  // Confirm delete table
  const confirmDeleteTable = () => {
    if (!tableToDelete) return;
    const res = deletePosTable(tableToDelete.id);
    if (res.success) {
      setTableFeedback({ type: 'success', message: res.message });
    } else {
      setTableFeedback({ type: 'error', message: res.message });
    }
    setTableToDelete(null);
  };

  // Open Add Promo
  const handleOpenAddPromo = () => {
    setEditingPromoId(null);
    setPromoName('');
    setPromoPercent(10);
    setPromoApplyTo('all');
    setSelectedItemIds([]);
    setMinOrder(0);
    setIsPromoActive(true);
    setMenuSearch('');
    setShowPromoModal(true);
  };

  // Open Edit Promo
  const handleOpenEditPromo = (promo: PosPromoConfig) => {
    setEditingPromoId(promo.id);
    setPromoName(promo.name);
    setPromoPercent(promo.discountPercent);
    setPromoApplyTo(promo.applyTo);
    setSelectedItemIds(promo.itemIds || []);
    setMinOrder(promo.minOrderAmount || 0);
    setIsPromoActive(promo.isActive);
    setMenuSearch('');
    setShowPromoModal(true);
  };

  // Toggle item selection for specific promo
  const handleToggleMenuItem = (menuId: string) => {
    setSelectedItemIds(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  // Save Promo
  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName.trim()) {
      alert('Nama promo wajib diisi!');
      return;
    }
    if (promoPercent <= 0 || promoPercent > 100) {
      alert('Persentase promo harus di antara 1% sampai 100%!');
      return;
    }
    if (promoApplyTo === 'specific' && selectedItemIds.length === 0) {
      alert('Pilih minimal 1 menu untuk promo khusus!');
      return;
    }

    if (editingPromoId) {
      updatePromo(editingPromoId, {
        name: promoName.trim(),
        discountPercent: promoPercent,
        applyTo: promoApplyTo,
        itemIds: promoApplyTo === 'specific' ? selectedItemIds : undefined,
        minOrderAmount: minOrder > 0 ? minOrder : undefined,
        isActive: isPromoActive,
      });
    } else {
      addPromo({
        name: promoName.trim(),
        discountPercent: promoPercent,
        applyTo: promoApplyTo,
        itemIds: promoApplyTo === 'specific' ? selectedItemIds : undefined,
        minOrderAmount: minOrder > 0 ? minOrder : undefined,
        isActive: isPromoActive,
      });
    }

    setShowPromoModal(false);
  };

  // Save Tax & Service
  const handleSaveTaxService = (e: React.FormEvent) => {
    e.preventDefault();
    updateTaxServiceConfig({
      taxPercent: Math.max(0, taxRate),
      isTaxActive,
      servicePercent: Math.max(0, serviceRate),
      isServiceActive
    });
    setTaxFeedback('Pengaturan Pajak & Service Charge berhasil disimpan!');
    setTimeout(() => setTaxFeedback(null), 3000);
  };

  const filteredMenuItems = menuItems.filter(m => 
    m.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
    m.category.toLowerCase().includes(menuSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-extrabold border border-amber-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Manager Only Area</span>
            </span>
            <h2 className="text-xl font-black text-white">Back Office POS & Pricing Control</h2>
          </div>
          <p className="text-xs text-slate-300">
            Kelola diskon promo resto, penentuan menu yang dipotong diskon, serta tarif pajak restoran (PB1) & service charge.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 flex-wrap">
          <button
            onClick={() => setActiveSection('tables')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'tables' 
                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kelola Meja ({restoTables.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('promos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'promos' 
                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Pengaturan Promo ({promos.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('tax_service')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'tax_service' 
                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Pajak & Service</span>
          </button>
        </div>
      </div>

      {/* SECTION: TABLE MANAGEMENT (MANAGER ONLY) */}
      {activeSection === 'tables' && (
        <div className="space-y-4">
          {tableFeedback && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
              tableFeedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {tableFeedback.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{tableFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setTableFeedback(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Daftar Meja Restoran (Kelola Nama & Nomor Meja)</h3>
              <p className="text-xs text-slate-500">
                Atur nama meja, nomor meja, area penempatan, serta kapasitas kursi. Data meja ini digunakan langsung pada POS kasir.
              </p>
            </div>
            <button
              onClick={handleOpenAddTable}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Meja Baru</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Total Meja</span>
              <strong className="text-lg font-black text-slate-900">{restoTables.length} Meja</strong>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Meja Aktif</span>
              <strong className="text-lg font-black text-emerald-700">
                {restoTables.filter(t => t.isActive).length} Meja
              </strong>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Total Kapasitas Kursi</span>
              <strong className="text-lg font-black text-indigo-700">
                {restoTables.reduce((s, t) => s + (t.capacity || 0), 0)} Pax
              </strong>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Area Meja</span>
              <strong className="text-lg font-black text-amber-700">
                {Array.from(new Set(restoTables.map(t => t.area))).length} Zona Area
              </strong>
            </div>
          </div>

          {/* Table Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {restoTables.map((tbl) => {
              const areaColor = 
                tbl.area === 'VIP' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                tbl.area === 'Outdoor' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                tbl.area === 'Bar' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                tbl.area === 'Terrace' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                'bg-blue-100 text-blue-800 border-blue-200';

              return (
                <div 
                  key={tbl.id} 
                  className={`bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all hover:shadow-md ${
                    tbl.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/70 opacity-75'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black font-mono bg-slate-900 text-white">
                        No. {tbl.number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${areaColor}`}>
                        {tbl.area}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{tbl.name}</h4>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <Armchair className="w-3.5 h-3.5 text-slate-400" />
                        <span>Kapasitas: <strong>{tbl.capacity} Pax</strong></span>
                      </div>
                      {tbl.notes && (
                        <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">{tbl.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      tbl.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tbl.isActive ? '● Aktif' : '○ Non-Aktif'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTable(tbl)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Edit Nama & Nomor Meja"
                      >
                        <Pencil className="w-3 h-3 text-slate-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTableToDelete(tbl)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs transition-all cursor-pointer"
                        title="Hapus Meja"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 1: PROMOS & DISCOUNTS */}
      {activeSection === 'promos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Daftar Promo & Program Diskon</h3>
              <p className="text-xs text-slate-500">Promo yang aktif dapat langsung dipilih oleh kasir dan kru saat input order.</p>
            </div>
            <button
              onClick={handleOpenAddPromo}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Promo Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.map(promo => {
              const targetedItems = promo.itemIds 
                ? menuItems.filter(m => promo.itemIds?.includes(m.id))
                : [];

              return (
                <div 
                  key={promo.id} 
                  className={`bg-white rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                    promo.isActive ? 'border-indigo-200 shadow-xs' : 'border-slate-200 opacity-60 bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          promo.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {promo.isActive ? 'Aktif Digunakan' : 'Nonaktif'}
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-1">{promo.name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-indigo-700">
                          {promo.discountPercent}%
                        </span>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Diskon</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Cakupan Diskon:</span>
                        <strong className="text-slate-900">
                          {promo.applyTo === 'all' ? 'Seluruh Menu Pesanan' : `${targetedItems.length} Menu Tertentu`}
                        </strong>
                      </div>

                      {promo.applyTo === 'specific' && targetedItems.length > 0 && (
                        <div className="p-2 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-950 font-medium">
                          <span className="font-bold block mb-0.5 text-indigo-800">Menu yang Dipotong:</span>
                          <p className="line-clamp-2">{targetedItems.map(i => i.name).join(', ')}</p>
                        </div>
                      )}

                      {promo.minOrderAmount && promo.minOrderAmount > 0 && (
                        <div className="flex items-center justify-between text-slate-600 text-[11px]">
                          <span>Min. Pembelian:</span>
                          <strong className="text-slate-900">{formatRupiah(promo.minOrderAmount)}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => updatePromo(promo.id, { isActive: !promo.isActive })}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                        promo.isActive 
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {promo.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditPromo(promo)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="Edit Promo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus promo "${promo.name}"?`)) {
                            deletePromo(promo.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                        title="Hapus Promo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: TAX & SERVICE CHARGE */}
      {activeSection === 'tax_service' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
            <div>
              <h3 className="text-base font-black text-slate-900">Setting Pajak & Service Charge</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nilai persentase ini akan otomatis mengkalkulasi tagihan di kasir dan tercetak di struk pelanggan.
              </p>
            </div>

            {taxFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{taxFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveTaxService} className="space-y-5">
              {/* Pajak Restoran (PB1) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-slate-900 text-sm block">Pajak Restoran (PB1 / Pajak Daerah)</span>
                    <span className="text-[11px] text-slate-500">Pajak makanan & minuman standar restoran</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTaxActive}
                      onChange={(e) => setIsTaxActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Persentase Pajak (%):</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.5"
                        disabled={!isTaxActive}
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-extrabold text-sm disabled:opacity-50"
                      />
                      <span className="absolute right-3 top-2.5 font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-5">
                    Standar PB1 di Indonesia umumnya adalah <strong>10%</strong>.
                  </div>
                </div>
              </div>

              {/* Service Charge */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-slate-900 text-sm block">Service Charge Restoran</span>
                    <span className="text-[11px] text-slate-500">Biaya layanan operasional / tip kasir & floor</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isServiceActive}
                      onChange={(e) => setIsServiceActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Persentase Service (%):</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        disabled={!isServiceActive}
                        value={serviceRate}
                        onChange={(e) => setServiceRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-extrabold text-sm disabled:opacity-50"
                      />
                      <span className="absolute right-3 top-2.5 font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-5">
                    Standar industri F&B berkisar antara <strong>3% - 7%</strong>.
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pengaturan Pajak & Service</span>
                </button>
              </div>
            </form>
          </div>

          {/* SIMULATOR STRUK LIVE */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <h4 className="font-black text-slate-900">Simulasi Struk Pelanggan</h4>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 font-mono space-y-2 text-[11px]">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-bold text-slate-900">IMAH KAYU JATINANGOR</div>
                <div className="text-[10px] text-slate-500">CONTOH STRUK KASIR</div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>2x Nasi Goreng Spesial</span>
                  <span>{formatRupiah(90000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>2x Es Teh Manis</span>
                  <span>{formatRupiah(10000)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatRupiah(100000)}</span>
                </div>

                {isServiceActive && (
                  <div className="flex justify-between text-indigo-700">
                    <span>Service Charge ({serviceRate}%)</span>
                    <span>+{formatRupiah(Math.round(100000 * (serviceRate / 100)))}</span>
                  </div>
                )}

                {isTaxActive && (
                  <div className="flex justify-between text-amber-800">
                    <span>Pajak Restoran PB1 ({taxRate}%)</span>
                    <span>+{formatRupiah(Math.round((100000 + (isServiceActive ? 100000 * (serviceRate / 100) : 0)) * (taxRate / 100)))}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-300">
                  <span>TOTAL BILL</span>
                  <span>
                    {formatRupiah(
                      Math.round(
                        100000 +
                        (isServiceActive ? 100000 * (serviceRate / 100) : 0) +
                        ((100000 + (isServiceActive ? 100000 * (serviceRate / 100) : 0)) * (isTaxActive ? taxRate / 100 : 0))
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic">
              * Perhitungan di atas mencerminkan tagihan yang akan diterima oleh kasir saat membuat pesanan di meja.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: FORM PROMO BARU / EDIT */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in duration-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingPromoId ? 'Edit Pengaturan Promo' : 'Tambah Promo Diskon Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Atur diskon persen & item yang berhak mendapat diskon</p>
                </div>
              </div>
              <button
                onClick={() => setShowPromoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4 mt-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Promo:</label>
                <input
                  type="text"
                  required
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  placeholder="Contoh: Promo Gajian 20% atau Diskon Steak Spesial"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Persen Diskon (%):</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={promoPercent}
                    onChange={(e) => setPromoPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min. Belanja (Rp - Opsional):</label>
                  <input
                    type="number"
                    min="0"
                    value={minOrder}
                    onChange={(e) => setMinOrder(parseFloat(e.target.value) || 0)}
                    placeholder="0 jika tanpa min."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              {/* Target Diskon */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Target Penerapan Diskon:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPromoApplyTo('all')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all ${
                      promoApplyTo === 'all' 
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-2 ring-indigo-200' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-xs">Seluruh Menu Pesanan</span>
                    <span className="text-[10px] text-slate-500 font-normal">Diskon memotong total seluruh bill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPromoApplyTo('specific')}
                    className={`p-3 rounded-xl border text-left font-bold transition-all ${
                      promoApplyTo === 'specific' 
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-2 ring-indigo-200' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-xs">Item Menu Tertentu</span>
                    <span className="text-[10px] text-slate-500 font-normal">Hanya item yang dipilih yang didiskon</span>
                  </button>
                </div>
              </div>

              {/* Multi Select for Specific Items */}
              {promoApplyTo === 'specific' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Pilih Menu ({selectedItemIds.length} terpilih):
                    </span>
                    <input
                      type="text"
                      placeholder="Cari menu..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px]"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                    {filteredMenuItems.map(m => {
                      const isSelected = selectedItemIds.includes(m.id);
                      return (
                        <label 
                          key={m.id} 
                          className="pt-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 p-1 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleMenuItem(m.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">{m.name}</span>
                              <span className="text-[10px] text-slate-500">{m.category} • {formatRupiah(m.sellingPrice)}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                              Diskon {promoPercent}%
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPromoActive}
                    onChange={(e) => setIsPromoActive(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="font-bold text-slate-700">Promo Aktif Langsung</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPromoModal(false)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    Simpan Promo
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / TAMBAH MEJA RESTORAN (MANAGER ONLY) */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in duration-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingTableId ? 'Edit Nama & Nomor Meja' : 'Tambah Meja Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Konfigurasi meja restoran untuk pemesanan kasir POS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTableModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Nomor Meja <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Contoh: 01, 02, VIP-1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Kode/nomor singkat meja</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Area Penempatan
                  </label>
                  <select
                    value={tableArea}
                    onChange={(e) => setTableArea(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 bg-white"
                  >
                    <option value="Indoor">Indoor (Ruang Utama)</option>
                    <option value="Outdoor">Outdoor (Luar Ruang)</option>
                    <option value="VIP">VIP Room (Khusus)</option>
                    <option value="Bar">Bar Counter</option>
                    <option value="Terrace">Terrace / Balkon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Meja <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Contoh: Meja 01 (Indoor), Meja VIP Merapi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Nama meja yang tampil di tombol kasir POS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Kapasitas Kursi (Pax) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={tableCapacity}
                    onChange={(e) => setTableCapacity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Jumlah maksimal tamu duduk</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Catatan Lokasi Meja (Opsional)
                  </label>
                  <input
                    type="text"
                    value={tableNotes}
                    onChange={(e) => setTableNotes(e.target.value)}
                    placeholder="Contoh: Dekat jendela, colokan listrik"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Status Aktif Meja</span>
                  <p className="text-[10px] text-slate-500">Meja non-aktif tidak akan muncul di pilihan POS kasir</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTableActive}
                    onChange={(e) => setIsTableActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTableId ? 'Simpan Perubahan' : 'Tambah Meja'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS MEJA */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in duration-200 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Hapus Meja Restoran?</h3>
                <p className="text-[11px] text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="py-4 space-y-2">
              <p className="text-slate-600 leading-relaxed">
                Anda yakin ingin menghapus meja <strong className="text-slate-900">{tableToDelete.name}</strong> (No. {tableToDelete.number})?
              </p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                Meja yang masih memiliki pesanan aktif belum bayar tidak dapat dihapus demi keamanan audit kasir.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteTable}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Meja</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
