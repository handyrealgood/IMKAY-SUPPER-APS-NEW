import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { dbSync, SyncPayload } from '../services/dbSync';
import { 
  User, 
  UserRole,
  RawItem, 
  MenuItem, 
  ReceivingRecord, 
  WasteSpoilRecord, 
  DailySalesRecord, 
  StockTransferRecord, 
  PettyCashRecord, 
  SOItemConfig, 
  StockOpnameRecord,
  NotificationAlert,
  RecipeIngredient,
  NavigationTab,
  RoleMenuPermissions,
  RestaurantBranding,
  OutletInfo,
  PaymentMethodConfig,
  PrinterRoutingSetting,
  TableOrder,
  TableOrderItem,
  PurchasingOrder,
  PurchasingStatus,
  InternalMemo,
  MemoPriority,
  SupplierInfo,
  PosPromoConfig,
  PosTaxServiceConfig,
  RoleDefinition,
  VariableCostRecord,
  EmployeeShiftSchedule,
  PosTableConfig,
  PosClosingReport,
  AttendanceRecord,
  ShiftType
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_ROLES,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_BRANDING,
  INITIAL_RAW_ITEMS, 
  INITIAL_MENU_ITEMS, 
  INITIAL_RECEIVINGS, 
  INITIAL_WASTES, 
  INITIAL_SALES, 
  INITIAL_TRANSFERS, 
  INITIAL_PETTY_CASH, 
  INITIAL_SO_CONFIG, 
  INITIAL_SO_RECORDS, 
  INITIAL_OUTLETS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_PRINTER_ROUTING,
  INITIAL_TABLE_ORDERS,
  INITIAL_PURCHASING_ORDERS,
  INITIAL_INTERNAL_MEMOS,
  INITIAL_SUPPLIERS,
  INITIAL_PROMOS,
  INITIAL_TAX_SERVICE,
  INITIAL_VARIABLE_COSTS,
  INITIAL_SHIFT_SCHEDULES,
  DEFAULT_SHIFT_TIMES
} from '../data/initialData';
import { INITIAL_ATTENDANCE_RECORDS, INITIAL_CLOSING_REPORTS } from '../data/attendanceAndClosingData';
import { RESTO_LOCATION, isWithinRestoRadius } from '../utils/geoUtils';
import { convertQuantity, convertCostPerUnit } from '../utils/unitConversion';
import { safeStorage } from '../utils/safeStorage';
import { updateFaviconAndTitle } from '../utils/favicon';

// Proactively sanitize bloated storage keys on module evaluation
safeStorage.cleanupBloatedStorage();

export const INITIAL_POS_TABLES: PosTableConfig[] = [
  { id: 'tbl-1', number: '01', name: 'Meja 01 (Indoor Depan)', capacity: 4, area: 'Indoor', isActive: true },
  { id: 'tbl-2', number: '02', name: 'Meja 02 (Indoor Tengah)', capacity: 4, area: 'Indoor', isActive: true },
  { id: 'tbl-3', number: '03', name: 'Meja 03 (Indoor Sudut)', capacity: 6, area: 'Indoor', isActive: true },
  { id: 'tbl-4', number: '04', name: 'Meja 04 (Indoor Jendela)', capacity: 2, area: 'Indoor', isActive: true },
  { id: 'tbl-5', number: '05', name: 'Meja 05 (Indoor Tengah)', capacity: 4, area: 'Indoor', isActive: true },
  { id: 'tbl-6', number: '06', name: 'Meja 06 (Indoor Kasir)', capacity: 4, area: 'Indoor', isActive: true },
  { id: 'tbl-7', number: '07', name: 'Meja 07 (Terrace Outdoor)', capacity: 4, area: 'Terrace', isActive: true },
  { id: 'tbl-8', number: '08', name: 'Meja 08 (Garden Outdoor)', capacity: 4, area: 'Outdoor', isActive: true },
  { id: 'tbl-9', number: '09', name: 'Meja 09 (Garden Outdoor)', capacity: 6, area: 'Outdoor', isActive: true },
  { id: 'tbl-10', number: '10', name: 'Meja 10 (Smoking Area)', capacity: 4, area: 'Outdoor', isActive: true },
  { id: 'tbl-11', number: 'VIP-1', name: 'Ruang VIP Mawar (AC)', capacity: 10, area: 'VIP', isActive: true },
  { id: 'tbl-12', number: 'VIP-2', name: 'Ruang VIP Melati (AC)', capacity: 8, area: 'VIP', isActive: true },
  { id: 'tbl-13', number: 'BAR-1', name: 'Bar Stool 01', capacity: 1, area: 'Bar', isActive: true },
  { id: 'tbl-14', number: 'BAR-2', name: 'Bar Stool 02', capacity: 1, area: 'Bar', isActive: true },
];

export type { NavigationTab };

interface RestoContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  changeMyPassword: (oldPass: string, newPass: string) => { success: boolean; message: string };
  adminResetPassword: (userId: string, newPass: string) => { success: boolean; message: string };
  updateUserRole: (userId: string, newRole: UserRole) => void;
  roles: RoleDefinition[];
  addRole: (newRole: Omit<RoleDefinition, 'isSystem'>, initialTabs?: NavigationTab[]) => { success: boolean; message: string; role?: RoleDefinition };
  updateRole: (roleId: string, updates: Partial<RoleDefinition>) => { success: boolean; message: string };
  deleteRole: (roleId: string, fallbackRoleId?: string) => { success: boolean; message: string };
  resetRolesToDefault: () => void;
  rolePermissions: RoleMenuPermissions;
  updateRolePermissions: (role: UserRole, allowedTabs: NavigationTab[]) => void;
  updateAllRolePermissions: (newPermissions: RoleMenuPermissions) => void;
  resetRolePermissionsToDefault: () => void;
  branding: RestaurantBranding;
  updateBranding: (updates: Partial<RestaurantBranding>) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  rawItems: RawItem[];
  menuItems: MenuItem[];
  receivings: ReceivingRecord[];
  wastes: WasteSpoilRecord[];
  sales: DailySalesRecord[];
  transfers: StockTransferRecord[];
  pettyCash: PettyCashRecord[];
  pettyCashBalance: number;
  currentOutlet: { id: string; name: string; city: string; address?: string };
  soConfig: SOItemConfig[];
  soRecords: StockOpnameRecord[];
  stockOpnames: StockOpnameRecord[];
  notifications: NotificationAlert[];

  // POS, Payment & Printers
  paymentMethods: PaymentMethodConfig[];
  addPaymentMethod: (method: Omit<PaymentMethodConfig, 'id'>) => void;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodConfig>) => void;
  deletePaymentMethod: (id: string) => void;
  printerRouting: PrinterRoutingSetting;
  updatePrinterRouting: (newSetting: Partial<PrinterRoutingSetting>) => void;
  updateMenuItemSoldLimit: (menuId: string, limit: number | null) => void;
  tableOrders: TableOrder[];
  addTableOrder: (order: Omit<TableOrder, 'id' | 'orderNumber'>) => TableOrder;
  updateTableOrderStatus: (orderId: string, paymentStatus: 'Lunas' | 'Belum Bayar', paymentMethod?: string) => void;
  cancelTableOrder: (orderId: string, reason: string) => { success: boolean; message: string };
  transferTable: (fromTable: string, toTable: string) => { success: boolean; message: string };
  transferTableItem: (fromTable: string, toTable: string, menuItemId: string, qty: number) => { success: boolean; message: string };
  splitTableOrder: (orderId: string, splitItems: { menuItemId: string; qty: number }[], newTableNumber?: string) => { success: boolean; message: string; newOrder?: TableOrder };

  // POS Table Management (Manager Only)
  restoTables: PosTableConfig[];
  addPosTable: (table: Omit<PosTableConfig, 'id'>) => { success: boolean; message: string; table?: PosTableConfig };
  updatePosTable: (id: string, updates: Partial<PosTableConfig>) => { success: boolean; message: string };
  deletePosTable: (id: string) => { success: boolean; message: string };

  // POS Promo & Tax/Service Settings (Manager Only)
  promos: PosPromoConfig[];
  addPromo: (promo: Omit<PosPromoConfig, 'id'>) => void;
  updatePromo: (id: string, updates: Partial<PosPromoConfig>) => void;
  deletePromo: (id: string) => void;
  taxServiceConfig: PosTaxServiceConfig;
  updateTaxServiceConfig: (updates: Partial<PosTaxServiceConfig>) => void;

  // Outlets & Suppliers
  outlets: OutletInfo[];
  addOutlet: (outlet: Omit<OutletInfo, 'id'>) => void;
  updateOutlet: (id: string, updates: Partial<OutletInfo>) => void;
  deleteOutlet: (id: string) => void;
  suppliers: SupplierInfo[];
  addSupplier: (supplier: Omit<SupplierInfo, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<SupplierInfo>) => void;
  deleteSupplier: (id: string) => void;

  // Purchasing & Material Limits
  purchasingOrders: PurchasingOrder[];
  addPurchasingOrder: (order: Omit<PurchasingOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void;
  updatePurchasingOrderStatus: (id: string, status: PurchasingStatus, notes?: string, supplierName?: string) => void;

  // Internal Memorandum
  internalMemos: InternalMemo[];
  addInternalMemo: (memo: Omit<InternalMemo, 'id' | 'memoNumber' | 'createdAt' | 'readBy'>) => void;
  markMemoAsRead: (memoId: string, userId: string) => void;
  deleteInternalMemo: (id: string) => void;
  
  // User Management CRUD
  createUser: (userData: Omit<User, 'id'>) => { success: boolean; message: string; user?: User };
  updateUser: (userId: string, updates: Partial<User>) => { success: boolean; message: string };
  deleteUser: (userId: string) => { success: boolean; message: string };
  updateUserProfile: (updates: Partial<User>) => { success: boolean; message: string };

  // Manager / Admin Edit & Delete for Staff input errors
  deleteRawItem: (id: string) => { success: boolean; message: string };
  deleteMenuItem: (id: string) => { success: boolean; message: string };
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => { success: boolean; message: string };
  updateTableOrder: (orderId: string, updates: Partial<TableOrder>) => { success: boolean; message: string };
  deleteTableOrder: (orderId: string) => { success: boolean; message: string };
  updatePurchasingOrder: (id: string, updates: Partial<PurchasingOrder>) => { success: boolean; message: string };
  deletePurchasingOrder: (id: string) => { success: boolean; message: string };
  updateInternalMemo: (id: string, updates: Partial<InternalMemo>) => { success: boolean; message: string };
  updateStockOpnameRecord: (id: string, updates: Partial<StockOpnameRecord>) => { success: boolean; message: string };
  deleteReceivingRecord: (id: string) => { success: boolean; message: string };
  updateReceivingRecord: (id: string, updates: Partial<ReceivingRecord>) => { success: boolean; message: string };
  deleteWasteRecord: (id: string) => { success: boolean; message: string };
  updateWasteRecord: (id: string, updates: Partial<WasteSpoilRecord>) => { success: boolean; message: string };
  deleteDailySalesRecord: (id: string) => { success: boolean; message: string };
  updateDailySalesRecord: (id: string, updates: Partial<DailySalesRecord>) => { success: boolean; message: string };
  deleteStockTransfer: (id: string) => { success: boolean; message: string };
  updateStockTransfer: (id: string, updates: Partial<StockTransferRecord>) => { success: boolean; message: string };
  deletePettyCashRecord: (id: string) => { success: boolean; message: string };
  deletePettyCashTransaction: (id: string) => { success: boolean; message: string };
  updatePettyCashRecord: (id: string, updates: Partial<PettyCashRecord>) => { success: boolean; message: string };
  updatePettyCashTransaction: (id: string, updates: Partial<PettyCashRecord>) => { success: boolean; message: string };
  deleteStockOpname: (id: string) => { success: boolean; message: string };
  deleteStockOpnameRecord: (id: string) => { success: boolean; message: string };

  // Variable Costs (Biaya Utilitas & Operasional Variabel)
  variableCosts: VariableCostRecord[];
  addVariableCost: (cost: Omit<VariableCostRecord, 'id' | 'createdAt'>) => { success: boolean; message: string };
  updateVariableCost: (id: string, updates: Partial<VariableCostRecord>) => { success: boolean; message: string };
  deleteVariableCost: (id: string) => { success: boolean; message: string };

  // Shift Schedules (Penjadwalan Kerja Karyawan)
  shiftSchedules: EmployeeShiftSchedule[];
  addShiftSchedule: (schedule: Omit<EmployeeShiftSchedule, 'id' | 'updatedAt'>) => { success: boolean; message: string };
  updateShiftSchedule: (id: string, updates: Partial<EmployeeShiftSchedule>) => { success: boolean; message: string };
  deleteShiftSchedule: (id: string) => { success: boolean; message: string };
  bulkAssignShiftSchedules: (schedules: Omit<EmployeeShiftSchedule, 'id' | 'updatedAt'>[]) => { success: boolean; message: string };

  // Actions
  addRawItem: (item: Omit<RawItem, 'id' | 'lastUpdated'>) => void;
  bulkAddRawItems: (items: (Omit<RawItem, 'id' | 'lastUpdated'> & { id?: string })[]) => { addedCount: number; updatedCount: number };
  updateRawItem: (id: string, updates: Partial<RawItem>) => void;
  addMenuItem: (menu: Omit<MenuItem, 'id'>) => void;
  bulkAddMenuItems: (items: (Omit<MenuItem, 'id'> & { id?: string })[]) => { addedCount: number; updatedCount: number };
  addReceivingRecord: (record: Omit<ReceivingRecord, 'id'>) => void;
  addWasteRecord: (record: Omit<WasteSpoilRecord, 'id'>) => void;
  addDailySalesRecord: (record: Omit<DailySalesRecord, 'id'>) => void;
  addStockTransfer: (record: Omit<StockTransferRecord, 'id'>) => void;
  updateTransferStatus: (id: string, status: StockTransferRecord['status'], receivedBy?: string, receivingPhotoUrl?: string) => void;
  addPettyCashRecord: (record: Omit<PettyCashRecord, 'id'>) => void;
  addPettyCashTransaction: (record: Omit<PettyCashRecord, 'id'>) => void;
  updateSOConfig: (newConfig: SOItemConfig[]) => void;
  submitStockOpname: (record: Omit<StockOpnameRecord, 'id'>) => void;
  addStockOpnameRecord: (record: Omit<StockOpnameRecord, 'id'>) => void;
  approveStockOpname: (id: string, managerNotes?: string) => void;
  markNotificationAsRead: (id: string) => void;
  resetAllDataToZero: () => void;
  resetToDefaultData: () => void;
  resetSalesDataOnly: () => { success: boolean; message: string };
  calculateRecipeHPP: (recipes: RecipeIngredient[]) => number;
  formatRupiah: (amount: number) => string;
  sendLeaderBirthdayMemo: (targetUserId: string, customMessage?: string) => { success: boolean; message: string };
  todayBirthdays: { user: User; hasMemoSent: boolean }[];
  upcomingBirthdays: { user: User; daysRemaining: number }[];
  expiringContractEmployees: { user: User; daysRemaining: number }[];
  // Closing Shift & End of Day Reports
  closingReports: PosClosingReport[];
  submitClosingReport: (reportData: Omit<PosClosingReport, 'id' | 'createdAt'>) => { success: boolean; message: string; report: PosClosingReport };
  deleteClosingReport: (id: string) => { success: boolean; message: string };
  // Attendance (Absensi Selfie & GPS)
  attendanceRecords: AttendanceRecord[];
  submitAttendance: (data: Omit<AttendanceRecord, 'id' | 'createdAt'>) => { success: boolean; message: string; record: AttendanceRecord };
  deleteAttendanceRecord: (id: string) => { success: boolean; message: string };
  // Shift Time Configuration (Manager Custom Hours)
  shiftTimeConfigs: Record<ShiftType, { startTime: string; endTime: string }>;
  updateShiftTimeConfigs: (configs: Record<ShiftType, { startTime: string; endTime: string }>) => { success: boolean; message: string };
  // Central Database & Real-Time Sync
  dbSyncStatus: { isConnected: boolean; activeDevices: number; lastSyncDate: Date | null };
  refreshFromDatabase: () => Promise<void>;
}

