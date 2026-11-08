import { Bill, Expense, Product, ShopSettings, StockMovement, SupplierPurchase } from '../types';
import { composePieces } from './stockLogic';

const STORAGE_KEYS = {
  PRODUCTS: 'dukaan_products_v1',
  BILLS: 'dukaan_bills_v1',
  MOVEMENTS: 'dukaan_movements_v1',
  PURCHASES: 'dukaan_purchases_v1',
  SETTINGS: 'dukaan_settings_v1',
  EXPENSES: 'dukaan_expenses_v1',
};

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Shree Krishna Traders & Store',
  tagline: 'Wholesale & Retail Groceries | थोक एवं फुटकर विक्रेता',
  phone: '9876543210',
  address: 'Shop No. 14, Main Mandi Bazar, Kanpur',
  gstNumber: '09AAACH7409R1ZZ',
  upiId: 'shreekrishnatraders@upi',
  currency: '₹',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Parle-G Gold Biscuits (100g)',
    hindiName: 'पारले-जी बिस्कुट',
    category: 'Biscuits & Snacks',
    barcode: '8901719101012',
    packSize: 24, // 1 Carton = 24 Pieces
    totalPieces: 1150, // 95 Cartons + 10 Pieces (prompt's exact example!)
    purchaseRateCarton: 240,
    salePricePiece: 12,
    salePriceCarton: 280,
    lowStockThresholdPieces: 48,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'prod-2',
    name: 'Maggi 2-Minute Masala Noodles (70g)',
    hindiName: 'मैगी मसाला नूडल्स',
    category: 'Instant Food',
    barcode: '8901058852331',
    packSize: 48, // 1 Carton = 48 Pieces
    totalPieces: 586, // 12 Cartons + 10 Pieces
    purchaseRateCarton: 600,
    salePricePiece: 14,
    salePriceCarton: 660,
    lowStockThresholdPieces: 96,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'prod-3',
    name: 'Tata Salt Vaccum Evaporated (1kg)',
    hindiName: 'टाटा नमक',
    category: 'Staples & Spices',
    barcode: '8901030010014',
    packSize: 25, // 1 Bag/Carton = 25 Pieces
    totalPieces: 310, // 12 Bags + 10 Pieces
    purchaseRateCarton: 550,
    salePricePiece: 28,
    salePriceCarton: 680,
    lowStockThresholdPieces: 50,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'prod-4',
    name: 'Dettol Original Bathing Soap (75g)',
    hindiName: 'डेटॉल साबुन',
    category: 'Personal Care',
    barcode: '8901396112015',
    packSize: 16, // 1 Carton = 16 Pieces
    totalPieces: 134, // 8 Cartons + 6 Pieces
    purchaseRateCarton: 560,
    salePricePiece: 40,
    salePriceCarton: 620,
    lowStockThresholdPieces: 32,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'prod-5',
    name: 'Frooti Fresh ' + "N" + ' Juicy Mango (160ml)',
    hindiName: 'फ्रूटी मैंगो',
    category: 'Beverages',
    barcode: '8901719124059',
    packSize: 30, // 1 Case = 30 Pieces
    totalPieces: 450, // 15 Cartons + 0 Pieces
    purchaseRateCarton: 250,
    salePricePiece: 10,
    salePriceCarton: 290,
    lowStockThresholdPieces: 60,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'prod-6',
    name: 'Aashirvaad Shudh Chakki Atta (5kg)',
    hindiName: 'आशीर्वाद चक्की आटा',
    category: 'Staples & Spices',
    barcode: '8901725181121',
    packSize: 6, // 1 Bundle = 6 Bags
    totalPieces: 8, // 1 Carton + 2 Pieces (Low stock demo!)
    purchaseRateCarton: 1260,
    salePricePiece: 235,
    salePriceCarton: 1380,
    lowStockThresholdPieces: 12,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'prod-7',
    name: 'Surf Excel Easy Wash Detergent (500g)',
    hindiName: 'सर्फ एक्सेल पाउडर',
    category: 'Household & Cleaning',
    barcode: '8901030725114',
    packSize: 12, // 1 Carton = 12 Pieces
    totalPieces: 5, // 0 Cartons + 5 Pieces (Low stock demo!)
    purchaseRateCarton: 760,
    salePricePiece: 75,
    salePriceCarton: 880,
    lowStockThresholdPieces: 24,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'prod-8',
    name: 'Red Bull Energy Drink (250ml Can)',
    hindiName: 'रेड बुल कैन',
    category: 'Beverages',
    barcode: '9002490100070',
    packSize: 24, // 1 Tray = 24 Cans
    totalPieces: 76, // 3 Trays + 4 Cans
    purchaseRateCarton: 2400,
    salePricePiece: 125,
    salePriceCarton: 2900,
    lowStockThresholdPieces: 24,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
];

