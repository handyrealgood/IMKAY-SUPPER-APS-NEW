import React, { useState, useEffect } from 'react';
import { TableOrder } from '../../types';
import { useResto } from '../../context/RestoContext';
import { MoveRight, X, Check, AlertCircle } from 'lucide-react';

interface TransferItemModalProps {
  order: TableOrder | null;
  isOpen: boolean;
  onClose: () => void;
  availableTables: string[];
}

export const TransferItemModal: React.FC<TransferItemModalProps> = ({
  order,
  isOpen,
  onClose,
  availableTables
}) => {
  const { transferTableItem, formatRupiah } = useResto();
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [transferQty, setTransferQty] = useState(1);
  const [destTable, setDestTable] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const candidateTables = availableTables.filter(t => t !== order?.tableNumber);

  useEffect(() => {
    if (order && order.items.length > 0) {
      setSelectedMenuItemId(order.items[0].menuItemId);
      setTransferQty(1);
      setDestTable(candidateTables[0] || '');
      setErrorMsg('');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const currentItem = order.items.find(i => i.menuItemId === selectedMenuItemId) || order.items[0];

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      setErrorMsg('Pilih item yang ingin dipindahkan.');
      return;
    }
    if (!destTable || destTable === order.tableNumber) {
      setErrorMsg('Pilih meja tujuan yang berbeda.');
      return;
    }

    const res = transferTableItem(order.tableNumber, destTable, currentItem.menuItemId, transferQty);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div id="transfer-item-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in duration-200 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <MoveRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Pindah Item ke Meja Lain</h3>
              <p className="text-xs text-slate-500">Dari {order.tableNumber} • #{order.orderNumber}</p>
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

        <form onSubmit={handleConfirmTransfer} className="space-y-4 mt-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Pilih Item yang Mau Dipindahkan:
            </label>
            <select
              value={selectedMenuItemId}
              onChange={(e) => {
                setSelectedMenuItemId(e.target.value);
                setTransferQty(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-indigo-500 outline-hidden"
            >
              {order.items.map(it => (
                <option key={it.menuItemId} value={it.menuItemId}>
                  {it.menuItemName} (Tersedia: {it.qty} porsi - {formatRupiah(it.price)})
                </option>
              ))}
            </select>
          </div>

          {currentItem && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jumlah Porsi Dipindahkan:
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferQty(Math.max(1, transferQty - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700 flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-black text-base text-slate-900">
                    {transferQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTransferQty(Math.min(currentItem.qty, transferQty + 1))}
                    className="w-8 h-8 rounded-lg bg-indigo-100 hover:bg-indigo-200 font-black text-indigo-700 flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setTransferQty(currentItem.qty)}
                  className="px-2 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                >
                  Pindahkan Semua ({currentItem.qty})
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Meja Tujuan:
            </label>
            <select
              value={destTable}
              onChange={(e) => setDestTable(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-indigo-500 outline-hidden"
            >
              {candidateTables.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Jika meja tujuan sudah ada tagihan berjalan, item akan digabungkan ke tagihan tersebut. Jika kosong, akan dibuatkan tagihan baru.
            </p>
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
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Pindahkan Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
