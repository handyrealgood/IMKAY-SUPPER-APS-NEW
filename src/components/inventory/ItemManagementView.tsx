import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useResto } from '../../context/RestoContext';
import { RawItem, ItemCategory, ItemUnit, StorageLocation } from '../../types';
import { exportRawItemsToExcel, downloadRawItemsTemplateExcel } from '../../utils/excelExport';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Edit3, 
  Layers, 
  ArrowUpDown,
  Sparkles,
  Trash2,
  X,
  AlertCircle,
  FileSpreadsheet,
  Upload,
  Download,
  FileCheck,
  FileWarning,
  HelpCircle,
  Check,
  RotateCcw,
  Tag
} from 'lucide-react';

export const ItemManagementView: React.FC = () => {
  const { 
    rawItems, 
    menuItems,
    addRawItem, 
    bulkAddRawItems,
    updateRawItem, 
    deleteRawItem, 
    currentUser, 
    formatRupiah, 
    setActiveTab,
    branding
  } = useResto();

  const isManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'critical' | 'safe'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RawItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<RawItem | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Import states
  const [parsedImportItems, setParsedImportItems] = useState<Array<{
    code: string;
    isAutoCode: boolean;
    name: string;
    category: ItemCategory;
    unit: ItemUnit;
    currentStock: number;
    minimumStock: number;
    costPerUnit: number;
    location: StorageLocation;
    isValid: boolean;
  }>>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Bahan Baku Basah' as ItemCategory,
    unit: 'kg' as ItemUnit,
    currentStock: 0,
    minimumStock: 5,
    costPerUnit: 25000,
    location: 'Kitchen' as StorageLocation,
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isEditCustomCategory, setIsEditCustomCategory] = useState(false);

  const defaultCategories: string[] = [
    'Bahan Baku Basah',
    'Bahan Baku Kering',
    'Bumbu & Saus',
    'Dairy & Telur',
    'Daging & Seafood',
    'Powder',
    'Sayuran',
    'Buah',
    'Packaging & Supplies',
    'Perlengkapan Floor',
    'Syrup',
    'Coffee Beans',
  ];

  // Dynamic available categories: combine default presets + any custom categories stored in database
  const availableCategories = useMemo(() => {
    const set = new Set<string>(defaultCategories);
    rawItems.forEach(item => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [rawItems]);

  const categories = availableCategories;

  const units: ItemUnit[] = ['kg', 'gram', 'liter', 'ml', 'pcs', 'pack', 'can', 'Galon', 'Tabung', 'portion'];
  const locations: StorageLocation[] = ['Kitchen', 'Bar', 'Floor', 'Gudang'];

  // Filter items
  const filteredItems = rawItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesLoc = selectedLocation === 'all' || item.location === selectedLocation;
    const isCritical = item.currentStock <= item.minimumStock;
    const matchesStatus = stockStatusFilter === 'all' 
      ? true 
      : stockStatusFilter === 'critical' ? isCritical : !isCritical;

    return matchesSearch && matchesCat && matchesLoc && matchesStatus;
  });

  const criticalCount = rawItems.filter(i => i.currentStock <= i.minimumStock).length;

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const itemCode = formData.code.trim() || `BB-${String(rawItems.length + 1).padStart(3, '0')}`;
    const finalCategory = (formData.category || '').trim() || 'Bahan Baku Basah';

    addRawItem({
      code: itemCode,
      name: formData.name.trim(),
      category: finalCategory,
      unit: formData.unit,
      currentStock: Number(formData.currentStock),
      minimumStock: Number(formData.minimumStock),
      costPerUnit: Number(formData.costPerUnit),
      location: formData.location,
    });

    setShowAddModal(false);
    setIsCustomCategory(false);
    setFormData({
      code: '',
      name: '',
      category: 'Bahan Baku Basah',
      unit: 'kg',
      currentStock: 0,
      minimumStock: 5,
      costPerUnit: 25000,
      location: 'Kitchen',
    });
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const finalCategory = (editingItem.category || '').trim() || 'Bahan Baku Basah';

    updateRawItem(editingItem.id, {
      name: editingItem.name,
      code: editingItem.code,
      category: finalCategory,
      unit: editingItem.unit,
      currentStock: Number(editingItem.currentStock),
      minimumStock: Number(editingItem.minimumStock),
      costPerUnit: Number(editingItem.costPerUnit),
      location: editingItem.location,
    });

    setEditingItem(null);
    setIsEditCustomCategory(false);
    setActionMessage(`Bahan "${editingItem.name}" berhasil diperbarui.`);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleConfirmDeleteItem = () => {
    if (!deletingItem) return;
    const success = deleteRawItem(deletingItem.id);
    if (success) {
      setActionMessage(`Bahan baku "${deletingItem.name}" (${deletingItem.code}) berhasil dihapus.`);
    } else {
      setActionMessage(`Gagal menghapus bahan "${deletingItem.name}".`);
    }
    setTimeout(() => setActionMessage(null), 3500);
    setDeletingItem(null);
  };

  // Check if an item is used in any menu
  const getItemUsedInMenus = (itemId: string) => {
    return menuItems.filter(m => m.recipes.some(r => r.itemId === itemId));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    if ('dataTransfer' in e) {
      e.preventDefault();
      file = e.dataTransfer.files?.[0] || null;
    } else {
      file = e.target.files?.[0] || null;
    }

    if (!file) return;
    setImportFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        // Find sheet: look for sheet with 'template' or 'bahan' or first sheet
        const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('template') || n.toLowerCase().includes('bahan')) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          setImportError('Sheet data tidak ditemukan di dalam file Excel.');
          return;
        }

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        if (!rawRows || rawRows.length === 0) {
          setImportError('Tidak ada baris data yang terdeteksi di dalam file Excel.');
          return;
        }

        // Helper to find column value by loose name
        const getVal = (row: any, candidates: string[]) => {
          const keys = Object.keys(row);
          for (const candidate of candidates) {
            const matchedKey = keys.find(k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, '').includes(candidate));
            if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
              return String(row[matchedKey]).trim();
            }
          }
          return '';
        };

        // Determine starting next available BB-XXX number
        let nextNum = 1;
        rawItems.forEach(it => {
          const match = it.code?.match(/BB-(\d+)/i);
          if (match) {
            const n = parseInt(match[1], 10);
            if (!isNaN(n) && n >= nextNum) nextNum = n + 1;
          }
        });

        const parsed: Array<{
          code: string;
          isAutoCode: boolean;
          name: string;
          category: ItemCategory;
          unit: ItemUnit;
          currentStock: number;
          minimumStock: number;
          costPerUnit: number;
          location: StorageLocation;
          isValid: boolean;
        }> = [];

        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];
          
          // Skip header explanation rows if any
          const firstVal = Object.values(row)[0];
          if (typeof firstVal === 'string' && (
            firstVal.toLowerCase().includes('panduan') || 
            firstVal.toLowerCase().includes('wajib') || 
            firstVal.toLowerCase().includes('petunjuk')
          )) {
            continue;
          }

          const rawCode = getVal(row, ['kodebarang', 'kodeitem', 'kodebahan', 'code', 'kode']);
          const rawName = getVal(row, ['namabahanbaku', 'namabarang', 'namabahan', 'nama', 'itemname', 'name']);
          
          if (!rawName) continue;

          let finalCode = rawCode;
          let isAuto = false;
          if (!finalCode) {
            finalCode = `BB-${String(nextNum++).padStart(3, '0')}`;
            isAuto = true;
          }

          // Category matching
          const rawCat = getVal(row, ['kategori', 'category']);
          let category: ItemCategory = 'Bahan Baku Basah';
          if (rawCat) {
            const matchedCat = availableCategories.find(c => c.toLowerCase() === rawCat.toLowerCase() || rawCat.toLowerCase().includes(c.toLowerCase().slice(0, 5)));
            if (matchedCat) {
              category = matchedCat;
            } else {
              category = rawCat.trim();
            }
          }

          // Unit matching
          const rawUnit = getVal(row, ['satuanunit', 'satuan', 'unit']).toLowerCase();
          let unit: ItemUnit = 'kg';
          if (rawUnit) {
            const matchedUnit = units.find(u => u.toLowerCase() === rawUnit || rawUnit.includes(u));
            if (matchedUnit) unit = matchedUnit;
          }

          // Location matching
          const rawLoc = getVal(row, ['lokasipenyimpanan', 'lokasi', 'location', 'storage']);
          let location: StorageLocation = 'Kitchen';
          if (rawLoc) {
            const matchedLoc = locations.find(l => l.toLowerCase() === rawLoc.toLowerCase() || rawLoc.toLowerCase().includes(l.toLowerCase().slice(0, 4)));
            if (matchedLoc) location = matchedLoc;
          }

          // Number parsing
          const rawStock = getVal(row, ['stoksaatini', 'stokawal', 'stok', 'stock', 'qty', 'quantity']);
          const rawMin = getVal(row, ['batasstokminimum', 'stokminimum', 'minstok', 'minimum', 'min']);
          const rawCost = getVal(row, ['hargabeli', 'hpp', 'hargasatuan', 'cost', 'harga']);

          const currentStock = Math.max(0, parseFloat(rawStock.replace(/[^0-9.-]/g, '')) || 0);
          const minimumStock = Math.max(0, parseFloat(rawMin.replace(/[^0-9.-]/g, '')) || 5);
          const costPerUnit = Math.max(0, parseFloat(rawCost.replace(/[^0-9.-]/g, '')) || 0);

          parsed.push({
            code: finalCode,
            isAutoCode: isAuto,
            name: rawName,
            category,
            unit,
            currentStock,
            minimumStock,
            costPerUnit,
            location,
            isValid: true,
          });
        }

        if (parsed.length === 0) {
          setImportError('Tidak ada data bahan baku valid yang berhasil dibaca. Pastikan file memiliki kolom "Nama Bahan Baku".');
          return;
        }

        setParsedImportItems(parsed);
      } catch (err: any) {
        console.error('Error parsing Excel:', err);
        setImportError(`Gagal membaca file Excel: ${err.message || 'Format tidak didukung'}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (parsedImportItems.length === 0) return;
    setIsProcessingImport(true);

    try {
      const result = bulkAddRawItems(parsedImportItems.map(item => ({
        code: item.code,
        name: item.name,
        category: item.category,
        unit: item.unit,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock,
        costPerUnit: item.costPerUnit,
        location: item.location,
      })));

      setActionMessage(`Sukses! ${result.addedCount} bahan baku baru berhasil ditambahkan${result.updatedCount > 0 ? ` dan ${result.updatedCount} bahan diperbarui` : ''} dari file Excel.`);
      setTimeout(() => setActionMessage(null), 4500);
      setShowImportModal(false);
      setParsedImportItems([]);
      setImportFileName('');
    } catch (err) {
      setImportError('Terjadi kendala saat menyimpan data ke database.');
    } finally {
      setIsProcessingImport(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Master Data Bahan Baku & Inventaris</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {rawItems.length} Total Bahan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Input bahan baku baru, monitor stok aktual secara real-time, dan setel batas notifikasi stok minimum.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('recipes')}
            className="flex-1 sm:flex-initial px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors"
          >
            Lihat Resep & HPP
          </button>

          {/* Export Excel Button with Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportModal(prev => !prev)}
              className="flex-1 sm:flex-initial px-3.5 py-2 border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              title="Export data bahan baku ke Excel atau unduh template"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            {showExportModal && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 animate-in fade-in duration-150">
                <button
                  onClick={() => {
                    exportRawItemsToExcel(rawItems, branding?.systemName || branding?.outletName || 'Restoran');
                    setShowExportModal(false);
                    setActionMessage('Berhasil mengekspor seluruh master bahan baku ke file Excel (.xlsx).');
                    setTimeout(() => setActionMessage(null), 3500);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <div>
                    <span className="block">Export Data Bahan Baku (.xlsx)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Unduh {rawItems.length} bahan yang terdaftar</span>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => {
                    downloadRawItemsTemplateExcel(branding?.systemName || branding?.outletName || 'Restoran');
                    setShowExportModal(false);
                    setActionMessage('Template Excel impor bahan baku berhasil diunduh.');
                    setTimeout(() => setActionMessage(null), 3500);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  <div>
                    <span className="block">Unduh Format Template Excel</span>
                    <span className="text-[10px] text-slate-400 font-normal">Format siap isi + kode auto & panduan</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Upload / Impor Excel Button */}
          <button
            onClick={() => {
              setShowImportModal(true);
              setParsedImportItems([]);
              setImportFileName('');
              setImportError(null);
            }}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 ring-2 ring-emerald-600/30"
            title="Upload file Excel (.xlsx / .xls / .csv) untuk impor banyak bahan baku sekaligus"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>Upload / Impor Excel</span>
          </button>

          {/* Tambah Bahan Baru Manual */}
          <button
            onClick={() => {
              setIsCustomCategory(false);
              setShowAddModal(true);
            }}
            className="flex-1 sm:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Tambah Bahan Manual</span>
          </button>
        </div>
      </div>

      {/* Action Message Feedback Toast */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Critical Stock Alert Bar */}
      {criticalCount > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm">Peringatan Otomatis: {criticalCount} Item Mencapai Level Minimum!</h4>
              <p className="text-xs text-red-100 mt-0.5">
                Stok aktual berada pada atau di bawah batas minimum pemesanan. Segera lakukan receiving dari supplier atau belanja kas kecil.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStockStatusFilter('critical')}
            className="hidden sm:block px-3.5 py-1.5 bg-white text-red-700 hover:bg-red-50 rounded-xl text-xs font-extrabold transition-all"
          >
            Filter Bahan Kritis
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama bahan baku atau kode (misal: Sapi, Ayam, Kopi)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
            >
              <option value="all">Semua Kategori ({rawItems.length})</option>
              {availableCategories.map(cat => {
                const count = rawItems.filter(i => i.category === cat).length;
                return (
                  <option key={cat} value={cat}>{cat} ({count})</option>
                );
              })}
            </select>
          </div>

          {/* Storage Location Filter */}
          <div className="w-full sm:w-44">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
            >
              <option value="all">Semua Lokasi</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Status Buttons */}
          <div className="flex rounded-xl bg-slate-100 p-1 shrink-0">
            <button
              onClick={() => setStockStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                stockStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({rawItems.length})
            </button>
            <button
              onClick={() => setStockStatusFilter('critical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                stockStatusFilter === 'critical' ? 'bg-red-600 text-white shadow-xs' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Kritis ({criticalCount})
            </button>
          </div>

        </div>
      </div>

      {/* Table of Inventory */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Kode & Nama Bahan</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Lokasi</th>
                <th className="py-3.5 px-4">Harga Beli / Unit</th>
                <th className="py-3.5 px-4">Stok Minimum</th>
                <th className="py-3.5 px-4">Stok Aktual Sistem</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada bahan baku yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isCritical = item.currentStock <= item.minimumStock;
                  const ratio = Math.min(100, Math.round((item.currentStock / (item.minimumStock * 2)) * 100));

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isCritical ? 'bg-red-50/20' : ''}`}>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{item.name}</div>
                        <span className="text-[10px] text-slate-400 font-normal">{item.code}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.location}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {formatRupiah(item.costPerUnit)} <span className="text-slate-400 font-normal">/ {item.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {item.minimumStock} {item.unit}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${isCritical ? 'text-red-600' : 'text-slate-900'}`}>
                            {item.currentStock.toFixed(1)} {item.unit}
                          </span>
                        </div>
                        {/* Visual stock health bar */}
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isCritical ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3" />
                            Kritis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Edit Bahan / Penyesuaian Cepat"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">Edit</span>
                          </button>
                          {isManager && (
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1"
                              title="Hapus Bahan Baku yang Tidak Terpakai (Manager)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-semibold hidden sm:inline">Hapus</span>
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
      </div>

      {/* Modal Tambah Bahan Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-900">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Input Data Bahan Baku Baru</h3>
                  <p className="text-xs text-slate-500">Daftarkan bahan baku atau kemasan baru ke sistem</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Quick Banner to Switch to Excel Upload */}
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-950">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-semibold">Punya banyak data di file Excel?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowImportModal(true);
                  setParsedImportItems([]);
                  setImportFileName('');
                  setImportError(null);
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shrink-0 transition-colors shadow-2xs cursor-pointer"
              >
                Upload Excel
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5 mt-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Bahan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Auto: BB-016"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori <span className="text-red-500">*</span></label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ItemCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Bahan Baku <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bawang Bombay Kupas, Tepung Terigu Segitiga"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan Dasar <span className="text-red-500">*</span></label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as ItemUnit })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Penyimpanan <span className="text-red-500">*</span></label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value as StorageLocation })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  >
                    {locations.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-red-600">Batas Min Alert</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Beli (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-800 border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Sistem akan otomatis mengirimkan notifikasi peringatan jika stok aktual berada pada atau di bawah <strong>Batas Min Alert</strong>.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Simpan Bahan Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Item */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Edit / Sesuaikan Bahan: {editingItem.name}</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Bahan</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Beli per Satuan (Rp)</label>
                  <input
                    type="number"
                    value={editingItem.costPerUnit}
                    onChange={(e) => setEditingItem({ ...editingItem, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-red-600">Batas Stok Minimum</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.minimumStock}
                    onChange={(e) => setEditingItem({ ...editingItem, minimumStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Koreksi Stok Aktual Sistem ({editingItem.unit})</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingItem.currentStock}
                  onChange={(e) => setEditingItem({ ...editingItem, currentStock: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-sm text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  *Untuk penyesuaian berkala, disarankan menggunakan modul Stock Opname atau Receiving.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700"
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

      {/* Modal Hapus Bahan Baku Tidak Terpakai */}
      {deletingItem && (() => {
        const usedMenus = getItemUsedInMenus(deletingItem.id);
        const isUsed = usedMenus.length > 0;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Hapus Bahan Baku</h3>
                    <p className="text-xs text-slate-500">Pembersihan item inventaris yang sudah tidak terpakai</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeletingItem(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-lg"
                >
                  &times;
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-extrabold text-sm text-slate-900">{deletingItem.name}</div>
                  <div className="text-slate-500 mt-0.5">
                    Kode: <strong className="text-slate-700">{deletingItem.code}</strong> • Kategori: {deletingItem.category}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Stok saat ini: <strong className="text-slate-900">{deletingItem.currentStock} {deletingItem.unit}</strong> (@ {formatRupiah(deletingItem.costPerUnit)})
                  </div>
                </div>

                {isUsed ? (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Perhatian: Bahan ini digunakan di {usedMenus.length} Resep Menu!</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Bahan ini masih tercatat aktif di resep menu berikut:
                    </p>
                    <ul className="list-disc list-inside text-[11px] text-amber-900 font-medium pl-1">
                      {usedMenus.map(m => (
                        <li key={m.id}>{m.name} ({m.code})</li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-amber-700 mt-1">
                      * Disarankan untuk menghapus atau mengganti bahan pada resep menu terkait terlebih dahulu sebelum menghapus item ini dari inventaris.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Item ini <strong>tidak digunakan</strong> di menu manapun. Aman untuk dihapus.</span>
                  </div>
                )}

                <p className="text-slate-600">
                  Apakah Anda yakin ingin menghapus item ini secara permanen dari sistem inventaris?
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDeletingItem(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteItem}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition-all"
                  >
                    Ya, Hapus Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL IMPOR EXCEL MASSAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 animate-in fade-in duration-200 text-xs my-6 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Impor Bahan Baku Massal via Excel
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tambah puluhan hingga ratusan bahan baku baru sekaligus ke sistem via file .xlsx / .xls / .csv
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setParsedImportItems([]);
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1">
              {/* Template Download Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 sm:mt-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-emerald-950 text-xs">Belum punya format file Excel yang sesuai?</h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Unduh template resmi siap pakai yang sudah dilengkapi contoh item, panduan kategori, dan satuan yang valid.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadRawItemsTemplateExcel(branding?.systemName || branding?.outletName || 'Restoran')}
                  className="shrink-0 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Unduh Template Excel (.xlsx)</span>
                </button>
              </div>

              {/* Auto-Code Explanation Banner */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-blue-900 leading-relaxed">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Kode Barang Otomatis Terisi:</strong> Kolom "Kode Barang" di Excel <strong>boleh dikosongkan</strong>. Sistem secara otomatis akan mengisi kode berurutan unik (misal: <span className="font-mono font-bold bg-blue-100 px-1 py-0.5 rounded text-blue-900">BB-001</span>, <span className="font-mono font-bold bg-blue-100 px-1 py-0.5 rounded text-blue-900">BB-002</span>, dst). Jika Anda menuliskan kode sendiri, kode tersebut akan tetap dipertahankan.
                </div>
              </div>

              {/* Upload Drop Zone / Input */}
              {parsedImportItems.length === 0 ? (
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileUpload}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center transition-colors bg-slate-50 hover:bg-emerald-50/30 flex flex-col items-center justify-center cursor-pointer group relative"
                >
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-slate-800 text-sm">
                    Tarik & Letakkan File Excel Di Sini
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    atau klik untuk memilih file dari komputer / laptop Anda (.xlsx, .xls, .csv)
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 shadow-xs">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pilih File dari Perangkat</span>
                  </div>
                </div>
              ) : (
                /* Parsed Preview Section */
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-900 block text-xs">
                          {importFileName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {parsedImportItems.length} bahan baku berhasil dibaca & siap diimpor ke sistem
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label 
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer text-[11px] flex items-center gap-1.5 shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ganti File</span>
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">No</th>
                          <th className="px-3 py-2">Kode Barang</th>
                          <th className="px-3 py-2">Nama Bahan</th>
                          <th className="px-3 py-2">Kategori</th>
                          <th className="px-3 py-2">Satuan</th>
                          <th className="px-3 py-2 text-right">Stok Awal</th>
                          <th className="px-3 py-2 text-right">Min Stok</th>
                          <th className="px-3 py-2 text-right">Harga HPP</th>
                          <th className="px-3 py-2">Lokasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedImportItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="px-3 py-2 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono font-bold text-slate-900">
                              <span className="flex items-center gap-1">
                                {item.code}
                                {item.isAutoCode && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-sans px-1 py-0.2 rounded font-bold">
                                    Auto
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-bold text-slate-800">{item.name}</td>
                            <td className="px-3 py-2 text-slate-600">{item.category}</td>
                            <td className="px-3 py-2 font-mono font-bold text-slate-700">{item.unit}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{item.currentStock}</td>
                            <td className="px-3 py-2 text-right font-mono text-slate-500">{item.minimumStock}</td>
                            <td className="px-3 py-2 text-right font-mono text-slate-900">{formatRupiah(item.costPerUnit)}</td>
                            <td className="px-3 py-2 text-slate-600">{item.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <span className="text-[11px] text-slate-400">
                {parsedImportItems.length > 0 
                  ? `${parsedImportItems.length} item akan disinkronkan ke seluruh sistem & database.`
                  : 'Pilih file Excel untuk melanjutkan.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setParsedImportItems([]);
                    setImportError(null);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={parsedImportItems.length === 0 || isProcessingImport}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  {isProcessingImport ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Impor {parsedImportItems.length > 0 ? `${parsedImportItems.length} Bahan` : ''} Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
