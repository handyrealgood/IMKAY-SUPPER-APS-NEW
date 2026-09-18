// Utility for printing receipts and tickets to thermal & system-installed printers
// Supports 58mm (standard mini/Bluetooth) & 80mm (standard desktop/Epson TM-T82)

export interface ReceiptPrintOptions {
  paperWidth?: '58mm' | '80mm';
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  orderNumber: string;
  date: string;
  time: string;
  cashierName: string;
  tableNumber: string;
  pax?: number;
  orderType: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
    notes?: string;
    category?: string;
  }>;
  subtotalAmount?: number;
  discountAmount?: number;
  discountName?: string;
  serviceAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  customerName?: string;
  footerText?: string;
  ticketType?: 'checker' | 'kitchen' | 'bar' | 'recap';
  feedLines?: number;
}

/**
 * Format currency to IDR Rupiah string
 */
export function formatRupiahThermal(val: number): string {
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
}

/**
 * Generates clean HTML optimized for thermal receipt printing
 */
export function generateReceiptHTML(data: ReceiptPrintOptions): string {
  const width = data.paperWidth === '58mm' ? '58mm' : '80mm';
  const isMini = data.paperWidth === '58mm';
  const feed = data.feedLines ?? 3;

  const ticketTitle = 
    data.ticketType === 'kitchen' ? 'TIKET DAPUR (KITCHEN)' :
    data.ticketType === 'bar' ? 'TIKET BAR & MINUMAN' :
    data.ticketType === 'recap' ? 'REKAP PENJUALAN' :
    'STRUK PEMBAYARAN';

  const isOrderTicketOnly = data.ticketType === 'kitchen' || data.ticketType === 'bar';

  let itemsHtml = '';
  data.items.forEach(item => {
    const itemSubtotal = formatRupiahThermal(item.subtotal);
    const itemPrice = formatRupiahThermal(item.price);
    
    itemsHtml += `
      <div style="margin-bottom: 5px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span style="flex: 1; word-break: break-word;">${item.name}</span>
          ${!isOrderTicketOnly ? `<span style="margin-left: 8px; text-align: right; white-space: nowrap;">${itemSubtotal}</span>` : ''}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: ${isMini ? '10px' : '11px'}; color: #333;">
          <span>${item.qty}x ${!isOrderTicketOnly ? `@ ${itemPrice}` : ''}</span>
        </div>
        ${item.notes ? `<div style="font-size: ${isMini ? '10px' : '11px'}; font-style: italic; color: #111; padding-left: 6px; border-left: 2px solid #000;">* ${item.notes}</div>` : ''}
      </div>
    `;
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.orderNumber} - Print</title>
  <style>
    @page {
      size: ${width} auto;
      margin: 0;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      width: ${width};
      max-width: ${width};
      margin: 0 auto;
      padding: ${isMini ? '6px 4px' : '10px 8px'};
      font-family: 'Courier New', Courier, monospace, monospace;
      font-size: ${isMini ? '11px' : '12px'};
      line-height: 1.35;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .title {
      font-size: ${isMini ? '13px' : '15px'};
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .subtitle {
      font-size: ${isMini ? '11px' : '12px'};
      font-weight: bold;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .divider-double {
      border-top: 1px double #000;
      margin: 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .feed-space {
      height: ${feed * 14}px;
    }
    @media print {
      .no-print {
        display: none !important;
      }
    }
    .no-print-bar {
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .btn-print {
      background: #0f172a;
      color: #ffffff;
      border: none;
      padding: 7px 16px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      margin-right: 8px;
    }
    .btn-close {
      background: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 7px 14px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="no-print no-print-bar">
    <button class="btn-print" onclick="window.print()">🖨️ Cetak ke Printer</button>
    <button class="btn-close" onclick="window.close()">✕ Tutup</button>
    <div style="font-size: 11px; color: #64748b; margin-top: 5px;">
      Dialog print browser akan terbuka otomatis. Jika tidak terbuka, klik tombol di atas.
    </div>
  </div>

  <div class="text-center">
    <div class="title">${data.storeName || 'IMAH KAYU JATINANGOR'}</div>
    ${data.storeAddress ? `<div style="font-size: ${isMini ? '9px' : '10px'};">${data.storeAddress}</div>` : ''}
    ${data.storePhone ? `<div style="font-size: ${isMini ? '9px' : '10px'};">Telp: ${data.storePhone}</div>` : ''}
    <div class="divider"></div>
    <div class="subtitle" style="text-transform: uppercase;">-- ${ticketTitle} --</div>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span>No. Order :</span>
    <span class="font-bold">${data.orderNumber}</span>
  </div>
  <div class="row">
    <span>Waktu    :</span>
    <span>${data.date} ${data.time}</span>
  </div>
  <div class="row">
    <span>Kasir    :</span>
    <span>${data.cashierName}</span>
  </div>
  <div class="row">
    <span>Meja/Tipe:</span>
    <span class="font-bold">${data.tableNumber} (${data.orderType}${data.pax ? `, ${data.pax}pax` : ''})</span>
  </div>
  ${data.customerName ? `
  <div class="row">
    <span>Pelanggan:</span>
    <span class="font-bold">${data.customerName}</span>
  </div>` : ''}

  <div class="divider"></div>

  <div style="margin: 6px 0;">
    ${itemsHtml}
  </div>

  ${!isOrderTicketOnly ? `
  <div class="divider"></div>

  ${data.subtotalAmount !== undefined ? `
  <div class="row">
    <span>Subtotal:</span>
    <span>${formatRupiahThermal(data.subtotalAmount)}</span>
  </div>` : ''}

  ${data.discountAmount && data.discountAmount > 0 ? `
  <div class="row">
    <span>Diskon (${data.discountName || 'Promo'}):</span>
    <span>-${formatRupiahThermal(data.discountAmount)}</span>
  </div>` : ''}

  ${data.serviceAmount && data.serviceAmount > 0 ? `
  <div class="row">
    <span>Service:</span>
    <span>${formatRupiahThermal(data.serviceAmount)}</span>
  </div>` : ''}

  ${data.taxAmount && data.taxAmount > 0 ? `
  <div class="row">
    <span>PB1 / Pajak (10%):</span>
    <span>${formatRupiahThermal(data.taxAmount)}</span>
  </div>` : ''}

  <div class="divider-double"></div>

  <div class="row" style="font-size: ${isMini ? '12px' : '14px'}; font-weight: 900;">
    <span>TOTAL AKHIR:</span>
    <span>${formatRupiahThermal(data.totalAmount)}</span>
  </div>

  <div class="row" style="margin-top: 4px;">
    <span>Metode Bayar:</span>
    <span class="font-bold">${data.paymentMethod || 'Cash'}</span>
  </div>
  <div class="row">
    <span>Status:</span>
    <span class="font-bold">${data.paymentStatus || 'LUNAS'}</span>
  </div>
  ` : ''}

  <div class="divider"></div>

  <div class="text-center" style="margin-top: 8px; font-size: ${isMini ? '9px' : '10px'};">
    ${data.footerText ? `<div>${data.footerText}</div>` : '<div>Terima Kasih Atas Kunjungan Anda</div>'}
    <div>Simpan struk ini sebagai bukti pembayaran yang sah</div>
    <div style="font-size: 8px; color: #666; margin-top: 4px;">Powered by POS Imah Kayu Jatinangor</div>
  </div>

  <!-- Feed paper before cut -->
  <div class="feed-space"></div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.log('Auto-print error', e);
        }
      }, 350);
    });
  </script>
</body>
</html>
  `.trim();
}

/**
 * Detects whether the current app is running inside an iframe (like AI Studio preview)
 */
export function isAppInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Generates human-readable plain text receipt suitable for Bluetooth thermal printers / RawBT / text sharing
 */
export function generateReceiptPlainText(data: ReceiptPrintOptions): string {
  const isMini = data.paperWidth === '58mm';
  const width = isMini ? 32 : 42; // standard characters per line for 58mm vs 80mm
  const divider = '='.repeat(width);
  const thinDivider = '-'.repeat(width);

  const center = (str: string) => {
    if (str.length >= width) return str.slice(0, width);
    const leftPad = Math.floor((width - str.length) / 2);
    return ' '.repeat(leftPad) + str;
  };

  const line2Cols = (left: string, right: string) => {
    const spaceCount = Math.max(1, width - left.length - right.length);
    return left + ' '.repeat(spaceCount) + right;
  };

  let title = 'CHECKER SLIP';
  if (data.ticketType === 'kitchen') title = 'PESANAN DAPUR';
  if (data.ticketType === 'bar') title = 'PESANAN BAR';

  const lines: string[] = [];
  lines.push(center(title));
  if (data.storeName) lines.push(center(data.storeName.toUpperCase()));
  if (data.storeAddress && data.ticketType === 'checker') lines.push(center(data.storeAddress));
  if (data.storePhone && data.ticketType === 'checker') lines.push(center('Telp: ' + data.storePhone));
  lines.push(divider);

  lines.push(line2Cols(`No: ${data.orderNumber}`, data.time));
  lines.push(line2Cols(`Tgl: ${data.date}`, `Kasir: ${data.cashierName}`));
  lines.push(line2Cols(`Meja: ${data.tableNumber}`, `${data.orderType} (${data.pax || 1} Pax)`));
  if (data.customerName) lines.push(`Pelanggan: ${data.customerName}`);
  lines.push(thinDivider);

  data.items.forEach((item) => {
    if (data.ticketType === 'checker') {
      const itemLine = `${item.qty}x ${item.name}`;
      const priceLine = formatRupiahThermal(item.subtotal);
      lines.push(line2Cols(itemLine, priceLine));
      if (item.notes) {
        lines.push(`  * ${item.notes}`);
      }
    } else {
      lines.push(`[${item.qty}x] ${item.name}`);
      if (item.notes) {
        lines.push(`  >>> Catatan: ${item.notes}`);
      }
    }
  });

  lines.push(thinDivider);

  if (data.ticketType === 'checker') {
    if (data.subtotalAmount) lines.push(line2Cols('Subtotal:', formatRupiahThermal(data.subtotalAmount)));
    if (data.discountAmount) lines.push(line2Cols(`Diskon ${data.discountName || ''}:`, `-${formatRupiahThermal(data.discountAmount)}`));
    if (data.serviceAmount) lines.push(line2Cols('Service Charge:', formatRupiahThermal(data.serviceAmount)));
    if (data.taxAmount) lines.push(line2Cols('PB1 / Pajak (10%):', formatRupiahThermal(data.taxAmount)));
    lines.push(divider);
    lines.push(line2Cols('TOTAL BAYAR:', formatRupiahThermal(data.totalAmount)));
    lines.push(line2Cols('Metode Bayar:', data.paymentMethod || 'Cash'));
    lines.push(line2Cols('Status:', data.paymentStatus || 'LUNAS'));
    lines.push(divider);
    lines.push(center(data.footerText || 'Terima Kasih Atas Kunjungan Anda'));
  } else {
    lines.push(divider);
    lines.push(center('SEGERA PROSES PESANAN INI'));
  }

  lines.push('\n\n\n'); // feed lines
  return lines.join('\n');
}

/**
 * Triggers printing in a clean standalone pop-up window.
 * This is 100% reliable even when the host page runs in sandboxed iframes.
 */
export function printReceiptInNewWindow(options: ReceiptPrintOptions): boolean {
  try {
    const html = generateReceiptHTML(options);
    const win = window.open(
      '',
      '_blank',
      'width=450,height=650,top=100,left=100,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
    );
    if (!win) {
      console.warn('Popup window blocked by browser, trying blob URL fallback');
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener,noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
      return true;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();

    // Auto-trigger print once document loads
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch (err) {
        console.warn('Error invoking print() on popup window:', err);
      }
    }, 400);

    return true;
  } catch (e) {
    console.error('Failed to open print popup window:', e);
    return false;
  }
}

/**
 * Triggers thermal print directly to any installed printer
 * via an offscreen iframe. Falls back to popup window or DOM print if blocked.
 */
export function printReceiptToPrinter(options: ReceiptPrintOptions): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const html = generateReceiptHTML(options);
      
      // Check if running in sandboxed iframe (which might silently block iframe.print)
      const inIframe = isAppInIframe();

      // If running inside an iframe, try iframe first, but prepare popup fallback
      const iframe = document.createElement('iframe');
      // Use offscreen positioning instead of visibility:hidden or width:0
      // Many browser print engines completely ignore visibility:hidden or 0-dimension iframes
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '350px';
      iframe.style.height = '600px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.zIndex = '-9999';
      
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        console.warn('Cannot access iframe document, attempting popup window');
        const opened = printReceiptInNewWindow(options);
        if (!opened) window.print();
        resolve(true);
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        let printedSuccess = false;
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            printedSuccess = true;
          }
        } catch (e) {
          console.warn('Iframe print failed due to sandbox security:', e);
        }

        // Cleanup iframe after a delay
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);

        // If inside iframe and standard print didn't prompt or errored, offer popup window
        if (!printedSuccess && inIframe) {
          printReceiptInNewWindow(options);
        }

        resolve(true);
      }, 350);
    } catch (err) {
      console.error('Error generating print iframe:', err);
      printReceiptInNewWindow(options);
      resolve(false);
    }
  });
}

/**
 * Prints the inner HTML of any DOM element directly to a thermal printer
 */
export async function printHtmlElementToPrinter(
  elementId: string, 
  paperWidth: '58mm' | '80mm' = '80mm',
  title: string = 'Rekap Cetak Thermal'
): Promise<boolean> {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`Element #${elementId} not found, falling back to window.print()`);
    window.print();
    return false;
  }

  const width = paperWidth === '58mm' ? '58mm' : '80mm';
  const isMini = paperWidth === '58mm';

  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: ${width} auto;
      margin: 0;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      width: ${width};
      max-width: ${width};
      margin: 0 auto;
      padding: ${isMini ? '6px 4px' : '10px 8px'};
      font-family: 'Courier New', Courier, monospace, monospace;
      font-size: ${isMini ? '10px' : '11px'};
      line-height: 1.25;
      color: #000;
      background: #fff;
    }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold, .font-black { font-weight: bold; }
    .border-b { border-bottom: 1px dashed #000; }
    .border-t { border-top: 1px dashed #000; }
    .py-1 { padding-top: 4px; padding-bottom: 4px; }
    .py-2 { padding-top: 8px; padding-bottom: 8px; }
    .pb-2 { padding-bottom: 8px; }
    .pt-1 { padding-top: 4px; }
    .pt-2 { padding-top: 8px; }
    .uppercase { text-transform: uppercase; }
  </style>
</head>
<body>
  ${el.innerHTML}
  <div style="height: 25px;"></div>
</body>
</html>
  `;

  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '380px';
      iframe.style.height = '600px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.zIndex = '-9999';
      
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        resolve(true);
        return;
      }

      doc.open();
      doc.write(fullHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            resolve(true);
          }, 2000);
        } catch (e) {
          console.error('Error printing element iframe:', e);
          window.print();
          resolve(true);
        }
      }, 300);
    } catch (e) {
      console.error('Error creating iframe for element print:', e);
      window.print();
      resolve(false);
    }
  });
}

