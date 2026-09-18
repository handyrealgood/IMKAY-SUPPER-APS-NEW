import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { PettyCashCategory, PettyCashRecord } from '../../types';
import { 
  Wallet, 
  Plus, 
  ArrowDownRight, 
  ArrowUpRight, 
  Camera, 
  Upload, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  Package, 
  AlertCircle,
  Image as ImageIcon,
  Edit,
  Trash2
} from 'lucide-react';

export const PettyCashView: React.FC = () => {
  const { 
    pettyCash, 
    pettyCashBalance, 
    rawItems, 
    addPettyCashTransaction, 
    updatePettyCashTransaction,
    deletePettyCashTransaction,
    currentUser, 
    formatRupiah 
  } = useResto();

  const isManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<PettyCashRecord | null>(null);

  // Manager Edit State
  const [editingPettyCash, setEditingPettyCash] = useState<PettyCashRecord | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<PettyCashCategory>('Lain-lain');
  const [editDescription, setEditDescription] = useState('');
  const [deletingPettyCash, setDeletingPettyCash] = useState<PettyCashRecord | null>(null);

  // Form states
  const [type, setType] = useState<'in' | 'out'>('out');
  const [amount, setAmount] = useState<number>(100000);
  const [category, setCategory] = useState<PettyCashCategory>('Belanja Pasar (Bahan Baku)');
  const [description, setDescription] = useState('');
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState('');
  const [photoError, setPhotoError] = useState(false);

  // Directly link to stock replenishment
  const [autoAddStock, setAutoAddStock] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [stockQty, setStockQty] = useState<number>(5);

  const categories: PettyCashCategory[] = [
    'Belanja Pasar (Bahan Baku)',
    'Operasional Gas & Galon',
    'Perlengkapan Kebersihan',
    'Transport / Kurir Darurat',
    'Top-up / Drop Dana Pusat',
    'Lain-lain',
  ];

  const sampleReceipts = [
    { label: 'Nota Sayur & Bumbu Pasar', url: 'https://images.unsplash.com/photo-1554415707-9e49fe83083f?w=400&auto=format&fit=crop&q=80' },
    { label: 'Struk Gas Elpiji & Galon', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPhotoUrl(reader.result as string);
        setPhotoError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Jumlah nominal harus lebih dari 0!');
      return;
    }

    // MANDATORY PHOTO for Belanja Pasar (per user prompt: "wajib foto untuk pembelian langsung belanja pasar")
    if (type === 'out' && category === 'Belanja Pasar (Bahan Baku)' && !receiptPhotoUrl.trim()) {
      setPhotoError(true);
      alert('Perhatian: Pembelian belanja pasar kas kecil WAJIB menyertakan foto nota / struk fisik!');
      return;
    }

    let linkedItemData = undefined;
    if (type === 'out' && autoAddStock && selectedItemId && stockQty > 0) {
      const raw = rawItems.find(r => r.id === selectedItemId);
      if (raw) {
        linkedItemData = {
          itemId: raw.id,
          itemName: raw.name,
          qtyAdded: Number(stockQty),
          unit: raw.unit,
        };
      }
    }

    addPettyCashTransaction({
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type,
      amount: Number(amount),
      category: type === 'in' ? 'Top-up / Drop Dana Pusat' : category,
      description: description.trim() || (type === 'in' ? 'Top up kas kecil' : category),
      submittedBy: currentUser.name,
      role: currentUser.role,
      receiptPhotoUrl: receiptPhotoUrl || undefined,
      linkedStockItem: linkedItemData,
    });

    // Reset
    setShowAddModal(false);
    setAmount(100000);
    setDescription('');
    setReceiptPhotoUrl('');
    setSelectedItemId('');
    setStockQty(5);
    setPhotoError(false);
  };

  const filteredRecords = pettyCash.filter(r => {
    const matchesSearch = r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || r.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalIn = pettyCash.filter(r => r.type === 'in').reduce((sum, r) => sum + r.amount, 0);
  const totalOut = pettyCash.filter(r => r.type === 'out').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Petty Cash (Kas Kecil Operasional)</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Auto Sync Bahan Baku
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Catat pengeluaran kas kecil & belanja pasar langsung dengan wajib upload struk. Bahan baku yang dibeli otomatis masuk ke stok sistem.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Transaksi Kas Kecil</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Saldo Kas Kecil Aktual</span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(pettyCashBalance)}
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" /> Siap digunakan di outlet
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Total Kas Masuk (Top Up)</span>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatRupiah(totalIn)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dari dana pusat manajemen
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Total Kas Keluar (Pengeluaran)</span>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {formatRupiah(totalOut)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Belanja pasar, gas, perlengkapan
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari keterangan, kategori atau nama staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
          />
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({pettyCash.length})
          </button>
          <button
            onClick={() => setFilterType('in')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === 'in' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> Kas Masuk
          </button>
          <button
            onClick={() => setFilterType('out')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === 'out' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Kas Keluar
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredRecords.map(item => {
          const isOut = item.type === 'out';
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  isOut ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isOut ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900">{item.description}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                    {item.linkedStockItem && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Stok +{item.linkedStockItem.qtyAdded} {item.linkedStockItem.unit}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>Diinput: <strong className="text-slate-700">{item.submittedBy}</strong></span>
                  </div>
                </div>
              </div>

              {/* Amount & Photo Preview */}
              <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                {item.receiptPhotoUrl && (
                  <button
                    onClick={() => setSelectedPhotoModal(item)}
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs bg-blue-50 px-2.5 py-1.5 rounded-xl transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Lihat Bukti Nota</span>
                  </button>
                )}

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-base font-black ${isOut ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {isOut ? '-' : '+'}{formatRupiah(item.amount)}
                    </span>
                  </div>

                  {isManager && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingPettyCash(item);
                          setEditAmount(item.amount);
                          setEditCategory(item.category);
                          setEditDescription(item.description);
                        }}
                        className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600"
                        title="Edit Transaksi Kas Kecil (Manager)"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingPettyCash(item)}
                        className="p-1.5 border border-rose-200 hover:bg-rose-50 rounded-lg text-rose-600"
                        title="Hapus Transaksi Kas Kecil (Manager)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Input Transaksi Kas Kecil */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Form Transaksi Kas Kecil (Petty Cash)</h3>
                  <p className="text-xs text-slate-500">Wajib foto struk untuk belanja pasar dan auto-tambah stok</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              
              {/* Type selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Transaksi Kas</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('out')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                      type === 'out' 
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Kas Keluar (Pengeluaran)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('in')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                      type === 'in' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Kas Masuk (Top Up Pusat)</span>
                  </button>
                </div>
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominal (Rp) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-sm focus:bg-white"
                  />
                </div>

                {type === 'out' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori Pengeluaran <span className="text-red-500">*</span></label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as PettyCashCategory)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Special Auto Stock Integration for Belanja Pasar */}
              {type === 'out' && category === 'Belanja Pasar (Bahan Baku)' && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-blue-900 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoAddStock}
                        onChange={(e) => setAutoAddStock(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Otomatis Masukkan Belanjaan ke Stok Bahan Baku Sistem</span>
                    </label>
                  </div>

                  {autoAddStock && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-blue-900 mb-1">Bahan Baku yang Dibeli</label>
                        <select
                          value={selectedItemId}
                          onChange={(e) => setSelectedItemId(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-medium"
                        >
                          <option value="">-- Pilih Bahan Baku --</option>
                          {rawItems.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name} (Stok: {item.currentStock} {item.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-blue-900 mb-1">Jumlah/Qty yang Dibeli</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={stockQty}
                          onChange={(e) => setStockQty(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan Pembelian / Catatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli cabe rawit merah 5kg & bawang di Pasar Induk karena stok menipis."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              {/* MANDATORY PHOTO FOR BELANJA PASAR */}
              {type === 'out' && (
                <div className={`p-4 rounded-xl border ${photoError ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'} space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      Wajib Foto Nota / Struk Pembelian Fisik <span className="text-red-600">*</span>
                    </span>
                    {receiptPhotoUrl && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Foto Terpasang
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <label className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0">
                      <Upload className="w-4 h-4 text-slate-600" />
                      <span>Pilih Foto Nota / Struk</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="w-full flex-1">
                      <input
                        type="url"
                        placeholder="Atau tempel link gambar nota..."
                        value={receiptPhotoUrl}
                        onChange={(e) => {
                          setReceiptPhotoUrl(e.target.value);
                          setPhotoError(false);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Sample presets */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400">Contoh Foto Cepat:</span>
                    {sampleReceipts.map((sr, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setReceiptPhotoUrl(sr.url);
                          setPhotoError(false);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold"
                      >
                        {sr.label}
                      </button>
                    ))}
                  </div>

                  {/* Photo preview */}
                  {receiptPhotoUrl && (
                    <div className="h-32 rounded-xl overflow-hidden border border-slate-200 mt-2">
                      <img
                        src={receiptPhotoUrl}
                        alt="Preview nota"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  Simpan Transaksi Kas Kecil
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Struk */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Bukti Struk: {selectedPhotoModal.description}</h3>
                <span className="text-xs text-emerald-700 font-bold">{formatRupiah(selectedPhotoModal.amount)} • {selectedPhotoModal.category}</span>
              </div>
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 rounded-xl overflow-hidden max-h-96">
              <img
                src={selectedPhotoModal.receiptPhotoUrl}
                alt={selectedPhotoModal.description}
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Transaksi Kas Kecil (Manager) */}
      {editingPettyCash && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Koreksi Transaksi Petty Cash</h3>
                  <p className="text-xs text-slate-500">Perbaikan input pengeluaran / pemasukan kas kecil</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPettyCash(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePettyCashTransaction(editingPettyCash.id, {
                  amount: Number(editAmount),
                  category: editCategory,
                  description: editDescription.trim(),
                });
                setEditingPettyCash(null);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={editAmount}
                  onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Biaya</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as PettyCashCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi / Keterangan Nota</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPettyCash(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Simpan Koreksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Transaksi Kas Kecil */}
      {deletingPettyCash && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-black text-slate-900">Hapus Transaksi Kas</h3>
            </div>
            <div className="mt-3 text-xs text-slate-600 space-y-2">
              <p>
                Yakin ingin menghapus catatan kas <strong>{deletingPettyCash.description}</strong> sebesar{' '}
                <strong className="text-slate-900">{formatRupiah(deletingPettyCash.amount)}</strong>?
              </p>
              <p className="text-[11px] text-amber-700">
                Saldo kas kecil akan otomatis disesuaikan kembali.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4 text-xs">
              <button
                type="button"
                onClick={() => setDeletingPettyCash(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePettyCashTransaction(deletingPettyCash.id);
                  setDeletingPettyCash(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
