import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { ManagerDashboard } from './ManagerDashboard';
import { KasirDashboard } from './KasirDashboard';
import { HeadKitchenDashboard } from './HeadKitchenDashboard';
import { HeadFloorDashboard } from './HeadFloorDashboard';
import { StaffDashboard } from './StaffDashboard';
import { UserRole } from '../../types';
import { Eye, ShieldAlert, Sparkles } from 'lucide-react';

export const DashboardRouter: React.FC = () => {
  const { currentUser } = useResto();
  
  // Strict Security: Only Master Admin can toggle perspective view for auditing
  const isMaster = Boolean(currentUser?.isMasterAdmin);
  const [viewRole, setViewRole] = useState<UserRole | 'auto'>('auto');

  // If user is not Master Admin, force view to currentUser.role (defaulting safely to 'manager')
  const activeRole: UserRole = (!isMaster || viewRole === 'auto') 
    ? (currentUser?.role || 'manager') 
    : viewRole;

  return (
    <div className="space-y-4">
      {/* Role Perspective Quick Switch Bar - STRICTLY MASTER ADMIN ONLY */}
      {isMaster && (
        <div className="no-print bg-amber-50/80 border border-amber-200 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-amber-950 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Tampilan Sudut Pandang:</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300">
              Khusus Master Admin
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-white/80 p-1 rounded-xl border border-amber-200/60">
            <button
              onClick={() => setViewRole('auto')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewRole === 'auto' 
                  ? 'bg-purple-700 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sesuai Akun ({currentUser?.roleTitle ? currentUser.roleTitle.split(' ')[0] : 'Akun'})
            </button>
            <button
              onClick={() => setViewRole('manager')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRole === 'manager' && viewRole !== 'auto'
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manager
            </button>
            <button
              onClick={() => setViewRole('head_kitchen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRole === 'head_kitchen' && viewRole !== 'auto'
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kitchen
            </button>
            <button
              onClick={() => setViewRole('head_floor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRole === 'head_floor' && viewRole !== 'auto'
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Floor
            </button>
            <button
              onClick={() => setViewRole('kasir')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRole === 'kasir' && viewRole !== 'auto'
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kasir
            </button>
            <button
              onClick={() => setViewRole('staff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeRole === 'staff' && viewRole !== 'auto'
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff
            </button>
          </div>
        </div>
      )}

      {/* Render selected dashboard with robust fallbacks */}
      {activeRole === 'manager' && <ManagerDashboard />}
      {activeRole === 'kasir' && <KasirDashboard />}
      {activeRole === 'head_kitchen' && <HeadKitchenDashboard />}
      {activeRole === 'head_floor' && <HeadFloorDashboard />}
      {activeRole === 'staff' && <StaffDashboard />}
      {(!['manager', 'kasir', 'head_kitchen', 'head_floor', 'staff'].includes(activeRole)) && (
        <ManagerDashboard />
      )}
    </div>
  );
};
