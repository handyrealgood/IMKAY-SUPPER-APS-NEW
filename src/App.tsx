import React from 'react';
import { RestoProvider, useResto } from './context/RestoContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DashboardRouter } from './components/dashboards/DashboardRouter';
import { ItemManagementView } from './components/inventory/ItemManagementView';
import { RecipeMenuView } from './components/recipes/RecipeMenuView';
import { ReceivingGoodsView } from './components/receiving/ReceivingGoodsView';
import { WasteSpoilView } from './components/waste/WasteSpoilView';
import { SalesReportView } from './components/sales/SalesReportView';
import { SalesPosView } from './components/sales/SalesPosView';
import { PurchasingView } from './components/purchasing/PurchasingView';
import { InternalMemoView } from './components/memorandum/InternalMemoView';
import { StockTransferView } from './components/transfer/StockTransferView';
import { PettyCashView } from './components/pettycash/PettyCashView';
import { VariableCostView } from './components/costs/VariableCostView';
import { ScheduleView } from './components/schedule/ScheduleView';
import { StockOpnameView } from './components/opname/StockOpnameView';
import { FinancialReportsView } from './components/reports/FinancialReportsView';
import { AccessControlView } from './components/access/AccessControlView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { LoginView } from './components/auth/LoginView';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const AppContent: React.FC = () => {
  const { activeTab, isAuthenticated } = useResto();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardRouter />;
      case 'pos':
        return <SalesPosView />;
      case 'inventory':
        return <ItemManagementView />;
      case 'recipes':
        return <RecipeMenuView />;
      case 'purchasing':
        return <PurchasingView />;
      case 'receiving':
        return <ReceivingGoodsView />;
      case 'waste':
        return <WasteSpoilView />;
      case 'sales':
        return <SalesReportView />;
      case 'transfers':
        return <StockTransferView />;
      case 'memorandum':
        return <InternalMemoView />;
      case 'pettycash':
        return <PettyCashView />;
      case 'variable_costs':
        return <VariableCostView />;
      case 'schedules':
        return <ScheduleView />;
      case 'attendance':
        return <AttendanceView />;
      case 'stockopname':
        return <StockOpnameView />;
      case 'cogs':
        return <FinancialReportsView />;
      case 'access_control':
        return <AccessControlView />;
      default:
        return <DashboardRouter />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Universal Top Header */}
      <div className="no-print">
        <Header />
      </div>

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <div className="no-print">
          <Sidebar />
        </div>

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          <ErrorBoundary fallbackTitle="Terjadi Kendala Memuat Modul">
            {renderActiveView()}
          </ErrorBoundary>
        </main>
      </div>

      {/* Subtle Operational Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-3.5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-semibold text-slate-700">Sistem Operasional Restoran Real-time</span>
            <span className="text-slate-400">| Sinkronisasi Stok, Resep & HPP Terintegrasi</span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Versi 2.4 Production • Multi-Role: Manager, Kasir, Head Floor, Head Kitchen
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Aplikasi Mengalami Kendala">
      <RestoProvider>
        <AppContent />
      </RestoProvider>
    </ErrorBoundary>
  );
}
