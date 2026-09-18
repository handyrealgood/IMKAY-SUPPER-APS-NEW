import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, DatabaseZap, HardDrive } from 'lucide-react';
import { safeStorage } from '../../utils/safeStorage';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    
    // If quota error, proactively clean bloated caches
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes('exceeded the quota') || errorMsg.includes('QuotaExceededError')) {
      safeStorage.cleanupBloatedStorage();
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearBloatAndReload = () => {
    safeStorage.cleanupBloatedStorage();
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error);
      const isQuotaError = errorMsg.includes('exceeded the quota') || errorMsg.includes('QuotaExceededError');

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-xl p-6 text-center space-y-4">
            <div className={`w-14 h-14 rounded-2xl ${isQuotaError ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'} flex items-center justify-center mx-auto shadow-inner`}>
              {isQuotaError ? <HardDrive className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isQuotaError ? 'Kapasitas Penyimpanan Browser Penuh' : (this.props.fallbackTitle || 'Terjadi Kendala Tampilan')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isQuotaError 
                  ? 'Browser mencapai batas memori penyimpanan lokal (biasanya akibat foto profil / lampiran beresolusi tinggi). Klik tombol pulihkan untuk membersihkan file cache tanpa menghapus data transaksi Anda.'
                  : 'Komponen mengalami kesalahan render sementara. Sistem memproteksi data agar tetap aman.'
                }
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left font-mono text-[11px] text-slate-700 max-h-24 overflow-y-auto">
                {errorMsg}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {isQuotaError ? (
                <button
                  onClick={this.handleClearBloatAndReload}
                  className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <DatabaseZap className="w-3.5 h-3.5" />
                  <span>Bersihkan Cache & Pulihkan</span>
                </button>
              ) : null}
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Halaman</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
