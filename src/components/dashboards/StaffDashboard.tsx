import React from 'react';
import { useResto } from '../../context/RestoContext';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  Trash2, 
  Boxes, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { 
    currentUser, 
    rawItems, 
    wastes, 
    soRecords, 
    setActiveTab, 
    currentOutlet 
  } = useResto();

  const lowStockItems = (rawItems || []).filter(item => (Number(item?.currentStock) || 0) <= (Number(item?.minimumStock) || 0));
  const myRecentWastes = (wastes || []).slice(0, 3);
  const pendingSO = (soRecords || []).filter(r => r?.status === 'Pending Approval' || r?.status === 'Submitted');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold mb-2 border border-indigo-500/30">
            <ClipboardCheck className="w-3.5 h-3.5 text-indigo-400" />
            Operasional Restoran &bull; {currentOutlet.name}
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Halo, {currentUser.name}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Selamat bertugas. Silakan laporkan bahan baku rusak/waste tepat waktu, pastikan cek stok fisik bahan kritis, dan laporkan jika ada ketidaksesuaian barang.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('waste')}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Lapor Bahan Rusak / Waste</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-extrabold transition-all border border-white/20 flex items-center gap-2"
          >
            <Boxes className="w-4 h-4" />
            <span>Cek Stok Bahan</span>
          </button>
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Bahan Stok Menipis</div>
            <div className="text-xl font-black text-slate-900">{lowStockItems.length} Item</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Catatan Waste Hari Ini</div>
            <div className="text-xl font-black text-slate-900">{wastes.length} Log</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Stock Opname Pending</div>
            <div className="text-xl font-black text-slate-900">{pendingSO.length} Sesi</div>
          </div>
        </div>
      </div>

      {/* Main Operational Tasks for Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Warning List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Daftar Bahan Menipis / Perlu Dicek
              </h3>
              <p className="text-[11px] text-slate-500">Bahan dengan stok di bawah batas minimum</p>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Semua stok bahan baku saat ini berada di atas batas aman.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map(item => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-amber-100 bg-amber-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.location} &bull; Min: {item.minimumStock} {item.unit}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-md text-xs font-black bg-rose-100 text-rose-700 border border-rose-200">
                      Sisa: {item.currentStock} {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SOP & Operational Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              SOP & Panduan Operasional Staf
            </h3>
            <p className="text-[11px] text-slate-500">Checklist tugas harian standar restoran</p>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Pencatatan Bahan Rusak / Waste</span>
                <span className="text-[11px] text-slate-500">Catat setiap item yang basi, gosong, atau tumpah sesegera mungkin di menu Waste agar stok sistem akurat.</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Koreksi Kesalahan Input</span>
                <span className="text-[11px] text-slate-500">Jika Anda salah memasukkan data, segera hubungi Manager atau Master Admin untuk dilakukan pengeditan/pembatalan resmi.</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Stock Opname Harian Shift</span>
                <span className="text-[11px] text-slate-500">Lakukan perhitungan fisik untuk bahan berbiaya tinggi (High COGS) sebelum pergantian shift.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
