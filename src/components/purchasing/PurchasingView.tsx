import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { PurchasingOrder, PurchasingOrderItem, PurchasingStatus, RawItem } from '../../types';
import { 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Building2, 
  Plus, 
  Search, 
  ArrowUpRight, 
  FileText, 
  Check, 
  X, 
  Bell, 
  Package, 
  ChevronRight, 
  Trash2,
  Phone
} from 'lucide-react';

export const PurchasingView: React.FC = () => {
  const { 
    purchasingOrders, 
    addPurchasingOrder, 
    updatePurchasingOrderStatus,
    deletePurchasingOrder,
    rawItems, 
    suppliers, 
    outlets,
    currentUser, 
    formatRupiah 
  } = useResto();

  const isPurchasingAdmin = currentUser.role === 'purchasing' || currentUser.role === 'manager' || currentUser.isMasterAdmin;
  const isManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  // Tabs: 'orders' (Terima orderan dari outlet), 'limits' (Lihat bahan baku limit), 'new' (Buat PO baru)
  const [activeTab, setActiveTab] = useState<'orders' | 'limits'>('orders');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingPO, setDeletingPO] = useState<PurchasingOrder | null>(null);

  // New PO Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetOutlet, setTargetOutlet] = useState(outlets?.[0]?.name || 'Outlet Utama');
  const [selectedSupplier, setSelectedSupplier] = useState(suppliers?.[0]?.name || 'PT Pangan Segar Nusantara');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<PurchasingOrderItem[]>([]);
  
  // Single item selector inside modal
  const [selectedRawId, setSelectedRawId] = useState('');
  const [poQty, setPoQty] = useState<number>(5);

  // Detail / Process Modal
  const [selectedPO, setSelectedPO] = useState<PurchasingOrder | null>(null);
  const [processStatus, setProcessStatus] = useState<PurchasingStatus>('Diproses Purchasing');
  const [processNotes, setProcessNotes] = useState('');
  const [assignedSupplier, setAssignedSupplier] = useState('');

  // Low stock raw items calculation (Bahan baku limit)
  const lowStockItems = rawItems.filter(item => item.currentStock <= (item.minimumStock || 0));

  // Orders pending action
  const pendingOrdersCount = purchasingOrders.filter(po => 
    po.status === 'Diajukan' || po.status === 'Menunggu Approval' || po.status === 'Diproses Purchasing'
  ).length;

  // Add Item to new PO
  const handleAddPoItem = () => {
    if (!selectedRawId || poQty <= 0) return;
    const raw = rawItems.find(i => i.id === selectedRawId);
    if (!raw) return;

    if (poItems.some(i => i.itemId === raw.id)) {
      alert('Item sudah ada dalam daftar PO');
      return;
    }

    setPoItems([...poItems, {
      itemId: raw.id,
      itemName: raw.name,
      currentStock: raw.currentStock,
      minimumStock: raw.minimumStock,
      requestedQty: poQty,
      qty: poQty,
      unit: raw.unit,
      estimatedCost: raw.costPerUnit,
      estimatedPrice: raw.costPerUnit,
      subtotal: poQty * raw.costPerUnit,
    }]);

    setSelectedRawId('');
    setPoQty(5);
  };

  const handleRemovePoItem = (itemId: string) => {
    setPoItems(poItems.filter(i => i.itemId !== itemId));
  };

  // Pre-fill PO from Low Stock Alert item
  const handleQuickPoFromLowStock = (item: RawItem) => {
    const minStock = item.minimumStock || 5;
    const deficit = Math.max(5, (minStock * 2) - item.currentStock);
    setShowCreateModal(true);
    setPoItems([{
      itemId: item.id,
      itemName: item.name,
      currentStock: item.currentStock,
      minimumStock: minStock,
      requestedQty: Number(deficit.toFixed(1)),
      qty: Number(deficit.toFixed(1)),
      unit: item.unit,
      estimatedCost: item.costPerUnit,
      estimatedPrice: item.costPerUnit,
      subtotal: deficit * item.costPerUnit,
    }]);
    setPoNotes(`Permintaan restock darurat otomatis: stok menipis (${item.currentStock} ${item.unit} / batas aman ${minStock} ${item.unit})`);
  };

  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      alert('Tambahkan minimal 1 item untuk pengajuan order!');
      return;
    }

    const totalEst = poItems.reduce((s, i) => s + (i.subtotal || 0), 0);

    addPurchasingOrder({
      originOutlet: targetOutlet,
      outletName: targetOutlet,
      supplierName: selectedSupplier,
      status: 'Menunggu Approval',
      requestedBy: currentUser.name,
      role: currentUser.role,
      priority: 'Normal',
      date: new Date().toISOString().slice(0, 10),
      items: poItems.map(i => ({
        ...i,
        requestedQty: i.requestedQty || i.qty || 1,
        qty: i.qty || i.requestedQty || 1,
        estimatedCost: i.estimatedCost || i.estimatedPrice || 0,
        estimatedPrice: i.estimatedPrice || i.estimatedCost || 0,
      })),
      totalEstimatedCost: totalEst,
      notes: poNotes.trim() || undefined,
    });

    setShowCreateModal(false);
    setPoItems([]);
    setPoNotes('');
  };

  // Handle Process PO by Purchasing Admin
  const handleOpenProcessPO = (po: PurchasingOrder) => {
    setSelectedPO(po);
    setProcessStatus(po.status);
    setProcessNotes(po.notes || '');
    setAssignedSupplier(po.supplierName || suppliers?.[0]?.name || '');
  };

  const handleSaveProcessPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;
    updatePurchasingOrderStatus(selectedPO.id, processStatus, processNotes, assignedSupplier);
    setSelectedPO(null);
  };

  // Filtered orders list (Safe against missing/undefined properties)
  const filteredOrders = purchasingOrders.filter(po => {
    const orderNum = (po.orderNumber || '').toLowerCase();
    const outlet = (po.originOutlet || po.outletName || '').toLowerCase();
    const supplier = (po.supplierName || '').toLowerCase();
    const s = searchTerm.toLowerCase();
    const hasItem = po.items && Array.isArray(po.items) && po.items.some(i => (i.itemName || '').toLowerCase().includes(s));

    const matchesSearch = orderNum.includes(s) ||
                          outlet.includes(s) ||
                          supplier.includes(s) ||
                          Boolean(hasItem);
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'Menunggu Approval') {
      return matchesSearch && (po.status === 'Menunggu Approval' || po.status === 'Diajukan');
    }
    if (statusFilter === 'Barang Dikirim') {
      return matchesSearch && (po.status === 'Barang Dikirim' || po.status === 'Dikirim ke Outlet');
    }
    return matchesSearch && po.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Purchasing & Pengadaan Bahan Baku</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Admin Purchasing
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau limit bahan baku, terima dan proses permintaan order dari outlet cabang, koordinasi supplier.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Buat Permintaan Order / PO</span>
          </button>
        </div>
      </div>

      {/* Notification Alert Bar for Purchasing Admin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notif 1: Order Masuk Dari Outlet */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-amber-950">Notifikasi Order Outlet</h4>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                {pendingOrdersCount} Perlu Diproses
              </span>
            </div>
            <p className="text-[11px] text-amber-800 mt-1">
              Ada permintaan pengadaan bahan dari cabang outlet yang menunggu approval dan pemesanan ke supplier.
            </p>
            <button
              onClick={() => {
                setActiveTab('orders');
                setStatusFilter('Diajukan');
              }}
              className="mt-2 text-[11px] font-bold text-amber-900 hover:underline flex items-center gap-1"
            >
              <span>Lihat Permintaan Masuk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notif 2: Bahan Baku Limit (Low Stock) */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-rose-100 text-rose-800 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-rose-950">Bahan Baku Menipis (Limit)</h4>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                {lowStockItems.length} Item Kritis
              </span>
            </div>
            <p className="text-[11px] text-rose-800 mt-1">
              Stok fisik di bawah batas minimum safety stock. Segera buat PO sebelum terjadi stockout di dapur resto.
            </p>
            <button
              onClick={() => setActiveTab('limits')}
              className="mt-2 text-[11px] font-bold text-rose-900 hover:underline flex items-center gap-1"
            >
              <span>Periksa Daftar Bahan Limit</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-blue-600" />
          <span>Terima Orderan dari Outlet ({purchasingOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('limits')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'limits' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Lihat Bahan Baku Limit ({lowStockItems.length})</span>
        </button>
      </div>

      {/* TAB 1: TERIMA ORDERAN DARI OUTLET */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor order, outlet, bahan baku, atau supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'Menunggu Approval', 'Diproses Purchasing', 'Barang Dikirim', 'Selesai'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'Semua Status' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Cards */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Tidak ada permintaan order purchasing yang cocok dengan kriteria pencarian.
              </div>
            ) : (
              filteredOrders.map(order => {
                const isPending = order.status === 'Menunggu Approval' || order.status === 'Diajukan';
                const isProcessing = order.status === 'Diproses Purchasing';
                const isSent = order.status === 'Barang Dikirim' || order.status === 'Dikirim ke Outlet';
                const isDone = order.status === 'Selesai';
                const isRejected = order.status === 'Ditolak';

                return (
                  <div 
                    key={order.id} 
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl font-bold ${
                          isDone 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isPending 
                            ? 'bg-amber-100 text-amber-800' 
                            : isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-extrabold text-sm text-slate-900">{order.orderNumber}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              isDone ? 'bg-emerald-100 text-emerald-800' :
                              isPending ? 'bg-amber-100 text-amber-800' :
                              isSent ? 'bg-indigo-100 text-indigo-800' :
                              isRejected ? 'bg-rose-100 text-rose-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {order.status}
                            </span>
                            {order.priority && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                String(order.priority).includes('Kritis') || String(order.priority).includes('Mendesak') || String(order.priority).includes('Urgent')
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {order.priority}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Diajukan oleh: <strong className="text-slate-800">{order.requestedBy}</strong></span>
                            <span>•</span>
                            <span>Cabang: <strong className="text-blue-700">{order.outletName || order.originOutlet || 'Outlet Utama'}</strong></span>
                            <span>•</span>
                            <span>{order.createdAt}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <div className="text-right mr-2 hidden sm:block">
                          <span className="text-[10px] text-slate-400 block font-semibold">Estimasi Total</span>
                          <span className="text-sm font-black text-slate-900">{formatRupiah(order.totalEstimatedCost)}</span>
                        </div>

                        {isPurchasingAdmin && (
                          <button
                            onClick={() => handleOpenProcessPO(order)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            <span>Proses Status Order</span>
                          </button>
                        )}

                        {isManager && (
                          <button
                            onClick={() => setDeletingPO(order)}
                            className="p-1.5 border border-rose-200 hover:bg-rose-50 rounded-xl text-rose-600 transition-colors"
                            title="Hapus PO (Manager)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {order.items.map((i, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 truncate mr-2">{i.itemName}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-extrabold text-blue-800 shrink-0">
                            {i.requestedQty || i.qty || 0} {i.unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                      <div>
                        {order.supplierName && (
                          <span className="mr-3">
                            Supplier Dialokasikan: <strong className="text-slate-800">{order.supplierName}</strong>
                          </span>
                        )}
                        {order.notes && (
                          <span>Catatan: <em>"{order.notes}"</em></span>
                        )}
                      </div>
                      <div className="text-right sm:hidden">
                        Total Est: <strong className="text-slate-900">{formatRupiah(order.totalEstimatedCost)}</strong>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* TAB 2: LIHAT BAHAN BAKU LIMIT */}
      {activeTab === 'limits' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Monitoring Batas Stok Bahan Baku (Limit Alerts)</h3>
                <p className="text-xs text-slate-500">
                  Daftar bahan baku yang saat ini berada pada atau di bawah batas minimum (min stock).
                </p>
              </div>
              <span className="px-3 py-1 bg-rose-100 text-rose-800 font-extrabold text-xs rounded-full">
                {lowStockItems.length} Bahan Butuh Restock
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Nama Bahan Baku</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-center">Stok Saat Ini</th>
                    <th className="py-2.5 px-3 text-center">Batas Min (Safety)</th>
                    <th className="py-2.5 px-3">Defisit Kekurangan</th>
                    <th className="py-2.5 px-3">Biaya / Unit</th>
                    <th className="py-2.5 px-3 text-right">Aksi Kilat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-emerald-700 font-bold">
                        ✓ Semua stok bahan baku berada dalam batas aman. Tidak ada bahan yang limit!
                      </td>
                    </tr>
                  ) : (
                    lowStockItems.map(item => {
                      const minStock = item.minimumStock || 5;
                      const deficit = Math.max(0, minStock - item.currentStock);
                      return (
                        <tr key={item.id} className="hover:bg-rose-50/40">
                          <td className="py-2.5 px-3 font-extrabold text-slate-900">{item.name}</td>
                          <td className="py-2.5 px-3 text-slate-500">{item.category}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black">
                              {item.currentStock} {item.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 font-bold">
                            {minStock} {item.unit}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-rose-600">
                            -{deficit.toFixed(1)} {item.unit}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">
                            {formatRupiah(item.costPerUnit)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleQuickPoFromLowStock(item)}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Buat PO Kilat</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: FORM BUAT PURCHASE ORDER (PO) BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-900">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Form Pengajuan Order Purchasing</h3>
                  <p className="text-[11px] text-slate-500">Kirim permintaan pengadaan bahan baku ke tim purchasing</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitPO} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Outlet Peminta</label>
                  <select
                    value={targetOutlet}
                    onChange={(e) => setTargetOutlet(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {(outlets || []).map(o => (
                      <option key={o.id} value={o.name}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rekomendasi Supplier</label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {(suppliers || []).map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Picker */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-extrabold text-slate-900 block">Pilih Bahan Baku yang Dipesan</span>
                
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Bahan Baku</label>
                    <select
                      value={selectedRawId}
                      onChange={(e) => setSelectedRawId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="">-- Pilih Bahan --</option>
                      {rawItems.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.unit}) — Est: {formatRupiah(i.costPerUnit)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Jumlah</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={poQty}
                      onChange={(e) => setPoQty(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPoItem}
                    disabled={!selectedRawId}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold"
                  >
                    + Tambah
                  </button>
                </div>

                {/* Table of items */}
                {poItems.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-3">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="py-2 px-3">Bahan Baku</th>
                          <th className="py-2 px-3">Qty & Unit</th>
                          <th className="py-2 px-3">Est. Subtotal</th>
                          <th className="py-2 px-3 text-center">Batal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {poItems.map(i => (
                          <tr key={i.itemId}>
                            <td className="py-2 px-3 font-bold text-slate-900">{i.itemName}</td>
                            <td className="py-2 px-3 font-black text-blue-700">{i.qty} {i.unit}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{formatRupiah(i.subtotal || 0)}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePoItem(i.itemId)}
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan / Urgensi</label>
                <input
                  type="text"
                  placeholder="Contoh: Sangat mendesak untuk event weekend Sabtu besok."
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={poItems.length === 0}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs"
                >
                  Kirim Pengajuan PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PROSES STATUS ORDER OLEH PURCHASING ADMIN */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Proses Status Order</h3>
                  <p className="text-[11px] text-slate-500">{selectedPO.orderNumber} • {selectedPO.outletName || selectedPO.originOutlet || 'Outlet Utama'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPO(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProcessPO} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">Daftar Item:</span>
                <ul className="text-slate-700 space-y-0.5">
                  {selectedPO.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>• {i.itemName}</span>
                      <strong>{i.requestedQty || i.qty || 0} {i.unit}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Update Status Order</label>
                <select
                  value={processStatus}
                  onChange={(e) => setProcessStatus(e.target.value as PurchasingStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="Menunggu Approval">Menunggu Approval (Pending Review)</option>
                  <option value="Diproses Purchasing">Diproses Purchasing (PO dibuat ke Supplier)</option>
                  <option value="Barang Dikirim">Barang Dikirim (Dalam Perjalanan ke Outlet)</option>
                  <option value="Selesai">Selesai (Diterima Lengkap)</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supplier Pemenuhan</label>
                <select
                  value={assignedSupplier}
                  onChange={(e) => setAssignedSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {(suppliers || []).map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Purchasing / Resi Pengiriman</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Sudah di-order ke supplier, estimasi pengiriman tiba besok jam 10 pagi."
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPO(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus PO (Manager) */}
      {deletingPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-black text-slate-900">Batalkan / Hapus PO</h3>
            </div>
            <div className="mt-3 text-xs text-slate-600 space-y-2">
              <p>
                Yakin ingin menghapus dokumen purchase order <strong>{deletingPO.orderNumber}</strong> untuk cabang{' '}
                <strong>{deletingPO.outletName || deletingPO.originOutlet}</strong>?
              </p>
              <p className="text-[11px] text-amber-700">
                Tindakan ini untuk mengoreksi kesalahan input staf.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4 text-xs">
              <button
                type="button"
                onClick={() => setDeletingPO(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePurchasingOrder(deletingPO.id);
                  setDeletingPO(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs"
              >
                Ya, Hapus PO
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
