import { Bill, Expense, Product } from '../types';

export interface DailyDataPoint {
  dateKey: string;      // YYYY-MM-DD
  label: string;        // e.g., "05 Nov" or "Mon"
  total: number;
  cash: number;
  upi: number;
  udhar: number;
  billCount: number;
}

export interface MonthlyDataPoint {
  monthKey: string;     // YYYY-MM
  label: string;        // e.g., "Nov 2026"
  shortLabel: string;   // e.g., "Nov"
  total: number;
  cash: number;
  upi: number;
  udhar: number;
  billCount: number;
}

export interface QuarterlyDataPoint {
  quarterKey: string;   // e.g., "2026-Q4"
  label: string;        // e.g., "Q4 2026"
  quarterName: string;  // e.g., "Q4 (Oct-Dec)"
  total: number;
  cash: number;
  upi: number;
  udhar: number;
  billCount: number;
}

export interface CustomerUdharItem {
  customerName: string;
  customerPhone?: string;
  totalPending: number;
  totalSettled: number;
  totalBills: number;
  pendingBillsCount: number;
  lastBillDate: string;
}

/**
 * Generate last N days data points for Daily chart
 */
export function getDailySalesData(bills: Bill[], daysCount: number = 7): DailyDataPoint[] {
  const result: DailyDataPoint[] = [];
  const now = new Date();

  // Create empty slots for each day in range (from (daysCount - 1) days ago to today)
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    
    result.push({
      dateKey,
      label,
      total: 0,
      cash: 0,
      upi: 0,
      udhar: 0,
      billCount: 0,
    });
  }

  const map = new Map<string, DailyDataPoint>();
  result.forEach((pt) => map.set(pt.dateKey, pt));

  bills.forEach((b) => {
    const bDateKey = new Date(b.createdAt).toISOString().split('T')[0];
    const point = map.get(bDateKey);
    if (point) {
      point.total += b.totalAmount;
      point.billCount += 1;
      if (b.paymentMethod === 'cash') point.cash += b.totalAmount;
      else if (b.paymentMethod === 'upi') point.upi += b.totalAmount;
      else if (b.paymentMethod === 'udhar') {
        const paid = b.paidAmount || (b.isUdharPaid ? b.totalAmount : 0);
        point.udhar += Math.max(0, b.totalAmount - paid);
      }
    }

    // Also include payments collected on their payment date
    if (b.payments && b.payments.length > 0) {
      b.payments.forEach((p) => {
        const pDateKey = new Date(p.date || p.createdAt).toISOString().split('T')[0];
        const pPoint = map.get(pDateKey);
        if (pPoint) {
          if (p.paymentMethod === 'cash') pPoint.cash += p.amount;
          else if (p.paymentMethod === 'upi') pPoint.upi += p.amount;
        }
      });
    }
  });

  return result;
}

/**
 * Generate Monthly data points for current year or last 6/12 months
 */
export function getMonthlySalesData(bills: Bill[], monthsCount: number = 6): MonthlyDataPoint[] {
  const result: MonthlyDataPoint[] = [];
  const now = new Date();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    const shortLabel = d.toLocaleDateString('en-IN', { month: 'short' });

    result.push({
      monthKey,
      label,
      shortLabel,
      total: 0,
      cash: 0,
      upi: 0,
      udhar: 0,
      billCount: 0,
    });
  }

  const map = new Map<string, MonthlyDataPoint>();
  result.forEach((pt) => map.set(pt.monthKey, pt));

  bills.forEach((b) => {
    const d = new Date(b.createdAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    const point = map.get(monthKey);
    if (point) {
      point.total += b.totalAmount;
      point.billCount += 1;
      if (b.paymentMethod === 'cash') point.cash += b.totalAmount;
      else if (b.paymentMethod === 'upi') point.upi += b.totalAmount;
      else if (b.paymentMethod === 'udhar') point.udhar += b.totalAmount;
    }
  });

  return result;
}

/**
 * Generate Quarterly data points (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
 */
