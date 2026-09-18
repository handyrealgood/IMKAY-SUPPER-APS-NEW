import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  FileSpreadsheet, 
  Clock, 
  Calendar, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Utensils, 
  CalendarDays, 
  Coins, 
  Coffee,
  Store,
  Layers,
  Percent,
  Check,
  Building,
  Send,
  History,
  Archive,
  FileText,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useResto } from '../../context/RestoContext';
import { TableOrder, ClosingReport } from '../../types';
import { printHtmlElementToPrinter } from '../../utils/printerUtils';

export type ClosingMode = 'shift' | 'day';

interface PosClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: ClosingMode;
}

export const PosClosingModal: React.FC<PosClosingModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'shift'
}) => {
  const { 
    branding, 
    currentUser, 
    tableOrders, 
    formatRupiah,
    taxServiceConfig,
    closingReports,
    submitClosingReport,
    deleteClosingReport
  } = useResto();

  // Active Main Tab: 'live' (Form & Live Calculator) or 'archive' (Riwayat Laporan Closing)
  const [activeModalTab, setActiveModalTab] = useState<'live' | 'archive'>('live');

  // Confirmation & Notes State for Submit
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [submittedSuccessMsg, setSubmittedSuccessMsg] = useState<string | null>(null);

  // Archive Filter State
  const [archiveDateFilter, setArchiveDateFilter] = useState<string>('');
  const [archiveTypeFilter, setArchiveTypeFilter] = useState<string>('all');
  const [selectedArchiveReport, setSelectedArchiveReport] = useState<ClosingReport | null>(null);

  // Mode state: 'shift' (End Shift) or 'day' (End of Day)
  const [closingMode, setClosingMode] = useState<ClosingMode>(initialMode);
  
  // View mode: 'dashboard' or 'receipt' (Thermal Preview)
  const [viewMode, setViewMode] = useState<'dashboard' | 'receipt'>('dashboard');

  // Thermal print paper size: '80mm' or '58mm'
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');

  // Date filter: default to today (or latest order date if today has none)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Shift filter for End Shift: 'all' | 'shift1' (Pagi) | 'shift2' (Malam)
  const currentHour = new Date().getHours();
  const defaultShift = currentHour < 15 ? 'shift1' : 'shift2';
  const [selectedShift, setSelectedShift] = useState<'all' | 'shift1' | 'shift2'>(defaultShift);

  // Cashier filter
  const [selectedCashier, setSelectedCashier] = useState<string>('all');

  // Menu Search & Category Filter
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Sync mode when initialMode prop changes on open
  React.useEffect(() => {
    if (isOpen) {
      setClosingMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Extract all unique dates available from tableOrders
  const availableDates = useMemo(() => {
    const datesSet = new Set(tableOrders.map(o => o.date));
    datesSet.add(todayStr);
    return Array.from(datesSet).sort().reverse();
  }, [tableOrders, todayStr]);

  // Extract all cashiers
  const availableCashiers = useMemo(() => {
    const cashiers = new Set<string>();
    tableOrders.forEach(o => {
      if (o.cashierName) cashiers.add(o.cashierName);
    });
    if (currentUser.name) cashiers.add(currentUser.name);
    return Array.from(cashiers).sort();
  }, [tableOrders, currentUser.name]);

  // Filter orders based on mode, date, shift, cashier
  const { filteredOrders, unpaidOrders } = useMemo(() => {
    // Filter by date
    const dateOrders = tableOrders.filter(o => o.date === selectedDate && !o.isCancelled);

    // Unpaid active orders for alert
    const unpaid = dateOrders.filter(o => o.paymentStatus === 'Belum Bayar');

    // Only paid orders are considered for closed sales
    let paid = dateOrders.filter(o => o.paymentStatus === 'Lunas');

    // If in Shift mode, filter by shift and cashier
    if (closingMode === 'shift') {
      if (selectedShift === 'shift1') {
        // Shift 1 / Pagi (06:00 - 15:00)
        paid = paid.filter(o => {
          const time = o.time || '12:00';
          return time >= '06:00' && time < '15:00';
        });
      } else if (selectedShift === 'shift2') {
        // Shift 2 / Malam (15:00 - 24:00)
        paid = paid.filter(o => {
          const time = o.time || '18:00';
          return time >= '15:00' || time < '06:00';
        });
      }

      if (selectedCashier !== 'all') {
        paid = paid.filter(o => o.cashierName === selectedCashier);
      }
    }

    return { filteredOrders: paid, unpaidOrders: unpaid };
  }, [tableOrders, selectedDate, closingMode, selectedShift, selectedCashier]);

  // Calculations for Financial & Operational Metrics
  const metrics = useMemo(() => {
    let grossSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalService = 0;
    let grandTotal = 0;
    let totalPax = 0;
    const occupiedTablesSet = new Set<string>();
    let dineInCount = 0;
    let takeAwayCount = 0;

    const paymentMap = new Map<string, { count: number; total: number }>();
    const soldMenuMap = new Map<string, {
      id: string;
      name: string;
      category: string;
      price: number;
      qty: number;
      subtotal: number;
    }>();

    filteredOrders.forEach(order => {
      // Gross sales
      const orderGross = order.subtotalAmount !== undefined 
        ? order.subtotalAmount 
        : (order.items || []).reduce((sum, it) => sum + (it.price * it.qty), 0);
      grossSales += orderGross;

      // Diskon
      const disc = order.discountAmount || 0;
      totalDiscount += disc;

      // Pajak & Service
      totalTax += order.taxAmount || 0;
      totalService += order.serviceAmount || 0;

      // Grand Total
      grandTotal += order.totalAmount || (orderGross - disc + (order.taxAmount || 0) + (order.serviceAmount || 0));

      // Pax & Table
      totalPax += order.pax || 1;
      if (order.orderType === 'Dine In') {
        dineInCount += 1;
        if (order.tableNumber && order.tableNumber !== 'Take Away') {
          occupiedTablesSet.add(order.tableNumber);
        }
      } else {
        takeAwayCount += 1;
      }

      // Payment method grouping
      const method = order.paymentMethod || 'Tunai (Cash)';
      const existingPay = paymentMap.get(method) || { count: 0, total: 0 };
      paymentMap.set(method, {
        count: existingPay.count + 1,
        total: existingPay.total + order.totalAmount
      });

      // Sold menu items
      (order.items || []).forEach(item => {
        const key = item.menuItemId || item.menuItemName;
        const existingItem = soldMenuMap.get(key);
        if (existingItem) {
          existingItem.qty += item.qty;
          existingItem.subtotal += item.subtotal || (item.price * item.qty);
        } else {
          soldMenuMap.set(key, {
            id: item.menuItemId || key,
            name: item.menuItemName,
            category: item.category || 'Makanan Utama',
            price: item.price,
            qty: item.qty,
            subtotal: item.subtotal || (item.price * item.qty)
          });
        }
      });
    });

    const nettSales = Math.max(0, grossSales - totalDiscount);
    const totalBills = filteredOrders.length;
    const occupiedTablesCount = occupiedTablesSet.size;
    const avgSpendPerPax = totalPax > 0 ? Math.round(grandTotal / totalPax) : 0;
    const avgBillPerOrder = totalBills > 0 ? Math.round(grandTotal / totalBills) : 0;

    // Convert payment map to array with percentages
    const paymentList = Array.from(paymentMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
      percent: grandTotal > 0 ? Number(((data.total / grandTotal) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.total - a.total);

    // Tunai specifically for cash drawer
    const cashPayment = paymentList.find(p => p.method.toLowerCase().includes('tunai') || p.method.toLowerCase().includes('cash'));
    const totalCash = cashPayment ? cashPayment.total : 0;

    // Sold items list sorted by qty
    const soldList = Array.from(soldMenuMap.values()).sort((a, b) => b.qty - a.qty);
    const totalPortionsSold = soldList.reduce((sum, it) => sum + it.qty, 0);

    return {
      grossSales,
      totalDiscount,
      nettSales,
      totalTax,
      totalService,
      grandTotal,
      totalPax,
      totalBills,
      dineInCount,
      takeAwayCount,
      occupiedTablesCount,
      avgSpendPerPax,
      avgBillPerOrder,
      paymentList,
      totalCash,
      soldList,
      totalPortionsSold
    };
  }, [filteredOrders]);

  // Categories list for sold menu filtering
  const soldCategories = useMemo(() => {
    const cats = new Set<string>();
    metrics.soldList.forEach(i => cats.add(i.category));
    return ['all', ...Array.from(cats)];
  }, [metrics.soldList]);

  // Filtered sold items by category & search
  const displayedSoldItems = useMemo(() => {
    return metrics.soldList.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                          item.category.toLowerCase().includes(menuSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [metrics.soldList, selectedCategory, menuSearch]);

  // Filtered archived reports
  const filteredArchivedReports = useMemo(() => {
    return closingReports.filter(r => {
      const matchDate = !archiveDateFilter || r.date === archiveDateFilter;
      const matchType = archiveTypeFilter === 'all' || r.closingType === archiveTypeFilter;
      return matchDate && matchType;
    });
  }, [closingReports, archiveDateFilter, archiveTypeFilter]);

  // Shift label formatter
  const getShiftLabel = () => {
    if (closingMode === 'day') return 'Full Day (Tutup Hari Kasir)';
    if (selectedShift === 'shift1') return 'Shift 1 / Pagi (Lunch: 06:00 - 15:00)';
    if (selectedShift === 'shift2') return 'Shift 2 / Malam (Dinner: 15:00 - 24:00)';
    return 'Semua Shift Hari Ini';
  };

  // Date label formatter
  const formattedDate = new Date(selectedDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const printTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Handle direct print
  const handlePrint = async () => {
    const success = await printHtmlElementToPrinter(
      'pos-closing-thermal-slip', 
      '80mm', 
      `Rekap_${closingMode === 'shift' ? 'Shift' : 'EndOfDay'}_${selectedDate}`
    );
    if (!success) {
      window.print();
    }
  };

  // Handle Export to Excel
  const handleExportExcel = () => {
    const modeLabel = closingMode === 'shift' ? 'EndShift' : 'EndOfDay';
    const shiftName = closingMode === 'shift' 
      ? (selectedShift === 'shift1' ? 'Shift_Pagi' : selectedShift === 'shift2' ? 'Shift_Malam' : 'Semua_Shift')
      : 'FullDay';
    const filename = `Rekap_${modeLabel}_${branding.outletName.replace(/\s+/g, '_')}_${selectedDate}_${shiftName}.xlsx`;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Ringkasan Rekap Penjualan
    const summaryData = [
      [`REKAPITULASI PENJUALAN ${closingMode === 'shift' ? 'TUTUP SHIFT KASIR (END SHIFT)' : 'TUTUP HARI RESTORAN (END OF DAY)'}`],
      [`Nama Restoran / Outlet`, branding.outletName],
      [`Alamat`, branding.outletAddress || '-'],
      [`Kota / Telepon`, `${branding.outletCity || '-'} | Telp: ${branding.outletPhone || '-'}`],
      [`Tanggal Penjualan`, `${selectedDate} (${formattedDate})`],
      [`Periode / Shift`, getShiftLabel()],
      [`Kasir / Staff Pencetak`, `${currentUser.name} (${currentUser.role})`],
      [`Waktu Generate Laporan`, `${new Date().toLocaleString('id-ID')}`],
      [],
      ['=== RINGKASAN KEUANGAN & OPERASIONAL ==='],
      ['Metrik Operasional & Penjualan', 'Nilai', 'Satuan / Keterangan'],
      ['Gross Sales (Total Kotor Sebelum Diskon)', metrics.grossSales, 'Rupiah (Subtotal Pesanan)'],
      ['Total Diskon / Promo', metrics.totalDiscount, 'Rupiah (Potongan Harga)'],
      ['Nett Sales (Penjualan Bersih)', metrics.nettSales, 'Rupiah (Gross - Diskon)'],
      ['Pajak Restoran (PB1)', metrics.totalTax, `Rupiah (${taxServiceConfig.taxPercent}%)`],
      ['Biaya Layanan (Service Charge)', metrics.totalService, `Rupiah (${taxServiceConfig.servicePercent}%)`],
      ['GRAND TOTAL OMSET / PENJUALAN', metrics.grandTotal, 'Rupiah (Total Tagihan Lunas)'],
      [],
      ['Total Tamu Dilayani (Pax)', metrics.totalPax, 'Orang (Pax)'],
      ['Jumlah Meja Terisi (Dine In)', metrics.occupiedTablesCount, 'Meja Unik'],
      ['Total Transaksi Selesai (Bills)', metrics.totalBills, 'Nota / Bills'],
      ['Transaksi Makan di Tempat (Dine In)', metrics.dineInCount, 'Bills'],
      ['Transaksi Dibungkus (Take Away)', metrics.takeAwayCount, 'Bills'],
      ['Rata-rata Belanja per Tamu (Avg Spend/Pax)', metrics.avgSpendPerPax, 'Rupiah / Pax'],
      ['Rata-rata Nilai per Transaksi (Avg/Bill)', metrics.avgBillPerOrder, 'Rupiah / Bill'],
      [],
      ['=== REKAP METODE PEMBAYARAN ==='],
      ['No', 'Metode Pembayaran', 'Jumlah Transaksi', 'Total Nominal (Rp)', 'Kontribusi (%)'],
      ...metrics.paymentList.map((p, idx) => [
        idx + 1,
        p.method,
        p.count,
        p.total,
        `${p.percent}%`
      ]),
      ['TOTAL PEMBAYARAN DITERIMA', '', metrics.totalBills, metrics.grandTotal, '100%'],
      [],
      ['Kas Tunai Fisik Kasir (Cash Drawer)', '', '', metrics.totalCash, 'Tunai']
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 45 },
      { wch: 25 },
      { wch: 35 },
      { wch: 20 },
      { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Ringkasan_Rekap');

    // Sheet 2: Detail Menu Terjual
    const soldMenuData = [
      [`DAFTAR DETAIL MENU TERJUAL - ${closingMode === 'shift' ? 'END SHIFT' : 'END OF DAY'}`],
      [`Outlet: ${branding.outletName} | Tanggal: ${selectedDate} | Shift: ${getShiftLabel()}`],
      [],
      ['No', 'ID / Kode Menu', 'Nama Menu Restoran', 'Kategori', 'Harga Satuan (Rp)', 'Porsi Terjual (Qty)', 'Subtotal Omset (Rp)', 'Kontribusi (%)'],
      ...metrics.soldList.map((item, idx) => {
        const contrib = metrics.grandTotal > 0 ? ((item.subtotal / metrics.grandTotal) * 100).toFixed(1) : '0';
        return [
          idx + 1,
          item.id,
          item.name,
          item.category,
          item.price,
          item.qty,
          item.subtotal,
          `${contrib}%`
        ];
      }),
      [],
      ['TOTAL KESELURUHAN', '', '', '', '', metrics.totalPortionsSold, metrics.grossSales, '100%']
    ];

    const wsSoldMenu = XLSX.utils.aoa_to_sheet(soldMenuData);
    wsSoldMenu['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 35 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsSoldMenu, 'Menu_Terjual');

    XLSX.writeFile(workbook, filename);
  };

  // Submit and finalize official closing report
  const handleExecuteSubmitClosing = () => {
    const itemsSold = metrics.soldList.map(item => ({
      menuId: item.id,
      menuName: item.name,
      category: item.category,
      qty: item.qty,
      price: item.price,
      subtotal: item.subtotal
    }));

    const paymentBreakdown = metrics.paymentList.map(p => ({
      method: p.method,
      total: p.total,
      count: p.count,
      percent: p.percent
    }));

    const orderIds = filteredOrders.map(o => o.id);

    const res = submitClosingReport({
      closingType: closingMode,
      date: selectedDate,
      shiftName: getShiftLabel(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      cashierRole: currentUser.role,
      grossSales: metrics.grossSales,
      totalDiscount: metrics.totalDiscount,
      nettSales: metrics.nettSales,
      totalTax: metrics.totalTax,
      totalService: metrics.totalService,
      grandTotal: metrics.grandTotal,
      totalBills: metrics.totalBills,
      totalPax: metrics.totalPax,
      occupiedTablesCount: metrics.occupiedTablesCount,
      totalCash: metrics.totalCash,
      totalPortionsSold: metrics.totalPortionsSold,
      dineInCount: metrics.dineInCount,
      takeAwayCount: metrics.takeAwayCount,
      paymentBreakdown,
      itemsSold,
      orderIds,
      notes: closingNotes.trim()
    });

    if (res.success) {
      setShowSubmitConfirm(false);
      setClosingNotes('');
      setSubmittedSuccessMsg(`Laporan Closing resmi berhasil dieksekusi dan disimpan! ID: ${res.report?.id || 'CLS-OK'}`);
    }
  };

  // Export historical archived report to Excel
  const handleExportArchivedExcel = (report: ClosingReport) => {
    const wb = XLSX.utils.book_new();
    const submitTimeStr = report.timestamp 
      ? new Date(report.timestamp).toLocaleString('id-ID')
      : (report.createdAt || report.time || '-');
    const summaryData = [
      [`ARSIP LAPORAN PENJUALAN KASIR - ${report.closingType === 'shift' ? 'END SHIFT' : 'END OF DAY'}`],
      [`ID Laporan`, report.id],
      [`Nama Restoran`, branding.outletName],
      [`Tanggal Penjualan`, report.date],
      [`Shift Kerja`, report.shiftName],
      [`Kasir Bertugas`, `${report.cashierName} (${report.cashierRole || 'Staff'})`],
      [`Waktu Submit Eksekusi`, submitTimeStr],
      [],
      ['Gross Sales', report.grossSales],
      ['Total Diskon', report.totalDiscount],
      ['Nett Sales', report.nettSales],
      ['Pajak Restoran', report.totalTax],
      ['Biaya Layanan', report.totalService],
      ['Grand Total Omset', report.grandTotal],
      ['Total Pax', report.totalPax],
      ['Meja Terisi', report.occupiedTablesCount],
      ['Total Bills', report.totalBills],
      ['Kas Tunai Fisik', report.totalCash],
      ['Catatan Closing', report.notes || '-'],
      [],
      ['=== REKAP METODE PEMBAYARAN ==='],
      ['Metode', 'Transaksi', 'Nominal', 'Kontribusi'],
      ...(report.paymentBreakdown || []).map(p => [p.method, p.count, p.total, `${p.percent}%`]),
      [],
      ['=== MENU TERJUAL ==='],
      ['Nama Menu', 'Kategori', 'Qty', 'Harga', 'Subtotal'],
      ...(report.itemsSold || []).map(i => [i.menuName, i.category, i.qty, i.price, i.subtotal])
    ];
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Arsip_Closing');
    XLSX.writeFile(wb, `Arsip_${report.id}_${report.date}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 1. ON-SCREEN MODAL INTERFACE */}
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print">
        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
          
          {/* TOP MODAL HEADER */}
          <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  closingMode === 'shift' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                }`}>
                  {closingMode === 'shift' ? 'Tutup Shift Kasir' : 'Tutup Kasir Harian'}
                </span>
                <span className="text-xs font-bold text-slate-400">•</span>
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  {branding.outletName}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {closingMode === 'shift' ? 'Laporan Rekap End Shift' : 'Laporan Rekap End of Day'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {closingMode === 'shift' 
                  ? 'Audit penjualan per giliran tugas kasir, serah terima modal, dan rekonsiliasi kas.' 
                  : 'Rekapitulasi omset harian menyeluruh (Full Day) untuk audit operasional restoran.'}
              </p>

              {/* Tab Selector: Eksekusi Live vs Riwayat Arsip Laporan */}
              <div className="flex items-center gap-1.5 mt-2.5 bg-slate-100 p-1 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('live')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeModalTab === 'live' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📊 Eksekusi Closing (Live)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('archive')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeModalTab === 'archive' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Riwayat & Arsip Laporan ({closingReports.length})</span>
                </button>
              </div>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Official Submit Closing Button */}
              {activeModalTab === 'live' && (
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                  title="Eksekusi dan rekam resmi laporan closing ini ke arsip"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Closing</span>
                </button>
              )}

              {/* Toggle Closing Mode: End Shift vs End of Day */}
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
                <button
                  type="button"
                  onClick={() => setClosingMode('shift')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                    closingMode === 'shift' 
                      ? 'bg-amber-500 text-slate-950 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>End Shift</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClosingMode('day')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                    closingMode === 'day' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>End of Day</span>
                </button>
              </div>

              {/* View Switcher: Dashboard vs Struk Thermal */}
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
                <button
                  type="button"
                  onClick={() => setViewMode('dashboard')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'dashboard' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                  title="Tampilan Dashboard"
                >
                  Ringkasan
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('receipt')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'receipt' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                  title="Tampilan Struk Kasir Thermal"
                >
                  <Printer className="w-3 h-3 text-slate-500" />
                  Struk Kasir
                </button>
              </div>

              {/* Export to Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                title="Ekspor data lengkap ke file Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Export Excel</span>
              </button>

              {/* Print to Cashier Thermal Printer */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                title="Cetak struk ke printer thermal kasir (80mm/58mm)"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Cetak Kasir</span>
              </button>

              {/* Close Modal Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* FILTER & CONTROLS BAR */}
          {activeModalTab === 'live' ? (
            <div className="bg-slate-50 px-5 py-3 sm:px-7 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Date Selector */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-700">Tanggal:</span>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                  >
                    {availableDates.map(d => (
                      <option key={d} value={d}>
                        {d} {d === todayStr ? '(Hari Ini)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shift Filter (Active only in End Shift mode) */}
                {closingMode === 'shift' && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-700">Pilih Shift:</span>
                    <select
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(e.target.value as any)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="shift1">Shift 1 / Pagi (06:00 - 15:00)</option>
                      <option value="shift2">Shift 2 / Malam (15:00 - 24:00)</option>
                      <option value="all">Semua Shift Hari Ini</option>
                    </select>
                  </div>
                )}

                {/* Cashier Filter (End Shift) */}
                {closingMode === 'shift' && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-700">Kasir:</span>
                    <select
                      value={selectedCashier}
                      onChange={(e) => setSelectedCashier(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="all">Semua Kasir</option>
                      {availableCashiers.map(c => (
                        <option key={c} value={c}>
                          {c} {c === currentUser.name ? '(Saya)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Unpaid order alert badge */}
              {unpaidOrders.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Peringatan: {unpaidOrders.length} meja aktif belum lunas!</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 px-5 py-3 sm:px-7 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Archive Date Filter */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-700">Filter Tanggal:</span>
                  <input
                    type="date"
                    value={archiveDateFilter}
                    onChange={(e) => setArchiveDateFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                  {archiveDateFilter && (
                    <button
                      type="button"
                      onClick={() => setArchiveDateFilter('')}
                      className="text-slate-400 hover:text-slate-700 text-xs underline ml-1"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Archive Type Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700">Tipe Closing:</span>
                  <select
                    value={archiveTypeFilter}
                    onChange={(e) => setArchiveTypeFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="all">Semua (End Shift & Day)</option>
                    <option value="shift">Hanya End Shift</option>
                    <option value="day">Hanya End of Day</option>
                  </select>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-600">
                Total Tersimpan: <span className="text-amber-600 font-black">{filteredArchivedReports.length} Laporan</span>
              </div>
            </div>
          )}

          {/* SUCCESS BANNER NOTIFICATION */}
          {submittedSuccessMsg && (
            <div className="mx-5 mt-4 sm:mx-7 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 font-semibold shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{submittedSuccessMsg}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalTab('archive');
                    setSubmittedSuccessMsg(null);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors"
                >
                  Buka Arsip Laporan
                </button>
                <button
                  type="button"
                  onClick={() => setSubmittedSuccessMsg(null)}
                  className="p-1 text-emerald-600 hover:text-emerald-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* MODAL BODY CONTENT */}
          <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
            
            {activeModalTab === 'archive' ? (
              /* ARSIP RIWAYAT LAPORAN CLOSING */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Archive className="w-5 h-5 text-amber-600" />
                      <span>Arsip Riwayat Laporan Penjualan (End Shift & End of Day)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Seluruh laporan hasil eksekusi closing kasir tersimpan resmi di sini dan dapat diakses oleh semua staff.
                    </p>
                  </div>
                </div>

                {filteredArchivedReports.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-300 rounded-3xl space-y-3">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                    <div className="font-bold text-slate-700 text-sm">Belum Ada Laporan Closing yang Dieksekusi</div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Silakan buka tab <strong>Eksekusi Closing (Live)</strong> dan klik tombol <strong>Submit Closing</strong> untuk memfinalisasi dan merekam laporan resmi kasir.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('live')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Buka Eksekusi Closing (Live)</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredArchivedReports.map((rep) => (
                      <div 
                        key={rep.id} 
                        className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                              rep.closingType === 'shift'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            }`}>
                              {rep.closingType === 'shift' ? 'END SHIFT' : 'END OF DAY'}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-500">ID: {rep.id}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {rep.date}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {rep.shiftName}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500">
                              Kasir: <strong className="text-slate-800">{rep.cashierName}</strong> ({rep.cashierRole})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleExportArchivedExcel(rep)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Download file Excel untuk laporan ini"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Excel</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDate(rep.date);
                                if (rep.closingType === 'shift') {
                                  setClosingMode('shift');
                                } else {
                                  setClosingMode('day');
                                }
                                setViewMode('receipt');
                                setActiveModalTab('live');
                                setTimeout(() => handlePrint(), 300);
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Cetak struk kasir thermal untuk laporan ini"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-400" />
                              <span>Cetak Struk</span>
                            </button>
                            {currentUser.role === 'manager' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus arsip laporan resmi ${rep.id}?`)) {
                                    deleteClosingReport(rep.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Hapus Laporan (Manager)"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Financial & Operational KPI Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                          <div className="p-2.5 bg-slate-50 rounded-xl">
                            <div className="text-[10px] text-slate-500 font-bold">Gross Sales</div>
                            <div className="font-black text-slate-900 mt-0.5">{formatRupiah(rep.grossSales)}</div>
                          </div>
                          <div className="p-2.5 bg-blue-50/70 rounded-xl">
                            <div className="text-[10px] text-blue-700 font-bold">Nett Sales</div>
                            <div className="font-black text-blue-900 mt-0.5">{formatRupiah(rep.nettSales)}</div>
                          </div>
                          <div className="p-2.5 bg-amber-50/70 rounded-xl">
                            <div className="text-[10px] text-amber-800 font-bold">Pajak (PB1)</div>
                            <div className="font-black text-amber-900 mt-0.5">{formatRupiah(rep.totalTax)}</div>
                          </div>
                          <div className="p-2.5 bg-purple-50/70 rounded-xl">
                            <div className="text-[10px] text-purple-800 font-bold">Service Charge</div>
                            <div className="font-black text-purple-900 mt-0.5">{formatRupiah(rep.totalService)}</div>
                          </div>
                          <div className="p-2.5 bg-emerald-50 rounded-xl col-span-2 sm:col-span-1">
                            <div className="text-[10px] text-emerald-700 font-bold">Grand Total</div>
                            <div className="font-black text-emerald-900 mt-0.5">{formatRupiah(rep.grandTotal)}</div>
                          </div>
                          <div className="p-2.5 bg-orange-50/70 rounded-xl col-span-2 sm:col-span-1">
                            <div className="text-[10px] text-orange-800 font-bold">Kas Fisik Drawer</div>
                            <div className="font-black text-orange-900 mt-0.5">{formatRupiah(rep.totalCash)}</div>
                          </div>
                        </div>

                        {/* Operational Stats & Notes */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 bg-slate-50/60 p-2.5 rounded-xl">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span><strong>{rep.totalBills}</strong> Bills</span>
                            <span>•</span>
                            <span><strong>{rep.totalPax}</strong> Pax</span>
                            <span>•</span>
                            <span><strong>{rep.occupiedTablesCount}</strong> Meja Terisi</span>
                            <span>•</span>
                            <span><strong>{rep.totalPortionsSold}</strong> Porsi Menu</span>
                          </div>
                          {rep.notes && (
                            <div className="text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Catatan: {rep.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : viewMode === 'dashboard' ? (
              <>
                {/* 1. FINANCIAL KPI SUMMARY CARDS */}
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <span>Rekap Keuangan & Penjualan Restoran</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Gross Sales */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <div className="text-[11px] font-bold text-slate-500">Gross Sales</div>
                      <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
                        {formatRupiah(metrics.grossSales)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Sebelum diskon</div>
                    </div>

                    {/* Diskon */}
                    <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4">
                      <div className="text-[11px] font-bold text-rose-700">Total Diskon</div>
                      <div className="text-base sm:text-lg font-black text-rose-700 mt-1">
                        -{formatRupiah(metrics.totalDiscount)}
                      </div>
                      <div className="text-[10px] text-rose-600/70 mt-0.5">Promo & voucher</div>
                    </div>

                    {/* Nett Sales */}
                    <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4">
                      <div className="text-[11px] font-bold text-blue-700">Nett Sales</div>
                      <div className="text-base sm:text-lg font-black text-blue-900 mt-1">
                        {formatRupiah(metrics.nettSales)}
                      </div>
                      <div className="text-[10px] text-blue-600/70 mt-0.5">Penjualan bersih</div>
                    </div>

                    {/* Pajak Restoran (PB1) */}
                    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
                      <div className="text-[11px] font-bold text-amber-800">Pajak (PB1)</div>
                      <div className="text-base sm:text-lg font-black text-amber-900 mt-1">
                        {formatRupiah(metrics.totalTax)}
                      </div>
                      <div className="text-[10px] text-amber-700/70 mt-0.5">PB1 {taxServiceConfig.taxPercent}%</div>
                    </div>

                    {/* Service Charge */}
                    <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4">
                      <div className="text-[11px] font-bold text-purple-700">Service Charge</div>
                      <div className="text-base sm:text-lg font-black text-purple-900 mt-1">
                        {formatRupiah(metrics.totalService)}
                      </div>
                      <div className="text-[10px] text-purple-600/70 mt-0.5">Layanan {taxServiceConfig.servicePercent}%</div>
                    </div>

                    {/* Grand Total */}
                    <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 shadow-xs">
                      <div className="text-[11px] font-black text-emerald-800">GRAND TOTAL</div>
                      <div className="text-base sm:text-lg font-black text-emerald-950 mt-1">
                        {formatRupiah(metrics.grandTotal)}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700 mt-0.5">Total Uang Masuk</div>
                    </div>
                  </div>
                </div>

                {/* 2. OPERATIONAL STATS & CASH DRAWER */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  
                  {/* LEFT: OPERATIONAL HIGHLIGHTS */}
                  <div className="md:col-span-5 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>Statistik Tamu & Meja Operasional</span>
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="text-[11px] font-bold text-slate-500">Jumlah Pax (Tamu)</div>
                          <div className="text-2xl font-black text-slate-900 mt-0.5">
                            {metrics.totalPax} <span className="text-xs font-bold text-slate-500">Orang</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Dilayani di shift/hari ini</div>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="text-[11px] font-bold text-slate-500">Jumlah Meja Terisi</div>
                          <div className="text-2xl font-black text-slate-900 mt-0.5">
                            {metrics.occupiedTablesCount} <span className="text-xs font-bold text-slate-500">Meja</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Dine In meja aktif</div>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="text-[11px] font-bold text-slate-500">Total Bills / Transaksi</div>
                          <div className="text-xl font-black text-slate-900 mt-0.5">
                            {metrics.totalBills} <span className="text-xs font-bold text-slate-500">Nota</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {metrics.dineInCount} Dine In • {metrics.takeAwayCount} Take Away
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="text-[11px] font-bold text-slate-500">Rata-rata per Tamu</div>
                          <div className="text-base font-black text-slate-900 mt-0.5">
                            {formatRupiah(metrics.avgSpendPerPax)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Spending power / Pax</div>
                        </div>
                      </div>

                      {/* Cash in Drawer Box */}
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-amber-600" />
                            <span>Total Kas Tunai (Cash Drawer)</span>
                          </div>
                          <div className="text-xs text-amber-700/80 mt-0.5">
                            Uang tunai fisik yang harus ada di laci kasir
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-amber-950">
                            {formatRupiah(metrics.totalCash)}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            Harus Setor
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: PAYMENT METHOD BREAKDOWN */}
                  <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>Rincian Metode Pembayaran ({metrics.paymentList.length})</span>
                      </h4>
                      <span className="text-xs font-bold text-slate-500">
                        Total {metrics.totalBills} Transaksi
                      </span>
                    </div>

                    {metrics.paymentList.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        Belum ada transaksi pembayaran lunas pada shift / tanggal yang dipilih.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {metrics.paymentList.map((pay, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                                {idx + 1}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">{pay.method}</div>
                                <div className="text-[11px] text-slate-500">
                                  {pay.count} Transaksi ({pay.percent}% dari total omset)
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-slate-900">{formatRupiah(pay.total)}</div>
                              <div className="w-20 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div 
                                  className="bg-emerald-600 h-1.5 rounded-full" 
                                  style={{ width: `${Math.min(100, pay.percent)}%` }} 
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* 3. LIST MENU TERJUAL TABLE */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <Utensils className="w-4 h-4 text-amber-600" />
                        <span>Daftar Menu Terjual ({metrics.soldList.length} Menu)</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Total {metrics.totalPortionsSold} porsi terjual • Subtotal {formatRupiah(metrics.grossSales)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Search box */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari nama menu..."
                          value={menuSearch}
                          onChange={(e) => setMenuSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white w-40 sm:w-52"
                        />
                      </div>

                      {/* Category selector */}
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                      >
                        {soldCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat === 'all' ? 'Semua Kategori' : cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {displayedSoldItems.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      Tidak ada menu terjual yang cocok dengan kriteria pencarian.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-3.5 py-2.5 w-12 text-center">No</th>
                            <th className="px-3.5 py-2.5">Nama Menu Restoran</th>
                            <th className="px-3.5 py-2.5">Kategori</th>
                            <th className="px-3.5 py-2.5 text-right">Harga Satuan</th>
                            <th className="px-3.5 py-2.5 text-center">Porsi Terjual</th>
                            <th className="px-3.5 py-2.5 text-right">Subtotal Omset</th>
                            <th className="px-3.5 py-2.5 text-right">Kontribusi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {displayedSoldItems.map((item, idx) => {
                            const contrib = metrics.grossSales > 0 ? ((item.subtotal / metrics.grossSales) * 100).toFixed(1) : '0';
                            return (
                              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-3.5 py-2 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="px-3.5 py-2 font-bold text-slate-900">{item.name}</td>
                                <td className="px-3.5 py-2">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                    {item.category}
                                  </span>
                                </td>
                                <td className="px-3.5 py-2 text-right font-medium">{formatRupiah(item.price)}</td>
                                <td className="px-3.5 py-2 text-center font-black text-amber-700">{item.qty} porsi</td>
                                <td className="px-3.5 py-2 text-right font-bold text-slate-900">{formatRupiah(item.subtotal)}</td>
                                <td className="px-3.5 py-2 text-right text-slate-500 font-semibold">{contrib}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                          <tr>
                            <td colSpan={4} className="px-3.5 py-2.5 text-right">TOTAL PORSI & OMSET:</td>
                            <td className="px-3.5 py-2.5 text-center text-amber-800">{metrics.totalPortionsSold} Porsi</td>
                            <td className="px-3.5 py-2.5 text-right text-emerald-800">{formatRupiah(metrics.grossSales)}</td>
                            <td className="px-3.5 py-2.5 text-right">100%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* THERMAL RECEIPT VISUAL PREVIEW */
              <div className="flex flex-col items-center py-2 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600">Lebar Kertas Printer Kasir:</span>
                  <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
                    <button
                      type="button"
                      onClick={() => setPaperWidth('80mm')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        paperWidth === '80mm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      80mm (Standard POS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperWidth('58mm')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        paperWidth === '58mm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      58mm (Mini Printer)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cetak Sekarang</span>
                  </button>
                </div>

                {/* Paper Preview Container */}
                <div 
                  className={`bg-white border-2 border-dashed border-slate-300 rounded-xl p-5 font-mono text-[11px] shadow-lg leading-relaxed text-slate-900 select-none ${
                    paperWidth === '80mm' ? 'w-full max-w-[380px]' : 'w-full max-w-[280px]'
                  }`}
                >
                  {/* Header */}
                  <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
                    <div className="font-black text-sm uppercase">{branding.outletName}</div>
                    {branding.outletAddress && (
                      <div className="text-[10px] text-slate-600">{branding.outletAddress}</div>
                    )}
                    {branding.outletPhone && (
                      <div className="text-[10px] text-slate-500">Telp: {branding.outletPhone}</div>
                    )}
                    <div className="font-black text-xs tracking-wider uppercase pt-1 text-slate-900">
                      *** {closingMode === 'shift' ? 'REKAP TUTUP SHIFT KASIR' : 'REKAP END OF DAY'} ***
                    </div>
                  </div>

                  {/* Shift Details */}
                  <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[10px]">
                    <div className="flex justify-between">
                      <span>Tanggal:</span>
                      <span className="font-bold">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu Cetak:</span>
                      <span>{printTimeStr} WIB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shift:</span>
                      <span className="font-bold">{getShiftLabel()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kasir / Staff:</span>
                      <span className="font-bold">{currentUser.name}</span>
                    </div>
                  </div>

                  {/* Operational Stats */}
                  <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
                    <div className="font-bold text-[10px] uppercase text-slate-600">Statistik Operasional:</div>
                    <div className="flex justify-between">
                      <span>Total Transaksi / Bills:</span>
                      <span className="font-bold">{metrics.totalBills} Nota</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jumlah Tamu (Pax):</span>
                      <span className="font-bold">{metrics.totalPax} Pax</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jumlah Meja Terisi:</span>
                      <span className="font-bold">{metrics.occupiedTablesCount} Meja</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Rincian Order:</span>
                      <span>{metrics.dineInCount} Dine-In / {metrics.takeAwayCount} Take Away</span>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
                    <div className="font-bold text-[10px] uppercase text-slate-600">Ringkasan Keuangan:</div>
                    <div className="flex justify-between">
                      <span>Gross Sales:</span>
                      <span>{formatRupiah(metrics.grossSales)}</span>
                    </div>
                    {metrics.totalDiscount > 0 && (
                      <div className="flex justify-between text-rose-700">
                        <span>Total Diskon Promo:</span>
                        <span>-{formatRupiah(metrics.totalDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span>Nett Sales:</span>
                      <span>{formatRupiah(metrics.nettSales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pajak Resto (PB1 {taxServiceConfig.taxPercent}%):</span>
                      <span>{formatRupiah(metrics.totalTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Charge ({taxServiceConfig.servicePercent}%):</span>
                      <span>{formatRupiah(metrics.totalService)}</span>
                    </div>
                    <div className="border-t border-dashed border-slate-400 pt-1.5 mt-1 flex justify-between font-black text-xs">
                      <span>GRAND TOTAL:</span>
                      <span>{formatRupiah(metrics.grandTotal)}</span>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
                    <div className="font-bold text-[10px] uppercase text-slate-600">Metode Pembayaran:</div>
                    {metrics.paymentList.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-[10px]">
                        <span>{p.method} ({p.count}x):</span>
                        <span className="font-bold">{formatRupiah(p.total)}</span>
                      </div>
                    ))}
                    <div className="border-t border-dashed border-slate-200 pt-1 flex justify-between font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded">
                      <span>Kas Tunai Fisik (Drawer):</span>
                      <span>{formatRupiah(metrics.totalCash)}</span>
                    </div>
                  </div>

                  {/* Sold Menu List (Compact) */}
                  <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
                    <div className="flex justify-between font-bold text-[10px] uppercase text-slate-600">
                      <span>Menu Terjual:</span>
                      <span>{metrics.totalPortionsSold} Porsi</span>
                    </div>
                    <div className="divide-y divide-dotted divide-slate-200 text-[10px]">
                      {metrics.soldList.map((item, idx) => (
                        <div key={idx} className="py-1 flex justify-between items-start">
                          <div className="pr-1">
                            <div>{item.qty}x {item.name}</div>
                            <div className="text-[9px] text-slate-500">@{formatRupiah(item.price)}</div>
                          </div>
                          <span className="font-bold">{formatRupiah(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-3 text-center space-y-6 text-[10px]">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div>
                        <div>Kasir Bertugas,</div>
                        <div className="h-10"></div>
                        <div className="font-bold border-t border-slate-300 pt-0.5">({currentUser.name})</div>
                      </div>
                      <div>
                        <div>Supervisor / Manager,</div>
                        <div className="h-10"></div>
                        <div className="font-bold border-t border-slate-300 pt-0.5">( .................... )</div>
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400 italic">
                      *** Terima kasih atas dedikasi dan kerja keras shift ini ***
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* BOTTOM MODAL FOOTER */}
          <div className="px-5 py-3.5 sm:px-7 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Laporan siap diaudit dan ditandatangani • Dapat diakses oleh seluruh staf restoran.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
              >
                Tutup Jendela
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Download Excel</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Cetak Thermal POS</span>
              </button>

              {activeModalTab === 'live' && (
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer ml-1"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Closing</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* CONFIRMATION SUBMIT CLOSING MODAL */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base leading-tight">
                    Eksekusi {closingMode === 'shift' ? 'End Shift Kasir' : 'End of Day Restoran'}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-800">
                    Konfirmasi penutupan & pembukuan resmi laporan kasir
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="p-1.5 hover:bg-black/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-900" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Peringatan Eksekusi Closing:</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Laporan rekapitulasi penjualan ini akan disimpan permanen ke dalam <strong>Riwayat & Arsip Laporan</strong>, serta menjadi dokumen resmi audit kasir dan manajemen.
                </p>
              </div>

              {/* Ringkasan Angka Rekap */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Tanggal & Shift:</span>
                  <span className="font-bold text-slate-900">{selectedDate} • {getShiftLabel()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Kasir / Staff:</span>
                  <span className="font-bold text-slate-900">{currentUser.name} ({currentUser.role})</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Total Tamu / Pax:</span>
                  <span className="font-bold text-slate-900">{metrics.totalPax} Orang</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Jumlah Meja Terisi:</span>
                  <span className="font-bold text-slate-900">{metrics.occupiedTablesCount} Meja</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Gross Sales:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(metrics.grossSales)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Nett Sales:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(metrics.nettSales)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Pajak Restoran (PB1 {taxServiceConfig.taxPercent}%):</span>
                  <span className="font-bold text-slate-900">{formatRupiah(metrics.totalTax)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Service Charge ({taxServiceConfig.servicePercent}%):</span>
                  <span className="font-bold text-slate-900">{formatRupiah(metrics.totalService)}</span>
                </div>
                <div className="flex justify-between font-black text-sm border-t border-slate-200 pt-2 text-emerald-800">
                  <span>Grand Total Omset:</span>
                  <span>{formatRupiah(metrics.grandTotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-950 bg-amber-100/80 px-2.5 py-1.5 rounded-xl mt-1.5 border border-amber-200">
                  <span>Kas Fisik di Laci (Cash Drawer):</span>
                  <span className="font-black">{formatRupiah(metrics.totalCash)}</span>
                </div>
              </div>

              {/* Catatan Kasir */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Kasir / Serah Terima Modal (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Contoh: Modal awal Rp 500.000 utuh, fisik kas di laci klop sesuai struk, serah terima aman..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSubmitClosing}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Ya, Eksekusi & Simpan Laporan Resmi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DEDICATED PRINT CONTAINER (SHOWN ONLY WHEN PRINTING VIA WINDOW.PRINT) */}
      <div 
        id="pos-closing-thermal-slip"
        className="hidden print-only font-mono text-[11px] leading-snug text-black p-1 w-full max-w-[80mm] mx-auto"
      >
        <div className="text-center space-y-0.5 pb-2 border-b border-black">
          <div className="font-black text-sm uppercase">{branding.outletName}</div>
          {branding.outletAddress && <div className="text-[10px]">{branding.outletAddress}</div>}
          {branding.outletPhone && <div className="text-[10px]">Telp: {branding.outletPhone}</div>}
          <div className="font-black text-xs uppercase pt-1">
            === {closingMode === 'shift' ? 'REKAP TUTUP SHIFT KASIR' : 'REKAP END OF DAY (TUTUP HARI)'} ===
          </div>
        </div>

        <div className="py-2 border-b border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>Tanggal:</span>
            <span>{selectedDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Waktu:</span>
            <span>{printTimeStr} WIB</span>
          </div>
          <div className="flex justify-between">
            <span>Periode:</span>
            <span>{getShiftLabel()}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir / Staff:</span>
            <span>{currentUser.name}</span>
          </div>
        </div>

        <div className="py-2 border-b border-black space-y-0.5">
          <div className="font-bold text-[10px]">STATISTIK OPERASIONAL:</div>
          <div className="flex justify-between">
            <span>Total Transaksi:</span>
            <span>{metrics.totalBills} Bills</span>
          </div>
          <div className="flex justify-between">
            <span>Total Tamu / Pax:</span>
            <span>{metrics.totalPax} Pax</span>
          </div>
          <div className="flex justify-between">
            <span>Meja Terisi (Dine In):</span>
            <span>{metrics.occupiedTablesCount} Meja</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>Dine In / Take Away:</span>
            <span>{metrics.dineInCount} / {metrics.takeAwayCount}</span>
          </div>
        </div>

        <div className="py-2 border-b border-black space-y-0.5">
          <div className="font-bold text-[10px]">RINGKASAN KEUANGAN:</div>
          <div className="flex justify-between">
            <span>Gross Sales:</span>
            <span>{formatRupiah(metrics.grossSales)}</span>
          </div>
          {metrics.totalDiscount > 0 && (
            <div className="flex justify-between">
              <span>Diskon Promo:</span>
              <span>-{formatRupiah(metrics.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <span>Nett Sales:</span>
            <span>{formatRupiah(metrics.nettSales)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pajak (PB1 {taxServiceConfig.taxPercent}%):</span>
            <span>{formatRupiah(metrics.totalTax)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Charge ({taxServiceConfig.servicePercent}%):</span>
            <span>{formatRupiah(metrics.totalService)}</span>
          </div>
          <div className="border-t border-black pt-1 flex justify-between font-black text-xs">
            <span>GRAND TOTAL:</span>
            <span>{formatRupiah(metrics.grandTotal)}</span>
          </div>
        </div>

        <div className="py-2 border-b border-black space-y-0.5">
          <div className="font-bold text-[10px]">METODE PEMBAYARAN:</div>
          {metrics.paymentList.map((p, idx) => (
            <div key={idx} className="flex justify-between text-[10px]">
              <span>{p.method} ({p.count}x):</span>
              <span>{formatRupiah(p.total)}</span>
            </div>
          ))}
          <div className="border-t border-black pt-1 flex justify-between font-bold">
            <span>Kas Tunai Fisik:</span>
            <span>{formatRupiah(metrics.totalCash)}</span>
          </div>
        </div>

        <div className="py-2 border-b border-black space-y-0.5">
          <div className="flex justify-between font-bold text-[10px]">
            <span>MENU TERJUAL:</span>
            <span>{metrics.totalPortionsSold} Porsi</span>
          </div>
          {metrics.soldList.map((item, idx) => (
            <div key={idx} className="flex justify-between text-[10px]">
              <span>{item.qty}x {item.name}</span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 text-center space-y-5 text-[10px]">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div>Kasir Bertugas,</div>
              <div className="h-8"></div>
              <div className="border-t border-black pt-0.5">({currentUser.name})</div>
            </div>
            <div>
              <div>Supervisor / Manager,</div>
              <div className="h-8"></div>
              <div className="border-t border-black pt-0.5">( .................... )</div>
            </div>
          </div>
          <div className="text-[9px] italic">
            *** Laporan Resmi Operasional Kasir ***
          </div>
        </div>
      </div>
    </>
  );
};
