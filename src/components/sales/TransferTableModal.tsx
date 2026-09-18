import React, { useState, useEffect } from 'react';
import { TableOrder } from '../../types';
import { useResto } from '../../context/RestoContext';
import { ArrowRightLeft, X, Check, AlertCircle } from 'lucide-react';

interface TransferTableModalProps {
  order: TableOrder | null;
  isOpen: boolean;
  onClose: () => void;
  availableTables: string[];
}

export const TransferTableModal: React.FC<TransferTableModalProps> = ({ 
  order, 
  isOpen, 
  onClose,
  availableTables 
}) => {
  const { transferTable, tableOrders } = useResto();
  const [destTable, setDestTable] = useState('');
  const [customTable, setCustomTable] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Find tables that currently have unpaid orders
  const occupiedTables = new Set(
    tableOrders
      .filter(o => o.paymentStatus === 'Belum Bayar' && !o.isCancelled)
      .map(o => o.tableNumber)
  );

  const candidateTables = availableTables.filter(t => t !== order?.tableNumber && !occupiedTables.has(t));

  useEffect(() => {
    if (order) {
      setDestTable(candidateTables[0] || '');
      setCustomTable('');
      setUseCustom(false);
      setErrorMsg('');
    }
  }, [order, candidateTables.length]);

  if (!isOpen || !order) return null;

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDest = useCustom ? customTable.trim() : destTable;
    if (!finalDest) {
      setErrorMsg('Pilih atau masukkan meja tujuan.');
      return;
    }
    if (finalDest === order.tableNumber) {
      setErrorMsg('Meja tujuan tidak boleh sama dengan meja saat ini.');
      return;
    }

    const res = transferTable(order.tableNumber, finalDest);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div id="transfer-table-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Pindah Meja (Transfer Bill)</h3>
              <p className="text-xs text-slate-500">Pindahkan seluruh tagihan dari {order.tableNumber}</p>
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

        <form onSubmit={handleConfirmTransfer} className="space-y-4 mt-4 text-xs">
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-500 block">Meja Asal</span>
              <span className="font-extrabold text-blue-950 text-sm">{order.tableNumber}</span>
              <div className="text-[11px] text-blue-700 mt-0.5">#{order.orderNumber} ({order.items.length} item)</div>
            </div>
            <ArrowRightLeft className="w-5 h-5 text-blue-400" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Meja Tujuan</span>
              <span className="font-extrabold text-slate-800 text-sm">
                {useCustom ? (customTable || '...') : (destTable || '...')}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">Pilih Meja Kosong:</label>
              <button
                type="button"
                onClick={() => setUseCustom(!useCustom)}
                className="text-blue-600 hover:underline text-[11px] font-bold"
              >
                {useCustom ? 'Pilih dari Daftar Meja' : '+ Ketik Nama Meja Manual'}
              </button>
            </div>

            {useCustom ? (
              <input
                type="text"
                required
                value={customTable}
                onChange={(e) => setCustomTable(e.target.value)}
                placeholder="Contoh: Meja 15 atau Gazebo 2"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-blue-500 outline-hidden"
              />
            ) : (
              <select
                value={destTable}
                onChange={(e) => setDestTable(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-blue-500 outline-hidden"
              >
                {candidateTables.length === 0 && (
                  <option value="">Tidak ada meja kosong dalam daftar standar</option>
                )}
                {candidateTables.map(t => (
                  <option key={t} value={t}>{t} (Kosong)</option>
                ))}
              </select>
            )}
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Pindahkan Tagihan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
