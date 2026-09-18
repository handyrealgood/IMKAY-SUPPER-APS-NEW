import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { StockOpnameItem, StockOpnameRecord } from '../../types';
import { 
  exportDailyStockOpnameToExcel, 
  exportMonthlyStockOpnameToExcel 
} from '../../utils/excelExport';
import { 
  ClipboardCheck, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Search, 
  Calendar, 
  ThumbsUp, 
  ThumbsDown,
  Lock,
  ArrowRight,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit,
  X
} from 'lucide-react';

export const StockOpnameView: React.FC = () => {
  const { 
    stockOpnames, 
    rawItems, 
    addStockOpnameRecord, 
    updateStockOpnameRecord,
    deleteStockOpnameRecord,
    approveStockOpname, 
    currentUser, 
    formatRupiah,
    branding
  } = useResto();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'daily' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const [soType, setSoType] = useState<'harian' | 'bulanan'>('harian');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpnameDetail, setSelectedOpnameDetail] = useState<StockOpnameRecord | null>(null);

  // Manager Edit State
  const [editingOpname, setEditingOpname] = useState<StockOpnameRecord | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<StockOpnameRecord['status']>('Submitted');

  // Form input physical counts for each raw item
  const [physicalCounts, setPhysicalCounts] = useState<{ [itemId: string]: number }>({});
  const [itemReasons, setItemReasons] = useState<{ [itemId: string]: string }>({});

  const isManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const handleOpenForm = (type: 'harian' | 'bulanan') => {
    setSoType(type);
    const initialCounts: { [id: string]: number } = {};
    const initialReasons: { [id: string]: string } = {};
    rawItems.forEach(item => {
      initialCounts[item.id] = item.currentStock;
      initialReasons[item.id] = '';
    });
    setPhysicalCounts(initialCounts);
    setItemReasons(initialReasons);
    setShowAddModal(true);
  };

  const handleCountChange = (itemId: string, val: number) => {
    setPhysicalCounts(prev => ({
      ...prev,
      [itemId]: val,
    }));
  };

  const handleReasonChange = (itemId: string, text: string) => {
    setItemReasons(prev => ({
      ...prev,
      [itemId]: text,
    }));
  };

  const handleDownloadDailyExcel = () => {
    if (!startDate || !endDate) {
      alert('Pilih rentang tanggal awal dan akhir!');
      return;
    }
    if (startDate > endDate) {
      alert('Tanggal mulai tidak boleh lebih besar dari tanggal akhir!');
      return;
    }
    exportDailyStockOpnameToExcel(stockOpnames, startDate, endDate, rawItems, branding?.outletName || 'Resto');
    setExportFeedback(`Berhasil mengunduh Excel SO Harian periode ${startDate} s/d ${endDate}`);
    setTimeout(() => setExportFeedback(null), 4000);
    setShowExportModal(false);
  };

  const handleDownloadMonthlyExcel = () => {
    if (!selectedMonth) {
      alert('Pilih bulan dan tahun opname!');
      return;
    }
    exportMonthlyStockOpnameToExcel(stockOpnames, selectedMonth, rawItems, branding?.outletName || 'Resto');
    setExportFeedback(`Berhasil mengunduh Excel SO Bulanan periode ${selectedMonth}`);
    setTimeout(() => setExportFeedback(null), 4000);
    setShowExportModal(false);
  };

  const handleOpenEdit = (op: StockOpnameRecord) => {
    setEditingOpname(op);
    setEditNotes(op.notes);
    setEditStatus(op.status);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpname) return;
    updateStockOpnameRecord(editingOpname.id, {
      notes: editNotes.trim(),
      status: editStatus,
    });
    setEditingOpname(null);
  };

  const handleDeleteOpname = (op: StockOpnameRecord) => {
    if (!isManager) {
      alert('Hanya Manager / Master Admin yang dapat menghapus data Stock Opname.');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus catatan Stock Opname (${op.type.toUpperCase()}) tanggal ${op.date} oleh ${op.conductedBy}? Tindakan ini tidak dapat dibatalkan.`)) {
      deleteStockOpnameRecord(op.id);
    }
  };

  // Calculate live variances for the form
  const soFormItems: StockOpnameItem[] = rawItems.map(item => {
    const physical = physicalCounts[item.id] ?? item.currentStock;
    const system = item.currentStock;
    const rawDiff = physical - system;
    const difference = Number(rawDiff.toFixed(2));
    const differenceValue = Number((difference * item.costPerUnit).toFixed(0));

    return {
      itemId: item.id,
      itemName: item.name,
      systemStock: Number(system.toFixed(2)),
      physicalStock: Number(physical.toFixed(2)),
      difference,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      differenceValue,
      reason: itemReasons[item.id] || (difference === 0 ? 'Sesuai' : 'Belum diisi'),
    };
  });

  const totalVarianceLoss = soFormItems
    .filter(i => i.differenceValue < 0)
    .reduce((sum, i) => sum + Math.abs(i.differenceValue), 0);

  const totalVarianceSurplus = soFormItems
    .filter(i => i.differenceValue > 0)
    .reduce((sum, i) => sum + i.differenceValue, 0);

  const handleSubmitSO = (e: React.FormEvent) => {
    e.preventDefault();

    addStockOpnameRecord({
      type: soType,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      conductedBy: currentUser.name,
      role: currentUser.role,
      items: soFormItems,
      totalDifferenceValue: totalVarianceSurplus - totalVarianceLoss,
      notes: notes.trim() || `SO ${soType === 'harian' ? 'Closing Shift' : 'Audit Bulanan'}`,
      status: 'Submitted',
    });

    setShowAddModal(false);
    setNotes('');
  };

  const handleApprove = (opname: StockOpnameRecord) => {
    if (!isManager) {
      alert('Hanya Manager Resto yang memiliki wewenang untuk menyetujui Opname Bulanan!');
      return;
    }
    if (window.confirm(`Konfirmasi setujui Opname Bulanan tanggal ${opname.date}? Stok sistem akan diselaraskan dengan stok fisik hasil audit.`)) {
      approveStockOpname(opname.id, currentUser.name);
    }
  };

  const filteredOpnames = stockOpnames.filter(o => 
    o.conductedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Stock Opname (Harian & Bulanan)</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Audit Stok Fisik vs Sistem
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Input SO harian saat pergantian shift / closing dan Opname Bulanan yang memerlukan persetujuan Manager Resto agar laporan keuangan tidak bocor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Download Excel SO for Manager */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            title="Download Excel SO Harian (Range Tanggal) & Bulanan (Pilih Bulan)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Download Excel SO</span>
          </button>
          <button
            onClick={() => handleOpenForm('harian')}
            className="flex-1 sm:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>+ SO Harian (Shift)</span>
          </button>
          <button
            onClick={() => handleOpenForm('bulanan')}
            className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Lock className="w-4 h-4 text-blue-200" />
            <span>+ Opname Bulanan</span>
          </button>
        </div>
      </div>

      {/* Export Success Feedback Toast */}
      {exportFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportFeedback}</span>
        </div>
      )}

      {/* Pending Approvals Notice for Manager */}
      {stockOpnames.some(o => o.status === 'Pending Approval') && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-900">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-950">
                Pemberitahuan: Terdapat Opname Bulanan Menunggu Persetujuan Manager!
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Persetujuan Manager Resto dibutuhkan untuk merekonsiliasi stok fisik dan mengunci laporan keuangan resto.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari riwayat opname berdasarkan staff atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
          />
        </div>
      </div>

      {/* Opname Records List */}
      <div className="space-y-4">
        {filteredOpnames.map(op => {
          const isBulanan = op.type === 'bulanan';
          const varianceDiscrepancyItems = op.items.filter(i => i.difference !== 0);

          return (
            <div key={op.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    isBulanan ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-800'
                  }`}>
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">
                        {isBulanan ? 'Opname Audit Bulanan' : 'Stock Opname Harian (Closing)'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        op.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {op.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{op.date}</span>
                      <span>•</span>
                      <span>Petugas: <strong className="text-slate-800">{op.conductedBy}</strong> ({op.role})</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold block">Total Selisih Finansial</span>
                  <span className={`text-base font-black ${
                    op.totalDifferenceValue < 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}>
                    {op.totalDifferenceValue < 0 ? '-' : '+'}{formatRupiah(Math.abs(op.totalDifferenceValue))}
                  </span>
                </div>
              </div>

              {/* Items with discrepancies preview */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-700">
                    Ringkasan Hasil Cek Fisik ({op.items.length} bahan baku):
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {varianceDiscrepancyItems.length} item memiliki selisih
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {op.items.slice(0, 6).map((item, idx) => {
                    const diffNum = Number(item.difference);
                    const hasDiff = diffNum !== 0;
                    return (
                      <div key={idx} className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                        hasDiff ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-900 block truncate">{item.itemName}</span>
                          <span className="text-[10px] text-slate-500">
                            Sistem: {Number(item.systemStock).toFixed(2)} {item.unit} | Fisik: {Number(item.physicalStock).toFixed(2)} {item.unit}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-black text-xs ${
                            diffNum < 0 ? 'text-red-600' : diffNum > 0 ? 'text-emerald-600' : 'text-slate-500'
                          }`}>
                            {diffNum > 0 ? '+' : ''}{diffNum.toFixed(2)} {item.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Approval Buttons & Footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="text-slate-500">
                  {op.approvedBy ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Disetujui Manager: {op.approvedBy} ({op.approvedDate})
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold">
                      Menunggu peninjauan & otorisasi Manager Resto
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOpnameDetail(op)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700 transition-colors"
                  >
                    Rincian Lengkap &rarr;
                  </button>

                  {isManager && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(op)}
                        className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors"
                        title="Edit Catatan / Status Opname (Manager)"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteOpname(op)}
                        className="p-1.5 border border-rose-200 hover:bg-rose-50 rounded-xl text-rose-600 transition-colors"
                        title="Hapus Catatan Opname (Manager)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {isManager && op.status === 'Pending Approval' && (
                    <button
                      onClick={() => handleApprove(op)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Setujui Opname Bulanan</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal Input Stock Opname Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${soType === 'bulanan' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-900'}`}>
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Form Input {soType === 'bulanan' ? 'Opname Audit Bulanan' : 'Stock Opname Harian (Closing Shift)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {soType === 'bulanan' 
                      ? 'Memerlukan persetujuan Manager Resto untuk penyesuaian buku besar keuangan.' 
                      : 'Pastikan kesesuaian stok fisik dan stok sistem sebelum serah terima shift.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitSO} className="space-y-4 mt-4 text-xs">
              
              {/* Opname Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Bahan Baku</th>
                      <th className="py-2.5 px-3">Stok Sistem</th>
                      <th className="py-2.5 px-3 w-32">Stok Fisik Aktual</th>
                      <th className="py-2.5 px-3">Selisih (Varian)</th>
                      <th className="py-2.5 px-3">Nilai Rupiah</th>
                      <th className="py-2.5 px-3">Alasan Selisih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rawItems.map(item => {
                      const count = physicalCounts[item.id] ?? item.currentStock;
                      const diff = Number((count - item.currentStock).toFixed(2));
                      const diffVal = Number((diff * item.costPerUnit).toFixed(0));

                      return (
                        <tr key={item.id} className={`hover:bg-slate-50 ${diff !== 0 ? 'bg-amber-50/40' : ''}`}>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {item.name}
                            <span className="text-[10px] text-slate-400 block font-normal">{item.code} • {item.location}</span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">
                            {Number(item.currentStock).toFixed(2)} {item.unit}
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={count}
                              onChange={(e) => handleCountChange(item.id, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg font-black text-slate-900 text-xs text-center"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`font-black ${
                              diff < 0 ? 'text-red-600' : diff > 0 ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(2)} {item.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            <span className={diffVal < 0 ? 'text-red-600' : diffVal > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                              {formatRupiah(diffVal)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {diff !== 0 ? (
                              <input
                                type="text"
                                placeholder="Alasan selisih..."
                                value={itemReasons[item.id] || ''}
                                onChange={(e) => handleReasonChange(item.id, e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px]"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400">Match (Sesuai)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Variance Summary Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Selisih Minus (Loss)</span>
                  <div className="text-base font-black text-red-600 mt-0.5">
                    -{formatRupiah(totalVarianceLoss)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Selisih Plus (Surplus)</span>
                  <div className="text-base font-black text-emerald-700 mt-0.5">
                    +{formatRupiah(totalVarianceSurplus)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Net Rekonsiliasi</span>
                  <div className={`text-base font-black mt-0.5 ${
                    totalVarianceSurplus - totalVarianceLoss < 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}>
                    {formatRupiah(totalVarianceSurplus - totalVarianceLoss)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Audit Stock Opname</label>
                <input
                  type="text"
                  placeholder="Contoh: SO Closing Shift Malam, timbangan bahan basah telah diverifikasi oleh Head Kitchen."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  {soType === 'bulanan' ? 'Submit Opname Bulanan (Minta Approval Manager)' : 'Simpan Stock Opname Harian'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Opname */}
      {selectedOpnameDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Rincian {selectedOpnameDetail.type === 'bulanan' ? 'Opname Bulanan' : 'SO Harian'}
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedOpnameDetail.date} • Oleh {selectedOpnameDetail.conductedBy}
                </span>
              </div>
              <button
                onClick={() => setSelectedOpnameDetail(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedOpnameDetail.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.itemName}</span>
                      <span className="text-[11px] text-slate-500">
                        Sistem: {Number(item.systemStock).toFixed(2)} {item.unit} | Fisik: {Number(item.physicalStock).toFixed(2)} {item.unit}
                      </span>
                      {item.reason && item.reason !== 'Sesuai' && (
                        <span className="text-[10px] text-amber-700 block mt-0.5">
                          Alasan: {item.reason}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`font-black ${item.difference < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                        {item.difference > 0 ? '+' : ''}{Number(item.difference).toFixed(2)} {item.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {formatRupiah(item.differenceValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedOpnameDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Download Excel Stock Opname (Harian Range Tanggal / Bulanan) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Download Excel Stock Opname</h3>
                  <p className="text-xs text-slate-500">Ekspor rekapitulasi audit stok fisik & selisih ke format .xlsx</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Export Mode Toggle */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setExportType('daily')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    exportType === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>SO Harian (Range Tanggal)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportType('monthly')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    exportType === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>SO Bulanan (Pilih Bulan)</span>
                </button>
              </div>

              {exportType === 'daily' ? (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block text-xs">Pilih Rentang Tanggal SO Harian:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Dari Tanggal</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Sampai Tanggal</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    File Excel akan berisi semua rincian SO harian (stok sistem, stok fisik, selisih quantity & rupiah, petugas, serta catatan).
                  </p>
                  <button
                    onClick={handleDownloadDailyExcel}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Excel SO Harian ({startDate} s/d {endDate})</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block text-xs">Pilih Bulan & Tahun SO Bulanan:</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Bulan Opname</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    File Excel akan mencakup seluruh rekonsiliasi audit bulanan, status approval Manager, serta deviasi finansial per bahan baku.
                  </p>
                  <button
                    onClick={handleDownloadMonthlyExcel}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Excel SO Bulanan ({selectedMonth})</span>
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Manager Edit SO Record */}
      {editingOpname && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Koreksi Data Stock Opname</h3>
                  <p className="text-xs text-slate-500">Hak Akses Manager / Master Admin untuk perbaikan data</p>
                </div>
              </div>
              <button
                onClick={() => setEditingOpname(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal & Petugas</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                  {editingOpname.date} • {editingOpname.conductedBy} ({editingOpname.role})
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Opname</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                >
                  <option value="Submitted">Submitted (Diajukan)</option>
                  <option value="Pending Approval">Pending Approval (Menunggu Manager)</option>
                  <option value="Approved">Approved (Disetujui)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Koreksi Manager</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  placeholder="Masukkan catatan koreksi..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOpname(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
