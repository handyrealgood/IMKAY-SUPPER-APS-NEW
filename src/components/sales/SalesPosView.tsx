import React, { useState } from 'react';
import { useResto } from '../../context/RestoContext';
import { MenuItem, TableOrder, TableOrderItem, PaymentMethodConfig, PrinterRoutingSetting } from '../../types';
import { safeStorage } from '../../utils/safeStorage';
import { 
  Store, 
  UtensilsCrossed, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Printer, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Coffee, 
  Clock, 
  Users, 
  CreditCard, 
  Receipt, 
  X,
  History,
  QrCode,
  DollarSign,
  Settings,
  Flame,
  FileText,
  Building2,
  MapPin,
  Phone,
  Percent,
  Split,
  ArrowRightLeft,
  MoveRight,
  Ban,
  ShieldCheck,
  Sparkles,
  User,
  CalendarDays,
  Copy,
  ExternalLink
} from 'lucide-react';
import { ActiveTablesTab } from './ActiveTablesTab';
import { PosBackOfficeTab } from './PosBackOfficeTab';
import { PosClosingModal, ClosingMode } from './PosClosingModal';
import { 
  printReceiptToPrinter, 
  printReceiptInNewWindow, 
  generateReceiptPlainText, 
  isAppInIframe,
  ReceiptPrintOptions,
  formatRupiahThermal
} from '../../utils/printerUtils';