const RestoContext = createContext<RestoContextType | undefined>(undefined);

export const RestoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from LocalStorage or Fallback
  const [users, setUsers] = useState<User[]>(() => {
    return safeStorage.getJSON<User[]>('resto_users', INITIAL_USERS);
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    return safeStorage.getJSON<User>('resto_currentUser', INITIAL_USERS[0]);
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // SECURITY FIX: Default landing view MUST be the Login page for unauthorized access prevention.
    // Only restore session if explicitly authenticated in this active browser session.
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const sessionAuth = window.sessionStorage.getItem('resto_session_auth');
        if (sessionAuth === 'true') {
          return true;
        }
      }
    } catch {}
    // Clean up persistent auto-login in localStorage to prevent unauthorized access by staff
    safeStorage.removeItem('resto_isAuth');
    return false;
  });

  const [roles, setRoles] = useState<RoleDefinition[]>(() => {
    const saved = safeStorage.getItem('resto_roles');
    if (saved) {
      try {
        const parsed: RoleDefinition[] = JSON.parse(saved);
        const map = new Map<string, RoleDefinition>();
        INITIAL_ROLES.forEach(r => map.set(r.id, r));
        parsed.forEach(r => map.set(r.id, { ...map.get(r.id), ...r }));
        return Array.from(map.values());
      } catch {
        return INITIAL_ROLES;
      }
    }
    return INITIAL_ROLES;
  });

  const [rolePermissions, setRolePermissions] = useState<RoleMenuPermissions>(() => {
    const saved = safeStorage.getItem('resto_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged: RoleMenuPermissions = {
          manager: [...INITIAL_ROLE_PERMISSIONS.manager],
          head_kitchen: Array.from(new Set(['dashboard', ...(parsed.head_kitchen || INITIAL_ROLE_PERMISSIONS.head_kitchen)])),
          head_floor: Array.from(new Set(['dashboard', ...(parsed.head_floor || INITIAL_ROLE_PERMISSIONS.head_floor)])),
          kasir: Array.from(new Set(['dashboard', ...(parsed.kasir || INITIAL_ROLE_PERMISSIONS.kasir)])),
          staff: Array.from(new Set(['dashboard', ...(parsed.staff || INITIAL_ROLE_PERMISSIONS.staff)])),
          purchasing: Array.from(new Set(['dashboard', ...(parsed.purchasing || INITIAL_ROLE_PERMISSIONS.purchasing)])),
          owner: Array.from(new Set(['dashboard', ...(parsed.owner || INITIAL_ROLE_PERMISSIONS.owner || INITIAL_ROLE_PERMISSIONS.manager)])),
          ...parsed,
        };
        merged.manager = [...INITIAL_ROLE_PERMISSIONS.manager];
        Object.keys(merged).forEach(k => {
          if (!merged[k].includes('dashboard')) {
            merged[k] = ['dashboard', ...merged[k]];
          }
        });
        return merged;
      } catch {
        return INITIAL_ROLE_PERMISSIONS;
      }
    }
    return INITIAL_ROLE_PERMISSIONS;
  });

  const [branding, setBranding] = useState<RestaurantBranding>(() => {
    const saved = safeStorage.getItem('resto_branding');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_BRANDING;
      }
    }
    return INITIAL_BRANDING;
  });

  const updateBranding = (updates: Partial<RestaurantBranding>) => {
    setBranding(prev => {
      const updated = { ...prev, ...updates };
      safeStorage.setItem('resto_branding', JSON.stringify(updated));
      return updated;
    });
  };

  // Synchronize browser tab favicon & title across all LAN devices whenever branding updates
  useEffect(() => {
    updateFaviconAndTitle(branding);
  }, [branding]);

  const [activeTab, setActiveTabState] = useState<NavigationTab>(() => {
    try {
      const saved = safeStorage.getItem('resto_active_tab');
      if (saved) {
        return saved as NavigationTab;
      }
    } catch {}
    return 'dashboard';
  });

  const setActiveTab = (tab: NavigationTab) => {
    setActiveTabState(tab);
    try {
      safeStorage.setItem('resto_active_tab', tab);
    } catch {}
  };

  const [rawItems, setRawItems] = useState<RawItem[]>(() => {
    return safeStorage.getJSON<RawItem[]>('resto_rawItems', INITIAL_RAW_ITEMS);
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    return safeStorage.getJSON<MenuItem[]>('resto_menuItems', INITIAL_MENU_ITEMS);
  });

  const [receivings, setReceivings] = useState<ReceivingRecord[]>(() => {
    return safeStorage.getJSON<ReceivingRecord[]>('resto_receivings', INITIAL_RECEIVINGS);
  });

  const [wastes, setWastes] = useState<WasteSpoilRecord[]>(() => {
    return safeStorage.getJSON<WasteSpoilRecord[]>('resto_wastes', INITIAL_WASTES);
  });

  const [sales, setSales] = useState<DailySalesRecord[]>(() => {
    return safeStorage.getJSON<DailySalesRecord[]>('resto_sales', INITIAL_SALES);
  });

  const [transfers, setTransfers] = useState<StockTransferRecord[]>(() => {
    return safeStorage.getJSON<StockTransferRecord[]>('resto_transfers', INITIAL_TRANSFERS);
  });

  const [pettyCash, setPettyCash] = useState<PettyCashRecord[]>(() => {
    return safeStorage.getJSON<PettyCashRecord[]>('resto_pettyCash', INITIAL_PETTY_CASH);
  });

  const [soConfig, setSoConfig] = useState<SOItemConfig[]>(() => {
    return safeStorage.getJSON<SOItemConfig[]>('resto_soConfig', INITIAL_SO_CONFIG);
  });

  const [soRecords, setSoRecords] = useState<StockOpnameRecord[]>(() => {
    return safeStorage.getJSON<StockOpnameRecord[]>('resto_soRecords', INITIAL_SO_RECORDS);
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(() => {
    return safeStorage.getJSON<PaymentMethodConfig[]>('resto_paymentMethods', INITIAL_PAYMENT_METHODS);
  });

  const [printerRouting, setPrinterRouting] = useState<PrinterRoutingSetting>(() => {
    return safeStorage.getJSON<PrinterRoutingSetting>('resto_printerRouting', INITIAL_PRINTER_ROUTING);
  });

  const [tableOrders, setTableOrders] = useState<TableOrder[]>(() => {
    return safeStorage.getJSON<TableOrder[]>('resto_tableOrders', INITIAL_TABLE_ORDERS);
  });

  const [outlets, setOutlets] = useState<OutletInfo[]>(() => {
    return safeStorage.getJSON<OutletInfo[]>('resto_outlets', INITIAL_OUTLETS);
  });

  const [purchasingOrders, setPurchasingOrders] = useState<PurchasingOrder[]>(() => {
    return safeStorage.getJSON<PurchasingOrder[]>('resto_purchasingOrders', INITIAL_PURCHASING_ORDERS);
  });

  const [internalMemos, setInternalMemos] = useState<InternalMemo[]>(() => {
    return safeStorage.getJSON<InternalMemo[]>('resto_internalMemos', INITIAL_INTERNAL_MEMOS);
  });

  const [suppliers, setSuppliers] = useState<SupplierInfo[]>(() => {
    return safeStorage.getJSON<SupplierInfo[]>('resto_suppliers', INITIAL_SUPPLIERS);
  });

  const [promos, setPromos] = useState<PosPromoConfig[]>(() => {
    return safeStorage.getJSON<PosPromoConfig[]>('resto_promos', INITIAL_PROMOS);
  });

  const [taxServiceConfig, setTaxServiceConfig] = useState<PosTaxServiceConfig>(() => {
    return safeStorage.getJSON<PosTaxServiceConfig>('resto_taxService', INITIAL_TAX_SERVICE);
  });

  const [variableCosts, setVariableCosts] = useState<VariableCostRecord[]>(() => {
    return safeStorage.getJSON<VariableCostRecord[]>('resto_variableCosts', INITIAL_VARIABLE_COSTS);
  });

  const [shiftSchedules, setShiftSchedules] = useState<EmployeeShiftSchedule[]>(() => {
    return safeStorage.getJSON<EmployeeShiftSchedule[]>('resto_shiftSchedules', INITIAL_SHIFT_SCHEDULES);
  });

  const [restoTables, setRestoTables] = useState<PosTableConfig[]>(() => {
    return safeStorage.getJSON<PosTableConfig[]>('resto_tables', INITIAL_POS_TABLES);
  });

  const [closingReports, setClosingReports] = useState<PosClosingReport[]>(() => {
    return safeStorage.getJSON<PosClosingReport[]>('resto_closing_reports', INITIAL_CLOSING_REPORTS);
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    return safeStorage.getJSON<AttendanceRecord[]>('resto_attendance_records', INITIAL_ATTENDANCE_RECORDS);
  });

  const [shiftTimeConfigs, setShiftTimeConfigs] = useState<Record<ShiftType, { startTime: string; endTime: string }>>(() => {
    return safeStorage.getJSON<Record<ShiftType, { startTime: string; endTime: string }>>('resto_shift_time_configs', DEFAULT_SHIFT_TIMES);
  });

  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);

  // Real-time Database Sync State
  const [dbSyncStatus, setDbSyncStatus] = useState({
    isConnected: false,
    activeDevices: 1,
    lastSyncDate: null as Date | null,
  });

  const isInitialSyncDoneRef = useRef(false);
  const isApplyingRemoteUpdateRef = useRef(false);

  // Helper to push updates to Central Server Database
  const syncToServer = useCallback((key: string, data: any) => {
    if (!isInitialSyncDoneRef.current || isApplyingRemoteUpdateRef.current) return;
    dbSync.pushUpdate(key, data);
  }, []);

  // Listen to connection and active device status
  useEffect(() => {
    const unsub = dbSync.onStatusChange((connected, devices) => {
      setDbSyncStatus({
        isConnected: connected,
        activeDevices: devices,
        lastSyncDate: dbSync.getStatus().lastSyncDate,
      });
    });
    return () => {
      unsub();
    };
  }, []);

  // Synchronize state with Central Server Database on mount and listen to real-time events
  useEffect(() => {
    let isMounted = true;

    async function initDatabaseSync() {
      const full = await dbSync.fetchFullState();
      if (!isMounted) return;

      if (full && full.data && Object.keys(full.data).length > 0) {
        // Server database has records! Hydrate all states from server
        isApplyingRemoteUpdateRef.current = true;
        const d = full.data;
        if (d.resto_users) setUsers(d.resto_users);
        if (d.resto_roles) setRoles(d.resto_roles);
        if (d.resto_permissions) setRolePermissions(d.resto_permissions);
        if (d.resto_branding) setBranding(d.resto_branding);
        if (d.resto_rawItems) setRawItems(d.resto_rawItems);
        if (d.resto_menuItems) setMenuItems(d.resto_menuItems);
        if (d.resto_receivings) setReceivings(d.resto_receivings);
        if (d.resto_wastes) setWastes(d.resto_wastes);
        if (d.resto_sales) setSales(d.resto_sales);
        if (d.resto_transfers) setTransfers(d.resto_transfers);
        if (d.resto_pettyCash) setPettyCash(d.resto_pettyCash);
        if (d.resto_soConfig) setSoConfig(d.resto_soConfig);
        if (d.resto_soRecords) setSoRecords(d.resto_soRecords);
        if (d.resto_paymentMethods) setPaymentMethods(d.resto_paymentMethods);
        if (d.resto_printerRouting) setPrinterRouting(d.resto_printerRouting);
        if (d.resto_tableOrders) setTableOrders(d.resto_tableOrders);
        if (d.resto_outlets) setOutlets(d.resto_outlets);
        if (d.resto_purchasingOrders) setPurchasingOrders(d.resto_purchasingOrders);
        if (d.resto_internalMemos) setInternalMemos(d.resto_internalMemos);
        if (d.resto_suppliers) setSuppliers(d.resto_suppliers);
        if (d.resto_promos) setPromos(d.resto_promos);
        if (d.resto_taxService) setTaxServiceConfig(d.resto_taxService);
        if (d.resto_variableCosts) setVariableCosts(d.resto_variableCosts);
        if (d.resto_shiftSchedules) setShiftSchedules(d.resto_shiftSchedules);
        if (d.resto_tables) setRestoTables(d.resto_tables);
        if (d.resto_closing_reports) setClosingReports(d.resto_closing_reports);
        if (d.resto_attendance_records) setAttendanceRecords(d.resto_attendance_records);
        if (d.resto_shift_time_configs) setShiftTimeConfigs(d.resto_shift_time_configs);

        setTimeout(() => {
          if (isMounted) isApplyingRemoteUpdateRef.current = false;
        }, 100);
      } else {
        // Server database is empty (e.g. freshly started PC Kasir) -> Seed server with current baseline data
        const seedPayload = {
          resto_users: users,
          resto_roles: roles,
          resto_permissions: rolePermissions,
          resto_branding: branding,
          resto_rawItems: rawItems,
          resto_menuItems: menuItems,
          resto_receivings: receivings,
          resto_wastes: wastes,
          resto_sales: sales,
          resto_transfers: transfers,
          resto_pettyCash: pettyCash,
          resto_soConfig: soConfig,
          resto_soRecords: soRecords,
          resto_paymentMethods: paymentMethods,
          resto_printerRouting: printerRouting,
          resto_tableOrders: tableOrders,
          resto_outlets: outlets,
          resto_purchasingOrders: purchasingOrders,
          resto_internalMemos: internalMemos,
          resto_suppliers: suppliers,
          resto_promos: promos,
          resto_taxService: taxServiceConfig,
          resto_variableCosts: variableCosts,
          resto_shiftSchedules: shiftSchedules,
          resto_tables: restoTables,
          resto_closing_reports: closingReports,
          resto_attendance_records: attendanceRecords,
          resto_shift_time_configs: shiftTimeConfigs,
        };
        await dbSync.seedServerIfEmpty(seedPayload);
      }

      isInitialSyncDoneRef.current = true;
    }

    initDatabaseSync();

    // Listen to real-time sync events from server (originating from Manager PC, Waiter HP, Kitchen, etc.)
    const handleRemoteUpdate = (payload: SyncPayload) => {
      isApplyingRemoteUpdateRef.current = true;

      const applyKey = (k: string, val: any) => {
        if (!val) return;
        switch (k) {
          case 'resto_users': setUsers(val); break;
          case 'resto_roles': setRoles(val); break;
          case 'resto_permissions': setRolePermissions(val); break;
          case 'resto_branding': setBranding(val); break;
          case 'resto_rawItems': setRawItems(val); break;
          case 'resto_menuItems': setMenuItems(val); break;
          case 'resto_receivings': setReceivings(val); break;
          case 'resto_wastes': setWastes(val); break;
          case 'resto_sales': setSales(val); break;
          case 'resto_transfers': setTransfers(val); break;
          case 'resto_pettyCash': setPettyCash(val); break;
          case 'resto_soConfig': setSoConfig(val); break;
          case 'resto_soRecords': setSoRecords(val); break;
          case 'resto_paymentMethods': setPaymentMethods(val); break;
          case 'resto_printerRouting': setPrinterRouting(val); break;
          case 'resto_tableOrders': setTableOrders(val); break;
          case 'resto_outlets': setOutlets(val); break;
          case 'resto_purchasingOrders': setPurchasingOrders(val); break;
          case 'resto_internalMemos': setInternalMemos(val); break;
          case 'resto_suppliers': setSuppliers(val); break;
          case 'resto_promos': setPromos(val); break;
          case 'resto_taxService': setTaxServiceConfig(val); break;
          case 'resto_variableCosts': setVariableCosts(val); break;
          case 'resto_shiftSchedules': setShiftSchedules(val); break;
          case 'resto_tables': setRestoTables(val); break;
          case 'resto_closing_reports': setClosingReports(val); break;
          case 'resto_attendance_records': setAttendanceRecords(val); break;
          case 'resto_shift_time_configs': setShiftTimeConfigs(val); break;
        }
      };

      if (payload.updates) {
        for (const [k, val] of Object.entries(payload.updates)) {
          applyKey(k, val);
        }
      } else if (payload.key && payload.data !== undefined) {
        applyKey(payload.key, payload.data);
      }

      setTimeout(() => {
        if (isMounted) isApplyingRemoteUpdateRef.current = false;
      }, 100);
    };

    dbSync.startRealtimeSync(handleRemoteUpdate);

    return () => {
      isMounted = false;
      dbSync.stopRealtimeSync(handleRemoteUpdate);
    };
  }, []);

  // Manual refresh from central database
  const refreshFromDatabase = async () => {
    const full = await dbSync.fetchFullState();
    if (full && full.data) {
      isApplyingRemoteUpdateRef.current = true;
      const d = full.data;
      if (d.resto_users) setUsers(d.resto_users);
      if (d.resto_roles) setRoles(d.resto_roles);
      if (d.resto_permissions) setRolePermissions(d.resto_permissions);
      if (d.resto_branding) setBranding(d.resto_branding);
      if (d.resto_rawItems) setRawItems(d.resto_rawItems);
      if (d.resto_menuItems) setMenuItems(d.resto_menuItems);
      if (d.resto_receivings) setReceivings(d.resto_receivings);
      if (d.resto_wastes) setWastes(d.resto_wastes);
      if (d.resto_sales) setSales(d.resto_sales);
      if (d.resto_transfers) setTransfers(d.resto_transfers);
      if (d.resto_pettyCash) setPettyCash(d.resto_pettyCash);
      if (d.resto_soConfig) setSoConfig(d.resto_soConfig);
      if (d.resto_soRecords) setSoRecords(d.resto_soRecords);
      if (d.resto_paymentMethods) setPaymentMethods(d.resto_paymentMethods);
      if (d.resto_printerRouting) setPrinterRouting(d.resto_printerRouting);
      if (d.resto_tableOrders) setTableOrders(d.resto_tableOrders);
      if (d.resto_outlets) setOutlets(d.resto_outlets);
      if (d.resto_purchasingOrders) setPurchasingOrders(d.resto_purchasingOrders);
      if (d.resto_internalMemos) setInternalMemos(d.resto_internalMemos);
      if (d.resto_suppliers) setSuppliers(d.resto_suppliers);
      if (d.resto_promos) setPromos(d.resto_promos);
      if (d.resto_taxService) setTaxServiceConfig(d.resto_taxService);
      if (d.resto_variableCosts) setVariableCosts(d.resto_variableCosts);
      if (d.resto_shiftSchedules) setShiftSchedules(d.resto_shiftSchedules);
      if (d.resto_tables) setRestoTables(d.resto_tables);
      if (d.resto_closing_reports) setClosingReports(d.resto_closing_reports);
      if (d.resto_attendance_records) setAttendanceRecords(d.resto_attendance_records);
      if (d.resto_shift_time_configs) setShiftTimeConfigs(d.resto_shift_time_configs);
      setTimeout(() => {
        isApplyingRemoteUpdateRef.current = false;
      }, 100);
    }
  };

  // Sync to LocalStorage (safely wrapped) AND push to Central Server Database
  useEffect(() => {
    safeStorage.setItem('resto_currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    safeStorage.setItem('resto_users', JSON.stringify(users));
    syncToServer('resto_users', users);
  }, [users, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_roles', JSON.stringify(roles));
    syncToServer('resto_roles', roles);
  }, [roles, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_permissions', JSON.stringify(rolePermissions));
    syncToServer('resto_permissions', rolePermissions);
  }, [rolePermissions, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_branding', JSON.stringify(branding));
    syncToServer('resto_branding', branding);
  }, [branding, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_rawItems', JSON.stringify(rawItems));
    syncToServer('resto_rawItems', rawItems);
  }, [rawItems, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_menuItems', JSON.stringify(menuItems));
    syncToServer('resto_menuItems', menuItems);
  }, [menuItems, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_receivings', JSON.stringify(receivings));
    syncToServer('resto_receivings', receivings);
  }, [receivings, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_wastes', JSON.stringify(wastes));
    syncToServer('resto_wastes', wastes);
  }, [wastes, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_sales', JSON.stringify(sales));
    syncToServer('resto_sales', sales);
  }, [sales, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_transfers', JSON.stringify(transfers));
    syncToServer('resto_transfers', transfers);
  }, [transfers, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_pettyCash', JSON.stringify(pettyCash));
    syncToServer('resto_pettyCash', pettyCash);
  }, [pettyCash, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_soConfig', JSON.stringify(soConfig));
    syncToServer('resto_soConfig', soConfig);
  }, [soConfig, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_soRecords', JSON.stringify(soRecords));
    syncToServer('resto_soRecords', soRecords);
  }, [soRecords, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_paymentMethods', JSON.stringify(paymentMethods));
    syncToServer('resto_paymentMethods', paymentMethods);
  }, [paymentMethods, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_printerRouting', JSON.stringify(printerRouting));
    syncToServer('resto_printerRouting', printerRouting);
  }, [printerRouting, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_tableOrders', JSON.stringify(tableOrders));
    syncToServer('resto_tableOrders', tableOrders);
  }, [tableOrders, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_outlets', JSON.stringify(outlets));
    syncToServer('resto_outlets', outlets);
  }, [outlets, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_purchasingOrders', JSON.stringify(purchasingOrders));
    syncToServer('resto_purchasingOrders', purchasingOrders);
  }, [purchasingOrders, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_internalMemos', JSON.stringify(internalMemos));
    syncToServer('resto_internalMemos', internalMemos);
  }, [internalMemos, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_suppliers', JSON.stringify(suppliers));
    syncToServer('resto_suppliers', suppliers);
  }, [suppliers, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_promos', JSON.stringify(promos));
    syncToServer('resto_promos', promos);
  }, [promos, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_taxService', JSON.stringify(taxServiceConfig));
    syncToServer('resto_taxService', taxServiceConfig);
  }, [taxServiceConfig, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_variableCosts', JSON.stringify(variableCosts));
    syncToServer('resto_variableCosts', variableCosts);
  }, [variableCosts, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_shiftSchedules', JSON.stringify(shiftSchedules));
    syncToServer('resto_shiftSchedules', shiftSchedules);
  }, [shiftSchedules, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_tables', JSON.stringify(restoTables));
    syncToServer('resto_tables', restoTables);
  }, [restoTables, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_closing_reports', JSON.stringify(closingReports));
    syncToServer('resto_closing_reports', closingReports);
  }, [closingReports, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_attendance_records', JSON.stringify(attendanceRecords));
    syncToServer('resto_attendance_records', attendanceRecords);
  }, [attendanceRecords, syncToServer]);

  useEffect(() => {
    safeStorage.setItem('resto_shift_time_configs', JSON.stringify(shiftTimeConfigs));
    syncToServer('resto_shift_time_configs', shiftTimeConfigs);
  }, [shiftTimeConfigs, syncToServer]);

  // Compute live notifications whenever rawItems or others change
  useEffect(() => {
    const alerts: NotificationAlert[] = [];

    // Check low stock
    rawItems.forEach((item) => {
      if (item.currentStock <= item.minimumStock) {
        alerts.push({
          id: `low-${item.id}`,
          type: 'low_stock',
          title: `Stok Kritis: ${item.name}`,
          message: `Stok saat ini ${item.currentStock.toFixed(1)} ${item.unit} (Batas min: ${item.minimumStock} ${item.unit})`,
          timestamp: 'Real-time Alert',
          isRead: false,
          itemId: item.id,
        });
      }
    });

    // Check pending SO approvals for manager
    const pendingSO = soRecords.filter(r => r.status === 'Submitted');
    if (pendingSO.length > 0) {
      alerts.push({
        id: 'so-pending-alert',
        type: 'so_pending',
        title: `${pendingSO.length} Stock Opname Butuh Verifikasi`,
        message: 'Laporan SO harian/bulanan menunggu approval dari Manager Resto.',
        timestamp: 'Hari Ini',
        isRead: false,
      });
    }

    // Check pending Purchasing / Outlet Requests
    const pendingPO = purchasingOrders.filter(p => p.status === 'Menunggu Approval' || p.status === 'Diproses Purchasing');
    if (pendingPO.length > 0) {
      alerts.push({
        id: 'po-outlet-alert',
        type: 'transfer',
        title: `${pendingPO.length} Orderan Pengadaan Outlet`,
        message: 'Ada permintaan bahan baku dari outlet/dapur yang perlu dicek tim Purchasing.',
        timestamp: 'Purchasing',
        isRead: false,
      });
    }

    // Check unread internal memos for current user
    const unreadMemos = internalMemos.filter(m => 
      (m.recipientType === 'all' || 
       (m.recipientType === 'role' && m.recipientRole === currentUser.role) || 
       (m.recipientType === 'user' && m.recipientId === currentUser.id)) && 
      !m.readBy.includes(currentUser.id)
    );
    if (unreadMemos.length > 0) {
      alerts.push({
        id: 'memo-unread-alert',
        type: 'transfer',
        title: `${unreadMemos.length} Memorandum Belum Dibaca`,
        message: 'Terdapat instruksi atau memorandum internal manajemen untuk Anda.',
        timestamp: 'Memo Internal',
        isRead: false,
      });
    }

    // Check employee contract expiration (< 2 months / <= 60 days) for Manager / Master Admin / Leaders
    const isLeader = currentUser.role === 'manager' || 
                     currentUser.role === 'head_kitchen' || 
                     currentUser.role === 'head_floor' || 
                     currentUser.isMasterAdmin;

    if (isLeader) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      users.forEach(u => {
        if (u.contractStatus === 'kontrak' && u.contractEndDate) {
          const end = new Date(u.contractEndDate);
          const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 60) {
            alerts.push({
              id: `contract-exp-${u.id}`,
              type: 'contract_expiring',
              title: `⏳ Peringatan Kontrak: ${u.name}`,
              message: `Kontrak kerja karyawan ${u.name} (${u.roleTitle}) tersisa ${diffDays} hari lagi (berakhir ${u.contractEndDate}). Segera siapkan evaluasi HRD atau perpanjangan kontrak!`,
              timestamp: `${diffDays} hari tersisa`,
              isRead: false,
              targetUserId: u.id,
            });
          }
        }
      });
    }

    // Check employee birthdays today for leaders (Manager, Head Floor, Head Kitchen)
    if (isLeader) {
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      const todayDateStr = today.toISOString().slice(0, 10);

      users.forEach(u => {
        if (!u.birthDate) return;
        const parts = u.birthDate.split('-');
        if (parts.length >= 3 && parseInt(parts[1], 10) === todayMonth && parseInt(parts[2], 10) === todayDay) {
          alerts.push({
            id: `bday-alert-${u.id}-${todayDateStr}`,
            type: 'birthday',
            title: `🎂 Ulang Tahun Hari Ini: ${u.name}!`,
            message: `Hari ini ${u.name} (${u.roleTitle}) berulang tahun! Ucapan selamat resmi dari para leader otomatis terkirim via Memorandum Internal jika belum dibuat.`,
            timestamp: 'Hari Ini',
            isRead: false,
            targetUserId: u.id,
          });
        }
      });
    }

    setNotifications(alerts);
  }, [rawItems, soRecords, purchasingOrders, internalMemos, currentUser, users]);

  // Automated Birthday Memorandum System:
  // If an employee has a birthday today and leaders forgot to write a greeting memo,
  // the system automatically generates and dispatches an official greeting memorandum from the leaders!
  useEffect(() => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const todayDateStr = today.toISOString().slice(0, 10);
    const currentYear = today.getFullYear();
    const currentMonth = String(todayMonth).padStart(2, '0');

    const bdayUsers = users.filter(u => {
      if (!u.birthDate) return false;
      const parts = u.birthDate.split('-');
      if (parts.length < 3) return false;
      return parseInt(parts[1], 10) === todayMonth && parseInt(parts[2], 10) === todayDay;
    });

    if (bdayUsers.length === 0) return;

    let hasNewAutoMemo = false;
    let updatedMemos = [...internalMemos];

    bdayUsers.forEach(u => {
      const alreadySent = updatedMemos.some(m => 
        (m?.id && m.id.includes(`bday-${u.id}-${todayDateStr}`)) || 
        (m?.title && m.title.toLowerCase().includes('ulang tahun') && m.title.includes(u.name) && (m?.date ? m.date.startsWith(todayDateStr) : false))
      );

      if (!alreadySent) {
        hasNewAutoMemo = true;
        const autoMemo: InternalMemo = {
          id: `memo-bday-${u.id}-${todayDateStr}`,
          memoNumber: `MEMO/${currentYear}/${currentMonth}/BDAY-${u.username.toUpperCase()}`,
          date: todayDateStr,
          senderId: 'leader-board',
          senderName: 'Segenap Dewan Leader (Manager, Head Kitchen & Head Floor)',
          senderRole: 'manager',
          recipientType: 'all',
          recipientRole: 'all',
          recipientName: `Seluruh Tim & ${u.name}`,
          recipientId: u.id,
          title: `🎉🎂 Ucapan Selamat Ulang Tahun: ${u.name} (${u.roleTitle})`,
          subject: `🎉🎂 Ucapan Selamat Ulang Tahun: ${u.name} (${u.roleTitle})`,
          content: `Kepada Seluruh Rekan Tim Imah Kayu Jatinangor,\n\nHari ini, ${today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, adalah hari bahagia bagi salah satu anggota keluarga besar restoran kita!\n\nSegenap jajaran Leader Restoran (Restaurant Manager, Head Kitchen, dan Head Floor) dengan penuh sukacita dan kebanggaan mengucapkan:\n\n✨ SELAMAT ULANG TAHUN UNTUK REKAN KITA: ${u.name.toUpperCase()} (${u.roleTitle.toUpperCase()})! 🎂🥳🎁\n\nSemoga bertambahnya usia senantiasa membawa limpahan kesehatan, kebahagiaan, rezeki yang berkah, serta kesuksesan yang semakin gemilang. Terima kasih sebesar-besarnya atas segala dedikasi, kerja keras, loyalitas, dan energi positif yang senantiasa kamu berikan demi kemajuan Imah Kayu Jatinangor.\n\nMari seluruh rekan kerja meluangkan waktu memberikan ucapan selamat dan doa terbaik secara langsung saat bersua hari ini!\n\nSalam hangat & penuh hormat,\n— Jajaran Leader Imah Kayu Jatinangor (Manager, Head Kitchen & Head Floor)`,
          priority: 'Penting',
          readBy: ['user-1'],
          createdAt: `${todayDateStr} 07:00`,
        };
        updatedMemos = [autoMemo, ...updatedMemos];
      }
    });

    if (hasNewAutoMemo) {
      setInternalMemos(updatedMemos);
      safeStorage.setItem('resto_internalMemos', JSON.stringify(updatedMemos));
    }
  }, [users, internalMemos]);

  // Today birthdays list
  const todayBirthdays = React.useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const todayDateStr = today.toISOString().slice(0, 10);

    return users.filter(u => {
      if (!u.birthDate) return false;
      const parts = u.birthDate.split('-');
      if (parts.length < 3) return false;
      return parseInt(parts[1], 10) === todayMonth && parseInt(parts[2], 10) === todayDay;
    }).map(u => {
      const hasMemo = internalMemos.some(m => 
        m.id.includes(`bday-${u.id}-${todayDateStr}`) || 
        (m.title && m.title.toLowerCase().includes('ulang tahun') && m.title.includes(u.name))
      );
      return { user: u, hasMemoSent: hasMemo };
    });
  }, [users, internalMemos]);

  // Upcoming birthdays list (next 30 days)
  const upcomingBirthdays = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const list: { user: User; daysRemaining: number }[] = [];

    users.forEach(u => {
      if (!u.birthDate) return;
      const parts = u.birthDate.split('-');
      if (parts.length < 3) return;
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);

      const thisYearBday = new Date(today.getFullYear(), m, d);
      if (thisYearBday < today) {
        thisYearBday.setFullYear(today.getFullYear() + 1);
      }
      const diffTime = thisYearBday.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 30) {
        list.push({ user: u, daysRemaining: diffDays });
      }
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [users]);

  // Leaders manual / custom birthday memorandum trigger
  const sendLeaderBirthdayMemo = (targetUserId: string, customMessage?: string): { success: boolean; message: string } => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return { success: false, message: 'Karyawan tidak ditemukan.' };
    const today = new Date();
    const todayDateStr = today.toISOString().slice(0, 10);
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');

    const newMemo: InternalMemo = {
      id: `memo-bday-${target.id}-${Date.now()}`,
      memoNumber: `MEMO/${currentYear}/${currentMonth}/BDAY-${target.username.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      date: todayDateStr,
      senderId: currentUser.id,
      senderName: `${currentUser.name} (${currentUser.roleTitle}) & Dewan Leader`,
      senderRole: currentUser.role,
      recipientType: 'all',
      recipientRole: 'all',
      recipientName: `Seluruh Tim & ${target.name}`,
      recipientId: target.id,
      title: `🎉🎂 Ucapan Selamat Ulang Tahun: ${target.name} (${target.roleTitle})`,
      subject: `🎉🎂 Ucapan Selamat Ulang Tahun: ${target.name} (${target.roleTitle})`,
      content: customMessage || `Segenap jajaran Leader Restoran (Restaurant Manager, Head Kitchen, dan Head Floor) mengucapkan Selamat Ulang Tahun untuk rekan kita tercinta: ${target.name} (${target.roleTitle})! 🎂🥳 Semoga sehat selalu, panjang umur, dan semakin sukses berkarya bersama keluarga besar Imah Kayu Jatinangor!`,
      priority: 'Penting',
      readBy: [currentUser.id],
      createdAt: `${todayDateStr} ${today.toTimeString().slice(0, 5)}`,
    };

    setInternalMemos(prev => {
      const next = [newMemo, ...prev];
      safeStorage.setItem('resto_internalMemos', JSON.stringify(next));
      return next;
    });

    return { success: true, message: `Ucapan selamat ulang tahun untuk ${target.name} berhasil dipublikasikan via Memorandum Internal!` };
  };

  // Helpers
  const formatRupiah = (amount: number): string => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  const calculateRecipeHPP = (recipes: RecipeIngredient[]): number => {
    return recipes.reduce((sum, r) => sum + (r.amount * r.costPerUnit), 0);
  };

  // Add raw item
  const addRawItem = (itemData: Omit<RawItem, 'id' | 'lastUpdated'>) => {
    const newItem: RawItem = {
      ...itemData,
      id: `item-${Date.now()}`,
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setRawItems(prev => [newItem, ...prev]);

    // Update SO config as well if relevant
    setSoConfig(prev => [
      ...prev,
      {
        itemId: newItem.id,
        itemName: newItem.name,
        isDailyKitchen: newItem.location === 'Kitchen' || newItem.location === 'Chiller / Freezer',
        isDailyFloor: newItem.location === 'Floor / Bar',
        targetArea: newItem.location === 'Floor / Bar' ? 'Floor' : 'Kitchen',
      }
    ]);
  };

  // Bulk add / import raw items from Excel or batch
  const bulkAddRawItems = (itemsData: (Omit<RawItem, 'id' | 'lastUpdated'> & { id?: string })[]): { addedCount: number; updatedCount: number } => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let addedCount = 0;
    let updatedCount = 0;

    // Helper to calculate next available code if empty
    let nextNum = 1;
    rawItems.forEach(it => {
      const match = it.code?.match(/BB-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n >= nextNum) nextNum = n + 1;
      }
    });

    setRawItems(prevItems => {
      const updatedList = [...prevItems];
      const newSoConfigs: SOItemConfig[] = [];

      itemsData.forEach((item, index) => {
        let finalCode = item.code?.trim();
        if (!finalCode) {
          finalCode = `BB-${String(nextNum++).padStart(3, '0')}`;
        }

        // Check if item already exists by code or exact name (case-insensitive)
        const existingIdx = updatedList.findIndex(
          ex => (finalCode && ex.code?.toLowerCase() === finalCode.toLowerCase()) ||
                (ex.name?.trim().toLowerCase() === item.name?.trim().toLowerCase())
        );

        if (existingIdx >= 0) {
          updatedList[existingIdx] = {
            ...updatedList[existingIdx],
            name: item.name.trim(),
            code: finalCode,
            category: item.category,
            unit: item.unit,
            currentStock: Number(item.currentStock) || 0,
            minimumStock: Number(item.minimumStock) || 0,
            costPerUnit: Number(item.costPerUnit) || 0,
            location: item.location,
            lastUpdated: timestamp,
          };
          updatedCount++;
        } else {
          const newItem: RawItem = {
            id: item.id || `item-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
            code: finalCode,
            name: item.name.trim(),
            category: item.category,
            unit: item.unit,
            currentStock: Number(item.currentStock) || 0,
            minimumStock: Number(item.minimumStock) || 0,
            costPerUnit: Number(item.costPerUnit) || 0,
            location: item.location,
            lastUpdated: timestamp,
          };
          updatedList.unshift(newItem);
          addedCount++;

          newSoConfigs.push({
            itemId: newItem.id,
            itemName: newItem.name,
            isDailyKitchen: newItem.location === 'Kitchen' || newItem.location === 'Chiller / Freezer',
            isDailyFloor: newItem.location === 'Floor / Bar',
            targetArea: newItem.location === 'Floor / Bar' ? 'Floor' : 'Kitchen',
          });
        }
      });

      if (newSoConfigs.length > 0) {
        setSoConfig(prevSo => [...prevSo, ...newSoConfigs]);
      }

      return updatedList;
    });

    return { addedCount, updatedCount };
  };

  // Update raw item
  const updateRawItem = (id: string, updates: Partial<RawItem>) => {
    setRawItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...updates,
          lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      }
      return item;
    }));
  };

  // Add menu item
  const addMenuItem = (menuData: Omit<MenuItem, 'id'>) => {
    const newMenu: MenuItem = {
      ...menuData,
      id: `menu-${Date.now()}`,
    };
    setMenuItems(prev => [newMenu, ...prev]);
  };

  // Bulk add or update menu items (for Excel import)
  const bulkAddMenuItems = (newItems: (Omit<MenuItem, 'id'> & { id?: string })[]) => {
    let addedCount = 0;
    let updatedCount = 0;

    setMenuItems(prev => {
      const copy = [...prev];
      newItems.forEach(item => {
        const existingIdx = copy.findIndex(
          c => (item.code && c.code && c.code.trim().toLowerCase() === item.code.trim().toLowerCase()) ||
               (c.name && c.name.trim().toLowerCase() === item.name.trim().toLowerCase())
        );

        if (existingIdx >= 0) {
          copy[existingIdx] = {
            ...copy[existingIdx],
            ...item,
            recipes: copy[existingIdx].recipes?.length > 0 ? copy[existingIdx].recipes : (item.recipes || []),
            totalHPP: copy[existingIdx].recipes?.length > 0 ? copy[existingIdx].totalHPP : (item.totalHPP || 0),
          };
          updatedCount++;
        } else {
          copy.unshift({
            ...item,
            id: item.id || `menu-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            recipes: item.recipes || [],
            totalHPP: item.totalHPP || 0,
            marginPercentage: item.marginPercentage || 0,
            isActive: item.isActive !== undefined ? item.isActive : true,
          });
          addedCount++;
        }
      });
      return copy;
    });

    return { addedCount, updatedCount };
  };

  // Receiving barang dari supplier -> automatically adds to stock with unit conversion!
  const addReceivingRecord = (recordData: Omit<ReceivingRecord, 'id'>) => {
    const newRecord: ReceivingRecord = {
      ...recordData,
      id: `rcv-${Date.now()}`,
    };

    setReceivings(prev => [newRecord, ...prev]);

    // Automatically update stock and cost in raw items with unit conversion (e.g. KG -> gram)
    setRawItems(prevItems => {
      return prevItems.map(item => {
        const received = newRecord.items.find(r => r.itemId === item.id);
        if (received) {
          const convertedQty = convertQuantity(received.qty, received.unit, item.unit);
          const convertedCost = convertCostPerUnit(received.costPerUnit, received.unit, item.unit);
          const newStock = Number((item.currentStock + convertedQty).toFixed(2));
          // Moving average cost or latest cost update converted to base unit
          const newCost = convertedCost > 0 ? convertedCost : item.costPerUnit;
          return {
            ...item,
            currentStock: newStock,
            costPerUnit: newCost,
            lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
        }
        return item;
      });
    });
  };

  // Waste & Spoil -> automatically deducts stock and logs loss!
  const addWasteRecord = (wasteData: Omit<WasteSpoilRecord, 'id'>) => {
    const newRecord: WasteSpoilRecord = {
      ...wasteData,
      id: `wst-${Date.now()}`,
    };

    setWastes(prev => [newRecord, ...prev]);

    // Deduct stock from rawItems
    setRawItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === newRecord.itemId) {
          const remaining = Math.max(0, Number((item.currentStock - newRecord.qty).toFixed(2)));
          return {
            ...item,
            currentStock: remaining,
            lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
        }
        return item;
      });
    });
  };

  // Daily Sales Record -> automatically depletes stock based on menu recipes with unit conversion!
  const addDailySalesRecord = (salesData: Omit<DailySalesRecord, 'id'>) => {
    const newRecord: DailySalesRecord = {
      ...salesData,
      id: `sls-${Date.now()}`,
    };

    setSales(prev => [newRecord, ...prev]);

    // Calculate total ingredient deductions across all sold items
    const deductionsMap: { [itemId: string]: number } = {};

    newRecord.itemsSold.forEach(sold => {
      const menu = menuItems.find(m => m.id === sold.menuItemId);
      if (menu && menu.recipes) {
        menu.recipes.forEach(ing => {
          const raw = rawItems.find(r => r.id === ing.itemId);
          const targetUnit = raw ? raw.unit : ing.unit;
          const baseQty = ing.baseAmount !== undefined 
            ? ing.baseAmount 
            : convertQuantity(ing.amount, ing.unit, targetUnit);
          const totalIngUsed = baseQty * sold.qtySold;
          deductionsMap[ing.itemId] = (deductionsMap[ing.itemId] || 0) + totalIngUsed;
        });
      }
    });

    // Update raw items stock
    setRawItems(prevItems => {
      return prevItems.map(item => {
        const used = deductionsMap[item.id];
        if (used) {
          const newStock = Math.max(0, Number((item.currentStock - used).toFixed(2)));
          return {
            ...item,
            currentStock: newStock,
            lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
        }
        return item;
      });
    });
  };

  // Transfer in/out with unit conversion!
  const addStockTransfer = (transferData: Omit<StockTransferRecord, 'id'>) => {
    const newRecord: StockTransferRecord = {
      ...transferData,
      id: `trf-${Date.now()}`,
    };

    setTransfers(prev => [newRecord, ...prev]);

    // If transfer is OUT, deduct local stock immediately with unit conversion
    if (newRecord.type === 'out') {
      setRawItems(prevItems => {
        return prevItems.map(item => {
          const trfItem = newRecord.items.find(t => t.itemId === item.id);
          if (trfItem) {
            const convertedQty = convertQuantity(trfItem.qty, trfItem.unit, item.unit);
            const newStock = Math.max(0, Number((item.currentStock - convertedQty).toFixed(2)));
            return {
              ...item,
              currentStock: newStock,
              lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
            };
          }
          return item;
        });
      });
    }
  };

  const updateTransferStatus = (id: string, status: StockTransferRecord['status'], receivedBy?: string, receivingPhotoUrl?: string) => {
    setTransfers(prev => prev.map(t => {
      if (t.id === id) {
        // If an IN transfer is marked as Received, increase stock with unit conversion!
        if (status === 'Diterima' && t.type === 'in' && t.status !== 'Diterima') {
          setRawItems(prevItems => {
            return prevItems.map(item => {
              const trfItem = t.items.find(ti => ti.itemId === item.id);
              if (trfItem) {
                const convertedQty = convertQuantity(trfItem.qty, trfItem.unit, item.unit);
                return {
                  ...item,
                  currentStock: Number((item.currentStock + convertedQty).toFixed(2)),
                  lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
                };
              }
              return item;
            });
          });
        }
        return {
          ...t,
          status,
          receivedBy: receivedBy || t.receivedBy,
          receivingPhotoUrl: receivingPhotoUrl || t.receivingPhotoUrl,
        };
      }
      return t;
    }));
  };

  // Payment Methods Configuration (Manager)
  const addPaymentMethod = (methodData: Omit<PaymentMethodConfig, 'id'>) => {
    const newMethod: PaymentMethodConfig = {
      ...methodData,
      id: `pay-${Date.now()}`,
    };
    setPaymentMethods(prev => [...prev, newMethod]);
  };

  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethodConfig>) => {
    setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deletePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
  };

  // Printer Routing Configuration (Manager)
  const updatePrinterRouting = (newSetting: Partial<PrinterRoutingSetting>) => {
    setPrinterRouting(prev => ({
      ...prev,
      ...newSetting,
    }));
  };

  // Update Sold-Limit Menu (Can be updated by anyone in staff/kitchen/floor/manager)
  const updateMenuItemSoldLimit = (menuId: string, limit: number | null) => {
    setMenuItems(prev => prev.map(m => {
      if (m.id === menuId) {
        const isSoldOut = limit !== null && limit <= 0;
        return {
          ...m,
          soldLimit: limit,
          isSoldOut,
        };
      }
      return m;
    }));
  };

  // Table / POS Order -> deducts sold-limit & raw stock based on recipe, logs order
  const addTableOrder = (orderData: Omit<TableOrder, 'id' | 'orderNumber'>): TableOrder => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const orderNum = `ORD-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    
    const newOrder: TableOrder = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
    };

    setTableOrders(prev => [newOrder, ...prev]);

    // 1. Deduct sold limit if set
    setMenuItems(prev => prev.map(m => {
      const ordered = orderData.items.find(it => it.menuItemId === m.id);
      if (ordered && typeof m.soldLimit === 'number') {
        const newLimit = Math.max(0, m.soldLimit - ordered.qty);
        return {
          ...m,
          soldLimit: newLimit,
          isSoldOut: newLimit <= 0,
        };
      }
      return m;
    }));

    // 2. Deduct raw items stock based on recipe with unit conversions
    const deductionsMap: { [itemId: string]: number } = {};
    orderData.items.forEach(it => {
      const menu = menuItems.find(m => m.id === it.menuItemId);
      if (menu && menu.recipes) {
        menu.recipes.forEach(ing => {
          const raw = rawItems.find(r => r.id === ing.itemId);
          const targetUnit = raw ? raw.unit : ing.unit;
          const baseQty = ing.baseAmount !== undefined 
            ? ing.baseAmount 
            : convertQuantity(ing.amount, ing.unit, targetUnit);
          deductionsMap[ing.itemId] = (deductionsMap[ing.itemId] || 0) + (baseQty * it.qty);
        });
      }
    });

    if (Object.keys(deductionsMap).length > 0) {
      setRawItems(prevItems => prevItems.map(item => {
        const used = deductionsMap[item.id];
        if (used) {
          const newStock = Math.max(0, Number((item.currentStock - used).toFixed(2)));
          return {
            ...item,
            currentStock: newStock,
            lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
        }
        return item;
      }));
    }

    return newOrder;
  };

  const updateTableOrderStatus = (orderId: string, paymentStatus: 'Lunas' | 'Belum Bayar', paymentMethod?: string) => {
    setTableOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      paymentStatus, 
      paymentMethod: paymentMethod || o.paymentMethod 
    } : o));
  };

  // Manager Only: Cancel Active Bill & Restore Stock / Limits
  const cancelTableOrder = (orderId: string, reason: string): { success: boolean; message: string } => {
    const target = tableOrders.find(o => o.id === orderId);
    if (!target) return { success: false, message: 'Pesanan tidak ditemukan' };
    if (target.paymentStatus === 'Lunas') {
      return { success: false, message: 'Pesanan yang sudah Lunas tidak dapat dibatalkan langsung.' };
    }
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // 1. Restore sold limits
    setMenuItems(prev => prev.map(m => {
      const it = target.items.find(i => i.menuItemId === m.id);
      if (it && typeof m.soldLimit === 'number') {
        const restored = m.soldLimit + it.qty;
        return { ...m, soldLimit: restored, isSoldOut: false };
      }
      return m;
    }));

    // 2. Restore raw materials based on recipes with unit conversions
    const restoreMap: { [itemId: string]: number } = {};
    target.items.forEach(it => {
      const menu = menuItems.find(m => m.id === it.menuItemId);
      if (menu && menu.recipes) {
        menu.recipes.forEach(ing => {
          const raw = rawItems.find(r => r.id === ing.itemId);
          const targetUnit = raw ? raw.unit : ing.unit;
          const baseQty = ing.baseAmount !== undefined 
            ? ing.baseAmount 
            : convertQuantity(ing.amount, ing.unit, targetUnit);
          restoreMap[ing.itemId] = (restoreMap[ing.itemId] || 0) + (baseQty * it.qty);
        });
      }
    });

    if (Object.keys(restoreMap).length > 0) {
      setRawItems(prevItems => prevItems.map(item => {
        const added = restoreMap[item.id];
        if (added) {
          return {
            ...item,
            currentStock: Number((item.currentStock + added).toFixed(2)),
            lastUpdated: nowStr,
          };
        }
        return item;
      }));
    }

    // 3. Mark as cancelled
    setTableOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      isCancelled: true,
      cancelReason: reason || 'Dibatalkan oleh Manager',
      cancelledBy: currentUser.name,
      cancelledAt: nowStr,
    } : o));

    return { success: true, message: `Pesanan Meja ${target.tableNumber} (#${target.orderNumber}) berhasil dibatalkan & stok dikembalikan.` };
  };

  // Staff & Manager: Pindah Meja (Transfer entire bill to another table)
  const transferTable = (fromTable: string, toTable: string): { success: boolean; message: string } => {
    if (!fromTable || !toTable || fromTable === toTable) {
      return { success: false, message: 'Pilih meja asal dan meja tujuan yang berbeda.' };
    }
    const sourceOrder = tableOrders.find(o => o.tableNumber === fromTable && o.paymentStatus === 'Belum Bayar' && !o.isCancelled);
    if (!sourceOrder) {
      return { success: false, message: `Tidak ada tagihan aktif di Meja ${fromTable}.` };
    }
    const destOrder = tableOrders.find(o => o.tableNumber === toTable && o.paymentStatus === 'Belum Bayar' && !o.isCancelled);
    if (destOrder) {
      return { success: false, message: `Meja ${toTable} saat ini sedang terisi tagihan aktif. Silakan pilih meja lain yang kosong.` };
    }

    setTableOrders(prev => prev.map(o => o.id === sourceOrder.id ? { 
      ...o, 
      tableNumber: toTable,
      notes: `${o.notes || ''} [Pindah dari Meja ${fromTable}]`.trim()
    } : o));
    return { success: true, message: `Tagihan Meja ${fromTable} berhasil dipindahkan ke Meja ${toTable}.` };
  };

  // Staff & Manager: Pindah Item ke Meja Lain
  const transferTableItem = (fromTable: string, toTable: string, menuItemId: string, qty: number): { success: boolean; message: string } => {
    if (!fromTable || !toTable || fromTable === toTable) {
      return { success: false, message: 'Pilih meja asal dan meja tujuan yang berbeda.' };
    }
    const sourceOrder = tableOrders.find(o => o.tableNumber === fromTable && o.paymentStatus === 'Belum Bayar' && !o.isCancelled);
    if (!sourceOrder) return { success: false, message: `Tidak ada pesanan aktif di Meja ${fromTable}.` };

    const itemIdx = sourceOrder.items.findIndex(it => it.menuItemId === menuItemId);
    if (itemIdx === -1) return { success: false, message: 'Item tidak ditemukan pada meja asal.' };

    const sourceItem = sourceOrder.items[itemIdx];
    const moveQty = Math.min(qty, sourceItem.qty);
    if (moveQty <= 0) return { success: false, message: 'Jumlah item tidak valid.' };

    let updatedSourceItems = [...sourceOrder.items];
    if (sourceItem.qty === moveQty) {
      updatedSourceItems.splice(itemIdx, 1);
    } else {
      updatedSourceItems[itemIdx] = {
        ...sourceItem,
        qty: sourceItem.qty - moveQty,
        subtotal: (sourceItem.qty - moveQty) * sourceItem.price,
      };
    }

    const sourceSubtotal = updatedSourceItems.reduce((s, i) => s + i.subtotal, 0);
    const sourceTotalHPP = updatedSourceItems.reduce((s, i) => s + (i.qty * i.hpp), 0);

    const destOrder = tableOrders.find(o => o.tableNumber === toTable && o.paymentStatus === 'Belum Bayar' && !o.isCancelled);
    const transferredItem = {
      ...sourceItem,
      qty: moveQty,
      subtotal: moveQty * sourceItem.price,
    };

    setTableOrders(prev => {
      let next = [...prev];
      if (destOrder) {
        let destItems = [...destOrder.items];
        const existIdx = destItems.findIndex(i => i.menuItemId === menuItemId);
        if (existIdx >= 0) {
          destItems[existIdx] = {
            ...destItems[existIdx],
            qty: destItems[existIdx].qty + moveQty,
            subtotal: (destItems[existIdx].qty + moveQty) * destItems[existIdx].price,
          };
        } else {
          destItems.push(transferredItem);
        }
        const destSubtotal = destItems.reduce((s, i) => s + i.subtotal, 0);
        const destHPP = destItems.reduce((s, i) => s + (i.qty * i.hpp), 0);
        next = next.map(o => o.id === destOrder.id ? {
          ...o,
          items: destItems,
          subtotalAmount: destSubtotal,
          totalAmount: destSubtotal,
          totalHPP: destHPP,
        } : o);
      } else {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const newOrder: TableOrder = {
          id: `ord-${Date.now()}`,
          orderNumber: `ORD-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
          date: dateStr,
          time: now.toTimeString().slice(0, 5),
          dayOfWeek: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][now.getDay()],
          orderType: 'Dine In',
          tableNumber: toTable,
          pax: 2,
          items: [transferredItem],
          subtotalAmount: transferredItem.subtotal,
          totalAmount: transferredItem.subtotal,
          totalHPP: moveQty * sourceItem.hpp,
          paymentMethod: 'Tunai / Cash',
          paymentStatus: 'Belum Bayar',
          cashierName: currentUser.name,
          printerRouting: sourceOrder.printerRouting,
          notes: `Item dipindahkan dari Meja ${fromTable}`,
        };
        next.unshift(newOrder);
      }

      if (updatedSourceItems.length === 0) {
        next = next.map(o => o.id === sourceOrder.id ? {
          ...o,
          items: [],
          totalAmount: 0,
          subtotalAmount: 0,
          isCancelled: true,
          cancelReason: `Semua item dipindahkan ke Meja ${toTable}`,
        } : o);
      } else {
        next = next.map(o => o.id === sourceOrder.id ? {
          ...o,
          items: updatedSourceItems,
          subtotalAmount: sourceSubtotal,
          totalAmount: sourceSubtotal,
          totalHPP: sourceTotalHPP,
        } : o);
      }
      return next;
    });

    return { success: true, message: `Berhasil memindahkan ${moveQty}x ${sourceItem.menuItemName} ke Meja ${toTable}.` };
  };

  // Staff & Manager: Split Bill (Pisah pesanan sebagian ke meja baru / sub-bill)
  const splitTableOrder = (orderId: string, splitItems: { menuItemId: string; qty: number }[], newTableNumber?: string): { success: boolean; message: string; newOrder?: TableOrder } => {
    const origOrder = tableOrders.find(o => o.id === orderId);
    if (!origOrder) return { success: false, message: 'Pesanan tidak ditemukan' };
    if (origOrder.paymentStatus === 'Lunas') return { success: false, message: 'Pesanan sudah Lunas.' };

    const splitResultItems: TableOrderItem[] = [];
    const remainingItems: TableOrderItem[] = [];

    origOrder.items.forEach(it => {
      const splitReq = splitItems.find(s => s.menuItemId === it.menuItemId);
      if (splitReq && splitReq.qty > 0) {
        const takeQty = Math.min(splitReq.qty, it.qty);
        splitResultItems.push({
          ...it,
          qty: takeQty,
          subtotal: takeQty * it.price,
        });
        if (it.qty > takeQty) {
          remainingItems.push({
            ...it,
            qty: it.qty - takeQty,
            subtotal: (it.qty - takeQty) * it.price,
          });
        }
      } else {
        remainingItems.push({ ...it });
      }
    });

    if (splitResultItems.length === 0) {
      return { success: false, message: 'Pilih minimal satu item untuk di-split.' };
    }
    if (remainingItems.length === 0) {
      return { success: false, message: 'Semua item dipilih. Untuk memindahkan seluruh meja, gunakan Pindah Meja.' };
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const splitSubtotal = splitResultItems.reduce((s, i) => s + i.subtotal, 0);
    const splitHPP = splitResultItems.reduce((s, i) => s + (i.qty * (i.hpp || 0)), 0);
    const targetTable = newTableNumber || `${origOrder.tableNumber}-B`;

    const newSplitOrder: TableOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      date: dateStr,
      time: now.toTimeString().slice(0, 5),
      dayOfWeek: origOrder.dayOfWeek,
      orderType: origOrder.orderType,
      tableNumber: targetTable,
      pax: Math.max(1, Math.round(origOrder.pax / 2)),
      items: splitResultItems,
      subtotalAmount: splitSubtotal,
      totalAmount: splitSubtotal,
      totalHPP: splitHPP,
      paymentMethod: origOrder.paymentMethod,
      paymentStatus: 'Belum Bayar',
      cashierName: currentUser.name,
      customerName: origOrder.customerName,
      customerPhone: origOrder.customerPhone,
      printerRouting: origOrder.printerRouting,
      notes: `Split dari Meja ${origOrder.tableNumber} (#${origOrder.orderNumber})`,
    };

    const remSubtotal = remainingItems.reduce((s, i) => s + i.subtotal, 0);
    const remHPP = remainingItems.reduce((s, i) => s + (i.qty * (i.hpp || 0)), 0);

    setTableOrders(prev => [
      newSplitOrder,
      ...prev.map(o => o.id === origOrder.id ? {
        ...o,
        items: remainingItems,
        subtotalAmount: remSubtotal,
        totalAmount: remSubtotal,
        totalHPP: remHPP,
        notes: `${o.notes || ''} [Split ke ${targetTable}]`.trim(),
      } : o)
    ]);

    return {
      success: true,
      message: `Split bill sukses! Tagihan baru dibuat untuk Meja ${targetTable} (#${newSplitOrder.orderNumber}).`,
      newOrder: newSplitOrder
    };
  };

  // POS Promo Management (Manager Only)
  const addPromo = (promo: Omit<PosPromoConfig, 'id'>) => {
    setPromos(prev => [...prev, { ...promo, id: `promo-${Date.now()}` }]);
  };
  const updatePromo = (id: string, updates: Partial<PosPromoConfig>) => {
    setPromos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };
  const deletePromo = (id: string) => {
    setPromos(prev => prev.filter(p => p.id !== id));
  };

  // POS Tax & Service Charge (Manager Only)
  const updateTaxServiceConfig = (updates: Partial<PosTaxServiceConfig>) => {
    setTaxServiceConfig(prev => ({ ...prev, ...updates }));
  };

  // Suppliers Management
  const addSupplier = (supplier: Omit<SupplierInfo, 'id'>) => {
    setSuppliers(prev => [...prev, { ...supplier, id: `sup-${Date.now()}` }]);
  };
  const updateSupplier = (id: string, updates: Partial<SupplierInfo>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };
  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  // Outlet Management (Manager can add, rename, update)
  const addOutlet = (outletData: Omit<OutletInfo, 'id'>) => {
    const newOutlet: OutletInfo = {
      ...outletData,
      id: `out-${Date.now()}`,
    };
    setOutlets(prev => [...prev, newOutlet]);
  };

  const updateOutlet = (id: string, updates: Partial<OutletInfo>) => {
    setOutlets(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOutlet = (id: string) => {
    setOutlets(prev => prev.filter(o => o.id !== id));
  };

  // Purchasing Orders (Pengadaan & Bahan Baku Limit)
  const addPurchasingOrder = (orderData: Omit<PurchasingOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newPO: PurchasingOrder = {
      ...orderData,
      id: `po-req-${Date.now()}`,
      orderNumber: `REQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    setPurchasingOrders(prev => [newPO, ...prev]);
  };

  const updatePurchasingOrderStatus = (id: string, status: PurchasingStatus, notes?: string, supplierName?: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setPurchasingOrders(prev => prev.map(po => {
      if (po.id === id) {
        return {
          ...po,
          status,
          notes: notes !== undefined ? notes : po.notes,
          supplierName: supplierName !== undefined ? supplierName : po.supplierName,
          updatedAt: nowStr,
        };
      }
      return po;
    }));
  };

  // Internal Memorandum (Manager Memo with Attachments)
  const addInternalMemo = (memoData: Omit<InternalMemo, 'id' | 'memoNumber' | 'createdAt' | 'readBy'>) => {
    const now = new Date();
    const memoNum = `MEMO/${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;
    const newMemo: InternalMemo = {
      ...memoData,
      id: `memo-${Date.now()}`,
      memoNumber: memoNum,
      createdAt: now.toISOString().replace('T', ' ').slice(0, 16),
      readBy: [memoData.senderId],
    };
    setInternalMemos(prev => [newMemo, ...prev]);
  };

  const markMemoAsRead = (memoId: string, userId: string) => {
    setInternalMemos(prev => prev.map(m => {
      if (m.id === memoId && !m.readBy.includes(userId)) {
        return {
          ...m,
          readBy: [...m.readBy, userId],
        };
      }
      return m;
    }));
  };

  const deleteInternalMemo = (id: string) => {
    setInternalMemos(prev => prev.filter(m => m.id !== id));
  };

  // Petty cash in/out -> if linked to raw item, automatically adds to stock!
  const addPettyCashRecord = (recordData: Omit<PettyCashRecord, 'id'>) => {
    const newRecord: PettyCashRecord = {
      ...recordData,
      id: `pc-${Date.now()}`,
    };

    setPettyCash(prev => [newRecord, ...prev]);

    // If it's a raw material purchase with linked item, add to stock!
    if (newRecord.category === 'Pembelian Bahan Baku' && newRecord.linkedRawItem) {
      const { itemId, qtyAdded } = newRecord.linkedRawItem;
      setRawItems(prevItems => {
        return prevItems.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              currentStock: Number((item.currentStock + qtyAdded).toFixed(2)),
              lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
            };
          }
          return item;
        });
      });
    }
  };

  // Update SO config
  const updateSOConfig = (newConfig: SOItemConfig[]) => {
    setSoConfig(newConfig);
  };

  // Submit Stock Opname (Daily / Monthly)
  const submitStockOpname = (recordData: Omit<StockOpnameRecord, 'id'>) => {
    const newRecord: StockOpnameRecord = {
      ...recordData,
      id: `so-${Date.now()}`,
    };

    setSoRecords(prev => [newRecord, ...prev]);
  };

  // Approve Stock Opname -> reconcile physical stock into system stock
  const approveStockOpname = (id: string, managerNotes?: string) => {
    setSoRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        // Adjust system stock to physical count
        setRawItems(prevItems => {
          return prevItems.map(item => {
            const counted = rec.items.find(ci => ci.itemId === item.id);
            if (counted) {
              return {
                ...item,
                currentStock: counted.physicalStock,
                lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
              };
            }
            return item;
          });
        });

        return {
          ...rec,
          status: 'Approved',
          managerNotes: managerNotes || rec.managerNotes,
        };
      }
      return rec;
    }));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const login = (usernameOrEmail: string, password: string): { success: boolean; message: string } => {
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const matchedUser = users.find(u => 
      u.username.toLowerCase() === cleanInput || 
      u.email.toLowerCase() === cleanInput ||
      (u.employeeId && u.employeeId.toLowerCase() === cleanInput)
    );

    if (!matchedUser) {
      return { success: false, message: 'Username, Email, atau ID Karyawan tidak ditemukan.' };
    }

    if (matchedUser.password && matchedUser.password !== password) {
      return { success: false, message: 'Password salah. Silakan periksa kembali kata sandi Anda.' };
    }

    setCurrentUser(matchedUser);
    setIsAuthenticated(true);
    safeStorage.setItem('resto_currentUser', JSON.stringify(matchedUser));
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('resto_session_auth', 'true');
      }
    } catch {}

    // Maintain active tab if valid for this user, otherwise fallback to role default
    const savedLastTab = safeStorage.getItem('resto_active_tab') as NavigationTab | null;
    const allowedTabs = matchedUser.isMasterAdmin
      ? null
      : (rolePermissions[matchedUser.role] || ['dashboard']);

    if (savedLastTab && (matchedUser.isMasterAdmin || allowedTabs?.includes(savedLastTab))) {
      setActiveTab(savedLastTab);
    } else {
      // Direct user to the appropriate landing tab according to their role
      if (matchedUser.role === 'kasir') {
        setActiveTab('pos');
      } else if (matchedUser.role === 'staff') {
        setActiveTab('attendance');
      } else if (matchedUser.role === 'head_floor') {
        setActiveTab('pos');
      } else if (matchedUser.role === 'head_kitchen') {
        setActiveTab('inventory');
      } else if (matchedUser.role === 'purchasing') {
        setActiveTab('purchasing');
      } else {
        setActiveTab('dashboard');
      }
    }

    return { success: true, message: `Selamat datang, ${matchedUser.name}!` };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('resto_session_auth');
      }
    } catch {}
    safeStorage.removeItem('resto_isAuth');
    // We intentionally preserve resto_active_tab so staff/cashiers return directly to their POS/working view
  };

  const changeMyPassword = (oldPass: string, newPass: string): { success: boolean; message: string } => {
    if (currentUser.password && currentUser.password !== oldPass) {
      return { success: false, message: 'Password lama yang Anda masukkan tidak sesuai.' };
    }
    if (!newPass || newPass.trim().length < 3) {
      return { success: false, message: 'Password baru minimal 3 karakter.' };
    }

    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, password: newPass };
      }
      return u;
    });

    setUsers(updatedUsers);
    safeStorage.setItem('resto_users', JSON.stringify(updatedUsers));
    
    const updatedCurrent = { ...currentUser, password: newPass };
    setCurrentUser(updatedCurrent);
    safeStorage.setItem('resto_currentUser', JSON.stringify(updatedCurrent));

    return { success: true, message: 'Password berhasil diperbarui!' };
  };

  const adminResetPassword = (userId: string, newPass: string): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Admin Master / Manager yang memiliki wewenang reset password.' };
    }
    if (!newPass || newPass.trim().length < 3) {
      return { success: false, message: 'Password baru minimal 3 karakter.' };
    }

    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, password: newPass };
      }
      return u;
    });

    setUsers(updatedUsers);
    safeStorage.setItem('resto_users', JSON.stringify(updatedUsers));

    if (currentUser.id === userId) {
      const updatedCurrent = { ...currentUser, password: newPass };
      setCurrentUser(updatedCurrent);
      safeStorage.setItem('resto_currentUser', JSON.stringify(updatedCurrent));
    }

    return { success: true, message: 'Password user berhasil di-reset oleh Admin Master!' };
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    const foundRole = roles.find(r => r.id === newRole);
    const resolvedTitle = foundRole?.title || newRole;

    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { 
          ...u, 
          role: newRole,
          roleTitle: resolvedTitle
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    safeStorage.setItem('resto_users', JSON.stringify(updatedUsers));

    if (currentUser.id === userId) {
      const updatedCurrent = { 
        ...currentUser, 
        role: newRole,
        roleTitle: resolvedTitle
      };
      setCurrentUser(updatedCurrent);
      safeStorage.setItem('resto_currentUser', JSON.stringify(updatedCurrent));
    }
  };

  // User Management CRUD
  const createUser = (userData: Omit<User, 'id'>): { success: boolean; message: string; user?: User } => {
    const isAuthorized = currentUser.role === 'manager' || currentUser.isMasterAdmin || Boolean(rolePermissions[currentUser.role]?.includes('access_control'));
    if (!isAuthorized) {
      return { success: false, message: 'Hanya Admin Master / Manager yang memiliki wewenang menambah pengguna.' };
    }
    const cleanUsername = userData.username.trim().toLowerCase();
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: `Username "${cleanUsername}" sudah digunakan oleh staf lain.` };
    }

    const foundRole = roles.find(r => r.id === userData.role);
    const resolvedTitle = userData.roleTitle || foundRole?.title || 'General Operational Staff';
    const currentYear = new Date().getFullYear();
    const autoEmployeeId = userData.employeeId?.trim() || `EMP-${currentYear}-${String(users.length + 1).padStart(3, '0')}`;

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      employeeId: autoEmployeeId,
      contractStatus: userData.contractStatus || 'tetap',
      username: cleanUsername,
      roleTitle: resolvedTitle,
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      outletId: userData.outletId || 'out-1',
      isMasterAdmin: false,
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    safeStorage.setItem('resto_users', JSON.stringify(updatedUsers));
    return { success: true, message: `Pengguna baru "${newUser.name}" (@${newUser.username}, ID: ${newUser.employeeId}) berhasil ditambahkan!`, user: newUser };
  };

  const updateUser = (userId: string, updates: Partial<User>): { success: boolean; message: string } => {
    const isAuthorized = currentUser.role === 'manager' || currentUser.isMasterAdmin || Boolean(rolePermissions[currentUser.role]?.includes('access_control'));
    if (!isAuthorized) {
      return { success: false, message: 'Hanya Admin Master / Manager yang memiliki wewenang mengedit data pengguna.' };
    }
    if (updates.username) {
      const cleanUsername = updates.username.trim().toLowerCase();
      if (users.some(u => u.id !== userId && u.username.toLowerCase() === cleanUsername)) {
        return { success: false, message: `Username "${cleanUsername}" sudah digunakan oleh akun lain.` };
      }
    }

    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const nextRole = updates.role || u.role;
        const foundRole = roles.find(r => r.id === nextRole);
        return {
          ...u,
          ...updates,
          role: nextRole,
          roleTitle: updates.roleTitle || foundRole?.title || u.roleTitle,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    safeStorage.setItem('resto_users', JSON.stringify(updatedUsers));

    if (currentUser.id === userId) {
      const updatedCurrent = updatedUsers.find(u => u.id === userId)!;
      setCurrentUser(updatedCurrent);
      safeStorage.setItem('resto_currentUser', JSON.stringify(updatedCurrent));
    }

    return { success: true, message: 'Data pengguna & status HRD berhasil diperbarui!' };
  };

  const deleteUser = (userId: string): { success: boolean; message: string } => {
    const isAuthorized = currentUser.role === 'manager' || currentUser.isMasterAdmin || Boolean(rolePermissions[currentUser.role]?.includes('access_control'));
    if (!isAuthorized) {
      return { success: false, message: 'Hanya Admin Master / Manager yang dapat menghapus pengguna.' };
    }
    if (currentUser.id === userId) {
      return { success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login.' };
    }
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }
    if (target.isMasterAdmin) {
      return { success: false, message: 'Akun Master Admin utama tidak boleh dihapus demi keamanan operasional restoran.' };
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    safeStorage.setItem('resto_users', JSON.stringify(updatedUsers));
    return { success: true, message: `Pengguna ${target.name} (@${target.username}) berhasil dihapus.` };
  };

  const updateUserProfile = (updates: Partial<User>): { success: boolean; message: string } => {
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          ...updates,
          // Guard immutable keys during self profile edit
          id: u.id,
          username: u.username,
          role: u.role,
          roleTitle: u.roleTitle,
          isMasterAdmin: u.isMasterAdmin,
          employeeId: u.employeeId || updates.employeeId,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    safeStorage.setItem('resto_users', JSON.stringify(updatedUsers));

    const updatedCurrent = updatedUsers.find(u => u.id === currentUser.id)!;
    setCurrentUser(updatedCurrent);
    safeStorage.setItem('resto_currentUser', JSON.stringify(updatedCurrent));

    return { success: true, message: 'Biodata & data profil HRD Anda berhasil disimpan!' };
  };

  // Manager / Admin Edit & Delete for Staff Transaction Inputs
  const deleteReceivingRecord = (id: string): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat menghapus catatan penerimaan barang.' };
    }
    const target = receivings.find(r => r.id === id);
    if (!target) return { success: false, message: 'Data tidak ditemukan.' };

    setRawItems(prevItems => prevItems.map(item => {
      const received = target.items.find(r => r.itemId === item.id);
      if (received) {
        const convertedQty = convertQuantity(received.qty, received.unit, item.unit);
        const remaining = Math.max(0, Number((item.currentStock - convertedQty).toFixed(2)));
        return { ...item, currentStock: remaining, lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16) };
      }
      return item;
    }));

    setReceivings(prev => {
      const next = prev.filter(r => r.id !== id);
      safeStorage.setItem('resto_receivings', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Catatan penerimaan barang berhasil dihapus dan stok dikembalikan.' };
  };

  const updateReceivingRecord = (id: string, updates: Partial<ReceivingRecord>): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat mengedit penerimaan barang.' };
    }
    const target = receivings.find(r => r.id === id);
    if (!target) return { success: false, message: 'Data tidak ditemukan.' };

    if (updates.items) {
      const oldItemMap = new Map(target.items.map(i => {
        const raw = rawItems.find(r => r.id === i.itemId);
        return [i.itemId, convertQuantity(i.qty, i.unit, raw ? raw.unit : i.unit)];
      }));
      const newItemMap = new Map(updates.items.map(i => {
        const raw = rawItems.find(r => r.id === i.itemId);
        return [i.itemId, convertQuantity(i.qty, i.unit, raw ? raw.unit : i.unit)];
      }));
      const allItemIds = new Set([...oldItemMap.keys(), ...newItemMap.keys()]);

      setRawItems(prevItems => prevItems.map(item => {
        if (allItemIds.has(item.id)) {
          const oldQty = Number(oldItemMap.get(item.id) || 0);
          const newQty = Number(newItemMap.get(item.id) || 0);
          const diff = newQty - oldQty;
          const adjusted = Math.max(0, Number((item.currentStock + diff).toFixed(2)));
          return { ...item, currentStock: adjusted, lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16) };
        }
        return item;
      }));
    }

    setReceivings(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      safeStorage.setItem('resto_receivings', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Data penerimaan barang berhasil diperbarui.' };
  };

  const deleteWasteRecord = (id: string): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat menghapus catatan waste.' };
    }
    const target = wastes.find(w => w.id === id);
    if (!target) return { success: false, message: 'Data tidak ditemukan.' };

    setRawItems(prevItems => prevItems.map(item => {
      if (item.id === target.itemId) {
        const restored = Number((item.currentStock + target.qty).toFixed(2));
        return { ...item, currentStock: restored, lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16) };
      }
      return item;
    }));

    setWastes(prev => {
      const next = prev.filter(w => w.id !== id);
      safeStorage.setItem('resto_wastes', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Catatan waste dihapus dan kuantitas stok dikembalikan ke sistem.' };
  };

  const updateWasteRecord = (id: string, updates: Partial<WasteSpoilRecord>): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat mengedit catatan waste.' };
    }
    const target = wastes.find(w => w.id === id);
    if (!target) return { success: false, message: 'Data tidak ditemukan.' };

    const oldQty = target.qty;
    const newQty = updates.qty !== undefined ? updates.qty : oldQty;
    const qtyDiff = newQty - oldQty;

    if (qtyDiff !== 0) {
      setRawItems(prevItems => prevItems.map(item => {
        if (item.id === target.itemId) {
          const adjusted = Math.max(0, Number((item.currentStock - qtyDiff).toFixed(2)));
          return { ...item, currentStock: adjusted, lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16) };
        }
        return item;
      }));
    }

    setWastes(prev => {
      const next = prev.map(w => w.id === id ? { ...w, ...updates } : w);
      safeStorage.setItem('resto_wastes', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Catatan waste & spoil berhasil diperbarui.' };
  };

  const deleteDailySalesRecord = (id: string): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat menghapus catatan penjualan.' };
    }
    const target = sales.find(s => s.id === id);
    if (!target) return { success: false, message: 'Data tidak ditemukan.' };

    const deductionsMap: { [itemId: string]: number } = {};
    target.itemsSold.forEach(sold => {
      const menu = menuItems.find(m => m.id === sold.menuItemId);
      if (menu && menu.recipes) {
        menu.recipes.forEach(ing => {
          const raw = rawItems.find(r => r.id === ing.itemId);
          const targetUnit = raw ? raw.unit : ing.unit;
          const baseQty = ing.baseAmount !== undefined 
            ? ing.baseAmount 
            : convertQuantity(ing.amount, ing.unit, targetUnit);
          deductionsMap[ing.itemId] = (deductionsMap[ing.itemId] || 0) + (baseQty * sold.qtySold);
        });
      }
    });

    setRawItems(prevItems => prevItems.map(item => {
      const restored = deductionsMap[item.id];
      if (restored) {
        return { ...item, currentStock: Number((item.currentStock + restored).toFixed(2)), lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16) };
      }
      return item;
    }));

    setSales(prev => {
      const next = prev.filter(s => s.id !== id);
      safeStorage.setItem('resto_sales', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Catatan penjualan berhasil dibatalkan dan bahan baku dikembalikan ke inventaris.' };
  };

  const updateDailySalesRecord = (id: string, updates: Partial<DailySalesRecord>): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat mengedit catatan penjualan.' };
    }
    setSales(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      safeStorage.setItem('resto_sales', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Catatan penjualan berhasil diperbarui.' };
  };

  const deleteStockTransfer = (id: string): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat menghapus transfer stok.' };
    }
    const target = transfers.find(t => t.id === id);
    if (!target) return { success: false, message: 'Data tidak ditemukan.' };

    if (target.type === 'out') {
      setRawItems(prevItems => prevItems.map(item => {
        const trfItem = target.items.find(t => t.itemId === item.id);
        if (trfItem) {
          const convertedQty = convertQuantity(trfItem.qty, trfItem.unit, item.unit);
          return { ...item, currentStock: Number((item.currentStock + convertedQty).toFixed(2)), lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16) };
        }
        return item;
      }));
    }

    setTransfers(prev => {
      const next = prev.filter(t => t.id !== id);
      safeStorage.setItem('resto_transfers', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Data transfer antar cabang berhasil dihapus.' };
  };

  const updateStockTransfer = (id: string, updates: Partial<StockTransferRecord>): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat mengedit data transfer.' };
    }
    setTransfers(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      safeStorage.setItem('resto_transfers', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Data transfer stok berhasil diperbarui.' };
  };

  const deletePettyCashRecord = (id: string): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat menghapus transaksi kas kecil.' };
    }
    const target = pettyCash.find(p => p.id === id);
    if (!target) return { success: false, message: 'Data tidak ditemukan.' };

    if (target.linkedRawItem) {
      const { itemId, qtyAdded } = target.linkedRawItem;
      setRawItems(prevItems => prevItems.map(item => {
        if (item.id === itemId) {
          return { ...item, currentStock: Math.max(0, Number((item.currentStock - qtyAdded).toFixed(2))), lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16) };
        }
        return item;
      }));
    }

    setPettyCash(prev => {
      const next = prev.filter(p => p.id !== id);
      safeStorage.setItem('resto_pettyCash', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Transaksi petty cash berhasil dihapus dan saldo disesuaikan.' };
  };

  const updatePettyCashRecord = (id: string, updates: Partial<PettyCashRecord>): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat mengedit transaksi kas kecil.' };
    }
    setPettyCash(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      safeStorage.setItem('resto_pettyCash', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Transaksi kas kecil berhasil diperbarui.' };
  };

  const deleteStockOpname = (id: string): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat menghapus arsip Stock Opname.' };
    }
    setSoRecords(prev => {
      const next = prev.filter(so => so.id !== id);
      safeStorage.setItem('resto_soRecords', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Arsip catatan Stock Opname berhasil dihapus.' };
  };

  const deleteRawItem = (id: string): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat menghapus bahan baku.' };
    }
    const target = rawItems.find(r => r.id === id);
    if (!target) return { success: false, message: 'Item bahan baku tidak ditemukan.' };

    const usedInMenus = menuItems.filter(m => m.recipes && m.recipes.some(rc => rc.itemId === id));
    if (usedInMenus.length > 0) {
      const menuNames = usedInMenus.map(m => m.name).slice(0, 3).join(', ');
      return { 
        success: false, 
        message: `Bahan baku "${target.name}" masih digunakan dalam resep menu: ${menuNames}${usedInMenus.length > 3 ? '...' : ''}. Hapus bahan dari resep menu terkait terlebih dahulu!` 
      };
    }

    setRawItems(prev => {
      const next = prev.filter(r => r.id !== id);
      safeStorage.setItem('resto_rawItems', JSON.stringify(next));
      return next;
    });
    return { success: true, message: `Bahan baku "${target.name}" yang tidak terpakai berhasil dihapus dari inventaris.` };
  };

  const deleteMenuItem = (id: string): { success: boolean; message: string } => {
    const isAuthorized = currentUser.role === 'manager' || currentUser.isMasterAdmin || Boolean(rolePermissions[currentUser.role]?.includes('recipes'));
    if (!isAuthorized) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat menghapus menu restoran.' };
    }
    const target = menuItems.find(m => m.id === id);
    if (!target) return { success: false, message: 'Menu tidak ditemukan.' };

    setMenuItems(prev => {
      const next = prev.filter(m => m.id !== id);
      safeStorage.setItem('resto_menuItems', JSON.stringify(next));
      return next;
    });
    return { success: true, message: `Menu "${target.name}" berhasil dihapus dari daftar menu.` };
  };

  const addPosTable = (tableData: Omit<PosTableConfig, 'id'>): { success: boolean; message: string; table?: PosTableConfig } => {
    const isAuthorized = currentUser.role === 'manager' || currentUser.isMasterAdmin;
    if (!isAuthorized) {
      return { success: false, message: 'Hanya Manager / Master Admin yang berhak mengelola meja.' };
    }
    const cleanNum = tableData.number.trim();
    if (!cleanNum) {
      return { success: false, message: 'Nomor meja wajib diisi.' };
    }
    if (restoTables.some(t => t.number.toLowerCase() === cleanNum.toLowerCase())) {
      return { success: false, message: `Nomor meja "${cleanNum}" sudah digunakan.` };
    }

    const newTbl: PosTableConfig = {
      ...tableData,
      id: `tbl-${Date.now()}`,
      number: cleanNum,
      name: tableData.name.trim() || `Meja ${cleanNum}`,
      capacity: Number(tableData.capacity) || 4,
      area: tableData.area || 'Indoor',
      isActive: tableData.isActive !== false,
      notes: tableData.notes?.trim() || ''
    };

    setRestoTables(prev => [...prev, newTbl]);
    return { success: true, message: `Meja "${newTbl.name}" (No. ${newTbl.number}) berhasil ditambahkan!`, table: newTbl };
  };

  const updatePosTable = (id: string, updates: Partial<PosTableConfig>): { success: boolean; message: string } => {
    const isAuthorized = currentUser.role === 'manager' || currentUser.isMasterAdmin;
    if (!isAuthorized) {
      return { success: false, message: 'Hanya Manager / Master Admin yang berhak mengubah konfigurasi meja.' };
    }
    if (updates.number) {
      const cleanNum = updates.number.trim();
      if (restoTables.some(t => t.id !== id && t.number.toLowerCase() === cleanNum.toLowerCase())) {
        return { success: false, message: `Nomor meja "${cleanNum}" sudah digunakan oleh meja lain.` };
      }
    }

    setRestoTables(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...updates,
          number: updates.number ? updates.number.trim() : t.number,
          name: updates.name ? updates.name.trim() : t.name,
        };
      }
      return t;
    }));

    return { success: true, message: 'Data nama dan nomor meja POS berhasil diperbarui!' };
  };

  const deletePosTable = (id: string): { success: boolean; message: string } => {
    const isAuthorized = currentUser.role === 'manager' || currentUser.isMasterAdmin;
    if (!isAuthorized) {
      return { success: false, message: 'Hanya Manager / Master Admin yang berhak menghapus meja.' };
    }
    const target = restoTables.find(t => t.id === id);
    if (!target) return { success: false, message: 'Meja tidak ditemukan.' };

    const hasActiveOrder = tableOrders.some(o => 
      (o.tableNumber === target.number || o.tableNumber === target.name) && 
      o.paymentStatus === 'Belum Bayar' && 
      !o.isCancelled
    );
    if (hasActiveOrder) {
      return { 
        success: false, 
        message: `Meja ${target.number} masih memiliki pesanan aktif yang belum dibayar! Selesaikan atau batalkan pesanan terlebih dahulu.` 
      };
    }

    setRestoTables(prev => prev.filter(t => t.id !== id));
    return { success: true, message: `Meja ${target.number} (${target.name}) berhasil dihapus.` };
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>): { success: boolean; message: string } => {
    setMenuItems(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      safeStorage.setItem('resto_menuItems', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Menu berhasil diperbarui.' };
  };

  const updateTableOrder = (orderId: string, updates: Partial<TableOrder>): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat mengedit pesanan meja.' };
    }
    setTableOrders(prev => {
      const next = prev.map(o => o.id === orderId ? { ...o, ...updates } : o);
      safeStorage.setItem('resto_tableOrders', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Pesanan meja POS berhasil diperbarui oleh Manager.' };
  };

  const deleteTableOrder = (orderId: string): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat menghapus transaksi pesanan POS.' };
    }
    setTableOrders(prev => {
      const next = prev.filter(o => o.id !== orderId);
      safeStorage.setItem('resto_tableOrders', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Transaksi POS berhasil dihapus oleh Manager.' };
  };

  const updatePurchasingOrder = (id: string, updates: Partial<PurchasingOrder>): { success: boolean; message: string } => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setPurchasingOrders(prev => {
      const next = prev.map(po => po.id === id ? { ...po, ...updates, updatedAt: nowStr } : po);
      safeStorage.setItem('resto_purchasingOrders', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Purchasing order berhasil diperbarui.' };
  };

  const deletePurchasingOrder = (id: string): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang dapat menghapus data purchasing order.' };
    }
    setPurchasingOrders(prev => {
      const next = prev.filter(po => po.id !== id);
      safeStorage.setItem('resto_purchasingOrders', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Purchasing order berhasil dihapus.' };
  };

  const updateInternalMemo = (id: string, updates: Partial<InternalMemo>): { success: boolean; message: string } => {
    setInternalMemos(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      safeStorage.setItem('resto_internalMemos', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Memorandum berhasil diperbarui.' };
  };

  const updateStockOpnameRecord = (id: string, updates: Partial<StockOpnameRecord>): { success: boolean; message: string } => {
    setSoRecords(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      safeStorage.setItem('resto_soRecords', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Hasil Stock Opname berhasil diperbarui.' };
  };

  // Variable Costs CRUD (Biaya Operasional Variabel: Listrik, Air, Gas, dll)
  const addVariableCost = (costData: Omit<VariableCostRecord, 'id' | 'createdAt'>): { success: boolean; message: string } => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newRecord: VariableCostRecord = {
      ...costData,
      id: `vc-${Date.now()}`,
      createdAt: nowStr,
    };
    setVariableCosts(prev => {
      const next = [newRecord, ...prev];
      safeStorage.setItem('resto_variableCosts', JSON.stringify(next));
      return next;
    });
    return { success: true, message: `Biaya variabel "${newRecord.title}" (${formatRupiah(newRecord.amount)}) berhasil dicatat!` };
  };

  const updateVariableCost = (id: string, updates: Partial<VariableCostRecord>): { success: boolean; message: string } => {
    setVariableCosts(prev => {
      const next = prev.map(vc => vc.id === id ? { ...vc, ...updates } : vc);
      safeStorage.setItem('resto_variableCosts', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Data biaya variabel berhasil diperbarui!' };
  };

  const deleteVariableCost = (id: string): { success: boolean; message: string } => {
    setVariableCosts(prev => {
      const next = prev.filter(vc => vc.id !== id);
      safeStorage.setItem('resto_variableCosts', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Data biaya variabel berhasil dihapus.' };
  };

  // Employee Shift Schedule (Penjadwalan Kerja)
  const addShiftSchedule = (schedData: Omit<EmployeeShiftSchedule, 'id' | 'updatedAt'>): { success: boolean; message: string } => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newSched: EmployeeShiftSchedule = {
      ...schedData,
      id: `sched-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      updatedAt: nowStr,
    };
    setShiftSchedules(prev => {
      const existingIdx = prev.findIndex(s => s.userId === schedData.userId && s.date === schedData.date);
      let next: EmployeeShiftSchedule[];
      if (existingIdx >= 0) {
        next = prev.map((s, idx) => idx === existingIdx ? newSched : s);
      } else {
        next = [...prev, newSched];
      }
      safeStorage.setItem('resto_shiftSchedules', JSON.stringify(next));
      return next;
    });
    return { success: true, message: `Jadwal shift untuk ${schedData.employeeName} (${schedData.date}) berhasil disimpan!` };
  };

  const updateShiftSchedule = (id: string, updates: Partial<EmployeeShiftSchedule>): { success: boolean; message: string } => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setShiftSchedules(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: nowStr } : s);
      safeStorage.setItem('resto_shiftSchedules', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Jadwal shift berhasil diperbarui.' };
  };

  const deleteShiftSchedule = (id: string): { success: boolean; message: string } => {
    setShiftSchedules(prev => {
      const next = prev.filter(s => s.id !== id);
      safeStorage.setItem('resto_shiftSchedules', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Jadwal shift berhasil dihapus.' };
  };

  const bulkAssignShiftSchedules = (schedulesData: Omit<EmployeeShiftSchedule, 'id' | 'updatedAt'>[]): { success: boolean; message: string } => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setShiftSchedules(prev => {
      const map = new Map<string, EmployeeShiftSchedule>();
      prev.forEach(s => map.set(`${s.userId}_${s.date}`, s));
      schedulesData.forEach(s => {
        const key = `${s.userId}_${s.date}`;
        map.set(key, {
          ...s,
          id: map.has(key) ? map.get(key)!.id : `sched-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          updatedAt: nowStr,
        });
      });
      const next = Array.from(map.values());
      safeStorage.setItem('resto_shiftSchedules', JSON.stringify(next));
      return next;
    });
    return { success: true, message: `${schedulesData.length} jadwal kerja berhasil diterapkan!` };
  };

  // Expiring Contract Employees Memo (< 2 bulan / <= 60 hari)
  const expiringContractEmployees = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return users
      .filter(u => u.contractStatus === 'kontrak' && u.contractEndDate)
      .map(u => {
        const end = new Date(u.contractEndDate!);
        const diffTime = end.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { user: u, daysRemaining };
      })
      .filter(item => item.daysRemaining >= 0 && item.daysRemaining <= 60);
  }, [users]);

  const updateRolePermissions = (role: UserRole, allowedTabs: NavigationTab[]) => {
    const safeTabs = Array.from(new Set(['dashboard', ...allowedTabs])) as NavigationTab[];
    setRolePermissions(prev => {
      const updated: RoleMenuPermissions = {
        ...prev,
        [role]: safeTabs,
      };
      if (!updated.manager.includes('access_control')) {
        updated.manager.push('access_control');
      }
      safeStorage.setItem('resto_permissions', JSON.stringify(updated));
      return updated;
    });
  };

  const updateAllRolePermissions = (newPermissions: RoleMenuPermissions) => {
    const sanitized: RoleMenuPermissions = { ...newPermissions };
    sanitized.manager = Array.from(new Set(['dashboard', 'access_control', ...(newPermissions.manager || [])])) as NavigationTab[];
    Object.keys(sanitized).forEach(k => {
      if (!sanitized[k].includes('dashboard')) {
        sanitized[k] = ['dashboard', ...sanitized[k]];
      }
    });
    setRolePermissions(sanitized);
    safeStorage.setItem('resto_permissions', JSON.stringify(sanitized));
  };

  const resetRolePermissionsToDefault = () => {
    setRolePermissions(INITIAL_ROLE_PERMISSIONS);
    safeStorage.setItem('resto_permissions', JSON.stringify(INITIAL_ROLE_PERMISSIONS));
  };

  // Custom Roles Management
  const addRole = (
    newRoleData: Omit<RoleDefinition, 'isSystem'>, 
    initialTabs?: NavigationTab[]
  ): { success: boolean; message: string; role?: RoleDefinition } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Admin Master / Manager yang berwenang membuat peran baru.' };
    }

    const cleanTitle = newRoleData.title.trim();
    if (!cleanTitle) {
      return { success: false, message: 'Nama peran / jabatan wajib diisi.' };
    }

    let roleId = newRoleData.id?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!roleId) {
      roleId = cleanTitle.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }

    if (roles.some(r => r.id === roleId)) {
      return { success: false, message: `ID peran "${roleId}" sudah ada. Silakan gunakan nama atau ID lain.` };
    }

    const newRole: RoleDefinition = {
      ...newRoleData,
      id: roleId,
      title: cleanTitle,
      description: newRoleData.description?.trim() || `Peran operasional ${cleanTitle}`,
      department: newRoleData.department?.trim() || 'Operasional',
      badgeColor: newRoleData.badgeColor || 'indigo',
      isSystem: false,
      createdAt: new Date().toISOString(),
    };

    const updatedRoles = [...roles, newRole];
    setRoles(updatedRoles);
    safeStorage.setItem('resto_roles', JSON.stringify(updatedRoles));

    // Initialize permissions for the new role (dashboard is always included)
    const allowed = Array.from(new Set(['dashboard', ...(initialTabs || ['dashboard', 'pos'])])) as NavigationTab[];
    const updatedPermissions: RoleMenuPermissions = {
      ...rolePermissions,
      [roleId]: allowed,
    };
    setRolePermissions(updatedPermissions);
    safeStorage.setItem('resto_permissions', JSON.stringify(updatedPermissions));

    return { 
      success: true, 
      message: `Peran baru "${newRole.title}" berhasil dibuat dan siap diatur di Matriks Hak Akses!`,
      role: newRole 
    };
  };

  const updateRole = (
    roleId: string, 
    updates: Partial<RoleDefinition>
  ): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Admin Master / Manager yang berwenang mengubah peran sistem.' };
    }

    const existingRole = roles.find(r => r.id === roleId);
    if (!existingRole) {
      return { success: false, message: 'Peran tidak ditemukan di sistem.' };
    }

    const updatedRoles = roles.map(r => {
      if (r.id === roleId) {
        return {
          ...r,
          ...updates,
          id: r.id,
          isSystem: r.isSystem,
          title: updates.title?.trim() || r.title,
        };
      }
      return r;
    });

    setRoles(updatedRoles);
    safeStorage.setItem('resto_roles', JSON.stringify(updatedRoles));

    if (updates.title && updates.title.trim() !== existingRole.title) {
      const newTitle = updates.title.trim();
      const updatedUsers = users.map(u => {
        if (u.role === roleId) {
          return { ...u, roleTitle: newTitle };
        }
        return u;
      });
      setUsers(updatedUsers);
      safeStorage.setItem('resto_users', JSON.stringify(updatedUsers));

      if (currentUser.role === roleId) {
        const updatedCurrent = { ...currentUser, roleTitle: newTitle };
        setCurrentUser(updatedCurrent);
        safeStorage.setItem('resto_currentUser', JSON.stringify(updatedCurrent));
      }
    }

    return { success: true, message: `Peran "${existingRole.title}" berhasil diperbarui!` };
  };

  const deleteRole = (
    roleId: string, 
    fallbackRoleId: string = 'staff'
  ): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Admin Master / Manager yang berwenang menghapus peran.' };
    }

    const target = roles.find(r => r.id === roleId);
    if (!target) {
      return { success: false, message: 'Peran tidak ditemukan.' };
    }

    if (target.isSystem || roleId === 'manager') {
      return { success: false, message: 'Peran bawaan sistem inti dilindungi dan tidak dapat dihapus.' };
    }

    const fallbackRoleObj = roles.find(r => r.id === fallbackRoleId) || roles.find(r => r.id === 'staff') || roles[0];
    
    // Reassign any users who had this role
    const updatedUsers = users.map(u => {
      if (u.role === roleId) {
        return {
          ...u,
          role: fallbackRoleObj.id,
          roleTitle: fallbackRoleObj.title,
        };
      }
      return u;
    });
    setUsers(updatedUsers);
    safeStorage.setItem('resto_users', JSON.stringify(updatedUsers));

    if (currentUser.role === roleId) {
      const updatedCurrent = {
        ...currentUser,
        role: fallbackRoleObj.id,
        roleTitle: fallbackRoleObj.title,
      };
      setCurrentUser(updatedCurrent);
      safeStorage.setItem('resto_currentUser', JSON.stringify(updatedCurrent));
    }

    const updatedRoles = roles.filter(r => r.id !== roleId);
    setRoles(updatedRoles);
    safeStorage.setItem('resto_roles', JSON.stringify(updatedRoles));

    const nextPerms = { ...rolePermissions };
    delete nextPerms[roleId];
    setRolePermissions(nextPerms);
    safeStorage.setItem('resto_permissions', JSON.stringify(nextPerms));

    return { 
      success: true, 
      message: `Peran "${target.title}" berhasil dihapus. Staf terkait dialihkan ke peran "${fallbackRoleObj.title}".` 
    };
  };

  const resetRolesToDefault = () => {
    setRoles(INITIAL_ROLES);
    safeStorage.setItem('resto_roles', JSON.stringify(INITIAL_ROLES));
  };

  const resetAllDataToZero = () => {
    // 1. Reset all raw items stock to 0
    const zeroStockItems = rawItems.map(item => ({
      ...item,
      currentStock: 0,
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
    }));
    setRawItems(zeroStockItems);
    safeStorage.setItem('resto_rawItems', JSON.stringify(zeroStockItems));

    // 2. Clear all operational records
    setReceivings([]);
    safeStorage.setItem('resto_receivings', JSON.stringify([]));

    setWastes([]);
    safeStorage.setItem('resto_wastes', JSON.stringify([]));

    setSales([]);
    safeStorage.setItem('resto_sales', JSON.stringify([]));

    setTableOrders([]);
    safeStorage.setItem('resto_tableOrders', JSON.stringify([]));

    setTransfers([]);
    safeStorage.setItem('resto_transfers', JSON.stringify([]));

    setPettyCash([]);
    safeStorage.setItem('resto_pettyCash', JSON.stringify([]));

    setSoRecords([]);
    safeStorage.setItem('resto_soRecords', JSON.stringify([]));

    setNotifications([]);
    setClosingReports([]);
    safeStorage.setItem('resto_closing_reports', JSON.stringify([]));
    setAttendanceRecords([]);
    safeStorage.setItem('resto_attendance_records', JSON.stringify([]));
    setActiveTab('dashboard');
  };

  const resetSalesDataOnly = (): { success: boolean; message: string } => {
    if (currentUser.role !== 'manager' && !currentUser.isMasterAdmin) {
      return { success: false, message: 'Hanya Manager / Master Admin yang berwenang mereset seluruh data penjualan.' };
    }
    setSales([]);
    safeStorage.setItem('resto_sales', JSON.stringify([]));

    setTableOrders([]);
    safeStorage.setItem('resto_tableOrders', JSON.stringify([]));

    setClosingReports([]);
    safeStorage.setItem('resto_closing_reports', JSON.stringify([]));

    return { 
      success: true, 
      message: 'Seluruh riwayat transaksi kasir (POS) dan laporan closing shift/hari berhasil direset menjadi kosong!' 
    };
  };

  const submitClosingReport = (reportData: Omit<PosClosingReport, 'id' | 'createdAt'>): { success: boolean; message: string; report: PosClosingReport } => {
    const reportId = reportData.closingType === 'day' 
      ? `CLS-DAY-${Date.now()}` 
      : `CLS-SH-${Date.now()}`;
    const newReport: PosClosingReport = {
      ...reportData,
      id: reportId,
      createdAt: new Date().toLocaleString('sv-SE'),
    };

    setClosingReports(prev => {
      const next = [newReport, ...prev];
      safeStorage.setItem('resto_closing_reports', JSON.stringify(next));
      return next;
    });

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        type: 'low_stock',
        title: `Laporan Closing ${newReport.closingType === 'day' ? 'End of Day' : 'End of Shift'} Tersimpan`,
        message: `${newReport.shiftName} oleh ${newReport.cashierName} (Total: ${formatRupiah(newReport.grandTotal || (newReport.metrics?.grandTotal ?? 0))})`,
        timestamp: 'Baru saja',
        isRead: false,
      },
      ...prev,
    ]);

    return {
      success: true,
      message: `Laporan Closing ${newReport.closingType === 'day' ? 'End of Day' : 'End of Shift'} berhasil dieksekusi dan diarsipkan!`,
      report: newReport,
    };
  };

  const deleteClosingReport = (id: string): { success: boolean; message: string } => {
    setClosingReports(prev => {
      const next = prev.filter(r => r.id !== id);
      safeStorage.setItem('resto_closing_reports', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Laporan Closing berhasil dihapus.' };
  };

  const submitAttendance = (data: Omit<AttendanceRecord, 'id' | 'createdAt'>): { success: boolean; message: string; record: AttendanceRecord } => {
    const existingIndex = attendanceRecords.findIndex(r => r.userId === data.userId && r.date === data.date);
    
    let savedRecord: AttendanceRecord;
    if (existingIndex >= 0) {
      const existing = attendanceRecords[existingIndex];
      savedRecord = {
        ...existing,
        ...data,
        updatedAt: new Date().toLocaleString('sv-SE'),
      };
      if (savedRecord.clockInTime && savedRecord.clockOutTime) {
        const [inH, inM] = savedRecord.clockInTime.split(':').map(Number);
        const [outH, outM] = savedRecord.clockOutTime.split(':').map(Number);
        const inMinutes = inH * 60 + inM;
        const outMinutes = outH * 60 + outM;
        const duration = outMinutes >= inMinutes ? outMinutes - inMinutes : (outMinutes + 24 * 60) - inMinutes;
        savedRecord.workDurationMinutes = duration;
      }

      setAttendanceRecords(prev => {
        const next = [...prev];
        next[existingIndex] = savedRecord;
        safeStorage.setItem('resto_attendance_records', JSON.stringify(next));
        return next;
      });
    } else {
      savedRecord = {
        ...data,
        id: `att-${Date.now()}`,
        createdAt: new Date().toLocaleString('sv-SE'),
      };
      setAttendanceRecords(prev => {
        const next = [savedRecord, ...prev];
        safeStorage.setItem('resto_attendance_records', JSON.stringify(next));
        return next;
      });
    }

    return {
      success: true,
      message: `Data absensi ${data.employeeName} berhasil disimpan!`,
      record: savedRecord,
    };
  };

  const deleteAttendanceRecord = (id: string): { success: boolean; message: string } => {
    setAttendanceRecords(prev => {
      const next = prev.filter(r => r.id !== id);
      safeStorage.setItem('resto_attendance_records', JSON.stringify(next));
      return next;
    });
    return { success: true, message: 'Catatan absensi berhasil dihapus.' };
  };

  const updateShiftTimeConfigs = (configs: Record<ShiftType, { startTime: string; endTime: string }>): { success: boolean; message: string } => {
    setShiftTimeConfigs(configs);
    safeStorage.setItem('resto_shift_time_configs', JSON.stringify(configs));
    return { success: true, message: 'Konfigurasi jam masuk dan pulang shift berhasil diperbarui oleh Manager!' };
  };

  const resetToDefaultData = () => {
    if (window.confirm('Reset semua data ke konfigurasi awal restoran?')) {
      setRawItems(INITIAL_RAW_ITEMS);
      setMenuItems(INITIAL_MENU_ITEMS);
      setReceivings(INITIAL_RECEIVINGS);
      setWastes(INITIAL_WASTES);
      setSales(INITIAL_SALES);
      setTransfers(INITIAL_TRANSFERS);
      setPettyCash(INITIAL_PETTY_CASH);
      setSoConfig(INITIAL_SO_CONFIG);
      setSoRecords(INITIAL_SO_RECORDS);
      setUsers(INITIAL_USERS);
      setRolePermissions(INITIAL_ROLE_PERMISSIONS);
      setBranding(INITIAL_BRANDING);
      setPaymentMethods(INITIAL_PAYMENT_METHODS);
      setPrinterRouting(INITIAL_PRINTER_ROUTING);
      setTableOrders(INITIAL_TABLE_ORDERS);
      setOutlets(INITIAL_OUTLETS);
      setPurchasingOrders(INITIAL_PURCHASING_ORDERS);
      setInternalMemos(INITIAL_INTERNAL_MEMOS);
      safeStorage.clear();
      setActiveTab('dashboard');
    }
  };

  return (
    <RestoContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        isAuthenticated,
        login,
        logout,
        changeMyPassword,
        adminResetPassword,
        updateUserRole,
        createUser,
        updateUser,
        deleteUser,
        updateUserProfile,
        deleteReceivingRecord,
        updateReceivingRecord,
        deleteWasteRecord,
        updateWasteRecord,
        deleteDailySalesRecord,
        updateDailySalesRecord,
        deleteStockTransfer,
        updateStockTransfer,
        deletePettyCashRecord,
        deletePettyCashTransaction: deletePettyCashRecord,
        updatePettyCashRecord,
        updatePettyCashTransaction: updatePettyCashRecord,
        deleteStockOpname,
        deleteStockOpnameRecord: deleteStockOpname,
        deleteRawItem,
        deleteMenuItem,
        updateMenuItem,
        updateTableOrder,
        deleteTableOrder,
        updatePurchasingOrder,
        deletePurchasingOrder,
        updateInternalMemo,
        updateStockOpnameRecord,
        variableCosts,
        addVariableCost,
        updateVariableCost,
        deleteVariableCost,
        shiftSchedules,
        addShiftSchedule,
        updateShiftSchedule,
        deleteShiftSchedule,
        bulkAssignShiftSchedules,
        expiringContractEmployees,
        roles,
        addRole,
        updateRole,
        deleteRole,
        resetRolesToDefault,
        rolePermissions,
        updateRolePermissions,
        updateAllRolePermissions,
        resetRolePermissionsToDefault,
        branding,
        updateBranding,
        activeTab,
        setActiveTab,
        rawItems,
        menuItems,
        receivings,
        wastes,
        sales,
        transfers,
        pettyCash,
        pettyCashBalance: pettyCash.reduce((sum, item) => item.type === 'in' ? sum + item.amount : sum - item.amount, 0),
        currentOutlet: { 
          id: 'outlet-1', 
          name: branding.outletName, 
          city: branding.outletCity,
          address: branding.outletAddress
        },
        soConfig,
        soRecords,
        stockOpnames: soRecords,
        notifications,
        paymentMethods,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        printerRouting,
        updatePrinterRouting,
        updateMenuItemSoldLimit,
        tableOrders,
        addTableOrder,
        updateTableOrderStatus,
        cancelTableOrder,
        transferTable,
        transferTableItem,
        splitTableOrder,
        restoTables,
        addPosTable,
        updatePosTable,
        deletePosTable,
        promos,
        addPromo,
        updatePromo,
        deletePromo,
        taxServiceConfig,
        updateTaxServiceConfig,
        outlets,
        addOutlet,
        updateOutlet,
        deleteOutlet,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        purchasingOrders,
        addPurchasingOrder,
        updatePurchasingOrderStatus,
        internalMemos,
        addInternalMemo,
        markMemoAsRead,
        deleteInternalMemo,
        addRawItem,
        bulkAddRawItems,
        updateRawItem,
        addMenuItem,
        bulkAddMenuItems,
        addReceivingRecord,
        addWasteRecord,
        addDailySalesRecord,
        addStockTransfer,
        updateTransferStatus,
        addPettyCashRecord,
        addPettyCashTransaction: addPettyCashRecord,
        updateSOConfig,
        submitStockOpname,
        addStockOpnameRecord: submitStockOpname,
        approveStockOpname,
        markNotificationAsRead,
        resetAllDataToZero,
        resetToDefaultData,
        resetSalesDataOnly,
        calculateRecipeHPP,
        formatRupiah,
        sendLeaderBirthdayMemo,
        todayBirthdays,
        upcomingBirthdays,
        closingReports,
        submitClosingReport,
        deleteClosingReport,
        attendanceRecords,
        submitAttendance,
        deleteAttendanceRecord,
        shiftTimeConfigs,
        updateShiftTimeConfigs,
        dbSyncStatus,
        refreshFromDatabase,
      }}
    >
      {children}
    </RestoContext.Provider>
  );
};

export const useResto = () => {
  const context = useContext(RestoContext);
  if (!context) {
    throw new Error('useResto must be used within a RestoProvider');
  }
  return context;
};