export function getQuarterlySalesData(bills: Bill[], year: number = new Date().getFullYear()): QuarterlyDataPoint[] {
  const quarters: QuarterlyDataPoint[] = [
    {
      quarterKey: `${year}-Q1`,
      label: `Q1 ${year}`,
      quarterName: 'Q1 (Jan - Mar)',
      total: 0,
      cash: 0,
      upi: 0,
      udhar: 0,
      billCount: 0,
    },
    {
      quarterKey: `${year}-Q2`,
      label: `Q2 ${year}`,
      quarterName: 'Q2 (Apr - Jun)',
      total: 0,
      cash: 0,
      upi: 0,
      udhar: 0,
      billCount: 0,
    },
    {
      quarterKey: `${year}-Q3`,
      label: `Q3 ${year}`,
      quarterName: 'Q3 (Jul - Sep)',
      total: 0,
      cash: 0,
      upi: 0,
      udhar: 0,
      billCount: 0,
    },
    {
      quarterKey: `${year}-Q4`,
      label: `Q4 ${year}`,
      quarterName: 'Q4 (Oct - Dec)',
      total: 0,
      cash: 0,
      upi: 0,
      udhar: 0,
      billCount: 0,
    },
  ];

  bills.forEach((b) => {
    const d = new Date(b.createdAt);
    if (d.getFullYear() === year) {
      const month = d.getMonth(); // 0 to 11
      const qIndex = Math.floor(month / 3);
      if (quarters[qIndex]) {
        quarters[qIndex].total += b.totalAmount;
        quarters[qIndex].billCount += 1;
        if (b.paymentMethod === 'cash') quarters[qIndex].cash += b.totalAmount;
        else if (b.paymentMethod === 'upi') quarters[qIndex].upi += b.totalAmount;
        else if (b.paymentMethod === 'udhar') quarters[qIndex].udhar += b.totalAmount;
      }
    }
  });

  return quarters;
}

/**
 * Customer-wise Udhar aggregation
 */
export function getCustomerUdharSummary(bills: Bill[]): CustomerUdharItem[] {
  const map = new Map<string, CustomerUdharItem>();

  bills.forEach((b) => {
    if (b.paymentMethod === 'udhar') {
      const key = b.customerName.trim().toLowerCase();
      const existing = map.get(key) || {
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        totalPending: 0,
        totalSettled: 0,
        totalBills: 0,
        pendingBillsCount: 0,
        lastBillDate: b.createdAt,
      };

      existing.totalBills += 1;
      if (!existing.customerPhone && b.customerPhone) {
        existing.customerPhone = b.customerPhone;
      }
      if (new Date(b.createdAt) > new Date(existing.lastBillDate)) {
        existing.lastBillDate = b.createdAt;
      }

      const paid = b.paidAmount || (b.isUdharPaid ? b.totalAmount : 0);
      const remaining = Math.max(0, b.totalAmount - paid);

      existing.totalSettled += paid;
      existing.totalPending += remaining;
      if (!b.isUdharPaid && remaining > 0) {
        existing.pendingBillsCount += 1;
      }

      map.set(key, existing);
    }
  });

  return Array.from(map.values()).sort((a, b) => b.totalPending - a.totalPending);
}

/**
 * Udhar overview metrics
 */
export function getUdharOverallMetrics(bills: Bill[]) {
  let totalUdharGiven = 0;
  let totalUdharSettled = 0;
  let totalPendingUdhar = 0;
  let pendingCount = 0;
  let settledCount = 0;

  bills.forEach((b) => {
    if (b.paymentMethod === 'udhar') {
      totalUdharGiven += b.totalAmount;
      const paid = b.paidAmount || (b.isUdharPaid ? b.totalAmount : 0);
      const remaining = Math.max(0, b.totalAmount - paid);
      totalUdharSettled += paid;
      totalPendingUdhar += remaining;
      if (b.isUdharPaid || remaining === 0) {
        settledCount += 1;
      } else {
        pendingCount += 1;
      }
    }
  });

  const recoveryRate = totalUdharGiven > 0 ? (totalUdharSettled / totalUdharGiven) * 100 : 100;

  return {
    totalUdharGiven,
    totalUdharSettled,
    totalPendingUdhar,
    pendingCount,
    settledCount,
    recoveryRate,
  };
}

/**
 * Top selling items
 */
export function getTopSellingProducts(bills: Bill[]) {
  const map = new Map<string, { productName: string; totalRevenue: number; totalPieces: number; billCount: number }>();

  bills.forEach((b) => {
    b.items.forEach((item) => {
      const existing = map.get(item.productId) || {
        productName: item.productName,
        totalRevenue: 0,
        totalPieces: 0,
        billCount: 0,
      };

      existing.totalRevenue += item.totalAmount;
      existing.totalPieces += (item.cartonQty * item.packSize) + item.pieceQty;
      existing.billCount += 1;
      map.set(item.productId, existing);
    });
  });

  return Array.from(map.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);
}

export interface MonthlyProfitPoint {
  monthKey: string;
  label: string;
  shortLabel: string;
  profit: number; // True Net Profit (Gross Profit - Expenses)
  grossProfit: number; // Gross Profit from Sales
  expenses: number; // Shop Expenses for the month
  revenue: number;
  cost: number;
  marginPercent: number;
}

/**
 * Monthly profit trend calculation with true Net Profit accounting for shop expenses
 */
