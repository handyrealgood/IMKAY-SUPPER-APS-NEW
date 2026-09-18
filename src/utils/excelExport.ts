import * as XLSX from 'xlsx';
import { User, StockOpnameRecord, RawItem, MenuItem } from '../types';

/**
 * Generic utility to export structured tabular data to Excel (.xlsx)
 */
export function exportToExcel(
  filename: string,
  sheetTitle: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  const data = [
    [sheetTitle],
    [],
    headers,
    ...rows
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');

  // Auto column width adjustment
  const maxCols = headers.map((h, i) => {
    let maxLen = h.length;
    rows.forEach(r => {
      const cellVal = r[i] !== undefined && r[i] !== null ? String(r[i]) : '';
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    });
    return { wch: Math.min(Math.max(maxLen + 2, 12), 40) };
  });
  worksheet['!cols'] = maxCols;

  const validName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, validName);
}

/**
 * Utility to export comprehensive HRD employee directory to Excel (.xlsx)
 */
export function exportEmployeesToExcel(users: User[], brandingName: string = 'Restoran') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const data = users.map((u, index) => {
    let contractDaysRemaining = '-';
    let contractAlert = 'Aman';

    if (u.contractStatus === 'kontrak' && u.contractEndDate) {
      const end = new Date(u.contractEndDate);
      const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      contractDaysRemaining = `${diffDays} hari`;
      if (diffDays < 0) {
        contractAlert = 'KONTRAK HABIS';
      } else if (diffDays <= 60) {
        contractAlert = `PERINGATAN (< 2 Bln / ${diffDays} hari)`;
      } else {
        contractAlert = 'Aktif';
      }
    } else if (u.contractStatus === 'tetap') {
      contractAlert = 'Karyawan Tetap';
    }

    return {
      'No': index + 1,
      'ID Karyawan': u.employeeId || `EMP-${u.id}`,
      'Nama Lengkap': u.name,
      'Username': `@${u.username}`,
      'Jabatan / Peran': u.roleTitle || u.role,
      'Status Kontrak': (u.contractStatus || 'tetap').toUpperCase(),
      'Tgl Mulai Kerja': u.contractStartDate || u.joinDate || '-',
      'Tgl Berakhir Kontrak': u.contractEndDate || '-',
      'Sisa Masa Kontrak': contractDaysRemaining,
      'Status Peringatan HRD': contractAlert,
      'NIK (KTP)': u.nikKtp || (u as any).nik || '-',
      'No. Telepon / WA': u.phone || '-',
      'Email': u.email || '-',
      'Alamat Domisili': u.address || '-',
      'Tanggal Lahir': u.birthDate || '-',
      'Jenis Kelamin': (u as any).gender === 'L' ? 'Laki-laki' : (u as any).gender === 'P' ? 'Perempuan' : '-',
      'Golongan Darah': u.bloodType || '-',
      'Pendidikan Terakhir': u.lastEducation || '-',
      'NPWP': u.npwp || '-',
      'BPJS Ketenagakerjaan': u.bpjsKetenagakerjaan || '-',
      'BPJS Kesehatan': u.bpjsKesehatan || '-',
      'Nama Bank': u.bankName || '-',
      'No. Rekening': u.bankAccountNumber || '-',
      'Atas Nama Rekening': u.bankAccountHolder || '-',
      'Kontak Darurat': u.emergencyContactName || '-',
      'Hubungan Kontak Darurat': u.emergencyContactRelation || '-',
      'No. Telp Darurat': u.emergencyContactPhone || '-',
      'Catatan HRD': (u as any).notes || u.bio || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Karyawan HRD');

  // Auto column width adjustment
  const maxProps = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length + 3, 14)
  }));
  worksheet['!cols'] = maxProps;

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Data_Karyawan_${brandingName.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
}

/**
 * Utility to export Daily Stock Opname within a date range to Excel
 */
