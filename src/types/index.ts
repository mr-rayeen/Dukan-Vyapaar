export type PaymentMethod = 'cash' | 'upi' | 'udhar';

export interface Product {
  id: string;
  name: string;
  hindiName?: string;
  category: string;
  barcode?: string;
  packSize: number; // 1 Carton = X Pieces (Permanently saved in master)
  totalPieces: number; // Single source of truth for stock!
  purchaseRateCarton: number; // Supplier rate per carton
  salePricePiece: number; // Selling price per loose piece
  salePriceCarton: number; // Selling price per full carton
  lowStockThresholdPieces: number; // Threshold in total pieces
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'return';
  cartonQty: number;
  pieceQty: number;
  totalPiecesDelta: number; // negative for sale, positive for purchase
  remainingTotalPieces: number;
  referenceId?: string; // Bill ID or Purchase Bill ID
  notes?: string;
  timestamp: string;
}

export interface BillItem {
  productId: string;
  productName: string;
  packSize: number;
  cartonQty: number;
  pieceQty: number;
  totalPieces: number;
  cartonPrice: number;
  piecePrice: number;
  totalAmount: number;
}

export interface PaymentRecord {
  id: string;
  billId?: string;
  billNumber?: string;
  customerName: string;
  customerPhone?: string;
  amount: number;
  paymentMethod: 'cash' | 'upi';
  notes?: string;
  date: string;
  createdAt: string;
}

export interface Bill {
  id: string;
  billNumber: string; // e.g. INV-2026-1001
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount?: number; // Total amount paid towards this bill so far
  payments?: PaymentRecord[]; // Parted payment history for this specific bill
  paymentMethod: PaymentMethod;
  isUdharPaid: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SupplierPurchaseItem {
  productName: string;
  category?: string; // Category selected or created during bill review
  matchedProductId?: string; // If already in master
  isNewProduct: boolean;
  packSize: number; // Saved pack size if existing, or chosen by user if new
  isPackSizeLocked: boolean; // Locked for existing products
  cartonQty: number;
  pieceQty: number;
  rate: number;
  rateType: 'carton' | 'piece';
  totalAmount: number;
  confidence: 'high' | 'medium' | 'low';
  salePriceCarton?: number; // Selling price per box (बिक्री भाव बॉक्स)
  salePricePiece?: number;  // Selling price per ladi (बिक्री भाव लड़ी)
}

export interface SupplierPurchase {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  invoiceDate: string;
  totalAmount: number;
  items: SupplierPurchaseItem[];
  scannedAt: string;
}

export interface UdharSettlement {
  id: string;
  billId: string;
  customerName: string;
  amountSettled: number;
  settledAt: string;
  paymentMethod: 'cash' | 'upi';
  notes?: string;
}

export type ExpenseCategory =
  | 'tea_snacks'     // चाय व नाश्ता
  | 'transport'      // भाड़ा व ट्रांसपोर्ट
  | 'wages'          // मजदूरी व पगार
  | 'electricity'    // बिजली बिल व दुकान खर्च
  | 'rent'           // दुकान किराया
  | 'packaging'      // थैली व पैकिंग खर्च
  | 'other';         // अन्य विविध खर्च

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  notes?: string;
  paymentMethod: 'cash' | 'upi';
  date: string; // ISO date string
  createdAt: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  phone: string;
  address: string;
  gstNumber?: string;
  upiId?: string;
  currency: string;
}

