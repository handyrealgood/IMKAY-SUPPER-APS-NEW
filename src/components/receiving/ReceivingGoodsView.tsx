import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { ReceivingItem, ReceivingRecord, ItemUnit } from '../../types';
import { 
  convertQuantity, 
  convertCostPerUnit, 
  getCompatibleUnits 
} from '../../utils/unitConversion';
import { 
  Truck, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Search, 
  Calendar, 
  DollarSign, 
  FileText, 
  PackageCheck,
  Camera,
  Image as ImageIcon,
  Pencil,
  AlertTriangle,
  X,
  Upload,
  ArrowRight,
  Scale
} from 'lucide-react';

export const ReceivingGoodsView: React.FC = () => {
  const { 
    receivings, 
    rawItems, 
    addReceivingRecord, 
    updateReceivingRecord, 
    deleteReceivingRecord, 
    currentUser, 
    formatRupiah 
  } = useResto();

  const isMasterOrManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit State
  const [editingRecord, setEditingRecord] = useState<ReceivingRecord | null>(null);
  const [editPoNumber, setEditPoNumber] = useState('');
  const [editSupplierName, setEditSupplierName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editReceiptPhotoUrl, setEditReceiptPhotoUrl] = useState('');
  const [editItems, setEditItems] = useState<ReceivingItem[]>([]);

  // Delete State
  const [deletingRecord, setDeletingRecord] = useState<ReceivingRecord | null>(null);

  // Form states (Add)
  const [poNumber, setPoNumber] = useState(`PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`);
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState('');
  const [itemsReceived, setItemsReceived] = useState<ReceivingItem[]>([]);

  // Item line input with unit selection
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [qty, setQty] = useState<number>(10);
  const [costPerUnit, setCostPerUnit] = useState<number>(0);

  const selectedRaw = rawItems.find(i => i.id === selectedItemId);
  const availableUnits = selectedRaw ? getCompatibleUnits(selectedRaw.unit) : [];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditReceiptPhotoUrl(reader.result as string);
        } else {
          setReceiptPhotoUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Pre-fill cost & unit when item selected
  const handleItemSelect = (id: string) => {
    setSelectedItemId(id);
    const item = rawItems.find(i => i.id === id);
    if (item) {
      setCostPerUnit(item.costPerUnit);
      setSelectedUnit(item.unit);
      setQty(item.unit.toLowerCase() === 'gram' ? 1000 : 10);
    } else {
      setSelectedUnit('');
    }
  };

  const handleAddItemToReceipt = () => {
    if (!selectedItemId || qty <= 0) return;
    const raw = rawItems.find(i => i.id === selectedItemId);
    if (!raw) return;

    if (itemsReceived.some(i => i.itemId === raw.id)) {
      alert('Item ini sudah dimasukkan ke daftar receiving. Ubah qty atau hapus baris yang ada.');
      return;
    }

    const unitToUse = (selectedUnit || raw.unit) as ItemUnit;
    const baseQty = convertQuantity(qty, unitToUse, raw.unit);
    const costPerBaseUnit = convertCostPerUnit(costPerUnit, unitToUse, raw.unit);
    const subtotal = qty * costPerUnit;

    const newItem: ReceivingItem = {
      itemId: raw.id,
      itemName: raw.name,
      qty: Number(qty),
      unit: unitToUse,
      baseQty,
      baseUnit: raw.unit,
      costPerUnit: Number(costPerUnit),
      costPerBaseUnit,
      subtotal,
    };

    setItemsReceived([...itemsReceived, newItem]);
    setSelectedItemId('');
    setSelectedUnit('');
    setQty(10);
    setCostPerUnit(0);
  };

  const handleRemoveItemFromReceipt = (itemId: string) => {
    setItemsReceived(itemsReceived.filter(i => i.itemId !== itemId));
  };

  const totalAmount = itemsReceived.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmitReceiving = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('Masukkan nama supplier / pemasok!');
      return;
    }
    if (itemsReceived.length === 0) {
      alert('Tambahkan minimal 1 item barang yang diterima!');
      return;
    }

    addReceivingRecord({
      poNumber: poNumber.trim(),
      supplierName: supplierName.trim(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      receivedBy: currentUser.name,
      role: currentUser.role,
      items: itemsReceived,
      totalAmount,
      notes: notes.trim(),
      receiptPhotoUrl: receiptPhotoUrl || 'https://images.unsplash.com/photo-1554415707-9e49fe83083f?w=400&auto=format&fit=crop&q=80',
    });

    // Reset & close
    setShowAddModal(false);
    setSupplierName('');
    setNotes('');
    setReceiptPhotoUrl('');
    setItemsReceived([]);
    setPoNumber(`PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`);
  };

  // Manager Edit Handlers
  const handleOpenEdit = (rec: ReceivingRecord) => {
    setEditingRecord(rec);
    setEditPoNumber(rec.poNumber);
    setEditSupplierName(rec.supplierName);
    setEditNotes(rec.notes);
    setEditReceiptPhotoUrl(rec.receiptPhotoUrl || '');
    setEditItems(rec.items.map(i => ({ ...i })));
  };

  const handleUpdateEditItemQty = (index: number, newQty: number) => {
    setEditItems(prev => {
      const updated = [...prev];
      const validQty = Math.max(0.001, newQty);
      const itm = updated[index];
      const raw = rawItems.find(r => r.id === itm.itemId);
      const baseUnit = (itm.baseUnit || raw?.unit || itm.unit) as ItemUnit;
      const baseQty = convertQuantity(validQty, itm.unit as ItemUnit, baseUnit);
      const costPerBaseUnit = convertCostPerUnit(itm.costPerUnit, itm.unit as ItemUnit, baseUnit);

      updated[index] = {
        ...itm,
        qty: validQty,
        baseQty,
        baseUnit,
        costPerBaseUnit,
        subtotal: validQty * itm.costPerUnit,
      };
      return updated;
    });
  };

  const handleUpdateEditItemUnit = (index: number, newUnit: string) => {
    setEditItems(prev => {
      const updated = [...prev];
      const itm = updated[index];
      const raw = rawItems.find(r => r.id === itm.itemId);
      const baseUnit = (itm.baseUnit || raw?.unit || newUnit) as ItemUnit;
      const baseQty = convertQuantity(itm.qty, newUnit as ItemUnit, baseUnit);
      const costPerBaseUnit = convertCostPerUnit(itm.costPerUnit, newUnit as ItemUnit, baseUnit);

      updated[index] = {
        ...itm,
        unit: newUnit as ItemUnit,
        baseQty,
        baseUnit,
        costPerBaseUnit,
        subtotal: itm.qty * itm.costPerUnit,
      };
      return updated;
    });
  };

  const handleUpdateEditItemCost = (index: number, newCost: number) => {
    setEditItems(prev => {
      const updated = [...prev];
      const validCost = Math.max(0, newCost);
      const itm = updated[index];
      const raw = rawItems.find(r => r.id === itm.itemId);
      const baseUnit = (itm.baseUnit || raw?.unit || itm.unit) as ItemUnit;
      const costPerBaseUnit = convertCostPerUnit(validCost, itm.unit as ItemUnit, baseUnit);

      updated[index] = {
        ...itm,
        costPerUnit: validCost,
        costPerBaseUnit,
        subtotal: itm.qty * validCost,
      };
      return updated;
    });
  };

  const handleRemoveEditItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (editItems.length === 0) {
      alert('Minimal harus ada 1 item barang yang diterima!');
      return;
    }

    const newTotal = editItems.reduce((sum, item) => sum + item.subtotal, 0);
    const res = updateReceivingRecord(editingRecord.id, {
      poNumber: editPoNumber.trim(),
      supplierName: editSupplierName.trim(),
      notes: editNotes.trim(),
      receiptPhotoUrl: editReceiptPhotoUrl,
      items: editItems,
      totalAmount: newTotal,
    });

    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setEditingRecord(null);
      setTimeout(() => setActionFeedback(null), 3500);
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    const res = deleteReceivingRecord(deletingRecord.id);
    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setDeletingRecord(null);
      setTimeout(() => setActionFeedback(null), 3500);
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  // Sample quick photo picker
  const sampleInvoices = [
    'https://images.unsplash.com/photo-1554415707-9e49fe83083f?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80'
  ];

  const filteredReceivings = receivings.filter(r => 
    r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.poNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Receiving Barang Supplier (Stok Masuk)</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Auto-Stok Masuk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Catat pengiriman dari supplier. Setiap item yang disimpan akan otomatis menambah stok aktual sistem secara real-time.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Form Penerimaan Supplier Baru</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor PO / Surat Jalan atau nama pemasok..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
          />
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

      {/* List of Receiving Records */}
      <div className="space-y-4">
        {filteredReceivings.map(rec => (
          <div key={rec.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">{rec.supplierName}</h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {rec.poNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{rec.date}</span>
                    <span>•</span>
                    <span>Diterima oleh: <strong className="text-slate-700">{rec.receivedBy}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold block">Total Faktur / Tagihan</span>
                  <span className="text-base font-black text-emerald-700">{formatRupiah(rec.totalAmount)}</span>
                </div>

                {isMasterOrManager && (
                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                    <button
                      onClick={() => handleOpenEdit(rec)}
                      title="Edit / Koreksi Inputan Staff (Manager / Master Admin)"
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Koreksi</span>
                    </button>
                    <button
                      onClick={() => setDeletingRecord(rec)}
                      title="Hapus Inputan Staff & Rekonsiliasi Stok (Manager / Master Admin)"
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Item List in this receipt */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
              {rec.items.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{item.itemName}</div>
                    <div className="text-[11px] text-slate-500 font-semibold flex flex-wrap items-center gap-1">
                      <span>+{item.qty} {item.unit}</span>
                      {item.baseQty !== undefined && item.baseUnit && item.unit.toLowerCase() !== item.baseUnit.toLowerCase() && (
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold text-[10px]">
                          (= +{item.baseQty} {item.baseUnit})
                        </span>
                      )}
                      <span>(@ {formatRupiah(item.costPerUnit)}/{item.unit})</span>
                    </div>
                  </div>
                  <div className="font-bold text-slate-700">
                    {formatRupiah(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes & Receipt preview */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs pt-2 border-t border-slate-100 text-slate-500">
              <div className="text-slate-600">
                <strong>Catatan:</strong> {rec.notes || 'Semua barang sesuai spesifikasi PO.'}
              </div>

              {rec.receiptPhotoUrl && (
                <a
                  href={rec.receiptPhotoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-[11px] bg-blue-50 px-2.5 py-1 rounded-lg"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Lihat Foto Surat Jalan / Nota</span>
                </a>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Modal Input Receiving Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Penerimaan Barang Masuk Supplier</h3>
                  <p className="text-xs text-slate-500">Stok barang akan otomatis bertambah ke sistem</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitReceiving} className="space-y-4 mt-4 text-xs">
              
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor PO / Faktur / Surat Jalan <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Supplier / Pemasok <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Sumber Daging Nusantara, CV Sayur Segar"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Items Receiver Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-black text-slate-900 block">
                  Pilih Bahan Baku yang Diterima
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Item Bahan Baku</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => handleItemSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-xs"
                    >
                      <option value="">-- Pilih Bahan --</option>
                      {rawItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Stok master: {item.currentStock} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Qty Diterima</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={qty}
                      onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Pilihan Satuan</label>
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      disabled={!selectedItemId}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800"
                    >
                      {availableUnits.map(u => (
                        <option key={u.unit} value={u.unit}>{u.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Harga Beli per {selectedUnit || 'Satuan'} (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={costPerUnit}
                      onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                </div>

                {/* Live Unit Conversion Feedback */}
                {selectedRaw && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-emerald-950">
                    <div className="flex flex-wrap items-center gap-1.5 font-medium">
                      <span className="font-bold text-emerald-900">⚡ Otomatis Terkonversi ke Master:</span>
                      <span className="font-semibold">{qty} {selectedUnit || selectedRaw.unit}</span>
                      <ArrowRight className="w-3 h-3 text-emerald-600" />
                      <span className="font-black text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded">
                        +{convertQuantity(qty, (selectedUnit || selectedRaw.unit) as ItemUnit, selectedRaw.unit).toFixed(2)} {selectedRaw.unit}
                      </span>
                      <span className="text-slate-500">
                        (Biaya Master: {formatRupiah(convertCostPerUnit(costPerUnit, (selectedUnit || selectedRaw.unit) as ItemUnit, selectedRaw.unit))}/{selectedRaw.unit})
                      </span>
                    </div>
                    <div className="font-black text-slate-900 text-xs shrink-0">
                      Total Baris: {formatRupiah(qty * costPerUnit)}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddItemToReceipt}
                    disabled={!selectedItemId || qty <= 0}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all"
                  >
                    + Masukkan ke Daftar Penerimaan
                  </button>
                </div>

                {/* Items in table */}
                {itemsReceived.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-3">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="py-2 px-3">Bahan Baku</th>
                          <th className="py-2 px-3">Qty Nota</th>
                          <th className="py-2 px-3">Konversi Master</th>
                          <th className="py-2 px-3">Harga Beli</th>
                          <th className="py-2 px-3">Subtotal</th>
                          <th className="py-2 px-3 text-center">Batal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {itemsReceived.map(item => (
                          <tr key={item.itemId}>
                            <td className="py-2 px-3 font-bold text-slate-900">{item.itemName}</td>
                            <td className="py-2 px-3 font-extrabold text-emerald-700">+{item.qty} {item.unit}</td>
                            <td className="py-2 px-3 text-slate-700">
                              {item.baseQty !== undefined && item.baseUnit ? (
                                <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                  +{item.baseQty} {item.baseUnit}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{formatRupiah(item.costPerUnit)}/{item.unit}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{formatRupiah(item.subtotal)}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemFromReceipt(item.itemId)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>

              {/* Notes & Photo Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Penerimaan / Kondisi Barang</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Suhu chiller box -2C, kemasan vacuum rapat, timbangan pas."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Upload Foto Bukti Surat Jalan / Fisik Barang <span className="text-emerald-600 font-bold">*</span>
                  </label>
                  
                  {receiptPhotoUrl ? (
                    <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 flex items-center gap-3">
                      <img 
                        src={receiptPhotoUrl} 
                        alt="Bukti Penerimaan" 
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">Foto Bukti Berhasil Dimuat</span>
                        <span className="text-[10px] text-emerald-600 font-medium">Siap tersimpan dengan data receiving</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReceiptPhotoUrl('')}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        title="Hapus foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <label className="cursor-pointer flex flex-col items-center justify-center">
                        <div className="p-2 rounded-full bg-emerald-50 text-emerald-600 mb-1">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Pilih / Ambil Foto Surat Jalan</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Mendukung JPG, PNG, atau Kamera HP</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, false)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Atau pilih sampel:</span>
                    {sampleInvoices.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReceiptPhotoUrl(url)}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                      >
                        Faktur #{i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total & Stock Increase Reminder */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Tagihan Supplier</span>
                  <span className="text-lg font-black text-slate-900">{formatRupiah(totalAmount)}</span>
                </div>
                <div className="text-right text-[11px] text-emerald-800 font-semibold">
                  <span className="flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Otomatis Menambah Stok Aktual
                  </span>
                </div>
              </div>

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
                  disabled={itemsReceived.length === 0}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  Simpan & Tambah Stok Otomatis
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Edit / Koreksi Penerimaan (Manager & Master Admin) */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Koreksi Inputan Penerimaan Barang</h3>
                  <p className="text-xs text-slate-500">
                    Otoritas Manager / Master Admin • Selisih stok akan otomatis disinkronkan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
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
                    Diinput oleh <strong>{editingRecord.receivedBy}</strong> ({editingRecord.role}) pada {editingRecord.date}.
                    Jika Anda mengubah jumlah kuantiti, sistem akan menghitung selisih dan memperbarui stok bahan aktual secara aman.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor PO / Faktur</label>
                  <input
                    type="text"
                    required
                    value={editPoNumber}
                    onChange={(e) => setEditPoNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Supplier / Pemasok</label>
                  <input
                    type="text"
                    required
                    value={editSupplierName}
                    onChange={(e) => setEditSupplierName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Items Edit List */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900">Koreksi Kuantiti & Harga Satuan Barang:</span>
                  <span className="text-[11px] text-slate-500">{editItems.length} item</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editItems.map((item, idx) => {
                    const raw = rawItems.find(r => r.id === item.itemId);
                    const units = raw ? getCompatibleUnits(raw.unit) : [item.unit];
                    return (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-4 font-bold text-slate-900">
                          {item.itemName}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Master: {raw ? `${raw.currentStock} ${raw.unit}` : item.unit}
                          </span>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Qty</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.001"
                            required
                            value={item.qty}
                            onChange={(e) => handleUpdateEditItemQty(idx, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Satuan</label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateEditItemUnit(idx, e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-xs"
                          >
                            {units.map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Harga Beli / {item.unit}</label>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            required
                            value={item.costPerUnit}
                            onChange={(e) => handleUpdateEditItemCost(idx, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveEditItem(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus baris item ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {item.baseQty !== undefined && item.baseUnit && item.unit.toLowerCase() !== item.baseUnit.toLowerCase() && (
                          <div className="sm:col-span-12 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-medium">
                            ⚡ Otomatis sinkron ke stok master: +{item.baseQty} {item.baseUnit} (@ {formatRupiah(item.costPerBaseUnit || 0)}/{item.baseUnit})
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Koreksi Manager</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Jelaskan alasan koreksi (contoh: Kesalahan hitung fisik kru gudang)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Update Foto Bukti Surat Jalan</label>
                {editReceiptPhotoUrl ? (
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 flex items-center gap-3">
                    <img 
                      src={editReceiptPhotoUrl} 
                      alt="Bukti Penerimaan" 
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">Foto Surat Jalan Terlampir</span>
                      <span className="text-[10px] text-amber-700 font-medium">Klik tombol silang untuk mengganti</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditReceiptPhotoUrl('')}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50/50 hover:bg-slate-50">
                    <label className="cursor-pointer flex flex-col items-center justify-center">
                      <Upload className="w-5 h-5 text-amber-600 mb-1" />
                      <span className="text-xs font-bold text-slate-800">Upload Foto Baru</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-900 block">Total Tagihan Hasil Koreksi</span>
                  <span className="text-lg font-black text-slate-900">
                    {formatRupiah(editItems.reduce((s, i) => s + i.subtotal, 0))}
                  </span>
                </div>
                <div className="text-right text-[11px] text-amber-900 font-semibold">
                  <span className="flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" />
                    Stok Otomatis Disesuaikan
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
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

      {/* Modal Konfirmasi Hapus Transaksi (Manager & Master Admin) */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Hapus Input Penerimaan?</h3>
                <p className="text-xs text-slate-500">PO: {deletingRecord.poNumber} • {deletingRecord.supplierName}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1.5">
              <span className="font-bold block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Peringatan Rekonsiliasi Otomatis:
              </span>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Menghapus input ini akan <strong>menarik / mengurangi kembali</strong> stok bahan berikut dari gudang agar jumlah fisik tetap sinkron:
              </p>
              <ul className="list-disc list-inside text-[11px] font-semibold text-rose-950 pt-1 space-y-0.5">
                {deletingRecord.items.map((it, idx) => (
                  <li key={idx}>
                    {it.itemName}: -{it.qty} {it.unit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-xs text-slate-700"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs"
              >
                Ya, Hapus & Tarik Balik Stok
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
