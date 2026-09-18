export type SystemRole = 'manager' | 'kasir' | 'head_floor' | 'head_kitchen' | 'staff' | 'purchasing';
export type UserRole = SystemRole | string;

export interface RoleDefinition {
  id: string;
  title: string;
  description?: string;
  department?: string;
  badgeColor?: 'purple' | 'amber' | 'blue' | 'emerald' | 'indigo' | 'cyan' | 'rose' | 'teal' | 'orange' | 'slate';
  isSystem?: boolean;
  createdAt?: string;
}

export type ContractStatus = 'casual' | 'partime' | 'dw' | 'kontrak' | 'tetap';
export type EmployeeContractStatus = ContractStatus;

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  roleTitle: string;
  email: string;
  avatar: string;
  outletId: string;
  isMasterAdmin?: boolean;
  birthDate?: string;
  phone?: string;
  address?: string;
  bio?: string;
  gender?: 'L' | 'P' | string;
  // HRD & Kepegawaian Data
  employeeId?: string; // Auto-generated e.g. EMP-2026-001
  contractStatus?: ContractStatus; // casual, partime, dw, kontrak, tetap
  contractStartDate?: string; // YYYY-MM-DD
  contractEndDate?: string; // YYYY-MM-DD (notif jika sisa <= 2 bulan)
  joinDate?: string; // YYYY-MM-DD
  nikKtp?: string; // 16 digit NIK
  nik?: string; // Alias for nikKtp
  npwp?: string; // NPWP karyawan
  bpjsKetenagakerjaan?: string;
  bpjsKesehatan?: string;
  bankName?: string; // BCA, Mandiri, BRI, BNI, dll
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string; // Pasangan, Orang Tua, Saudara, dll
  emergencyContactPhone?: string;
  lastEducation?: string; // SMA/SMK, D3, S1, S2, dll
  bloodType?: string; // A, B, AB, O
  maritalStatus?: string; // TK/0, K/0, K/1, K/2, K/3
  idCardAddress?: string; // Alamat sesuai KTP
  domicileAddress?: string; // Alamat tempat tinggal saat ini
}

export type NavigationTab = 
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'recipes'
  | 'purchasing'
  | 'receiving'
  | 'waste'
  | 'sales'
  | 'transfers'
  | 'memorandum'
  | 'pettycash'
  | 'variable_costs'
  | 'schedules'
  | 'attendance'
  | 'cogs'
  | 'stockopname'
  | 'access_control';

export interface RoleMenuPermissions {
  manager: NavigationTab[];
  head_kitchen: NavigationTab[];
  head_floor: NavigationTab[];
  kasir: NavigationTab[];
  staff: NavigationTab[];
  purchasing: NavigationTab[];
  [role: string]: NavigationTab[];
}

export type ItemCategory = 
  | 'Bahan Baku Basah' 
  | 'Bahan Baku Kering' 
  | 'Bumbu & Saus' 
  | 'Dairy & Telur' 
  | 'Daging & Seafood' 
  | 'Minuman & Sirup' 
  | 'Packaging & Supplies' 
  | 'Perlengkapan Floor'
  | string;

export type ItemUnit = 
  | 'kg' 
  | 'gram' 
  | 'liter' 
  | 'ml' 
  | 'pcs' 
  | 'pack' 
  | 'can' 
  | 'portion'
  | 'Galon'
  | 'Tabung'
  | (string & {});

export type StorageLocation = 
  | 'Kitchen' 
  | 'Floor / Bar' 
  | 'Floor'
  | 'Bar'
  | 'Gudang'
  | 'Gudang Central' 
  | 'Chiller / Freezer'
  | (string & {});

export interface RawItem {
  id: string;
  code: string;
  name: string;
  category: ItemCategory;
  unit: ItemUnit;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number; // Rupiah per unit
  location: StorageLocation;
  lastUpdated: string;
}

