import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (err: any) {
    console.error('Fatal initialization error:', err);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; padding: 20px;">
        <div style="max-width: 420px; width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 24px; text-align: center;">
          <div style="font-size: 36px; margin-bottom: 12px;">⚠️</div>
          <h2 style="font-size: 16px; font-weight: 800; margin: 0 0 8px;">Gagal Memulai Sistem</h2>
          <p style="font-size: 12px; color: #94a3b8; margin: 0 0 16px;">${err?.message || 'Kesalahan inisialisasi modul'}</p>
          <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();" style="background: #e11d48; color: #fff; border: none; padding: 10px 16px; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: pointer; width: 100%;">
            Bersihkan Cache & Muat Ulang
          </button>
        </div>
      </div>
    `;
  }
}

