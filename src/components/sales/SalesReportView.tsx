import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { DailySalesItemSold, DailySalesRecord } from '../../types';
import { exportToExcel } from '../../utils/excelExport';
import { safeStorage } from '../../utils/safeStorage';
import { SalesAnalyticsTab } from './SalesAnalyticsTab';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  User, 
  DollarSign, 
  Sparkles, 
  AlertCircle,
  TrendingUp,
  Pencil,
  AlertTriangle,
  X,
  FileSpreadsheet,
  BarChart3,
  List,
  Clock,
  CalendarDays
} from 'lucide-react';
import { PosClosingModal, ClosingMode } from './PosClosingModal';

export const SalesReportView: React.FC = () => {
  const { 
    sales, 
    menuItems, 
    rawItems, 
    addDailySalesRecord, 
    updateDailySalesRecord, 
    deleteDailySalesRecord, 
    currentUser, 
    formatRupiah,
    currentOutlet
  } = useResto();

  const isMasterOrManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const [mainSalesTab, setMainSalesTabState] = useState<'shifts' | 'analytics'>(() => {
    try {
      const saved = safeStorage.getItem('resto_sales_maintab');
      if (saved) return saved as any;
    } catch {}
    return 'shifts';
  });

  const setMainSalesTab = (tab: 'shifts' | 'analytics') => {
    setMainSalesTabState(tab);
    try {
      safeStorage.setItem('resto_sales_maintab', tab);
    } catch {}
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingModalMode, setClosingModalMode] = useState<ClosingMode>('shift');
  const [shift, setShift] = useState<'Shift Pagi (Lunch)' | 'Shift Malam (Dinner)' | 'Full Day'>('Shift Malam (Dinner)');
  const [salesDate, setSalesDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Date Filtering State for Shift Reports
  const [dateFilterType, setDateFilterType] = useState<'all' | 'today' | 'yesterday' | '7days' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filtered sales records based on date
  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredSales = sales.filter(s => {
    if (dateFilterType === 'all') return true;
    if (dateFilterType === 'today') return s.date === todayStr;
    if (dateFilterType === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return s.date === y.toISOString().slice(0, 10);
    }
    if (dateFilterType === '7days') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      return s.date >= d7.toISOString().slice(0, 10) && s.date <= todayStr;
    }
    if (dateFilterType === 'this_month') {
      return s.date.startsWith(todayStr.slice(0, 7));
    }
    if (dateFilterType === 'custom') {
      if (customStartDate && s.date < customStartDate) return false;
      if (customEndDate && s.date > customEndDate) return false;
      return true;
    }
    return true;
  });

  // Edit State
  const [editingSale, setEditingSale] = useState<DailySalesRecord | null>(null);
  const [editShift, setEditShift] = useState<'Shift Pagi (Lunch)' | 'Shift Malam (Dinner)' | 'Full Day'>('Shift Malam (Dinner)');
  const [editSalesDate, setEditSalesDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItemsSoldList, setEditItemsSoldList] = useState<{ menuItemId: string; qty: number }[]>([]);

  // Delete State
  const [deletingSale, setDeletingSale] = useState<DailySalesRecord | null>(null);

  // Items sold cart for the report
  const [itemsSoldList, setItemsSoldList] = useState<{ menuItemId: string; qty: number }[]>([]);

  // Calculate live totals for the form
  const preparedItemsSold: DailySalesItemSold[] = itemsSoldList.map(item => {
    const menu = menuItems.find(m => m.id === item.menuItemId);
    const sellingPrice = menu ? menu.sellingPrice : 0;
    const hppPerPortion = menu ? menu.totalHPP : 0;
    const subtotal = item.qty * sellingPrice;
    const totalHpp = item.qty * hppPerPortion;

    return {
      menuItemId: item.menuItemId,
      menuItemName: menu ? menu.name : 'Unknown',
      qtySold: item.qty,
      sellingPrice,
      subtotal,
      hppPerPortion,
      totalHpp,
    };
  });

  const totalRevenue = preparedItemsSold.reduce((sum, i) => sum + i.subtotal, 0);
  const totalHPP = preparedItemsSold.reduce((sum, i) => sum + i.totalHpp, 0);
  const grossProfit = totalRevenue - totalHPP;
  const foodCostRatio = totalRevenue > 0 ? ((totalHPP / totalRevenue) * 100).toFixed(1) : '0.0';

  // Preview ingredients to be depleted
  const ingredientsDepletionPreview: { itemId: string; itemName: string; totalUsed: number; unit: string }[] = [];
  preparedItemsSold.forEach(sold => {
    const menu = menuItems.find(m => m.id === sold.menuItemId);
    if (menu && menu.recipes) {
      menu.recipes.forEach(r => {
        const used = r.amount * sold.qtySold;
        const existing = ingredientsDepletionPreview.find(e => e.itemId === r.itemId);
        if (existing) {
          existing.totalUsed += used;
        } else {
          ingredientsDepletionPreview.push({
            itemId: r.itemId,
            itemName: r.itemName,
            totalUsed: used,
            unit: r.unit,
          });
        }
      });
    }
  });

  // Add or increment item in form
  const handleToggleMenu = (menuId: string, delta: number = 1) => {
    const existing = itemsSoldList.find(i => i.menuItemId === menuId);
    if (existing) {
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        setItemsSoldList(itemsSoldList.filter(i => i.menuItemId !== menuId));
      } else {
        setItemsSoldList(itemsSoldList.map(i => i.menuItemId === menuId ? { ...i, qty: newQty } : i));
      }
    } else if (delta > 0) {
      setItemsSoldList([...itemsSoldList, { menuItemId: menuId, qty: delta }]);
    }
  };

  const handleSetDirectQty = (menuId: string, qtyValue: number) => {
    if (qtyValue <= 0) {
      setItemsSoldList(itemsSoldList.filter(i => i.menuItemId !== menuId));
    } else {
      const existing = itemsSoldList.find(i => i.menuItemId === menuId);
      if (existing) {
        setItemsSoldList(itemsSoldList.map(i => i.menuItemId === menuId ? { ...i, qty: qtyValue } : i));
      } else {
        setItemsSoldList([...itemsSoldList, { menuItemId: menuId, qty: qtyValue }]);
      }
    }
  };

  const handleSubmitSales = (e: React.FormEvent) => {
    e.preventDefault();
    if (preparedItemsSold.length === 0) {
      alert('Pilih minimal 1 menu yang terjual dan tentukan jumlah porsinya!');
      return;
    }

    addDailySalesRecord({
      date: salesDate,
      shift,
      inputBy: currentUser.name,
      role: currentUser.role,
      itemsSold: preparedItemsSold,
      totalRevenue,
      totalHPP,
      notes: notes.trim() || `Laporan Penjualan ${shift}`,
    });

    setShowAddModal(false);
    setItemsSoldList([]);
    setNotes('');
  };

  // Manager Edit Handlers
  const handleOpenEdit = (sale: DailySalesRecord) => {
    setEditingSale(sale);
    setEditShift(sale.shift);
    setEditSalesDate(sale.date);
    setEditNotes(sale.notes);
    setEditItemsSoldList(sale.itemsSold.map(i => ({ menuItemId: i.menuItemId, qty: i.qtySold })));
  };

  const handleToggleEditMenu = (menuId: string, delta: number = 1) => {
    const existing = editItemsSoldList.find(i => i.menuItemId === menuId);
    if (existing) {
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        setEditItemsSoldList(editItemsSoldList.filter(i => i.menuItemId !== menuId));
      } else {
        setEditItemsSoldList(editItemsSoldList.map(i => i.menuItemId === menuId ? { ...i, qty: newQty } : i));
      }
    } else if (delta > 0) {
      setEditItemsSoldList([...editItemsSoldList, { menuItemId: menuId, qty: delta }]);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    if (editItemsSoldList.length === 0) {
      alert('Pilih minimal 1 menu yang terjual!');
      return;
    }

    const updatedPreparedSold: DailySalesItemSold[] = editItemsSoldList.map(item => {
      const menu = menuItems.find(m => m.id === item.menuItemId);
      const sellingPrice = menu ? menu.sellingPrice : 0;
      const hppPerPortion = menu ? menu.totalHPP : 0;
      return {
        menuItemId: item.menuItemId,
        menuItemName: menu ? menu.name : 'Unknown',
        qtySold: item.qty,
        sellingPrice,
        subtotal: item.qty * sellingPrice,
        hppPerPortion,
        totalHpp: item.qty * hppPerPortion,
      };
    });

    const newRev = updatedPreparedSold.reduce((s, i) => s + i.subtotal, 0);
    const newHpp = updatedPreparedSold.reduce((s, i) => s + i.totalHpp, 0);

    const res = updateDailySalesRecord(editingSale.id, {
      date: editSalesDate,
      shift: editShift,
      notes: editNotes.trim(),
      itemsSold: updatedPreparedSold,
      totalRevenue: newRev,
      totalHPP: newHpp,
    });

    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setEditingSale(null);
      setTimeout(() => setActionFeedback(null), 3500);
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingSale) return;
    const res = deleteDailySalesRecord(deletingSale.id);
    if (res.success) {
      setActionFeedback({ type: 'success', message: res.message });
      setDeletingSale(null);
      setTimeout(() => setActionFeedback(null), 3500);
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
  };

  const handleExportShiftsExcel = () => {
    const headers = [
      'ID Laporan',
      'Tanggal',
      'Shift Operasional',
      'Diinput Oleh',
      'Peran (Role)',
      'Total Menu Terjual',
      'Total Omset (Rp)',
      'Total HPP Food Cost (Rp)',
      'Gross Profit (Rp)',
      'Food Cost Ratio (%)',
      'Catatan Staff'
    ];

    const rows = filteredSales.map(s => {
      const grossProfit = s.totalRevenue - s.totalHPP;
      const fcRatio = s.totalRevenue > 0 ? Number(((s.totalHPP / s.totalRevenue) * 100).toFixed(1)) : 0;
      const totalQty = s.itemsSold.reduce((sum, i) => sum + i.qtySold, 0);
      return [
        s.id,
        s.date,
        s.shift,
        s.inputBy,
        s.role,
        totalQty,
        s.totalRevenue,
        s.totalHPP,
        grossProfit,
        fcRatio,
        s.notes || '-'
      ];
    });

    const filterLabel = dateFilterType === 'all' ? 'Semua_Tanggal' : `Filter_${dateFilterType}`;
    exportToExcel(
      `Laporan_Shift_Penjualan_${currentOutlet.name}_${filterLabel}`, 
      `LAPORAN PENJUALAN SHIFT HARIAN (${filterLabel}) - ${currentOutlet.name}`, 
      headers, 
      rows
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Laporan Penjualan Menu & Pemotongan Stok Otomatis</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Auto Recipe Deduction
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dapat diinput oleh semua staff operasional atau kasir. Stok bahan baku akan otomatis terpotong presisi per gramasi resep.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setClosingModalMode('shift');
              setShowClosingModal(true);
            }}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all border border-amber-600"
          >
            <Clock className="w-4 h-4 text-slate-950" />
            <span>Rekap End Shift</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setClosingModalMode('day');
              setShowClosingModal(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all border border-indigo-700"
          >
            <CalendarDays className="w-4 h-4 text-indigo-200" />
            <span>Rekap End of Day</span>
          </button>

          <button
            onClick={handleExportShiftsExcel}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Export Shift ke Excel</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Input Penjualan Shift Baru</span>
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex rounded-2xl bg-white p-1.5 border border-slate-200 shadow-xs max-w-xl">
        <button
          onClick={() => setMainSalesTab('shifts')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            mainSalesTab === 'shifts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Riwayat Penjualan Shift ({sales.length})</span>
        </button>

        <button
          onClick={() => setMainSalesTab('analytics')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            mainSalesTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span>Analisis Menu, Metode Bayar & Jam Sibuk</span>
        </button>
      </div>

      {/* Tab 2 Content: Sales Analytics (Best Sellers, Slow Moving, Payment Methods, Peak Hours & Days) */}
      {mainSalesTab === 'analytics' && (
        <SalesAnalyticsTab />
      )}

      {/* Tab 1 Content: Shift Reports List */}
      {mainSalesTab === 'shifts' && (
        <div className="space-y-6">
          {/* Date Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Filter Tanggal Laporan Penjualan:</span>
              </div>
              <div className="text-xs font-semibold text-slate-500">
                Menampilkan <strong className="text-slate-900 font-extrabold">{filteredSales.length}</strong> dari {sales.length} laporan shift
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDateFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateFilterType === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Tanggal
              </button>
              <button
                type="button"
                onClick={() => setDateFilterType('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateFilterType === 'today'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setDateFilterType('yesterday')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateFilterType === 'yesterday'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Kemarin
              </button>
              <button
                type="button"
                onClick={() => setDateFilterType('7days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateFilterType === '7days'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => setDateFilterType('this_month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateFilterType === 'this_month'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setDateFilterType('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  dateFilterType === 'custom'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Pilih Rentang Tanggal</span>
              </button>
            </div>

            {dateFilterType === 'custom' && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Dari:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Sampai:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    Reset Tanggal
                  </button>
                )}
              </div>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Total Omset Penjualan Terdata</span>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatRupiah(filteredSales.reduce((sum, s) => sum + s.totalRevenue, 0))}
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                Dari {filteredSales.length} laporan shift harian terpilih
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Total HPP Penjualan (Food Cost)</span>
              <div className="text-2xl font-black text-blue-600 mt-2">
                {formatRupiah(filteredSales.reduce((sum, s) => sum + s.totalHPP, 0))}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Berdasarkan takaran resep aktual
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Gross Profit (Laba Kotor)</span>
              <div className="text-2xl font-black text-emerald-700 mt-2">
                {formatRupiah(
                  filteredSales.reduce((sum, s) => sum + s.totalRevenue, 0) - 
                  filteredSales.reduce((sum, s) => sum + s.totalHPP, 0)
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Margin kotor sebelum biaya operasional
              </p>
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

          {/* History of Sales Reports */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Riwayat Laporan Penjualan Staff ({filteredSales.length})
            </h3>
            
            {filteredSales.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-sm text-slate-700">Tidak ada laporan penjualan pada tanggal yang dipilih</p>
                <p className="text-xs mt-1">Coba sesuaikan filter tanggal atau input shift penjualan baru.</p>
              </div>
            ) : (
              filteredSales.map(sale => (
              <div key={sale.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{sale.shift}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {sale.date}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Diinput oleh: <strong className="text-slate-700">{sale.inputBy}</strong> ({sale.role})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Total Omset</span>
                        <span className="text-base font-black text-slate-900">{formatRupiah(sale.totalRevenue)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Total HPP</span>
                        <span className="text-base font-bold text-blue-600">{formatRupiah(sale.totalHPP)}</span>
                      </div>
                    </div>

                    {isMasterOrManager && (
                      <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                        <button
                          onClick={() => handleOpenEdit(sale)}
                          className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1 transition-all"
                          title="Koreksi Inputan Staff (Manager / Master Admin)"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Koreksi</span>
                        </button>
                        <button
                          onClick={() => setDeletingSale(sale)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all"
                          title="Hapus Laporan & Kembalikan Stok Resep (Manager / Master Admin)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Menu Items Sold List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                  {sale.itemsSold.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block truncate">{item.menuItemName}</span>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          {item.qtySold} porsi x {formatRupiah(item.sellingPrice)}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-700">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span><strong>Catatan:</strong> {sale.notes || 'Penjualan normal.'}</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Stok bahan resep telah terpotong otomatis
                  </span>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* Modal Input Penjualan Harian */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Form Laporan Penjualan Menu</h3>
                  <p className="text-xs text-slate-500">Stok bahan baku akan otomatis terpotong berdasarkan resep</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitSales} className="space-y-4 mt-4 text-xs">
              
              {/* Shift & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Shift Kerja</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Shift Pagi (Lunch)">Shift Pagi (Lunch)</option>
                    <option value="Shift Malam (Dinner)">Shift Malam (Dinner)</option>
                    <option value="Full Day">Full Day (Akumulasi Harian)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={salesDate}
                    onChange={(e) => setSalesDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Menu Selector Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">Pilih Menu & Porsi Terjual</span>
                  <span className="text-[11px] text-slate-400">Gunakan tombol (+ / -) atau isi angka porsi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {menuItems.map(menu => {
                    const currentCart = itemsSoldList.find(i => i.menuItemId === menu.id);
                    const qty = currentCart ? currentCart.qty : 0;

                    return (
                      <div
                        key={menu.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                          qty > 0 
                            ? 'bg-emerald-50/70 border-emerald-300' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="font-bold text-slate-900 truncate">{menu.name}</div>
                          <div className="text-[11px] text-slate-500 font-semibold">
                            {formatRupiah(menu.sellingPrice)} <span className="text-slate-400 font-normal">• HPP: {formatRupiah(menu.totalHPP)}</span>
                          </div>
                        </div>

                        {/* Counter Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleMenu(menu.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-black text-slate-700 flex items-center justify-center text-sm shadow-xs"
                          >
                            -
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => handleSetDirectQty(menu.id, parseInt(e.target.value) || 0)}
                            className="w-12 py-1 text-center font-black text-sm bg-white border border-slate-300 rounded-lg"
                          />

                          <button
                            type="button"
                            onClick={() => handleToggleMenu(menu.id, 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-black text-white flex items-center justify-center text-sm shadow-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Automatic Ingredient Depletion Preview */}
              {ingredientsDepletionPreview.length > 0 && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      Otomatis Memotong Stok Bahan Baku Berikut:
                    </span>
                    <span className="text-[10px] font-bold text-blue-700">
                      {ingredientsDepletionPreview.length} Bahan Terkena Dampak
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    {ingredientsDepletionPreview.map((ing, i) => (
                      <div key={i} className="bg-white/80 p-2 rounded-lg border border-blue-100">
                        <span className="font-bold text-slate-800 block truncate">{ing.itemName}</span>
                        <span className="font-black text-red-600">
                          -{ing.totalUsed.toFixed(2)} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Calculation Summary */}
              <div className="p-4 rounded-xl bg-slate-900 text-white grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Omset Penjualan</span>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">
                    {formatRupiah(totalRevenue)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimasi HPP (Food Cost)</span>
                  <div className="text-xl font-black text-amber-400 mt-0.5">
                    {formatRupiah(totalHPP)} <span className="text-xs font-normal text-slate-300">({foodCostRatio}%)</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross Profit Shift</span>
                  <div className="text-xl font-black text-white mt-0.5">
                    {formatRupiah(grossProfit)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Operasional Shift</label>
                <input
                  type="text"
                  placeholder="Contoh: Shift lancar, customer ramai jam 19.00 - 21.00."
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
                  disabled={preparedItemsSold.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  Simpan Laporan & Potong Stok Otomatis
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Edit / Koreksi Penjualan (Manager & Master Admin) */}
      {editingSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Koreksi Laporan Penjualan Staff</h3>
                  <p className="text-xs text-slate-500">Otoritas Manager / Master Admin • Rekonsiliasi resep otomatis</p>
                </div>
              </div>
              <button
                onClick={() => setEditingSale(null)}
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
                    Diinput oleh <strong>{editingSale.inputBy}</strong> ({editingSale.role}) untuk {editingSale.shift} ({editingSale.date}).
                    Perubahan porsi terjual akan otomatis menghitung selisih bahan resep dan menyesuaikan stok gudang secara akurat.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Shift Kerja</label>
                  <select
                    value={editShift}
                    onChange={(e) => setEditShift(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Shift Pagi (Lunch)">Shift Pagi (Lunch)</option>
                    <option value="Shift Malam (Dinner)">Shift Malam (Dinner)</option>
                    <option value="Full Day">Full Day</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={editSalesDate}
                    onChange={(e) => setEditSalesDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Menu Selection List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Koreksi Porsi Menu Terjual:</span>
                  <span className="text-[11px] text-slate-400">Gunakan (+ / -) untuk ubah porsi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {menuItems.map(menu => {
                    const currentCart = editItemsSoldList.find(i => i.menuItemId === menu.id);
                    const qty = currentCart ? currentCart.qty : 0;

                    return (
                      <div
                        key={menu.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          qty > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="font-bold text-slate-900 block truncate">{menu.name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold block">{formatRupiah(menu.sellingPrice)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleEditMenu(menu.id, -1)}
                            disabled={qty === 0}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold hover:bg-slate-100 disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-black text-slate-900">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleEditMenu(menu.id, 1)}
                            className="w-7 h-7 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Koreksi Manager</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Alasan koreksi porsi penjualan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editItemsSoldList.length === 0}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  Simpan Koreksi & Sinkronkan Stok Resep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Laporan Penjualan (Manager & Master Admin) */}
      {deletingSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Hapus Laporan Penjualan?</h3>
                <p className="text-xs text-slate-500">{deletingSale.shift} • {deletingSale.date}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1.5">
              <span className="font-bold block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Peringatan Rekonsiliasi Otomatis:
              </span>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Menghapus laporan ini akan <strong>mengembalikan / restore stok bahan baku</strong> resep yang sempat terpotong oleh sistem dari laporan ini ke gudang.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSale(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-xs text-slate-700"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs"
              >
                Ya, Hapus & Kembalikan Stok Resep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS Closing Modal */}
      <PosClosingModal
        isOpen={showClosingModal}
        onClose={() => setShowClosingModal(false)}
        initialMode={closingModalMode}
      />

    </div>
  );
};
