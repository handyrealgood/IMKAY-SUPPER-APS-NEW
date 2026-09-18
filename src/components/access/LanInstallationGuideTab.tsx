import React, { useState } from 'react';
import { 
  Network, 
  Download, 
  Printer, 
  CheckCircle2, 
  Server, 
  Wifi, 
  ShieldCheck, 
  Terminal, 
  Smartphone, 
  Camera, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink,
  Laptop,
  HelpCircle,
  FileText,
  Database,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useResto } from '../../context/RestoContext';

export const LanInstallationGuideTab: React.FC = () => {
  const { dbSyncStatus, refreshFromDatabase } = useResto();
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isRefreshingDb, setIsRefreshingDb] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshingDb(true);
    try {
      await refreshFromDatabase();
    } finally {
      setTimeout(() => setIsRefreshingDb(false), 600);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);
      let y = 18;

      const renderHeaderFooter = (pageNumber: number) => {
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'bold');
        doc.text('MANUAL TEKNIS INSTALASI JARINGAN LOKAL (OFFLINE LAN)', margin, 10);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistem Operasional Restoran Imah Kayu', margin + 110, 10);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin, 12, pageWidth - margin, 12);
        
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Dokumen Rahasia Internal Restoran - Panduan Setup & Troubleshooting LAN', margin, pageHeight - 7);
        doc.text(`Halaman ${pageNumber}`, pageWidth - margin - 18, pageHeight - 7);
      };

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 16) {
          doc.addPage();
          y = 18;
          renderHeaderFooter(doc.getNumberOfPages());
        }
      };

      // PAGE 1: COVER / TITLE & INTRO
      renderHeaderFooter(1);

      // Title Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'F');
      
      doc.setTextColor(251, 191, 36); // amber-400
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('SOP TEKNOLOGI INFORMASI & OPERASIONAL OUTLET', margin + 6, y + 8);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('BUKU PANDUAN LENGKAP INSTALASI APLIKASI VIA JARINGAN LAN', margin + 6, y + 16);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text('Petunjuk Komprehensif Menjalankan POS Kasir, Tablet Waiter, PC Dapur, & Absensi GPS/Selfie HP Staf', margin + 6, y + 23);
      doc.text('Bekerja 100% Mandiri di Router Wi-Fi Lokal (Offline-Ready Tanpa Tergantung Internet Luar)', margin + 6, y + 28);
      y += 38;

      // Section 1: Overview & Arsitektur
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BAGIAN 1: ARSITEKTUR & KEBUTUHAN PERANGKAT', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const introText = [
        'Aplikasi ini dirancang menggunakan arsitektur modern Single Page Web Application (Vite + React) yang dapat',
        'beroperasi langsung di jaringan lokal (Local Area Network / Wi-Fi). Satu komputer kasir dijadikan "Server Master",',
        'dan semua perangkat lainnya (HP kasir, HP staf, tablet waiter, layar kitchen display) mengakses secara simultan.'
      ];
      introText.forEach(line => {
        doc.text(line, margin, y);
        y += 4.5;
      });
      y += 3;

      // Specs Table Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Kebutuhan Perangkat Minimum:', margin + 4, y + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('1. Komputer Server/Kasir  : PC atau Laptop (Windows 10/11, macOS, Linux). RAM min 4GB (Direkomendasikan 8GB).', margin + 4, y + 12);
      doc.text('2. Router Wi-Fi Outlet   : Router Wi-Fi standar (IndiHome, Biznet, FirstMedia, TP-Link, Tenda, Mikrotik).', margin + 4, y + 17);
      doc.text('3. Kabel LAN (Ethernet)  : Sangat disarankan menghubungkan PC Kasir ke Router memakai kabel LAN kuning/biru.', margin + 4, y + 22);
      doc.text('4. Perangkat Staf (Klien): HP Android, iPhone, iPad/Tablet, atau PC Dapur dengan browser Google Chrome/Safari.', margin + 4, y + 27);
      doc.text('5. Akses Internet        : Hanya dibutuhkan 1x saat pertama install dependensi. Setelah itu 100% offline.', margin + 4, y + 32);
      y += 40;

      // Section 2: Download / Ekspor Source Code
      checkPageBreak(50);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BAGIAN 2: CARA MENDAPATKAN FILE KODE APLIKASI (EXPORT / DOWNLOAD)', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const downloadSteps = [
        'Langkah A (Download ZIP dari Google AI Studio):',
        '  1. Buka halaman project Google AI Studio di browser komputer Anda.',
        '  2. Klik ikon Roda Gigi (Settings ⚙️) di pojok kanan atas, atau klik ikon titik tiga (...) di File Explorer panel kiri.',
        '  3. Pilih menu "Export" lalu klik "Download as ZIP" (atau "Export project").',
        '  4. Simpan file zip di PC Kasir, lalu ekstrak ke folder (misal: C:\\resto-app).',
        '',
        'Langkah B (Alternatif via Git Clone / GitHub):',
        '  Jika menggunakan GitHub, Anda bisa mengekspor project ke repositori GitHub pribadi Anda, lalu di PC Kasir',
        '  buka Command Prompt dan jalankan: git clone <URL_REPO_GITHUB> C:\\resto-app'
      ];
      downloadSteps.forEach(line => {
        doc.text(line, margin, y);
        y += 4.5;
      });
      y += 4;

      // Section 3: Install Node.js
      checkPageBreak(50);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BAGIAN 3: INSTALASI NODE.JS DI KOMPUTER SERVER (PC KASIR)', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const nodeSteps = [
        '1. Buka browser di PC Kasir dan kunjungi situs resmi: https://nodejs.org',
        '2. Unduh versi LTS (Long Term Support) yang direkomendasikan untuk pengguna (misal v20.x atau v22.x).',
        '3. Buka file installer .msi yang telah didownload, klik Next > centang persetujuan lisensi > Next > Finish.',
        '4. Buka Command Prompt (Tekan Win + R, ketik "cmd", tekan Enter). Ketik perintah verifikasi berikut:'
      ];
      nodeSteps.forEach(line => {
        doc.text(line, margin, y);
        y += 4.5;
      });
      y += 2;

      // Command box Node
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(251, 191, 36);
      doc.text('node -v', margin + 4, y + 6);
      doc.setTextColor(226, 232, 240);
      doc.text('-> Menghasilkan output: v20.18.0 (atau versi lebih tinggi)', margin + 35, y + 6);
      doc.setTextColor(251, 191, 36);
      doc.text('npm -v', margin + 4, y + 11);
      doc.setTextColor(226, 232, 240);
      doc.text('-> Menghasilkan output: 10.8.2 (atau versi lebih tinggi)', margin + 35, y + 11);
      y += 20;

      // PAGE 2: STEP 4, 5, 6
      doc.addPage();
      renderHeaderFooter(2);
      y = 18;

      // Section 4: Menjalankan Aplikasi
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BAGIAN 4: MENJALANKAN APLIKASI UNTUK JARINGAN LAN (CMD)', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text('Buka Command Prompt lalu arahkan ke folder tempat Anda mengekstrak aplikasi tadi:', margin, y);
      y += 5;

      // Command box Run
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin, y, contentWidth, 44, 2, 2, 'F');
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('# 1. Pindah ke folder aplikasi', margin + 4, y + 6);
      doc.setTextColor(52, 211, 153);
      doc.text('cd C:\\resto-app', margin + 4, y + 11);

      doc.setTextColor(148, 163, 184);
      doc.text('# 2. Unduh paket dependensi (cukup jalankan 1 kali saja)', margin + 4, y + 17);
      doc.setTextColor(52, 211, 153);
      doc.text('npm install', margin + 4, y + 22);

      doc.setTextColor(148, 163, 184);
      doc.text('# 3. Jalankan server dengan parameter --host 0.0.0.0 agar memancar ke seluruh Wi-Fi LAN:', margin + 4, y + 28);
      doc.setTextColor(251, 191, 36);
      doc.setFont('courier', 'bold');
      doc.text('npm run dev', margin + 4, y + 33);
      doc.setFont('courier', 'normal');
      doc.setTextColor(226, 232, 240);
      doc.text('ATAU untuk performa produksi paling cepat & hemat RAM:', margin + 4, y + 38);
      doc.setTextColor(52, 211, 153);
      doc.text('npm run build && npm run preview', margin + 4, y + 42);
      y += 50;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('PENTING: Di terminal akan muncul tulisan:', margin, y);
      y += 4;
      doc.setTextColor(30, 41, 59);
      doc.setFont('courier', 'bold');
      doc.text('  ➜  Local:   http://localhost:3000/', margin + 4, y);
      y += 4;
      doc.text('  ➜  Network: http://192.168.1.50:3000/', margin + 4, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Alamat di baris "Network" inilah yang akan diketikkan di HP staf dan tablet.', margin, y);
      y += 8;

      // Section 5: Mengetahui IP & Set IP Statis
      checkPageBreak(55);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BAGIAN 5: MENGETAHUI ALAMAT IP & MENGATUR STATIC IP WINDOWS', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const ipSteps = [
        '1. Buka jendela Command Prompt baru di PC Kasir, ketik: ipconfig lalu tekan Enter.',
        '2. Cari bagian "Wireless LAN adapter Wi-Fi" atau "Ethernet adapter".',
        '3. Catat 3 data penting berikut:',
        '   - IPv4 Address : misal 192.168.1.50 (ini adalah IP PC Kasir Anda).',
        '   - Subnet Mask  : 255.255.255.0',
        '   - Default Gateway: 192.168.1.1 (ini adalah IP Router Wi-Fi Anda).',
        '',
        'CARA MEMBUAT IP STATIS AGAR TIDAK BERUBAH SAAT ROUTER RESTART (SANGAT DIREKOMENDASIKAN):',
        '1. Buka Control Panel > Network and Internet > Network Connections.',
        '2. Klik kanan pada icon adapter Wi-Fi / Ethernet kasir > pilih Properties.',
        '3. Klik 2x pada "Internet Protocol Version 4 (TCP/IPv4)".',
        '4. Pilih "Use the following IP address", lalu masukkan data di atas secara manual:',
        '   IP Address: 192.168.1.50 | Subnet: 255.255.255.0 | Gateway: 192.168.1.1',
        '   DNS Server: 8.8.8.8 dan 8.8.4.4 > Klik OK.'
      ];
      ipSteps.forEach(line => {
        doc.text(line, margin, y);
        y += 4.5;
      });
      y += 4;

      // Section 6: Konfigurasi Windows Firewall
      checkPageBreak(50);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BAGIAN 6: MEMBUKA PORT 3000 DI WINDOWS DEFENDER FIREWALL', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text('Windows Firewall sering secara otomatis memblokir koneksi yang datang dari HP. Buka port dengan:', margin, y);
      y += 5;

      // Firewall CMD shortcut
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('CARA TERCEPAT: Jalankan 1 Perintah Ini via CMD (Run as Administrator):', margin + 4, y + 6);
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text('netsh advfirewall firewall add rule name="Resto POS Port 3000" dir=in action=allow protocol=TCP localport=3000', margin + 4, y + 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Atau lewat GUI: Buka Windows Defender Firewall > Inbound Rules > New Rule > Port > TCP 3000 > Allow connection.', margin + 4, y + 19);
      y += 30;

      // PAGE 3: SOLUSI MASALAH HP TIDAK BISA BUKA (TROUBLESHOOTING UTAMA)
      doc.addPage();
      renderHeaderFooter(3);
      y = 18;

      doc.setFillColor(220, 38, 38); // red-600
      doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BAGIAN 7: TROUBLESHOOTING KHUSUS - "KENAPA HP KARYAWAN GAGAL TAMPIL?"', margin + 6, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(254, 226, 226);
      doc.text('Jika PC Kasir dan HP sudah di Wi-Fi yang sama tapi layar di HP tetap loading / gagal terhubung, periksa 5 penyebab ini:', margin + 6, y + 13);
      y += 24;

      const troubleItems = [
        {
          num: '1',
          title: 'PENYEBAB UTAMA: PROFIL WI-FI WINDOWS BERADA PADA MODE "PUBLIC NETWORK"',
          desc: 'Secara default saat terhubung ke Wi-Fi, Windows mengunci sistem dengan profil Public Network. Pada mode ini, seluruh perangkat lain di jaringan dilarang mengakses PC.',
          solution: 'SOLUSI: Buka Settings Windows > Network & Internet > Wi-Fi > Klik nama Wi-Fi Anda > Ubah dari "Public network" menjadi "Private network". Seketika HP akan bisa terhubung!'
        },
        {
          num: '2',
          title: 'PENGETIKAN ALAMAT DI HP WAJIB MEMAKAI "http://" LENGKAP',
          desc: 'Browser Chrome di HP sering secara otomatis menambahkan awalan "https://" atau menganggap Anda sedang mencari di Google Search jika hanya mengetik angka IP saja.',
          solution: 'SOLUSI: Di browser HP, ketik alamat secara utuh: http://192.168.1.50:3000 (Pastikan tertulis http:// dan bukan https://, serta gunakan tanda titik dua sebelum port 3000).'
        },
        {
          num: '3',
          title: 'FITUR "AP ISOLATION" / "CLIENT ISOLATION" DI ROUTER WI-FI OUTLET',
          desc: 'Router outlet (IndiHome ZTE/Huawei, Biznet, TP-Link, Tenda) terutama pada SSID Guest / Tamu memiliki fitur isolasi yang melarang sesama HP/laptop untuk saling kirim data.',
          solution: 'SOLUSI A: Hubungkan PC Kasir menggunakan KABEL LAN (Ethernet) ke router, bukan via Wi-Fi. Komputer kabel tidak akan terisolasi dari Wi-Fi.\nSOLUSI B: Masuk ke setting router (http://192.168.1.1) lalu matikan opsi "AP Isolation".'
        },
        {
          num: '4',
          title: 'SALAH MEMBACA NOMOR IP KARENA ADA ADAPTOR LAIN (VIRTUALBOX / VM / VPN)',
          desc: 'Jika di PC Kasir pernah terinstall VirtualBox, VMWare, WSL, atau VPN, perintah ipconfig akan menampilkan banyak nomor IP (seperti 192.168.56.1 atau 172.x.x.x).',
          solution: 'SOLUSI: Pastikan hanya memakai nomor IPv4 dari adaptor yang benar-benar aktif terhubung ke Router Resto (biasanya bernomor 192.168.1.x atau 192.168.0.x).'
        },
        {
          num: '5',
          title: 'PENGUJIAN CEPAT DENGAN MEMATIKAN SEMENTARA FIREWALL WINDOWS',
          desc: 'Untuk menguji apakah masalahnya 100% ada pada firewall PC Kasir, matikan sementara firewall selama 2 menit.',
          solution: 'SOLUSI: Buka Windows Security > Firewall & network protection > Matikan sementara Microsoft Defender Firewall di Private Network. Jika di HP langsung bisa terbuka, berarti rule port 3000 belum tersimpan.'
        }
      ];

      troubleItems.forEach(item => {
        checkPageBreak(32);
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(252, 165, 165);
        doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(153, 27, 27);
        doc.text(`[${item.num}] ${item.title}`, margin + 4, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        const descLines = doc.splitTextToSize(item.desc, contentWidth - 8);
        doc.text(descLines, margin + 4, y + 9.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 58, 138); // blue-900
        const solLines = doc.splitTextToSize(item.solution, contentWidth - 8);
        doc.text(solLines, margin + 4, y + 16);

        y += 28;
      });

      // PAGE 4: KAMERA SELFIE & GPS HTTP BYPASS & AUTORUN SCRIPT
      doc.addPage();
      renderHeaderFooter(4);
      y = 18;

      // Section 8: Kamera Absensi Selfie
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BAGIAN 8: CARA MENGAKTIFKAN KAMERA SELFIE ABSENSI DI HP STAF VIA LAN', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const camIntro = [
        'Browser modern (Google Chrome & Safari) memiliki standar keamanan internasional: akses live kamera & GPS',
        'hanya diizinkan di alamat berprotokol HTTPS atau localhost. Karena jaringan lokal outlet menggunakan protokol HTTP',
        '(contoh http://192.168.1.50:3000), browser HP staf akan otomatis memblokir kamera jika belum di-bypass.'
      ];
      camIntro.forEach(l => {
        doc.text(l, margin, y);
        y += 4.5;
      });
      y += 2;

      // Step Box Chrome Flags
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 64, 175);
      doc.text('LANGKAH RESMI BYPASS KAMERA CHROME (HANYA 1 MENIT PER HP KARYAWAN):', margin + 4, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text('1. Buka browser Google Chrome di HP Android / Tablet karyawan.', margin + 4, y + 12);
      doc.text('2. Pada kolom alamat URL paling atas, ketik: chrome://flags lalu tekan Enter.', margin + 4, y + 17);
      doc.text('3. Pada kolom pencarian "Search flags", ketik kata kunci: unsafely-treat-insecure-origin-as-secure', margin + 4, y + 22);
      doc.text('4. Masukkan alamat IP server resto Anda di kolom teks: http://192.168.1.50:3000', margin + 4, y + 27);
      doc.text('5. Ubah dropdown dari "Disabled" menjadi "Enabled", lalu klik tombol biru "Relaunch" di pojok bawah.', margin + 4, y + 32);
      doc.text('HASIL: Kamera selfie absensi dan GPS geofencing outlet kini aktif 100% lancar di HP staf tanpa biaya SSL!', margin + 4, y + 36);
      y += 44;

      // Section 9: Auto-Run Windows Script
      checkPageBreak(55);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BAGIAN 9: MEMBUAT APLIKASI MENYALA OTOMATIS SAAT PC DIHIDUPKAN (AUTORUN)', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text('Agar kasir tidak perlu mengetik perintah terminal setiap pagi, buat file batch otomatis (.bat):', margin, y);
      y += 5;

      const batSteps = [
        '1. Buka Notepad di PC Kasir.',
        '2. Salin dan tempel kode script berikut ke dalam Notepad:',
        '   @echo off',
        '   title Server POS Restoran Imah Kayu',
        '   cd /d C:\\resto-app',
        '   npm run dev',
        '   pause',
        '3. Klik File > Save As > pilih Save as type: All Files (*.*).',
        '4. Beri nama file: "jalankan-pos.bat" dan simpan di Desktop.',
        '5. Untuk membuat otomatis menyala saat Windows boot:',
        '   Tekan tombol Win + R > ketik "shell:startup" > tekan Enter.',
        '   Copy file shortcut "jalankan-pos.bat" ke dalam folder Startup tersebut. Selesai!'
      ];
      batSteps.forEach(l => {
        doc.text(l, margin, y);
        y += 4.5;
      });
      y += 4;

      // Section 10: Database Server Terpusat & Sinkronisasi Real-Time (Multi-Perangkat)
      checkPageBreak(85);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BAGIAN 10: DATABASE SERVER TERPUSAT & SINKRONISASI REAL-TIME SELURUH FITUR', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const dbIntro = [
        'Aplikasi kini telah dilengkapi dengan Database Server Lokal Terpusat (Express backend di server.ts) yang menyimpan',
        'seluruh data restoran secara terpusat di hard disk PC Kasir pada file: database/resto_database.json.',
        'Setiap ada penambahan, perubahan, atau penghapusan data di satu perangkat, server langsung menyiarkan (broadcast)',
        'update tersebut secara instan (Real-Time SSE) ke semua HP karyawan, tablet waiter, dan display dapur tanpa refresh.'
      ];
      dbIntro.forEach(l => {
        doc.text(l, margin, y);
        y += 4.5;
      });
      y += 2;

      // Table of 17 Fully Synchronized Modules
      doc.setFillColor(240, 253, 244); // emerald-50
      doc.setDrawColor(187, 247, 208); // emerald-200
      doc.roundedRect(margin, y, contentWidth, 54, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(22, 101, 52); // emerald-800
      doc.text('DAFTAR 17 FITUR RESTORAN YANG TERSINKRONISASI 100% SECARA OTOMATIS & REAL-TIME:', margin + 4, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      const col1 = [
        '[V] 1. Dashboard Live (Omset, pesanan, peringatan stok & SO)',
        '[V] 2. Point of Sales (POS Meja, split bill, pindah meja, struk)',
        '[V] 3. Data Barang & Stok (Bahan baku, stok min, satuan)',
        '[V] 4. Input Menu & HPP (Resep menu, COGS & food cost margin)',
        '[V] 5. Purchasing & PO (Purchase order ke supplier, approval)',
        '[V] 6. Receiving Supplier (Penerimaan bahan & auto-tambah stok)',
        '[V] 7. Input Waste & Spoil (Pencatatan rusak & auto-potong stok)',
        '[V] 8. Laporan Penjualan (Riwayat transaksi kasir, omset, item)',
        '[V] 9. Transfer Antar Outlet (Mutasi stok antar cabang resto)'
      ];

      const col2 = [
        '[V] 10. Memorandum Internal (Memo operasional manajemen)',
        '[V] 11. Kas Kecil / Petty Cash (Pemasukan & pengeluaran harian)',
        '[V] 12. Biaya Utilitas & Variabel (Listrik, air, gas, sewa, gaji)',
        '[V] 13. Jadwal Karyawan (Pengaturan shift kerja & tim bertugas)',
        '[V] 14. Absensi GPS & Selfie (Kamera verifikasi & radius koordinat)',
        '[V] 15. Laporan COGS & Tren (Analisa laba kotor & tren produk)',
        '[V] 16. Stok Opname (Jadwal SO, fisik vs sistem, selisih & adj.)',
        '[V] 17. Hak Akses & Pengguna (Akun karyawan, multi-role & branding)'
      ];

      let rowY = y + 10;
      col1.forEach(item => {
        doc.text(item, margin + 4, rowY);
        rowY += 4.5;
      });

      rowY = y + 10;
      col2.forEach(item => {
        doc.text(item, margin + (contentWidth / 2) + 2, rowY);
        rowY += 4.5;
      });
      y += 58;

      // Section 11: Troubleshooting Error Windows
      checkPageBreak(75);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('BAGIAN 11: PANDUAN PEMECAHAN MASALAH (TROUBLESHOOTING) TERBARU', margin, y);
      y += 6;

      const troubles = [
        {
          q: 'A. Error: ENOENT: no such file or directory, open "C:\\windows\\system32\\package.json"',
          cause: 'Penyebab: Command Prompt (CMD) dibuka di folder sistem Windows, bukan di dalam folder aplikasi restoran.',
          sol: 'Solusi: Buka File Explorer di folder C:\\resto-aps > klik Address Bar di atas > ketik "cmd" lalu tekan Enter. Pastikan prompt menunjukkan "C:\\resto-aps>" sebelum mengetik "npm run dev".'
        },
        {
          q: 'B. Di dalam folder C:\\resto-aps hanya ada package.json (tidak ada server.ts, index.html, src/)',
          cause: 'Penyebab: File source code lengkap belum diekstrak ke folder tersebut.',
          sol: 'Solusi: Unduh paket lengkap (resto-app-complete.zip) lewat tombol hijau "Unduh Source Code (ZIP)" di menu Akses & Jaringan LAN, lalu klik kanan file ZIP > Extract All... ke C:\\resto-aps.'
        },
        {
          q: 'C. Perangkat HP Karyawan tidak bisa membuka http://192.168.x.x:3000',
          cause: 'Penyebab: Wi-Fi HP berbeda dengan Wi-Fi PC Kasir, atau Windows Firewall memblokir port 3000.',
          sol: 'Solusi: Pastikan HP terhubung ke Wi-Fi outlet yang sama. Di PC Kasir, buka Windows Defender Firewall > izinkan aplikasi Node.js pada Private Network.'
        }
      ];

      troubles.forEach(t => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(185, 28, 28); // red-700
        doc.text(t.q, margin, y);
        y += 4;

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(t.cause, margin + 3, y);
        y += 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(t.sol, margin + 3, y);
        y += 6;
      });

      // Section 12: Ringkasan Penggunaan
      checkPageBreak(35);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('RINGKASAN TAUTAN AKSES PERAN OUTLET:', margin + 4, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('• Kasir & POS        : Buka http://localhost:3000 di PC Kasir atau http://[IP_SERVER]:3000 di Tablet Kasir.', margin + 4, y + 12);
      doc.text('• Waiter / Order HP  : Buka http://[IP_SERVER]:3000 > Tambahkan ke Layar Utama (Add to Home screen).', margin + 4, y + 17);
      doc.text('• Absensi Staf       : Buka http://[IP_SERVER]:3000 > Menu Absensi GPS & Selfie.', margin + 4, y + 22);

      doc.save('Buku_Panduan_Lengkap_Instalasi_LAN_Sistem_Restoran.pdf');
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Gagal menghasilkan file PDF. Silakan gunakan tombol Cetak Halaman.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Setup Jaringan Lokal (Offline LAN)
              </span>
              <h2 className="text-xl font-black mt-1">Panduan Memasang Aplikasi dari Nol di Jaringan LAN</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Petunjuk lengkap menghubungkan PC Kasir, Tablet Waiter, PC Dapur, dan HP Karyawan tanpa internet eksternal.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <a
            href="/api/download-project-zip"
            download="resto-app-complete.zip"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Unduh seluruh file source code aplikasi restoran (lengkap dengan server.ts, index.html, src, dll)"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Source Code (ZIP)</span>
          </a>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 font-black text-xs transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Membuat...' : 'Buku Panduan (PDF)'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/15 cursor-pointer"
            title="Cetak atau Simpan Sebagai PDF lewat Browser"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Live Central Database Status & Sync Architecture */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 p-5 sm:p-6 rounded-2xl border border-emerald-500/30 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Database Master Lokal (LAN Server)
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {dbSyncStatus.isConnected ? 'Aktif & Terhubung' : 'Mode Offline Lokal'}
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                Sinkronisasi Multi-Perangkat Otomatis
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshingDb}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Perbarui data terbaru dari Database Server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingDb ? 'animate-spin' : ''}`} />
              <span>{isRefreshingDb ? 'Menyinkronkan...' : 'Cek Sinkronisasi'}</span>
            </button>

            <a
              href="/api/db/backup"
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/15 cursor-pointer"
              title="Unduh file backup database lokal (resto_database.json)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup DB (.json)</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[11px] font-medium">Lokasi Penyimpanan File:</span>
            <span className="font-mono text-emerald-300 text-[11px] block mt-0.5 font-bold break-all">
              database/resto_database.json
            </span>
            <span className="text-slate-400 text-[10px] block mt-1">
              Disimpan aman di harddisk PC Kasir host. Tidak hilang saat PC dimatikan.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[11px] font-medium">Koneksi Real-time Saat Ini:</span>
            <span className="font-bold text-white text-sm block mt-0.5">
              {dbSyncStatus.activeDevices} Perangkat Terhubung
            </span>
            <span className="text-slate-400 text-[10px] block mt-1">
              Setiap perubahan otomatis dipush ke seluruh HP staf & tablet secara instan (SSE).
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[11px] font-medium">Cara Kerja Multi-User:</span>
            <span className="font-semibold text-amber-300 block mt-0.5">
              Kelola di PC Kasir → Otomatis Masuk ke HP Staf
            </span>
            <span className="text-slate-400 text-[10px] block mt-1">
              Saat Manager membuat/menghapus karyawan di PC, semua HP karyawan langsung terupdate tanpa perlu install ulang!
            </span>
          </div>
        </div>
      </div>

      {/* Network Diagram Concept */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-indigo-600" />
          Topologi Jaringan Lokal Restoran
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center">
            <Server className="w-8 h-8 text-amber-600 mb-2" />
            <span className="text-xs font-black text-slate-900">PC Kasir (Server Master)</span>
            <span className="text-[11px] text-slate-500 mt-1">IP: 192.168.1.50</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
              Jalankan: npm run dev
            </span>
          </div>

          <div className="hidden sm:flex flex-col items-center justify-center text-slate-400">
            <span className="text-xs font-bold mb-1">Terhubung via LAN/WiFi</span>
            <div className="w-full h-0.5 bg-slate-300 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-500" />
            </div>
            <span className="text-[10px] mt-1 text-slate-500">Router Wi-Fi Outlet</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center">
            <Smartphone className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-xs font-black text-slate-900">HP Staf / Kasir / Waiter</span>
            <span className="text-[11px] text-slate-500 mt-1">Buka Chrome/Safari</span>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mt-2 break-all">
              http://192.168.1.50:3000
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center">
            <Laptop className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-xs font-black text-slate-900">Layar Dapur & Manager</span>
            <span className="text-[11px] text-slate-500 mt-1">Tablet / PC Dapur</span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full mt-2">
              Realtime Multi-User
            </span>
          </div>
        </div>
      </div>

      {/* Step by Step Accordions/Cards */}
      <div className="space-y-4">
        {/* Step 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-black text-slate-900">
                Instalasi Node.js di Komputer Server (PC Kasir)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Komputer server bertindak sebagai "Pusat Data" yang menyajikan aplikasi ke semua perangkat lain di restoran.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>
                  Buka website resmi <strong>https://nodejs.org</strong> pada PC Kasir/Server.
                </li>
                <li>
                  Unduh versi <strong>LTS (v20 atau v22 ke atas)</strong> lalu jalankan file installer <em>.msi</em> (Windows) atau <em>.pkg</em> (Mac).
                </li>
                <li>
                  Ikuti wizard instalasi dengan menekan <em>Next &gt; Next &gt; Finish</em> (centang persetujuan default).
                </li>
                <li>
                  Buka Command Prompt (CMD) atau PowerShell, ketik:
                </li>
              </ul>
              <div className="relative bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-xs mt-2 flex items-center justify-between">
                <code>node -v && npm -v</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard('node -v && npm -v', 'step1')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  title="Salin perintah"
                >
                  {copiedIndex === 'step1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Jika keluar nomor versi (misal <code>v20.18.0</code>), berarti Node.js telah siap digunakan.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-black text-slate-900">
                Menyiapkan Folder & Install Dependensi Aplikasi
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aplikasi ini membutuhkan file lengkap (termasuk <code>server.ts</code>, <code>index.html</code>, dan folder <code>src/</code>).
              </p>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Jika folder Anda di PC (misal C:\resto-aps) hanya berisi package.json:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  Itu artinya file source code lainnya belum diekstrak ke folder tersebut. Silakan unduh paket ZIP lengkap yang sudah disiapkan di bawah ini:
                </p>
                <div className="pt-1">
                  <a
                    href="/api/download-project-zip"
                    download="resto-app-complete.zip"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Paket Lengkap: resto-app-complete.zip (440 KB)</span>
                  </a>
                </div>
                <p className="text-[10px] text-amber-800">
                  Setelah diunduh, klik kanan file <strong>resto-app-complete.zip</strong> &gt; pilih <strong>Extract All...</strong> &gt; arahkan ke <code>C:\resto-aps</code>.
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                Setelah semua file (<code>server.ts</code>, <code>index.html</code>, <code>src/</code>) ada di dalam <code>C:\resto-aps</code>, buka terminal di folder tersebut:
              </p>
              
              <div className="relative bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5 mb-1.5">
                  <span className="text-[11px]">Ketik perintah berikut di Terminal:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('npm install', 'step2')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    {copiedIndex === 'step2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div>
                  <span className="text-slate-500"># 1. Unduh pustaka pendukung</span>
                  <p className="text-emerald-400 font-bold">npm install</p>
                </div>
                <div>
                  <span className="text-slate-500"># 2. Jalankan aplikasi untuk jaringan LAN</span>
                  <p className="text-emerald-400 font-bold">npm run dev</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Vite sudah otomatis dikonfigurasikan dengan <code>--host 0.0.0.0 --port 3000</code> sehingga langsung memancarkan sinyal ke seluruh IP jaringan LAN.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-black text-slate-900">
                Mencari Tahu IP Address Komputer Server
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Agar perangkat klien tahu alamat tujuan di jaringan Wi-Fi, kita perlu melihat IP Address PC Server:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-900 block mb-1">Cara di Windows (PC Kasir):</span>
                  <p className="text-xs text-slate-600 mb-2">Buka CMD, ketik:</p>
                  <div className="bg-slate-900 text-slate-100 p-2 rounded-lg font-mono text-xs flex items-center justify-between">
                    <code>ipconfig</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('ipconfig', 'ipconfig')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedIndex === 'ipconfig' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Lihat baris <strong>IPv4 Address</strong> (contoh: <code>192.168.1.50</code>).
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-900 block mb-1">Saran Praktisi Resto:</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Set IP PC Kasir menjadi <strong>Static / Manual</strong> di menu Network Connections Windows agar nomor IP tidak bergeser ketika router Wi-Fi di-restart staf.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
              4
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-black text-slate-900">
                Membuka Izin Firewall Windows (Port 3000)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Windows Defender Firewall sering memblokir akses masuk dari perangkat lain. Izinkan port 3000 dengan langkah singkat ini:
              </p>
              <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                <li>Tekan tombol Windows di keyboard, ketik <strong>Windows Defender Firewall with Advanced Security</strong> lalu tekan Enter.</li>
                <li>Di panel kiri, klik <strong>Inbound Rules</strong> &rarr; di panel kanan klik <strong>New Rule...</strong></li>
                <li>Pilih opsi <strong>Port</strong> &rarr; klik <em>Next</em>.</li>
                <li>Pilih <strong>TCP</strong> dan pada <em>Specific local ports</em> ketik: <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">3000</code> &rarr; klik <em>Next</em>.</li>
                <li>Pilih <strong>Allow the connection</strong> &rarr; klik <em>Next</em>.</li>
                <li>Centang ketiga opsi: <em>Domain, Private, Public</em> &rarr; klik <em>Next</em>.</li>
                <li>Beri nama: <strong className="text-slate-900">Aplikasi Resto LAN</strong> &rarr; klik <em>Finish</em>.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
              5
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-black text-slate-900">
                Membuka Aplikasi dari HP Staf, Tablet Waiter, & Dapur
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sekarang semua perangkat staf di outlet bisa mengakses sistem secara simultan:
              </p>
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-amber-950 block">Alamat Akses di Browser:</span>
                <div className="bg-white p-2.5 rounded-lg border border-amber-200 font-mono text-xs text-amber-900 flex items-center justify-between">
                  <span>http://192.168.1.50:3000</span>
                  <span className="text-[10px] text-amber-700 font-sans italic">(Ganti dengan IP PC Kasir Anda)</span>
                </div>
                <p className="text-[11px] text-amber-900/80">
                  <strong>Tips Praktis:</strong> Buka menu Chrome di HP staf (titik tiga kanan atas) &rarr; pilih <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong> agar ikon aplikasi muncul di layar depan HP seperti aplikasi Play Store.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 6 - Camera / HTTPS Fix for Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs bg-blue-50/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">
                  Trik Khusus: Mengaktifkan Kamera Selfie Absensi di HP Staf via LAN
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Penting untuk Absensi
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Browser HP (Google Chrome) memiliki aturan keamanan standar: kamera hanya aktif di <code>https://</code> atau <code>localhost</code>. Jika staf membuka lewat IP HTTP (misal <code>http://192.168.1.50:3000</code>), kamera mungkin terblokir. Gunakan solusi resmi ini:
              </p>
              
              <div className="bg-white p-3.5 rounded-xl border border-blue-200 text-xs text-slate-700 space-y-2">
                <p className="font-bold text-slate-900">Langkah 1 Menit di HP Android Staf:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Buka browser Google Chrome di HP staf.</li>
                  <li>Ketik di address bar: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-blue-700">chrome://flags</code></li>
                  <li>Di kolom pencarian paling atas, cari: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">unsafely-treat-insecure-origin-as-secure</code></li>
                  <li>Ketikkan alamat server resto: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">http://192.168.1.50:3000</code></li>
                  <li>Ubah status dropdown dari <em>Disabled</em> menjadi <strong className="text-emerald-700">Enabled</strong>.</li>
                  <li>Klik tombol biru <strong>Relaunch</strong> di pojok kanan bawah Chrome.</li>
                </ol>
                <p className="text-[11px] text-emerald-700 font-medium">
                  Selesai! Kini kamera selfie live dan GPS absensi akan bekerja 100% mulus di jaringan lokal tanpa perlu sertifikat SSL berbayar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 7 - Auto Start on Boot (PM2) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-black text-slate-900">
                Agar Server Menyala Otomatis Saat Komputer Dinyalakan (Auto-Run)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Supaya kasir tidak perlu mengetik perintah terminal setiap pagi, pasang tool <strong>PM2</strong>:
              </p>
              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-xs space-y-1.5">
                <p className="text-slate-400"># Install PM2 secara global</p>
                <p className="text-amber-400">npm install -g pm2 pm2-windows-startup</p>
                <p className="text-slate-400 mt-2"># Daftarkan startup Windows</p>
                <p className="text-amber-400">pm2-startup install</p>
                <p className="text-slate-400 mt-2"># Jalankan aplikasi</p>
                <p className="text-emerald-400">pm2 start "npm run dev" --name "resto-pos"</p>
                <p className="text-slate-400 mt-2"># Simpan konfigurasi</p>
                <p className="text-amber-400">pm2 save</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Dengan PM2, aplikasi akan otomatis menyala di latar belakang (background) begitu Windows kasir dihidupkan.
              </p>
            </div>
          </div>
        </div>

        {/* Diagnostic & Troubleshooting Checklist */}
        <div className="bg-rose-50/50 p-5 rounded-2xl border-2 border-rose-200 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  Panduan Pemecahan Masalah (Troubleshooting)
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1">
                  Kenapa HP Karyawan Tidak Bisa Membuka Aplikasi? (Cek 5 Hal Ini)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Jika HP karyawan dan PC kasir sudah di Wi-Fi yang sama namun layar di HP tetap loading/gagal, lakukan pengecekan berikut secara berurutan:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Check 1 */}
                <div className="p-3.5 bg-white rounded-xl border border-rose-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-900">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px]">1</span>
                    <span>Ubah Profil Jaringan Windows ke "Private"</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Di Windows kasir, koneksi Wi-Fi sering diset ke <strong>Public Network</strong>. Mode Public otomatis memblokir semua HP lain.
                  </p>
                  <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                    👉 <em>Buka Windows Settings &rarr; Network & Internet &rarr; Wi-Fi &rarr; Klik nama Wi-Fi Anda &rarr; Pilih <strong>"Private network"</strong>.</em>
                  </p>
                </div>

                {/* Check 2 */}
                <div className="p-3.5 bg-white rounded-xl border border-rose-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-900">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px]">2</span>
                    <span>Wajib Ketik "http://" Lengkap di HP</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Browser Google Chrome di HP sering otomatis menambahkan <code>https://</code> atau mengira Anda sedang mencari di Google Search.
                  </p>
                  <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                    👉 <em>Ketik lengkap dengan awalan http: <strong className="text-blue-700">http://192.168.1.50:3000</strong> (jangan ada huruf 's').</em>
                  </p>
                </div>

                {/* Check 3 */}
                <div className="p-3.5 bg-white rounded-xl border border-rose-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-900">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px]">3</span>
                    <span>Fitur "AP Isolation" di Router Wi-Fi</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Router outlet (IndiHome / Biznet / TP-Link / Tenda) sering mengaktifkan fitur <strong>AP Isolation / Client Isolation</strong> yang melarang sesama HP/PC di Wi-Fi untuk saling terhubung.
                  </p>
                  <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                    👉 <em>Matikan "AP Isolation" di setting router (192.168.1.1) atau colok PC Kasir memakai kabel LAN Ethernet ke router.</em>
                  </p>
                </div>

                {/* Check 4 */}
                <div className="p-3.5 bg-white rounded-xl border border-rose-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-900">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px]">4</span>
                    <span>Uji Cepat: Matikan Sementara Firewall Windows</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Untuk memastikan apakah Firewall yang memblokir, matikan sementara <em>Windows Defender Firewall</em> selama 2 menit.
                  </p>
                  <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                    👉 <em>Jika saat Firewall mati HP langsung bisa buka, berarti port 3000 belum terbuka sempurna di aturan Inbound Firewall.</em>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Support Banner */}
      <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600 text-xs">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Butuh bantuan setup teknis lebih lanjut? Dokumen PDF dapat dicetak untuk panduan teknisi IT outlet.</span>
        </div>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Download Dokumen PDF</span>
        </button>
      </div>
    </div>
  );
};
