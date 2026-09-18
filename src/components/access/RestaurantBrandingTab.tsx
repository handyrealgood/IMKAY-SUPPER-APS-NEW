import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { 
  Store, 
  Upload, 
  Image as ImageIcon, 
  Palette, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Building2, 
  Eye, 
  Sparkles,
  Trash2,
  HelpCircle,
  Layers,
  FileText,
  Globe,
  X
} from 'lucide-react';
import { INITIAL_BRANDING } from '../../data/initialData';
import { compressImageFile } from '../../utils/imageCompressor';

const COLOR_PRESETS = [
  { label: 'Sunset Amber & Red', value: 'from-amber-500 to-red-600', preview: 'bg-gradient-to-br from-amber-500 to-red-600' },
  { label: 'Royal Blue & Indigo', value: 'from-blue-600 to-indigo-700', preview: 'bg-gradient-to-br from-blue-600 to-indigo-700' },
  { label: 'Forest Emerald & Teal', value: 'from-emerald-500 to-teal-700', preview: 'bg-gradient-to-br from-emerald-500 to-teal-700' },
  { label: 'Luxury Purple & Pink', value: 'from-purple-600 to-pink-600', preview: 'bg-gradient-to-br from-purple-600 to-pink-600' },
  { label: 'Executive Midnight Slate', value: 'from-slate-800 to-slate-950', preview: 'bg-gradient-to-br from-slate-800 to-slate-950' },
  { label: 'Warm Rose & Orange', value: 'from-rose-500 to-orange-500', preview: 'bg-gradient-to-br from-rose-500 to-orange-500' },
];

