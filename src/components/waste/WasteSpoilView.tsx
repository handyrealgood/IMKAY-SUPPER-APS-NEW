import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { WasteReason, WasteSpoilRecord } from '../../types';
import { 
  Trash2, 
  Plus, 
  Camera, 
  Upload, 
  AlertTriangle, 
  Search, 
  DollarSign, 
  Image as ImageIcon,
  CheckCircle,
  Eye,
  Calendar,
  Pencil,
  X,
  CheckCircle2
} from 'lucide-react';

export const WasteSpoilView: React.FC = () => {
  const { 
    wastes, 
    rawItems, 
    addWasteRecord, 
    updateWasteRecord, 
    deleteWasteRecord, 
    currentUser, 
    formatRupiah 
  } = useResto();

  const isMasterOrManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReason, setFilterReason] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<WasteSpoilRecord | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit State
  const [editingWaste, setEditingWaste] = useState<WasteSpoilRecord | null>(null);
  const [editQty, setEditQty] = useState<number>(1);
  const [editReason, setEditReason] = useState<WasteReason>('Basi / Expired');
  const [editArea, setEditArea] = useState<'Kitchen' | 'Floor / Bar'>('Kitchen');
  const [editNotes, setEditNotes] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');

  // Delete State
  const [deletingWaste, setDeletingWaste] = useState<WasteSpoilRecord | null>(null);

  // Form states
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [reason, setReason] = useState<WasteReason>('Basi / Expired');
  const [area, setArea] = useState<'Kitchen' | 'Floor / Bar'>(
    currentUser.role === 'head_floor' ? 'Floor / Bar' : 'Kitchen'
  );
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoError, setPhotoError] = useState(false);

  const wasteReasons: WasteReason[] = [
    'Basi / Expired',
    'Gosong / Salah Buat',
    'Kualitas Supplier Buruk',
    'Jatuh / Kontaminasi',
    'Over-preparation',
    'Pecah / Rusak Packaging',
  ];

  const samplePhotos = [
    { label: 'Daging / Seafood Rusak', url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&auto=format&fit=crop&q=80' },
    { label: 'Gosong / Overcook', url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&auto=format&fit=crop&q=80' },
    { label: 'Cairan / Susu Tumpah', url: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=400&auto=format&fit=crop&q=80' },
  ];

  // Selected item object
  const currentItem = rawItems.find(i => i.id === selectedItemId);
  const estimatedCostLoss = currentItem ? currentItem.costPerUnit * qty : 0;

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
        setPhotoError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitWaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !currentItem) {
      alert('Pilih bahan baku yang mengalami waste/spoil!');
      return;
    }

    // MANDATORY PHOTO CHECK (per user requirement: "wajib foto untuk pelaporan bulanan")
    if (!photoUrl.trim()) {
      setPhotoError(true);
      alert('Perhatian: Upload foto bukti waste WAJIB dilampirkan untuk pelaporan bulanan!');
      return;
    }

    addWasteRecord({
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      reportedBy: currentUser.name,
      role: currentUser.role,
      area,
      itemId: currentItem.id,
      itemName: currentItem.name,
      qty: Number(qty),
      unit: currentItem.unit,
      reason,
      estimatedCostLoss,
      photoUrl,
      notes: notes.trim() || `Waste ${reason}`,
    });

    // Reset form
    setShowAddModal(false);
    setSelectedItemId('');
    setQty(1);
    setNotes('');
    setPhotoUrl('');
    setPhotoError(false);
  };

  // Manager Edit Handlers
  const handleOpenEdit = (wst: WasteSpoilRecord) => {
    setEditingWaste(wst);
    setEditQty(wst.qty);
    setEditReason(wst.reason);
    setEditArea(wst.area);
    setEditNotes(wst.notes);
    setEditPhotoUrl(wst.photoUrl);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWaste) return;
    if (editQty <= 0) {
      alert('Jumlah kuantiti waste harus lebih dari 0!');
      return;
    }

    const res = updateWasteRecord(editingWaste.id, {
      qty: editQty,
      reason: editReason,
      area: editArea,
      notes: editNotes.trim(),
      photoUrl: editPhotoUrl,
    });

    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setEditingWaste(null);
      setTimeout(() => setActionFeedback(null), 3500);
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingWaste) return;
    const res = deleteWasteRecord(deletingWaste.id);
    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setDeletingWaste(null);
      setTimeout(() => setActionFeedback(null), 3500);
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const filteredWastes = wastes.filter(w => {
    const matchesSearch = w.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReason = filterReason === 'all' || w.reason === filterReason;
    const matchesArea = filterArea === 'all' || w.area === filterArea;
    return matchesSearch && matchesReason && matchesArea;
  });

  const totalLoss = filteredWastes.reduce((sum, w) => sum + w.estimatedCostLoss, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Pencatatan Waste & Spoil (Pembuangan Bahan)</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
              Wajib Lampiran Foto
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Setiap bahan rusak atau terbuang otomatis memotong stok gudang dan tercatat kerugian HPP untuk pelaporan bulanan.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Input Waste & Spoil Baru</span>
        </button>
      </div>

      {/* Summary KPI Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Total Kerugian Waste Terdata</span>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {formatRupiah(totalLoss)}
          </div>
          <span className="text-xs text-slate-500">Akumulasi pengurang margin HPP</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Jumlah Insiden Terfoto</span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {filteredWastes.length} <span className="text-sm font-semibold text-slate-400">Laporan</span>
          </div>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> 100% Memiliki Lampiran Bukti
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Penyebab Terbanyak</span>
          <div className="text-base font-extrabold text-slate-800 mt-2 truncate">
            Basi / Expired & Kesalahan Masak
          </div>
          <span className="text-xs text-slate-400">Tinjau saat evaluasi bulanan</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama bahan baku atau pelapor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          >
            <option value="all">Semua Alasan Pembuangan</option>
            {wasteReasons.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-40">
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          >
            <option value="all">Semua Area</option>
            <option value="Kitchen">Kitchen</option>
            <option value="Floor / Bar">Floor / Bar</option>
          </select>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
          actionFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid of Waste Records with Photo Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredWastes.map(wst => (
          <div key={wst.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              {/* Photo Header */}
              <div className="relative h-44 bg-slate-100 overflow-hidden group cursor-pointer" onClick={() => setSelectedPhotoModal(wst)}>
                <img
                  src={wst.photoUrl}
                  alt={wst.itemName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white shadow-xs">
                    {wst.reason}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                    {wst.area}
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs">
                  <span className="font-extrabold text-sm">{wst.itemName}</span>
                  <span className="font-bold text-rose-300">-{wst.qty} {wst.unit}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Kerugian HPP:</span>
                  <strong className="text-sm font-black text-rose-600">{formatRupiah(wst.estimatedCostLoss)}</strong>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-0.5">Catatan Insiden:</span>
                  <p className="text-[11px] text-slate-600">{wst.notes}</p>
                </div>
              </div>
            </div>

            {/* Footer with Edit/Delete for Manager/Admin */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {wst.date}
              </span>
              <div className="flex items-center gap-2">
                <span>Oleh: <strong className="text-slate-800">{wst.reportedBy}</strong></span>
                {isMasterOrManager && (
                  <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                    <button
                      onClick={() => handleOpenEdit(wst)}
                      className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                      title="Koreksi Inputan Staff (Manager / Master Admin)"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setDeletingWaste(wst)}
                      className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                      title="Hapus & Kembalikan Stok Bahan (Manager / Master Admin)"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Input Waste Baru dengan Wajib Upload Foto */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Form Input Waste & Spoil</h3>
                  <p className="text-xs text-slate-500">Wajib lampiran foto fisik untuk verifikasi laporan bulanan</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitWaste} className="space-y-4 mt-4 text-xs">
              
              {/* Item Selection & Qty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Bahan Baku <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                  >
                    <option value="">-- Pilih Bahan Rusak/Basi --</option>
                    {rawItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Stok: {item.currentStock} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jumlah Terbuang ({currentItem?.unit || 'unit'}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.01"
                    required
                    value={qty}
                    onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white"
                  />
                </div>
              </div>

              {/* Reason & Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alasan Pembuangan <span className="text-red-500">*</span></label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as WasteReason)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-700"
                  >
                    {wasteReasons.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area Lokasi Kejadian</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Kitchen">Kitchen (Dapur)</option>
                    <option value="Floor / Bar">Floor / Bar Dining</option>
                  </select>
                </div>
              </div>

              {/* MANDATORY PHOTO SECTION */}
              <div className={`p-4 rounded-xl border ${photoError ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-rose-600" />
                    Wajib Upload Foto Bukti Bahan Rusak <span className="text-red-600">*</span>
                  </span>
                  {photoUrl && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Foto Terlampir
                    </span>
                  )}
                </div>

                {/* Upload or Sample Photo */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <label className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0">
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Ambil Foto / Pilih File</span>
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
                      placeholder="Atau tempel URL gambar bukti..."
                      value={photoUrl}
                      onChange={(e) => {
                        setPhotoUrl(e.target.value);
                        setPhotoError(false);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px]"
                    />
                  </div>
                </div>

                {/* Sample quick photos */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Pilihan Foto Cepat:</span>
                  {samplePhotos.map((sp, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setPhotoUrl(sp.url);
                        setPhotoError(false);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>

                {/* Preview Image */}
                {photoUrl && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={photoUrl}
                      alt="Preview waste"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Detail Pembuangan</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jelaskan kronologi kejadian (misal: Rusak akibat chiller down, daging berlendir, bau asam)."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              {/* Estimated Loss Card */}
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-800 uppercase block">Estimasi Kerugian HPP</span>
                  <span className="text-lg font-black text-rose-700">{formatRupiah(estimatedCostLoss)}</span>
                </div>
                <div className="text-right text-[11px] text-rose-700 font-semibold">
                  Otomatis memotong {qty} {currentItem?.unit || ''} dari stok sistem
                </div>
              </div>

              {/* Actions */}
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  Simpan & Potong Stok
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Foto Fullscreen */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Bukti Foto: {selectedPhotoModal.itemName}</h3>
                <span className="text-xs text-rose-600 font-bold">{selectedPhotoModal.reason} • Kerugian {formatRupiah(selectedPhotoModal.estimatedCostLoss)}</span>
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
                src={selectedPhotoModal.photoUrl}
                alt={selectedPhotoModal.itemName}
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
              <strong>Kronologi:</strong> {selectedPhotoModal.notes}
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

      {/* Modal Edit / Koreksi Waste (Manager & Master Admin) */}
      {editingWaste && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Koreksi Laporan Waste / Spoil</h3>
                  <p className="text-xs text-slate-500">Otoritas Manager / Master Admin • Penyesuaian stok otomatis</p>
                </div>
              </div>
              <button
                onClick={() => setEditingWaste(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Riwayat Input Staff:</span>
                  <span className="text-[11px] text-amber-800">
                    Bahan: <strong>{editingWaste.itemName}</strong>. Diinput oleh <strong>{editingWaste.reportedBy}</strong> ({editingWaste.role}) pada {editingWaste.date}.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jumlah Rusak ({editingWaste.unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={editQty}
                    onChange={(e) => setEditQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area Insiden</label>
                  <select
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value as 'Kitchen' | 'Floor / Bar')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Kitchen">Kitchen</option>
                    <option value="Floor / Bar">Floor / Bar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alasan Kerusakan / Spoil</label>
                <select
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value as WasteReason)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {wasteReasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Koreksi Manager</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Catatan klarifikasi atau revisi kuantiti..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Foto Bukti Fisik</label>
                <input
                  type="url"
                  required
                  value={editPhotoUrl}
                  onChange={(e) => setEditPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingWaste(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  Simpan Koreksi & Sinkronkan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Waste (Manager & Master Admin) */}
      {deletingWaste && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Hapus Laporan Waste?</h3>
                <p className="text-xs text-slate-500">{deletingWaste.itemName} • {deletingWaste.qty} {deletingWaste.unit}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1.5">
              <span className="font-bold block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Peringatan Rekonsiliasi Otomatis:
              </span>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Menghapus laporan waste ini akan <strong>mengembalikan stok bahan</strong> ke sistem gudang sebanyak <strong>+{deletingWaste.qty} {deletingWaste.unit}</strong> karena dianggap salah input.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingWaste(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-xs text-slate-700"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs"
              >
                Ya, Hapus & Kembalikan Stok
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
