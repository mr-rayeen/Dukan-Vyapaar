import React from 'react';
import { Bill, Expense, PaymentRecord, Product, ShopSettings } from '../../types';
import { decomposePieces, isLowStock } from '../../utils/stockLogic';
import { TabKey } from '../layout/BottomNavigation';
import {
  TrendingUp,
  Receipt,
  Boxes,
  AlertTriangle,
  PlusCircle,
  Camera,
  Share2,
  ChevronRight,
  Clock,
  UserCheck,
  CreditCard,
  ReceiptText,
  Plus,
  Wallet,
  ArrowDownRight,
  User,
} from 'lucide-react';
import { shareViaWhatsApp } from '../../utils/printerService';

interface DashboardScreenProps {
  products: Product[];
  bills: Bill[];
  settings: ShopSettings;
  expenses?: Expense[];
  onOpenExpenseModal?: () => void;
  lang: 'hi' | 'en';
  onNavigate: (
    tab: TabKey,
    subTab?: 'graphs' | 'daily' | 'expenses' | 'profit' | 'udhar' | 'stock' | 'collections'
  ) => void;
  onOpenAddProduct: () => void;
  onViewBill: (bill: Bill) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  products,
  bills,
  settings,
  expenses = [],
  onOpenExpenseModal,
  lang,
  onNavigate,
  onOpenAddProduct,
  onViewBill,
}) => {
  // Calculations for Today
  const todayStr = new Date().toDateString();
  const todayBills = bills.filter((b) => new Date(b.createdAt).toDateString() === todayStr);

  const todaySales = todayBills.reduce((acc, b) => acc + b.totalAmount, 0);

  // Today's Part Payments & Customer Collections received from credit/udhar customers
  const todayPaymentsList: PaymentRecord[] = [];
  bills.forEach((b) => {
    if (b.payments && b.payments.length > 0) {
      b.payments.forEach((p) => {
        if (new Date(p.date || p.createdAt).toDateString() === todayStr) {
          todayPaymentsList.push(p);
        }
      });
    }
  });
  todayPaymentsList.sort(
    (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );

  const todayCollectedTotal = todayPaymentsList.reduce((acc, p) => acc + p.amount, 0);

  // Today's shop expenses
  const todayExpensesList = expenses.filter(
    (e) => new Date(e.date || e.createdAt).toDateString() === todayStr
  );
  const todayExpensesTotal = todayExpensesList.reduce((acc, e) => acc + e.amount, 0);

  // Profit calculation for today (Gross vs True Net)
  let todayGrossProfit = 0;
  todayBills.forEach((bill) => {
    bill.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && prod.packSize > 0) {
        const costPerPiece = prod.purchaseRateCarton / prod.packSize;
        const totalPiecesSold = item.totalPieces;
        const totalCost = costPerPiece * totalPiecesSold;
        todayGrossProfit += item.totalAmount - totalCost;
      }
    });
  });
  if (todayGrossProfit < 0) todayGrossProfit = 0;

  // True Net Profit: Gross Profit minus operating expenses
  const todayNetProfit = todayGrossProfit - todayExpensesTotal;

  // Total Stock Value & Cartons
  let totalStockPieces = 0;
  let totalStockValuePurchase = 0;
  let totalCartonsEquivalent = 0;

  products.forEach((p) => {
    totalStockPieces += p.totalPieces;
    const { cartons, loosePieces } = decomposePieces(p.totalPieces, p.packSize);
    totalCartonsEquivalent += cartons;
    const costPerPiece = p.purchaseRateCarton / (p.packSize || 1);
    totalStockValuePurchase += p.totalPieces * costPerPiece;
  });

  // Low stock products count
  const lowStockProducts = products.filter((p) => isLowStock(p.totalPieces, p.lowStockThresholdPieces));

  // Outstanding Udhar
  const outstandingUdharBills = bills.filter((b) => b.paymentMethod === 'udhar' && !b.isUdharPaid);
  const totalUdharAmount = outstandingUdharBills.reduce((acc, b) => {
    const paid = b.paidAmount || 0;
    return acc + Math.max(0, b.totalAmount - paid);
  }, 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Banner / Greeting */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-3.5 text-white shadow-md">
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-emerald-200 tracking-wider uppercase">
              {lang === 'hi' ? 'आज का कारोबार' : "Today's Business"}
            </span>
            <h2 className="text-xl font-black mt-0.5 tracking-tight truncate">
              ₹{todaySales.toLocaleString('en-IN')}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-emerald-100 flex-wrap">
              <span>{todayBills.length} {lang === 'hi' ? 'बिल' : 'Bills'}</span>
              <span>•</span>
              <span
                onClick={() => onNavigate('reports', 'profit')}
                className="font-bold text-amber-200 cursor-pointer hover:underline flex items-center gap-0.5"
                title="View Profit Analysis"
              >
                ₹{Math.round(todayNetProfit).toLocaleString('en-IN')} {lang === 'hi' ? 'शुद्ध मुनाफा' : 'Net'}
                <ArrowDownRight className="w-2.5 h-2.5 rotate-[-45deg]" />
              </span>
              {todayExpensesTotal > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-200 text-[10px]">
                    -₹{todayExpensesTotal} {lang === 'hi' ? 'खर्च' : 'Exp'}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenExpenseModal && (
              <button
                type="button"
                onClick={onOpenExpenseModal}
                className="bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs px-2.5 py-2 rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1 shrink-0 whitespace-nowrap"
                title="Record Shop Expense"
              >
                <ReceiptText className="w-3.5 h-3.5 text-rose-200" />
                <span className="text-[11px]">{lang === 'hi' ? 'खर्च' : 'Expense'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('billing')}
              className="bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold text-xs px-3 py-2 rounded-xl shadow-md active:scale-95 transition flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">{lang === 'hi' ? 'नया बिल' : '+ New Bill'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Today's Collections from Customers */}
        <div
          onClick={() => onNavigate('reports', 'collections')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs hover:border-teal-400 cursor-pointer transition active:scale-98"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              {lang === 'hi' ? 'आज का कलेक्शन' : "Today's Collection"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            ₹{todayCollectedTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex items-center justify-between">
            <span>{todayPaymentsList.length} {lang === 'hi' ? 'जमा भुगतान' : 'part payments'}</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
              {lang === 'hi' ? 'कलेक्शन देखें' : 'View Collections'}
            </span>
          </div>
        </div>

        {/* Daily Expenses KPI Card */}
        <div
          onClick={onOpenExpenseModal}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs hover:border-rose-400 cursor-pointer transition active:scale-98"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              {lang === 'hi' ? 'आज का खर्च' : "Today's Expense"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            ₹{todayExpensesTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex items-center justify-between">
            <span>{todayExpensesList.length} {lang === 'hi' ? 'खर्च' : 'entries'}</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold hover:underline">+ {lang === 'hi' ? 'जोड़ें' : 'Add'}</span>
          </div>
        </div>

        {/* Total Stock Value */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition active:scale-98"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              {lang === 'hi' ? 'स्टॉक वैल्यू' : 'Stock Value'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
            ₹{Math.round(totalStockValuePurchase).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {totalCartonsEquivalent} {lang === 'hi' ? 'बॉक्स माल' : 'Boxes in Godown'}
          </div>
        </div>

        {/* Total Outstanding Udhar */}
        <div
          onClick={() => onNavigate('reports', 'udhar')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs hover:border-amber-400 cursor-pointer transition active:scale-98"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              {lang === 'hi' ? 'उधार खाता' : 'Udhar Khata'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-amber-700 dark:text-amber-400 mt-1">
            ₹{totalUdharAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {outstandingUdharBills.length} {lang === 'hi' ? 'ग्राहकों का बकाया' : 'Unpaid Bills'}
          </div>
        </div>

        {/* Master Products Count */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs hover:border-emerald-400 cursor-pointer transition active:scale-98"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              {lang === 'hi' ? 'प्रोडक्ट मास्टर' : 'Master Products'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
            {products.length}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {lang === 'hi' ? 'कस्टम पैक साइज सेट' : 'Custom Pack Sizes'}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs hover:border-orange-400 cursor-pointer transition active:scale-98"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              {lang === 'hi' ? 'कम स्टॉक' : 'Low Stock'}
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                lowStockProducts.length > 0
                  ? 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400'
                  : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-lg font-extrabold mt-1 ${
              lowStockProducts.length > 0
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {lowStockProducts.length}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {lowStockProducts.length > 0
              ? (lang === 'hi' ? 'आइटम जल्द मंगवाएं' : 'Needs Reorder')
              : (lang === 'hi' ? 'स्टॉक पर्याप्त है' : 'All Stock OK')}
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2 px-1">
          {lang === 'hi' ? 'त्वरित कार्य (Quick Actions)' : 'Quick Actions'}
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {/* Scan Bill */}
          <button
            type="button"
            onClick={() => onNavigate('scan')}
            className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-2xs active:scale-95 transition hover:border-blue-300"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-1">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
              {lang === 'hi' ? 'स्कैन' : 'Scan'}
            </span>
          </button>

          {/* New Product */}
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-2xs active:scale-95 transition hover:border-emerald-300"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-1">
              <PlusCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
              {lang === 'hi' ? 'नया माल' : 'Item'}
            </span>
          </button>

          {/* Record Expense */}
          <button
            type="button"
            onClick={onOpenExpenseModal}
            className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-2xs active:scale-95 transition hover:border-rose-300"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center mb-1">
              <ReceiptText className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
              {lang === 'hi' ? 'खर्च' : 'Expense'}
            </span>
          </button>

          {/* Udhar List */}
          <button
            type="button"
            onClick={() => onNavigate('reports', 'udhar')}
            className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-2xs active:scale-95 transition hover:border-amber-300"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-1">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
              {lang === 'hi' ? 'उधार' : 'Udhar'}
            </span>
          </button>

          {/* Graphs / Analytics */}
          <button
            type="button"
            onClick={() => onNavigate('reports', 'graphs')}
            className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-2xs active:scale-95 transition hover:border-purple-300"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
              {lang === 'hi' ? 'ग्राफ़' : 'Graphs'}
            </span>
          </button>
        </div>
      </div>

      {/* Today's Collections Section (Customer Part Payments) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>
              {lang === 'hi'
                ? "आज का कलेक्शन / वसूली (Today's Collections)"
                : "Today's Collections (Part Payments)"}
            </span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('reports', 'collections')}
            className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center hover:underline"
          >
            <span>{lang === 'hi' ? 'सभी कलेक्शन देखें' : 'View All Collections'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayPaymentsList.length > 0 ? (
          <div className="space-y-2">
            {todayPaymentsList.map((payment) => {
              const matchedBill = bills.find(
                (b) => b.id === payment.billId || b.billNumber === payment.billNumber
              );
              return (
                <div
                  key={payment.id}
                  onClick={() => {
                    if (matchedBill) {
                      onViewBill(matchedBill);
                    } else {
                      onNavigate('reports', 'collections');
                    }
                  }}
                  className="bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900/40 rounded-xl p-3 shadow-2xs flex items-center justify-between hover:border-teal-400 cursor-pointer transition active:scale-99"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {payment.customerName || 'Customer'}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          payment.paymentMethod === 'upi'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {payment.paymentMethod}
                      </span>
                      {payment.billNumber && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Bill #{payment.billNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>
                        {new Date(payment.createdAt || payment.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {payment.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[140px] italic">"{payment.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <div className="text-sm font-black text-teal-600 dark:text-teal-400">
                      +₹{payment.amount.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[9px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-1.5 py-0.5 rounded">
                      {lang === 'hi' ? 'जमा' : 'Received'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            onClick={() => onNavigate('reports', 'collections')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-center shadow-2xs cursor-pointer hover:border-teal-400 transition"
          >
            <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <Wallet className="w-4 h-4 text-teal-500" />
              <span>
                {lang === 'hi'
                  ? 'आज कोई पार्ट पेमेंट जमा नहीं हुआ है।'
                  : 'No customer part payments received today.'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {lang === 'hi'
                ? 'उधार खाता व कलेक्शन से किसी भी ग्राहक की किश्त जमा देख सकते हैं।'
                : 'Click to view all past collections or record payments.'}
            </p>
          </div>
        )}
      </div>

      {/* Recent Bills List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === 'hi' ? 'हाल के बिल (Recent Bills)' : 'Recent Bills'}</span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('reports', 'daily')}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center hover:underline"
          >
            <span>{lang === 'hi' ? 'सभी देखें' : 'View All'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {[...bills]
            .sort(
              (a, b) =>
                new Date(b.updatedAt || b.createdAt).getTime() -
                new Date(a.updatedAt || a.createdAt).getTime()
            )
            .slice(0, 5)
            .map((bill) => {
              const isUdhar = bill.paymentMethod === 'udhar';
              const paid = bill.paidAmount || (bill.isUdharPaid ? bill.totalAmount : 0);
              const remaining = Math.max(0, bill.totalAmount - paid);
              const isFullyPaid = !isUdhar || bill.isUdharPaid || remaining === 0;
              const isPartPaid = isUdhar && paid > 0 && remaining > 0;

              return (
                <div
                  key={bill.id}
                  onClick={() => onViewBill(bill)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs flex items-center justify-between hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer transition active:scale-99"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {bill.customerName || 'Cash Customer'}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          !isUdhar
                            ? bill.paymentMethod === 'upi'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : isFullyPaid
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : isPartPaid
                            ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {!isUdhar
                          ? bill.paymentMethod
                          : isFullyPaid
                          ? (lang === 'hi' ? 'उधार चुकता' : 'Settled')
                          : isPartPaid
                          ? (lang === 'hi' ? `जमा ₹${paid}` : `Paid ₹${paid}`)
                          : (lang === 'hi' ? 'उधार' : 'Udhar')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{bill.billNumber}</span>
                      <span>•</span>
                      <span>{bill.items.length} {lang === 'hi' ? 'सामान' : 'items'}</span>
                      <span>•</span>
                      <span>{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isPartPaid && (
                        <>
                          <span>•</span>
                          <span className="text-teal-600 dark:text-teal-400 font-bold">
                            ₹{paid} {lang === 'hi' ? 'जमा' : 'paid'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2 shrink-0">
                    <div className="text-right">
                      {isPartPaid ? (
                        <>
                          <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                            ₹{remaining.toLocaleString('en-IN')}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">
                            {lang === 'hi' ? `बाकी (कुल ₹${bill.totalAmount})` : `Due (Total ₹${bill.totalAmount})`}
                          </span>
                        </>
                      ) : isUdhar && !isFullyPaid ? (
                        <>
                          <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                            ₹{bill.totalAmount.toLocaleString('en-IN')}
                          </div>
                          <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 block">
                            {lang === 'hi' ? 'पूरा बकाया' : 'Pending'}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-black text-slate-900 dark:text-white">
                            ₹{bill.totalAmount.toLocaleString('en-IN')}
                          </div>
                          {isUdhar && isFullyPaid && (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block">
                              {lang === 'hi' ? 'चुकता' : 'Cleared'}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareViaWhatsApp(bill, settings);
                      }}
                      className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
                      title="Share on WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
