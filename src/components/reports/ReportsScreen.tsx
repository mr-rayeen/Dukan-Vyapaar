import React, { useState, useEffect, useMemo } from 'react';
import { Bill, Expense, PaymentRecord, Product, ShopSettings } from '../../types';
import { decomposePieces } from '../../utils/stockLogic';
import {
  Calendar,
  CreditCard,
  TrendingUp,
  Boxes,
  CheckCircle,
  Phone,
  UserCheck,
  Share2,
  DollarSign,
  Download,
  AlertCircle,
  Trash2,
  BarChart3,
  ReceiptText,
  Plus,
  Coffee,
  Truck,
  Users,
} from 'lucide-react';
import { shareViaWhatsApp } from '../../utils/printerService';
import { generateBillPDF } from '../../utils/pdfGenerator';
import { SalesAnalyticsGraphs } from './SalesAnalyticsGraphs';
import { RechartsAnalyticsSection } from './RechartsAnalyticsSection';
import { EXPENSE_CATEGORIES } from '../expenses/ExpenseModal';
import { PartPaymentModal } from './PartPaymentModal';
import { CustomerLedgerModal } from './CustomerLedgerModal';
import { ProfitAnalysisSection } from './ProfitAnalysisSection';
import {
  Wallet,
  User,
  History,
  ArrowDownRight,
  BookOpen,
  FileText,
  Search,
  X,
} from 'lucide-react';

