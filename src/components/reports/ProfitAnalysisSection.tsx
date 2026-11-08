import React, { useState, useMemo } from 'react';
import { Bill, Expense, Product, ShopSettings } from '../../types';
import { EXPENSE_CATEGORIES } from '../expenses/ExpenseModal';
import {
  TrendingUp,
  ReceiptText,
  Calendar,
  Share2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  PieChart as PieIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ProfitAnalysisSectionProps {
  bills: Bill[];
  products: Product[];
  expenses?: Expense[];
  settings: ShopSettings;
  onOpenExpenseModal?: () => void;
  lang: 'hi' | 'en';
}

type RangeOption = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'last30' | 'custom';

export const ProfitAnalysisSection: React.FC<ProfitAnalysisSectionProps> = ({
  bills,
  products,
  expenses = [],
  settings,
  onOpenExpenseModal,
  lang,
}) => {
  const [selectedRange, setSelectedRange] = useState<RangeOption>('last7');

  // Custom date inputs (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);
  const [showDayBreakdown, setShowDayBreakdown] = useState<boolean>(true);

  // Compute start and end dates based on selection
  const { startDate, endDate, daysCount, rangeLabel } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let label = '';

    if (selectedRange === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      label = lang === 'hi' ? 'आज (Today)' : "Today's Profit";
    } else if (selectedRange === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0);
      end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59);
      label = lang === 'hi' ? 'कल (Yesterday)' : "Yesterday's Profit";
    } else if (selectedRange === 'last7') {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      start = new Date(past.getFullYear(), past.getMonth(), past.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      label = lang === 'hi' ? 'पिछले 7 दिन (Last 7 Days)' : 'Last 7 Days';
    } else if (selectedRange === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      label = lang === 'hi' ? 'इस महीने (This Month)' : 'This Month';
    } else if (selectedRange === 'last30') {
      const past = new Date(now);
      past.setDate(past.getDate() - 29);
      start = new Date(past.getFullYear(), past.getMonth(), past.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      label = lang === 'hi' ? 'पिछले 30 दिन (Last 30 Days)' : 'Last 30 Days';
    } else {
      // Custom range
      const s = new Date(customStartDate);
      const e = new Date(customEndDate);
      start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0);
      end = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59);
      label = `${s.toLocaleDateString([], { day: 'numeric', month: 'short' })} - ${e.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
    }

    const diffMs = end.getTime() - start.getTime();
    const count = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);

    return {
      startDate: start,
      endDate: end,
      daysCount: count,
      rangeLabel: label,
    };
  }, [selectedRange, customStartDate, customEndDate, lang]);

  // Product lookup map for purchase rate calculation
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Filter bills & expenses within the chosen range
  const rangeBills = useMemo(() => {
    return bills.filter((b) => {
      const d = new Date(b.createdAt);
      return d >= startDate && d <= endDate;
    });
  }, [bills, startDate, endDate]);

  const rangeExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date || e.createdAt);
      return d >= startDate && d <= endDate;
    });
  }, [expenses, startDate, endDate]);

  // Comprehensive financial aggregations
  const {
    totalRevenue,
    totalCOGS,
    grossProfit,
    grossMarginPercent,
    totalExpenses,
    netProfit,
    netMarginPercent,
    estimatedDailyNetProfit,
    estimatedDailyRevenue,
    estimatedDailyExpenses,
    cashAndUpiReceived,
    pendingUdharInRange,
  } = useMemo(() => {
    let rev = 0;
    let cogs = 0;
    let pendingUdhar = 0;
    let received = 0;

    rangeBills.forEach((b) => {
      rev += b.totalAmount;

      // Calculate cost of goods sold for this bill
      b.items.forEach((item) => {
        const p = productMap.get(item.productId);
        const packSize = p?.packSize || item.packSize || 1;
        const purchaseRateCarton = p?.purchaseRateCarton || 0;
        const costPerPiece = purchaseRateCarton / packSize;
        const totalPieces = (item.cartonQty * packSize) + item.pieceQty;

        if (costPerPiece > 0) {
          cogs += totalPieces * costPerPiece;
        } else {
          // Standard estimate: 80% of selling price if purchase rate unrecorded
          cogs += item.totalAmount * 0.8;
        }
      });

      // Udhar vs Paid tracking
      if (b.paymentMethod === 'udhar') {
        const paid = b.paidAmount || (b.isUdharPaid ? b.totalAmount : 0);
        const rem = Math.max(0, b.totalAmount - paid);
        pendingUdhar += rem;
        received += paid;
      } else {
        received += b.totalAmount;
      }
    });

    const exp = rangeExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const gross = rev - cogs;
    const grossMarg = rev > 0 ? (gross / rev) * 100 : 0;
    const net = gross - exp;
    const netMarg = rev > 0 ? (net / rev) * 100 : 0;

    const dailyNet = net / daysCount;
    const dailyRev = rev / daysCount;
    const dailyExp = exp / daysCount;

    return {
      totalRevenue: rev,
      totalCOGS: cogs,
      grossProfit: gross,
      grossMarginPercent: grossMarg,
      totalExpenses: exp,
      netProfit: net,
      netMarginPercent: netMarg,
      estimatedDailyNetProfit: dailyNet,
      estimatedDailyRevenue: dailyRev,
      estimatedDailyExpenses: dailyExp,
      cashAndUpiReceived: received,
      pendingUdharInRange: pendingUdhar,
    };
  }, [rangeBills, rangeExpenses, productMap, daysCount]);

  // Day-by-Day data for Recharts chart & Table
  const dailyChartData = useMemo(() => {
    const map = new Map<
      string,
      {
        dateKey: string;
        label: string;
        revenue: number;
        cogs: number;
        expenses: number;
        netProfit: number;
        billsCount: number;
      }
    >();

    // Generate chronological day slots
    const cur = new Date(startDate);
    const end = new Date(endDate);
    while (cur <= end) {
      const dateKey = cur.toISOString().split('T')[0];
      const label = cur.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      map.set(dateKey, {
        dateKey,
        label,
        revenue: 0,
        cogs: 0,
        expenses: 0,
        netProfit: 0,
        billsCount: 0,
      });
      cur.setDate(cur.getDate() + 1);
    }

    // Populate revenue & COGS
    rangeBills.forEach((b) => {
      const dKey = new Date(b.createdAt).toISOString().split('T')[0];
      const entry = map.get(dKey);
      if (entry) {
        entry.revenue += b.totalAmount;
        entry.billsCount += 1;

        b.items.forEach((item) => {
          const p = productMap.get(item.productId);
          const packSize = p?.packSize || item.packSize || 1;
          const purchaseRateCarton = p?.purchaseRateCarton || 0;
          const costPerPiece = purchaseRateCarton / packSize;
          const totalPieces = (item.cartonQty * packSize) + item.pieceQty;

          if (costPerPiece > 0) {
            entry.cogs += totalPieces * costPerPiece;
          } else {
            entry.cogs += item.totalAmount * 0.8;
          }
        });
      }
    });

    // Populate expenses
    rangeExpenses.forEach((e) => {
      const dKey = new Date(e.date || e.createdAt).toISOString().split('T')[0];
      const entry = map.get(dKey);
      if (entry) {
        entry.expenses += e.amount;
      }
    });

    // Compute net profit for each day
    map.forEach((entry) => {
      entry.netProfit = entry.revenue - entry.cogs - entry.expenses;
    });

    return Array.from(map.values());
  }, [startDate, endDate, rangeBills, rangeExpenses, productMap]);

  // Expenses category breakdown for the range
  const categoryExpenses = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => {
      const total = rangeExpenses
        .filter((e) => e.category === cat.key)
        .reduce((acc, curr) => acc + curr.amount, 0);
      const percentage = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
      return {
        ...cat,
        total,
        percentage,
      };
    }).filter((c) => c.total > 0);
  }, [rangeExpenses, totalExpenses]);

  // WhatsApp Share Function
  const handleShareReport = () => {
    const isProfit = netProfit >= 0;
    const msg = `📊 *PROFIT ANALYSIS REPORT*
🏪 *${settings.shopName || 'Retail Store'}*
📅 *Period:* ${rangeLabel} (${daysCount} ${daysCount === 1 ? 'day' : 'days'})
--------------------------------
💰 *Total Revenue (बिक्री):* ₹${totalRevenue.toLocaleString('en-IN')}
📦 *Cost of Goods (लागत):* ₹${Math.round(totalCOGS).toLocaleString('en-IN')}
📈 *Gross Profit (सकल लाभ):* ₹${Math.round(grossProfit).toLocaleString('en-IN')} (${grossMarginPercent.toFixed(1)}%)
🧾 *Shop Expenses (दुकान खर्च):* ₹${totalExpenses.toLocaleString('en-IN')}
--------------------------------
${isProfit ? '✨ *ESTIMATED NET PROFIT:*' : '⚠️ *NET LOSS:*'} ₹${Math.round(netProfit).toLocaleString('en-IN')}
⚡ *Daily Net Profit (प्रतिदिन):* ₹${Math.round(estimatedDailyNetProfit).toLocaleString('en-IN')} / दिन
📊 *Net Profit Margin:* ${netMarginPercent.toFixed(1)}%
--------------------------------
💳 *Received (Cash/UPI):* ₹${cashAndUpiReceived.toLocaleString('en-IN')}
⏳ *Pending Udhar:* ₹${pendingUdharInRange.toLocaleString('en-IN')}

_Generated via Store POS & Inventory_`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* 1. Date Range Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'hi' ? 'अवधि चुनें (Select Period)' : 'Date Range Filter'}</span>
          </span>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
            {rangeLabel} ({daysCount} {daysCount === 1 ? (lang === 'hi' ? 'दिन' : 'day') : (lang === 'hi' ? 'दिन' : 'days')})
          </span>
        </div>

        {/* Quick Range Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setSelectedRange('today')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap shrink-0 transition active:scale-95 ${
              selectedRange === 'today'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'hi' ? 'आज (Today)' : 'Today'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedRange('yesterday')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap shrink-0 transition active:scale-95 ${
              selectedRange === 'yesterday'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'hi' ? 'कल (Yesterday)' : 'Yesterday'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedRange('last7')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap shrink-0 transition active:scale-95 ${
              selectedRange === 'last7'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'hi' ? 'पिछले 7 दिन' : 'Last 7 Days'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedRange('thisMonth')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap shrink-0 transition active:scale-95 ${
              selectedRange === 'thisMonth'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'hi' ? 'इस महीने' : 'This Month'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedRange('last30')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap shrink-0 transition active:scale-95 ${
              selectedRange === 'last30'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'hi' ? 'पिछले 30 दिन' : 'Last 30 Days'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedRange('custom')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap shrink-0 transition active:scale-95 ${
              selectedRange === 'custom'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'hi' ? 'कस्टम तारीख' : 'Custom'}
          </button>
        </div>

        {/* Custom Date Pickers */}
        {selectedRange === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                {lang === 'hi' ? 'शुरुआती तारीख (From)' : 'Start Date'}
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                {lang === 'hi' ? 'अंतिम तारीख (To)' : 'End Date'}
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Hero Net Profit Banner */}
      <div
        className={`rounded-3xl p-4 text-white shadow-md relative overflow-hidden transition-all ${
          netProfit >= 0
            ? 'bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900'
            : 'bg-gradient-to-br from-rose-800 via-rose-900 to-slate-900'
        }`}
      >
        <div className="relative z-10 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">
                  {lang === 'hi' ? 'अनुमानित शुद्ध लाभ (Estimated Net Profit)' : 'Estimated Net Profit'}
                </span>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.2 rounded-full">
                  {daysCount} {daysCount === 1 ? 'day' : 'days'}
                </span>
              </div>
              <h2 className="text-3xl font-black mt-1 tracking-tight text-white">
                ₹{Math.round(netProfit).toLocaleString('en-IN')}
              </h2>
              <div className="text-xs text-emerald-100 font-semibold mt-0.5 flex items-center gap-2">
                <span>
                  {netProfit >= 0 ? '+' : ''}{netMarginPercent.toFixed(1)}% {lang === 'hi' ? 'शुद्ध मार्जिन' : 'Net Margin'}
                </span>
                <span>•</span>
                <span>{rangeBills.length} {lang === 'hi' ? 'बिक्री बिल' : 'bills'}</span>
              </div>
            </div>

            {/* Daily Net Profit Callout Card */}
            <div className="bg-black/25 backdrop-blur-xs border border-white/15 rounded-2xl p-2.5 text-right shrink-0">
              <span className="text-[10px] font-bold text-emerald-200 block uppercase">
                {lang === 'hi' ? 'प्रतिदिन शुद्ध लाभ' : 'Estimated Net Daily'}
              </span>
              <span className="text-lg font-black text-white mt-0.5 block">
                ₹{Math.round(estimatedDailyNetProfit).toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] text-emerald-100 block font-medium">
                {lang === 'hi' ? 'प्रतिदिन औसत' : 'Daily Average'}
              </span>
            </div>
          </div>

          {/* Formula calculation visualization strip */}
          <div className="bg-black/30 backdrop-blur-xs rounded-2xl p-2.5 border border-white/10 text-[11px] font-bold flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center gap-1 text-emerald-300">
              <span>Rev:</span>
              <span className="text-white">₹{totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <span className="text-white/60">−</span>
            <div className="flex items-center gap-1 text-blue-300">
              <span>COGS:</span>
              <span className="text-white">₹{Math.round(totalCOGS).toLocaleString('en-IN')}</span>
            </div>
            <span className="text-white/60">−</span>
            <div className="flex items-center gap-1 text-rose-300">
              <span>Exp:</span>
              <span className="text-white">₹{totalExpenses.toLocaleString('en-IN')}</span>
            </div>
            <span className="text-white/60">=</span>
            <div className="flex items-center gap-1 text-amber-300">
              <span>Net:</span>
              <span className="text-white">₹{Math.round(netProfit).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Financial Metrics 4-Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
            {lang === 'hi' ? 'कुल बिक्री (Total Revenue)' : 'Total Revenue'}
          </span>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex items-center justify-between">
            <span>{rangeBills.length} {lang === 'hi' ? 'बिल कटे' : 'bills'}</span>
            <span className="text-emerald-600 font-bold">₹{Math.round(estimatedDailyRevenue)}/day</span>
          </div>
        </div>

        {/* Total Cost of Goods */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
            {lang === 'hi' ? 'माल खरीद लागत (COGS)' : 'Cost of Goods Sold'}
          </span>
          <div className="text-lg font-black text-blue-700 dark:text-blue-400 mt-1">
            ₹{Math.round(totalCOGS).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {totalRevenue > 0 ? ((totalCOGS / totalRevenue) * 100).toFixed(1) : 0}% of revenue
          </div>
        </div>

        {/* Gross Profit Margin */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
            {lang === 'hi' ? 'सकल मुनाफ़ा (Gross Profit)' : 'Gross Profit'}
          </span>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{Math.round(grossProfit).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex items-center justify-between">
            <span>{grossMarginPercent.toFixed(1)}% Margin</span>
            <span className="text-slate-400">Before Exp</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
              {lang === 'hi' ? 'कुल दुकान खर्च (Expenses)' : 'Shop Expenses'}
            </span>
            {onOpenExpenseModal && (
              <button
                type="button"
                onClick={onOpenExpenseModal}
                className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                + {lang === 'hi' ? 'जोड़ें' : 'Add'}
              </button>
            )}
          </div>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex items-center justify-between">
            <span>{rangeExpenses.length} {lang === 'hi' ? 'खर्च' : 'entries'}</span>
            <span className="text-rose-600 font-bold">₹{Math.round(estimatedDailyExpenses)}/day</span>
          </div>
        </div>
      </div>

      {/* 4. Daily Revenue vs Expenses & Net Profit Trend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {lang === 'hi'
                  ? 'दैनिक बिक्री, खर्च व नेट मुनाफ़ा ट्रेंड'
                  : 'Revenue vs Expenses & Net Profit'}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {lang === 'hi'
                ? 'प्रतिदिन का शुद्ध लाभ (Bars = Revenue & Expenses, Line = Net Profit)'
                : 'Daily estimated net profit over the selected period'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleShareReport}
            className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-extrabold rounded-xl transition flex items-center gap-1 shrink-0"
            title="Share Statement"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'शेयर' : 'Share'}</span>
          </button>
        </div>

        {/* Recharts Composed Chart */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dailyChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1">
                        <div className="font-extrabold border-b border-slate-700 pb-1 text-[11px] text-slate-300">
                          {data.label} ({data.dateKey})
                        </div>
                        <div className="flex justify-between gap-4 text-emerald-400 font-bold">
                          <span>Revenue:</span>
                          <span>₹{data.revenue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-blue-300">
                          <span>Goods Cost:</span>
                          <span>₹{Math.round(data.cogs).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-rose-400 font-bold">
                          <span>Expenses:</span>
                          <span>₹{data.expenses.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-teal-300 font-black border-t border-slate-700 pt-1">
                          <span>Net Profit:</span>
                          <span>₹{Math.round(data.netProfit).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '10px' }}
                iconType="circle"
              />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Line
                type="monotone"
                dataKey="netProfit"
                name="Net Profit"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0d9488' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Expense Categories Breakdown for this Period */}
      {categoryExpenses.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
              <ReceiptText className="w-3.5 h-3.5 text-rose-600" />
              <span>{lang === 'hi' ? 'इस अवधि के दुकान खर्च (Expenses Breakdown)' : 'Expenses in Selected Period'}</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">
              ₹{totalExpenses.toLocaleString('en-IN')} Total
            </span>
          </div>

          <div className="space-y-2">
            {categoryExpenses.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${cat.color}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span>{lang === 'hi' ? cat.labelHi : cat.labelEn}</span>
                    </div>
                    <span>₹{cat.total.toLocaleString('en-IN')} ({cat.percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Day-by-Day Detailed Profit Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
        <button
          type="button"
          onClick={() => setShowDayBreakdown(!showDayBreakdown)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
              {lang === 'hi' ? 'प्रतिदिन का विस्तृत हिसाब (Daily Breakdown Table)' : 'Daily Profit & Loss Ledger'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {lang === 'hi'
                ? 'तारीख अनुसार बिक्री, दुकान खर्च व शुद्ध बचत'
                : 'Date-wise revenue, expenses, and net profit ledger'}
            </p>
          </div>
          <div className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            {showDayBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showDayBreakdown && (
          <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            {dailyChartData.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400">
                {lang === 'hi' ? 'इस अवधि में कोई बिक्री या खर्च नहीं हुआ।' : 'No activity in this period.'}
              </p>
            ) : (
              [...dailyChartData].reverse().map((day) => {
                const dayMargin = day.revenue > 0 ? (day.netProfit / day.revenue) * 100 : 0;
                return (
                  <div
                    key={day.dateKey}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-black text-slate-900 dark:text-white">
                        {day.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{day.billsCount} bills</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold">Rev: ₹{day.revenue}</span>
                        <span>•</span>
                        <span className="text-rose-600 font-bold">Exp: ₹{day.expenses}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-black text-sm ${
                          day.netProfit >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {day.netProfit >= 0 ? '+' : ''}₹{Math.round(day.netProfit).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 block">
                        {dayMargin.toFixed(0)}% Margin
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 7. Footer Sharing Button */}
      <button
        type="button"
        onClick={handleShareReport}
        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-2xl shadow-md active:scale-98 transition flex items-center justify-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        <span>
          {lang === 'hi'
            ? `व्हाट्सएप पर शेयर करें (${rangeLabel} का लाभ रिपोर्ट)`
            : `Share ${rangeLabel} Profit Analysis on WhatsApp`}
        </span>
      </button>
    </div>
  );
};