export const RestaurantBrandingTab: React.FC = () => {
  const { branding, updateBranding } = useResto();

  const [form, setForm] = useState({
    systemName: branding.systemName,
    systemTagline: branding.systemTagline,
    outletName: branding.outletName,
    outletCity: branding.outletCity,
    outletAddress: branding.outletAddress || '',
    logoType: branding.logoType,
    logoUrl: branding.logoUrl || '',
    logoInitials: branding.logoInitials,
    logoColorGradient: branding.logoColorGradient || 'from-amber-500 to-red-600',
  });

  const [logoMode, setLogoMode] = useState<'upload' | 'url' | 'initials'>(
    branding.logoType === 'custom_image' 
      ? (branding.logoUrl?.startsWith('data:') ? 'upload' : 'url')
      : 'initials'
  );

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // File Upload to Compressed DataURL (Base64)
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran file maksimal 8 MB.');
      return;
    }

    try {
      // Compress logo to 240x240 max (< 30KB)
      const compressed = await compressImageFile(file, 240, 240, 0.75);
      setForm(prev => ({
        ...prev,
        logoType: 'custom_image',
        logoUrl: compressed,
      }));
      setLogoMode('upload');
    } catch {
      alert('Gagal memproses gambar logo.');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding({
      systemName: form.systemName.trim() || 'RestoOps',
      systemTagline: form.systemTagline.trim() || 'Sistem Operasional Restoran',
      outletName: form.outletName.trim() || 'Outlet Senopati Utama',
      outletCity: form.outletCity.trim() || 'Jakarta',
      outletAddress: form.outletAddress.trim(),
      logoType: form.logoType,
      logoUrl: form.logoUrl,
      logoInitials: (form.logoInitials || 'RO').toUpperCase().slice(0, 3),
      logoColorGradient: form.logoColorGradient,
    });

    setSuccessMsg('Identitas sistem, nama outlet, dan logo restoran berhasil disimpan!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan nama sistem, nama outlet, dan logo ke konfigurasi default (RestoOps & Senopati)?')) {
      setForm({
        systemName: INITIAL_BRANDING.systemName,
        systemTagline: INITIAL_BRANDING.systemTagline,
        outletName: INITIAL_BRANDING.outletName,
        outletCity: INITIAL_BRANDING.outletCity,
        outletAddress: INITIAL_BRANDING.outletAddress || '',
        logoType: INITIAL_BRANDING.logoType,
        logoUrl: INITIAL_BRANDING.logoUrl || '',
        logoInitials: INITIAL_BRANDING.logoInitials,
        logoColorGradient: INITIAL_BRANDING.logoColorGradient || 'from-amber-500 to-red-600',
      });
      setLogoMode('initials');
      updateBranding(INITIAL_BRANDING);
      setSuccessMsg('Pengaturan identitas berhasil dikembalikan ke default.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900">Identitas Restoran, Nama Outlet & Logo</h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Master Admin Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuaikan nama sistem operasional, nama cabang/outlet Anda, serta upload logo resmi restoran Anda. Perubahan akan langsung tampil secara real-time di seluruh sistem (Header, Halaman Login, dan Kop Surat PDF).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Pulihkan Default</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Form Left (7 cols), Live Preview Right (5 cols) */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Inputs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Nama Sistem Operasional */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                1. Nama Sistem & Brand Restoran
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Sistem / Aplikasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.systemName}
                  onChange={(e) => setForm({ ...form, systemName: e.target.value })}
                  placeholder="Misal: Imah Kayu Jatinangor"
                  required
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Muncul di Header atas, sidebar, dan judul laporan keuangan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Slogan / Tagline Sistem
                </label>
                <input
                  type="text"
                  value={form.systemTagline}
                  onChange={(e) => setForm({ ...form, systemTagline: e.target.value })}
                  placeholder="Misal: Sistem Operasional Restoran"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Tampil di bawah logo pada halaman login staf.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Informasi Outlet / Cabang */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                2. Pengaturan Outlet / Cabang Restoran
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Cabang / Outlet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.outletName}
                  onChange={(e) => setForm({ ...form, outletName: e.target.value })}
                  placeholder="Misal: Outlet Senopati Utama"
                  required
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Ganti tulisan <em>Outlet Senopati Utama</em> menjadi nama outlet Anda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kota / Wilayah Cabang
                </label>
                <input
                  type="text"
                  value={form.outletCity}
                  onChange={(e) => setForm({ ...form, outletCity: e.target.value })}
                  placeholder="Misal: Jakarta Selatan / Surabaya"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Lokasi domisili cabang operasional.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Lengkap Outlet (Opsional)
              </label>
              <input
                type="text"
                value={form.outletAddress}
                onChange={(e) => setForm({ ...form, outletAddress: e.target.value })}
                placeholder="Misal: Jl. Senopati Raya No. 45, Kebayoran Baru, Jakarta Selatan"
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dicetak pada kop surat resmi laporan keuangan PDF.
              </p>
            </div>
          </div>

          {/* Section 3: Ganti Logo Restoran */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  3. Pengaturan Logo Restoran (Master Admin)
                </h4>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Bisa upload logo sendiri
              </span>
            </div>

            {/* Logo Mode Switcher */}
            <div className="grid grid-cols-3 gap-2 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setLogoMode('upload');
                  if (form.logoUrl) {
                    setForm(prev => ({ ...prev, logoType: 'custom_image' }));
                  }
                }}
                className={`py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                  logoMode === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLogoMode('url');
                  setForm(prev => ({ ...prev, logoType: 'custom_image' }));
                }}
                className={`py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                  logoMode === 'url'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Link URL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLogoMode('initials');
                  setForm(prev => ({ ...prev, logoType: 'initials' }));
                }}
                className={`py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                  logoMode === 'initials'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Monogram Warna</span>
              </button>
            </div>

            {/* Mode A: Upload File */}
            {logoMode === 'upload' && (
              <div className="space-y-3">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                    isDragging 
                      ? 'border-amber-500 bg-amber-50/50' 
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                >
                  {form.logoType === 'custom_image' && form.logoUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 p-1.5 shadow-xs flex items-center justify-center">
                        <img
                          src={form.logoUrl}
                          alt="Logo Preview"
                          className="max-w-full max-h-full object-contain rounded-xl"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Logo Berhasil Diunggah</p>
                        <p className="text-[11px] text-slate-400">Siap disimpan ke Master Admin</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all">
                          <span>Ganti Gambar</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForm(prev => ({ ...prev, logoUrl: '', logoType: 'initials' }));
                            setLogoMode('initials');
                          }}
                          className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <label className="cursor-pointer text-xs font-extrabold text-amber-700 hover:text-amber-800 underline">
                          <span>Klik untuk pilih file logo</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[11px] text-slate-500 mt-0.5">atau drag & drop file logo ke area ini</p>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Format disarankan: PNG (latar transparan), JPG, SVG. Maks 2 MB.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode B: URL Gambar */}
            {logoMode === 'url' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Direct Link / URL Gambar Logo
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.logoUrl}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        logoType: 'custom_image',
                        logoUrl: e.target.value
                      });
                    }}
                    placeholder="https://domain-resto.com/assets/logo.png"
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, logoUrl: '', logoType: 'initials' }))}
                      className="px-2.5 py-2 text-red-600 hover:bg-red-50 rounded-xl border border-red-200"
                      title="Hapus URL"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Contoh: Masukkan link gambar logo dari CDN, website resmi, atau image hosting.
                </p>
              </div>
            )}

            {/* Mode C: Monogram Inisial & Preset Warna */}
            {logoMode === 'initials' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Huruf Inisial Monogram (Maks 3 Huruf)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={form.logoInitials}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        logoType: 'initials',
                        logoInitials: e.target.value.toUpperCase()
                      });
                    }}
                    placeholder="RO"
                    className="w-32 text-center text-sm font-black tracking-wider px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilihan Palet Warna Gradien:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((preset) => {
                      const isSelected = form.logoColorGradient === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => {
                            setForm({
                              ...form,
                              logoType: 'initials',
                              logoColorGradient: preset.value
                            });
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            isSelected 
                              ? 'border-slate-900 bg-slate-900 text-white shadow-xs' 
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg shrink-0 ${preset.preview}`} />
                          <span className="text-[11px] font-bold truncate">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-between">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Perubahan otomatis disimpan ke browser (LocalStorage).</span>
            </p>

            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Simpan Perubahan Identitas & Logo</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Real-Time Previews */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 space-y-4">
            
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Eye className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Live Preview (Pratinjau Nyata)
              </h4>
            </div>

            {/* Preview 1: Header Navigasi Atas */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-2 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  Tampilan Header Atas
                </span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Live Simulation</span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                {form.logoType === 'custom_image' && form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo"
                    className="w-10 h-10 rounded-xl object-contain bg-white shadow-xs border border-slate-200 p-0.5 shrink-0"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${form.logoColorGradient || 'from-amber-500 to-red-600'} flex items-center justify-center text-white font-black text-xl shadow-xs tracking-tighter shrink-0`}>
                    {(form.logoInitials || 'RO').toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 tracking-tight text-sm truncate">
                      {form.systemName || 'RestoOps'}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-white text-slate-700 border border-slate-200">
                      Live System
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                    <Store className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">{form.outletName || 'Outlet Senopati Utama'}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-600 font-medium shrink-0 flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview 2: Halaman Login Staf */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm text-center text-white space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>Tampilan Layar Login Staf</span>
                <span className="text-amber-400">Login Card</span>
              </div>

              <div className="py-2">
                {form.logoType === 'custom_image' && form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo Login"
                    className="inline-block w-14 h-14 rounded-2xl object-contain bg-white shadow-lg mb-2 border border-slate-700 p-1"
                  />
                ) : (
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${form.logoColorGradient || 'from-amber-500 to-red-600'} text-white font-black text-xl shadow-lg mb-2 tracking-tighter`}>
                    {(form.logoInitials || 'RO').toUpperCase()}
                  </div>
                )}
                <h5 className="font-black text-white text-sm tracking-tight">
                  {form.systemName || 'RestoOps'}
                </h5>
                <p className="text-[11px] text-amber-400 font-medium">
                  {form.systemTagline || 'Sistem Operasional Restoran'}
                </p>
                <div className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-2 px-2.5 py-1 bg-slate-800 rounded-full border border-slate-700">
                  <Store className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-slate-200 font-semibold">{form.outletName || 'Outlet Senopati Utama'}</span>
                  {form.outletCity && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span>{form.outletCity}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Preview 3: Kop Surat PDF Cetak */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 pb-2 border-b border-slate-200">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Kop Surat Laporan Keuangan PDF</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-0.5">
                <p className="text-xs font-black tracking-wider text-slate-900 uppercase">
                  {form.systemName ? form.systemName.toUpperCase() : 'RESTOOPS'}
                </p>
                <p className="text-[10px] font-bold text-slate-700">
                  LAPORAN KEUANGAN, COGS & ARUS KAS BULANAN
                </p>
                <p className="text-[9px] text-slate-500">
                  Cabang: {form.outletName || 'Outlet Senopati Utama'} ({form.outletCity || 'Jakarta'}) • {new Date().toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>

            {/* Preview 4: Tampilan Tab Browser (Favicon & Title Tab di Jaringan LAN) */}
            <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3.5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pb-1.5 border-b border-slate-200">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tab Browser & Favicon (Jaringan LAN)</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">
                  Auto-Sync LAN
                </span>
              </div>

              {/* Realistic Browser Tab Mockup */}
              <div className="bg-slate-200/80 p-2 rounded-xl border border-slate-300">
                <div className="flex items-center gap-2">
                  <div className="flex-1 max-w-[260px] bg-white rounded-t-lg px-2.5 py-1.5 border-t border-x border-slate-300 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {form.logoType === 'custom_image' && form.logoUrl ? (
                        <img
                          src={form.logoUrl}
                          alt="Favicon"
                          className="w-4 h-4 rounded-xs object-contain shrink-0"
                        />
                      ) : (
                        <div className={`w-4 h-4 rounded-xs bg-gradient-to-br ${form.logoColorGradient || 'from-emerald-500 to-teal-700'} flex items-center justify-center text-white font-black text-[9px] shrink-0`}>
                          {(form.logoInitials || 'RO').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[11px] font-bold text-slate-800 truncate">
                        {form.outletName || form.systemName || 'Restoran'} • {form.systemName || 'Sistem Resto'}
                      </span>
                    </div>
                    <X className="w-3 h-3 text-slate-400 shrink-0 ml-1 hover:text-slate-600" />
                  </div>
                </div>
                <div className="bg-white rounded-b-lg rounded-tr-lg p-2 border border-slate-300 text-[10px] text-slate-500 flex items-center gap-2">
                  <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    http://192.168.1.xxx:3000
                  </span>
                  <span className="text-slate-400">• Logo otomatis tampil di tab browser seluruh perangkat LAN</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </form>

    </div>
  );
};