export interface RecipeIngredient {
  itemId: string;
  itemName: string;
  amount: number; // in chosen unit (e.g. 150 gram)
  unit: ItemUnit; // chosen unit (e.g. 'gram')
  baseAmount?: number; // converted amount in raw item's base unit (e.g. 0.15 kg)
  baseUnit?: ItemUnit; // raw item's base unit (e.g. 'kg')
  costPerUnit: number; // cost per chosen unit
  subtotalCost: number;
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  category: 'Makanan' | 'Minuman' | 'Camilan / Dessert' | 'Paket Hemat';
  sellingPrice: number;
  recipes: RecipeIngredient[];
  totalHPP: number; // Total Cost of Good Sold per portion
  marginPercentage: number; // (SellingPrice - HPP) / SellingPrice * 100
  isActive: boolean;
  image?: string;
  soldLimit?: number | null; // Sisa porsi harian / limit porsi (bisa diupdate oleh siapapun)
  isSoldOut?: boolean;
}

export interface ReceivingItem {
  itemId: string;
  itemName: string;
  qty: number; // received qty in chosen unit
  unit: ItemUnit; // received unit
  costPerUnit: number;
  subtotal: number;
  baseQty?: number; // converted qty to raw item's base stock unit
  baseUnit?: ItemUnit; // raw item's base stock unit
  costPerBaseUnit?: number; // converted cost per base unit
}

export interface ReceivingRecord {
  id: string;
  poNumber: string;
  supplierName: string;
  date: string;
  receivedBy: string;
  role: UserRole;
  items: ReceivingItem[];
  totalAmount: number;
  notes?: string;
  receiptPhotoUrl?: string;
}

export type WasteReason = 
  | 'Basi / Expired' 
  | 'Gosong / Salah Buat' 
  | 'Kualitas Supplier Buruk' 
  | 'Jatuh / Kontaminasi' 
  | 'Over-preparation' 
  | 'Pecah / Rusak Packaging';

export interface WasteSpoilRecord {
  id: string;
  date: string;
  reportedBy: string;
  role: UserRole;
  area: 'Kitchen' | 'Floor / Bar';
  itemId: string;
  itemName: string;
  qty: number;
  unit: ItemUnit;
  reason: WasteReason;
  estimatedCostLoss: number;
  photoUrl: string;
  notes: string;
}

export interface DailySalesItemSold {
  menuItemId: string;
  menuItemName: string;
  qtySold: number;
  sellingPrice: number;
  subtotal: number;
  hppPerPortion: number;
  totalHpp: number;
}

export interface DailySalesRecord {
  id: string;
  date: string;
  shift: 'Shift Pagi (Lunch)' | 'Shift Malam (Dinner)' | 'Full Day';
  inputBy: string;
  role: UserRole;
  itemsSold: DailySalesItemSold[];
  totalRevenue: number;
  totalHPP: number;
  notes?: string;
}

export interface StockTransferItem {
  itemId: string;
  itemName: string;
  qty: number; // in chosen transfer unit
  unit: ItemUnit; // chosen transfer unit
  baseQty?: number; // converted qty to raw item's base stock unit
  baseUnit?: ItemUnit; // raw item's base stock unit
}

export interface StockTransferRecord {
  id: string;
  transferNumber: string;
  date: string;
  type: 'out' | 'in';
  originOutlet: string;
  destinationOutlet: string;
  items: StockTransferItem[];
  status: 'Pending' | 'Dalam Pengiriman' | 'Diterima' | 'Dibatalkan';
  requestedBy: string;
  receivedBy?: string;
  notes?: string;
  shippingPhotoUrl?: string;
  receivingPhotoUrl?: string;
}

export type PettyCashCategory = 
  | 'Belanja Pasar (Bahan Baku)'
  | 'Pembelian Bahan Baku' 
  | 'Operasional & Utilitas' 
  | 'Operasional Gas & Galon'
  | 'Kebersihan & Sanitasi' 
  | 'Perlengkapan Kebersihan'
  | 'Transport & Kurir' 
  | 'Transport / Kurir Darurat'
  | 'Administrasi & ATK' 
  | 'Top-up / Drop Dana Pusat'
  | 'Top-up Kas'
  | 'Lain-lain';

