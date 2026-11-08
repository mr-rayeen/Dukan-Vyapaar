import React, { useState } from 'react';
import { Expense, ExpenseCategory } from '../../types';
import { X, Plus, ReceiptText, Coffee, Truck, Users, Zap, Building2, Package, MoreHorizontal, Calendar, Trash2 } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense?: (id: string) => void;
  expenses: Expense[];
  lang: 'hi' | 'en';
}

export const EXPENSE_CATEGORIES: { key: ExpenseCategory; labelEn: string; labelHi: string; icon: any; color: string }[] = [
  { key: 'tea_snacks', labelEn: 'Tea & Snacks', labelHi: 'चाय व नाश्ता', icon: Coffee, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
  { key: 'transport', labelEn: 'Freight / Transport', labelHi: 'भाड़ा व टेम्पो', icon: Truck, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
  { key: 'wages', labelEn: 'Wages / Hamali', labelHi: 'मजदूरी व पगार', icon: Users, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400' },
  { key: 'packaging', labelEn: 'Packaging & Bags', labelHi: 'थैली व पैकिंग', icon: Package, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400' },
  { key: 'electricity', labelEn: 'Electricity & Bills', labelHi: 'बिजली व दुकान बिल', icon: Zap, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 dark:text-yellow-400' },
  { key: 'rent', labelEn: 'Shop Rent', labelHi: 'दुकान किराया', icon: Building2, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
  { key: 'other', labelEn: 'General / Other', labelHi: 'अन्य विविध खर्च', icon: MoreHorizontal, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  onDeleteExpense,
  expenses,
  lang,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('tea_snacks');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    const newExpense: Expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim() || getDefaultTitle(category, lang),
      amount: parsedAmount,
      category,
      paymentMethod,
      notes: notes.trim() || undefined,
      date: new Date(date).toISOString(),
      createdAt: new Date().toISOString(),
    };

    onSaveExpense(newExpense);
    // Reset form
    setTitle('');
    setAmount('');
    setNotes('');
    setActiveTab('list');
  };

  const getDefaultTitle = (cat: ExpenseCategory, language: 'hi' | 'en') => {
    const item = EXPENSE_CATEGORIES.find((c) => c.key === cat);
    return language === 'hi' ? (item?.labelHi || 'दुकान खर्च') : (item?.labelEn || 'Shop Expense');
  };

  // Quick preset amounts
  const presetAmounts = [20, 50, 100, 200, 500, 1000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-amber-600 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">
                {lang === 'hi' ? 'दुकान रोज का खर्च' : 'Daily Shop Expenses'}
              </h3>
              <p className="text-[10px] text-rose-100">
                {lang === 'hi' ? 'चाय, भाड़ा, मजदूरी व नेट मुनाफा' : 'Tea, Transport, Wages for True Profit'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch: Add Expense vs Recent List */}
        <div className="p-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
              activeTab === 'add'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'नया खर्च जोड़ें' : 'Record Expense'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>{lang === 'hi' ? 'खर्च सूची' : 'Expense Log'}</span>
            <span className="px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded-full text-[10px] font-black">
              {expenses.length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-3.5 overflow-y-auto space-y-3 flex-1 text-xs">
          {activeTab === 'add' ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Category selector */}
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1.5">
                  {lang === 'hi' ? 'खर्च का प्रकार (Category)' : 'Expense Category'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setCategory(cat.key);
                          if (!title) {
                            setTitle(lang === 'hi' ? cat.labelHi : cat.labelEn);
                          }
                        }}
                        className={`p-2 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 ring-1 ring-rose-400'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold text-center leading-tight">
                          {lang === 'hi' ? cat.labelHi : cat.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                  {lang === 'hi' ? 'रुपये (Amount ₹)' : 'Amount (₹)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-base font-black text-rose-600">₹</span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                {/* Quick amount chips */}
                <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-0.5">
                  {presetAmounts.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(String(p))}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition shrink-0"
                    >
                      +₹{p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                  {lang === 'hi' ? 'विवरण / नाम (Description)' : 'Title / Note'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'hi' ? 'जैसे: 4 कप चाय + बिस्कुट' : 'e.g. Morning staff tea'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                    {lang === 'hi' ? 'तारीख (Date)' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                    {lang === 'hi' ? 'भुगतान (Paid via)' : 'Paid Via'}
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-1 text-xs font-bold rounded-lg transition ${
                        paymentMethod === 'cash'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`py-1 text-xs font-bold rounded-lg transition ${
                        paymentMethod === 'upi'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      UPI
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'hi' ? 'खर्च दर्ज करें (Save Expense)' : 'Save Expense'}</span>
              </button>
            </form>
          ) : (
            /* Recent Expenses List */
            <div className="space-y-2">
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <ReceiptText className="w-10 h-10 mx-auto opacity-40 mb-2" />
                  <p className="font-semibold text-xs">
                    {lang === 'hi' ? 'अभी कोई खर्च दर्ज नहीं है।' : 'No expenses recorded yet.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="mt-3 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-lg text-xs flex items-center justify-center gap-1 mx-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'खर्च जोड़ें' : 'Add First Expense'}</span>
                  </button>
                </div>
              ) : (
                expenses.map((exp) => {
                  const catConfig = EXPENSE_CATEGORIES.find((c) => c.key === exp.category) || EXPENSE_CATEGORIES[6];
                  const Icon = catConfig.icon;
                  return (
                    <div
                      key={exp.id}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${catConfig.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate text-xs">
                            {exp.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            <span>{new Date(exp.date || exp.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            <span>•</span>
                            <span className="uppercase text-[9px] font-bold px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {exp.paymentMethod}
                            </span>
                            {exp.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[90px]">{exp.notes}</span>
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
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