export const INITIAL_BILLS: Bill[] = [
  {
    id: 'bill-1',
    billNumber: 'INV-2026-1001',
    customerName: 'Ramesh Kirana Store',
    customerPhone: '9823456789',
    items: [
      {
        productId: 'prod-1',
        productName: 'Parle-G Gold Biscuits (100g)',
        packSize: 24,
        cartonQty: 2,
        pieceQty: 5,
        totalPieces: 53,
        cartonPrice: 280,
        piecePrice: 12,
        totalAmount: 620,
      },
      {
        productId: 'prod-2',
        productName: 'Maggi 2-Minute Masala Noodles (70g)',
        packSize: 48,
        cartonQty: 1,
        pieceQty: 10,
        totalPieces: 58,
        cartonPrice: 660,
        piecePrice: 14,
        totalAmount: 800,
      },
    ],
    subtotal: 1420,
    discount: 20,
    totalAmount: 1400,
    paymentMethod: 'cash',
    isUdharPaid: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // Today
  },
  {
    id: 'bill-2',
    billNumber: 'INV-2026-1002',
    customerName: 'Gupta Tea Stall',
    customerPhone: '9711223344',
    items: [
      {
        productId: 'prod-5',
        productName: "Frooti Fresh 'N' Juicy Mango (160ml)",
        packSize: 30,
        cartonQty: 2,
        pieceQty: 0,
        totalPieces: 60,
        cartonPrice: 290,
        piecePrice: 10,
        totalAmount: 580,
      },
      {
        productId: 'prod-3',
        productName: 'Tata Salt Vaccum Evaporated (1kg)',
        packSize: 25,
        cartonQty: 0,
        pieceQty: 5,
        totalPieces: 5,
        cartonPrice: 680,
        piecePrice: 28,
        totalAmount: 140,
      },
    ],
    subtotal: 720,
    discount: 0,
    totalAmount: 720,
    paymentMethod: 'upi',
    isUdharPaid: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // Today
  },
  {
    id: 'bill-3',
    billNumber: 'INV-2026-1003',
    customerName: 'Sharma Ji Pan Bhandar',
    customerPhone: '9899001122',
    items: [
      {
        productId: 'prod-8',
        productName: 'Red Bull Energy Drink (250ml Can)',
        packSize: 24,
        cartonQty: 1,
        pieceQty: 6,
        totalPieces: 30,
        cartonPrice: 2900,
        piecePrice: 125,
        totalAmount: 3650,
      },
    ],
    subtotal: 3650,
    discount: 50,
    totalAmount: 3600,
    paymentMethod: 'udhar',
    isUdharPaid: false, // Outstanding Khata / Udhar!
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(), // Today
  },
  {
    id: 'bill-4',
    billNumber: 'INV-2026-0998',
    customerName: 'Verma Sweet House',
    customerPhone: '9812345670',
    items: [
      {
        productId: 'prod-4',
        productName: 'Fortune Sunlite Refined Oil (1L Pouch)',
        packSize: 12,
        cartonQty: 3,
        pieceQty: 0,
        totalPieces: 36,
        cartonPrice: 1680,
        piecePrice: 145,
        totalAmount: 5040,
      },
    ],
    subtotal: 5040,
    discount: 40,
    totalAmount: 5000,
    paymentMethod: 'cash',
    isUdharPaid: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // Yesterday
  },
  {
    id: 'bill-5',
    billNumber: 'INV-2026-0995',
    customerName: 'Manoj General Store',
    customerPhone: '9988776655',
    items: [
      {
        productId: 'prod-7',
        productName: 'Surf Excel Quick Wash Detergent (500g)',
        packSize: 24,
        cartonQty: 2,
        pieceQty: 4,
        totalPieces: 52,
        cartonPrice: 1800,
        piecePrice: 78,
        totalAmount: 3912,
      },
    ],
    subtotal: 3912,
    discount: 12,
    totalAmount: 3900,
    paymentMethod: 'udhar',
    isUdharPaid: false, // Pending
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
  },
  {
    id: 'bill-6',
    billNumber: 'INV-2026-0991',
    customerName: 'Chaudhary Dairy & Kirana',
    customerPhone: '9833445566',
    items: [
      {
        productId: 'prod-5',
        productName: "Frooti Fresh 'N' Juicy Mango (160ml)",
        packSize: 30,
        cartonQty: 4,
        pieceQty: 10,
        totalPieces: 130,
        cartonPrice: 290,
        piecePrice: 10,
        totalAmount: 1260,
      },
    ],
    subtotal: 1260,
    discount: 0,
    totalAmount: 1260,
    paymentMethod: 'upi',
    isUdharPaid: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
  },
  {
    id: 'bill-7',
    billNumber: 'INV-2026-0988',
    customerName: 'Pooja Daily Needs',
    customerPhone: '9876501234',
    items: [
      {
        productId: 'prod-1',
        productName: 'Parle-G Gold Biscuits (100g)',
        packSize: 24,
        cartonQty: 5,
        pieceQty: 0,
        totalPieces: 120,
        cartonPrice: 280,
        piecePrice: 12,
        totalAmount: 1400,
      },
    ],
    subtotal: 1400,
    discount: 0,
    totalAmount: 1400,
    paymentMethod: 'cash',
    isUdharPaid: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
  },
  {
    id: 'bill-8',
    billNumber: 'INV-2026-0980',
    customerName: 'Gupta Tea Stall',
    customerPhone: '9711223344',
    items: [
      {
        productId: 'prod-6',
        productName: 'Good Day Butter Cookies (65g)',
        packSize: 36,
        cartonQty: 3,
        pieceQty: 0,
        totalPieces: 108,
        cartonPrice: 650,
        piecePrice: 19,
        totalAmount: 1950,
      },
    ],
    subtotal: 1950,
    discount: 50,
    totalAmount: 1900,
    paymentMethod: 'udhar',
    isUdharPaid: true, // Recovered!
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(), // 6 days ago
  },
  {
    id: 'bill-9',
    billNumber: 'INV-2026-0940',
    customerName: 'Anand Super Market',
    customerPhone: '9844556677',
    items: [
      {
        productId: 'prod-4',
        productName: 'Fortune Sunlite Refined Oil (1L Pouch)',
        packSize: 12,
        cartonQty: 10,
        pieceQty: 0,
        totalPieces: 120,
        cartonPrice: 1680,
        piecePrice: 145,
        totalAmount: 16800,
      },
    ],
    subtotal: 16800,
    discount: 300,
    totalAmount: 16500,
    paymentMethod: 'upi',
    isUdharPaid: true,
    createdAt: new Date(Date.now() - 86400000 * 28).toISOString(), // ~1 month ago
  },
  {
    id: 'bill-10',
    billNumber: 'INV-2026-0910',
    customerName: 'Ramesh Kirana Store',
    customerPhone: '9823456789',
    items: [
      {
        productId: 'prod-2',
        productName: 'Maggi 2-Minute Masala Noodles (70g)',
        packSize: 48,
        cartonQty: 5,
        pieceQty: 0,
        totalPieces: 240,
        cartonPrice: 660,
        piecePrice: 14,
        totalAmount: 3300,
      },
    ],
    subtotal: 3300,
    discount: 100,
    totalAmount: 3200,
    paymentMethod: 'udhar',
    isUdharPaid: false, // Pending
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(), // 1.5 months ago
  },
  {
    id: 'bill-11',
    billNumber: 'INV-2026-0850',
    customerName: 'Sanjay Provision Store',
    customerPhone: '9899112233',
    items: [
      {
        productId: 'prod-8',
        productName: 'Red Bull Energy Drink (250ml Can)',
        packSize: 24,
        cartonQty: 4,
        pieceQty: 0,
        totalPieces: 96,
        cartonPrice: 2900,
        piecePrice: 125,
        totalAmount: 11600,
      },
    ],
    subtotal: 11600,
    discount: 200,
    totalAmount: 11400,
    paymentMethod: 'cash',
    isUdharPaid: true,
    createdAt: new Date(Date.now() - 86400000 * 75).toISOString(), // 2.5 months ago
  },
  {
    id: 'bill-12',
    billNumber: 'INV-2026-0780',
    customerName: 'Sharma Ji Pan Bhandar',
    customerPhone: '9899001122',
    items: [
      {
        productId: 'prod-5',
        productName: "Frooti Fresh 'N' Juicy Mango (160ml)",
        packSize: 30,
        cartonQty: 10,
        pieceQty: 0,
        totalPieces: 300,
        cartonPrice: 290,
        piecePrice: 10,
        totalAmount: 2900,
      },
    ],
    subtotal: 2900,
    discount: 100,
    totalAmount: 2800,
    paymentMethod: 'udhar',
    isUdharPaid: true, // Recovered!
    createdAt: new Date(Date.now() - 86400000 * 110).toISOString(), // Previous quarter
  },
];

