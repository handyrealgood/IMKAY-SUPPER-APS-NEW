import React, { useState, useMemo } from 'react';
import { useResto } from '../../context/RestoContext';
import { VariableCostRecord, VariableCostCategory } from '../../types';
import { 
  Zap, 
  Droplets, 
  Flame, 
  Wifi, 
  Sparkles, 
  Wrench, 
  PackageCheck, 
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  FileText,
  Building,
  Hash,
  Layers,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; defaultUnit: string }> = {
  listrik: { label: 'Listrik (PLN)', icon: Zap, color: 'bg-amber-100 text-amber-800 border-amber-300', defaultUnit: 'kWh' },
  air: { label: 'Air (PDAM/Sumur)', icon: Droplets, color: 'bg-blue-100 text-blue-800 border-blue-300', defaultUnit: 'm³' },
  gas: { label: 'Gas LPG / Dapur', icon: Flame, color: 'bg-orange-100 text-orange-800 border-orange-300', defaultUnit: 'Tabung' },
  internet: { label: 'Internet / WiFi & Telepon', icon: Wifi, color: 'bg-indigo-100 text-indigo-800 border-indigo-300', defaultUnit: 'Bulan' },
  kebersihan: { label: 'Kebersihan & Lingkungan', icon: Sparkles, color: 'bg-emerald-100 text-emerald-800 border-emerald-300', defaultUnit: 'Bulan' },
  operasional: { label: 'Perlengkapan Operasional', icon: PackageCheck, color: 'bg-purple-100 text-purple-800 border-purple-300', defaultUnit: 'Pcs' },
  maintenance: { label: 'Perbaikan & Maintenance', icon: Wrench, color: 'bg-slate-100 text-slate-800 border-slate-300', defaultUnit: 'Servis' },
  lainnya: { label: 'Biaya Variabel Lainnya', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-800 border-gray-300', defaultUnit: 'Unit' },
};

export const VariableCostView: React.FC = () => {
  const { 
    currentUser, 
    variableCosts, 
    addVariableCost, 
    updateVariableCost, 
    deleteVariableCost, 
    formatRupiah,
    branding 
  } = useResto();

  const isAuthorized = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VariableCostRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'listrik' as VariableCostCategory,
    customCategoryName: '',
    title: '',
    vendorOrProvider: '',
    customerOrMeterId: '',
    usageQuantity: '',
    usageUnit: 'kWh',
    amount: '',
    paymentStatus: 'Lunas' as 'Lunas' | 'Belum Lunas' | 'Jatuh Tempo',
    paymentMethod: 'Transfer Bank BCA',
    receiptPhotoUrl: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      category: 'listrik',
      customCategoryName: '',
      title: '',
      vendorOrProvider: '',
      customerOrMeterId: '',
      usageQuantity: '',
      usageUnit: 'kWh',
      amount: '',
      paymentStatus: 'Lunas',
      paymentMethod: 'Transfer Bank BCA',
      receiptPhotoUrl: '',
      notes: '',
    });
    setEditingRecord(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: VariableCostRecord) => {
    setEditingRecord(record);
    setFormData({
      date: record.date,
      category: record.category,
      customCategoryName: record.customCategoryName || '',
      title: record.title,
      vendorOrProvider: record.vendorOrProvider || '',
      customerOrMeterId: record.customerOrMeterId || '',
      usageQuantity: record.usageQuantity ? record.usageQuantity.toString() : '',
      usageUnit: record.usageUnit || 'kWh',
      amount: record.amount.toString(),
      paymentStatus: record.paymentStatus,
      paymentMethod: record.paymentMethod || 'Transfer Bank',
      receiptPhotoUrl: record.receiptPhotoUrl || '',
      notes: record.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleCategoryChange = (cat: VariableCostCategory) => {
    setFormData(prev => ({
      ...prev,
      category: cat,
      usageUnit: CATEGORY_CONFIG[cat].defaultUnit,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFeedback({ type: 'error', message: 'Judul tagihan/biaya wajib diisi!' });
      return;
    }
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFeedback({ type: 'error', message: 'Nominal biaya harus lebih besar dari Rp 0!' });
      return;
    }

    if (editingRecord) {
      const res = updateVariableCost(editingRecord.id, {
        date: formData.date,
        category: formData.category,
        customCategoryName: formData.category === 'lainnya' ? formData.customCategoryName : undefined,
        title: formData.title.trim(),
        vendorOrProvider: formData.vendorOrProvider.trim() || undefined,
        customerOrMeterId: formData.customerOrMeterId.trim() || undefined,
        usageQuantity: formData.usageQuantity ? parseFloat(formData.usageQuantity) : undefined,
        usageUnit: formData.usageUnit.trim() || undefined,
        amount: numAmount,
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod.trim() || undefined,
        receiptPhotoUrl: formData.receiptPhotoUrl.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });
      setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    } else {
      const res = addVariableCost({
        date: formData.date,
        category: formData.category,
        customCategoryName: formData.category === 'lainnya' ? formData.customCategoryName : undefined,
        title: formData.title.trim(),
        vendorOrProvider: formData.vendorOrProvider.trim() || undefined,
        customerOrMeterId: formData.customerOrMeterId.trim() || undefined,
        usageQuantity: formData.usageQuantity ? parseFloat(formData.usageQuantity) : undefined,
        usageUnit: formData.usageUnit.trim() || undefined,
        amount: numAmount,
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod.trim() || undefined,
        receiptPhotoUrl: formData.receiptPhotoUrl.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        recordedBy: currentUser.name,
        role: currentUser.role,
      });
      setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    }

    setIsModalOpen(false);
    resetForm();
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDelete = (id: string) => {
    const res = deleteVariableCost(id);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    setDeletingId(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return variableCosts.filter(rec => {
      if (selectedMonth && !rec.date.startsWith(selectedMonth)) return false;
      if (selectedCategory !== 'all' && rec.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = rec.title.toLowerCase().includes(q);
        const matchVendor = rec.vendorOrProvider?.toLowerCase().includes(q);
        const matchNotes = rec.notes?.toLowerCase().includes(q);
        const matchMeter = rec.customerOrMeterId?.toLowerCase().includes(q);
        if (!matchTitle && !matchVendor && !matchNotes && !matchMeter) return false;
      }
      return true;
    });
  }, [variableCosts, selectedMonth, selectedCategory, searchQuery]);

  // Aggregate Metrics for Selected Month
  const metrics = useMemo(() => {
    const recordsInMonth = variableCosts.filter(r => !selectedMonth || r.date.startsWith(selectedMonth));
    const totalAmount = recordsInMonth.reduce((sum, r) => sum + r.amount, 0);
    const listrikAmount = recordsInMonth.filter(r => r.category === 'listrik').reduce((sum, r) => sum + r.amount, 0);
    const airAmount = recordsInMonth.filter(r => r.category === 'air').reduce((sum, r) => sum + r.amount, 0);
    const gasAmount = recordsInMonth.filter(r => r.category === 'gas').reduce((sum, r) => sum + r.amount, 0);
    const unpaidAmount = recordsInMonth.filter(r => r.paymentStatus !== 'Lunas').reduce((sum, r) => sum + r.amount, 0);

    return { totalAmount, listrikAmount, airAmount, gasAmount, unpaidAmount, count: recordsInMonth.length };
  }, [variableCosts, selectedMonth]);

  // Excel Export
  const handleExportExcel = () => {
    const rows = filteredRecords.map((r, idx) => ({
      'No': idx + 1,
      'Tanggal': r.date,
      'Kategori': r.category === 'lainnya' ? (r.customCategoryName || 'Lain-lain') : CATEGORY_CONFIG[r.category].label,
      'Judul Tagihan / Biaya': r.title,
      'Penyedia / Vendor': r.vendorOrProvider || '-',
      'ID Pelanggan / No. Meter': r.customerOrMeterId || '-',
      'Volume Pemakaian': r.usageQuantity ? `${r.usageQuantity} ${r.usageUnit || ''}` : '-',
      'Nominal Biaya (Rp)': r.amount,
      'Status Pembayaran': r.paymentStatus,
      'Metode Pembayaran': r.paymentMethod || '-',
      'Dicatat Oleh': `${r.recordedBy} (${r.role})`,
      'Catatan': r.notes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Info': 'Tidak ada data biaya variabel' }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Biaya Variabel');
    XLSX.writeFile(workbook, `Biaya_Variabel_${branding.outletName.replace(/\s+/g, '_')}_${selectedMonth || 'Semua'}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            Keuangan & Pengeluaran Restoran
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Biaya Variabel & Utilitas</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan fleksibel biaya operasional (listrik PLN, air PDAM, gas elpiji dapur, wifi, kebersihan, servis, dll.)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-xs"
            title="Download Excel Biaya Variabel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Export Excel
          </button>

          {isAuthorized && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Catat Biaya Baru
            </button>
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

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Biaya ({selectedMonth || 'Semua'})</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {formatRupiah(metrics.totalAmount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.count} transaksi tagihan tercatat
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between text-xs font-medium text-amber-700">
            <span>Tagihan Listrik PLN</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-900 mt-2">
            {formatRupiah(metrics.listrikAmount)}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1">
            Energi listrik & penerangan
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex items-center justify-between text-xs font-medium text-blue-700">
            <span>Tagihan Air PDAM</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-blue-900 mt-2">
            {formatRupiah(metrics.airAmount)}
          </div>
          <div className="text-[11px] text-blue-600/80 mt-1">
            Kebersihan & sanitasi resto
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs bg-gradient-to-br from-white to-orange-50/40">
          <div className="flex items-center justify-between text-xs font-medium text-orange-700">
            <span>Gas LPG & Dapur</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-black text-orange-900 mt-2">
            {formatRupiah(metrics.gasAmount)}
          </div>
          <div className="text-[11px] text-orange-600/80 mt-1">
            Bahan bakar kompor dapur
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">Bulan:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-none text-xs"
            />
            {selectedMonth && (
              <button 
                onClick={() => setSelectedMonth('')} 
                className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-1"
              >
                Semua
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-none text-xs cursor-pointer"
            >
              <option value="all">Semua Kategori Biaya</option>
              <option value="listrik">⚡ Listrik PLN</option>
              <option value="air">💧 Air PDAM</option>
              <option value="gas">🔥 Gas LPG Dapur</option>
              <option value="internet">🌐 Internet & WiFi</option>
              <option value="kebersihan">✨ Kebersihan</option>
              <option value="operasional">📦 Operasional</option>
              <option value="maintenance">🔧 Maintenance / Servis</option>
              <option value="lainnya">⚙️ Lain-lain</option>
            </select>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari tagihan / vendor / no meter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-amber-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Table Records */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Tanggal & Ref</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Judul & Provider</th>
                <th className="py-3 px-4">No. Pelanggan/Meter</th>
                <th className="py-3 px-4">Pemakaian</th>
                <th className="py-3 px-4 text-right">Nominal Biaya</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Dicatat Oleh</th>
                {isAuthorized && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAuthorized ? 9 : 8} className="py-12 text-center text-slate-400">
                    <Zap className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
                    Belum ada data biaya variabel untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const catCfg = CATEGORY_CONFIG[r.category] || CATEGORY_CONFIG.lainnya;
                  const Icon = catCfg.icon;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{r.date}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.id}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${catCfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {r.category === 'lainnya' && r.customCategoryName ? r.customCategoryName : catCfg.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.title}</div>
                        {r.vendorOrProvider && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            {r.vendorOrProvider}
                          </div>
                        )}
                        {r.notes && <div className="text-[10px] text-slate-400 italic mt-0.5">{r.notes}</div>}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.customerOrMeterId ? (
                          <span className="font-mono text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                            {r.customerOrMeterId}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.usageQuantity ? (
                          <div className="font-semibold text-slate-800">
                            {r.usageQuantity} <span className="text-slate-500 text-[11px] font-normal">{r.usageUnit || ''}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-black text-slate-900 text-sm">{formatRupiah(r.amount)}</div>
                        <div className="text-[10px] text-slate-400">{r.paymentMethod || 'Tunai/Bank'}</div>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.paymentStatus === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.paymentStatus === 'Jatuh Tempo'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.paymentStatus === 'Lunas' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {r.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">{r.recordedBy}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{r.role}</div>
                      </td>

                      {isAuthorized && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Edit Transaksi Biaya"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(r.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Transaksi Biaya"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingRecord ? 'Edit Catatan Biaya Variabel' : 'Catat Biaya Variabel & Utilitas Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Input rincian biaya listrik, air, gas, internet, kebersihan atau tagihan operasional lainnya
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tanggal */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal Tagihan / Pembayaran *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kategori Biaya *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value as VariableCostCategory)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-400 focus:bg-white cursor-pointer"
                  >
                    <option value="listrik">⚡ Listrik PLN</option>
                    <option value="air">💧 Air PDAM / Sumur</option>
                    <option value="gas">🔥 Gas LPG / Dapur</option>
                    <option value="internet">🌐 Internet / WiFi</option>
                    <option value="kebersihan">✨ Kebersihan & Lingkungan</option>
                    <option value="operasional">📦 Perlengkapan Operasional</option>
                    <option value="maintenance">🔧 Maintenance & Servis</option>
                    <option value="lainnya">⚙️ Biaya Variabel Lainnya</option>
                  </select>
                </div>
              </div>

              {formData.category === 'lainnya' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Kategori Kustom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Iuran Keamanan Komplek, Sewa Genset"
                    value={formData.customCategoryName}
                    onChange={(e) => setFormData({ ...formData, customCategoryName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
              )}

              {/* Judul Tagihan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama / Deskripsi Biaya *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tagihan Listrik Pasca Bayar Bulan Juli"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Vendor / Provider */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Penyedia Layanan / Vendor</label>
                  <input
                    type="text"
                    placeholder="Contoh: PT PLN (Persero), Indihome, Agen Gas"
                    value={formData.vendorOrProvider}
                    onChange={(e) => setFormData({ ...formData, vendorOrProvider: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>

                {/* ID Pelanggan / No Meter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ID Pelanggan / No. Meter</label>
                  <input
                    type="text"
                    placeholder="Contoh: 532810992318"
                    value={formData.customerOrMeterId}
                    onChange={(e) => setFormData({ ...formData, customerOrMeterId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-400 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Volume Pemakaian */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Volume Pemakaian</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Contoh: 1450"
                    value={formData.usageQuantity}
                    onChange={(e) => setFormData({ ...formData, usageQuantity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>

                {/* Satuan Unit */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Satuan Unit</label>
                  <input
                    type="text"
                    placeholder="kWh, m³, Tabung, Pcs"
                    value={formData.usageUnit}
                    onChange={(e) => setFormData({ ...formData, usageUnit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>

                {/* Nominal Biaya */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nominal Biaya (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 2850000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Status Pembayaran */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-400 focus:bg-white cursor-pointer"
                  >
                    <option value="Lunas">✅ Lunas</option>
                    <option value="Belum Lunas">⏳ Belum Lunas</option>
                    <option value="Jatuh Tempo">⚠️ Jatuh Tempo</option>
                  </select>
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                  <input
                    type="text"
                    placeholder="Transfer BCA, Petty Cash, QRIS, dll"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan nomor referensi struk, jatuh tempo tanggal X, dsb..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-amber-400 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {editingRecord ? 'Simpan Perubahan' : 'Simpan Biaya Variabel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Hapus Biaya Variabel?</h4>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus data pengeluaran dari catatan laporan.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