export interface PettyCashRecord {
  id: string;
  date: string;
  type: 'in' | 'out';
  category: PettyCashCategory;
  amount: number;
  description: string;
  paidToOrReceivedFrom?: string;
  photoProofUrl?: string;
  receiptPhotoUrl?: string;
  handledBy?: string;
  submittedBy?: string;
  role: UserRole;
  linkedRawItem?: {
    itemId: string;
    itemName: string;
    qtyAdded: number;
    unit: ItemUnit;
  };
  linkedStockItem?: {
    itemId: string;
    itemName: string;
    qtyAdded: number;
    unit: ItemUnit;
  };
}

export interface SOItemConfig {
  itemId: string;
  itemName: string;
  isDailyKitchen: boolean;
  isDailyFloor: boolean;
  targetArea: 'Kitchen' | 'Floor' | 'Both';
}

export interface SOItemResult {
  itemId: string;
  itemName: string;
  systemStock: number;
  physicalStock: number;
  difference: number; // physicalStock - systemStock
  unit: ItemUnit;
  unitCost?: number;
  costPerUnit?: number;
  varianceLoss?: number; // abs difference * unitCost
  differenceValue?: number;
  reason?: string;
  notes?: string;
}

export type StockOpnameItem = SOItemResult;

export interface StockOpnameRecord {
  id: string;
  date: string;
  type: 'daily' | 'monthly' | 'harian' | 'bulanan';
  area?: 'Kitchen' | 'Floor' | 'All';
  conductedBy: string;
  role: UserRole;
  items: SOItemResult[];
  status: 'Submitted' | 'Verified' | 'Approved' | 'Pending Approval';
  managerNotes?: string;
  totalVarianceLoss?: number;
  totalDifferenceValue?: number;
  notes?: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface NotificationAlert {
  id: string;
  type: 'low_stock' | 'waste' | 'so_pending' | 'transfer' | 'birthday' | 'contract_expiring';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  itemId?: string;
  targetUserId?: string;
}

export interface RestaurantBranding {
  systemName: string;
  systemTagline: string;
  outletName: string;
  outletCity: string;
  outletAddress?: string;
  outletPhone?: string;
  logoType: 'custom_image' | 'initials';
  logoUrl?: string;
  logoInitials: string;
  logoColorGradient?: string;
}

// Outlet Entity
export interface OutletInfo {
  id: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  isCentral?: boolean;
}

// Payment Method Configuration (Managed by Manager)
export type PaymentType = 'qris' | 'cash' | 'card' | 'transfer' | 'ewallet' | 'other';

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: PaymentType;
  bankOrProvider?: string;
  accountNumber?: string;
  isActive: boolean;
  notes?: string;
}

// Printer Routing Configuration (Managed by Manager)
export interface PrinterStationConfig {
  name: string;
  isEnabled: boolean;
  categories: string[];
}

export interface PrinterRoutingSetting {
  kitchenPrinter: PrinterStationConfig;
  barPrinter: PrinterStationConfig;
  checkerPrinter: {
    name: string;
    isEnabled: boolean;
    printAll: boolean;
  };
}

// Table / POS Order
export interface TableOrderItem {
  menuItemId: string;
  menuItemName: string;
  category: string;
  price: number;
  qty: number;
  subtotal: number;
  hpp?: number;
  notes?: string;
}

export interface SupplierInfo {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  address?: string;
}

export interface PosPromoConfig {
  id: string;
  name: string;
  discountPercent: number; // e.g. 15 for 15%
  applyTo: 'all' | 'specific';
  itemIds?: string[]; // list of menuItemId if applyTo is 'specific'
  isActive: boolean;
  minOrderAmount?: number;
}

export interface PosTaxServiceConfig {
  taxPercent: number; // e.g. 10 for 10% PB1
  isTaxActive: boolean;
  servicePercent: number; // e.g. 5 for 5%
  isServiceActive: boolean;
}