export function getStoredSettings(): ShopSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: ShopSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function getStoredBills(): Bill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(INITIAL_BILLS));
      return INITIAL_BILLS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BILLS;
  }
}

export function saveStoredBills(bills: Bill[]): void {
  localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
}

export function getStoredMovements(): StockMovement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (!raw) return [];
    const parsed: StockMovement[] = JSON.parse(raw);
    const seen = new Set<string>();
    let hasModified = false;
    const sanitized = parsed.map((m, idx) => {
      let id = m.id;
      if (!id || seen.has(id)) {
        id = `mov-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
        hasModified = true;
      }
      seen.add(id);
      return { ...m, id };
    });
    if (hasModified) {
      saveStoredMovements(sanitized);
    }
    return sanitized;
  } catch {
    return [];
  }
}

export function saveStoredMovements(movements: StockMovement[]): void {
  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
}

export function getStoredPurchases(): SupplierPurchase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredPurchases(purchases: SupplierPurchase[]): void {
  localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
}

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'Morning Tea & Samosa for Staff',
    amount: 140,
    category: 'tea_snacks',
    paymentMethod: 'cash',
    notes: 'Chai + 4 Samosa for godown helpers',
    date: new Date(Date.now() - 3600000 * 3).toISOString(), // Today
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'exp-2',
    title: 'Tempo / Rickshaw Godown Freight',
    amount: 350,
    category: 'transport',
    paymentMethod: 'cash',
    notes: 'Transport for Parle-G & Maggi cartons from Mandi depot',
    date: new Date(Date.now() - 3600000 * 5).toISOString(), // Today
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'exp-3',
    title: 'Daily Hamali / Unloading Wages',
    amount: 500,
    category: 'wages',
    paymentMethod: 'upi',
    notes: 'Loading & unloading 50 cartons',
    date: new Date(Date.now() - 86400000 * 1).toISOString(), // Yesterday
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'exp-4',
    title: 'Plastic carry bags & tape roll',
    amount: 220,
    category: 'packaging',
    paymentMethod: 'cash',
    notes: 'Packing tape and packing bags',
    date: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'exp-5',
    title: 'Shop Electricity Bill',
    amount: 1850,
    category: 'electricity',
    paymentMethod: 'upi',
    notes: 'Monthly power bill for cooler & deep freezer',
    date: new Date(Date.now() - 86400000 * 25).toISOString(), // Last month
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: 'exp-6',
    title: 'Mandi Godown Helper Monthly Advance',
    amount: 4000,
    category: 'wages',
    paymentMethod: 'cash',
    notes: 'Staff salary advance',
    date: new Date(Date.now() - 86400000 * 50).toISOString(), // ~2 months ago
    createdAt: new Date(Date.now() - 86400000 * 50).toISOString(),
  },
];

export function getStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXPENSES;
  }
}

export function saveStoredExpenses(expenses: Expense[]): void {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

/**
 * Resets storage back to initial realistic demo data
 */
export function resetAppToDemoData(): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(INITIAL_BILLS));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
}