export function exportDailyStockOpnameToExcel(
  records: StockOpnameRecord[],
  startDate: string,
  endDate: string,
  rawItems: RawItem[],
  brandingName: string = 'Restoran'
) {
  const filtered = records.filter(r => {
    const isDaily = r.type === 'daily' || r.type === 'harian';
    if (!isDaily) return false;
    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;
    return true;
  });

  const rows: any[] = [];
  filtered.forEach(record => {
    record.items.forEach(item => {
      const raw = rawItems.find(i => i.id === item.itemId);
      const unit = item.unit || raw?.unit || 'unit';
      const unitCost = raw?.costPerUnit || 0;
      const differenceQty = item.physicalStock - item.systemStock;
      const totalLoss = item.differenceValue !== undefined 
        ? item.differenceValue 
        : Math.abs(differenceQty) * unitCost;

      rows.push({
        'Tgl Opname': record.date,
        'ID SO': record.id,
        'Petugas': record.conductedBy,
        'Role': record.role,
        'Area': record.area || 'All',
        'Status SO': record.status,
        'Nama Bahan Baku': item.itemName || (item as any).name || raw?.name || item.itemId,
        'Kategori': raw?.category || 'Bahan Baku',
        'Stok Sistem': item.systemStock,
        'Stok Fisik': item.physicalStock,
        'Satuan': unit,
        'Selisih Qty': Number(differenceQty.toFixed(2)),
        'HPP Satuan (Rp)': unitCost,
        'Nilai Selisih / Loss (Rp)': Math.round(totalLoss),
        'Alasan / Keterangan': item.notes || item.reason || record.notes || '-',
        'Catatan Manager': record.managerNotes || '-'
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Info': 'Tidak ada data Stock Opname Harian pada rentang tanggal ini' }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SO Harian');

  const rangeStr = `${startDate || 'Awal'}_sd_${endDate || 'Akhir'}`;
  XLSX.writeFile(workbook, `SO_Harian_${brandingName.replace(/\s+/g, '_')}_${rangeStr}.xlsx`);
}

/**
 * Utility to export Monthly Stock Opname for a chosen month to Excel
 */
export function exportMonthlyStockOpnameToExcel(
  records: StockOpnameRecord[],
  monthYear: string, // YYYY-MM
  rawItems: RawItem[],
  brandingName: string = 'Restoran'
) {
  const filtered = records.filter(r => {
    const isMonthly = r.type === 'monthly' || r.type === 'bulanan';
    if (!isMonthly) return false;
    if (monthYear && !r.date.startsWith(monthYear)) return false;
    return true;
  });

  const rows: any[] = [];
  filtered.forEach(record => {
    record.items.forEach(item => {
      const raw = rawItems.find(i => i.id === item.itemId);
      const unit = item.unit || raw?.unit || 'unit';
      const unitCost = raw?.costPerUnit || 0;
      const differenceQty = item.physicalStock - item.systemStock;
      const totalLoss = item.differenceValue !== undefined 
        ? item.differenceValue 
        : Math.abs(differenceQty) * unitCost;

      rows.push({
        'Bulan / Periode': monthYear || record.date.slice(0, 7),
        'Tgl Opname': record.date,
        'ID SO': record.id,
        'Petugas Pelaksana': record.conductedBy,
        'Role': record.role,
        'Status Approval': record.status,
        'Disetujui Oleh': record.approvedBy || '-',
        'Tgl Disetujui': record.approvedDate || '-',
        'Nama Bahan Baku': item.itemName || (item as any).name || raw?.name || item.itemId,
        'Kategori': raw?.category || 'Bahan Baku',
        'Stok Sistem': item.systemStock,
        'Stok Fisik': item.physicalStock,
        'Satuan': unit,
        'Selisih Qty': Number(differenceQty.toFixed(2)),
        'HPP Satuan (Rp)': unitCost,
        'Nilai Selisih Variance (Rp)': Math.round(totalLoss),
        'Alasan / Keterangan': item.notes || item.reason || record.notes || '-',
        'Catatan / Rekomendasi Manager': record.managerNotes || '-'
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Info': `Tidak ada data Stock Opname Bulanan pada periode ${monthYear}` }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SO Bulanan');

  XLSX.writeFile(workbook, `SO_Bulanan_${brandingName.replace(/\s+/g, '_')}_${monthYear || 'Semua'}.xlsx`);
}

/**
 * Utility to export Slow Moving raw material items to Excel
 */
export function exportSlowMovingItemsToExcel(
  items: {
    rawItem: RawItem;
    daysInactive: number;
    totalStockValue: number;
    movementStatus: string;
  }[],
  brandingName: string = 'Restoran'
) {
  const rows = items.map((item, index) => ({
    'No': index + 1,
    'Kode Item': item.rawItem.code || item.rawItem.id,
    'Nama Bahan Baku': item.rawItem.name,
    'Kategori': item.rawItem.category,
    'Stok Saat Ini': item.rawItem.currentStock,
    'Satuan Unit': item.rawItem.unit,
    'HPP Satuan (Rp)': item.rawItem.costPerUnit,
    'Total Nilai Aset Mati (Rp)': Math.round(item.totalStockValue),
    'Hari Tanpa Pergerakan': `${item.daysInactive} Hari`,
    'Tgl Terakhir Diperbarui': item.rawItem.lastUpdated || '-',
    'Status Evaluasi': item.movementStatus,
    'Rekomendasi Manajer': item.daysInactive > 60 
      ? 'Segera buat menu promo spesial atau clearance agar tidak kedaluwarsa' 
      : 'Evaluasi pembelian berikutnya (kurangi kuantiti PO)'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Info': 'Tidak ada bahan baku slow moving terdeteksi' }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Slow Moving Bahan Baku');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Laporan_Slow_Moving_${brandingName.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
}

/**
 * Utility to export all Master Raw Items to Excel (.xlsx)
 */
export function exportRawItemsToExcel(items: RawItem[], brandingName: string = 'Restoran') {
  const rows = items.map((item, index) => ({
    'No': index + 1,
    'Kode Barang': item.code || item.id,
    'Nama Bahan Baku': item.name,
    'Kategori': item.category,
    'Satuan Unit': item.unit,
    'Stok Saat Ini': item.currentStock,
    'Batas Stok Minimum': item.minimumStock,
    'Harga Beli / HPP Satuan (Rp)': item.costPerUnit,
    'Total Nilai Stok (Rp)': Math.round(item.currentStock * item.costPerUnit),
    'Lokasi Penyimpanan': item.location,
    'Status Stok': item.currentStock <= item.minimumStock ? 'KRITIKAL (< Min Stok)' : 'Aman',
    'Terakhir Diperbarui': item.lastUpdated || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Info': 'Belum ada data bahan baku di sistem' }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Bahan Baku');

  // Auto column width
  const maxProps = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length + 3, 15)
  }));
  worksheet['!cols'] = maxProps;

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Master_Data_Bahan_Baku_${brandingName.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
}

/**
 * Utility to generate and download standardized Excel Import Template (.xlsx)
 * Specially tailored for bulk raw items upload with auto-code support!
 */
export function downloadRawItemsTemplateExcel(brandingName: string = 'Restoran') {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Template Data Siap Isi
  // Note: Kolom "Kode Barang (Opsional)" boleh dikosongkan agar otomatis diisi oleh sistem (BB-001, dst)
  const templateRows = [
    {
      'Kode Barang (Opsional)': 'BB-001',
      'Nama Bahan Baku (Wajib)': 'Daging Sapi Sirloin Australia',
      'Kategori': 'Daging & Seafood',
      'Satuan Unit': 'kg',
      'Stok Saat Ini': 15,
      'Batas Stok Minimum': 3,
      'Harga Beli / HPP Satuan (Rp)': 145000,
      'Lokasi Penyimpanan': 'Chiller / Freezer'
    },
    {
      'Kode Barang (Opsional)': '', // KOSONG -> Akan otomatis diisi BB-XXX oleh sistem
      'Nama Bahan Baku (Wajib)': 'Beras Organik Pandan Wangi',
      'Kategori': 'Bahan Baku Kering',
      'Satuan Unit': 'kg',
      'Stok Saat Ini': 50,
      'Batas Stok Minimum': 10,
      'Harga Beli / HPP Satuan (Rp)': 16000,
      'Lokasi Penyimpanan': 'Gudang Central'
    },
    {
      'Kode Barang (Opsional)': '', // KOSONG -> Akan otomatis diisi BB-XXX oleh sistem
      'Nama Bahan Baku (Wajib)': 'Minyak Goreng Sawit 2L',
      'Kategori': 'Bahan Baku Basah',
      'Satuan Unit': 'liter',
      'Stok Saat Ini': 30,
      'Batas Stok Minimum': 6,
      'Harga Beli / HPP Satuan (Rp)': 17500,
      'Lokasi Penyimpanan': 'Kitchen'
    },
    {
      'Kode Barang (Opsional)': '', // KOSONG -> Akan otomatis diisi BB-XXX oleh sistem
      'Nama Bahan Baku (Wajib)': 'Saus Barbeque Special',
      'Kategori': 'Bumbu & Saus',
      'Satuan Unit': 'liter',
      'Stok Saat Ini': 8,
      'Batas Stok Minimum': 2,
      'Harga Beli / HPP Satuan (Rp)': 32000,
      'Lokasi Penyimpanan': 'Kitchen'
    },
    {
      'Kode Barang (Opsional)': '', // KOSONG -> Akan otomatis diisi BB-XXX oleh sistem
      'Nama Bahan Baku (Wajib)': 'Cup Dingin Takeaway 16oz',
      'Kategori': 'Packaging & Supplies',
      'Satuan Unit': 'pcs',
      'Stok Saat Ini': 300,
      'Batas Stok Minimum': 50,
      'Harga Beli / HPP Satuan (Rp)': 650,
      'Lokasi Penyimpanan': 'Floor / Bar'
    }
  ];

  const templateSheet = XLSX.utils.json_to_sheet(templateRows);
  templateSheet['!cols'] = [
    { wch: 24 }, // Kode Barang (Opsional)
    { wch: 32 }, // Nama Bahan Baku (Wajib)
    { wch: 22 }, // Kategori
    { wch: 14 }, // Satuan Unit
    { wch: 16 }, // Stok Saat Ini
    { wch: 22 }, // Batas Stok Minimum
    { wch: 26 }, // Harga Beli / HPP Satuan (Rp)
    { wch: 22 }, // Lokasi Penyimpanan
  ];
  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Template Impor Bahan Baku');

  // Sheet 2: Panduan & Nilai Valid
  const guideRows = [
    ['PANDUAN PENGISIAN TEMPLATE IMPOR BAHAN BAKU RESTORAN'],
    ['1. Kolom "Kode Barang (Opsional)" BOLEH DIKOSONGKAN. Jika kosong, sistem otomatis membuat kode berurutan (BB-001, BB-002, dst).'],
    ['2. Kolom "Nama Bahan Baku (Wajib)" harus diisi dengan nama bahan yang jelas.'],
    ['3. Kolom "Kategori" boleh dipilih dari daftar resmi di bawah ini ATAU ketik kategori baru secara bebas (sistem otomatis mencatat kategori baru).'],
    ['4. Kolom "Satuan Unit" harus sesuai salah satu satuan unit standar di bawah ini.'],
    ['5. Kolom "Lokasi Penyimpanan" harus sesuai salah satu area penyimpanan di bawah.'],
    ['6. Kolom Angka (Stok, Min Stok, Harga) cukup tulis angka murni tanpa titik/koma/Rp.'],
    [],
    ['DAFTAR KATEGORI RESMI', 'DAFTAR SATUAN RESMI', 'DAFTAR LOKASI RESMI'],
    ['Bahan Baku Basah', 'kg', 'Kitchen'],
    ['Bahan Baku Kering', 'gram', 'Floor / Bar'],
    ['Bumbu & Saus', 'liter', 'Bar'],
    ['Dairy & Telur', 'ml', 'Floor'],
    ['Daging & Seafood', 'pcs', 'Gudang'],
    ['Minuman & Sirup', 'pack', 'Gudang Central'],
    ['Packaging & Supplies', 'can', 'Chiller / Freezer'],
    ['Perlengkapan Floor', 'portion', ''],
    ['Powder', 'Galon', ''],
    ['Sayuran', 'Tabung', ''],
    ['Buah', '', ''],
    ['Syrup', '', ''],
    ['Coffee Beans', '', '']
  ];
  const guideSheet = XLSX.utils.aoa_to_sheet(guideRows);
  guideSheet['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Panduan Nilai Valid');

  XLSX.writeFile(workbook, `Template_Impor_Bahan_Baku_${brandingName.replace(/\s+/g, '_')}.xlsx`);
}

/**
 * Utility to export all Master Menu Items to Excel (.xlsx)
 */
export function exportMenuItemsToExcel(items: MenuItem[], brandingName: string = 'Restoran') {
  const rows = items.map((item, index) => ({
    'No': index + 1,
    'Kode Menu': item.code || item.id,
    'Nama Menu': item.name,
    'Kategori': item.category,
    'Harga Jual (Rp)': item.sellingPrice,
    'HPP Resep (Rp)': Math.round(item.totalHPP || 0),
    'Margin Keuntungan (%)': Math.round(item.marginPercentage || 0),
    'Jumlah Bahan Resep': item.recipes?.length || 0,
    'Status Menu': item.isActive ? 'Aktif' : 'Non-Aktif',
    'Status Stok': item.isSoldOut ? 'Habis (Sold Out)' : 'Tersedia',
    'Batas Porsi Harian': item.soldLimit !== null && item.soldLimit !== undefined ? item.soldLimit : 'Tanpa Batas'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'Info': 'Belum ada data menu di sistem' }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Menu & Resep');

  const maxProps = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length + 3, 16)
  }));
  worksheet['!cols'] = maxProps;

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Master_Menu_Makanan_Minuman_${brandingName.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
}

/**
 * Utility to generate and download standardized Menu Import Template (.xlsx)
 */
export function downloadMenuItemsTemplateExcel(brandingName: string = 'Restoran') {
  const workbook = XLSX.utils.book_new();

  const templateRows = [
    {
      'Kode Menu (Opsional)': 'MN-001',
      'Nama Menu (Wajib)': 'Nasi Goreng Spesial Imah Kayu',
      'Kategori': 'Makanan',
      'Harga Jual (Rp)': 35000,
      'Batas Porsi Harian (Opsional)': 50
    },
    {
      'Kode Menu (Opsional)': '',
      'Nama Menu (Wajib)': 'Es Kopi Susu Gula Aren',
      'Kategori': 'Minuman',
      'Harga Jual (Rp)': 22000,
      'Batas Porsi Harian (Opsional)': ''
    },
    {
      'Kode Menu (Opsional)': '',
      'Nama Menu (Wajib)': 'Pisang Goreng Keju Coklat',
      'Kategori': 'Camilan / Dessert',
      'Harga Jual (Rp)': 18000,
      'Batas Porsi Harian (Opsional)': ''
    }
  ];

  const templateSheet = XLSX.utils.json_to_sheet(templateRows);
  templateSheet['!cols'] = [
    { wch: 22 },
    { wch: 35 },
    { wch: 20 },
    { wch: 18 },
    { wch: 28 }
  ];
  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Template Menu');

  const guideRows = [
    ['PANDUAN PENGISIAN TEMPLATE IMPOR MENU MAKANAN & MINUMAN'],
    ['1. Kolom "Kode Menu (Opsional)" boleh dikosongkan (otomatis diisi MN-001, MN-002, dst).'],
    ['2. Kolom "Kategori" harus diisi: Makanan, Minuman, Camilan / Dessert, atau Paket Hemat.'],
    ['3. Kolom "Harga Jual (Rp)" cukup ditulis angka murni tanpa titik/koma/Rp.'],
    ['4. Bahan baku resep per menu dapat dihubungkan di halaman Resep & HPP setelah menu diimpor.']
  ];
  const guideSheet = XLSX.utils.aoa_to_sheet(guideRows);
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Panduan');

  XLSX.writeFile(workbook, `Template_Impor_Menu_${brandingName.replace(/\s+/g, '_')}.xlsx`);
}
