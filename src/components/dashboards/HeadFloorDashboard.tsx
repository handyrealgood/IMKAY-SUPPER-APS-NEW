import React from 'react';
import { useResto } from '../../context/RestoContext';
import { 
  Coffee, 
  Trash2, 
  ClipboardCheck, 
  ArrowLeftRight, 
  CheckCircle2, 
  Clock, 
  Package, 
  AlertTriangle 
} from 'lucide-react';

export const HeadFloorDashboard: React.FC = () => {
  const { 
    rawItems, 
    soConfig, 
    soRecords, 
    wastes, 
    transfers, 
    formatRupiah, 
    setActiveTab 
  } = useResto();

  // Floor / Bar & Packaging items
  const floorItems = rawItems.filter(i => 
    i.location === 'Floor / Bar' || i.category === 'Packaging & Supplies' || i.category === 'Perlengkapan Floor'
  );

  const lowFloorItems = (floorItems || []).filter(i => (Number(i?.currentStock) || 0) <= (Number(i?.minimumStock) || 0));

  // SO Daily Floor status today
  const todayStr = '2026-09-08';
  const todayIso = new Date().toISOString().slice(0, 10);
  const floorSO = (soRecords || []).find(s => {
    const sDate = s?.date ? String(s.date) : '';
    return (sDate.includes(todayStr) || sDate.includes(todayIso)) && s?.area === 'Floor';
  });

  // Floor SO Configured items
  const dailySOFloorItems = (soConfig || []).filter(c => c?.isDailyFloor);

  // Floor wastes
  const floorWastes = (wastes || []).filter(w => w?.area === 'Floor / Bar');
  const totalFloorWasteLoss = floorWastes.reduce((sum, w) => sum + (Number(w?.estimatedCostLoss) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-2 border border-blue-500/30">
            <Coffee className="w-3.5 h-3.5 text-blue-400" />
            Floor, Bar & Dining Operations
          </div>
          <h2 className="text-2xl font-black tracking-tight">Dashboard Head Floor & Bar</h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            Pengawasan stok bar, packaging takeaway, kebersihan floor, waste tumpah/rusak dengan foto, serta SO harian.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('waste')}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Input Waste Floor/Bar (Foto)</span>
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transfer Antar Cabang</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* Status SO Floor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">SO Harian Floor & Bar</span>
          <div className="mt-2 flex items-center gap-2">
            {floorSO ? (
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
            {dailySOFloorItems.length} item wajib cek harian
          </p>
        </div>

        {/* Bahan Bar & Packaging Kritis */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Stok Kritis Floor</span>
          <div className="text-2xl font-black text-red-600 mt-2">
            {lowFloorItems.length} <span className="text-sm font-semibold text-slate-400">Item</span>
          </div>
          <p className="text-xs text-red-600 font-semibold mt-1">
            Susu UHT & Packaging menipis
          </p>
        </div>

        {/* Kerugian Waste Floor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Waste Floor Bulan Ini</span>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {formatRupiah(totalFloorWasteLoss)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {floorWastes.length} insiden terdokumentasi
          </p>
        </div>

        {/* Total Item Terkelola */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Item Bar & Supplies</span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {floorItems.length} <span className="text-sm font-semibold text-slate-400">Item</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bar, Sirup, Kemasan & Sanitasi
          </p>
        </div>

      </div>

      {/* Grid: SO Checklist Floor & Mutasi Transfer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: SO Floor Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                Item SO Harian Floor & Bar
              </h3>
              <p className="text-xs text-slate-500">Ditugaskan langsung oleh Restaurant Manager</p>
            </div>
            <button
              onClick={() => setActiveTab('stockopname')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
            >
              Isi SO Floor
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {dailySOFloorItems.map(cfg => {
              const item = rawItems.find(i => i.id === cfg.itemId);
              if (!item) return null;
              const isLow = item.currentStock <= item.minimumStock;

              return (
                <div key={cfg.itemId} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{item.name}</span>
                    <span className="block text-[11px] text-slate-400">
                      Batas Min: {item.minimumStock} {item.unit} • {item.category}
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

        {/* Right: Transfer Mutasi & Waste Bar */}
        <div className="space-y-4">
          
          {/* Transfer Mutasi Antar Cabang */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                Mutasi Antar Outlet Terkini
              </h3>
              <button
                onClick={() => setActiveTab('transfers')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                + Ajukan Transfer
              </button>
            </div>

            {transfers.slice(0, 2).map(trf => (
              <div key={trf.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-2 last:mb-0 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{trf.transferNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    trf.status === 'Diterima' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {trf.status}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Dari: <strong>{trf.originOutlet}</strong> &rarr; Ke: <strong>{trf.destinationOutlet}</strong>
                </div>
                <div className="text-slate-500 text-[10px] mt-1">
                  {trf.items.map(i => `${i.itemName} (${i.qty} ${i.unit})`).join(', ')}
                </div>
              </div>
            ))}
          </div>

          {/* Waste Floor Terakhir */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Waste Floor & Bar Terkini
              </h3>
              <button
                onClick={() => setActiveTab('waste')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                + Laporkan
              </button>
            </div>

            {floorWastes.slice(0, 1).map(wst => (
              <div key={wst.id} className="flex gap-3 p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                <img
                  src={wst.photoUrl}
                  alt={wst.itemName}
                  className="w-12 h-12 object-cover rounded-lg ring-1 ring-rose-200 shrink-0"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{wst.itemName}</strong>
                    <span className="text-rose-600 font-bold">{wst.qty} {wst.unit}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-700">{wst.reason}</span>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{wst.notes}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
