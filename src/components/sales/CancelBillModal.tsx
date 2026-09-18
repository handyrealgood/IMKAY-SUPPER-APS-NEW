import React, { useState } from 'react';
import { TableOrder } from '../../types';
import { useResto } from '../../context/RestoContext';
import { Ban, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CancelBillModalProps {
  order: TableOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CancelBillModal: React.FC<CancelBillModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  const { cancelTableOrder, formatRupiah, currentUser } = useResto();
  const [reason, setReason] = useState('Pelanggan batal pesan / Walkout');
  const [customReason, setCustomReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  if (!isOpen || !order) return null;

  const isManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const presetReasons = [
    'Pelanggan batal pesan / Walkout',
    'Salah input meja / duplicate order oleh kasir',
    'Bahan baku habis di dapur saat persiapan',
    'Komplain makanan / pesanan dibatalkan tamu',
    'Lainnya (Tulis alasan manual)'
  ];

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) {
      setFeedback({ type: 'error', message: 'Akses Ditolak: Hanya Manager yang berwenang membatalkan tagihan (Cancel Bill).' });
      return;
    }

    const finalReason = reason === 'Lainnya (Tulis alasan manual)' 
      ? customReason.trim() 
      : reason;

    if (!finalReason) {
      setFeedback({ type: 'error', message: 'Harap masukkan alasan pembatalan tagihan.' });
      return;
    }

    const res = cancelTableOrder(order.id, finalReason);
    if (res.success) {
      onClose();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div id="cancel-bill-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-200 animate-in fade-in duration-200 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 text-red-700">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Batalkan Tagihan (Cancel Bill)</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                  Manager Only
                </span>
              </div>
              <p className="text-xs text-slate-500">{order.tableNumber} • #{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div className={`mt-3 p-3 rounded-xl flex items-center gap-2 font-semibold text-xs ${
            feedback.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleConfirmCancel} className="space-y-4 mt-4">
          <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Total Tagihan:</span>
              <span className="text-red-700 text-sm font-black">{formatRupiah(order.totalAmount)}</span>
            </div>
            <div className="text-[11px] text-slate-600">
              Berisi {order.items.length} item ({order.items.map(i => `${i.qty}x ${i.menuItemName}`).join(', ')})
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold pt-1 border-t border-red-200/50 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Stok bahan baku & batas porsi (sold-limit) akan otomatis dikembalikan ke sistem.</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Pilih Alasan Pembatalan:
            </label>
            <div className="space-y-1.5">
              {presetReasons.map(r => (
                <label 
                  key={r} 
                  className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                    reason === r ? 'bg-red-50 border-red-300 text-red-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === 'Lainnya (Tulis alasan manual)' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ketik Alasan Pembatalan:
              </label>
              <textarea
                required
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Jelaskan alasan pembatalan tagihan ini..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-red-500 outline-hidden"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={!isManager}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Ban className="w-4 h-4" />
              <span>Konfirmasi Batal Tagihan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
