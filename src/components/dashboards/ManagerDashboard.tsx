import React from 'react';
import { useResto } from '../../context/RestoContext';
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Trash2, 
  ClipboardCheck, 
  Receipt, 
  ArrowUpRight, 
  PackageCheck,
  ShieldCheck,
  Activity
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { 
    rawItems, 
    sales, 
    wastes, 
    pettyCash, 
    soRecords, 
    formatRupiah, 
    setActiveTab 
  } = useResto();

  // Metrics calculation - with defensive null/NaN protection
  const totalSalesRevenue = (sales || []).reduce((sum, s) => sum + (Number(s?.totalRevenue) || 0), 0);
  const totalSalesHPP = (sales || []).reduce((sum, s) => sum + (Number(s?.totalHPP) || 0), 0);
  const totalWasteLoss = (wastes || []).reduce((sum, w) => sum + (Number(w?.estimatedCostLoss) || 0), 0);
  
  // Real COGS = HPP Terjual + Waste Loss
  const totalActualCOGS = totalSalesHPP + totalWasteLoss;
  const foodCostPercentage = totalSalesRevenue > 0 
    ? ((totalActualCOGS / totalSalesRevenue) * 100).toFixed(1) 
    : '0.0';

  // Petty cash balance
  const cashIn = (pettyCash || []).filter(p => p?.type === 'in').reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
  const cashOut = (pettyCash || []).filter(p => p?.type === 'out').reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
  const pettyCashBalance = cashIn - cashOut;

  // Critical stock - safe against null, undefined, or string
  const criticalItems = (rawItems || []).filter(i => {
    const stock = typeof i?.currentStock === 'number' ? i.currentStock : Number(i?.currentStock) || 0;
    const min = typeof i?.minimumStock === 'number' ? i.minimumStock : Number(i?.minimumStock) || 0;
    return stock <= min;
  });

  // SO Status today
  const todayStr = '2026-09-08';
  const todayIso = new Date().toISOString().slice(0, 10);
  const kitchenSO = (soRecords || []).find(s => {
    const sDate = s?.date ? String(s.date) : '';
    return (sDate.includes(todayStr) || sDate.includes(todayIso)) && s?.area === 'Kitchen';
  });
  const floorSO = (soRecords || []).find(s => {
    const sDate = s?.date ? String(s.date) : '';
    return (sDate.includes(todayStr) || sDate.includes(todayIso)) && s?.area === 'Floor';
  });
  const pendingApprovals = (soRecords || []).filter(s => s?.status === 'Submitted');

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Live Status - Executive Rich Indigo/Purple Theme (Not Full Black) */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-purple-800/40">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-400/20 text-purple-200 text-xs font-semibold mb-2 border border-purple-400/30">
            <Activity className="w-3.5 h-3.5 text-purple-300" />
            Executive Resto Control Center
          </div>
          <h2 className="text-2xl font-black tracking-tight">Dashboard General Manager</h2>
          <p className="text-purple-100/90 text-xs sm:text-sm mt-1">
            Monitoring menyeluruh penjualan, food cost (COGS), mutasi stok, kas kecil, dan kepatuhan stock opname secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('stockopname')}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Review Stock Opname</span>
            {pendingApprovals.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-purple-700 flex items-center justify-center text-[10px] font-black ml-1">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('cogs')}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-xs"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Laporan COGS & Tren</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial & Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Penjualan</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(totalSalesRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Live Sales terpotong stok otomatis</span>
          </div>
        </div>

        {/* Real-time COGS % */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Food Cost (COGS) Ratio</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {foodCostPercentage}%
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              Target &lt; 35%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Total HPP: <strong className="text-slate-800">{formatRupiah(totalActualCOGS)}</strong>
          </p>
        </div>

        {/* Sisa Petty Cash */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Saldo Kas Kecil (Petty Cash)</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(pettyCashBalance)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>Masuk: {formatRupiah(cashIn)}</span>
            <span className="text-red-500">Keluar: {formatRupiah(cashOut)}</span>
          </div>
        </div>

        {/* Total Kerugian Waste */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Akumulasi Waste & Spoil</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-2">
            {formatRupiah(totalWasteLoss)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {wastes.length} insiden terdokumentasi foto
          </p>
        </div>

      </div>

      {/* Middle Section: Critical Stock Alerts & Stock Opname Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Low Stock Alert Center (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-100 text-red-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Peringatan Bahan Baku Menipis (Real-time)</h3>
                <p className="text-xs text-slate-500">Item yang stok fisiknya berada pada atau di bawah batas aman</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('receiving')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              + Input Receiving Supplier
            </button>
          </div>

          {criticalItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Semua Stok Bahan Baku Aman</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada item di bawah minimum stock level saat ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="pb-2.5">Bahan Baku</th>
                    <th className="pb-2.5">Kategori</th>
                    <th className="pb-2.5">Area</th>
                    <th className="pb-2.5">Stok Aktual</th>
                    <th className="pb-2.5">Batas Min</th>
                    <th className="pb-2.5 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {criticalItems.map(item => (
                    <tr key={item.id} className="hover:bg-red-50/40 transition-colors">
                      <td className="py-3 font-bold text-slate-900">
                        {item.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{item.code}</span>
                      </td>
                      <td className="py-3 text-slate-600">{item.category}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.location}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="font-black text-red-600 text-sm">
                          {(Number(item.currentStock) || 0).toFixed(1)} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-500">
                        {Number(item.minimumStock) || 0} {item.unit}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setActiveTab('receiving')}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition-all"
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leader SO Compliance & Approvals (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-purple-600" />
              Status Kepatuhan SO Harian
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Monitoring input Stock Opname per area</p>
          </div>

          <div className="space-y-3">
            {/* Kitchen Status */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Head Kitchen SO</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Item Daging, Ayam, Seafood, Minyak
                </div>
              </div>
              <div>
                {kitchenSO ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Sudah Input ({kitchenSO.status || 'Submitted'})
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Belum Input
                  </span>
                )}
              </div>
            </div>

            {/* Floor Status */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Head Floor & Bar SO</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Item Susu, Kopi, Packaging, Supplies
                </div>
              </div>
              <div>
                {floorSO ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Sudah Input ({floorSO.status || 'Submitted'})
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Belum Input
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-semibold text-slate-600">Pending Approval Manager:</span>
              <strong className="text-purple-700 font-bold">{(pendingApprovals || []).length} Berkas</strong>
            </div>
            <button
              onClick={() => setActiveTab('stockopname')}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all text-center shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Kelola & Kustomisasi Item SO</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>

      </div>

      {/* Quick Operational Shortcuts Grid */}
      <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Akses Cepat Modul Manager
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveTab('inventory')}
            className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-left transition-all group"
          >
            <PackageCheck className="w-5 h-5 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Input Data Barang</div>
            <div className="text-[10px] text-slate-500">Bahan baku & minimum stock</div>
          </button>

          <button
            onClick={() => setActiveTab('recipes')}
            className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-left transition-all group"
          >
            <TrendingUp className="w-5 h-5 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Resep & HPP Menu</div>
            <div className="text-[10px] text-slate-500">Gramasi & Food cost auto</div>
          </button>

          <button
            onClick={() => setActiveTab('receiving')}
            className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-left transition-all group"
          >
            <PackageCheck className="w-5 h-5 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Receiving Barang</div>
            <div className="text-[10px] text-slate-500">Supplier masuk ke stok</div>
          </button>

          <button
            onClick={() => setActiveTab('waste')}
            className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-left transition-all group"
          >
            <Trash2 className="w-5 h-5 text-rose-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Waste & Spoil</div>
            <div className="text-[10px] text-slate-500">Foto bukti & alasan rugi</div>
          </button>

          <button
            onClick={() => setActiveTab('pettycash')}
            className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-left transition-all group"
          >
            <Receipt className="w-5 h-5 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Arus Kas Kecil</div>
            <div className="text-[10px] text-slate-500">Nota PDF/Cetak & stok</div>
          </button>

          <button
            onClick={() => setActiveTab('cogs')}
            className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-left transition-all group"
          >
            <Activity className="w-5 h-5 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Laporan COGS</div>
            <div className="text-[10px] text-slate-500">Grafik pengeluaran bulanan</div>
          </button>
        </div>
      </div>

    </div>
  );
};