export interface TableOrder {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
  dayOfWeek: string;
  orderType: 'Dine In' | 'Take Away';
  tableNumber: string;
  pax: number;
  items: TableOrderItem[];
  subtotalAmount?: number;
  discountPercent?: number;
  discountAmount?: number;
  discountName?: string;
  taxAmount?: number;
  serviceAmount?: number;
  totalAmount: number;
  totalHPP: number;
  paymentMethod: string;
  paymentStatus: 'Lunas' | 'Belum Bayar';
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  isCancelled?: boolean;
  cancelReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  printerRouting: {
    kitchen: boolean;
    bar: boolean;
    checker: boolean;
  };
  notes?: string;
}

// Purchasing Order (Bahan Baku Limit & Permintaan Outlet)
export interface PurchasingOrderItem {
  itemId: string;
  itemName: string;
  currentStock?: number;
  minimumStock?: number;
  requestedQty: number;
  qty?: number;
  unit: ItemUnit;
  estimatedCost?: number;
  estimatedPrice?: number;
  subtotal: number;
}

export type PurchasingStatus = 
  | 'Menunggu Approval' 
  | 'Diajukan'
  | 'Diproses Purchasing' 
  | 'Barang Dikirim' 
  | 'Dikirim ke Outlet'
  | 'Selesai' 
  | 'Ditolak';

export interface PurchasingOrder {
  id: string;
  orderNumber: string;
  date: string;
  originOutlet: string;
  outletName?: string;
  requestedBy: string;
  role?: UserRole;
  items: PurchasingOrderItem[];
  totalEstimatedCost: number;
  priority?: 'Normal' | 'Mendesak' | 'Kritis (Habis)' | 'Urgent' | string;
  status: PurchasingStatus;
  supplierName?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  approvedBy?: string;
}

// Internal Memorandum
export type MemoPriority = 'Normal' | 'Penting' | 'Urgent / Segera';

export interface MemoAttachment {
  id: string;
  fileName: string;
  fileType: 'image' | 'document' | 'other';
  fileUrl: string;
  fileSize?: string;
}

export interface InternalMemo {
  id: string;
  memoNumber: string;
  date: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientType: 'user' | 'role' | 'all';
  recipientId?: string;
  recipientName?: string;
  recipientRole?: UserRole | 'all';
  title?: string;
  subject: string;
  content: string;
  priority: MemoPriority;
  attachmentName?: string;
  attachmentUrl?: string; // base64 or URL
  attachmentType?: 'image' | 'document' | 'other';
  attachments?: MemoAttachment[];
  readBy: string[]; // User IDs who read the memo
  createdAt: string;
}

// Variable Cost (Biaya Variabel & Utilitas Restoran)
export type VariableCostCategory = 
  | 'Listrik (PLN)' 
  | 'Air (PDAM)' 
  | 'Gas LPG' 
  | 'Internet & WiFi' 
  | 'Kebersihan & Lingkungan' 
  | 'Perlengkapan Operasional'
  | 'Maintenance & Perbaikan' 
  | 'Custom / Lain-lain'
  | 'listrik'
  | 'air'
  | 'gas'
  | 'internet'
  | 'kebersihan'
  | 'operasional'
  | 'maintenance'
  | 'lainnya';

export interface VariableCostRecord {
  id: string;
  date: string; // YYYY-MM-DD
  periodMonth?: string; // e.g. "2026-09"
  category: VariableCostCategory;
  customCategoryName?: string;
  title: string;
  vendorOrProvider?: string;
  customerOrMeterId?: string; // ID Pelanggan / No Meter
  usageQuantity?: number; // e.g. kWh, m3, tabung
  usageUnit?: string; // e.g. kWh, m3, tabung
  amount: number; // Rupiah
  paymentStatus: 'Lunas' | 'Belum Lunas' | 'Jatuh Tempo';
  paymentMethod?: string;
  receiptPhotoUrl?: string;
  notes?: string;
  recordedBy: string;
  role: UserRole;
  createdAt: string;
}

