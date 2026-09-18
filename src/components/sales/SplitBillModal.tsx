import React, { useState, useEffect } from 'react';
import { TableOrder } from '../../types';
import { useResto } from '../../context/RestoContext';
import { Split, X, Check, AlertCircle, ArrowRight } from 'lucide-react';

interface SplitBillModalProps {
  order: TableOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({ order, isOpen, onClose }) => {
  const { splitTableOrder, formatRupiah } = useResto();
  const [splitItems, setSplitItems] = useState<{ [menuItemId: string]: number }>({});
  const [newTableNumber, setNewTableNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (order) {
      setNewTableNumber(`${order.tableNumber}-B`);
      setSplitItems({});
      setErrorMsg('');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleQtyChange = (menuItemId: string, maxQty: number, value: number) => {
    const clamped = Math.max(0, Math.min(maxQty, value));
    setSplitItems(prev => ({
      ...prev,
      [menuItemId]: clamped
    }));
  };

  const selectedList = Object.entries(splitItems)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([menuItemId, qty]) => ({ menuItemId, qty: Number(qty) }));

  const splitTotal = selectedList.reduce((sum, s) => {
    const item = order.items.find(i => i.menuItemId === s.menuItemId);
    return sum + (item ? item.price * s.qty : 0);
  }, 0);

  const remainingTotal = order.totalAmount - splitTotal;

  const handleConfirmSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedList.length === 0) {
      setErrorMsg('Pilih minimal 1 item untuk dipisahkan ke tagihan baru.');
      return;
    }
    const allMoved = order.items.every(i => (splitItems[i.menuItemId] || 0) === i.qty);
    if (allMoved) {
      setErrorMsg('Semua item dipilih. Untuk memindahkan seluruh tagihan, gunakan menu Pindah Meja.');
      return;
    }

    const res = splitTableOrder(order.id, selectedList, newTableNumber.trim() || undefined);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div id="split-bill-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Split Bill / Pisah Tagihan</h3>
              <p className="text-xs text-slate-500">{order.tableNumber} • Order #{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleConfirmSplit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Meja / Sub-Tagihan Baru:
            </label>
            <input
              type="text"
              required
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              placeholder="Contoh: Meja 01-B atau Meja 04"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-purple-500 outline-hidden"
            />
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-700 mb-2">
              Pilih Item & Jumlah Porsi yang Dipisahkan:
            </span>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
              {order.items.map(item => {
                const currentSplitQty = splitItems[item.menuItemId] || 0;
                return (
                  <div key={item.menuItemId} className="pt-2 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">{item.menuItemName}</div>
                      <div className="text-slate-500">
                        Total {item.qty} porsi • {formatRupiah(item.price)}/porsi
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.menuItemId, item.qty, currentSplitQty - 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-slate-900">
                        {currentSplitQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.menuItemId, item.qty, currentSplitQty + 1)}
                        className="w-7 h-7 rounded-lg bg-purple-100 hover:bg-purple-200 font-black text-purple-800 flex items-center justify-center"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.menuItemId, item.qty, item.qty)}
                        className="text-[10px] text-purple-600 font-bold px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100"
                      >
                        Semua
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bill Preview comparison */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sisa Tagihan Meja Asal</span>
              <div className="font-black text-slate-900 mt-0.5">{formatRupiah(Math.max(0, remainingTotal))}</div>
              <span className="text-[10px] text-slate-500">{order.tableNumber}</span>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[10px] uppercase font-bold text-purple-600 block">Tagihan Baru Dipisah</span>
              <div className="font-black text-purple-700 mt-0.5">{formatRupiah(splitTotal)}</div>
              <span className="text-[10px] text-purple-500">{newTableNumber || 'Sub-Meja'}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={selectedList.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Pisahkan Tagihan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
