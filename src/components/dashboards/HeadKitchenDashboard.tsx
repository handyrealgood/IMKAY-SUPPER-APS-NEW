import React from 'react';
import { useResto } from '../../context/RestoContext';
import { 
  ChefHat, 
  Truck, 
  Trash2, 
  AlertTriangle, 
  ClipboardCheck, 
  ArrowLeftRight, 
  CheckCircle2, 
  Clock,
  Flame
} from 'lucide-react';

export const HeadKitchenDashboard: React.FC = () => {
  const { 
    rawItems, 
    soConfig, 
    soRecords, 
    wastes, 
    receivings, 
    transfers, 
    formatRupiah, 
    setActiveTab 
  } = useResto();

  // Kitchen items
  const kitchenItems = rawItems.filter(i => 
    i.location === 'Kitchen' || i.location === 'Chiller / Freezer'
  );

  const lowKitchenItems = (kitchenItems || []).filter(i => (Number(i?.currentStock) || 0) <= (Number(i?.minimumStock) || 0));

  // SO Daily Kitchen status today
  const todayStr = '2026-09-08';
  const todayIso = new Date().toISOString().slice(0, 10);
  const kitchenSO = (soRecords || []).find(s => {
    const sDate = s?.date ? String(s.date) : '';
    return (sDate.includes(todayStr) || sDate.includes(todayIso)) && s?.area === 'Kitchen';
  });

  // Kitchen SO Configured items
  const dailySOKitchenItems = (soConfig || []).filter(c => c?.isDailyKitchen);

  // Kitchen wastes
  const kitchenWastes = (wastes || []).filter(w => w?.area === 'Kitchen');
  const totalKitchenWasteLoss = kitchenWastes.reduce((sum, w) => sum + (Number(w?.estimatedCostLoss) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-amber-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-semibold mb-2 border border-amber-500/30">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Kitchen & Chiller Command Center
          </div>
          <h2 className="text-2xl font-black tracking-tight">Dashboard Head Kitchen</h2>
          <p className="text-amber-100 text-xs sm:text-sm mt-1">
            Pantau stok bahan dapur, eksekusi receiving barang supplier, catat waste/spoil dengan foto wajib, dan input SO harian.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('receiving')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Receiving Barang Supplier</span>
          </button>
          <button
            onClick={() => setActiveTab('waste')}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Input Waste & Spoil Dapur</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* Status SO Kitchen */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">SO Harian Dapur</span>
          <div className="mt-2 flex items-center gap-2">
            {kitchenSO ? (
              <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span>Sudah Disubmit</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 font-extrabold text-lg">
                <Clock className="w-5 h-5" />
                <span>Belum Diinput</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {dailySOKitchenItems.length} item wajib cek harian
          </p>
        </div>

        {/* Bahan Dapur Kritis */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Bahan Kritis Dapur</span>
          <div className="text-2xl font-black text-red-600 mt-2">
            {lowKitchenItems.length} <span className="text-sm font-semibold text-slate-400">Item</span>
          </div>
          <p className="text-xs text-red-600 font-semibold mt-1">
            Segera buat PO / Receiving
          </p>
        </div>

        {/* Kerugian Waste Kitchen */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Waste Kitchen Bulan Ini</span>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {formatRupiah(totalKitchenWasteLoss)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {kitchenWastes.length} laporan dengan foto bukti
          </p>
        </div>

        {/* Total Item Dapur */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Total Stok Terkelola</span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {kitchenItems.length} <span className="text-sm font-semibold text-slate-400">Bahan</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chiller, Freezer & Kitchen Dry
          </p>
        </div>

      </div>

      {/* Grid: SO Harian Kitchen Checklist & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: SO Harian Kitchen Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-amber-600" />
                Item SO Harian Kitchen (Ditugaskan Manager)
              </h3>
              <p className="text-xs text-slate-500">Bahan bernilai tinggi yang wajib dicek fisik setiap akhir shift</p>
            </div>
            <button
              onClick={() => setActiveTab('stockopname')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all"
            >
              Isi SO Sekarang
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {dailySOKitchenItems.map(cfg => {
              const item = rawItems.find(i => i.id === cfg.itemId);
              if (!item) return null;
              const isLow = item.currentStock <= item.minimumStock;

              return (
                <div key={cfg.itemId} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{item.name}</span>
                    <span className="block text-[11px] text-slate-400">
                      Batas Min: {item.minimumStock} {item.unit} • Lokasi: {item.location}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-black ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                      {item.currentStock.toFixed(1)} {item.unit}
                    </span>
                    <span className="block text-[10px] text-slate-400">Stok Sistem</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Receiving Terakhir & Waste Kitchen Terakhir */}
        <div className="space-y-4">
          
          {/* Receiving Terakhir */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                Penerimaan Barang Terakhir
              </h3>
              <button
                onClick={() => setActiveTab('receiving')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                + Input Baru
              </button>
            </div>

            {receivings.slice(0, 2).map(rcv => (
              <div key={rcv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-2 last:mb-0">
                <div className="flex items-center justify-between text-xs">
                  <strong className="text-slate-900">{rcv.supplierName}</strong>
                  <span className="text-slate-500">{rcv.date}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  {rcv.items.map(i => `${i.itemName} (${i.qty} ${i.unit})`).join(', ')}
                </div>
                <div className="mt-1 text-xs font-bold text-emerald-700">
                  Total Masuk: {formatRupiah(rcv.totalAmount)}
                </div>
              </div>
            ))}
          </div>

          {/* Waste Kitchen Terakhir dengan Foto */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Waste & Spoil Kitchen Terbaru
              </h3>
              <button
                onClick={() => setActiveTab('waste')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                + Input Waste
              </button>
            </div>

            {kitchenWastes.slice(0, 2).map(wst => (
              <div key={wst.id} className="flex gap-3 p-3 bg-rose-50/50 rounded-xl border border-rose-100 mb-2 last:mb-0">
                <img
                  src={wst.photoUrl}
                  alt={wst.itemName}
                  className="w-14 h-14 object-cover rounded-lg ring-1 ring-rose-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-slate-900 truncate">{wst.itemName}</strong>
                    <span className="text-rose-600 font-extrabold">{wst.qty} {wst.unit}</span>
                  </div>
                  <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                    {wst.reason}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1 truncate">
                    Rugi: {formatRupiah(wst.estimatedCostLoss)} • {wst.notes}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