// Penjadwalan Kerja Karyawan (Roster / Shift Schedule)
export type ShiftType = 
  | 'Pagi (Opening)' 
  | 'Siang (Middle)' 
  | 'Malam (Closing)' 
  | 'Full Shift' 
  | 'Libur (Off)' 
  | 'Cuti' 
  | 'Sakit';

export interface EmployeeShiftSchedule {
  id: string;
  userId: string; // user.id
  employeeName: string;
  role: UserRole;
  department?: string;
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  startTime?: string; // e.g. "07:00"
  endTime?: string; // e.g. "15:00"
  notes?: string;
  assignedBy: string;
  assignedRole: UserRole;
  updatedAt?: string;
}

// Konfigurasi Meja POS (Back Office Management)
export interface PosTableConfig {
  id: string;
  number: string; // e.g. "01", "02", "VIP-1"
  name: string; // e.g. "Meja 01 (Indoor)"
  capacity: number; // e.g. 4
  area: 'Indoor' | 'Outdoor' | 'VIP' | 'Bar' | 'Terrace';
  isActive: boolean;
  notes?: string;
}

// Konfigurasi Jam Masuk & Pulang Shift (Manager Custom Hours)
export interface ShiftTimeConfig {
  shiftType: ShiftType;
  startTime: string; // e.g. "07:00"
  endTime: string;   // e.g. "15:00"
  label?: string;
}

// Laporan Closing Resmi Kasir (End Shift & End of Day)
export interface PosClosingReport {
  id: string; // e.g. "CLS-SH-20260916-001" or "CLS-EOD-20260916-001"
  closingType: 'shift' | 'day';
  shiftName: string; // "Shift 1 (Pagi)", "Shift 2 (Malam)", "Full Day"
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  closedBy?: string; // Nama staff
  closedRole?: UserRole;
  cashierId?: string;
  cashierName: string;
  cashierRole?: string;
  timestamp?: string;
  grossSales: number;
  totalDiscount: number;
  nettSales: number;
  totalTax: number;
  totalService: number;
  grandTotal: number;
  totalBills: number;
  totalPax: number;
  occupiedTablesCount: number;
  totalCash: number;
  totalPortionsSold: number;
  dineInCount?: number;
  takeAwayCount?: number;
  metrics?: {
    grossSales: number;
    totalDiscount: number;
    nettSales: number;
    totalTax: number;
    totalService: number;
    grandTotal: number;
    totalOrders: number;
    totalPax: number;
    occupiedTables: number;
  };
  itemsSold: {
    menuId?: string;
    menuName?: string;
    menuItemId?: string;
    menuItemName?: string;
    category: string;
    qty?: number;
    qtySold?: number;
    price?: number;
    sellingPrice?: number;
    subtotal: number;
  }[];
  paymentBreakdown: {
    method: string;
    count: number;
    total: number;
    percent?: number;
  }[];
  orderIds: string[];
  notes?: string;
  createdAt?: string;
}

export type ClosingReport = PosClosingReport;

// Catatan Absensi Karyawan (Selfie Foto & GPS Geolocation)
export interface AttendanceRecord {
  id: string;
  userId: string;
  employeeName: string;
  employeeId?: string;
  role: UserRole;
  roleTitle?: string;
  date: string; // YYYY-MM-DD
  shiftType?: ShiftType;
  // Check-In (Absen Masuk)
  clockInTime?: string; // HH:mm
  clockInPhoto?: string; // Base64 image
  clockInLocation?: {
    latitude: number;
    longitude: number;
    distanceMeters: number;
    isWithinRadius: boolean; // <= 50m
  };
  clockInStatus?: 'Tepat Waktu' | 'Terlambat';
  clockInNotes?: string;
  // Check-Out (Absen Pulang)
  clockOutTime?: string; // HH:mm
  clockOutPhoto?: string; // Base64 image
  clockOutLocation?: {
    latitude: number;
    longitude: number;
    distanceMeters: number;
    isWithinRadius: boolean;
  };
  clockOutNotes?: string;
  workDurationMinutes?: number;
  createdAt: string;
  updatedAt?: string;
}


