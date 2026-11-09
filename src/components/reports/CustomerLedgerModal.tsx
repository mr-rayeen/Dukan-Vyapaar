import React, { useState } from 'react';
import { Bill, PaymentRecord } from '../../types';
import {
  X,
  User,
  Phone,
  FileText,
  Calendar,
  Wallet,
  CheckCircle,
  Clock,
  ArrowDownRight,
  TrendingDown,
  CreditCard,
  Plus,
  Share2,
} from 'lucide-react';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone?: string;
  bills: Bill[];
  onOpenPartPayment: (bill: Bill | null, custName: string, custPhone?: string) => void;
  onViewBill?: (bill: Bill) => void;
  lang: 'hi' | 'en';
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  bills,
  onOpenPartPayment,
  onViewBill,
  lang,
}) => {
  const [activeLedgerTab, setActiveLedgerTab] = useState<'all' | 'pending' | 'payments'>('all');

  if (!isOpen || !customerName) return null;

  // Filter all bills belonging to this customer and sort newest-first
  const customerBills = bills
    .filter((b) => b.customerName.trim().toLowerCase() === customerName.trim().toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Compute lifetime customer statistics
  const totalBilled = customerBills.reduce((acc, b) => acc + b.totalAmount, 0);

  // Aggregate all payments received from this customer (either stored in bill.payments or inferred from paid bills)
  const allPayments: PaymentRecord[] = [];
  customerBills.forEach((b) => {
    if (b.payments && b.payments.length > 0) {
      allPayments.push(...b.payments);
    } else if (b.paymentMethod !== 'udhar' || b.isUdharPaid) {
      // Automatic historic payment record for settled bills
      allPayments.push({
        id: `pay-auto-${b.id}`,
        billId: b.id,
        billNumber: b.billNumber,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        amount: b.totalAmount,
        paymentMethod: b.paymentMethod === 'udhar' ? 'cash' : (b.paymentMethod as any),
        notes: b.paymentMethod === 'udhar' ? 'Full Udhar Settlement' : 'Paid at Billing',
        date: b.createdAt,
        createdAt: b.createdAt,
      });
    }
  });

  // Sort payments newest-first (latest payment on top, older below)
  allPayments.sort(
    (a, b) =>
      new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );

  // Group payments by local calendar date (YYYY-MM-DD)
  const getLocalDateKey = (isoStr: string) => {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return 'unknown';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  };

  const formatDateHeader = (dateKey: string) => {
    const todayKey = getLocalDateKey(new Date().toISOString());
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yesterdayKey = getLocalDateKey(yest.toISOString());
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    const formatted = dt.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    if (dateKey === todayKey) return lang === 'hi' ? `आज (Today) • ${formatted}` : `Today • ${formatted}`;
    if (dateKey === yesterdayKey) return lang === 'hi' ? `कल (Yesterday) • ${formatted}` : `Yesterday • ${formatted}`;
    return formatted;
  };

  const paymentDateGroups: {
    dateKey: string;
    totalAmount: number;
    items: PaymentRecord[];
  }[] = [];
  const paymentDateMap = new Map<string, { dateKey: string; totalAmount: number; items: PaymentRecord[] }>();
  allPayments.forEach((p) => {
    const dKey = getLocalDateKey(p.createdAt || p.date);
    let grp = paymentDateMap.get(dKey);
    if (!grp) {
      grp = { dateKey: dKey, totalAmount: 0, items: [] };
      paymentDateMap.set(dKey, grp);
      paymentDateGroups.push(grp);
    }
    grp.items.push(p);
    grp.totalAmount += p.amount;
  });

  // Calculate total collected and pending udhar
  let totalCollected = 0;
  let totalPending = 0;

  customerBills.forEach((b) => {
    if (b.paymentMethod === 'udhar') {
      const paid = b.paidAmount || (b.isUdharPaid ? b.totalAmount : 0);
      const remaining = Math.max(0, b.totalAmount - paid);
      totalCollected += paid;
      totalPending += remaining;
    } else {
      totalCollected += b.totalAmount;
    }
  });

  const pendingBills = customerBills.filter((b) => {
    if (b.paymentMethod !== 'udhar') return false;
    const paid = b.paidAmount || (b.isUdharPaid ? b.totalAmount : 0);
    return !b.isUdharPaid && paid < b.totalAmount;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 text-white shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 font-black text-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  {lang === 'hi' ? 'ग्राहक खाता / लेजर (Customer Ledger)' : 'Customer Khata & Ledger'}
                </span>
                <h3 className="font-black text-base leading-tight tracking-tight mt-0.5">
                  {customerName}
                </h3>
                {customerPhone && (
                  <span className="text-xs text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    {customerPhone}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ledger Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800">
            <div className="bg-slate-800/80 rounded-xl p-2 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">
                {lang === 'hi' ? 'कुल खरीदारी' : 'Total Bought'}
              </span>
              <div className="text-xs font-black text-white mt-0.5">
                ₹{totalBilled.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-2 text-center">
              <span className="text-[9px] font-bold text-emerald-300 uppercase block">
                {lang === 'hi' ? 'कुल जमा (Paid)' : 'Total Paid'}
              </span>
              <div className="text-xs font-black text-emerald-400 mt-0.5">
                ₹{totalCollected.toLocaleString('en-IN')}
              </div>
            </div>

            <div className={`rounded-xl p-2 text-center border ${
              totalPending > 0
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}>
              <span className="text-[9px] font-bold uppercase block">
                {lang === 'hi' ? 'बाकी उधार' : 'Balance Due'}
              </span>
              <div className="text-xs font-black mt-0.5">
                ₹{totalPending.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          {/* Filter Sub-Tabs */}
          <div className="flex gap-1 bg-slate-200/80 dark:bg-slate-900 p-0.5 rounded-lg text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveLedgerTab('all')}
              className={`px-2 py-1 rounded-md transition ${
                activeLedgerTab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lang === 'hi' ? 'सभी बिल' : 'All Bills'} ({customerBills.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveLedgerTab('pending')}
              className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                activeLedgerTab === 'pending'
                  ? 'bg-rose-600 text-white shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>{lang === 'hi' ? 'बाकी बिल' : 'Pending'}</span>
              {pendingBills.length > 0 && (
                <span className="px-1 text-[9px] bg-white text-rose-700 rounded-full font-black">
                  {pendingBills.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveLedgerTab('payments')}
              className={`px-2 py-1 rounded-md transition ${
                activeLedgerTab === 'payments'
                  ? 'bg-emerald-600 text-white shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lang === 'hi' ? 'जमा रकम' : 'Payments'} ({allPayments.length})
            </button>
          </div>

          {/* Quick Custom Money Deposit button */}
          <button
            type="button"
            onClick={() => onOpenPartPayment(null, customerName, customerPhone)}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg shadow-xs flex items-center gap-1 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'रुपये जमा' : 'Add Payment'}</span>
          </button>
        </div>

        {/* Ledger Scrollable Content */}
        <div className="p-3.5 overflow-y-auto flex-1 space-y-2.5 text-xs">
          {/* 1. ALL BILLS VIEW */}
          {activeLedgerTab === 'all' && (
            <div className="space-y-2">
              {customerBills.map((bill) => {
                const paid = bill.paidAmount || (bill.isUdharPaid ? bill.totalAmount : 0);
                const remaining = Math.max(0, bill.totalAmount - paid);
                const isFullyPaid = bill.isUdharPaid || remaining === 0;

                return (
                  <div
                    key={bill.id}
                    onClick={() => onViewBill && onViewBill(bill)}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-emerald-400 transition cursor-pointer space-y-1.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 dark:text-white text-xs">
                            {bill.billNumber}
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                              isFullyPaid
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {isFullyPaid ? 'Paid' : `Due ₹${remaining}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          ₹{bill.totalAmount.toLocaleString('en-IN')}
                        </div>
                        {paid > 0 && !isFullyPaid && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                            Recvd: ₹{paid}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items brief */}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg">
                      {bill.items.map((it, idx) => (
                        <span key={idx} className="mr-2">
                          {it.productName} ({it.cartonQty > 0 ? `${it.cartonQty} Box ` : ''}{it.pieceQty > 0 ? `${it.pieceQty} Ladi` : ''})
                          {idx < bill.items.length - 1 ? ' • ' : ''}
                        </span>
                      ))}
                    </div>

                    {/* Part Payment CTA if not fully paid */}
                    {!isFullyPaid && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          Pending: ₹{remaining}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPartPayment(bill, customerName, customerPhone);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg shadow-2xs active:scale-95 transition"
                        >
                          + {lang === 'hi' ? 'किस्त / पार्ट पेमेंट लें' : 'Collect Payment'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. PENDING BILLS ONLY */}
          {activeLedgerTab === 'pending' && (
            <div className="space-y-2">
              {pendingBills.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-xs">
                    {lang === 'hi'
                      ? 'कोई बाकी बिल नहीं है! खाता पूर्ण चुकता है।'
                      : 'All bills settled! Zero outstanding.'}
                  </p>
                </div>
              ) : (
                pendingBills.map((bill) => {
                  const paid = bill.paidAmount || 0;
                  const remaining = Math.max(0, bill.totalAmount - paid);

                  return (
                    <div
                      key={bill.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-rose-200 dark:border-rose-900/60 shadow-2xs space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-black text-slate-900 dark:text-white text-xs">
                            {bill.billNumber}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Total: ₹{bill.totalAmount}</span>
                          <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                            Due: ₹{remaining}
                          </span>
                        </div>
                      </div>

                      {paid > 0 && (
                        <div className="flex justify-between text-[10px] bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 font-bold">
                          <span>Part Payment Received:</span>
                          <span>₹{paid}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenPartPayment(bill, customerName, customerPhone)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow-2xs active:scale-95 transition flex items-center justify-center gap-1.5"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'जमा लें (Collect Due ₹' + remaining + ')' : 'Receive Part / Full Due (₹' + remaining + ')'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 3. PARTED PAYMENTS RECEIVED LOG (Date-grouped, Latest on Top) */}
          {activeLedgerTab === 'payments' && (
            <div className="space-y-3">
              {paymentDateGroups.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-bold text-xs">
                    {lang === 'hi' ? 'कोई जमा एंट्री नहीं है' : 'No recorded payments.'}
                  </p>
                </div>
              ) : (
                paymentDateGroups.map((group) => (
                  <div
                    key={group.dateKey}
                    className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs"
                  >
                    <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        <span className="text-[11px] font-black">{formatDateHeader(group.dateKey)}</span>
                      </div>
                      <span className="text-[11px] font-black text-emerald-300">
                        +₹{group.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {group.items.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="p-2.5 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                                {p.billNumber ? `Against ${p.billNumber}` : 'Account Credit / Part Payment'}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <span className="font-bold">
                                  {new Date(p.createdAt || p.date).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <span>•</span>
                                <span className="uppercase font-extrabold text-[9px] px-1 rounded bg-slate-200 dark:bg-slate-700">
                                  {p.paymentMethod}
                                </span>
                                {p.notes && <span className="truncate">• {p.notes}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                              +₹{p.amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
