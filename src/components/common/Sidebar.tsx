import React from 'react';
import { useResto, NavigationTab } from '../../context/RestoContext';
import { 
  LayoutDashboard, 
  Package, 
  ChefHat, 
  Truck, 
  Trash2, 
  ShoppingCart, 
  ArrowLeftRight, 
  Receipt, 
  TrendingDown, 
  ClipboardCheck,
  AlertCircle,
  ShieldCheck,
  Store,
  ShoppingBag,
  Mail,
  Zap,
  Calendar,
  UserCheck
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    rawItems, 
    soRecords,
    internalMemos,
    purchasingOrders,
    rolePermissions,
    branding
  } = useResto();

  // Count items needing attention
  const lowStockCount = rawItems.filter(i => i.currentStock <= i.minimumStock).length;
  const pendingSOCount = soRecords.filter(s => s.status === 'Submitted').length;
  const unreadMemoCount = (internalMemos || []).filter(m => 
    (m.recipientId === currentUser.id || 
     m.recipientId === 'ALL' || 
     m.recipientRole === currentUser.role || 
     m.recipientId === `ROLE_${currentUser.role.toUpperCase()}`) &&
    !m.readBy.includes(currentUser.id)
  ).length;
  const pendingPurchasingCount = (purchasingOrders || []).filter(po => po.status === 'Diajukan').length;

  const allNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Live',
      icon: LayoutDashboard,
    },
    {
      id: 'pos',
      label: 'Point of Sales (POS)',
      icon: Store,
    },
    {
      id: 'inventory',
      label: 'Data Barang & Stok',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'recipes',
      label: 'Input Menu & HPP',
      icon: ChefHat,
    },
    {
      id: 'purchasing',
      label: 'Purchasing & PO',
      icon: ShoppingBag,
      badge: pendingPurchasingCount > 0 ? pendingPurchasingCount : undefined,
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'receiving',
      label: 'Receiving Supplier',
      icon: Truck,
    },
    {
      id: 'waste',
      label: 'Input Waste & Spoil',
      icon: Trash2,
    },
    {
      id: 'sales',
      label: 'Laporan Penjualan',
      icon: ShoppingCart,
    },
    {
      id: 'transfers',
      label: 'Transfer Antar Outlet',
      icon: ArrowLeftRight,
    },
    {
      id: 'memorandum',
      label: 'Memorandum Internal',
      icon: Mail,
      badge: unreadMemoCount > 0 ? unreadMemoCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'pettycash',
      label: 'Kas Kecil (Petty Cash)',
      icon: Receipt,
    },
    {
      id: 'variable_costs',
      label: 'Biaya Utilitas & Variabel',
      icon: Zap,
    },
    {
      id: 'schedules',
      label: 'Jadwal Kerja Karyawan',
      icon: Calendar,
    },
    {
      id: 'attendance',
      label: 'Absensi GPS & Selfie',
      icon: UserCheck,
    },
    {
      id: 'cogs',
      label: 'Laporan COGS & Tren',
      icon: TrendingDown,
    },
    {
      id: 'stockopname',
      label: 'Stock Opname (SO)',
      icon: ClipboardCheck,
      badge: pendingSOCount > 0 ? pendingSOCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'access_control',
      label: 'Hak Akses & Pengguna',
      icon: ShieldCheck,
    },
  ];

  // Filter based on user's role permissions
  const allowedTabs = currentUser.isMasterAdmin 
    ? allNavItems.map(n => n.id)
    : (rolePermissions[currentUser.role] || ['dashboard']);

  const navItems = allNavItems.filter(item => allowedTabs.includes(item.id));

  return (
    <aside className="no-print w-full md:w-64 shrink-0 bg-white md:min-h-[calc(100vh-4rem)] border-r border-slate-200 p-3 sm:p-4">
      
      {/* Current Role Banner */}
      <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Akses Saat Ini
        </div>
        <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
          {currentUser.roleTitle}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          {currentUser.role === 'manager' && 'Akses Penuh: Audit, Setting & Analisa'}
          {currentUser.role === 'kasir' && 'Operasional Front & Kas Harian'}
          {currentUser.role === 'head_kitchen' && 'Dapur: Receiving, Resep, Waste & SO'}
          {currentUser.role === 'head_floor' && 'Floor: Bar Stok, Waste, Mutasi & SO'}
        </div>
      </div>

      {/* Navigation List */}
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
        Menu Utama
      </div>

      <nav className="space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Low Stock Reminder Card */}
      {lowStockCount > 0 && (
        <div className="mt-6 p-3.5 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-red-900">Perlu Restock Segera!</h5>
              <p className="text-[11px] text-red-700 mt-0.5">
                Ada {lowStockCount} bahan baku di bawah batas minimum.
              </p>
              <button
                onClick={() => setActiveTab('inventory')}
                className="mt-2 text-[11px] font-bold text-red-700 hover:text-red-900 underline block"
              >
                Cek Daftar Barang &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 px-3 text-[11px] text-slate-400">
        <p>{branding.systemName} v2.4 Live</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Real-time Multi-User Engine</p>
      </div>
    </aside>
  );
};
