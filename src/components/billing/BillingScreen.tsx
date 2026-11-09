import React, { useState, useMemo } from 'react';
import { Bill, BillItem, PaymentMethod, Product, ShopSettings } from '../../types';
import { calculateItemTotal, composePieces, decomposePieces, formatStock } from '../../utils/stockLogic';
import { generateUniqueId } from '../../utils/idGenerator';
import { showToast } from '../common/ToastProvider';
import confetti from 'canvas-confetti';
import {
  Search,
  Plus,
  Trash2,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  Phone,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BillingScreenProps {
  products: Product[];
  settings: ShopSettings;
  lang: 'hi' | 'en';
  onSaveBill: (bill: Bill) => void;
  onOpenSuccessModal: (bill: Bill) => void;
}

export const BillingScreen: React.FC<BillingScreenProps> = ({
  products,
  settings,
  lang,
  onSaveBill,
  onOpenSuccessModal,
}) => {
  // Search & Cart state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<BillItem[]>([]);

  // Customer & Payment state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-generate Bill Number based on timestamp / random sequence
  const currentBillNumber = useMemo(() => {
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    return `INV-${new Date().getFullYear()}-${randomSeq}`;
  }, []);

  // Filter products for quick search
  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.hindiName && p.hindiName.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(q))
      );
    }
    return list;
  }, [products, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Add product to cart with 0 Carton and 1 Piece initially (or 1 Carton if piecePrice not set)
  const handleAddToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    if (existingIndex > -1) {
      // Increment piece or carton
      const updated = [...cart];
      const item = updated[existingIndex];
      const newPieceQty = item.pieceQty + 1;
      const newTotalPieces = (item.cartonQty * item.packSize) + newPieceQty;
      const totalAmount = calculateItemTotal(
        item.cartonQty,
        newPieceQty,
        item.cartonPrice,
        item.piecePrice
      );
      updated[existingIndex] = {
        ...item,
        pieceQty: newPieceQty,
        totalPieces: newTotalPieces,
        totalAmount,
      };
      setCart(updated);
    } else {
      // New cart item
      const cartonQty = 0;
      const pieceQty = 1;
      const totalPieces = (cartonQty * product.packSize) + pieceQty;
      const totalAmount = calculateItemTotal(
        cartonQty,
        pieceQty,
        product.salePriceCarton,
        product.salePricePiece
      );

      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          packSize: product.packSize,
          cartonQty,
          pieceQty,
          totalPieces,
          cartonPrice: product.salePriceCarton,
          piecePrice: product.salePricePiece,
          totalAmount,
        },
      ]);
      showToast({
        type: 'info',
        title: lang === 'hi' ? 'बिल में आइटम जोड़ा गया' : 'Added to Bill Cart',
        message: product.name,
        duration: 1800,
      });
    }
    setErrorMessage(null);
  };

  // Update Carton / Piece quantity for an item in cart
  const handleUpdateItemQty = (
    productId: string,
    cartonQty: number,
    pieceQty: number
  ) => {
    const updated = cart.map((item) => {
      if (item.productId === productId) {
        const safeCarton = Math.max(0, cartonQty);
        const safePiece = Math.max(0, pieceQty);
        const totalPieces = (safeCarton * item.packSize) + safePiece;
        const totalAmount = calculateItemTotal(
          safeCarton,
          safePiece,
          item.cartonPrice,
          item.piecePrice
        );
        return {
          ...item,
          cartonQty: safeCarton,
          pieceQty: safePiece,
          totalPieces,
          totalAmount,
        };
      }
      return item;
    });
    setCart(updated);
    setErrorMessage(null);
  };

  const handleRemoveFromCart = (productId: string) => {
    const removed = cart.find((item) => item.productId === productId);
    setCart(cart.filter((item) => item.productId !== productId));
    if (removed) {
      showToast({
        type: 'warning',
        title: lang === 'hi' ? 'बिल से आइटम हटाया गया' : 'Removed from Cart',
        message: removed.productName,
        duration: 1800,
      });
    }
  };

  // Validation: Check if any item exceeds available pieces in stock!
  const stockValidation = useMemo(() => {
    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const requiredPieces = (item.cartonQty * item.packSize) + item.pieceQty;
      if (requiredPieces > product.totalPieces) {
        const availableFormatted = formatStock(product.totalPieces, product.packSize, lang);
        return {
          isValid: false,
          failedItem: item.productName,
          requiredPieces,
          availablePieces: product.totalPieces,
          availableFormatted,
        };
      }
    }
    return { isValid: true };
  }, [cart, products, lang]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.totalAmount, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.max(0, Math.round(subtotal - (discount || 0)));
  }, [subtotal, discount]);

  // Submit and Save Bill
  const handleSubmitBill = () => {
    if (cart.length === 0) {
      const msg = lang === 'hi' ? 'कार्ट खाली है! कृपया बिल में सामान जोड़ें।' : 'Cart is empty! Please add products to the bill.';
      setErrorMessage(msg);
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'बिल नहीं बन सकता' : 'Cannot Create Bill',
        message: msg,
      });
      return;
    }

    const zeroQtyItem = cart.find((it) => it.cartonQty <= 0 && it.pieceQty <= 0);
    if (zeroQtyItem) {
      const msg =
        lang === 'hi'
          ? `"${zeroQtyItem.productName}" की मात्रा 0 है! कृपया बॉक्स या लड़ी संख्या भरें।`
          : `"${zeroQtyItem.productName}" has 0 quantity! Please enter Box or Ladi quantity.`;
      setErrorMessage(msg);
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'मात्रा (Quantity) गलत है' : 'Invalid Item Quantity',
        message: msg,
      });
      return;
    }

    if (!stockValidation.isValid) {
      const msg =
        lang === 'hi'
          ? `स्टॉक कम है! "${stockValidation.failedItem}" के केवल ${stockValidation.availablePieces} लड़ी (${stockValidation.availableFormatted}) मौजूद हैं।`
          : `Insufficient stock! "${stockValidation.failedItem}" only has ${stockValidation.availablePieces} ladi (${stockValidation.availableFormatted}) available.`;
      setErrorMessage(msg);
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'गोदाम में स्टॉक कम है!' : 'Insufficient Godown Stock!',
        message: msg,
      });
      return;
    }

    const newBill: Bill = {
      id: generateUniqueId('bill'),
      billNumber: currentBillNumber,
      customerName: customerName.trim() || 'Cash Customer',
      customerPhone: customerPhone.trim(),
      items: [...cart],
      subtotal,
      discount: discount || 0,
      totalAmount: grandTotal,
      paymentMethod,
      isUdharPaid: paymentMethod !== 'udhar',
      createdAt: new Date().toISOString(),
    };

    onSaveBill(newBill);

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    // Reset Form
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscount(0);
    setErrorMessage(null);

    // Open Success Modal (WhatsApp share, Print, PDF)
    onOpenSuccessModal(newBill);
  };

  return (
    <div className="space-y-3 pb-24">
      {/* Top Bill Header Bar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            {currentBillNumber}
          </span>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
            {lang === 'hi' ? 'नया बिक्री बिल (New Sale Bill)' : 'New Sale Bill'}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
            Total Items: {cart.length}
          </span>
          <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
            ₹{grandTotal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Customer Info Form */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            <input
              type="text"
              placeholder={lang === 'hi' ? 'ग्राहक का नाम (Customer)' : 'Customer Name'}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2 py-2 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            <input
              type="tel"
              placeholder={lang === 'hi' ? 'मोबाइल नंबर (Phone)' : 'Mobile Phone'}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2 py-2 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
            {lang === 'hi' ? 'भुगतान का प्रकार (Payment Method)' : 'Payment Method'}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'नकद (Cash)' : 'Cash'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                paymentMethod === 'upi'
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'ऑनलाइन UPI' : 'UPI Online'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('udhar')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                paymentMethod === 'udhar'
                  ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'उधार (Khata)' : 'Udhar (Credit)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'hi' ? 'बिल में जोड़े गए सामान (Cart Items)' : 'Bill Items'}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              ({cart.length})
            </span>
          </span>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setCart([])}
              className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <Package className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500" />
            <p className="text-xs font-semibold">
              {lang === 'hi'
                ? 'अभी कार्ट में कोई आइटम नहीं है। नीचे से सामान चुनें।'
                : 'No items in cart. Search or tap items below to add.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {cart.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const availablePieces = product ? product.totalPieces : 0;
              const isExceeded = item.totalPieces > availablePieces;

              return (
                <div
                  key={item.productId}
                  className={`bg-white dark:bg-slate-800 border rounded-xl p-3 shadow-2xs transition ${
                    isExceeded
                      ? 'border-rose-400 ring-2 ring-rose-300 dark:ring-rose-800 bg-rose-50/20 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {item.productName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          1 Box = {item.packSize} Ladi
                        </span>
                        {product && (
                          <span
                            className={`text-[10px] font-bold ${
                              isExceeded
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            Stock: {formatStock(product.totalPieces, product.packSize, lang)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.productId)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 2 Input Boxes: Box and Ladi */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {/* Box Input Box */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        <span>Box (बॉक्स)</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          ₹{item.cartonPrice}/box
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateItemQty(
                              item.productId,
                              Math.max(0, item.cartonQty - 1),
                              item.pieceQty
                            )
                          }
                          className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-sm active:scale-95"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.cartonQty === 0 ? '' : item.cartonQty}
                          placeholder="0"
                          onChange={(e) =>
                            handleUpdateItemQty(
                              item.productId,
                              parseInt(e.target.value) || 0,
                              item.pieceQty
                            )
                          }
                          className="w-full text-center font-black text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded py-1 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateItemQty(
                              item.productId,
                              item.cartonQty + 1,
                              item.pieceQty
                            )
                          }
                          className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-sm active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Loose Ladi Input Box */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        <span>Ladi (खुली लड़ी)</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          ₹{item.piecePrice}/ladi
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateItemQty(
                              item.productId,
                              item.cartonQty,
                              Math.max(0, item.pieceQty - 1)
                            )
                          }
                          className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-sm active:scale-95"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.pieceQty === 0 ? '' : item.pieceQty}
                          placeholder="0"
                          onChange={(e) =>
                            handleUpdateItemQty(
                              item.productId,
                              item.cartonQty,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full text-center font-black text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded py-1 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateItemQty(
                              item.productId,
                              item.cartonQty,
                              item.pieceQty + 1
                            )
                          }
                          className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-sm active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Line Total Calculation Display */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Total:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {item.cartonQty === 0
                          ? `${item.pieceQty} Ladi`
                          : item.pieceQty === 0
                          ? `${item.cartonQty} Box (${item.totalPieces} Ladi)`
                          : `${item.cartonQty} Box + ${item.pieceQty} Ladi (${item.totalPieces} Ladi)`}
                      </strong>
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      ₹{item.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Insufficient Stock Warning */}
                  {isExceeded && (
                    <div className="mt-2 p-2 bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 rounded-lg flex items-center gap-2 text-rose-800 dark:text-rose-200 text-[11px] font-bold animate-pulse">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        {lang === 'hi'
                          ? `स्टॉक कम है! गोदाम में कुल ${availablePieces} लड़ी हैं।`
                          : `Insufficient stock! Only ${availablePieces} ladi in godown.`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bill Calculation Summary Card */}
      {cart.length > 0 && (
        <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Subtotal ({cart.length} items)</span>
            <span className="font-bold text-white text-sm">₹{subtotal}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Discount (छूट)</span>
            <div className="flex items-center gap-1 w-28">
              <span className="text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                value={discount === 0 ? '' : discount}
                placeholder="0"
                onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide block">
                Grand Total (कुल देय)
              </span>
              <span className="text-[10px] text-slate-400">
                Payment: {paymentMethod.toUpperCase()}
              </span>
            </div>
            <div className="text-2xl font-black text-white">
              ₹{grandTotal.toLocaleString('en-IN')}
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-500 rounded-xl text-rose-200 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="button"
            disabled={!stockValidation.isValid || cart.length === 0}
            onClick={handleSubmitBill}
            className={`w-full py-3.5 rounded-xl font-black text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-98 ${
              stockValidation.isValid && cart.length > 0
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-70'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {lang === 'hi'
                ? 'बिल सेव करें (Save Bill & Deduct Stock)'
                : 'Save Bill & Deduct Stock'}
            </span>
          </button>
        </div>
      )}

      {/* Product Catalog / Quick Add to Cart Search */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wide">
            {lang === 'hi' ? 'सामान चुनें (Select Products)' : 'Product Catalog'}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {filteredProducts.length} items available
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={
              lang === 'hi'
                ? 'नाम या बारकोड से खोजें...'
                : 'Search product or scan barcode...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition active:scale-95 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Quick Grid */}
        <div className="grid grid-cols-1 gap-2 pt-1">
          {filteredProducts.map((product) => {
            const isInCart = cart.some((item) => item.productId === product.id);
            const { cartons, loosePieces } = decomposePieces(
              product.totalPieces,
              product.packSize
            );
            const isOutOfStock = product.totalPieces <= 0;

            return (
              <div
                key={product.id}
                className="p-2.5 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100/80 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-2 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {product.name}
                    </h5>
                    {product.hindiName && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline truncate">
                        ({product.hindiName})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800">
                      1 Box = {product.packSize} Ladi
                    </span>
                    <span
                      className={`font-semibold ${
                        isOutOfStock
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Stock: {cartons} Box + {loosePieces} Ladi
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-medium">
                      ({product.totalPieces} Ladi)
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1">
                    ₹{product.salePriceCarton}/Box • ₹{product.salePricePiece}/Ladi
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleAddToCart(product)}
                  className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 shrink-0 transition active:scale-95 ${
                    isOutOfStock
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : isInCart
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:border-emerald-400'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isInCart ? 'Add More' : 'Add'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
