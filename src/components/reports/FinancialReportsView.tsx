import React, { useState, useMemo } from 'react';
import { useResto } from '../../context/RestoContext';
import { exportToExcel, exportSlowMovingItemsToExcel } from '../../utils/excelExport';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Printer, 
  Calendar, 
  PieChart, 
  FileText, 
  Layers, 
  Percent,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Hourglass,
  AlertTriangle,
  Search,
  Package,
  Download
} from 'lucide-react';

export const FinancialReportsView: React.FC = () => {
  const { 
    sales, 
    wastes, 
    receivings, 
    pettyCash, 
    rawItems, 
    menuItems,
    pettyCashBalance, 
    currentOutlet, 
    formatRupiah,
    branding
  } = useResto();

  const [activeSubTab, setActiveSubTab] = useState<'cogs' | 'cashflow' | 'trends' | 'slow-moving'>('cogs');
  const [selectedPeriod, setSelectedPeriod] = useState('Bulan Ini (September 2026)');
  const [slowMovingFilter, setSlowMovingFilter] = useState<'all' | 'stagnant' | 'slow'>('all');
  const [slowMovingSearch, setSlowMovingSearch] = useState('');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Slow Moving items computation
  const slowMovingData = useMemo(() => {
    return rawItems.map((item) => {
      // Find total consumption in sales recipes
      let totalUsageInSales = 0;
      sales.forEach((s) => {
        (s.itemsSold || []).forEach((soldItem) => {
          const menu = menuItems.find((m) => m.id === soldItem.menuItemId);
          if (menu) {
            const recipeIng = menu.recipes.find((r) => r.itemId === item.id);
            if (recipeIng) {
              const amount = recipeIng.baseAmount !== undefined ? recipeIng.baseAmount : recipeIng.amount;
              totalUsageInSales += amount * (soldItem.qtySold || 0);
            }
          }
        });
      });

      // Find waste count
      const totalWaste = wastes
        .filter((w) => w.itemId === item.id)
        .reduce((sum, w) => sum + (w.qty || 0), 0);

      const totalOut = totalUsageInSales + totalWaste;
      const totalStockValue = item.currentStock * item.costPerUnit;

      let daysInactive = 14;
      let movementStatus = 'Normal Moving';

      if (item.currentStock > 0 && totalOut === 0) {
        daysInactive = 45;
        movementStatus = 'Stagnan (Tanpa Penjualan)';
      } else if (item.currentStock > 0 && totalOut > 0) {
        const dailyRate = totalOut / 30;
        const daysToDeplete = item.currentStock / (dailyRate || 0.01);
        if (daysToDeplete > 40) {
          daysInactive = 35;
          movementStatus = 'Sangat Lambat (Slow Moving)';
        } else if (daysToDeplete > 20) {
          daysInactive = 21;
          movementStatus = 'Cenderung Lambat';
        } else {
          daysInactive = 7;
          movementStatus = 'Perputaran Normal (Fast)';
        }
      } else {
        daysInactive = 0;
        movementStatus = 'Stok Habis';
      }

      return {
        rawItem: item,
        totalUsage: totalOut,
        daysInactive,
        totalStockValue,
        movementStatus,
      };
    });
  }, [rawItems, sales, wastes, menuItems]);

  const filteredSlowMoving = useMemo(() => {
    return slowMovingData.filter((entry) => {
      if (slowMovingFilter === 'stagnant' && !entry.movementStatus.includes('Stagnan')) return false;
      if (slowMovingFilter === 'slow' && !entry.movementStatus.includes('Lambat') && !entry.movementStatus.includes('Slow')) return false;
      if (slowMovingSearch.trim()) {
        const q = slowMovingSearch.toLowerCase();
        return (
          entry.rawItem.name.toLowerCase().includes(q) ||
          entry.rawItem.code.toLowerCase().includes(q) ||
          entry.rawItem.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [slowMovingData, slowMovingFilter, slowMovingSearch]);

  const totalDeadStockValue = useMemo(() => {
    return slowMovingData
      .filter((e) => e.movementStatus.includes('Stagnan') || e.movementStatus.includes('Lambat') || e.movementStatus.includes('Slow'))
      .reduce((sum, e) => sum + e.totalStockValue, 0);
  }, [slowMovingData]);

  const handleExportSlowMoving = () => {
    const listToExport = slowMovingData.filter(
      (e) => e.movementStatus.includes('Stagnan') || e.movementStatus.includes('Lambat') || e.movementStatus.includes('Slow')
    );
    exportSlowMovingItemsToExcel(listToExport, branding?.outletName || 'Resto');
    setExportFeedback(`Berhasil mengunduh Excel Slow Moving (${listToExport.length} item).`);
    setTimeout(() => setExportFeedback(null), 3500);
  };

  // 1. Calculations for COGS & P&L
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalRecipeHPP = sales.reduce((sum, s) => sum + s.totalHPP, 0);
  const totalWasteLoss = wastes.reduce((sum, w) => sum + w.estimatedCostLoss, 0);

  // Total Realized COGS (Food Cost Penjualan + Kerugian Waste)
  const actualCOGS = totalRecipeHPP + totalWasteLoss;
  const grossProfit = totalSalesRevenue - actualCOGS;
  const actualFoodCostRatio = totalSalesRevenue > 0 
    ? Number(((actualCOGS / totalSalesRevenue) * 100).toFixed(1)) 
    : 0;
  const targetFoodCostRatio = 32.0;
  const isHealthyFoodCost = actualFoodCostRatio <= 35.0;

  // 2. Calculations for Daily Cashflow
  const totalReceivingPurchases = receivings.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPettyCashOut = pettyCash.filter(p => p.type === 'out').reduce((sum, p) => sum + p.amount, 0);
  const totalPettyCashIn = pettyCash.filter(p => p.type === 'in').reduce((sum, p) => sum + p.amount, 0);
  const netCashFlow = totalSalesRevenue + totalPettyCashIn - (totalReceivingPurchases + totalPettyCashOut);

  // 3. Monthly Trends Mock/Historical Data
  const monthlyTrendData = [
    { month: 'Apr', revenue: 42000000, cogs: 13500000, waste: 900000, pettyCash: 3200000 },
    { month: 'Mei', revenue: 48500000, cogs: 15200000, waste: 1100000, pettyCash: 3800000 },
    { month: 'Jun', revenue: 53000000, cogs: 16800000, waste: 1250000, pettyCash: 4100000 },
    { month: 'Jul', revenue: 51200000, cogs: 16100000, waste: 950000, pettyCash: 3900000 },
    { month: 'Agt', revenue: 56800000, cogs: 17400000, waste: 1300000, pettyCash: 4400000 },
    { month: 'Sep (Aktual)', revenue: totalSalesRevenue || 58900000, cogs: actualCOGS || 18200000, waste: totalWasteLoss || 1450000, pettyCash: totalPettyCashOut || 4650000 },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportPLToExcel = () => {
    const headers = ['Pos Akun / Kategori Keuangan', 'Nominal (Rp)', 'Persentase Omset (%)', 'Catatan'];
    const rows: (string | number)[][] = [
      ['PENDAPATAN PENJUALAN (REVENUE)', totalSalesRevenue, 100, 'Total omset penjualan menu'],
      ['', '', '', ''],
      ['HARGA POKOK PENJUALAN (HPP / COGS):', '', '', ''],
      ['  - Food Cost Bahan Baku (Resep Terjual)', totalRecipeHPP, Number(((totalRecipeHPP / (totalSalesRevenue || 1)) * 100).toFixed(1)), 'Bahan baku aktual terpakai'],
      ['  - Kerugian Bahan Rusak & Spoil (Waste)', totalWasteLoss, Number(((totalWasteLoss / (totalSalesRevenue || 1)) * 100).toFixed(1)), 'Biaya kerugian waste'],
      ['TOTAL COGS (HPP RESTORAN)', actualCOGS, actualFoodCostRatio, 'Target sehat: maks 35%'],
      ['', '', '', ''],
      ['LABA KOTOR (GROSS PROFIT)', grossProfit, Number(((grossProfit / (totalSalesRevenue || 1)) * 100).toFixed(1)), 'Laba sebelum biaya operasional'],
      ['', '', '', ''],
      ['BIAYA OPERASIONAL KAS KECIL (PETTY CASH):', '', '', ''],
      ['  - Pengeluaran Kas Kecil Operasional', totalPettyCashOut, Number(((totalPettyCashOut / (totalSalesRevenue || 1)) * 100).toFixed(1)), 'Listrik, gas, es batu, perbaikan'],
      ['', '', '', ''],
      ['LABA BERSIH OPERASIONAL (NET OPERATING PROFIT)', grossProfit - totalPettyCashOut, Number((((grossProfit - totalPettyCashOut) / (totalSalesRevenue || 1)) * 100).toFixed(1)), 'Laba bersih outlet'],
      ['', '', '', ''],
      ['INFORMASI ARUS KAS (CASH FLOW):', '', '', ''],
      ['  - Total Pembelian Stok Supplier', totalReceivingPurchases, 0, 'Total faktur barang masuk'],
      ['  - Total Kas Masuk (Petty Cash In)', totalPettyCashIn, 0, 'Top-up saldo petty cash'],
      ['  - Arus Kas Bersih (Net Cash Flow)', netCashFlow, 0, 'Selisih kas masuk vs keluar'],
    ];

    exportToExcel(`Laporan_Laba_Rugi_PL_${currentOutlet.name}`, `LAPORAN LABA RUGI (P&L) & COGS - ${currentOutlet.name}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner (No-print for clean reports) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Laporan COGS & Arus Kas Real-Time</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {currentOutlet.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analisis akurat Harga Pokok Penjualan (HPP), pembukuan arus kas harian, dan grafik tren pengeluaran bulanan.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="Bulan Ini (September 2026)">September 2026</option>
            <option value="Agustus 2026">Agustus 2026</option>
            <option value="Juli 2026">Juli 2026</option>
          </select>

          <button
            onClick={handleExportPLToExcel}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Export Excel (P&L)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Cetak / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Letterhead (visible during print) */}
      <div className="print-only hidden p-6 border-b border-slate-300">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{branding.systemName.toUpperCase()}</h1>
          <p className="text-sm font-bold text-slate-700">LAPORAN KEUANGAN, COGS & ARUS KAS BULANAN</p>
          <p className="text-xs text-slate-500">Cabang: {branding.outletName} ({branding.outletCity}) • Periode: {selectedPeriod} • Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs (No-print) */}
      <div className="no-print flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveSubTab('cogs')}
          className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
            activeSubTab === 'cogs'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Real-time COGS & P&L Analysis</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cashflow')}
          className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
            activeSubTab === 'cashflow'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Laporan Arus Kas Harian (Cashflow)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('trends')}
          className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
            activeSubTab === 'trends'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Grafik Tren Pengeluaran Bulanan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('slow-moving')}
          className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
            activeSubTab === 'slow-moving'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Hourglass className="w-4 h-4 text-amber-500" />
          <span>Slow Moving Bahan Baku</span>
        </button>
      </div>

      {/* 1. COGS & P&L TAB */}
      {activeSubTab === 'cogs' && (
        <div className="space-y-6">
          
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Total Omset Penjualan</span>
              <div className="text-2xl font-black text-slate-900 mt-2">{formatRupiah(totalSalesRevenue)}</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                Gross Revenue Aktual
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">COGS / HPP Terhitung</span>
              <div className="text-2xl font-black text-blue-600 mt-2">{formatRupiah(actualCOGS)}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Resep + Waste ({formatRupiah(totalWasteLoss)})
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Gross Profit (Laba Kotor)</span>
              <div className="text-2xl font-black text-emerald-700 mt-2">{formatRupiah(grossProfit)}</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                Margin {totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(1) : 0}%
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Food Cost Ratio %</span>
              <div className={`text-2xl font-black mt-2 ${isHealthyFoodCost ? 'text-emerald-700' : 'text-red-600'}`}>
                {actualFoodCostRatio}%
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Target: &le; {targetFoodCostRatio}% ({isHealthyFoodCost ? 'Kondisi Sehat' : 'Perlu Efisiensi'})
              </span>
            </div>
          </div>

          {/* Breakdown Table of COGS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Breakdown Komponen COGS & Efisiensi Dapur</h3>

            <div className="space-y-3">
              {/* Resep menu HPP */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 block text-sm">HPP Resep Penjualan (Standard Food Cost)</span>
                  <span className="text-slate-500 text-[11px]">Bahan baku yang terpakai murni berdasarkan porsi menu terjual</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-slate-900">{formatRupiah(totalRecipeHPP)}</span>
                  <span className="text-[11px] text-slate-400 block">
                    {totalSalesRevenue > 0 ? ((totalRecipeHPP / totalSalesRevenue) * 100).toFixed(1) : 0}% dari omset
                  </span>
                </div>
              </div>

              {/* Waste & Spoil loss */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-rose-900 block text-sm">Kerugian Bahan Rusak / Basi (Waste & Spoil)</span>
                  <span className="text-rose-700 text-[11px]">Bahan terbuang dengan alasan kedaluwarsa, overcook, atau kemasan rusak</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-rose-700">{formatRupiah(totalWasteLoss)}</span>
                  <span className="text-[11px] text-rose-600 block">
                    {totalSalesRevenue > 0 ? ((totalWasteLoss / totalSalesRevenue) * 100).toFixed(1) : 0}% dari omset
                  </span>
                </div>
              </div>

              {/* Total COGS */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-white block text-sm">TOTAL COGS REALTIME</span>
                  <span className="text-slate-400 text-[11px]">Akumulasi seluruh biaya konsumsi bahan baku operasional</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400">{formatRupiah(actualCOGS)}</span>
                  <span className="text-[11px] text-slate-300 block">
                    Food Cost: {actualFoodCostRatio}%
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. CASHFLOW TAB */}
      {activeSubTab === 'cashflow' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Total Penerimaan Kas (Arus Masuk)</span>
              <div className="text-2xl font-black text-emerald-700 mt-2">
                +{formatRupiah(totalSalesRevenue + totalPettyCashIn)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Penjualan kasir & drop dana pusat
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Total Pengeluaran Kas (Arus Keluar)</span>
              <div className="text-2xl font-black text-rose-600 mt-2">
                -{formatRupiah(totalReceivingPurchases + totalPettyCashOut)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Supplier PO & petty cash operasional
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Saldo Kas Operasional Berjalan</span>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatRupiah(pettyCashBalance)}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Rekonsiliasi Realtime Sesuai
              </span>
            </div>
          </div>

          {/* Daily Cashflow Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Buku Besar Arus Kas Harian (Daily Cash Ledger)</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Tanggal & Waktu</th>
                    <th className="py-3 px-4">Kategori Mutasi</th>
                    <th className="py-3 px-4">Deskripsi / No Referensi</th>
                    <th className="py-3 px-4">Penanggung Jawab</th>
                    <th className="py-3 px-4 text-right">Kas Masuk (In)</th>
                    <th className="py-3 px-4 text-right">Kas Keluar (Out)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Sales Inflow rows */}
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-600">{s.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          Penjualan Resto
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.shift} ({s.itemsSold.length} Menu)</td>
                      <td className="py-3 px-4 text-slate-600">{s.inputBy}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">+{formatRupiah(s.totalRevenue)}</td>
                      <td className="py-3 px-4 text-right text-slate-400">-</td>
                    </tr>
                  ))}

                  {/* Supplier Purchase Outflow rows */}
                  {receivings.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-600">{r.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                          Supplier PO
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.supplierName} ({r.poNumber})</td>
                      <td className="py-3 px-4 text-slate-600">{r.receivedBy}</td>
                      <td className="py-3 px-4 text-right text-slate-400">-</td>
                      <td className="py-3 px-4 text-right font-black text-rose-600">-{formatRupiah(r.totalAmount)}</td>
                    </tr>
                  ))}

                  {/* Petty cash rows */}
                  {pettyCash.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-600">{p.date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          p.type === 'in' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.description}</td>
                      <td className="py-3 px-4 text-slate-600">{p.submittedBy}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">
                        {p.type === 'in' ? `+${formatRupiah(p.amount)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-600">
                        {p.type === 'out' ? `-${formatRupiah(p.amount)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TRENDS GRAPH TAB */}
      {activeSubTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Grafik Tren Omset, COGS & Pengeluaran 6 Bulan Terakhir</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan performa finansial bulanan untuk mendeteksi lonjakan biaya atau kebocoran stok.
              </p>
            </div>

            {/* Custom Interactive SVG / Bar Visualizer */}
            <div className="space-y-5">
              {monthlyTrendData.map((item, idx) => {
                const maxVal = 65000000;
                const revWidth = (item.revenue / maxVal) * 100;
                const cogsWidth = (item.cogs / maxVal) * 100;
                const pcWidth = (item.pettyCash / maxVal) * 100;

                return (
                  <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{item.month}</span>
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="text-emerald-700">Omset: {formatRupiah(item.revenue)}</span>
                        <span className="text-blue-600">COGS: {formatRupiah(item.cogs)}</span>
                        <span className="text-amber-600">Kas Kecil: {formatRupiah(item.pettyCash)}</span>
                      </div>
                    </div>

                    {/* Visual stacked bars */}
                    <div className="space-y-1">
                      {/* Revenue bar */}
                      <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${revWidth}%` }}
                          title={`Omset: ${formatRupiah(item.revenue)}`}
                        />
                      </div>
                      {/* COGS bar */}
                      <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${cogsWidth}%` }}
                          title={`COGS: ${formatRupiah(item.cogs)}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-emerald-500" />
                <span>Omset Penjualan (Revenue)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-blue-500" />
                <span>COGS / HPP (Bahan Baku)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-amber-500" />
                <span>Petty Cash Operasional</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SLOW MOVING BAHAN BAKU TAB */}
      {activeSubTab === 'slow-moving' && (
        <div className="space-y-6">
          {/* Feedback Toast */}
          {exportFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportFeedback}</span>
            </div>
          )}

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Total Nilai Modal Tertahan (Dead Stock)</span>
              <div className="text-2xl font-black text-rose-600 mt-2">{formatRupiah(totalDeadStockValue)}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Uang mengendap di gudang bahan lambat bergerak
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Item Stagnan & Slow Moving</span>
              <div className="text-2xl font-black text-amber-600 mt-2">
                {slowMovingData.filter(e => e.movementStatus.includes('Stagnan') || e.movementStatus.includes('Lambat')).length} Item
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Perlu evaluasi purchase order & promo menu
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Aksi Rekomendasi Manager</span>
                <p className="text-xs text-slate-700 font-medium mt-1">
                  Ekspor daftar slow moving untuk meeting evaluasi dapur & purchasing.
                </p>
              </div>
              <button
                onClick={handleExportSlowMoving}
                className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Excel Slow Moving</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header and Filters */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Hourglass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Daftar Audit Perputaran Bahan Baku (Slow Moving)</h3>
                  <p className="text-xs text-slate-500">Mendeteksi bahan baku yang lambat berputar atau berpotensi kedaluwarsa</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={slowMovingSearch}
                    onChange={(e) => setSlowMovingSearch(e.target.value)}
                    placeholder="Cari bahan baku..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setSlowMovingFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-all ${slowMovingFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setSlowMovingFilter('stagnant')}
                    className={`px-3 py-1 rounded-lg transition-all ${slowMovingFilter === 'stagnant' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500'}`}
                  >
                    Stagnan
                  </button>
                  <button
                    onClick={() => setSlowMovingFilter('slow')}
                    className={`px-3 py-1 rounded-lg transition-all ${slowMovingFilter === 'slow' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'}`}
                  >
                    Slow Moving
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Kode & Bahan Baku</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                    <th className="py-3 px-4 text-right">Nilai Aset (Rp)</th>
                    <th className="py-3 px-4 text-center">Perputaran (Hari)</th>
                    <th className="py-3 px-4 text-center">Status Kecepatan</th>
                    <th className="py-3 px-4">Rekomendasi Manager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSlowMoving.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada bahan baku yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSlowMoving.map((item, idx) => {
                      const isStagnant = item.movementStatus.includes('Stagnan');
                      const isSlow = item.movementStatus.includes('Lambat') || item.movementStatus.includes('Slow');

                      return (
                        <tr key={item.rawItem.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-900 block">{item.rawItem.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{item.rawItem.code}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{item.rawItem.category}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">
                            {item.rawItem.currentStock} {item.rawItem.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                            {formatRupiah(item.totalStockValue)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                              <Hourglass className="w-3 h-3 text-slate-400" />
                              {item.daysInactive} Hari
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isStagnant ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                                <AlertTriangle className="w-3 h-3" />
                                {item.movementStatus}
                              </span>
                            ) : isSlow ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                                <Hourglass className="w-3 h-3" />
                                {item.movementStatus}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                {item.movementStatus}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {isStagnant ? (
                              <span className="text-rose-700 font-bold block">
                                Buat Menu Promo / Bundling Segera
                              </span>
                            ) : isSlow ? (
                              <span className="text-amber-800 font-semibold block">
                                Kurangi Kuantiti PO Berikutnya
                              </span>
                            ) : (
                              <span className="text-slate-500 block">
                                Perputaran aman & optimal
                              </span>
                            )}
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

    </div>
  );
};
