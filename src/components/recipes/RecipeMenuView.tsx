import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useResto } from '../../context/RestoContext';
import { MenuItem, RecipeIngredient, ItemUnit } from '../../types';
import { 
  convertQuantity, 
  convertCostPerUnit, 
  getCompatibleUnits 
} from '../../utils/unitConversion';
import { exportMenuItemsToExcel, downloadMenuItemsTemplateExcel } from '../../utils/excelExport';
import { 
  ChefHat, 
  Plus, 
  Trash2, 
  Search, 
  Scale, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  CheckCircle,
  HelpCircle,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Camera,
  Upload,
  X,
  Utensils,
  FileSpreadsheet,
  Download,
  FileCheck,
  RotateCcw
} from 'lucide-react';

export const RecipeMenuView: React.FC = () => {
  const { 
    menuItems, 
    rawItems, 
    addMenuItem, 
    bulkAddMenuItems,
    deleteMenuItem,
    currentUser,
    formatRupiah, 
    calculateRecipeHPP,
    branding
  } = useResto();

  const isManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMenuDetail, setSelectedMenuDetail] = useState<MenuItem | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<MenuItem | null>(null);

  // Excel Export & Import States
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [parsedImportMenus, setParsedImportMenus] = useState<Array<{
    code: string;
    isAutoCode: boolean;
    name: string;
    category: 'Makanan' | 'Minuman' | 'Camilan / Dessert' | 'Paket Hemat';
    sellingPrice: number;
    soldLimit?: number | null;
    isValid: boolean;
  }>>([]);

  const handleDeleteMenu = (menu: MenuItem) => {
    setMenuToDelete(menu);
  };

  const confirmDelete = () => {
    if (!menuToDelete) return;
    deleteMenuItem(menuToDelete.id);
    if (selectedMenuDetail?.id === menuToDelete.id) {
      setSelectedMenuDetail(null);
    }
    setMenuToDelete(null);
  };

  // Form states for new Menu
  const [menuCode, setMenuCode] = useState('');
  const [menuName, setMenuName] = useState('');
  const [menuCategory, setMenuCategory] = useState<'Makanan' | 'Minuman' | 'Camilan / Dessert' | 'Paket Hemat'>('Makanan');
  const [sellingPrice, setSellingPrice] = useState<number>(35000);
  const [menuImage, setMenuImage] = useState<string>('');
  const [recipes, setRecipes] = useState<RecipeIngredient[]>([]);

  // State for adding an ingredient to recipe
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [ingredientAmount, setIngredientAmount] = useState<number>(100);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMenuImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const selectedRawItem = rawItems.find(r => r.id === selectedItemId);
  const availableUnits = selectedRawItem ? getCompatibleUnits(selectedRawItem.unit) : [];

  // When selectedItemId changes, auto-set default unit (e.g. gram for kg, ml for liter)
  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    const raw = rawItems.find(r => r.id === itemId);
    if (raw) {
      if (raw.unit.toLowerCase() === 'kg') {
        setSelectedUnit('gram');
        setIngredientAmount(150);
      } else if (raw.unit.toLowerCase() === 'liter') {
        setSelectedUnit('ml');
        setIngredientAmount(200);
      } else {
        setSelectedUnit(raw.unit);
        setIngredientAmount(1);
      }
    } else {
      setSelectedUnit('');
    }
  };

  // Auto-calculated HPP for form
  const currentFormHPP = calculateRecipeHPP(recipes);
  const calculatedMargin = sellingPrice > 0 
    ? Number((((sellingPrice - currentFormHPP) / sellingPrice) * 100).toFixed(1))
    : 0;
  const foodCostRatio = sellingPrice > 0 
    ? Number(((currentFormHPP / sellingPrice) * 100).toFixed(1))
    : 0;

  // Recommended selling price at 32% target food cost
  const recommendedSellingPrice = currentFormHPP > 0 ? Math.round(currentFormHPP / 0.32 / 1000) * 1000 : 0;

  // Add ingredient to recipe list with automatic unit conversion
  const handleAddIngredient = () => {
    if (!selectedItemId || ingredientAmount <= 0) return;
    const raw = rawItems.find(r => r.id === selectedItemId);
    if (!raw) return;

    // Check if already in recipe
    if (recipes.some(r => r.itemId === raw.id)) {
      alert('Bahan ini sudah ada di dalam resep. Silakan ubah jumlahnya atau hapus dulu.');
      return;
    }

    const unitToUse = (selectedUnit || raw.unit) as ItemUnit;
    const baseAmount = convertQuantity(ingredientAmount, unitToUse, raw.unit);
    const subtotal = baseAmount * raw.costPerUnit;

    const newIngredient: RecipeIngredient = {
      itemId: raw.id,
      itemName: raw.name,
      amount: Number(ingredientAmount),
      unit: unitToUse,
      baseAmount,
      baseUnit: raw.unit,
      costPerUnit: raw.costPerUnit,
      subtotalCost: subtotal,
    };

    setRecipes([...recipes, newIngredient]);
    setSelectedItemId('');
    setSelectedUnit('');
    setIngredientAmount(100);
  };

  const handleRemoveIngredient = (itemId: string) => {
    setRecipes(recipes.filter(r => r.itemId !== itemId));
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName.trim()) return;
    if (recipes.length === 0) {
      alert('Tambahkan minimal 1 bahan baku ke dalam resep menu!');
      return;
    }

    const code = menuCode.trim() || `MN-${String(menuItems.length + 1).padStart(3, '0')}`;
    const totalHPP = calculateRecipeHPP(recipes);
    const margin = sellingPrice > 0 
      ? Number((((sellingPrice - totalHPP) / sellingPrice) * 100).toFixed(1))
      : 0;

    addMenuItem({
      code,
      name: menuName.trim(),
      category: menuCategory,
      sellingPrice: Number(sellingPrice),
      recipes,
      totalHPP,
      marginPercentage: margin,
      isActive: true,
      image: menuImage.trim() || undefined,
    });

    // Reset Form
    setShowAddModal(false);
    setMenuCode('');
    setMenuName('');
    setMenuImage('');
    setRecipes([]);
    setSellingPrice(35000);
  };

  // Handle Excel Menu Upload
  const handleMenuFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    if ('dataTransfer' in e) {
      e.preventDefault();
      file = e.dataTransfer.files?.[0] || null;
    } else {
      file = e.target.files?.[0] || null;
    }

    if (!file) return;
    setImportFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('template') || n.toLowerCase().includes('menu')) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          setImportError('Sheet data tidak ditemukan di dalam file Excel.');
          return;
        }

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        if (!rawRows || rawRows.length === 0) {
          setImportError('Tidak ada baris data menu di dalam file Excel.');
          return;
        }

        const getVal = (row: any, candidates: string[]) => {
          const keys = Object.keys(row);
          for (const candidate of candidates) {
            const matchedKey = keys.find(k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, '').includes(candidate));
            if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
              return String(row[matchedKey]).trim();
            }
          }
          return '';
        };

        let nextNum = 1;
        menuItems.forEach(it => {
          const match = it.code?.match(/MN-(\d+)/i);
          if (match) {
            const n = parseInt(match[1], 10);
            if (!isNaN(n) && n >= nextNum) nextNum = n + 1;
          }
        });

        const parsed: Array<{
          code: string;
          isAutoCode: boolean;
          name: string;
          category: 'Makanan' | 'Minuman' | 'Camilan / Dessert' | 'Paket Hemat';
          sellingPrice: number;
          soldLimit?: number | null;
          isValid: boolean;
        }> = [];

        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];
          const firstVal = Object.values(row)[0];
          if (typeof firstVal === 'string' && (
            firstVal.toLowerCase().includes('panduan') || 
            firstVal.toLowerCase().includes('wajib')
          )) {
            continue;
          }

          const rawCode = getVal(row, ['kodemenu', 'kode', 'code', 'kodemakanan']);
          const rawName = getVal(row, ['namamenu', 'nama', 'namamakanan', 'itemname', 'name']);

          if (!rawName) continue;

          let finalCode = rawCode;
          let isAuto = false;
          if (!finalCode) {
            finalCode = `MN-${String(nextNum++).padStart(3, '0')}`;
            isAuto = true;
          }

          const rawCat = getVal(row, ['kategori', 'category']).toLowerCase();
          let category: 'Makanan' | 'Minuman' | 'Camilan / Dessert' | 'Paket Hemat' = 'Makanan';
          if (rawCat.includes('minum')) category = 'Minuman';
          else if (rawCat.includes('camil') || rawCat.includes('snack') || rawCat.includes('dessert')) category = 'Camilan / Dessert';
          else if (rawCat.includes('paket') || rawCat.includes('hemat') || rawCat.includes('combo')) category = 'Paket Hemat';
          else category = 'Makanan';

          const rawPrice = getVal(row, ['hargajual', 'harga', 'sellingprice', 'price']);
          const cleanPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;

          const rawLimit = getVal(row, ['batasporsi', 'limit', 'soldlimit']);
          const cleanLimit = rawLimit ? parseInt(rawLimit.replace(/[^0-9]/g, ''), 10) : null;

          parsed.push({
            code: finalCode,
            isAutoCode: isAuto,
            name: rawName,
            category,
            sellingPrice: cleanPrice > 0 ? cleanPrice : 25000,
            soldLimit: cleanLimit && !isNaN(cleanLimit) ? cleanLimit : null,
            isValid: Boolean(rawName && finalCode)
          });
        }

        if (parsed.length === 0) {
          setImportError('Tidak ada data menu valid yang dapat dibaca dari file Excel. Pastikan kolom "Nama Menu" terisi.');
          return;
        }

        setParsedImportMenus(parsed);
      } catch (err: any) {
        console.error('Failed to parse Excel file:', err);
        setImportError('Gagal memproses file Excel. Pastikan file berformat .xlsx, .xls, atau .csv yang valid.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmMenuImport = () => {
    if (parsedImportMenus.length === 0) return;

    const itemsToSave = parsedImportMenus.map(p => ({
      code: p.code,
      name: p.name,
      category: p.category,
      sellingPrice: p.sellingPrice,
      recipes: [],
      totalHPP: 0,
      marginPercentage: 100,
      isActive: true,
      soldLimit: p.soldLimit,
    }));

    const { addedCount, updatedCount } = bulkAddMenuItems(itemsToSave);

    setActionMessage(`Sukses! ${addedCount} menu baru ditambahkan & ${updatedCount} menu diperbarui via Excel.`);
    setShowImportModal(false);
    setParsedImportMenus([]);
    setImportFileName('');
    setImportError(null);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const filteredMenus = menuItems.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button 
            onClick={() => setActionMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-sm font-black p-1"
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Manajemen Menu & Kalkulasi HPP Resep</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {menuItems.length} Menu Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tentukan bahan baku & gramasi per porsi untuk kalkulasi Harga Pokok Penjualan (HPP / Food Cost) otomatis dan presisi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Export Excel Button with Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportModal(prev => !prev)}
              className="flex-1 sm:flex-initial px-3.5 py-2 border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              title="Export data menu ke Excel atau unduh template"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            {showExportModal && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 animate-in fade-in duration-150">
                <button
                  onClick={() => {
                    exportMenuItemsToExcel(menuItems, branding?.systemName || branding?.outletName || 'Restoran');
                    setShowExportModal(false);
                    setActionMessage('Berhasil mengekspor master menu ke file Excel (.xlsx).');
                    setTimeout(() => setActionMessage(null), 3500);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <div>
                    <span className="block">Export Menu Makanan & Minuman (.xlsx)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Unduh {menuItems.length} menu yang terdaftar</span>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => {
                    downloadMenuItemsTemplateExcel(branding?.systemName || branding?.outletName || 'Restoran');
                    setShowExportModal(false);
                    setActionMessage('Template Excel impor menu berhasil diunduh.');
                    setTimeout(() => setActionMessage(null), 3500);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  <div>
                    <span className="block">Unduh Format Template Menu Excel</span>
                    <span className="text-[10px] text-slate-400 font-normal">Format siap isi + kode auto & panduan</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Upload / Impor Excel Button */}
          <button
            onClick={() => {
              setShowImportModal(true);
              setParsedImportMenus([]);
              setImportFileName('');
              setImportError(null);
            }}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 ring-2 ring-emerald-600/30"
            title="Upload file Excel (.xlsx / .xls / .csv) untuk impor banyak menu sekaligus"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>Upload / Impor Excel</span>
          </button>

          {/* Buat Menu Baru Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-initial px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Menu & Resep Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama menu atau kode menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="all">Semua Kategori Menu</option>
            <option value="Makanan">Makanan</option>
            <option value="Minuman">Minuman</option>
            <option value="Camilan / Dessert">Camilan / Dessert</option>
            <option value="Paket Hemat">Paket Hemat</option>
          </select>
        </div>
      </div>

      {/* Grid of Menus with Recipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMenus.map(menu => (
          <div key={menu.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              {/* Header Image & Badge */}
              <div className="relative h-36 bg-slate-100 overflow-hidden">
                {menu.image ? (
                  <img
                    src={menu.image}
                    alt={menu.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <Utensils className="w-10 h-10 stroke-1 mb-1 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400">Tanpa Foto Menu</span>
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                    {menu.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/90 text-slate-800">
                    {menu.code}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <h3 className="font-black text-sm text-slate-900 leading-snug">{menu.name}</h3>
                
                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">HPP / Food Cost</span>
                    <strong className="text-slate-900 font-extrabold">{formatRupiah(menu.totalHPP)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Harga Jual</span>
                    <strong className="text-emerald-700 font-extrabold">{formatRupiah(menu.sellingPrice)}</strong>
                  </div>
                </div>

                {/* Profit Margin & Food Cost % */}
                <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Margin Keuntungan:</span>
                  <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    +{menu.marginPercentage}% ({formatRupiah(menu.sellingPrice - menu.totalHPP)})
                  </span>
                </div>

                {/* Recipe Ingredients Preview */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                    Komposisi Bahan ({menu.recipes.length} item):
                  </span>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {menu.recipes.map((r, i) => (
                      <div key={i} className="text-[11px] flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span className="text-slate-700 truncate mr-2">{r.itemName}</span>
                        <span className="font-semibold text-slate-500 shrink-0">
                          {r.amount} {r.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Otomatis potong stok saat terjual
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedMenuDetail(menu)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Rincian Gramasi &rarr;
                </button>
                {isManager && (
                  <button
                    onClick={() => handleDeleteMenu(menu)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus Menu & Resep HPP (Manager)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Menu & Resep Gramasi */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Form Input Menu & Gramasi Resep</h3>
                  <p className="text-xs text-slate-500">Kalkulasi HPP per porsi akurat & otomatis</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Quick Banner to Switch to Excel Upload */}
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-950">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-semibold">Punya banyak daftar menu di Excel?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowImportModal(true);
                  setParsedImportMenus([]);
                  setImportFileName('');
                  setImportError(null);
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shrink-0 transition-colors shadow-2xs cursor-pointer"
              >
                Upload Excel
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-4 mt-3 text-xs">
              {/* Menu Info Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Menu</label>
                  <input
                    type="text"
                    placeholder="Auto: MN-006"
                    value={menuCode}
                    onChange={(e) => setMenuCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Menu <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ayam Bakar Bumbu Rujak"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Menu</label>
                  <select
                    value={menuCategory}
                    onChange={(e) => setMenuCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Camilan / Dessert">Camilan / Dessert</option>
                    <option value="Paket Hemat">Paket Hemat</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rencana Harga Jual (Rp) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-emerald-700 text-sm"
                  />
                </div>
              </div>

              {/* Upload Foto Menu (Opsional: Boleh upload foto boleh tidak) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Foto Menu (Opsional: Boleh upload foto, boleh tidak)</span>
                  </label>
                  {menuImage && (
                    <button
                      type="button"
                      onClick={() => setMenuImage('')}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {menuImage ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white">
                      <img src={menuImage} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-white shrink-0">
                      <Utensils className="w-6 h-6 stroke-1 mb-0.5" />
                      <span className="text-[9px]">Tanpa Foto</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Pilih Foto dari Perangkat</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="url"
                      placeholder="Atau tempel URL gambar (opsional)..."
                      value={menuImage}
                      onChange={(e) => setMenuImage(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Recipe Ingredients Builder Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-amber-600" />
                    Pilih Bahan Baku & Tentukan Gramasi per Porsi
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {recipes.length} Bahan Terpilih
                  </span>
                </div>

                {/* Add Ingredient Line with Unit Selection & Auto Conversion */}
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Bahan Baku Tersedia</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => handleItemSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    >
                      <option value="">-- Pilih Bahan Baku dari Stok --</option>
                      {rawItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({formatRupiah(item.costPerUnit)}/{item.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Takaran / Gramasi</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={ingredientAmount}
                        onChange={(e) => setIngredientAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Pilihan Satuan</label>
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      disabled={!selectedItemId}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {availableUnits.map(u => (
                        <option key={u.unit} value={u.unit}>{u.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    disabled={!selectedItemId || ingredientAmount <= 0}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    + Tambah ke Resep
                  </button>
                </div>

                {/* Live conversion helper */}
                {selectedRawItem && (
                  <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-amber-900">
                    <div className="flex flex-wrap items-center gap-1.5 font-medium">
                      <span className="font-bold text-amber-950">⚡ Konversi Otomatis ke Bahan Baku:</span>
                      <span className="font-semibold">{ingredientAmount} {selectedUnit || selectedRawItem.unit}</span>
                      <ArrowRight className="w-3 h-3 text-amber-600" />
                      <span className="font-black text-amber-950">
                        {convertQuantity(ingredientAmount, (selectedUnit || selectedRawItem.unit) as ItemUnit, selectedRawItem.unit).toFixed(3)} {selectedRawItem.unit}
                      </span>
                      <span className="text-slate-500">(@ {formatRupiah(selectedRawItem.costPerUnit)}/{selectedRawItem.unit})</span>
                    </div>
                    <div className="font-black text-slate-900 text-xs shrink-0">
                      Subtotal HPP: {formatRupiah(convertQuantity(ingredientAmount, (selectedUnit || selectedRawItem.unit) as ItemUnit, selectedRawItem.unit) * selectedRawItem.costPerUnit)}
                    </div>
                  </div>
                )}

                {/* Table of selected ingredients */}
                {recipes.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-3">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="py-2 px-3">Bahan Baku</th>
                          <th className="py-2 px-3">Takaran Resep</th>
                          <th className="py-2 px-3">Konversi Master</th>
                          <th className="py-2 px-3">Biaya Satuan</th>
                          <th className="py-2 px-3">Biaya per Porsi (HPP)</th>
                          <th className="py-2 px-3 text-center">Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recipes.map(r => (
                          <tr key={r.itemId} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-900">{r.itemName}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{r.amount} {r.unit}</td>
                            <td className="py-2 px-3 text-slate-600">
                              {r.baseAmount !== undefined && r.baseUnit ? (
                                <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                  {r.baseAmount} {r.baseUnit}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-500">{formatRupiah(r.costPerUnit)}</td>
                            <td className="py-2 px-3 font-black text-slate-900">{formatRupiah(r.subtotalCost)}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(r.itemId)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>

              {/* Automatic HPP Calculation Card */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total HPP per Porsi</span>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {formatRupiah(currentFormHPP)}
                  </div>
                  <span className="text-[10px] text-slate-500">Terhitung otomatis dari gramasi</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Food Cost Ratio %</span>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">
                    {foodCostRatio}%
                  </div>
                  <span className="text-[10px] text-slate-500">Standar resto: 28% - 35%</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Rekomendasi Harga Jual</span>
                  <div className="text-xl font-black text-blue-700 mt-0.5">
                    {formatRupiah(recommendedSellingPrice)}
                  </div>
                  <span className="text-[10px] text-slate-500">Berdasarkan target 32% food cost</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={recipes.length === 0}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Simpan Menu & Resep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Rincian Menu */}
      {selectedMenuDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedMenuDetail.name}</h3>
                <span className="text-xs text-slate-500">{selectedMenuDetail.code} • {selectedMenuDetail.category}</span>
              </div>
              <button
                onClick={() => setSelectedMenuDetail(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Harga Jual Menu</span>
                  <strong className="text-base font-extrabold text-emerald-700">{formatRupiah(selectedMenuDetail.sellingPrice)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Total HPP per Porsi</span>
                  <strong className="text-base font-extrabold text-slate-900">{formatRupiah(selectedMenuDetail.totalHPP)}</strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1.5">Rincian Komposisi & Gramasi Bahan:</h4>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {selectedMenuDetail.recipes.map((r, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{r.itemName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span>Takaran:</span>
                          <span className="font-semibold text-slate-800">{r.amount} {r.unit}</span>
                          {r.baseAmount !== undefined && r.baseUnit && r.unit.toLowerCase() !== r.baseUnit.toLowerCase() && (
                            <span className="text-slate-400">(= {r.baseAmount} {r.baseUnit})</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-slate-800">{formatRupiah(r.subtotalCost)}</div>
                        <div className="text-[10px] text-slate-400">{formatRupiah(r.costPerUnit)}/{r.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              {isManager ? (
                <button
                  type="button"
                  onClick={() => handleDeleteMenu(selectedMenuDetail)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Menu Ini</span>
                </button>
              ) : <div />}
              <button
                onClick={() => setSelectedMenuDetail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Menu Resep HPP */}
      {menuToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Konfirmasi Hapus Item Menu</h3>
                <p className="text-xs text-slate-500">Resep HPP & database produk</p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/80 rounded-xl border border-rose-200 mb-4 space-y-2">
              <p className="text-sm font-bold text-rose-900">
                Anda yakin ingin menghapus item?
              </p>
              <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-rose-100 space-y-1">
                <div><span className="font-semibold text-slate-500">Nama Item:</span> <strong className="text-slate-900">{menuToDelete.name}</strong></div>
                <div><span className="font-semibold text-slate-500">Kode:</span> <span className="font-mono font-bold text-indigo-700">{menuToDelete.code}</span></div>
                <div><span className="font-semibold text-slate-500">Kategori:</span> <span className="font-medium text-slate-800">{menuToDelete.category}</span></div>
                <div><span className="font-semibold text-slate-500">HPP:</span> <span className="font-bold text-slate-900">{formatRupiah(menuToDelete.totalHPP)}</span></div>
                <div><span className="font-semibold text-slate-500">Harga Jual:</span> <span className="font-bold text-emerald-700">{formatRupiah(menuToDelete.sellingPrice)}</span></div>
              </div>
              <p className="text-[11px] text-rose-700 italic">
                Menu ini akan dihapus dari daftar menu aktif dan resep HPP.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setMenuToDelete(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Item</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impor / Upload File Excel Menu */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Upload & Impor Menu dari Excel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftarkan puluhan atau ratusan menu makanan & minuman sekaligus via file Excel (.xlsx / .xls / .csv)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setParsedImportMenus([]);
                  setImportFileName('');
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 py-4 overflow-y-auto flex-1 text-xs">
              {/* Step 1: Download Template Callout */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-blue-900 text-xs">
                    Belum punya format Excel yang sesuai?
                  </h4>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Unduh template resmi siap isi. Kode menu boleh dikosongkan agar otomatis diisi oleh sistem (MN-001, dst).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadMenuItemsTemplateExcel(branding?.systemName || branding?.outletName || 'Restoran')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shrink-0 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template</span>
                </button>
              </div>

              {/* Error Message */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="text-[11px] font-semibold">{importError}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              {parsedImportMenus.length === 0 ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleMenuFileUpload}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer relative group"
                >
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleMenuFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-slate-800 text-sm">
                    Tarik & Letakkan File Excel Menu Di Sini
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    atau klik untuk memilih file dari komputer / laptop Anda (.xlsx, .xls, .csv)
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 shadow-xs">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pilih File dari Perangkat</span>
                  </div>
                </div>
              ) : (
                /* Parsed Preview Section */
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-900 block text-xs">
                          {importFileName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {parsedImportMenus.length} menu berhasil dibaca & siap diimpor ke sistem
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label 
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer text-[11px] flex items-center gap-1.5 shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ganti File</span>
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleMenuFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-black sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">No</th>
                          <th className="py-2 px-2.5">Kode</th>
                          <th className="py-2 px-2.5">Nama Menu</th>
                          <th className="py-2 px-2.5">Kategori</th>
                          <th className="py-2 px-2.5 text-right">Harga Jual</th>
                          <th className="py-2 px-2.5 text-center">Batas Porsi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {parsedImportMenus.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-1.5 px-2.5">
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                                {item.code}
                              </span>
                              {item.isAutoCode && (
                                <span className="ml-1 text-[9px] text-amber-700 font-bold bg-amber-50 px-1 rounded-sm">
                                  Auto
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 font-bold text-slate-900">{item.name}</td>
                            <td className="py-1.5 px-2.5">
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-700">
                              {formatRupiah(item.sellingPrice)}
                            </td>
                            <td className="py-1.5 px-2.5 text-center text-slate-600">
                              {item.soldLimit !== null && item.soldLimit !== undefined ? `${item.soldLimit} porsi` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    * Catatan: Resep gramasi bahan baku per menu dapat dihubungkan kapan saja melalui tombol resep setelah menu diimpor.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400">
                {parsedImportMenus.length > 0 ? `${parsedImportMenus.length} item siap disimpan` : 'Belum ada data'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setParsedImportMenus([]);
                    setImportFileName('');
                    setImportError(null);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={parsedImportMenus.length === 0}
                  onClick={handleConfirmMenuImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Simpan & Impor {parsedImportMenus.length > 0 ? `(${parsedImportMenus.length} Menu)` : ''}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