export function getMonthlyProfitTrends(
  bills: Bill[],
  products: Product[],
  monthsCount: number = 6,
  expenses: Expense[] = []
): MonthlyProfitPoint[] {
  const productMap = new Map<string, Product>();
  products.forEach((p) => productMap.set(p.id, p));

  const result: MonthlyProfitPoint[] = [];
  const now = new Date();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    const shortLabel = d.toLocaleDateString('en-IN', { month: 'short' });

    result.push({
      monthKey,
      label,
      shortLabel,
      profit: 0,
      grossProfit: 0,
      expenses: 0,
      revenue: 0,
      cost: 0,
      marginPercent: 0,
    });
  }

  const map = new Map<string, MonthlyProfitPoint>();
  result.forEach((pt) => map.set(pt.monthKey, pt));

  // 1. Calculate revenue and goods cost from bills
  bills.forEach((b) => {
    const d = new Date(b.createdAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    const point = map.get(monthKey);

    if (point) {
      point.revenue += b.totalAmount;

      b.items.forEach((item) => {
        const prod = productMap.get(item.productId);
        const pack = (prod && prod.packSize > 0) ? prod.packSize : item.packSize || 1;
        const buyRate = prod ? prod.purchaseRateCarton : item.cartonPrice * 0.85;
        const costPerPiece = buyRate / pack;
        const piecesSold = (item.cartonQty * item.packSize) + item.pieceQty;
        const itemCost = costPerPiece * piecesSold;
        point.cost += itemCost;
      });
    }
  });

  // 2. Attribute daily shop expenses (tea, wages, transport, etc.)
  expenses.forEach((exp) => {
    const d = new Date(exp.date || exp.createdAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    const point = map.get(monthKey);

    if (point) {
      point.expenses += exp.amount;
    }
  });

  result.forEach((pt) => {
    const gross = Math.max(0, Math.round(pt.revenue - pt.cost));
    pt.grossProfit = gross;
    pt.expenses = Math.round(pt.expenses);
    // True Net Profit: Gross Profit minus operating expenses
    pt.profit = Math.round(gross - pt.expenses);
    pt.revenue = Math.round(pt.revenue);
    pt.cost = Math.round(pt.cost);
    pt.marginPercent = pt.revenue > 0 ? Math.round((pt.profit / pt.revenue) * 100) : 0;
  });

  return result;
}

export interface CategoryPerformanceItem {
  name: string;
  value: number; // Revenue in INR
  pieces: number;
  percentage: number;
  color: string;
}

const CATEGORY_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

/**
 * Category-wise inventory performance for Pie chart
 */
export function getCategoryPerformance(
  bills: Bill[],
  products: Product[]
): CategoryPerformanceItem[] {
  const prodCategoryMap = new Map<string, string>();
  products.forEach((p) => {
    prodCategoryMap.set(p.id, p.category || 'General Grocery');
    prodCategoryMap.set(p.name, p.category || 'General Grocery');
  });

  const catMap = new Map<string, { value: number; pieces: number }>();

  bills.forEach((b) => {
    b.items.forEach((item) => {
      const cat = prodCategoryMap.get(item.productId) || prodCategoryMap.get(item.productName) || 'General Grocery';
      const existing = catMap.get(cat) || { value: 0, pieces: 0 };
      existing.value += item.totalAmount;
      existing.pieces += (item.cartonQty * item.packSize) + item.pieceQty;
      catMap.set(cat, existing);
    });
  });

  const totalRev = Array.from(catMap.values()).reduce((acc, curr) => acc + curr.value, 0);

  const list = Array.from(catMap.entries()).map(([name, data], idx) => ({
    name,
    value: Math.round(data.value),
    pieces: data.pieces,
    percentage: totalRev > 0 ? Math.round((data.value / totalRev) * 100) : 0,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }));

  return list.sort((a, b) => b.value - a.value);
}

export interface StockedItemPieData {
  name: string;
  pieces: number;
  cartons: number;
  loosePieces: number;
  stockValue: number;
  percentage: number;
  color: string;
}

const STOCK_PALETTE = [
  '#059669', // Emerald
  '#0284c7', // Sky
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#db2777', // Rose
  '#0d9488', // Teal
  '#ea580c', // Orange
  '#4f46e5', // Indigo
  '#65a30d', // Lime
  '#475569', // Slate
];

/**
 * Calculates stock distribution across all items in godown for visual pie chart
 */
export function getStockItemsDistribution(products: Product[]): StockedItemPieData[] {
  let totalGodownValue = 0;

  const items = products.map((p) => {
    const pack = p.packSize || 1;
    const costPerPiece = p.purchaseRateCarton / pack;
    const value = Math.round(p.totalPieces * costPerPiece);
    const cartons = Math.floor(p.totalPieces / pack);
    const loosePieces = p.totalPieces % pack;
    totalGodownValue += value;

    return {
      name: p.name,
      pieces: p.totalPieces,
      cartons,
      loosePieces,
      stockValue: value,
      percentage: 0,
      color: '#059669',
    };
  });

  items.sort((a, b) => b.stockValue - a.stockValue);

  return items.map((it, idx) => ({
    ...it,
    percentage: totalGodownValue > 0 ? Math.round((it.stockValue / totalGodownValue) * 100) : 0,
    color: STOCK_PALETTE[idx % STOCK_PALETTE.length],
  }));
}


