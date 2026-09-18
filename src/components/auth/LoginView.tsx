import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { 
  LogIn, 
  KeyRound, 
  ShieldCheck, 
  Store, 
  User as UserIcon, 
  AlertCircle, 
  Eye,
  EyeOff,
  Lock,
  Users
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { users, login, branding } = useResto();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAccountList, setShowAccountList] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Silakan masukkan Username atau ID Karyawan Anda.');
      return;
    }
    if (!password) {
      setErrorMsg('Silakan masukkan kata sandi (password) akun Anda.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      if (!res.success) {
        setErrorMsg(res.message);
      }
      setLoading(false);
    }, 250);
  };

  const handleQuickSelect = (uUsername: string) => {
    const targetUser = users.find(u => u.username === uUsername);
    if (targetUser) {
      setUsername(targetUser.username);
      setPassword('');
      setErrorMsg(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Background Subtle Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10">
        
        {/* Brand Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 text-center relative border-b border-slate-800">
          {branding.logoType === 'custom_image' && branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.systemName}
              className="inline-block w-16 h-16 rounded-2xl object-contain bg-white shadow-lg mb-3 border border-slate-700 p-1"
            />
          ) : (
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${branding.logoColorGradient || 'from-amber-500 to-red-600'} text-white font-black text-2xl shadow-lg mb-3 tracking-tighter`}>
              {branding.logoInitials || 'RO'}
            </div>
          )}
          <h1 className="text-xl font-black tracking-tight text-white">{branding.systemName}</h1>
          <p className="text-xs text-amber-400 font-medium mt-0.5">{branding.systemTagline}</p>
          <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-300">{branding.outletName}</span>
            {branding.outletCity && (
              <>
                <span className="text-slate-600">•</span>
                <span>{branding.outletCity}</span>
              </>
            )}
          </p>
        </div>

        {/* Security Info Header */}
        <div className="bg-amber-50/90 border-b border-amber-200/60 px-6 py-2.5 flex items-center justify-center gap-2 text-[11px] font-semibold text-amber-900">
          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Autentikasi Wajib: Mencegah penyalahgunaan wewenang staf</span>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="text-center">
            <h2 className="text-base font-extrabold text-slate-900">Masuk ke Akun Operasional</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan Username / ID Karyawan dan kata sandi Anda
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Username / Email / ID Karyawan
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: kasir / EMP-2026-001"
                  autoFocus
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50 focus:bg-white transition-all"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password akun Anda"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50 focus:bg-white transition-all"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
            </button>
          </form>

          {/* Quick Account Selector (Allows filling username easily on touch screens, but requires entering password) */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAccountList(!showAccountList)}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/50 text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>{showAccountList ? 'Tutup Daftar Akun Terdaftar' : 'Buka Daftar Akun Karyawan Terdaftar'}</span>
            </button>

            {showAccountList && (
              <div className="mt-2.5 space-y-2 animate-in fade-in">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  Klik foto/nama untuk mengisi username otomatis
                </span>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {users.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        handleQuickSelect(u.username);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                        username === u.username
                          ? 'border-amber-500 bg-amber-50/80 text-slate-900 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-300 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold truncate leading-tight flex items-center gap-1">
                          <span>{u.name.split(' ')[0]}</span>
                          {u.isMasterAdmin && (
                            <span className="text-[8px] px-1 bg-amber-200 text-amber-900 rounded font-black">
                              Master
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-500 truncate">
                          {u.roleTitle.split(' ')[0]}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-2 rounded-lg bg-slate-50 text-[10px] text-slate-500 text-center">
                  Setiap staf wajib memasukkan kata sandi pribadi untuk memverifikasi wewenang akses.
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      <div className="text-center text-xs text-slate-500 mt-6 space-y-1">
        <p>RestoOps &bull; Multi-User Integrated Restaurant Management System</p>
        <p className="text-[11px] text-slate-600">Admin Master memiliki otoritas penuh untuk reset password & pengaturan hak akses staf.</p>
      </div>

    </div>
  );
};