interface ReportsScreenProps {
  bills: Bill[];
  products: Product[];
  settings: ShopSettings;
  expenses?: Expense[];
  initialTab?: 'graphs' | 'daily' | 'expenses' | 'profit' | 'udhar' | 'stock' | 'collections';
  onOpenExpenseModal?: () => void;
  onDeleteExpense?: (id: string) => void;
  onSettleUdhar: (billId: string) => void;
  onRecordPartPayment?: (payment: {
    billId?: string;
    customerName: string;
    customerPhone?: string;
    amount: number;
    paymentMethod: 'cash' | 'upi';
    notes?: string;
  }) => void;
  onViewBill?: (bill: Bill) => void;
  onDeleteBill?: (billId: string) => void;
  lang: 'hi' | 'en';
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  bills,
  products,
  settings,
  expenses = [],
  initialTab,
  onOpenExpenseModal,
  onDeleteExpense,
  onSettleUdhar,
  onRecordPartPayment,
  onViewBill,
  onDeleteBill,
  lang,
}) => {
  // Default tab is 'daily' (Bills) as requested
  const [activeReportTab, setActiveReportTab] = useState<
    'graphs' | 'daily' | 'expenses' | 'profit' | 'udhar' | 'stock' | 'collections'
  >(initialTab || 'daily');

  // Synchronize tab if navigated from outside (e.g. Dashboard Today's Collection click)
  useEffect(() => {
    if (initialTab) {
      setActiveReportTab(initialTab);
    }
  }, [initialTab]);

  const [udharFilterQuery, setUdharFilterQuery] = useState('');
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);

  // Customer Ledger Modal State
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<{ name: string; phone?: string } | null>(null);

  // Part Payment Modal State
  const [activePaymentTarget, setActivePaymentTarget] = useState<{
    bill: Bill | null;
    customerName: string;
    customerPhone?: string;
  } | null>(null);

  // Daily Sales calculation
  const totalSales = bills.reduce((acc, b) => acc + b.totalAmount, 0);

  // Collect all part payments across bills
  const allPartPayments: PaymentRecord[] = [];
  bills.forEach((b) => {
    if (b.payments && b.payments.length > 0) {
      allPartPayments.push(...b.payments);
    }
  });

  const partPaymentsCash = allPartPayments
    .filter((p) => p.paymentMethod === 'cash')
    .reduce((acc, p) => acc + p.amount, 0);
  const partPaymentsUpi = allPartPayments
    .filter((p) => p.paymentMethod === 'upi')
    .reduce((acc, p) => acc + p.amount, 0);
  const totalPartPaymentsCollected = allPartPayments.reduce((acc, p) => acc + p.amount, 0);

  const cashSales =
    bills
      .filter((b) => b.paymentMethod === 'cash')
      .reduce((acc, b) => acc + b.totalAmount, 0) + partPaymentsCash;

  const upiSales =
    bills
      .filter((b) => b.paymentMethod === 'upi')
      .reduce((acc, b) => acc + b.totalAmount, 0) + partPaymentsUpi;

  // True Pending Udhar (Total billed minus all part payments received)
  const udharTotal = bills
    .filter((b) => b.paymentMethod === 'udhar' && !b.isUdharPaid)
    .reduce((acc, b) => {
      const paid = b.paidAmount || 0;
      return acc + Math.max(0, b.totalAmount - paid);
    }, 0);

  // Total Udhar Recovered / Collected
  const udharRecoveredTotal = bills.reduce((acc, b) => {
    if (b.paymentMethod === 'udhar') {
      const paid = b.paidAmount || (b.isUdharPaid ? b.totalAmount : 0);
      return acc + paid;
    }
    return acc;
  }, 0);

  // Total Expenses calculation
  const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Udhar / Khata Bills
  const outstandingBills = useMemo(() => {
    let list = bills.filter((b) => b.paymentMethod === 'udhar' && !b.isUdharPaid);
    if (udharFilterQuery.trim()) {
      const q = udharFilterQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.customerName.toLowerCase().includes(q) ||
          (b.customerPhone && b.customerPhone.includes(q)) ||
          b.billNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [bills, udharFilterQuery]);

  // Bills search by customer name, bill number, or date
  const filteredBills = useMemo(() => {
    if (!billSearchQuery.trim()) return bills;
    const q = billSearchQuery.toLowerCase().trim();
    return bills.filter((b) => {
      const matchName = b.customerName.toLowerCase().includes(q);
      const matchPhone = b.customerPhone ? b.customerPhone.includes(q) : false;
      const matchBillNo = b.billNumber.toLowerCase().includes(q);

      const d = new Date(b.createdAt);
      const localDateStr = d.toLocaleDateString().toLowerCase();
      const isoStr = b.createdAt.toLowerCase();
      const monthNamesEn = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthName = monthNamesEn[d.getMonth()] || '';
      const dayStr = String(d.getDate());
      const yearStr = String(d.getFullYear());
      const customDateStr = `${dayStr} ${monthName} ${yearStr}`.toLowerCase();

      const matchDate =
        localDateStr.includes(q) ||
        isoStr.includes(q) ||
        customDateStr.includes(q);

      return matchName || matchPhone || matchBillNo || matchDate;
    });
  }, [bills, billSearchQuery]);

  // Stock Report metrics
  let totalGodownCartons = 0;
  let totalGodownPieces = 0;
  let totalStockPurchaseCost = 0;
  let totalStockSaleValue = 0;

  products.forEach((p) => {
    totalGodownPieces += p.totalPieces;
    const { cartons } = decomposePieces(p.totalPieces, p.packSize);
    totalGodownCartons += cartons;
    const costPerPiece = p.purchaseRateCarton / (p.packSize || 1);
    totalStockPurchaseCost += p.totalPieces * costPerPiece;
    totalStockSaleValue += p.totalPieces * p.salePricePiece;
  });

  return (
    <div className="space-y-3 pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {lang === 'hi' ? 'दुकान हिसाब-किताब (Business Reports)' : 'Store Reports & Khata'}
            </span>
            <h2 className="text-xl font-black mt-0.5 tracking-tight">
              ₹{totalSales.toLocaleString('en-IN')}
            </h2>
            <div className="text-xs text-slate-300 mt-0.5 flex flex-wrap gap-1.5 items-center">
              <span>{bills.length} Bills</span>
              <span>•</span>
              <span className="text-emerald-400">Cash: ₹{cashSales}</span>
              <span>•</span>
              <span className="text-blue-400">UPI: ₹{upiSales}</span>
              <span>•</span>
              <span className="text-rose-400 font-bold">Exp: ₹{totalExpenseAmount}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveReportTab('profit')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition active:scale-95 shadow-xs ${
                activeReportTab === 'profit'
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title="Profit Analysis"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'मुनाफ़ा' : 'Profit'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveReportTab('graphs')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition active:scale-95 shadow-xs ${
                activeReportTab === 'graphs'
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'ग्राफ़' : 'Graphs'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Selector Tabs - Horizontally Scrollable with larger tap targets */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth p-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl">
        {/* 1. Graphs */}
        <button
          type="button"
          onClick={() => setActiveReportTab('graphs')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95 transition ${
            activeReportTab === 'graphs'
              ? 'bg-emerald-600 text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'ग्राफ़' : 'Graphs'}</span>
        </button>

        {/* 2. Bills */}
        <button
          type="button"
          onClick={() => setActiveReportTab('daily')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95 transition ${
            activeReportTab === 'daily'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'बिल' : 'Bills'}</span>
        </button>

        {/* 3. Expenses */}
        <button
          type="button"
          onClick={() => setActiveReportTab('expenses')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95 transition ${
            activeReportTab === 'expenses'
              ? 'bg-rose-600 text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <ReceiptText className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'दुकान खर्च' : 'Expenses'}</span>
        </button>

        {/* 4. Profit Analysis (New Tab) */}
        <button
          type="button"
          onClick={() => setActiveReportTab('profit')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95 transition ${
            activeReportTab === 'profit'
              ? 'bg-emerald-700 text-white shadow-xs font-black ring-2 ring-emerald-400'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'मुनाफ़ा विश्लेषण' : 'Profit Analysis'}</span>
        </button>

        {/* 5. Udhar */}
        <button
          type="button"
          onClick={() => setActiveReportTab('udhar')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 relative active:scale-95 transition ${
            activeReportTab === 'udhar'
              ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'उधार' : 'Udhar'}</span>
          {outstandingBills.length > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] font-black bg-rose-600 text-white rounded-full">
              {outstandingBills.length}
            </span>
          )}
        </button>

        {/* 5. Stock */}
        <button
          type="button"
          onClick={() => setActiveReportTab('stock')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95 transition ${
            activeReportTab === 'stock'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'स्टॉक' : 'Stock'}</span>
        </button>

        {/* 6. Collections (Right next to Stock!) */}
        <button
          type="button"
          onClick={() => setActiveReportTab('collections')}
          className={`px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95 transition ${
            activeReportTab === 'collections'
              ? 'bg-teal-600 text-white shadow-xs font-black ring-2 ring-teal-400'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'कलेक्शन (वसूली)' : 'Collections'}</span>
        </button>
      </div>

      {/* 0. SALES & UDHARI GRAPHS TAB */}
      {activeReportTab === 'graphs' && (
        <div className="space-y-4">
          <RechartsAnalyticsSection
            bills={bills}
            products={products}
            expenses={expenses}
            onOpenExpenseModal={onOpenExpenseModal}
            lang={lang}
          />

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide block px-1">
              {lang === 'hi' ? 'दैनिक/मासिक/तिमाही तुलना व उधार ट्रैकर' : 'Timeframe Filters & Udhar Tracker'}
            </span>
            <SalesAnalyticsGraphs
              bills={bills}
              products={products}
              settings={settings}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeReportTab === 'expenses' && (
        <div className="space-y-3">
          {/* Expense KPI Banner */}
          <div className="bg-gradient-to-r from-rose-600 to-amber-600 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-100 uppercase tracking-wide">
                {lang === 'hi' ? 'कुल दर्ज दुकान खर्च' : 'Total Recorded Expenses'}
              </span>
              <div className="text-xl font-black mt-0.5">
                ₹{totalExpenseAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-rose-100 mt-0.5">
                {expenses.length} {lang === 'hi' ? 'खर्च प्रविष्टियाँ (चाय, भाड़ा, मजदूरी)' : 'entries logged'}
              </div>
            </div>

            {onOpenExpenseModal && (
              <button
                type="button"
                onClick={onOpenExpenseModal}
                className="bg-white text-rose-700 hover:bg-rose-50 text-xs font-black px-3 py-2 rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-rose-600" />
                <span>{lang === 'hi' ? 'नया खर्च' : 'Add Expense'}</span>
              </button>
            )}
          </div>

          {/* Category breakdown pills */}
          <div className="grid grid-cols-3 gap-2">
            {EXPENSE_CATEGORIES.slice(0, 3).map((cat) => {
              const catTotal = expenses
                .filter((e) => e.category === cat.key)
                .reduce((acc, curr) => acc + curr.amount, 0);
              const Icon = cat.icon;
              return (
                <div
                  key={cat.key}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-2.5 text-center shadow-2xs"
                >
                  <div className="flex items-center justify-center mb-1">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cat.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                    {lang === 'hi' ? cat.labelHi : cat.labelEn}
                  </span>
                  <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                    ₹{catTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expenses Log List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                {lang === 'hi' ? 'खर्च सूची (All Expenses)' : `All Expenses (${expenses.length})`}
              </span>
              {onOpenExpenseModal && (
                <button
                  type="button"
                  onClick={onOpenExpenseModal}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'खर्च जोड़ें' : 'Add New'}</span>
                </button>
              )}
            </div>

            {expenses.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center text-slate-400">
                <ReceiptText className="w-8 h-8 mx-auto mb-2 opacity-40 text-rose-500" />
                <p className="font-semibold text-xs">
                  {lang === 'hi' ? 'कोई दुकान खर्च दर्ज नहीं है।' : 'No expenses recorded.'}
                </p>
                {onOpenExpenseModal && (
                  <button
                    type="button"
                    onClick={onOpenExpenseModal}
                    className="mt-3 px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1 mx-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'खर्च दर्ज करें' : 'Record Expense'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp) => {
                  const catConfig = EXPENSE_CATEGORIES.find((c) => c.key === exp.category) || EXPENSE_CATEGORIES[6];
                  const Icon = catConfig.icon;
                  return (
                    <div
                      key={exp.id}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${catConfig.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {exp.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            <span>{new Date(exp.date || exp.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            <span>•</span>
                            <span className="uppercase text-[9px] font-bold px-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {exp.paymentMethod}
                            </span>
                            {exp.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[120px]">{exp.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                            -₹{exp.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        {onDeleteExpense && (
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROFIT ANALYSIS TAB (Total Revenue vs Total Expenses for chosen date range) */}
      {activeReportTab === 'profit' && (
        <ProfitAnalysisSection
          bills={bills}
          products={products}
          expenses={expenses}
          settings={settings}
          onOpenExpenseModal={onOpenExpenseModal}
          lang={lang}
        />
      )}

      {/* 1. DAILY SALES REPORT */}
      {activeReportTab === 'daily' && (
        <div className="space-y-3">
          {/* Sales Breakdown by Mode */}
          <div className="grid grid-cols-4 gap-1.5">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">CASH (नकद)</span>
              <div className="text-sm font-black text-emerald-950 dark:text-white mt-0.5">₹{cashSales.toLocaleString('en-IN')}</div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase block">UPI (ऑनलाइन)</span>
              <div className="text-sm font-black text-blue-950 dark:text-white mt-0.5">₹{upiSales.toLocaleString('en-IN')}</div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase block">UDHAR (बाकी)</span>
              <div className="text-sm font-black text-amber-950 dark:text-white mt-0.5">₹{udharTotal.toLocaleString('en-IN')}</div>
            </div>

            <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase block">JAMA (वसूली)</span>
              <div className="text-sm font-black text-teal-950 dark:text-white mt-0.5">₹{udharRecoveredTotal.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Bills Search Bar */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder={
                  lang === 'hi'
                    ? 'ग्राहक का नाम, बिल नं (#INV...) या तारीख से खोजें...'
                    : 'Search bills by customer name, bill #, or date...'
                }
                value={billSearchQuery}
                onChange={(e) => setBillSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
              {billSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBillSearchQuery('')}
                  className="absolute right-2.5 top-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setBillSearchQuery('')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition shrink-0 ${
                  billSearchQuery === ''
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {lang === 'hi' ? 'सभी बिल' : 'All Bills'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const day = String(today.getDate());
                  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                  setBillSearchQuery(`${day} ${monthNames[today.getMonth()]}`);
                }}
                className="px-2.5 py-1 rounded-lg font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 shrink-0"
              >
                {lang === 'hi' ? 'आज के बिल (Today)' : "Today's Bills"}
              </button>

              <button
                type="button"
                onClick={() => setBillSearchQuery('udhar')}
                className="px-2.5 py-1 rounded-lg font-bold bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 hover:border-amber-400 shrink-0"
              >
                {lang === 'hi' ? 'उधार बिल (Udhar)' : 'Udhar Bills'}
              </button>

              <button
                type="button"
                onClick={() => setBillSearchQuery('cash')}
                className="px-2.5 py-1 rounded-lg font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 shrink-0"
              >
                Cash
              </button>

              <button
                type="button"
                onClick={() => setBillSearchQuery('upi')}
                className="px-2.5 py-1 rounded-lg font-bold bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-400 shrink-0"
              >
                UPI
              </button>
            </div>
          </div>

          {/* Bills Log List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">
                {billSearchQuery
                  ? lang === 'hi'
                    ? `खोज परिणाम: ${filteredBills.length} / ${bills.length} बिल`
                    : `Search Results: ${filteredBills.length} of ${bills.length} bills`
                  : lang === 'hi'
                  ? `सभी बिक्री बिल (${bills.length})`
                  : `All Sales Bills (${bills.length})`}
              </span>
              <span className="text-[10px] text-slate-400">
                {lang === 'hi' ? 'क्लिक करके बिल देखें / प्रिंट करें' : 'Click to view & print bill'}
              </span>
            </div>

            {filteredBills.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                <ReceiptText className="w-8 h-8 mx-auto opacity-40 text-emerald-600" />
                <p className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                  {lang === 'hi'
                    ? `"${billSearchQuery}" से संबंधित कोई बिल नहीं मिला।`
                    : `No bills found matching "${billSearchQuery}".`}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {lang === 'hi'
                    ? 'कृपया ग्राहक का नाम, बिल नंबर या तारीख जांचें।'
                    : 'Check customer name, bill number, or date.'}
                </p>
                <button
                  type="button"
                  onClick={() => setBillSearchQuery('')}
                  className="mt-2 px-3.5 py-1.5 bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-xs active:scale-95 transition"
                >
                  {lang === 'hi' ? 'खोज रीसेट करें (Show All)' : 'Clear Search (Show All)'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBills.map((bill) => {
                const isUdhar = bill.paymentMethod === 'udhar';
                const paid = bill.paidAmount || (bill.isUdharPaid ? bill.totalAmount : 0);
                const remaining = Math.max(0, bill.totalAmount - paid);
                const isFullyPaid = !isUdhar || bill.isUdharPaid || remaining === 0;
                const isPartPaid = isUdhar && paid > 0 && remaining > 0;

                return (
                  <div
                    key={bill.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs space-y-2 hover:border-emerald-300 dark:hover:border-emerald-700 transition"
                  >
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => onViewBill && onViewBill(bill)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {bill.customerName}
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                              !isUdhar
                                ? bill.paymentMethod === 'upi'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : isFullyPaid
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : isPartPaid
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {!isUdhar
                              ? bill.paymentMethod
                              : isFullyPaid
                              ? (lang === 'hi' ? 'उधार चुकता' : 'Paid / Settled')
                              : isPartPaid
                              ? (lang === 'hi' ? `जमा ₹${paid}` : `Paid ₹${paid}`)
                              : (lang === 'hi' ? 'उधार बाकी' : 'Udhar Due')}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {bill.billNumber} • {new Date(bill.createdAt).toLocaleDateString()} {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="text-right">
                        {isPartPaid ? (
                          <>
                            <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                              ₹{remaining.toLocaleString('en-IN')} <span className="text-[10px] font-bold">{lang === 'hi' ? 'बाकी' : 'Due'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                              {lang === 'hi' ? `बिल ₹${bill.totalAmount} (₹${paid} जमा)` : `Total ₹${bill.totalAmount} (₹${paid} paid)`}
                            </div>
                          </>
                        ) : isUdhar && !isFullyPaid ? (
                          <>
                            <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                              ₹{bill.totalAmount.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                              {lang === 'hi' ? 'पूरा बकाया' : 'Full Pending'}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                              ₹{bill.totalAmount.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {bill.items.length} items {isUdhar && isFullyPaid ? '• Cleared' : ''}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Part payment history logs inside bill if any */}
                    {bill.payments && bill.payments.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] space-y-1">
                        <div className="flex justify-between font-bold text-teal-700 dark:text-teal-400">
                          <span>{bill.payments.length} {lang === 'hi' ? 'किश्त जमा प्राप्त हुई' : 'Part Payments Received'}</span>
                          <span>+₹{(bill.paidAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 truncate">
                          {bill.payments.map((p) => `+₹${p.amount} (${p.paymentMethod})`).join(' • ')}
                        </div>
                      </div>
                    )}

                    {/* Actions for this bill */}
                    {deletingBillId === bill.id ? (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="text-[11px] font-bold text-rose-900 dark:text-rose-200 block truncate">
                              {lang === 'hi' ? 'गलत बिल हटाएं?' : 'Delete wrong bill?'}
                            </span>
                            <span className="text-[10px] text-rose-700 dark:text-rose-400 block">
                              {lang === 'hi' ? 'सामान गोदाम स्टॉक में वापस जुड़ जाएगा।' : 'Items will be restored to godown stock.'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (onDeleteBill) onDeleteBill(bill.id);
                                setDeletingBillId(null);
                              }}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-lg shadow-xs active:scale-95 transition"
                            >
                              {lang === 'hi' ? 'हटाएं' : 'Delete'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingBillId(null)}
                              className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg active:scale-95 transition"
                            >
                              {lang === 'hi' ? 'रद्द' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate max-w-[140px]">
                          {bill.items
                            .map((i) => {
                              let qty = '';
                              if (i.cartonQty > 0 && i.pieceQty > 0) {
                                qty = `${i.cartonQty} Box + ${i.pieceQty} Ladi`;
                              } else if (i.cartonQty > 0) {
                                qty = `${i.cartonQty} Box`;
                              } else {
                                qty = `${i.pieceQty} Ladi`;
                              }
                              return `${qty} ${i.productName}`;
                            })
                            .join(', ')}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isUdhar && !isFullyPaid && (
                            <>
                              <button
                                type="button"
                                onClick={() => setActivePaymentTarget({ bill, customerName: bill.customerName, customerPhone: bill.customerPhone })}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-lg text-[10px] font-black shadow-xs flex items-center gap-1 transition"
                                title={lang === 'hi' ? 'पार्ट पेमेंट जमा करें' : 'Record Part Payment'}
                              >
                                <Wallet className="w-3 h-3" />
                                <span>{lang === 'hi' ? 'किश्त' : 'Part Pay'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onSettleUdhar(bill.id)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-[10px] font-black shadow-xs flex items-center gap-1 transition"
                                title={lang === 'hi' ? 'पूर्ण चुकता' : 'Full Settle'}
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>{lang === 'hi' ? 'चुकता' : 'Settle'}</span>
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => onViewBill && onViewBill(bill)}
                            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition active:scale-95"
                            title="View / Print Bill"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => shareViaWhatsApp(bill, settings)}
                            className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 transition active:scale-95"
                            title="WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => generateBillPDF(bill, settings)}
                            className="p-1.5 rounded-lg text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 transition active:scale-95"
                            title="PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteBill && (
                            <button
                              type="button"
                              onClick={() => setDeletingBillId(bill.id)}
                              className="p-1.5 rounded-lg text-rose-600 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 transition active:scale-95"
                              title={lang === 'hi' ? 'गलत बिल हटाएं' : 'Delete Bill'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>
      )}

      {/* 2. UDHAR KHATA REPORT */}
      {activeReportTab === 'udhar' && (
        <div className="space-y-3">
          {/* Outstanding Banner */}
          <div className="bg-amber-500 text-slate-950 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wide">
                Total Pending Udhar (कुल बकाया)
              </span>
              <div className="text-2xl font-black mt-0.5">
                ₹{udharTotal.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right text-xs font-bold text-amber-950">
              {outstandingBills.length} Customers Unpaid
            </div>
          </div>

          {/* Search Khata */}
          <input
            type="text"
            placeholder="Search customer name or phone..."
            value={udharFilterQuery}
            onChange={(e) => setUdharFilterQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />

          {/* Udhar List */}
          <div className="space-y-2">
            {outstandingBills.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500 space-y-1">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">No Pending Udhar!</p>
                <p className="text-[11px] text-slate-400">All customers have settled their credit balance.</p>
              </div>
            ) : (
              outstandingBills.map((bill) => {
                const paid = bill.paidAmount || 0;
                const remaining = Math.max(0, bill.totalAmount - paid);

                return (
                  <div
                    key={bill.id}
                    className="bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-3.5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          {bill.customerName}
                        </h4>
                        {bill.customerPhone && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{bill.customerPhone}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {bill.billNumber} • {new Date(bill.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase">
                          {paid > 0 ? (lang === 'hi' ? 'बाकी बकाया' : 'Remaining Due') : (lang === 'hi' ? 'कुल बकाया' : 'Pending')}
                        </span>
                        <div className="text-base font-black text-rose-600 dark:text-rose-400">
                          ₹{remaining.toLocaleString('en-IN')}
                        </div>
                        {paid > 0 && (
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block">
                            ₹{paid} {lang === 'hi' ? 'जमा' : 'paid'} (कुल ₹{bill.totalAmount})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Part payment history logs if any */}
                    {bill.payments && bill.payments.length > 0 && (
                      <div className="bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40 text-[10px] space-y-1">
                        <div className="flex justify-between font-bold text-amber-900 dark:text-amber-300">
                          <span>{bill.payments.length} {lang === 'hi' ? 'किश्त जमा प्राप्त हुई' : 'Part Payments Received'}</span>
                          <span className="text-teal-600 dark:text-teal-400">+₹{(bill.paidAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 truncate">
                          {bill.payments.map((p) => `+₹${p.amount} (${p.paymentMethod})`).join(' • ')}
                        </div>
                      </div>
                    )}

                  {/* Settle Udhar Action Button */}
                  {deletingBillId === bill.id ? (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="p-2 bg-rose-50 border border-rose-300 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
                        <span className="text-[11px] font-bold text-rose-800">
                          {lang === 'hi' ? 'उधार बिल हटाएं और माल वापस लें?' : 'Delete udhar bill & restore stock?'}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteBill) onDeleteBill(bill.id);
                              setDeletingBillId(null);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded shadow-xs active:scale-95 transition"
                          >
                            {lang === 'hi' ? 'हटाएं' : 'Delete'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingBillId(null)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded active:scale-95 transition"
                          >
                            {lang === 'hi' ? 'रद्द' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLedgerCustomer({ name: bill.customerName, phone: bill.customerPhone })}
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition active:scale-95"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                        <span>{lang === 'hi' ? 'खाता लेजर' : 'Ledger'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePaymentTarget({ bill, customerName: bill.customerName, customerPhone: bill.customerPhone })}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-lg text-xs font-black shadow-xs flex items-center gap-1 transition"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'पार्ट पेमेंट' : 'Part Pay'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSettleUdhar(bill.id)}
                        className="flex-1 min-w-[100px] py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-black shadow-xs flex items-center justify-center gap-1 transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'पूर्ण चुकता' : 'Full Settle'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => shareViaWhatsApp(bill, settings)}
                        className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 transition active:scale-95"
                        title="WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteBill && (
                        <button
                          type="button"
                          onClick={() => setDeletingBillId(bill.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 dark:border-rose-900 rounded-lg transition active:scale-95"
                          title={lang === 'hi' ? 'उधार बिल हटाएं' : 'Delete Udhar Bill'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        </div>
      )}

      {/* 2.5 COLLECTIONS & CUSTOMER KHATA SECTION */}
      {activeReportTab === 'collections' && (
        <div className="space-y-3">
          {/* Collection Banner & KPI Summary */}
          <div className="bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-900 text-white rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal-200 uppercase tracking-wide">
                  {lang === 'hi' ? 'ग्राहक कलेक्शन व वसूली रिकॉर्ड' : 'Customer Collections & Ledger'}
                </span>
                <div className="text-2xl font-black mt-0.5 tracking-tight text-white">
                  ₹{totalPartPaymentsCollected.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-teal-100 mt-0.5 font-medium">
                  {lang === 'hi'
                    ? 'उधारी से कुल वसूली गई राशि (Total Collected Money)'
                    : 'Total Part Payments Collected from Customers'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePaymentTarget({ bill: null, customerName: '', customerPhone: '' })}
                className="px-3 py-2 bg-white text-teal-900 hover:bg-teal-50 text-xs font-black rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-teal-600" />
                <span>{lang === 'hi' ? 'रुपये जमा करें' : 'Record Pay'}</span>
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-teal-600/50 text-[11px]">
              <div className="bg-black/20 p-2 rounded-xl">
                <span className="text-[10px] text-teal-200 block font-bold">
                  {lang === 'hi' ? 'आज का कलेक्शन' : "Today's Collection"}
                </span>
                <span className="font-black text-sm text-emerald-300">
                  ₹{allPartPayments
                    .filter((p) => new Date(p.createdAt || p.date).toDateString() === new Date().toDateString())
                    .reduce((acc, p) => acc + p.amount, 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-black/20 p-2 rounded-xl">
                <span className="text-[10px] text-teal-200 block font-bold">
                  {lang === 'hi' ? 'नकद जमा (Cash)' : 'Cash Collected'}
                </span>
                <span className="font-black text-sm text-white">
                  ₹{partPaymentsCash.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-black/20 p-2 rounded-xl">
                <span className="text-[10px] text-teal-200 block font-bold">
                  {lang === 'hi' ? 'UPI जमा (Online)' : 'UPI Collected'}
                </span>
                <span className="font-black text-sm text-teal-200">
                  ₹{partPaymentsUpi.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={
                lang === 'hi'
                  ? 'ग्राहक का नाम या मोबाइल नंबर खोजें...'
                  : 'Search customer collection by name or phone...'
              }
              value={udharFilterQuery}
              onChange={(e) => setUdharFilterQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs"
            />
          </div>

          {/* Customer Collections List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>
                  {lang === 'hi'
                    ? 'ग्राहक अनुसार कुल कलेक्शन (Tap to Open Ledger)'
                    : 'Customer Collection History (Tap to Open Ledger)'}
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {lang === 'hi' ? 'लेजर देखने हेतु टैप करें' : 'Tap card for full ledger'}
              </span>
            </div>

            {/* Derive customer collection details */}
            {(() => {
              const customerMap = new Map<
                string,
                {
                  name: string;
                  phone?: string;
                  totalBought: number;
                  totalPaid: number;
                  totalDue: number;
                  billsCount: number;
                  pendingBillsCount: number;
                  partPaymentsCount: number;
                  partPaymentCash: number;
                  partPaymentUpi: number;
                  totalCollected: number;
                  lastPaymentDate: string;
                  latestPaymentNote?: string;
                }
              >();

              bills.forEach((b) => {
                const key = b.customerName.trim().toLowerCase();
                if (!key) return;
                const existing = customerMap.get(key) || {
                  name: b.customerName,
                  phone: b.customerPhone,
                  totalBought: 0,
                  totalPaid: 0,
                  totalDue: 0,
                  billsCount: 0,
                  pendingBillsCount: 0,
                  partPaymentsCount: 0,
                  partPaymentCash: 0,
                  partPaymentUpi: 0,
                  totalCollected: 0,
                  lastPaymentDate: b.createdAt,
                  latestPaymentNote: undefined,
                };

                existing.billsCount += 1;
                existing.totalBought += b.totalAmount;
                if (!existing.phone && b.customerPhone) existing.phone = b.customerPhone;

                // Process part payments attached to this bill
                if (b.payments && b.payments.length > 0) {
                  b.payments.forEach((p) => {
                    existing.partPaymentsCount += 1;
                    existing.totalCollected += p.amount;
                    if (p.paymentMethod === 'cash') {
                      existing.partPaymentCash += p.amount;
                    } else {
                      existing.partPaymentUpi += p.amount;
                    }
                    if (
                      !existing.lastPaymentDate ||
                      new Date(p.createdAt || p.date) > new Date(existing.lastPaymentDate)
                    ) {
                      existing.lastPaymentDate = p.createdAt || p.date;
                      if (p.notes) existing.latestPaymentNote = p.notes;
                    }
                  });
                }

                if (b.paymentMethod === 'udhar') {
                  const paid = b.paidAmount || (b.isUdharPaid ? b.totalAmount : 0);
                  const due = Math.max(0, b.totalAmount - paid);
                  existing.totalPaid += paid;
                  existing.totalDue += due;
                  if (due > 0 && !b.isUdharPaid) {
                    existing.pendingBillsCount += 1;
                  }
                  // If settled fully without granular payments array
                  if (b.isUdharPaid && (!b.payments || b.payments.length === 0)) {
                    existing.totalCollected += b.totalAmount;
                  }
                } else {
                  // Direct cash or UPI sale is also collected at billing time
                  existing.totalPaid += b.totalAmount;
                  existing.totalCollected += b.totalAmount;
                  if (b.paymentMethod === 'cash') {
                    existing.partPaymentCash += b.totalAmount;
                  } else {
                    existing.partPaymentUpi += b.totalAmount;
                  }
                }

                if (new Date(b.createdAt) > new Date(existing.lastPaymentDate)) {
                  existing.lastPaymentDate = b.createdAt;
                }

                customerMap.set(key, existing);
              });

              let customerList = Array.from(customerMap.values());
              if (udharFilterQuery.trim()) {
                const q = udharFilterQuery.toLowerCase();
                customerList = customerList.filter(
                  (c) =>
                    c.name.toLowerCase().includes(q) ||
                    (c.phone && c.phone.includes(q))
                );
              }

              // Sort by highest total collected amount first
              customerList.sort((a, b) => b.totalCollected - a.totalCollected);

              if (customerList.length === 0) {
                return (
                  <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center text-slate-400">
                    <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40 text-teal-600" />
                    <p className="font-bold text-xs">
                      {lang === 'hi' ? 'कोई कलेक्शन रिकॉर्ड नहीं मिला।' : 'No collection records found.'}
                    </p>
                  </div>
                );
              }

              return customerList.map((cust, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedLedgerCustomer({ name: cust.name, phone: cust.phone })}
                  className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xs hover:border-teal-500 hover:shadow-md cursor-pointer transition active:scale-99 space-y-2.5 group"
                >
                  {/* Customer Info & Prominent Collected Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 font-black text-sm group-hover:scale-105 transition">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                            {cust.name}
                          </h4>
                          {cust.pendingBillsCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              {cust.pendingBillsCount} {lang === 'hi' ? 'बिल बकाया' : 'due'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {cust.phone && <span className="font-semibold">{cust.phone}</span>}
                          {cust.phone && <span>•</span>}
                          <span>
                            {cust.partPaymentsCount > 0
                              ? `${cust.partPaymentsCount} ${lang === 'hi' ? 'किश्तें जमा' : 'payments'}`
                              : `${cust.billsCount} ${lang === 'hi' ? 'बिल कटे' : 'bills'}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Collection Amount */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase block tracking-wider">
                        {lang === 'hi' ? 'कुल जमा (Collected)' : 'Total Collected'}
                      </span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">
                        ₹{cust.totalCollected.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Payment Details & Due Balance Strip */}
                  <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl flex items-center justify-between text-[11px] gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded">
                        Cash: ₹{cust.partPaymentCash.toLocaleString('en-IN')}
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded">
                        UPI: ₹{cust.partPaymentUpi.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      {cust.totalDue > 0 ? (
                        <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                          {lang === 'hi' ? 'बाकी:' : 'Due:'} ₹{cust.totalDue.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>All Clear</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Action: Tap to view ledger & date */}
                  <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400 dark:text-slate-500">
                    <span>
                      {cust.lastPaymentDate
                        ? `${lang === 'hi' ? 'अंतिम जमा' : 'Last Payment'}: ${new Date(
                            cust.lastPaymentDate
                          ).toLocaleDateString([], {
                            day: 'numeric',
                            month: 'short',
                          })}`
                        : ''}
                    </span>

                    <span className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-0.5 group-hover:underline">
                      <BookOpen className="w-3 h-3" />
                      <span>{lang === 'hi' ? 'खाता लेजर खोलें →' : 'View Full Ledger →'}</span>
                    </span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* 3. STOCK VALUATION REPORT */}
      {activeReportTab === 'stock' && (
        <div className="space-y-3">
          {/* Stock Metrics Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Godown Stock Valuation (माल का कुल मूल्य)
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Boxes (कुल बॉक्स)</span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">{totalGodownCartons} Boxes</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Ladi (कुल लड़ी)</span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">{totalGodownPieces.toLocaleString('en-IN')} Ladi</span>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-lg">
                <span className="text-[10px] font-bold text-blue-800 uppercase block">Purchase Cost</span>
                <span className="text-base font-black text-blue-950 mt-0.5 block">₹{Math.round(totalStockPurchaseCost).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Selling Value</span>
                <span className="text-base font-black text-emerald-950 mt-0.5 block">₹{Math.round(totalStockSaleValue).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-100 uppercase">Potential Godown Profit</span>
                <div className="text-lg font-black mt-0.5">
                  ₹{Math.round(totalStockSaleValue - totalStockPurchaseCost).toLocaleString('en-IN')}
                </div>
              </div>
              <span className="text-xs font-extrabold bg-white/20 px-2 py-1 rounded">
                +{(((totalStockSaleValue - totalStockPurchaseCost) / (totalStockPurchaseCost || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Product-wise Stock Table */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block px-1">
              Product-wise Inventory Breakdown
            </span>
            <div className="space-y-1.5">
              {products.map((p) => {
                const { cartons, loosePieces } = decomposePieces(p.totalPieces, p.packSize);
                const costPerPiece = p.purchaseRateCarton / (p.packSize || 1);
                const totalCost = p.totalPieces * costPerPiece;
                return (
                  <div
                    key={p.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-slate-900 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Pack: 1 Box = {p.packSize} Ladi • {cartons} Box + {loosePieces} Ladi
                      </div>
                    </div>
                    <div className="text-right pl-2">
                      <div className="font-bold text-slate-900">{p.totalPieces} Ladi</div>
                      <div className="text-[10px] text-slate-500">₹{Math.round(totalCost)} cost</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER LEDGER MODAL */}
      {selectedLedgerCustomer && (
        <CustomerLedgerModal
          isOpen={Boolean(selectedLedgerCustomer)}
          onClose={() => setSelectedLedgerCustomer(null)}
          customerName={selectedLedgerCustomer.name}
          customerPhone={selectedLedgerCustomer.phone}
          bills={bills}
          onOpenPartPayment={(targetBill, name, phone) => {
            setActivePaymentTarget({
              bill: targetBill,
              customerName: name,
              customerPhone: phone,
            });
          }}
          onViewBill={onViewBill}
          lang={lang}
        />
      )}

      {/* PART PAYMENT COLLECTION MODAL */}
      {activePaymentTarget && (
        <PartPaymentModal
          isOpen={Boolean(activePaymentTarget)}
          onClose={() => setActivePaymentTarget(null)}
          bill={activePaymentTarget.bill}
          customerName={activePaymentTarget.customerName}
          customerPhone={activePaymentTarget.customerPhone}
          bills={bills}
          onRecordPayment={(payment) => {
            if (onRecordPartPayment) {
              onRecordPartPayment(payment);
            }
          }}
          onSettleUdhar={onSettleUdhar}
          lang={lang}
        />
      )}
    </div>
  );
};
