import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { 
  Bell, 
  Store, 
  UserCheck, 
  AlertTriangle, 
  RefreshCw, 
  ChevronDown, 
  ShieldAlert,
  Clock,
  Sparkles,
  KeyRound,
  LogOut,
  ShieldCheck,
  PackageMinus,
  Lock,
  Shield,
  UserCog
} from 'lucide-react';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { UserProfileModal } from '../auth/UserProfileModal';
import { ResetDataModal } from '../settings/ResetDataModal';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    notifications, 
    markNotificationAsRead, 
    setActiveTab, 
    logout,
    rolePermissions,
    branding,
    dbSyncStatus
  } = useResto();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const canAccessSettings = currentUser.isMasterAdmin || 
    (rolePermissions[currentUser.role] || []).includes('access_control');

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'head_kitchen':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'head_floor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'kasir':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'staff':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Outlet */}
          <div className="flex items-center gap-3">
            {branding.logoType === 'custom_image' && branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={branding.systemName} 
                className="w-10 h-10 rounded-xl object-contain bg-white shadow-xs border border-slate-200 p-0.5 shrink-0" 
              />
            ) : (
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${branding.logoColorGradient || 'from-amber-500 to-red-600'} flex items-center justify-center text-white font-black text-xl shadow-sm tracking-tighter shrink-0`}>
                {branding.logoInitials || 'RO'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">{branding.systemName}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Live System
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{branding.outletName}</span>
                <span className="text-slate-300">•</span>
                {dbSyncStatus.isConnected ? (
                  <span 
                    className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md font-bold text-[10px]"
                    title={`Database Terpusat Aktif: Sinkronisasi real-time terhubung dengan ${dbSyncStatus.activeDevices} perangkat di LAN.`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>LAN DB Online ({dbSyncStatus.activeDevices} Dev)</span>
                  </span>
                ) : (
                  <span 
                    className="flex items-center gap-1 text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md font-medium text-[10px]"
                    title="Menjalankan cache lokal perangkat"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Lokal Cache</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Bar: Notifications, Quick User Switcher, Actions */}
          <div className="flex items-center gap-3">
            
            {/* Reset Data Button */}
            <button
              onClick={() => setShowResetModal(true)}
              title="Pusat Reset & Pembersihan Data (Buat Jadi 0 / Pulihkan Demo)"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-xl transition-all"
            >
              <PackageMinus className="w-3.5 h-3.5 text-red-600" />
              <span>Reset & Kosongkan Data</span>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Notifikasi Real-time"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full ring-2 ring-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h4 className="font-bold text-sm text-slate-900">Notifikasi Operasional</h4>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {unreadCount} Baru
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Tidak ada peringatan aktif. Semua stok & operasional aman!
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-3.5 hover:bg-slate-50 transition-colors flex gap-3 items-start ${!notif.isRead ? 'bg-amber-50/50' : ''}`}
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            if (notif.type === 'low_stock') setActiveTab('inventory');
                            if (notif.type === 'so_pending') setActiveTab('stockopname');
                            setShowNotifications(false);
                          }}
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${
                            notif.type === 'low_stock' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div className="flex-1 cursor-pointer">
                            <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {notif.timestamp}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setActiveTab('inventory');
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-1"
                    >
                      Buka Inventaris & Restock Bahan
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Active User Account Profile */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white transition-all text-left"
                title="Profil Akun Aktif"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                />
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(currentUser.role)}`}>
                      {currentUser.roleTitle.split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Akun Aktif</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Secure User Profile & Account Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in">
                  
                  {/* Current Authenticated User Info */}
                  <div className="px-4 pb-3 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 truncate">
                            {currentUser.name}
                          </h4>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 truncate">
                          @{currentUser.username}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(currentUser.role)}`}>
                            {currentUser.roleTitle}
                          </span>
                          {currentUser.isMasterAdmin && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              Master Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Current User */}
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-left"
                    >
                      <UserCog className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <span className="block font-bold text-slate-800">Biodata & Profil Saya</span>
                        <span className="text-[10px] text-slate-400">Ganti foto, nama, tanggal lahir, kontak</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowPasswordModal(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-left"
                    >
                      <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="block font-bold text-slate-800">Ganti Password Saya</span>
                        <span className="text-[10px] text-slate-400">Ubah kata sandi akun Anda</span>
                      </div>
                    </button>

                    {canAccessSettings && (
                      <button
                        onClick={() => {
                          setActiveTab('access_control');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-left"
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <span className="block font-bold text-slate-800">Hak Akses & Pengguna</span>
                          <span className="text-[10px] text-slate-400">Kustomisasi izin menu & identitas resto</span>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <span className="block font-bold text-red-700">Keluar (Logout)</span>
                        <span className="text-[10px] text-red-400">Akhiri sesi dan kunci sistem</span>
                      </div>
                    </button>
                  </div>

                  {/* Security Notice Box */}
                  <div className="mx-3 mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-500 leading-relaxed">
                    <p className="flex items-center gap-1 font-bold text-slate-700 mb-0.5">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>Keamanan Akun Terproteksi</span>
                    </p>
                    <span>Untuk berpindah ke akun staf atau divisi lain, Anda wajib <strong>Keluar (Logout)</strong> dan memasukkan password akun yang dituju.</span>
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Modals */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <ResetDataModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </header>
  );
};
