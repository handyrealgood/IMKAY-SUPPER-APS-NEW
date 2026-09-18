@echo off
title Server RestoOps - Sistem Operasional Restoran
color 0A

echo ========================================================
echo   SISTEM OPERASIONAL RESTORAN - SERVER LOKAL / LAN
echo ========================================================
echo.

:: 1. Cek apakah Node.js sudah terpasang
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js belum terpasang di komputer/server ini!
    echo Silakan download dan pasang Node.js terlebih dahulu dari:
    echo https://nodejs.org (Pilih versi LTS)
    echo.
    echo Tekan tombol apa saja untuk keluar...
    pause >nul
    exit /b
)

echo [1/3] Node.js terdeteksi:
node -v
echo.

:: 2. Cek apakah dependensi (node_modules) sudah terinstall
if not exist "node_modules\" (
    echo [2/3] Menginstall library dan modul aplikasi (Hanya saat pertama kali)...
    echo Mohon tunggu 1-2 menit hingga proses selesai...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Gagal menginstall dependensi. Pastikan ada koneksi internet saat instalasi awal.
        pause
        exit /b
    )
) else (
    echo [2/3] Modul aplikasi sudah terpasang.
)

:: 3. Jalankan server lokal
echo.
echo [3/3] Menjalankan server aplikasi di Port 3000...
echo.
echo ========================================================
echo  SERVER AKTIF & SIAP DIGUNAKAN!
echo  - Buka di komputer ini: http://localhost:3000
echo  - Buka dari HP/Kasir LAN: http://[IP_KOMPUTER_INI]:3000
echo  (Cek IP komputer ini dengan perintah: ipconfig)
echo ========================================================
echo.
echo [INFO] Jangan tutup jendela command prompt ini selama kasir/resto beroperasi.
echo.

npm run dev

pause
