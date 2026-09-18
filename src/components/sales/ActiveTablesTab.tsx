import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { TableOrder } from '../../types';
import { 
  Users, 
  Clock, 
  ArrowRightLeft, 
  MoveRight, 
  Split, 
  Ban, 
  CheckCircle2, 
  Printer, 
  CreditCard, 
  DollarSign, 
  Search,
  Filter,
  Phone,
  User,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { SplitBillModal } from './SplitBillModal';
import { TransferTableModal } from './TransferTableModal';
import { TransferItemModal } from './TransferItemModal';
import { CancelBillModal } from './CancelBillModal';

interface ActiveTablesTabProps {
  onSelectOrderToPrint: (order: TableOrder) => void;
  availableTables: string[];
}

export const ActiveTablesTab: React.FC<ActiveTablesTabProps> = ({
  onSelectOrderToPrint,
  availableTables
}) => {
  const { 
    tableOrders, 
    updateTableOrderStatus, 
    currentUser, 
    formatRupiah,
    paymentMethods 
  } = useResto();

  const isManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
    paymentMethods.find(p => p.isActive)?.name || 'Tunai / Cash'
  );

  // Pay Modal
  const [payingOrder, setPayingOrder] = useState<TableOrder | null>(null);

  // Operations Modals
  const [splitModalOrder, setSplitModalOrder] = useState<TableOrder | null>(null);
  const [transferTableModalOrder, setTransferTableModalOrder] = useState<TableOrder | null>(null);
  const [transferItemModalOrder, setTransferItemModalOrder] = useState<TableOrder | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<TableOrder | null>(null);

  // Active orders (unpaid and not cancelled)
  const activeOrders = tableOrders.filter(o => 
    o.paymentStatus === 'Belum Bayar' && !o.isCancelled
  );

  const filteredOrders = activeOrders.filter(o => 
    o.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleConfirmPayment = (order: TableOrder) => {
    updateTableOrderStatus(order.id, 'Lunas', selectedPaymentMethod);
    setPayingOrder(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Search & Summary Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Meja Aktif & Tagihan Berjalan ({activeOrders.length})
            </h3>
            <p className="text-xs text-slate-500">
              Kelola meja yang sedang santap, split bill, pindah meja, pindah item, atau batalkan tagihan.
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari meja, order #, tamu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-hidden font-medium"
          />
        </div>
      </div>

      {/* Grid of Active Tables */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700">Tidak ada meja aktif</h4>
          <p className="text-xs text-slate-400">
            Semua tagihan telah diselesaikan (Lunas) atau belum ada pesanan baru di kasir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <div 
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-3">
                {/* Header: Table, Time, Pax */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs">
                      {order.tableNumber}
                    </span>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">#{order.orderNumber}</div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {order.time}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {order.pax} Pax • {order.orderType}
                    </span>
                  </div>
                </div>

                {/* Customer info if present */}
                {(order.customerName || order.customerPhone) && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerName || 'Tamu'}</span>
                    </div>
                    {order.customerPhone && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{order.customerPhone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-700">
                      <div className="truncate pr-2">
                        <strong className="text-slate-900 font-bold mr-1.5">{it.qty}x</strong>
                        <span>{it.menuItemName}</span>
                      </div>
                      <span className="font-medium text-slate-600 shrink-0">
                        {formatRupiah(it.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                  {order.discountAmount && order.discountAmount > 0 ? (
                    <div className="flex justify-between text-emerald-700 font-medium text-[11px]">
                      <span>Diskon ({order.discountName || 'Promo'})</span>
                      <span>-{formatRupiah(order.discountAmount)}</span>
                    </div>
                  ) : null}

                  {order.serviceAmount && order.serviceAmount > 0 ? (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Service Charge</span>
                      <span>+{formatRupiah(order.serviceAmount)}</span>
                    </div>
                  ) : null}

                  {order.taxAmount && order.taxAmount > 0 ? (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Pajak Resto (PB1)</span>
                      <span>+{formatRupiah(order.taxAmount)}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between font-black text-slate-900 text-sm pt-1 border-t border-slate-100">
                    <span>Total Tagihan:</span>
                    <span className="text-amber-700">{formatRupiah(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {/* Pay & Print */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPayingOrder(order)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bayar (Lunas)</span>
                  </button>

                  <button
                    onClick={() => onSelectOrderToPrint(order)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Bill</span>
                  </button>
                </div>

                {/* Staff Table Operations: Split Bill, Move Table, Move Item */}
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                  <button
                    onClick={() => setTransferTableModalOrder(order)}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex flex-col items-center justify-center gap-0.5"
                    title="Pindahkan seluruh tagihan ke meja lain"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Pindah Meja</span>
                  </button>

                  <button
                    onClick={() => setTransferItemModalOrder(order)}
                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg flex flex-col items-center justify-center gap-0.5"
                    title="Pindahkan item tertentu ke meja lain"
                  >
                    <MoveRight className="w-3.5 h-3.5" />
                    <span>Pindah Item</span>
                  </button>

                  <button
                    onClick={() => setSplitModalOrder(order)}
                    className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg flex flex-col items-center justify-center gap-0.5"
                    title="Pisahkan beberapa item ke tagihan/meja baru"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>Split Bill</span>
                  </button>
                </div>

                {/* Cancel Bill (Manager Only) */}
                {isManager ? (
                  <button
                    onClick={() => setCancelModalOrder(order)}
                    className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Batalkan Tagihan (Cancel Bill)</span>
                  </button>
                ) : (
                  <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-slate-400" />
                    <span>Cancel Bill memerlukan otorisasi Manager</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAY MODAL */}
      {payingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in duration-200 text-xs">
            <div className="text-center space-y-1 pb-3 border-b border-slate-100">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                Penyelesaian Pembayaran
              </span>
              <h3 className="text-lg font-black text-slate-900">{payingOrder.tableNumber}</h3>
              <p className="text-slate-500 font-mono">Order #{payingOrder.orderNumber}</p>
            </div>

            <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Tagihan</span>
              <div className="text-2xl font-black text-emerald-950 mt-0.5">
                {formatRupiah(payingOrder.totalAmount)}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Metode Pembayaran:</label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {paymentMethods.filter(p => p.isActive).map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.type.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingOrder(null)}
                  className="flex-1 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmPayment(payingOrder)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Konfirmasi Lunas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <SplitBillModal 
        isOpen={!!splitModalOrder}
        order={splitModalOrder}
        onClose={() => setSplitModalOrder(null)}
      />

      <TransferTableModal
        isOpen={!!transferTableModalOrder}
        order={transferTableModalOrder}
        onClose={() => setTransferTableModalOrder(null)}
        availableTables={availableTables}
      />

      <TransferItemModal
        isOpen={!!transferItemModalOrder}
        order={transferItemModalOrder}
        onClose={() => setTransferItemModalOrder(null)}
        availableTables={availableTables}
      />

      <CancelBillModal
        isOpen={!!cancelModalOrder}
        order={cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
      />
    </div>
  );
};
