#!/bin/bash

echo "========================================================"
echo "  SISTEM OPERASIONAL RESTORAN - SERVER LOKAL / LAN"
echo "========================================================"
echo ""

# 1. Cek Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js belum terpasang di server ini!"
    echo "Silakan install Node.js (v18, v20, atau v22 LTS) terlebih dahulu."
    exit 1
fi

echo "[1/3] Node.js terdeteksi: $(node -v)"
echo ""

# 2. Cek node_modules
if [ ! -d "node_modules" ]; then
    echo "[2/3] Menginstall library dan modul aplikasi (Hanya saat pertama kali)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Gagal menginstall dependensi."
        exit 1
    fi
else
    echo "[2/3] Modul aplikasi sudah terpasang."
fi

# 3. Jalankan server
echo ""
echo "[3/3] Menjalankan server aplikasi di Port 3000..."
echo ""
echo "========================================================"
echo " SERVER AKTIF & SIAP DIGUNAKAN!"
echo " - Akses Lokal: http://localhost:3000"
echo " - Akses LAN:   http://$(hostname -I | awk '{print $1}'):3000"
echo "========================================================"
echo ""

npm run dev
