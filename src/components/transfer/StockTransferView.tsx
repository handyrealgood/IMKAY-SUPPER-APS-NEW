import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { StockTransferItem, StockTransferRecord, OutletInfo, ItemUnit } from '../../types';
import { 
  convertQuantity, 
  getCompatibleUnits 
} from '../../utils/unitConversion';
import { 
  ArrowLeftRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Truck, 
  Store,
  Layers,
  Pencil,
  AlertTriangle,
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  Building2,
  MapPin,
  Check,
  ArrowRight
} from 'lucide-react';

export const StockTransferView: React.FC = () => {
  const { 
    transfers, 
    rawItems, 
    addStockTransfer, 
    updateStockTransfer,
    deleteStockTransfer,
    updateTransferStatus, 
    currentUser,
    outlets,
    addOutlet,
    updateOutlet,
    deleteOutlet
  } = useResto();

  const isMasterOrManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showOutletModal, setShowOutletModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedTransferForReceive, setSelectedTransferForReceive] = useState<StockTransferRecord | null>(null);
  const [receiverName, setReceiverName] = useState(currentUser.name);
  const [receivingPhotoUrl, setReceivingPhotoUrl] = useState('');

  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit State
  const [editingTransfer, setEditingTransfer] = useState<StockTransferRecord | null>(null);
  const [editTransferNumber, setEditTransferNumber] = useState('');
  const [editOriginOutlet, setEditOriginOutlet] = useState('');
  const [editDestinationOutlet, setEditDestinationOutlet] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editShippingPhotoUrl, setEditShippingPhotoUrl] = useState('');
  const [editItems, setEditItems] = useState<StockTransferItem[]>([]);

  // Delete State
  const [deletingTransfer, setDeletingTransfer] = useState<StockTransferRecord | null>(null);

  // Form states for creating transfer
  const [transferType, setTransferType] = useState<'out' | 'in'>('out');
  const [originOutlet, setOriginOutlet] = useState(outlets[0]?.name || 'Outlet Utama');
  const [destinationOutlet, setDestinationOutlet] = useState(outlets[1]?.name || outlets[0]?.name || 'Outlet Cabang');
  const [transferNumber, setTransferNumber] = useState(
    `TRF-${new Date().toISOString().slice(5, 10).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [notes, setNotes] = useState('');
  const [shippingPhotoUrl, setShippingPhotoUrl] = useState('');
  const [transferItems, setTransferItems] = useState<StockTransferItem[]>([]);

  // Item selector inside modal with unit selection
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [qty, setQty] = useState<number>(2);

  const selectedRaw = rawItems.find(i => i.id === selectedItemId);
  const availableUnits = selectedRaw ? getCompatibleUnits(selectedRaw.unit) : [];

  const handleItemSelect = (id: string) => {
    setSelectedItemId(id);
    const raw = rawItems.find(i => i.id === id);
    if (raw) {
      setSelectedUnit(raw.unit);
      setQty(raw.unit.toLowerCase() === 'gram' ? 1000 : 2);
    } else {
      setSelectedUnit('');
    }
  };

  // Outlet Management form states
  const [editingOutletId, setEditingOutletId] = useState<string | null>(null);
  const [outletNameInput, setOutletNameInput] = useState('');
  const [outletCityInput, setOutletCityInput] = useState('');
  const [outletAddressInput, setOutletAddressInput] = useState('');
  const [outletPhoneInput, setOutletPhoneInput] = useState('');

  // Image Preview Modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Photo File Reader
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = () => {
    if (!selectedItemId || qty <= 0) return;
    const raw = rawItems.find(i => i.id === selectedItemId);
    if (!raw) return;

    if (transferItems.some(t => t.itemId === raw.id)) {
      alert('Item sudah dimasukkan ke daftar transfer.');
      return;
    }

    const unitToUse = (selectedUnit || raw.unit) as ItemUnit;
    const baseQty = convertQuantity(qty, unitToUse, raw.unit as ItemUnit);

    if (transferType === 'out' && raw.currentStock < baseQty) {
      alert(`Peringatan: Stok ${raw.name} saat ini hanya ${raw.currentStock} ${raw.unit}. Tidak cukup untuk transfer ${qty} ${unitToUse} (= ${baseQty} ${raw.unit})!`);
      return;
    }

    setTransferItems([...transferItems, {
      itemId: raw.id,
      itemName: raw.name,
      qty: Number(qty),
      unit: unitToUse,
      baseQty,
      baseUnit: raw.unit,
    }]);

    setSelectedItemId('');
    setSelectedUnit('');
    setQty(2);
  };

  const handleRemoveItem = (itemId: string) => {
    setTransferItems(transferItems.filter(i => i.itemId !== itemId));
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferItems.length === 0) {
      alert('Tambahkan minimal 1 item yang dimutasi!');
      return;
    }
    if (originOutlet === destinationOutlet) {
      alert('Outlet asal dan tujuan tidak boleh sama!');
      return;
    }

    addStockTransfer({
      transferNumber: transferNumber.trim(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: transferType,
      originOutlet,
      destinationOutlet,
      items: transferItems,
      status: transferType === 'out' ? 'Dalam Pengiriman' : 'Pending',
      requestedBy: currentUser.name,
      notes: notes.trim() || `Transfer antar outlet`,
      shippingPhotoUrl: shippingPhotoUrl || undefined,
    });

    setShowAddModal(false);
    setTransferItems([]);
    setNotes('');
    setShippingPhotoUrl('');
    setTransferNumber(`TRF-${new Date().toISOString().slice(5, 10).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleOpenReceiveModal = (transfer: StockTransferRecord) => {
    setSelectedTransferForReceive(transfer);
    setReceiverName(currentUser.name);
    setReceivingPhotoUrl('');
    setShowReceiveModal(true);
  };

  const handleConfirmReceived = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransferForReceive) return;
    updateTransferStatus(
      selectedTransferForReceive.id, 
      'Diterima', 
      receiverName.trim() || currentUser.name, 
      receivingPhotoUrl || undefined
    );
    setShowReceiveModal(false);
    setSelectedTransferForReceive(null);
    setActionFeedback({
      type: 'success',
      message: `Penerimaan transfer ${selectedTransferForReceive.transferNumber} berhasil dikonfirmasi dan stok telah disesuaikan.`
    });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Manager Edit Handlers
  const handleOpenEdit = (transfer: StockTransferRecord) => {
    setEditingTransfer(transfer);
    setEditTransferNumber(transfer.transferNumber);
    setEditOriginOutlet(transfer.originOutlet);
    setEditDestinationOutlet(transfer.destinationOutlet);
    setEditNotes(transfer.notes || '');
    setEditShippingPhotoUrl(transfer.shippingPhotoUrl || '');
    setEditItems([...transfer.items]);
  };

  const handleUpdateEditItemQty = (idx: number, newQty: number) => {
    if (newQty <= 0) return;
    const next = [...editItems];
    const itm = next[idx];
    const raw = rawItems.find(r => r.id === itm.itemId);
    const baseUnit = (itm.baseUnit || raw?.unit || itm.unit) as ItemUnit;
    const baseQty = convertQuantity(newQty, itm.unit as ItemUnit, baseUnit);

    next[idx] = { 
      ...itm, 
      qty: newQty,
      baseQty,
      baseUnit
    };
    setEditItems(next);
  };

  const handleUpdateEditItemUnit = (idx: number, newUnit: string) => {
    const next = [...editItems];
    const itm = next[idx];
    const raw = rawItems.find(r => r.id === itm.itemId);
    const baseUnit = (itm.baseUnit || raw?.unit || newUnit) as ItemUnit;
    const baseQty = convertQuantity(itm.qty, newUnit as ItemUnit, baseUnit);

    next[idx] = { 
      ...itm, 
      unit: newUnit as ItemUnit,
      baseQty,
      baseUnit
    };
    setEditItems(next);
  };

  const handleRemoveEditItem = (idx: number) => {
    if (editItems.length <= 1) {
      alert('Transfer harus memiliki minimal 1 item!');
      return;
    }
    setEditItems(editItems.filter((_, i) => i !== idx));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransfer) return;
    if (editItems.length === 0) {
      alert('Transfer harus memiliki minimal 1 item!');
      return;
    }

    const res = updateStockTransfer(editingTransfer.id, {
      transferNumber: editTransferNumber.trim(),
      originOutlet: editOriginOutlet,
      destinationOutlet: editDestinationOutlet,
      notes: editNotes.trim(),
      shippingPhotoUrl: editShippingPhotoUrl || undefined,
      items: editItems,
    });

    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setEditingTransfer(null);
      setTimeout(() => setActionFeedback(null), 3500);
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingTransfer) return;
    const res = deleteStockTransfer(deletingTransfer.id);
    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setDeletingTransfer(null);
      setTimeout(() => setActionFeedback(null), 3500);
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  // Outlet Management Handlers
  const handleSaveOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outletNameInput.trim()) return;

    if (editingOutletId) {
      updateOutlet(editingOutletId, {
        name: outletNameInput.trim(),
        city: outletCityInput.trim(),
        address: outletAddressInput.trim(),
        phone: outletPhoneInput.trim(),
      });
      setActionFeedback({ type: 'success', message: `Outlet ${outletNameInput} berhasil diperbarui.` });
    } else {
      addOutlet({
        name: outletNameInput.trim(),
        city: outletCityInput.trim() || 'Jakarta',
        address: outletAddressInput.trim(),
        phone: outletPhoneInput.trim(),
      });
      setActionFeedback({ type: 'success', message: `Outlet baru ${outletNameInput} berhasil ditambahkan.` });
    }

    setEditingOutletId(null);
    setOutletNameInput('');
    setOutletCityInput('');
    setOutletAddressInput('');
    setOutletPhoneInput('');
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleStartEditOutlet = (outlet: OutletInfo) => {
    setEditingOutletId(outlet.id);
    setOutletNameInput(outlet.name);
    setOutletCityInput(outlet.city);
    setOutletAddressInput(outlet.address || '');
    setOutletPhoneInput(outlet.phone || '');
  };

  const handleCancelOutletEdit = () => {
    setEditingOutletId(null);
    setOutletNameInput('');
    setOutletCityInput('');
    setOutletAddressInput('');
    setOutletPhoneInput('');
  };

  const handleDeleteOutlet = (outlet: OutletInfo) => {
    if (outlets.length <= 1) {
      alert('Sistem harus memiliki minimal 1 outlet aktif.');
      return;
    }
    if (window.confirm(`Hapus outlet "${outlet.name}"? Data mutasi historis akan tetap tersimpan.`)) {
      deleteOutlet(outlet.id);
      setActionFeedback({ type: 'success', message: `Outlet ${outlet.name} telah dihapus.` });
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  const filteredTransfers = transfers.filter(t => {
    const matchesSearch = t.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.originOutlet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.destinationOutlet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.items.some(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && t.type === filterType;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Transfer In & Out Antar Cabang Outlet</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Integrasi Mutasi Real-time
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau perpindahan bahan baku antar cabang resto secara real-time dengan bukti foto surat jalan dan konfirmasi fisik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isMasterOrManager && (
            <button
              onClick={() => setShowOutletModal(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5"
              title="Atur dan Ganti Nama Outlet (Manager)"
            >
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>Kelola Nama Outlet ({outlets.length})</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Buat Permintaan Transfer</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor surat transfer, outlet, atau nama bahan..."
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
            Semua Mutasi ({transfers.length})
          </button>
          <button
            onClick={() => setFilterType('in')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === 'in' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" /> Transfer In
          </button>
          <button
            onClick={() => setFilterType('out')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === 'out' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Transfer Out
          </button>
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

      {/* Transfer Cards List */}
      <div className="space-y-4">
        {filteredTransfers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Tidak ada data transfer mutasi yang cocok dengan pencarian atau filter.
          </div>
        ) : (
          filteredTransfers.map(trf => {
            const isTransferIn = trf.type === 'in';
            return (
              <div key={trf.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      isTransferIn ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isTransferIn ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900">{trf.transferNumber}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          isTransferIn ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isTransferIn ? 'TRANSFER IN' : 'TRANSFER OUT'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          trf.status === 'Diterima' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {trf.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>{trf.date}</span>
                        <span>•</span>
                        <span>Diajukan oleh: <strong className="text-slate-800">{trf.requestedBy}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Route */}
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-semibold">Dari:</span>
                        <strong className="text-slate-900">{trf.originOutlet}</strong>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-slate-400 font-semibold">Ke:</span>
                        <strong className="text-blue-700">{trf.destinationOutlet}</strong>
                      </div>
                    </div>

                    {isMasterOrManager && (
                      <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                        <button
                          onClick={() => handleOpenEdit(trf)}
                          className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1 transition-all"
                          title="Koreksi Inputan Transfer (Manager)"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Koreksi</span>
                        </button>
                        <button
                          onClick={() => setDeletingTransfer(trf)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all"
                          title="Hapus Transfer & Rekonsiliasi Stok"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items in this transfer - emphasized units */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                  {trf.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate mr-2">{item.itemName}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-extrabold text-blue-800 shrink-0 flex items-center gap-1">
                        <span>{item.qty} {item.unit}</span>
                        {item.baseQty !== undefined && item.baseUnit && item.unit.toLowerCase() !== item.baseUnit.toLowerCase() && (
                          <span className="text-[10px] text-slate-500 font-normal">
                            (= {item.baseQty.toLocaleString()} {item.baseUnit})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Photos & Notes Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs pt-3 border-t border-slate-100 text-slate-500">
                  <div className="space-y-1">
                    <div><strong>Catatan:</strong> {trf.notes || 'Mutasi stok operasional.'}</div>
                    {trf.receivedBy && (
                      <div className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Diterima oleh: <strong>{trf.receivedBy}</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Shipping Photo Thumb */}
                    {trf.shippingPhotoUrl && (
                      <button
                        onClick={() => setPreviewImageUrl(trf.shippingPhotoUrl || null)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] border border-blue-200"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Foto Kirim</span>
                      </button>
                    )}

                    {/* Receiving Photo Thumb */}
                    {trf.receivingPhotoUrl && (
                      <button
                        onClick={() => setPreviewImageUrl(trf.receivingPhotoUrl || null)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] border border-emerald-200"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Foto Terima</span>
                      </button>
                    )}

                    {/* Confirm Receive Button */}
                    {isTransferIn && trf.status !== 'Diterima' && (
                      <button
                        onClick={() => handleOpenReceiveModal(trf)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Konfirmasi Penerimaan Barang Masuk</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Buat Permintaan Transfer Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-900">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Form Transfer Mutasi Bahan Baku</h3>
                  <p className="text-xs text-slate-500">Kirim atau terima bahan baku dari/ke cabang lain</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-4 mt-4 text-xs">
              
              {/* Type selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Mutasi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferType('out')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                      transferType === 'out' 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Transfer Out (Kirim Keluar)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferType('in')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                      transferType === 'in' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Transfer In (Permintaan Masuk)</span>
                  </button>
                </div>
              </div>

              {/* Origin & Destination (from Outlets State) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Outlet Asal Pengirim</label>
                  <select
                    value={originOutlet}
                    onChange={(e) => setOriginOutlet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {outlets.map(o => (
                      <option key={o.id} value={o.name}>{o.name} ({o.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Outlet Tujuan Penerima</label>
                  <select
                    value={destinationOutlet}
                    onChange={(e) => setDestinationOutlet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {outlets.map(o => (
                      <option key={o.id} value={o.name}>{o.name} ({o.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-extrabold text-slate-900 block">
                  Pilih Bahan yang Dimutasi (Satuan / Unit Otomatis Tertera)
                </span>

                <div className="flex flex-col sm:flex-row gap-2 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Bahan Baku & Satuan</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="">-- Pilih Bahan Baku --</option>
                      {rawItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} — Satuan: [{item.unit}] (Stok saat ini: {item.currentStock} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Jumlah {selectedItemId ? `(${rawItems.find(i => i.id === selectedItemId)?.unit || ''})` : ''}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={qty}
                      onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedItemId}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold"
                  >
                    + Tambah
                  </button>
                </div>

                {/* Table of items to transfer */}
                {transferItems.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-3">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="py-2 px-3">Bahan Baku</th>
                          <th className="py-2 px-3">Jumlah Transfer</th>
                          <th className="py-2 px-3">Satuan Baku</th>
                          <th className="py-2 px-3 text-center">Batal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transferItems.map(item => (
                          <tr key={item.itemId}>
                            <td className="py-2 px-3 font-bold text-slate-900">{item.itemName}</td>
                            <td className="py-2 px-3 font-black text-blue-700">{item.qty}</td>
                            <td className="py-2 px-3 font-bold text-slate-600">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                {item.unit}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.itemId)}
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

              {/* Upload Foto Bukti Pengiriman */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Foto Bukti Pengiriman / Surat Jalan
                </label>
                {shippingPhotoUrl ? (
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 flex items-center gap-3">
                    <img 
                      src={shippingPhotoUrl} 
                      alt="Bukti Pengiriman" 
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">Foto Surat Jalan Terlampir</span>
                      <span className="text-[10px] text-blue-600 font-medium">Foto siap disertakan saat transfer dikirim</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShippingPhotoUrl('')}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <label className="cursor-pointer flex flex-col items-center justify-center">
                      <div className="p-2 rounded-full bg-blue-50 text-blue-600 mb-1">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Pilih / Ambil Foto Bukti Surat Jalan</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Mendukung kamera HP atau file gambar (JPG/PNG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, setShippingPhotoUrl)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Kurir Pengantar</label>
                <input
                  type="text"
                  placeholder="Contoh: Dikirim via kurir motor internal outlet, estimasi tiba 45 menit."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
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
                  disabled={transferItems.length === 0}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  Simpan & Kirim Permintaan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Konfirmasi Penerimaan Barang Masuk & Upload Foto */}
      {showReceiveModal && selectedTransferForReceive && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Konfirmasi Terima Barang</h3>
                  <p className="text-xs text-slate-500">{selectedTransferForReceive.transferNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmReceived} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-1">Daftar Barang yang Diterima:</span>
                <ul className="space-y-1">
                  {selectedTransferForReceive.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between text-slate-800">
                      <span>{i.itemName}</span>
                      <strong className="text-emerald-800">{i.qty} {i.unit}</strong>
                    </li>
                  ))}
                </ul>
                <span className="text-[10px] text-emerald-700 block mt-2">
                  * Stok barang fisik akan langsung bertambah ke sistem.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Penerima / Checker <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Foto Bukti Penerimaan Fisik
                </label>
                {receivingPhotoUrl ? (
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 flex items-center gap-3">
                    <img 
                      src={receivingPhotoUrl} 
                      alt="Bukti Penerimaan" 
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">Foto Penerimaan Fisik</span>
                      <span className="text-[10px] text-emerald-600 font-medium">Tersimpan sebagai arsip audit</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceivingPhotoUrl('')}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50/50 hover:bg-slate-50">
                    <label className="cursor-pointer flex flex-col items-center justify-center">
                      <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                      <span className="text-xs font-bold text-slate-800">Ambil Foto Fisik Barang Tiba</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, setReceivingPhotoUrl)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  Konfirmasi & Update Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Kelola & Ganti Nama Outlet (Khusus Manager) */}
      {showOutletModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Kelola & Ganti Nama Cabang Outlet</h3>
                  <p className="text-xs text-slate-500">Atur daftar outlet yang terhubung dalam sistem mutasi resto</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowOutletModal(false);
                  handleCancelOutletEdit();
                }}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Form Tambah / Edit Outlet */}
              <form onSubmit={handleSaveOutlet} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-extrabold text-slate-900 block">
                  {editingOutletId ? '✏️ Edit / Ganti Nama Outlet' : '+ Tambah Cabang Outlet Baru'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Nama Outlet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Outlet Senopati (HQ)"
                      value={outletNameInput}
                      onChange={(e) => setOutletNameInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Kota / Lokasi</label>
                    <input
                      type="text"
                      placeholder="Contoh: Jakarta Selatan"
                      value={outletCityInput}
                      onChange={(e) => setOutletCityInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Alamat Lengkap</label>
                    <input
                      type="text"
                      placeholder="Jl. Senopati No. 45"
                      value={outletAddressInput}
                      onChange={(e) => setOutletAddressInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Nomor Telepon Outlet</label>
                    <input
                      type="text"
                      placeholder="021-55667788"
                      value={outletPhoneInput}
                      onChange={(e) => setOutletPhoneInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  {editingOutletId && (
                    <button
                      type="button"
                      onClick={handleCancelOutletEdit}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-xs"
                  >
                    {editingOutletId ? 'Simpan Perubahan Outlet' : '+ Tambah Outlet'}
                  </button>
                </div>
              </form>

              {/* Outlet List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Nama Cabang Outlet</th>
                      <th className="py-2.5 px-3">Kota</th>
                      <th className="py-2.5 px-3">Alamat</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outlets.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {o.name}
                          {o.isCentral && (
                            <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                              CENTRAL
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{o.city}</td>
                        <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{o.address || '-'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEditOutlet(o)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50"
                              title="Ganti nama outlet"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {!o.isCentral && (
                              <button
                                onClick={() => handleDeleteOutlet(o)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Hapus outlet"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowOutletModal(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Image Preview Lightbox */}
      {previewImageUrl && (
        <div 
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-2xl max-h-[85vh] bg-white p-3 rounded-2xl overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-900/80 text-white rounded-full hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImageUrl} 
              alt="Preview Bukti" 
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
            <div className="text-center text-xs font-bold text-slate-600 mt-2">
              Bukti Foto Transfer Antar Outlet
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Manager Edit Transfer */}
      {editingTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Koreksi Data Transfer Mutasi</h3>
              <button onClick={() => setEditingTransfer(null)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Outlet Asal</label>
                  <select
                    value={editOriginOutlet}
                    onChange={(e) => setEditOriginOutlet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {outlets.map(o => (
                      <option key={o.id} value={o.name}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Outlet Tujuan</label>
                  <select
                    value={editDestinationOutlet}
                    onChange={(e) => setEditDestinationOutlet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {outlets.map(o => (
                      <option key={o.id} value={o.name}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Kuantiti Barang yang Dikirim:</span>
                {editItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 gap-2">
                    <span className="font-bold text-slate-800 flex-1">{item.itemName}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.qty}
                        onChange={(e) => handleUpdateEditItemQty(idx, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
                      />
                      <span className="text-slate-500 font-semibold">{item.unit}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEditItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Koreksi</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTransfer(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  Simpan Koreksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Delete Confirmation */}
      {deletingTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center text-xs">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">Hapus Data Mutasi?</h3>
            <p className="text-slate-500 mb-4">
              Nomor mutasi <strong>{deletingTransfer.transferNumber}</strong> akan dihapus dan stok barang akan direkonsiliasi.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingTransfer(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
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
