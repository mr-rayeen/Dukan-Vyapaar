import React, { useState, useMemo } from 'react';
import { Bill } from '../../types';
import {
  X,
  CheckCircle,
  Wallet,
  User,
  ChevronRight,
  ArrowLeft,
  Search,
  Receipt,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

interface PartPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  customerName?: string;
  customerPhone?: string;
  bills?: Bill[];
  onRecordPayment: (payment: {
    billId?: string;
    customerName: string;
    customerPhone?: string;
    amount: number;
    paymentMethod: 'cash' | 'upi';
    notes?: string;
  }) => void;
  onSettleUdhar?: (billId: string) => void;
  lang: 'hi' | 'en';
}

export const PartPaymentModal: React.FC<PartPaymentModalProps> = ({
  isOpen,
  onClose,
  bill: initialBill,
  customerName: initialCustomerName,
  customerPhone: initialCustomerPhone,
  bills = [],
  onRecordPayment,
  onSettleUdhar,
  lang,
}) => {
  // If initialBill is provided, we start directly on payment step for that bill
  const [selectedBill, setSelectedBill] = useState<Bill | null>(initialBill);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Selected customer for the customer search flow
  const [selectedCustomer, setSelectedCustomer] = useState<{
    name: string;
    phone?: string;
  } | null>(() => {
    if (initialBill) {
      return { name: initialBill.customerName, phone: initialBill.customerPhone };
    }
    if (initialCustomerName) {
      return { name: initialCustomerName, phone: initialCustomerPhone };
    }
    return null;
  });

  // Calculate bill outstanding if a bill is selected
  const billTotal = selectedBill ? selectedBill.totalAmount : 0;
  const billPaid = selectedBill?.paidAmount || (selectedBill?.isUdharPaid ? billTotal : 0);
  const billRemaining = Math.max(0, billTotal - billPaid);

  const [amount, setAmount] = useState<string>(
    billRemaining > 0 ? String(billRemaining) : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [notes, setNotes] = useState<string>('');

  // Extract all existing customers from bills
  const existingCustomers = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        phone?: string;
        totalDue: number;
        pendingBillsCount: number;
        totalBillsCount: number;
        lastDate: string;
      }
    >();

    bills.forEach((b) => {
      const key = b.customerName.trim().toLowerCase();
      if (!key) return;
      const existing = map.get(key) || {
        name: b.customerName,
        phone: b.customerPhone,
        totalDue: 0,
        pendingBillsCount: 0,
        totalBillsCount: 0,
        lastDate: b.createdAt,
      };

      existing.totalBillsCount += 1;
      if (!existing.phone && b.customerPhone) existing.phone = b.customerPhone;
      if (new Date(b.createdAt) > new Date(existing.lastDate)) {
        existing.lastDate = b.createdAt;
      }

      if (b.paymentMethod === 'udhar' && !b.isUdharPaid) {
        const paid = b.paidAmount || 0;
        const due = Math.max(0, b.totalAmount - paid);
        if (due > 0) {
          existing.totalDue += due;
          existing.pendingBillsCount += 1;
        }
      }

      map.set(key, existing);
    });

    const list = Array.from(map.values());
    // Sort customers with pending due first, then highest due amount
    list.sort((a, b) => {
      if (b.totalDue !== a.totalDue) return b.totalDue - a.totalDue;
      return new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime();
    });

    return list;
  }, [bills]);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return existingCustomers;
    const q = customerSearchQuery.toLowerCase().trim();
    return existingCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    );
  }, [existingCustomers, customerSearchQuery]);

  // Find all pending bills for selected customer
  const customerPendingBills = useMemo(() => {
    if (!selectedCustomer) return [];
    return bills.filter((b) => {
      const matchesName =
        b.customerName.trim().toLowerCase() ===
        selectedCustomer.name.trim().toLowerCase();
      const isUdhar = b.paymentMethod === 'udhar';
      const paid = b.paidAmount || (b.isUdharPaid ? b.totalAmount : 0);
      const remaining = Math.max(0, b.totalAmount - paid);
      return matchesName && isUdhar && !b.isUdharPaid && remaining > 0;
    });
  }, [bills, selectedCustomer]);

  // All other bills of this customer (cleared or cash) if needed
  const customerOtherBills = useMemo(() => {
    if (!selectedCustomer) return [];
    return bills.filter((b) => {
      const matchesName =
        b.customerName.trim().toLowerCase() ===
        selectedCustomer.name.trim().toLowerCase();
      const isUdhar = b.paymentMethod === 'udhar';
      const paid = b.paidAmount || (b.isUdharPaid ? b.totalAmount : 0);
      const remaining = Math.max(0, b.totalAmount - paid);
      return matchesName && (!isUdhar || b.isUdharPaid || remaining === 0);
    });
  }, [bills, selectedCustomer]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;

  // Handlers
  const handleSelectCustomer = (customer: { name: string; phone?: string }) => {
    setSelectedCustomer(customer);
    setSelectedBill(null);
  };

  const handleSelectBillForPartPay = (billToPay: Bill) => {
    setSelectedBill(billToPay);
    const total = billToPay.totalAmount;
    const paid = billToPay.paidAmount || (billToPay.isUdharPaid ? total : 0);
    const rem = Math.max(0, total - paid);
    setAmount(rem > 0 ? String(rem) : '');
  };

  const handleSelectBillForFullSettle = (billToPay: Bill) => {
    setSelectedBill(billToPay);
    const total = billToPay.totalAmount;
    const paid = billToPay.paidAmount || (billToPay.isUdharPaid ? total : 0);
    const rem = Math.max(0, total - paid);
    setAmount(String(rem));
    setNotes(lang === 'hi' ? 'पूर्ण चुकता (Full Settlement)' : 'Full Udhar Settlement');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;

    const custName = selectedBill?.customerName || selectedCustomer?.name || '';
    const custPhone = selectedBill?.customerPhone || selectedCustomer?.phone || '';

    // If full settlement on a bill
    if (selectedBill && parsedAmount >= billRemaining && onSettleUdhar) {
      onRecordPayment({
        billId: selectedBill.id,
        customerName: custName,
        customerPhone: custPhone,
        amount: parsedAmount,
        paymentMethod,
        notes: notes.trim() || (lang === 'hi' ? 'पूर्ण चुकता' : 'Full Settle'),
      });
    } else {
      onRecordPayment({
        billId: selectedBill?.id,
        customerName: custName,
        customerPhone: custPhone,
        amount: parsedAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  // Quick preset amount buttons
  const presetOptions = [
    ...(billRemaining > 0 ? [{ label: `Full (₹${billRemaining})`, val: billRemaining }] : []),
    { label: '₹100', val: 100 },
    { label: '₹500', val: 500 },
    { label: '₹1,000', val: 1000 },
    { label: '₹2,000', val: 2000 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-900 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {selectedBill ? (
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : selectedCustomer && !initialBill ? (
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Wallet className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="font-black text-sm">
                {selectedBill
                  ? lang === 'hi'
                    ? 'बिल का भुगतान जमा करें'
                    : 'Record Bill Payment'
                  : selectedCustomer
                  ? lang === 'hi'
                    ? 'बकाया बिल चुनें'
                    : 'Select Pending Bill'
                  : lang === 'hi'
                  ? 'ग्राहक चुनें (Record Pay)'
                  : 'Select Customer (Record Pay)'}
              </h3>
              <p className="text-[10px] text-teal-100 truncate max-w-[200px]">
                {selectedBill
                  ? `${selectedBill.billNumber} • ${selectedBill.customerName}`
                  : selectedCustomer
                  ? selectedCustomer.name
                  : lang === 'hi'
                  ? 'पहले से मौजूद बिल में से खोजें'
                  : 'Search from existing customer bills'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {/* STEP 1: Search Existing Customer (when no customer selected yet) */}
          {!selectedCustomer && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  autoFocus
                  placeholder={
                    lang === 'hi'
                      ? 'ग्राहक का नाम या फोन नंबर खोजें...'
                      : 'Search customer by name or phone...'
                  }
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block px-1">
                  {lang === 'hi'
                    ? `दुकान के ग्राहक (${filteredCustomers.length})`
                    : `Existing Customers (${filteredCustomers.length})`}
                </span>

                {filteredCustomers.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-1.5">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
                    <p className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                      {lang === 'hi' ? 'ग्राहक नहीं मिला' : 'No matching customer'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === 'hi'
                        ? 'केवल उन ग्राहकों का पेमेंट जमा हो सकता है जिनका बिल पहले से बना हुआ है।'
                        : 'You can only collect payments for customers with existing bills.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5">
                    {filteredCustomers.map((cust, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectCustomer(cust)}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xs hover:border-teal-500 cursor-pointer transition active:scale-98 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 font-black text-xs">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                              {cust.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                              {cust.phone && <span>{cust.phone} • </span>}
                              <span>{cust.totalBillsCount} {lang === 'hi' ? 'बिल' : 'bills'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {cust.totalDue > 0 ? (
                            <div>
                              <span className="text-[9px] font-bold text-rose-600 block uppercase">
                                {lang === 'hi' ? 'बकाया' : 'Due'}
                              </span>
                              <span className="text-xs font-black text-rose-600">
                                ₹{cust.totalDue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Clear</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Customer Selected -> Show Customer's Pending Bills */}
          {selectedCustomer && !selectedBill && (
            <div className="space-y-3">
              {/* Selected Customer Header Badge */}
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-teal-950 dark:text-teal-100 truncate">
                      {selectedCustomer.name}
                    </div>
                    {selectedCustomer.phone && (
                      <div className="text-[10px] text-teal-700 dark:text-teal-300">
                        {selectedCustomer.phone}
                      </div>
                    )}
                  </div>
                </div>

                {!initialBill && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setSelectedBill(null);
                    }}
                    className="text-[11px] font-extrabold text-teal-700 dark:text-teal-300 hover:underline px-2 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-2xs"
                  >
                    {lang === 'hi' ? 'ग्राहक बदलें' : 'Change'}
                  </button>
                )}
              </div>

              {/* Pending Bills List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {lang === 'hi'
                        ? `बकाया बिल (${customerPendingBills.length})`
                        : `Pending Bills (${customerPendingBills.length})`}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {lang === 'hi' ? 'जमा करने हेतु बिल चुनें' : 'Select bill to pay'}
                  </span>
                </div>

                {customerPendingBills.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                      {lang === 'hi'
                        ? 'इस ग्राहक का कोई उधार बिल बकाया नहीं है!'
                        : 'No pending udhar bills for this customer!'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {lang === 'hi'
                        ? 'सभी पुराने बिल पूरे चुकता हैं।'
                        : 'All previous purchases are completely cleared.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5">
                    {customerPendingBills.map((b) => {
                      const total = b.totalAmount;
                      const paid = b.paidAmount || 0;
                      const rem = Math.max(0, total - paid);

                      return (
                        <div
                          key={b.id}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                  {b.billNumber}
                                </span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 uppercase">
                                  {lang === 'hi' ? 'उधार' : 'Udhar'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(b.createdAt).toLocaleDateString([], {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}{' '}
                                • {new Date(b.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[9px] font-bold text-rose-600 block uppercase">
                                {lang === 'hi' ? 'बाकी बकाया' : 'Remaining Due'}
                              </span>
                              <span className="text-sm font-black text-rose-600">
                                ₹{rem.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* Progress / Amounts Bar */}
                          <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-[10px]">
                            <div>
                              <span className="text-slate-400 block font-bold">
                                {lang === 'hi' ? 'कुल बिल' : 'Total Billed'}
                              </span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                ₹{total.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-emerald-700 dark:text-emerald-400 block font-bold">
                                {lang === 'hi' ? 'पहले जमा (Paid)' : 'Already Paid'}
                              </span>
                              <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                                ₹{paid.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons: Full Payment vs Part Payment */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSelectBillForFullSettle(b)}
                              className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-xl shadow-xs active:scale-95 transition flex items-center justify-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{lang === 'hi' ? `पूर्ण चुकता (₹${rem})` : `Full Pay (₹${rem})`}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSelectBillForPartPay(b)}
                              className="py-2 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded-xl shadow-xs active:scale-95 transition flex items-center justify-center gap-1"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span>{lang === 'hi' ? 'किश्त (Part Pay)' : 'Part Pay'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Payment Input Form for Selected Bill */}
          {selectedBill && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Target Bill Details Card */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">
                    {lang === 'hi' ? 'बिल नंबर व कुल रकम:' : 'Bill Number & Total:'}
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {selectedBill.billNumber} (₹{selectedBill.totalAmount})
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">
                    {lang === 'hi' ? 'पहले जमा (Paid):' : 'Already Paid:'}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{billPaid}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200 dark:border-slate-700 font-black">
                  <span className="text-rose-600 dark:text-rose-400">
                    {lang === 'hi' ? 'बाकी बकाया (Balance Due):' : 'Balance Due:'}
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 text-sm">
                    ₹{billRemaining}
                  </span>
                </div>
              </div>

              {/* Amount to collect */}
              <div>
                <label className="text-slate-600 dark:text-slate-300 font-bold block mb-1">
                  {lang === 'hi' ? 'जमा राशि (Received Amount ₹)' : 'Amount Received (₹)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-black text-emerald-600">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    autoFocus
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quick presets */}
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5">
                  {presetOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAmount(String(opt.val))}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition shrink-0"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-slate-600 dark:text-slate-300 font-bold block mb-1">
                  {lang === 'hi' ? 'भुगतान माध्यम' : 'Payment Mode'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Cash (नकद)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition ${
                      paymentMethod === 'upi'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-black'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    UPI / Online
                  </button>
                </div>
              </div>

              {/* Notes / Remarks */}
              <div>
                <label className="text-slate-600 dark:text-slate-300 font-bold block mb-1">
                  {lang === 'hi' ? 'टिप्पणी (Notes / Reference)' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  placeholder={
                    lang === 'hi'
                      ? 'जैसे: किश्त नकद मिली, ऑनलाइन ट्रांसफर'
                      : 'e.g. Part payment cash'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {lang === 'hi'
                    ? `₹${parsedAmount || 0} भुगतान दर्ज करें (Update Everywhere)`
                    : `Record ₹${parsedAmount || 0} Payment (Update Everywhere)`}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
