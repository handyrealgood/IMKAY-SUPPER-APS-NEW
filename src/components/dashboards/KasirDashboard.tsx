import React from 'react';
import { useResto } from '../../context/RestoContext';
import { 
  ShoppingCart, 
  Receipt, 
  DollarSign, 
  PlusCircle, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';

export const KasirDashboard: React.FC = () => {
  const { 
    sales, 
    pettyCash, 
    menuItems, 
    formatRupiah, 
    setActiveTab 
  } = useResto();

  // Metrics for cashier
  const totalRevenue = (sales || []).reduce((sum, s) => sum + (Number(s?.totalRevenue) || 0), 0);
  const totalPortionsSold = (sales || []).reduce((sum, s) => {
    return sum + (s?.itemsSold || []).reduce((itemSum, item) => itemSum + (Number(item?.qtySold) || 0), 0);
  }, 0);

  // Cash balance
  const cashIn = (pettyCash || []).filter(p => p?.type === 'in').reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
  const cashOut = (pettyCash || []).filter(p => p?.type === 'out').reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
  const pettyCashBalance = cashIn - cashOut;

  const latestSales = (sales || []).slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold mb-2 border border-emerald-500/30">
            <CreditCard className="w-3.5 h-3.5" />
            Front-of-House & Cashier Station
          </div>
          <h2 className="text-2xl font-black tracking-tight">Dashboard Kasir & Penjualan</h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Input menu terjual setiap shift (memotong stok bahan baku otomatis) dan kelola pencatatan kas kecil harian.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('sales')}
            className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Input Penjualan Hari Ini</span>
          </button>
          <button
            onClick={() => setActiveTab('pettycash')}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            <span>Catat Kas Keluar / Masuk</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Omset Penjualan Terinput</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(totalRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dari seluruh shift harian aktif
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Porsi Menu Terjual</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totalPortionsSold} <span className="text-sm font-semibold text-slate-500">Porsi</span>
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Stok bahan baku otomatis terpotong
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Saldo Kas Kecil di Kasir</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(pettyCashBalance)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Wajib upload foto bukti setiap pengeluaran
          </p>
        </div>

      </div>

      {/* Main Content: Quick Input Sales Banner & Menu Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Penjualan Terakhir & Log Pemotongan */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Laporan Penjualan Staff</h3>
              <p className="text-xs text-slate-500">Stok bahan baku otomatis berkurang presisi per resep</p>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {latestSales.map(sale => (
              <div key={sale.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
                      {sale.shift}
                    </span>
                    <span className="text-xs text-slate-500">{sale.date}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    Input oleh: <span className="text-emerald-700">{sale.inputBy}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-2">
                  {sale.itemsSold.map((item, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200/60">
                      <div className="font-semibold text-slate-800 truncate">{item.menuItemName}</div>
                      <div className="text-[11px] text-slate-500 font-bold">{item.qtySold} porsi</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Total Transaksi Shift Ini:</span>
                  <strong className="text-sm font-extrabold text-slate-900">{formatRupiah(sale.totalRevenue)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Quick Menu List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Daftar Menu & HPP</h3>
            <span className="text-xs text-slate-400">{menuItems.length} Menu</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
            {menuItems.map(menu => (
              <div key={menu.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{menu.name}</div>
                  <div className="text-[11px] text-slate-400">HPP: {formatRupiah(menu.totalHPP)} / porsi</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-emerald-700">{formatRupiah(menu.sellingPrice)}</div>
                  <span className="text-[10px] font-semibold text-slate-400">{menu.recipes.length} bahan</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('sales')}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all text-center"
            >
              Buka Form Input Penjualan &rarr;
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
