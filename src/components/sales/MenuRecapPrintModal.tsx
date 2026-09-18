import React from 'react';
import { Printer, X, FileSpreadsheet, Store, Calendar, CheckCircle2, User, Clock } from 'lucide-react';
import { exportToExcel } from '../../utils/excelExport';

interface MenuItemSaleData {
  id: string;
  name: string;
  category: string;
  price: number;
  hpp: number;
  qtySold: number;
  totalRevenue: number;
  totalHpp: number;
}

interface MenuRecapPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  outletName: string;
  periodLabel: string;
  itemsSold: MenuItemSaleData[];
  totalPortionsSold: number;
  totalRevenue: number;
  totalHpp: number;
  paymentStats?: { name: string; type: string; count: number; totalRevenue: number }[];
  formatRupiah: (amount: number) => string;
  userName: string;
  userRole: string;
}

export const MenuRecapPrintModal: React.FC<MenuRecapPrintModalProps> = ({
  isOpen,
  onClose,
  outletName,
  periodLabel,
  itemsSold,
  totalPortionsSold,
  totalRevenue,
  totalHpp,
  paymentStats = [],
  formatRupiah,
  userName,
  userRole,
}) => {
  if (!isOpen) return null;

  // Filter only items that had sales, sorted by qty sold
  const soldItems = itemsSold.filter(i => i.qtySold > 0).sort((a, b) => b.qtySold - a.qtySold);
  const grossProfit = totalRevenue - totalHpp;
  const foodCostRatio = totalRevenue > 0 ? ((totalHpp / totalRevenue) * 100).toFixed(1) : '0.0';
  const currentDateFormatted = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const headers = [
      'No',
      'Kode Menu',
      'Nama Menu Restoran',
      'Kategori',
      'Harga Satuan (Rp)',
      'HPP Resep (Rp)',
      'Porsi Terjual',
      'Total Omset (Rp)',
      'Total HPP (Rp)',
      'Gross Profit (Rp)',
      'Margin Laba (%)'
    ];

    const rows = soldItems.map((item, idx) => {
      const profit = item.totalRevenue - item.totalHpp;
      const margin = item.totalRevenue > 0 ? Number(((profit / item.totalRevenue) * 100).toFixed(1)) : 0;
      return [
        idx + 1,
        item.id,
        item.name,
        item.category,
        item.price,
        item.hpp,
        item.qtySold,
        item.totalRevenue,
        item.totalHpp,
        profit,
        margin
      ];
    });

    exportToExcel(
      `Rekap_Penjualan_Menu_${outletName}_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}`,
      `REKAPITULASI PENJUALAN MENU RESTORAN - ${outletName} (${periodLabel})`,
      headers,
      rows
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-8 print:shadow-none print:border-none print:m-0 print:max-w-none">
        
        {/* Modal Top Actions (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-black text-slate-900">Preview Cetak Rekap Penjualan Menu</h3>
              <p className="text-xs text-slate-500">Periode: {periodLabel}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export ke Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak / Print Slip</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div id="printable-menu-recap" className="p-8 space-y-6 text-slate-800 print:p-4">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Store className="w-6 h-6 text-slate-900" />
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {outletName}
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-600">
                LAPORAN REKAPITULASI PENJUALAN MENU (F&B SALES RECAP)
              </p>
              <p className="text-[11px] text-slate-500">
                Sistem Kasir POS & Manajemen Inventori Resep Restoran
              </p>
            </div>

            <div className="text-left sm:text-right text-xs space-y-0.5 bg-slate-50 p-3 rounded-xl border border-slate-200 print:bg-transparent print:border-none print:p-0">
              <div className="flex items-center sm:justify-end gap-1 font-bold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Periode: {periodLabel}</span>
              </div>
              <div className="flex items-center sm:justify-end gap-1 text-[11px] text-slate-500">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Dicetak: {currentDateFormatted}</span>
              </div>
              <div className="flex items-center sm:justify-end gap-1 text-[11px] text-slate-500">
                <User className="w-3 h-3 text-slate-400" />
                <span>Oleh: {userName} ({userRole})</span>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Porsi Terjual</span>
              <span className="text-lg font-black text-slate-900 mt-1 block">{totalPortionsSold} Porsi</span>
              <span className="text-[10px] text-slate-400 font-medium">{soldItems.length} Ragam Menu</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Omset Bruto</span>
              <span className="text-lg font-black text-emerald-700 mt-1 block">{formatRupiah(totalRevenue)}</span>
              <span className="text-[10px] text-emerald-600 font-medium">Penjualan Terverifikasi</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Estimasi Food Cost (HPP)</span>
              <span className="text-lg font-black text-blue-700 mt-1 block">{formatRupiah(totalHpp)}</span>
              <span className="text-[10px] text-blue-600 font-medium">Rasio: {foodCostRatio}%</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Estimasi Gross Profit</span>
              <span className="text-lg font-black text-amber-700 mt-1 block">{formatRupiah(grossProfit)}</span>
              <span className="text-[10px] text-amber-600 font-medium">Laba Kotor Resep</span>
            </div>
          </div>

          {/* Menu Items Sold Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Rincian Menu Yang Keluar / Terjual ({soldItems.length} Menu)
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Diurutkan berdasarkan porsi terjual terbanyak
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold">
                    <th className="py-2 px-3 text-center w-10">No</th>
                    <th className="py-2 px-3">Nama Menu</th>
                    <th className="py-2 px-3">Kategori</th>
                    <th className="py-2 px-3 text-right">Harga Jual</th>
                    <th className="py-2 px-3 text-center">Qty Terjual</th>
                    <th className="py-2 px-3 text-right">Total Omset</th>
                    <th className="py-2 px-3 text-right">Food Cost</th>
                    <th className="py-2 px-3 text-right">Laba Kotor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {soldItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 font-bold">
                        Tidak ada menu yang terjual pada tanggal / periode ini.
                      </td>
                    </tr>
                  ) : (
                    soldItems.map((item, idx) => {
                      const itemProfit = item.totalRevenue - item.totalHpp;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{item.name}</td>
                          <td className="py-2 px-3 text-slate-600">{item.category}</td>
                          <td className="py-2 px-3 text-right text-slate-700">{formatRupiah(item.price)}</td>
                          <td className="py-2 px-3 text-center font-black text-slate-900 bg-slate-50">
                            {item.qtySold}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-emerald-700">
                            {formatRupiah(item.totalRevenue)}
                          </td>
                          <td className="py-2 px-3 text-right text-blue-700">
                            {formatRupiah(item.totalHpp)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-800">
                            {formatRupiah(itemProfit)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase">Total Keseluruhan:</td>
                    <td className="py-2.5 px-3 text-center bg-amber-100 text-amber-900 font-black">
                      {totalPortionsSold} Porsi
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-800 font-black">
                      {formatRupiah(totalRevenue)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-800 font-black">
                      {formatRupiah(totalHpp)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-black">
                      {formatRupiah(grossProfit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Method Breakdown if Available */}
          {paymentStats.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Ringkasan Penerimaan Metode Pembayaran
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {paymentStats.map(pm => (
                  <div key={pm.name} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block truncate">{pm.name}</span>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                      <span>{pm.count} Transaksi</span>
                      <strong className="text-emerald-700">{formatRupiah(pm.totalRevenue)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures & Notes Block */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-12">
              <span className="font-bold text-slate-600 block">Dibuat Oleh (Kasir/Staff)</span>
              <div className="border-b border-slate-400 mx-auto w-32"></div>
              <span className="text-slate-500 block">({userName})</span>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-600 block">Diverifikasi (Kitchen/Bar)</span>
              <div className="border-b border-slate-400 mx-auto w-32"></div>
              <span className="text-slate-500 block">(Head Chef / Bar Lead)</span>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-600 block">Disetujui (Manager on Duty)</span>
              <div className="border-b border-slate-400 mx-auto w-32"></div>
              <span className="text-slate-500 block">(Operational Manager)</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-2">
            Dokumen ini dihasilkan secara otomatis oleh Sistem Resto POS. Validitas data terikat pada catatan shift dan transaksi kasir resmi.
          </div>

        </div>

      </div>
    </div>
  );
};
