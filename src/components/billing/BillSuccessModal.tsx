import React, { useState } from 'react';
import { Bill, ShopSettings } from '../../types';
import { generateBillPDF } from '../../utils/pdfGenerator';
import { formatThermalReceiptText, printReceiptViaBrowser, shareViaWhatsApp } from '../../utils/printerService';
import {
  CheckCircle,
  Share2,
  FileDown,
  Printer,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';

interface BillSuccessModalProps {
  bill: Bill | null;
  settings: ShopSettings;
  isOpen: boolean;
  onClose: () => void;
  lang: 'hi' | 'en';
}

export const BillSuccessModal: React.FC<BillSuccessModalProps> = ({
  bill,
  settings,
  isOpen,
  onClose,
  lang,
}) => {
  const [showThermalPreview, setShowThermalPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !bill) return null;

  const thermalText = formatThermalReceiptText(bill, settings);

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(thermalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    printReceiptViaBrowser(thermalText);
  };

  const isUdhar = bill.paymentMethod === 'udhar';
  const paid = bill.paidAmount || (bill.isUdharPaid ? bill.totalAmount : 0);
  const remaining = Math.max(0, bill.totalAmount - paid);
  const isFullyPaid = !isUdhar || bill.isUdharPaid || remaining === 0;
  const isPartPaid = isUdhar && paid > 0 && remaining > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div
          className={`p-5 text-white relative text-center ${
            isPartPaid
              ? 'bg-gradient-to-r from-teal-600 to-cyan-700'
              : isUdhar && !isFullyPaid
              ? 'bg-gradient-to-r from-amber-600 to-rose-700'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-black/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-md">
            <CheckCircle className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold text-white/80 tracking-wide uppercase">
            {bill.billNumber}
          </span>
          <h3 className="text-xl font-black mt-0.5">
            {isPartPaid ? (
              <span>₹{remaining.toLocaleString('en-IN')} <span className="text-xs font-normal">({lang === 'hi' ? 'बाकी' : 'Due'})</span></span>
            ) : (
              `₹${bill.totalAmount.toLocaleString('en-IN')}`
            )}
          </h3>
          <p className="text-xs text-white/90 mt-0.5">
            {isPartPaid
              ? (lang === 'hi' ? `कुल बिल ₹${bill.totalAmount} • ₹${paid} जमा हो चुका है` : `Total ₹${bill.totalAmount} • ₹${paid} paid so far`)
              : isUdhar && isFullyPaid
              ? (lang === 'hi' ? 'उधार खाता पूरा चुकता हो चुका है!' : 'Credit fully settled & cleared!')
              : isUdhar
              ? (lang === 'hi' ? 'उधार खाता बिल (Pending)' : 'Udhar / Credit bill saved')
              : (lang === 'hi' ? 'बिल सफलतापूर्वक सेव हो गया और स्टॉक घट गया!' : 'Bill saved successfully & stock deducted!')}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3 overflow-y-auto">
          {/* Quick Details */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Customer:</span>
              <span className="font-bold text-slate-900 dark:text-white">{bill.customerName}</span>
            </div>
            {bill.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{bill.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Payment:</span>
              <span
                className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                  !isUdhar
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : isFullyPaid
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : isPartPaid
                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {!isUdhar
                  ? `${bill.paymentMethod} (Paid)`
                  : isFullyPaid
                  ? 'UDHAR (Settled / चुकता)'
                  : isPartPaid
                  ? `UDHAR (Part Paid: ₹${paid} जमा)`
                  : 'UDHAR (Pending / बकाया)'}
              </span>
            </div>

            {/* If Udhar, show detailed breakdown */}
            {isUdhar && (
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Total Bill Amount:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹{bill.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Amount Paid:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{paid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-black text-xs">
                  <span className="text-rose-600 dark:text-rose-400">Balance Due (बाकी):</span>
                  <span className="text-rose-600 dark:text-rose-400">₹{remaining.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Part payment history list if exists */}
            {bill.payments && bill.payments.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-400 block">
                  {lang === 'hi' ? 'जमा किश्तें (Payment History):' : 'Payments Received:'}
                </span>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {bill.payments.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="flex justify-between text-[10px] bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-extrabold text-teal-700 dark:text-teal-400">
                          +₹{p.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1 uppercase text-[9px]">
                          ({p.paymentMethod})
                        </span>
                        {p.notes && <span className="text-slate-400 block italic truncate">"{p.notes}"</span>}
                      </div>
                      <span className="text-slate-400 shrink-0 text-[9px]">
                        {new Date(p.date || p.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Items:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{bill.items.length} products</span>
            </div>

            {/* Items Breakdown */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
              {bill.items.map((item, idx) => {
                let qtyText = '';
                if (item.cartonQty > 0 && item.pieceQty > 0) {
                  qtyText = `${item.cartonQty} Box + ${item.pieceQty} Ladi`;
                } else if (item.cartonQty > 0) {
                  qtyText = `${item.cartonQty} Box`;
                } else {
                  qtyText = `${item.pieceQty} Ladi`;
                }
                return (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[190px]">
                      {item.productName} <span className="text-slate-500 dark:text-slate-400 font-semibold">({qtyText})</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{item.totalAmount}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={() => shareViaWhatsApp(bill, settings)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>{lang === 'hi' ? 'व्हाट्सएप पर बिल भेजें (WhatsApp)' : 'Share via WhatsApp'}</span>
            </button>

            {/* PDF Invoice Download */}
            <button
              type="button"
              onClick={() => generateBillPDF(bill, settings)}
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 transition"
            >
              <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{lang === 'hi' ? 'PDF इनवॉइस डाउनलोड करें' : 'Download PDF Invoice'}</span>
            </button>

            {/* Bluetooth Thermal Printer Button */}
            <button
              type="button"
              onClick={() => setShowThermalPreview(!showThermalPreview)}
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-98 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>
                {showThermalPreview
                  ? 'Hide Printer Preview'
                  : lang === 'hi'
                  ? 'ब्लूटूथ प्रिंटर रसीद (Thermal Print)'
                  : 'Bluetooth Thermal Receipt'}
              </span>
            </button>
          </div>

          {/* Thermal Receipt Preview */}
          {showThermalPreview && (
            <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl space-y-2 font-mono text-[10px] border border-slate-700">
              <div className="flex items-center justify-between text-slate-400">
                <span>ESC/POS 58mm Receipt</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyReceipt}
                    className="p-1 hover:text-white"
                    title="Copy receipt text"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded hover:bg-emerald-400"
                  >
                    Print
                  </button>
                </div>
              </div>
              <pre className="max-h-48 overflow-y-auto whitespace-pre leading-relaxed text-slate-200">
                {thermalText}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition"
          >
            {lang === 'hi' ? 'नया बिल बनाएं (Done)' : 'New Bill (Done)'}
          </button>
        </div>
      </div>
    </div>
  );
};