export const SalesPosView: React.FC = () => {
  const { 
    menuItems, 
    rawItems, 
    tableOrders, 
    addTableOrder, 
    paymentMethods, 
    addPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod,
    printerRouting, 
    updatePrinterRouting,
    updateMenuItemSoldLimit,
    currentUser, 
    formatRupiah,
    promos,
    taxServiceConfig,
    restoTables
  } = useResto();

  const isMasterOrManager = currentUser.role === 'manager' || currentUser.isMasterAdmin;

  // View state: 'pos' (active cashier), 'active_tables', 'history', or 'backoffice' (Manager Only)
  const [activeSubTab, setActiveSubTabState] = useState<'pos' | 'active_tables' | 'history' | 'backoffice'>(() => {
    try {
      const saved = safeStorage.getItem('resto_pos_subtab');
      if (saved) return saved as any;
    } catch {}
    return 'pos';
  });

  const setActiveSubTab = (tab: 'pos' | 'active_tables' | 'history' | 'backoffice') => {
    setActiveSubTabState(tab);
    try {
      safeStorage.setItem('resto_pos_subtab', tab);
    } catch {}
  };

  // Dynamic tables list from Back Office tables
  const tableList = restoTables && restoTables.length > 0
    ? restoTables.filter(t => t.isActive).map(t => `${t.name} (No. ${t.number})`)
    : [
        'Meja 01', 'Meja 02', 'Meja 03', 'Meja 04', 'Meja 05',
        'Meja 06', 'Meja 07', 'Meja 08', 'Meja 09', 'Meja 10',
        'VIP Room 1', 'VIP Room 2', 'Bar Counter', 'Outdoor A1', 'Outdoor A2'
      ];

  // Order Cart State
  const [orderType, setOrderType] = useState<'Dine In' | 'Take Away'>('Dine In');
  const [tableNumber, setTableNumber] = useState<string>(() => {
    if (restoTables && restoTables.length > 0) {
      const active = restoTables.find(t => t.isActive) || restoTables[0];
      return `${active.name} (No. ${active.number})`;
    }
    return 'Meja 01';
  });
  const [pax, setPax] = useState<number>(2);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedPromoId, setSelectedPromoId] = useState<string>('');
  const [payImmediately, setPayImmediately] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<TableOrderItem[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
    paymentMethods.find(m => m.isActive)?.name || 'Tunai (Cash)'
  );
  const [orderNotes, setOrderNotes] = useState('');

  // Routing override for current order
  const [routeKitchen, setRouteKitchen] = useState<boolean>(true);
  const [routeBar, setRouteBar] = useState<boolean>(true);
  const [routeChecker, setRouteChecker] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showSoldLimitModal, setShowSoldLimitModal] = useState<MenuItem | null>(null);
  const [limitInput, setLimitInput] = useState<string>('10');
  
  // Unified POS Settings Center Modal
  const [showUnifiedSettings, setShowUnifiedSettings] = useState(false);
  const [posSettingTab, setPosSettingTab] = useState<'payment' | 'printers' | 'receipt'>('payment');

  // Receipt & Store branding configuration
  const [receiptStoreName, setReceiptStoreName] = useState('Imah Kayu Jatinangor');
  const [receiptAddress, setReceiptAddress] = useState('Jl. Raya Bandung - Sumedang No.315, Hegarmanah, Jatinangor, Sumedang');
  const [receiptPhone, setReceiptPhone] = useState('0812-3456-7890');
  const [receiptFooter, setReceiptFooter] = useState('Terima kasih atas kunjungan Anda! Silakan datang kembali.');
  const [taxPercent, setTaxPercent] = useState<number>(10);
  const [servicePercent, setServicePercent] = useState<number>(0);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPayName, setNewPayName] = useState('');
  const [newPayType, setNewPayType] = useState<PaymentMethodConfig['type']>('qris');
  const [newPayBank, setNewPayBank] = useState('');
  const [newPayAcc, setNewPayAcc] = useState('');

  const [showPrinterModal, setShowPrinterModal] = useState(false);

  // Print Slip Modal for placed order
  const [printedOrder, setPrintedOrder] = useState<TableOrder | null>(null);
  const [printTicketTab, setPrintTicketTab] = useState<'checker' | 'kitchen' | 'bar'>('checker');
  const [printerPaperSize, setPrinterPaperSize] = useState<'58mm' | '80mm'>(() => {
    return (safeStorage.getItem('pos_printer_paper_size') as '58mm' | '80mm') || '80mm';
  });

  const handleSetPaperSize = (size: '58mm' | '80mm') => {
    setPrinterPaperSize(size);
    safeStorage.setItem('pos_printer_paper_size', size);
  };

  const [activePrintPayload, setActivePrintPayload] = useState<ReceiptPrintOptions | null>(null);
  const [copiedReceiptToast, setCopiedReceiptToast] = useState(false);
  const inIframe = isAppInIframe();

  // End Shift & End of Day Modal State (Accessible by all staff)
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingModalMode, setClosingModalMode] = useState<ClosingMode>('shift');

  // Categories list
  const categories = ['all', ...Array.from(new Set(menuItems.map(m => m.category)))];

  // Filtered menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Cart operations
  const handleAddToCart = (menu: MenuItem) => {
    if (menu.isSoldOut) return;
    setCartItems(prev => {
      const existing = prev.find(i => i.menuItemId === menu.id);
      if (existing) {
        return prev.map(i => i.menuItemId === menu.id 
          ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.price }
          : i
        );
      }
      return [...prev, {
        menuItemId: menu.id,
        menuItemName: menu.name,
        category: menu.category,
        price: menu.sellingPrice,
        qty: 1,
        subtotal: menu.sellingPrice,
      }];
    });

    // Auto-adjust printer route based on item added
    const isBeverage = menu.category.toLowerCase().includes('minuman') || menu.category.toLowerCase().includes('drink');
    if (isBeverage && printerRouting.barPrinter.isEnabled) {
      setRouteBar(true);
    } else if (printerRouting.kitchenPrinter.isEnabled) {
      setRouteKitchen(true);
    }
  };

  const handleUpdateQty = (menuItemId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(i => {
        if (i.menuItemId === menuItemId) {
          const newQty = i.qty + delta;
          if (newQty <= 0) return null;
          return { ...i, qty: newQty, subtotal: newQty * i.price };
        }
        return i;
      }).filter(Boolean) as TableOrderItem[];
    });
  };

  const handleUpdateItemNotes = (menuItemId: string, notes: string) => {
    setCartItems(prev => prev.map(i => i.menuItemId === menuItemId ? { ...i, notes } : i));
  };

  const handleRemoveFromCart = (menuItemId: string) => {
    setCartItems(prev => prev.filter(i => i.menuItemId !== menuItemId));
  };

  const cartSubtotal = cartItems.reduce((sum, i) => sum + i.subtotal, 0);

  // Promo Calculation
  const selectedPromo = (promos || []).find(p => p.id === selectedPromoId && p.isActive);
  let discountAmount = 0;
  if (selectedPromo) {
    if (selectedPromo.applyTo === 'all') {
      discountAmount = Math.round((cartSubtotal * selectedPromo.discountPercent) / 100);
    } else if (selectedPromo.applyTo === 'specific' && selectedPromo.itemIds) {
      const eligibleSubtotal = cartItems
        .filter(it => selectedPromo.itemIds?.includes(it.menuItemId))
        .reduce((sum, it) => sum + it.subtotal, 0);
      discountAmount = Math.round((eligibleSubtotal * selectedPromo.discountPercent) / 100);
    }
  }

  const afterDiscount = Math.max(0, cartSubtotal - discountAmount);
  const serviceAmount = taxServiceConfig?.isServiceActive 
    ? Math.round(afterDiscount * (taxServiceConfig.servicePercent / 100)) 
    : 0;
  const taxAmount = taxServiceConfig?.isTaxActive 
    ? Math.round((afterDiscount + serviceAmount) * (taxServiceConfig.taxPercent / 100)) 
    : 0;
  const cartTotal = afterDiscount + serviceAmount + taxAmount;

  // Checkout submission
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Pilih minimal 1 menu untuk membuat pesanan!');
      return;
    }

    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayOfWeek = days[now.getDay()];
    const timeStr = now.toTimeString().slice(0, 5);

    // Calculate total HPP for order based on menu items
    const totalHPP = cartItems.reduce((sum, item) => {
      const menu = menuItems.find(m => m.id === item.menuItemId);
      return sum + ((menu?.totalHPP || 0) * item.qty);
    }, 0);

    const newOrder = addTableOrder({
      date: now.toISOString().slice(0, 10),
      time: timeStr,
      dayOfWeek,
      orderType,
      tableNumber: orderType === 'Take Away' ? 'Take Away' : tableNumber,
      pax: orderType === 'Take Away' ? 1 : Math.max(1, pax),
      items: cartItems,
      subtotalAmount: cartSubtotal,
      discountPercent: selectedPromo ? selectedPromo.discountPercent : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      discountName: selectedPromo ? selectedPromo.name : undefined,
      serviceAmount: serviceAmount > 0 ? serviceAmount : undefined,
      taxAmount: taxAmount > 0 ? taxAmount : undefined,
      totalAmount: cartTotal,
      totalHPP,
      paymentMethod: selectedPaymentMethod,
      paymentStatus: payImmediately ? 'Lunas' : 'Belum Bayar',
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      cashierName: currentUser.name,
      printerRouting: {
        kitchen: routeKitchen && printerRouting.kitchenPrinter.isEnabled,
        bar: routeBar && printerRouting.barPrinter.isEnabled,
        checker: routeChecker && printerRouting.checkerPrinter.isEnabled,
      },
      notes: orderNotes.trim() || undefined,
    });

    // Reset cart & inputs & open print preview
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedPromoId('');
    setOrderNotes('');
    setPrintedOrder(newOrder);
  };

  // Sold-limit handler (Can be updated by ANYONE)
  const handleSaveSoldLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSoldLimitModal) return;
    const parsed = parseInt(limitInput, 10);
    if (isNaN(parsed) || parsed < 0) {
      updateMenuItemSoldLimit(showSoldLimitModal.id, null); // Clear limit
    } else {
      updateMenuItemSoldLimit(showSoldLimitModal.id, parsed);
    }
    setShowSoldLimitModal(null);
  };

  const handleMarkSoldOut = (menuId: string) => {
    updateMenuItemSoldLimit(menuId, 0);
    setShowSoldLimitModal(null);
  };

  const handleClearLimit = (menuId: string) => {
    updateMenuItemSoldLimit(menuId, null);
    setShowSoldLimitModal(null);
  };

  // Payment Method Create (Manager)
  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayName.trim()) return;
    addPaymentMethod({
      name: newPayName.trim(),
      type: newPayType,
      bankOrProvider: newPayBank.trim() || undefined,
      accountNumber: newPayAcc.trim() || undefined,
      isActive: true,
    });
    setNewPayName('');
    setNewPayBank('');
    setNewPayAcc('');
  };

  // Helper to build receipt print payload
  const getReceiptPayload = (
    ticketType: 'checker' | 'kitchen' | 'bar',
    orderToUse?: TableOrder | null
  ): ReceiptPrintOptions | null => {
    const order = orderToUse || printedOrder;
    if (!order) return null;

    let itemsToPrint = order.items;
    if (ticketType === 'kitchen') {
      itemsToPrint = order.items.filter(i => 
        !i.category.toLowerCase().includes('minuman') && !i.category.toLowerCase().includes('drink')
      );
    } else if (ticketType === 'bar') {
      itemsToPrint = order.items.filter(i => 
        i.category.toLowerCase().includes('minuman') || i.category.toLowerCase().includes('drink')
      );
    }

    return {
      paperWidth: printerPaperSize,
      storeName: receiptStoreName,
      storeAddress: receiptAddress,
      storePhone: receiptPhone,
      orderNumber: order.orderNumber,
      date: order.date,
      time: order.time,
      cashierName: order.cashierName,
      tableNumber: order.tableNumber,
      pax: order.pax,
      orderType: order.orderType,
      items: itemsToPrint.map(i => ({
        name: i.menuItemName,
        qty: i.qty,
        price: i.price,
        subtotal: i.subtotal,
        notes: i.notes,
        category: i.category,
      })),
      subtotalAmount: order.subtotalAmount,
      discountAmount: order.discountAmount,
      discountName: order.discountName,
      serviceAmount: order.serviceAmount,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      footerText: receiptFooter,
      ticketType,
    };
  };

  // Direct print ticket handler using isolated thermal printer engine
  const handleDirectPrintTicket = async (
    ticketType: 'checker' | 'kitchen' | 'bar',
    customOrder?: TableOrder
  ) => {
    const order = customOrder || printedOrder;
    if (!order) return;
    
    const payload = getReceiptPayload(ticketType, order);
    if (!payload) return;

    if (payload.items.length === 0 && ticketType !== 'checker') {
      alert(`Tidak ada item pesanan untuk stasiun ${ticketType === 'kitchen' ? 'Dapur / Kitchen' : 'Bar Minuman'}.`);
      return;
    }

    setActivePrintPayload(payload);
    await printReceiptToPrinter(payload);
  };

  // Test print ticket generator for testing printer routing
  const handleTestPrintStation = (station: 'kitchen' | 'bar' | 'checker') => {
    const testOrder: TableOrder = {
      id: 'test-order-' + Date.now(),
      orderNumber: 'TEST-PRT-01',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      dayOfWeek: 'Senin',
      cashierName: currentUser.name + ' (Testing)',
      tableNumber: 'Meja Test 01',
      pax: 2,
      orderType: 'Dine In',
      totalHPP: 25000,
      items: [
        {
          menuItemId: 'm1',
          menuItemName: 'Ayam Goreng Lengkuas',
          price: 32000,
          qty: 2,
          notes: 'Pedas sedang, sambal dipisah',
          category: 'Makanan Utama',
          subtotal: 64000,
        },
        {
          menuItemId: 'm2',
          menuItemName: 'Es Teh Manis Melati',
          price: 8000,
          qty: 2,
          notes: 'Less sugar, es sedikit',
          category: 'Minuman Segar',
          subtotal: 16000,
        },
      ],
      totalAmount: 80000,
      paymentMethod: 'QRIS BCA Digital',
      paymentStatus: 'Lunas',
      notes: 'Uji coba cetak routing printer',
      printerRouting: {
        kitchen: station === 'kitchen' || station === 'checker',
        bar: station === 'bar' || station === 'checker',
        checker: true,
      },
    };

    setPrintedOrder(testOrder);
    setPrintTicketTab(station);

    // Prepare payload and auto trigger direct print immediately
    const payload = getReceiptPayload(station, testOrder);
    if (payload) {
      setActivePrintPayload(payload);
      setTimeout(() => {
        printReceiptToPrinter(payload);
      }, 200);
    }
  };

  // Kitchen vs Bar items filter for ticket printing
  const kitchenItems = printedOrder?.items.filter(i => 
    !i.category.toLowerCase().includes('minuman') && !i.category.toLowerCase().includes('drink')
  ) || [];

  const barItems = printedOrder?.items.filter(i => 
    i.category.toLowerCase().includes('minuman') || i.category.toLowerCase().includes('drink')
  ) || [];

  // Print all tickets in sequence (Checker, then Kitchen, then Bar)
  const handlePrintAllTickets = async () => {
    if (!printedOrder) return;
    
    // 1. Checker slip (always printed)
    await handleDirectPrintTicket('checker');

    // 2. Kitchen ticket if routed & items exist
    if (kitchenItems.length > 0) {
      setTimeout(async () => {
        await handleDirectPrintTicket('kitchen');
      }, 1200);
    }

    // 3. Bar ticket if routed & items exist
    if (barItems.length > 0) {
      setTimeout(async () => {
        await handleDirectPrintTicket('bar');
      }, 2400);
    }
  };

  // Copy plain text receipt to clipboard
  const handleCopyPlainTextReceipt = () => {
    const payload = getReceiptPayload(printTicketTab);
    if (!payload) return;
    const text = generateReceiptPlainText(payload);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedReceiptToast(true);
      setTimeout(() => setCopiedReceiptToast(false), 2500);
    }).catch(err => {
      console.error('Failed to copy receipt text', err);
    });
  };

  // Open standalone print pop-up window
  const handleOpenPrintWindow = () => {
    const payload = getReceiptPayload(printTicketTab);
    if (!payload) return;
    printReceiptInNewWindow(payload);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Point of Sales (POS) & Penjualan</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Kasir Real-time
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Menu interaktif, pilih meja & pax, sold-limit menu langsung, cetak tiket otomatis ke Kitchen, Bar & Checker.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-tab switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 flex-wrap gap-1">
            <button
              onClick={() => setActiveSubTab('pos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'pos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Input Pesanan</span>
            </button>
            <button
              onClick={() => setActiveSubTab('active_tables')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'active_tables' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Meja Aktif ({tableOrders.filter(o => o.paymentStatus === 'Belum Bayar' && !o.isCancelled).length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat ({tableOrders.length})</span>
            </button>

            {isMasterOrManager && (
              <button
                onClick={() => setActiveSubTab('backoffice')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'backoffice' 
                    ? 'bg-amber-500 text-slate-950 shadow-xs' 
                    : 'bg-amber-100/70 text-amber-950 hover:bg-amber-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Back Office (Manager Only)</span>
              </button>
            )}
          </div>

          {/* End Shift & End of Day Buttons - Accessible to ALL staff roles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setClosingModalMode('shift');
                setShowClosingModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-all border border-amber-600 active:scale-95"
              title="Tutup Shift Kasir: Rekapitulasi penjualan shift, list menu terjual, gross/nett, pajak, service, pax, meja terisi, cetak printer kasir & export excel"
            >
              <Clock className="w-3.5 h-3.5 text-slate-950" />
              <span>End Shift</span>
              <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 bg-amber-400/80 text-amber-950 rounded font-bold">
                Tutup Shift
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setClosingModalMode('day');
                setShowClosingModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all border border-indigo-700 active:scale-95"
              title="Tutup Kasir Harian: Rekapitulasi total penjualan hari ini (Full Day), cetak printer kasir & export excel"
            >
              <CalendarDays className="w-3.5 h-3.5 text-indigo-200" />
              <span>End of Day</span>
              <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 bg-indigo-500 text-indigo-100 rounded font-bold">
                Tutup Hari
              </span>
            </button>
          </div>

          {/* Unified POS Settings Button - Readily accessible to manage Payment, Printers & Receipt */}
          <button
            onClick={() => {
              setPosSettingTab('payment');
              setShowUnifiedSettings(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all border border-slate-900"
            title="Pusat Pengaturan POS: Metode Pembayaran, Routing Printer Dapur/Bar, & Format Struk"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Pengaturan POS</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-amber-300 rounded font-semibold border border-slate-700">
              3 Menu
            </span>
          </button>
        </div>
      </div>

      {activeSubTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 7-8 COLS: MENU CATALOG */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            
            {/* Filter & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama menu atau minuman..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />
              </div>

              {/* Category selector */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Semua Menu' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredMenuItems.map(menu => {
                const inCart = cartItems.find(i => i.menuItemId === menu.id);
                const hasLimit = typeof menu.soldLimit === 'number';
                
                return (
                  <div 
                    key={menu.id}
                    className={`bg-white rounded-2xl border p-3.5 flex flex-col justify-between transition-all relative ${
                      menu.isSoldOut 
                        ? 'border-red-200 bg-red-50/20 opacity-75' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                          {menu.category}
                        </span>

                        {/* Sold limit badge (Clickable by ANYONE to update) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSoldLimitModal(menu);
                            setLimitInput(hasLimit ? String(menu.soldLimit) : '10');
                          }}
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md transition-all border flex items-center gap-1 ${
                            menu.isSoldOut
                              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              : hasLimit
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="Klik untuk ubah Sold-Limit Menu ini (Bisa oleh siapapun)"
                        >
                          <Flame className="w-3 h-3" />
                          <span>
                            {menu.isSoldOut 
                              ? 'HABIS' 
                              : hasLimit 
                              ? `Sisa: ${menu.soldLimit}` 
                              : 'Limit: ∞'}
                          </span>
                        </button>
                      </div>

                      {/* Menu Name & Price */}
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {menu.name}
                      </h4>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm font-black text-slate-900">
                          {formatRupiah(menu.sellingPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          HPP: {formatRupiah(menu.totalHPP)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSoldLimitModal(menu);
                          setLimitInput(hasLimit ? String(menu.soldLimit) : '10');
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:underline"
                      >
                        ⚙️ Atur Limit
                      </button>

                      {inCart ? (
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(menu.id, -1)}
                            className="p-1 rounded-lg bg-white text-slate-800 hover:bg-slate-200"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-black text-xs text-slate-900">{inCart.qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(menu.id, 1)}
                            disabled={hasLimit && inCart.qty >= (menu.soldLimit || 0)}
                            className="p-1 rounded-lg bg-white text-slate-800 hover:bg-slate-200 disabled:opacity-40"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(menu)}
                          disabled={menu.isSoldOut}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pesan</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* RIGHT 4-5 COLS: ORDER CART & CHECKOUT SLIP */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 sticky top-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-800" />
                <h3 className="font-black text-slate-900 text-base">Pesanan Kasir</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {cartItems.reduce((s, i) => s + i.qty, 0)} Item
              </span>
            </div>

            {/* 1. Dine In vs Take Away & Table & Pax */}
            <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              
              {/* Order Type Switcher */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipe Pesanan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('Dine In')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                      orderType === 'Dine In'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🍽️ Dine In (Makan Sini)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('Take Away')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                      orderType === 'Take Away'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🥡 Take Away (Bungkus)
                  </button>
                </div>
              </div>

              {/* Table & Pax selector (if Dine In) */}
              {orderType === 'Dine In' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Meja</label>
                    <select
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                    >
                      {tableList.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jumlah Pax (Tamu)</label>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setPax(Math.max(1, pax - 1))}
                        className="px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 font-bold"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-black text-slate-900">{pax}</span>
                      <button
                        type="button"
                        onClick={() => setPax(pax + 1)}
                        className="px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Name & Phone (Optional) */}
              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Nama Tamu</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bpk Budi (Opsional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>No. HP Customer</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="0812xxxx (Opsional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

            </div>

            {/* 2. Cart Items List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada menu dipilih. Klik tombol <strong>+ Pesan</strong> pada menu.
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.menuItemId} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-slate-900 block truncate">{item.menuItemName}</span>
                        <span className="text-[10px] text-slate-500">{formatRupiah(item.price)} x {item.qty}</span>
                      </div>
                      <span className="font-black text-slate-900">{formatRupiah(item.subtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <input
                        type="text"
                        placeholder="Catatan (pedas, less ice...)"
                        value={item.notes || ''}
                        onChange={(e) => handleUpdateItemNotes(item.menuItemId, e.target.value)}
                        className="flex-1 px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg"
                      />

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.menuItemId, -1)}
                          className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-xs">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.menuItemId, 1)}
                          className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.menuItemId)}
                          className="p-1 text-red-500 hover:text-red-700 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 3. Payment Method Selection */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Metode Pembayaran</label>
                <button
                  type="button"
                  onClick={() => {
                    setPosSettingTab('payment');
                    setShowUnifiedSettings(true);
                  }}
                  className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                  title="Buka Pengaturan Metode Pembayaran"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>+ Atur / Tambah</span>
                </button>
              </div>

              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              >
                {paymentMethods.filter(m => m.isActive).map(m => (
                  <option key={m.id} value={m.name}>
                    {m.name} {m.bankOrProvider ? `(${m.bankOrProvider})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Program Promo / Diskon */}
            <div className="space-y-1.5 text-xs bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
              <div className="flex items-center justify-between">
                <label className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-600" />
                  <span>Program Diskon & Promo (Opsional)</span>
                </label>
                {selectedPromo && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                    Hemat {formatRupiah(discountAmount)}
                  </span>
                )}
              </div>
              <select
                value={selectedPromoId}
                onChange={(e) => setSelectedPromoId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-slate-900"
              >
                <option value="">Tanpa Diskon / Promo</option>
                {(promos || []).filter(p => p.isActive).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Diskon {p.discountPercent}% ({p.applyTo === 'all' ? 'Seluruh Menu' : `${p.itemIds?.length || 0} Menu Pilihan`})
                  </option>
                ))}
              </select>
              {selectedPromo && selectedPromo.applyTo === 'specific' && (
                <p className="text-[10px] text-amber-800 italic">
                  * Diskon hanya diterapkan pada item menu yang masuk daftar promo.
                </p>
              )}
            </div>

            {/* 5. Mode Pembayaran Tagihan: Open Bill vs Bayar Langsung */}
            <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-700 block">Status Pembayaran Meja</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayImmediately(false)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    !payImmediately
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Buka Tagihan (Open Bill)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayImmediately(true)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    payImmediately
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bayar Langsung (Lunas)</span>
                </button>
              </div>
            </div>

            {/* 6. Printer Routing Checkmarks */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  Print Check Mark Routing
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPosSettingTab('printers');
                    setShowUnifiedSettings(true);
                  }}
                  className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                  title="Buka Pengaturan Device Printer Dapur & Bar"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Atur Device</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Kitchen Checkbox */}
                <label className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                  routeKitchen && printerRouting.kitchenPrinter.isEnabled
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={routeKitchen && printerRouting.kitchenPrinter.isEnabled}
                    onChange={(e) => setRouteKitchen(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="text-[11px]">Kitchen</span>
                </label>

                {/* Bar Checkbox */}
                <label className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                  routeBar && printerRouting.barPrinter.isEnabled
                    ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={routeBar && printerRouting.barPrinter.isEnabled}
                    onChange={(e) => setRouteBar(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-[11px]">Bar</span>
                </label>

                {/* Checker Checkbox */}
                <label className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                  routeChecker && printerRouting.checkerPrinter.isEnabled
                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={routeChecker && printerRouting.checkerPrinter.isEnabled}
                    onChange={(e) => setRouteChecker(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span className="text-[11px]">Checker</span>
                </label>
              </div>
            </div>

            {/* Total Price Breakdown & Checkout */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal Menu</span>
                <span className="font-bold text-slate-900">{formatRupiah(cartSubtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-semibold">
                  <span>Diskon Promo ({selectedPromo?.name} {selectedPromo?.discountPercent}%)</span>
                  <span>- {formatRupiah(discountAmount)}</span>
                </div>
              )}

              {serviceAmount > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Service Charge ({taxServiceConfig?.servicePercent}%)</span>
                  <span className="font-bold text-slate-900">+ {formatRupiah(serviceAmount)}</span>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Pajak Restoran PB1 ({taxServiceConfig?.taxPercent}%)</span>
                  <span className="font-bold text-slate-900">+ {formatRupiah(taxAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs font-black text-slate-700 uppercase">Total Tagihan</span>
                <span className="text-xl font-black text-slate-900">{formatRupiah(cartTotal)}</span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-black text-sm transition-all shadow-xs flex items-center justify-center gap-2 mt-2"
              >
                <Check className="w-5 h-5" />
                <span>
                  {payImmediately ? 'Bayar Lunas & Cetak Tiket' : 'Buka Tagihan Meja & Cetak Tiket'}
                </span>
              </button>
            </div>

          </div>

        </div>
      ) : activeSubTab === 'active_tables' ? (
        /* SUBTAB: MEJA AKTIF & TAGIHAN */
        <ActiveTablesTab 
          onSelectOrderToPrint={(order) => setPrintedOrder(order)} 
          availableTables={tableList}
        />
      ) : activeSubTab === 'backoffice' && isMasterOrManager ? (
        /* SUBTAB: BACK OFFICE POS (MANAGER ONLY) */
        <PosBackOfficeTab />
      ) : (
        /* SUBTAB: HISTORY ORDERS */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Riwayat Pesanan & Transaksi Kasir</h3>
              <p className="text-xs text-slate-500">Semua pesanan, status pembayaran, dan pembatalan</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setClosingModalMode('shift');
                  setShowClosingModal(true);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Rekap End Shift</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setClosingModalMode('day');
                  setShowClosingModal(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Rekap End of Day</span>
              </button>

              <span className="text-xs font-bold text-slate-500 ml-2">Total {tableOrders.length} pesanan</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">No. Pesanan</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Tipe / Meja</th>
                  <th className="py-2.5 px-3">Tamu</th>
                  <th className="py-2.5 px-3">Item Pesanan</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableOrders.map(order => (
                  <tr key={order.id} className={`hover:bg-slate-50 ${order.isCancelled ? 'bg-red-50/30' : ''}`}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      <span className={order.isCancelled ? 'line-through text-slate-400' : ''}>
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{order.date} {order.time}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.orderType === 'Dine In' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.tableNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{order.customerName || 'Umum'}</div>
                      {order.customerPhone && (
                        <div className="text-[10px] text-slate-400">{order.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">
                      {order.items.map(i => `${i.qty}x ${i.menuItemName}`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3">
                      {order.isCancelled ? (
                        <div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700">
                            Dibatalkan
                          </span>
                          {order.cancelReason && (
                            <div className="text-[10px] text-red-600 mt-0.5 truncate max-w-[150px]">
                              {order.cancelReason}
                            </div>
                          )}
                        </div>
                      ) : order.paymentStatus === 'Belum Bayar' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          Belum Bayar
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          Lunas ({order.paymentMethod})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900">
                      <span className={order.isCancelled ? 'line-through text-slate-400' : ''}>
                        {formatRupiah(order.totalAmount)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setPrintedOrder(order)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ATUR SOLD-LIMIT (Can be updated by ANYONE) */}
      {showSoldLimitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in duration-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Atur Sold-Limit Menu</h3>
                  <p className="text-[11px] text-slate-500">Bisa di-update oleh kru dapur, kasir, floor, atau manager</p>
                </div>
              </div>
              <button
                onClick={() => setShowSoldLimitModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSoldLimit} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Menu Terpilih</span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">{showSoldLimitModal.name}</h4>
                <div className="text-[11px] text-slate-500 mt-1">
                  Status Saat Ini:{' '}
                  <strong className={showSoldLimitModal.isSoldOut ? 'text-red-600' : 'text-emerald-700'}>
                    {showSoldLimitModal.isSoldOut 
                      ? 'HABIS (Sold Out)' 
                      : typeof showSoldLimitModal.soldLimit === 'number' 
                      ? `Tersisa ${showSoldLimitModal.soldLimit} Porsi` 
                      : 'Tanpa Batasan (Unlimited)'}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Set Batas Porsi Harian (Sold-Limit)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Contoh: 15"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-base focus:bg-white text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Setiap order kasir berhasil, kuantiti limit otomatis berkurang.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleMarkSoldOut(showSoldLimitModal.id)}
                  className="py-2 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold"
                >
                  Tandai Habis (0 Porsi)
                </button>
                <button
                  type="button"
                  onClick={() => handleClearLimit(showSoldLimitModal.id)}
                  className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold"
                >
                  Hapus Limit (Unlimited)
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSoldLimitModal(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Simpan Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUSAT PENGATURAN POS & KASIR (Metode Pembayaran, Routing Printer, & Format Struk) */}
      {(showUnifiedSettings || showPaymentModal || showPrinterModal) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 animate-in fade-in duration-200 text-xs my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Pusat Pengaturan POS & Kasir</h3>
                  <p className="text-[11px] text-slate-500">
                    Konfigurasi metode pembayaran, routing printer otomatis (Dapur, Bar, Checker), dan format struk belanja.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUnifiedSettings(false);
                  setShowPaymentModal(false);
                  setShowPrinterModal(false);
                }}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-lg font-bold transition-all"
                title="Tutup Pengaturan"
              >
                &times;
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 mt-4 border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => setPosSettingTab('payment')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  posSettingTab === 'payment'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Metode Pembayaran</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-semibold">
                  {paymentMethods.filter(m => m.isActive).length} Aktif
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPosSettingTab('printers')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  posSettingTab === 'printers'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Printer className="w-4 h-4 text-emerald-600" />
                <span>Routing Printer</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  printerRouting.kitchenPrinter.isEnabled || printerRouting.barPrinter.isEnabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {printerRouting.kitchenPrinter.isEnabled && printerRouting.barPrinter.isEnabled ? '3 Siap' : 'Aktif'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPosSettingTab('receipt')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  posSettingTab === 'receipt'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>Format Struk</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1 space-y-4">
              
              {/* TAB 1: METODE PEMBAYARAN */}
              {posSettingTab === 'payment' && (
                <div className="space-y-4">
                  {/* Preset quick buttons */}
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                    <div className="text-[11px] font-bold text-blue-950 mb-1.5 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>Template Cepat (1-Klik Isi Form):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setNewPayName('QRIS Bank BCA');
                          setNewPayType('qris');
                          setNewPayBank('Bank Central Asia (BCA)');
                          setNewPayAcc('NMID: ID1020030040');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-[11px] font-bold text-blue-900 transition-all"
                      >
                        + QRIS BCA
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPayName('EDC Kartu Mandiri');
                          setNewPayType('card');
                          setNewPayBank('Bank Mandiri');
                          setNewPayAcc('TID: 88990011');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-[11px] font-bold text-blue-900 transition-all"
                      >
                        + EDC Mandiri
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPayName('GoPay / ShopeePay');
                          setNewPayType('ewallet');
                          setNewPayBank('GoTo & Shopee');
                          setNewPayAcc('Merchant Resto');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-[11px] font-bold text-blue-900 transition-all"
                      >
                        + E-Wallet
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPayName('Transfer Bank BRI');
                          setNewPayType('transfer');
                          setNewPayBank('Bank BRI');
                          setNewPayAcc('0123-01-000456-50-8');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-[11px] font-bold text-blue-900 transition-all"
                      >
                        + Transfer BRI
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPayName('Tunai (Cash)');
                          setNewPayType('cash');
                          setNewPayBank('Kasir Resto');
                          setNewPayAcc('');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-[11px] font-bold text-blue-900 transition-all"
                      >
                        + Tunai (Cash)
                      </button>
                    </div>
                  </div>

                  {/* Add form */}
                  <form onSubmit={handleAddPaymentMethod} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="font-extrabold text-slate-900 block text-xs">
                      + Tambah Metode Pembayaran Baru
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Nama Metode <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: QRIS BCA, Kartu Debit Mandiri"
                          value={newPayName}
                          onChange={(e) => setNewPayName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Tipe / Kategori</label>
                        <select
                          value={newPayType}
                          onChange={(e) => setNewPayType(e.target.value as PaymentMethodConfig['type'])}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                        >
                          <option value="qris">QRIS Digital (Statis / Dinamis)</option>
                          <option value="cash">Tunai (Cash)</option>
                          <option value="card">Kartu Debit / Kredit (Mesin EDC)</option>
                          <option value="transfer">Bank Transfer</option>
                          <option value="ewallet">E-Wallet (GoPay, OVO, ShopeePay, DANA)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Bank / Provider (Opsional)</label>
                        <input
                          type="text"
                          placeholder="BCA, Mandiri, BRI, GoTo, dll"
                          value={newPayBank}
                          onChange={(e) => setNewPayBank(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Nomor Rekening / Merchant / TID</label>
                        <input
                          type="text"
                          placeholder="Contoh: 1234-5678-90 atau NMID..."
                          value={newPayAcc}
                          onChange={(e) => setNewPayAcc(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 text-xs transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Simpan Metode Pembayaran</span>
                      </button>
                    </div>
                  </form>

                  {/* List */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="p-2.5 bg-slate-100 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between">
                      <span>Daftar Metode Terdaftar ({paymentMethods.length})</span>
                      <span className="text-[10px] text-slate-500 font-normal">Klik status untuk mengaktifkan/menonaktifkan</span>
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-100">
                        <tr>
                          <th className="py-2 px-3">Nama Metode</th>
                          <th className="py-2 px-3">Tipe</th>
                          <th className="py-2 px-3">Bank / Akun</th>
                          <th className="py-2 px-3 text-center">Status</th>
                          <th className="py-2 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentMethods.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              Belum ada metode pembayaran yang dikonfigurasi.
                            </td>
                          </tr>
                        ) : (
                          paymentMethods.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-900 block">{m.name}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                  {m.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                <div>{m.bankOrProvider || '-'}</div>
                                {m.accountNumber && <div className="text-[10px] text-slate-400 font-mono">{m.accountNumber}</div>}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => updatePaymentMethod(m.id, { isActive: !m.isActive })}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                    m.isActive
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                                  title="Klik untuk ubah status aktif/non-aktif"
                                >
                                  {m.isActive ? '✓ AKTIF' : 'NON-AKTIF'}
                                </button>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => deletePaymentMethod(m.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Hapus metode pembayaran"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: ROUTING PRINTER TIKET */}
              {posSettingTab === 'printers' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-3">
                    <Printer className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-sm block">Konektivitas Printer Struk & Tiket Kasir</span>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Aplikasi ini langsung terhubung dengan printer yang terpasang di sistem operasi (Windows, Mac, Linux, Android).
                        Mendukung semua printer thermal USB, Bluetooth, maupun LAN/Wi-Fi (Epson, Xprinter, Star, Panda, dll).
                      </p>
                    </div>
                  </div>

                  {/* Pengaturan Ukuran Kertas Thermal */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-slate-900 text-xs block">Format Ukuran Kertas Thermal</span>
                        <span className="text-[10px] text-slate-500">Sesuaikan dengan lebar rol kertas printer kasir Anda</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleSetPaperSize('58mm')}
                          className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                            printerPaperSize === '58mm'
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          58 mm (Mini / Bluetooth)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetPaperSize('80mm')}
                          className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                            printerPaperSize === '80mm'
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          80 mm (Standar Kasir)
                        </button>
                      </div>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tips Cetak Rapi Tanpa Margin Header/Footer:</span>
                      </div>
                      <p className="text-[10px] text-slate-500 pl-5">
                        Pada jendela dialog cetak printer: pilih Printer yang sesuai, pada <em>More settings</em> ubah <strong>Margins</strong> menjadi <strong>None</strong> dan hilangkan centang pada <strong>Headers and footers</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Kitchen Station */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <div>
                          <span className="font-black text-slate-900 text-xs block">Kitchen Printer (Dapur Masak)</span>
                          <span className="text-[10px] text-slate-500">Mencetak pesanan makanan utama, gorengan & lauk</span>
                        </div>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printerRouting.kitchenPrinter.isEnabled}
                          onChange={(e) => updatePrinterRouting({
                            kitchenPrinter: {
                              ...printerRouting.kitchenPrinter,
                              isEnabled: e.target.checked
                            }
                          })}
                          className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                        />
                        <span className={`font-bold text-xs ${printerRouting.kitchenPrinter.isEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {printerRouting.kitchenPrinter.isEnabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama Device / IP Address Network</label>
                        <input
                          type="text"
                          value={printerRouting.kitchenPrinter.name}
                          onChange={(e) => updatePrinterRouting({
                            kitchenPrinter: {
                              ...printerRouting.kitchenPrinter,
                              name: e.target.value
                            }
                          })}
                          placeholder="EPSON-TM-T82-KITCHEN (192.168.1.201)"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTestPrintStation('kitchen')}
                        className="w-full px-3 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Test Cetak Dapur</span>
                      </button>
                    </div>
                  </div>

                  {/* Bar Station */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <div>
                          <span className="font-black text-slate-900 text-xs block">Bar & Beverage Printer (Stasiun Minuman)</span>
                          <span className="text-[10px] text-slate-500">Mencetak pesanan minuman, kopi, jus & dessert dingin</span>
                        </div>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printerRouting.barPrinter.isEnabled}
                          onChange={(e) => updatePrinterRouting({
                            barPrinter: {
                              ...printerRouting.barPrinter,
                              isEnabled: e.target.checked
                            }
                          })}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        />
                        <span className={`font-bold text-xs ${printerRouting.barPrinter.isEnabled ? 'text-blue-700' : 'text-slate-400'}`}>
                          {printerRouting.barPrinter.isEnabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama Device / IP Address Network</label>
                        <input
                          type="text"
                          value={printerRouting.barPrinter.name}
                          onChange={(e) => updatePrinterRouting({
                            barPrinter: {
                              ...printerRouting.barPrinter,
                              name: e.target.value
                            }
                          })}
                          placeholder="EPSON-TM-T82-BAR (192.168.1.202)"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTestPrintStation('bar')}
                        className="w-full px-3 py-1.5 bg-white hover:bg-blue-50 border border-blue-300 text-blue-800 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Test Cetak Bar</span>
                      </button>
                    </div>
                  </div>

                  {/* Checker Station */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                          3
                        </div>
                        <div>
                          <span className="font-black text-slate-900 text-xs block">Checker / Waiter Printer (Kasir Meja)</span>
                          <span className="text-[10px] text-slate-500">Mencetak rekap penuh slip pesanan untuk pramusaji & arsip kasir</span>
                        </div>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printerRouting.checkerPrinter.isEnabled}
                          onChange={(e) => updatePrinterRouting({
                            checkerPrinter: {
                              ...printerRouting.checkerPrinter,
                              isEnabled: e.target.checked
                            }
                          })}
                          className="w-4 h-4 rounded text-amber-600 cursor-pointer"
                        />
                        <span className={`font-bold text-xs ${printerRouting.checkerPrinter.isEnabled ? 'text-amber-700' : 'text-slate-400'}`}>
                          {printerRouting.checkerPrinter.isEnabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama Device / IP Address Network</label>
                        <input
                          type="text"
                          value={printerRouting.checkerPrinter.name}
                          onChange={(e) => updatePrinterRouting({
                            checkerPrinter: {
                              ...printerRouting.checkerPrinter,
                              name: e.target.value
                            }
                          })}
                          placeholder="THERMAL-CHECKER-01 (192.168.1.200)"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTestPrintStation('checker')}
                        className="w-full px-3 py-1.5 bg-white hover:bg-amber-50 border border-amber-300 text-amber-800 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Test Cetak Slip</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FORMAT STRUK & TOKO */}
              {posSettingTab === 'receipt' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Settings Form */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Nama Restoran / Outlet di Struk</span>
                        </label>
                        <input
                          type="text"
                          value={receiptStoreName}
                          onChange={(e) => setReceiptStoreName(e.target.value)}
                          placeholder="Contoh: Imah Kayu Jatinangor"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>Alamat Outlet</span>
                        </label>
                        <textarea
                          rows={2}
                          value={receiptAddress}
                          onChange={(e) => setReceiptAddress(e.target.value)}
                          placeholder="Jl. Kuliner No. 88, Jakarta Selatan"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>Nomor Telepon Resto</span>
                        </label>
                        <input
                          type="text"
                          value={receiptPhone}
                          onChange={(e) => setReceiptPhone(e.target.value)}
                          placeholder="(021) 555-1234"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span>Catatan Kaki Struk (Footer)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={receiptFooter}
                          onChange={(e) => setReceiptFooter(e.target.value)}
                          placeholder="Pesan penutup, password WiFi, atau Instagram..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                            <Percent className="w-3 h-3 text-slate-500" />
                            <span>Pajak Resto (PB1 %)</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={25}
                            value={taxPercent}
                            onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                            <Percent className="w-3 h-3 text-slate-500" />
                            <span>Biaya Layanan (%)</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={servicePercent}
                            onChange={(e) => setServicePercent(Number(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block text-center">
                        Live Thermal Receipt Preview
                      </span>
                      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs font-mono text-[10px] space-y-2">
                        <div className="text-center border-b border-dashed border-slate-200 pb-2 space-y-0.5">
                          <div className="font-bold text-xs text-slate-900 uppercase">{receiptStoreName}</div>
                          <div className="text-slate-500">{receiptAddress}</div>
                          <div className="text-slate-400">Telp: {receiptPhone}</div>
                        </div>

                        <div className="flex justify-between text-slate-600 py-1 border-b border-dashed border-slate-200">
                          <span>Meja: Meja 05</span>
                          <span>Order: #ORD-088</span>
                        </div>

                        <div className="space-y-1 py-1 border-b border-dashed border-slate-200">
                          <div className="flex justify-between">
                            <span>1x Ayam Goreng Lengkuas</span>
                            <span className="font-bold">Rp 32.000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>2x Es Teh Manis</span>
                            <span className="font-bold">Rp 16.000</span>
                          </div>
                        </div>

                        <div className="space-y-0.5 pt-1 border-b border-dashed border-slate-200 pb-2">
                          <div className="flex justify-between text-slate-500">
                            <span>Subtotal:</span>
                            <span>Rp 48.000</span>
                          </div>
                          {taxPercent > 0 && (
                            <div className="flex justify-between text-slate-500">
                              <span>PB1 ({taxPercent}%):</span>
                              <span>Rp {Math.round(48000 * (taxPercent / 100)).toLocaleString('id-ID')}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-slate-900 pt-1">
                            <span>TOTAL:</span>
                            <span>Rp {Math.round(48000 * (1 + taxPercent / 100)).toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        <div className="text-center text-[9px] text-slate-400 italic pt-1">
                          {receiptFooter}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Pengaturan ini otomatis tersinkronisasi dengan seluruh sesi kasir.
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowUnifiedSettings(false);
                  setShowPaymentModal(false);
                  setShowPrinterModal(false);
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs text-xs transition-all"
              >
                Simpan & Selesai
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: SIMULASI CETAK SLIP & TIKET PRINTER (Checker, Kitchen, Bar) */}
      {printedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in duration-200 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Pesanan Berhasil Disimpan!</h3>
                <p className="text-[11px] text-slate-500">Tiket otomatis ter-routing sesuai stasiun printer</p>
              </div>
              <button
                onClick={() => setPrintedOrder(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Paper Size Selector */}
            <div className="flex items-center justify-between mt-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Ukuran Kertas:</span>
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSetPaperSize('58mm')}
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded ${
                    printerPaperSize === '58mm' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  58mm
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPaperSize('80mm')}
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded ${
                    printerPaperSize === '80mm' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  80mm
                </button>
              </div>
            </div>

            {/* Print Ticket Tab Switcher */}
            <div className="flex rounded-xl bg-slate-100 p-1 mt-2.5 border border-slate-200">
              <button
                onClick={() => setPrintTicketTab('checker')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  printTicketTab === 'checker' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <span>Checker Slip</span>
                {printedOrder.printerRouting.checker && <span className="text-amber-600">✓</span>}
              </button>
              <button
                onClick={() => setPrintTicketTab('kitchen')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  printTicketTab === 'kitchen' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <span>Kitchen</span>
                {printedOrder.printerRouting.kitchen && <span className="text-emerald-600">✓</span>}
              </button>
              <button
                onClick={() => setPrintTicketTab('bar')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  printTicketTab === 'bar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <span>Bar Slip</span>
                {printedOrder.printerRouting.bar && <span className="text-blue-600">✓</span>}
              </button>
            </div>

            {/* Thermal Receipt Visual Preview */}
            <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 font-mono text-[11px] space-y-2.5 shadow-inner max-h-72 overflow-y-auto">
              
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <div className="font-bold text-xs text-slate-900 uppercase">
                  {printTicketTab === 'checker' ? 'CHECKER SLIP' : printTicketTab === 'kitchen' ? 'KITCHEN TICKET' : 'BAR & BEVERAGE'}
                </div>
                <div className="text-[11px] font-bold text-slate-800 uppercase">{receiptStoreName}</div>
                {receiptAddress && <div className="text-[10px] text-slate-500">{receiptAddress}</div>}
                {receiptPhone && <div className="text-[10px] text-slate-400">Telp: {receiptPhone}</div>}
                <div className="text-[10px] text-slate-500 pt-0.5">
                  {printedOrder.date} • {printedOrder.time} WIB
                </div>
              </div>

              <div className="flex justify-between text-[10px]">
                <span>No. Order: <strong>{printedOrder.orderNumber}</strong></span>
                <span>Kasir: {printedOrder.cashierName}</span>
              </div>

              <div className="p-1.5 bg-white rounded border border-slate-200 flex justify-between font-bold text-[11px]">
                <span>{printedOrder.tableNumber}</span>
                <span>{printedOrder.orderType} • {printedOrder.pax} Pax</span>
              </div>

              {/* Items List based on tab */}
              <div className="divide-y divide-dashed divide-slate-200 py-1">
                {printTicketTab === 'checker' && (
                  printedOrder.items.map((i, idx) => (
                    <div key={idx} className="py-1 flex justify-between">
                      <div>
                        <div>{i.qty}x {i.menuItemName}</div>
                        {i.notes && <div className="text-[10px] text-slate-500">* {i.notes}</div>}
                      </div>
                      <span className="font-bold">{formatRupiah(i.subtotal)}</span>
                    </div>
                  ))
                )}

                {printTicketTab === 'kitchen' && (
                  kitchenItems.length === 0 ? (
                    <div className="py-2 text-center text-slate-400">Tidak ada item pesanan kitchen</div>
                  ) : (
                    kitchenItems.map((i, idx) => (
                      <div key={idx} className="py-1 flex justify-between">
                        <div>
                          <strong className="text-slate-900">{i.qty}x {i.menuItemName}</strong>
                          {i.notes && <div className="text-[10px] text-red-600 font-bold">* {i.notes}</div>}
                        </div>
                        <span className="text-slate-400">[Dapur]</span>
                      </div>
                    ))
                  )
                )}

                {printTicketTab === 'bar' && (
                  barItems.length === 0 ? (
                    <div className="py-2 text-center text-slate-400">Tidak ada item minuman bar</div>
                  ) : (
                    barItems.map((i, idx) => (
                      <div key={idx} className="py-1 flex justify-between">
                        <div>
                          <strong className="text-slate-900">{i.qty}x {i.menuItemName}</strong>
                          {i.notes && <div className="text-[10px] text-blue-600 font-bold">* {i.notes}</div>}
                        </div>
                        <span className="text-slate-400">[Bar]</span>
                      </div>
                    ))
                  )
                )}
              </div>

              {printTicketTab === 'checker' && (
                <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>TOTAL BAYAR:</span>
                    <span>{formatRupiah(printedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Metode Pembayaran:</span>
                    <span>{printedOrder.paymentMethod}</span>
                  </div>
                </div>
              )}

              {printTicketTab === 'checker' && receiptFooter && (
                <div className="pt-2 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-500 italic">
                  {receiptFooter}
                </div>
              )}

              {/* Checkmark Status Footer */}
              <div className="pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Koneksi Printer:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Siap Kirim ke Printer Thermal ({printerPaperSize})</span>
                </span>
              </div>
            </div>

            {/* iFrame Notice if inside preview */}
            {inIframe && (
              <div className="mt-2.5 p-2 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-900 flex items-start gap-2">
                <span className="font-black text-amber-700">ℹ️</span>
                <div className="leading-snug">
                  Aplikasi sedang berada dalam <strong>Preview iFrame</strong>. Jika dialog printer fisik browser tidak muncul, gunakan tombol <strong>"Buka Tab Cetak"</strong> di bawah untuk langsung memunculkan dialog cetak printer kasir Anda.
                </div>
              </div>
            )}

            {/* Copy Toast */}
            {copiedReceiptToast && (
              <div className="mt-2 p-2 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-center font-bold text-xs animate-in fade-in">
                ✓ Format teks struk berhasil disalin ke clipboard! Siap dipaste ke printer Bluetooth (RawBT/Android).
              </div>
            )}

            {/* Print Action Buttons */}
            <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPlainTextReceipt}
                  className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  title="Salin isi teks struk untuk aplikasi driver Bluetooth printer portabel / RawBT"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenPrintWindow}
                  className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  title="Buka struk di jendela pop-up/tab baru khusus cetak (Bebas dari batasan sandbox iFrame)"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Tab Cetak</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintedOrder(null)}
                  className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700 text-xs"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={handlePrintAllTickets}
                  className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  title="Cetak berurutan: Slip Checker, Pesanan Dapur, dan Pesanan Bar"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Semua</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleDirectPrintTicket(printTicketTab)}
                  className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Tiket Ini</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DEDICATED DOM THERMAL PRINT SLIP (FOR NATIVE WINDOW.PRINT / CTRL+P) */}
      {activePrintPayload && (
        <div 
          id="pos-thermal-print-slip"
          className={`hidden print-only font-mono text-black mx-auto p-1 leading-snug ${
            printerPaperSize === '58mm' ? 'max-w-[58mm] text-[10px]' : 'max-w-[80mm] text-[11px]'
          }`}
        >
          <div className="text-center space-y-0.5 pb-2 border-b border-black">
            <div className="font-black text-xs uppercase">
              {activePrintPayload.ticketType === 'checker' ? 'CHECKER SLIP' : activePrintPayload.ticketType === 'kitchen' ? 'PESANAN DAPUR' : 'BAR & BEVERAGE'}
            </div>
            <div className="font-black text-sm uppercase">{activePrintPayload.storeName || receiptStoreName}</div>
            {activePrintPayload.storeAddress && <div className="text-[10px]">{activePrintPayload.storeAddress}</div>}
            {activePrintPayload.storePhone && <div className="text-[10px]">Telp: {activePrintPayload.storePhone}</div>}
            <div className="text-[10px] pt-0.5">
              {activePrintPayload.date} • {activePrintPayload.time} WIB
            </div>
          </div>

          <div className="py-1 border-b border-black space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>No. Order:</span>
              <span className="font-bold">{activePrintPayload.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{activePrintPayload.cashierName}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>{activePrintPayload.tableNumber}</span>
              <span>{activePrintPayload.orderType} • {activePrintPayload.pax || 1} Pax</span>
            </div>
            {activePrintPayload.customerName && (
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{activePrintPayload.customerName}</span>
              </div>
            )}
          </div>

          <div className="py-2 border-b border-black space-y-1">
            {activePrintPayload.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between">
                  <span className="font-bold">{item.qty}x {item.name}</span>
                  {activePrintPayload.ticketType === 'checker' && (
                    <span>{formatRupiahThermal(item.subtotal)}</span>
                  )}
                </div>
                {item.notes && (
                  <div className="text-[9px] pl-3 italic text-gray-700">* {item.notes}</div>
                )}
              </div>
            ))}
          </div>

          {activePrintPayload.ticketType === 'checker' && (
            <div className="py-2 border-b border-black space-y-0.5 text-[10px]">
              {activePrintPayload.subtotalAmount ? (
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiahThermal(activePrintPayload.subtotalAmount)}</span>
                </div>
              ) : null}
              {activePrintPayload.discountAmount ? (
                <div className="flex justify-between">
                  <span>Diskon ({activePrintPayload.discountName || 'Promo'}):</span>
                  <span>-{formatRupiahThermal(activePrintPayload.discountAmount)}</span>
                </div>
              ) : null}
              {activePrintPayload.serviceAmount ? (
                <div className="flex justify-between">
                  <span>Service Charge:</span>
                  <span>{formatRupiahThermal(activePrintPayload.serviceAmount)}</span>
                </div>
              ) : null}
              {activePrintPayload.taxAmount ? (
                <div className="flex justify-between">
                  <span>PB1 / Pajak (10%):</span>
                  <span>{formatRupiahThermal(activePrintPayload.taxAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-black text-xs pt-1 border-t border-black">
                <span>TOTAL:</span>
                <span>{formatRupiahThermal(activePrintPayload.totalAmount)}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span>Metode Bayar:</span>
                <span className="font-bold">{activePrintPayload.paymentMethod || 'Cash'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold">{activePrintPayload.paymentStatus || 'Lunas'}</span>
              </div>
            </div>
          )}

          <div className="text-center pt-2 text-[10px] space-y-0.5">
            <div>{activePrintPayload.footerText || receiptFooter || 'Terima Kasih Atas Kunjungan Anda'}</div>
            <div className="text-[8px] text-gray-500">POS Imah Kayu Jatinangor</div>
          </div>
          <div className="h-6"></div>
        </div>
      )}

      {/* POS Closing Modal (End Shift & End of Day Recap, Thermal Print, Excel Export) */}
      <PosClosingModal
        isOpen={showClosingModal}
        onClose={() => setShowClosingModal(false)}
        initialMode={closingModalMode}
      />

    </div>
  );
};
