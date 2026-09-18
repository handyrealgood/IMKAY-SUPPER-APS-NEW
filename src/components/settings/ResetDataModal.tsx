import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { 
  AlertTriangle, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  FileSpreadsheet, 
  PackageMinus 
} from 'lucide-react';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetDataModal: React.FC<ResetDataModalProps> = ({ isOpen, onClose }) => {
  const { resetAllDataToZero, resetToDefaultData, currentUser } = useResto();

  const [activeMode, setActiveMode] = useState<'zero' | 'demo'>('zero');
  const [confirmText, setConfirmText] = useState('');
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMasterOrManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const handleZeroReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.trim().toUpperCase() !== 'RESET0') {
      alert('Ketik kata konfirmasi "RESET0" dengan benar.');
      return;
    }

    resetAllDataToZero();
    setStatusSuccess('Berhasil! Seluruh data operasional dikosongkan dan stok bahan baku dibuat menjadi 0.');
    setConfirmText('');
    setTimeout(() => {
      setStatusSuccess(null);
      onClose();
    }, 2000);
  };

  const handleDemoReset = () => {
    resetToDefaultData();
    setStatusSuccess('Berhasil memuat ulang data demo simulasi!');
    setTimeout(() => {
      setStatusSuccess(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-red-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Pusat Reset & Pembersihan Data</h3>
              <p className="text-xs text-red-200 mt-0.5">
                Opsi pengosongan data untuk persiapan Go-Live restoran asli
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-6">
          <button
            onClick={() => { setActiveMode('zero'); setStatusSuccess(null); }}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              activeMode === 'zero'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PackageMinus className="w-4 h-4" />
            <span>Kosongkan Data (Buat Stok 0)</span>
          </button>

          <button
            onClick={() => { setActiveMode('demo'); setStatusSuccess(null); }}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              activeMode === 'demo'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Pulihkan Data Demo</span>
          </button>
        </div>

        <div className="p-6">
          {statusSuccess && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusSuccess}</span>
            </div>
          )}

          {/* MODE 1: RESET TO ZERO */}
          {activeMode === 'zero' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-2">
                <div className="font-extrabold flex items-center gap-1.5 text-red-800">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Apa yang terjadi saat data dibuat 0?</span>
                </div>
                <ul className="list-disc list-inside text-[11px] space-y-1 text-red-700">
                  <li><strong>Seluruh stok barang aktual diset menjadi 0</strong> (Master nama barang, satuan & batas minimum tetap ada agar Anda tidak perlu input ulang dari nol).</li>
                  <li><strong>Semua transaksi operasional dihapus</strong>: Penjualan harian, Receiving supplier, Waste/spoil, Transfer cabang, dan Stock Opname (SO).</li>
                  <li><strong>Saldo Kas Kecil (Petty Cash) kembali Rp 0</strong>.</li>
                  <li>Resep menu dan formula HPP tetap tersimpan dan siap dipakai saat stok mulai diisi.</li>
                </ul>
              </div>

              {!isMasterOrManager ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  Hanya <strong>Admin Master / Manager Resto</strong> yang berwenang melakukan tindakan pengosongan data ini. Silakan login sebagai Manager.
                </div>
              ) : (
                <form onSubmit={handleZeroReset} className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Ketik <span className="font-mono text-red-600 bg-red-100 px-1.5 py-0.5 rounded">RESET0</span> untuk konfirmasi pengosongan:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="RESET0"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 font-mono text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 uppercase tracking-widest bg-red-50/30"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={confirmText.trim().toUpperCase() !== 'RESET0'}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Kosongkan & Buat Stok 0</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 2: RESTORE DEMO DATA */}
          {activeMode === 'demo' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1.5">
                <p className="font-bold text-slate-900">Kembalikan ke Contoh Data Simulasi</p>
                <p className="text-[11px] text-slate-600">
                  Mengisi kembali sistem dengan contoh bahan baku (Daging Sapi, Beras, Telur, Minyak), resep menu (Nasi Goreng, Iga Bakar, Es Teh), transaksi kasir, dan riwayat receiving untuk demonstrasi fitur.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDemoReset}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Pulihkan Data Demo</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
