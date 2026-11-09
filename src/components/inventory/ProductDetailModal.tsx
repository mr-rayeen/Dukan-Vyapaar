import React, { useState, useMemo } from 'react';
import { Product, StockMovement } from '../../types';
import { decomposePieces, formatStock, isLowStock } from '../../utils/stockLogic';
import {
  X,
  Package,
  Lock,
  Edit2,
  TrendingUp,
  AlertTriangle,
  History,
  PlusCircle,
  Trash2,
  Tag,
  Barcode,
  Check,
  Search,
  Calendar,
  RotateCcw,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  movements: StockMovement[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onQuickAddStock: (
    product: Product,
    addedCartons: number,
    addedPieces: number,
    newSalePriceCarton?: number,
    newSalePricePiece?: number,
    newPurchaseRateCarton?: number
  ) => void;
  onDelete: (productId: string) => void;
  lang: 'hi' | 'en';
  defaultOpenAddStock?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  movements,
  isOpen,
  onClose,
  onEdit,
  onQuickAddStock,
  onDelete,
  lang,
  defaultOpenAddStock = false,
}) => {
  const [showAddStockForm, setShowAddStockForm] = useState(defaultOpenAddStock);
  const [addBoxes, setAddBoxes] = useState<number>(1);
  const [addLadi, setAddLadi] = useState<number>(0);
  const [salePriceBox, setSalePriceBox] = useState<number>(0);
  const [salePriceLadi, setSalePriceLadi] = useState<number>(0);
  const [purchaseRateBox, setPurchaseRateBox] = useState<number>(0);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Movement history search & date-range filter states
  const [historySearch, setHistorySearch] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'in' | 'out'>('all');

  React.useEffect(() => {
    if (product && isOpen) {
      setSalePriceBox(product.salePriceCarton || 0);
      setSalePriceLadi(product.salePricePiece || 0);
      setPurchaseRateBox(product.purchaseRateCarton || 0);
      setAddBoxes(1);
      setAddLadi(0);
      setShowAddStockForm(defaultOpenAddStock);
      setIsConfirmingDelete(false);
      setHistorySearch('');
      setHistoryStartDate('');
      setHistoryEndDate('');
      setHistoryTypeFilter('all');
    }
  }, [product?.id, defaultOpenAddStock, isOpen]);

  const productMovements = useMemo(() => {
    if (!product) return [];
    return movements.filter((m) => m.productId === product.id);
  }, [movements, product]);

  const filteredMovements = useMemo(() => {
    return productMovements.filter((mov) => {
      // 1. Type filter (All / Added / Removed)
      if (historyTypeFilter === 'in' && mov.totalPiecesDelta <= 0) return false;
      if (historyTypeFilter === 'out' && mov.totalPiecesDelta >= 0) return false;

      // 2. Search query filter (referenceId, type, notes, or formatted date)
      if (historySearch.trim()) {
        const q = historySearch.trim().toLowerCase();
        const matchRef = mov.referenceId?.toLowerCase().includes(q) || false;
        const matchType = mov.type.toLowerCase().includes(q);
        const matchNotes = mov.notes?.toLowerCase().includes(q) || false;
        const dateStr = new Date(mov.timestamp).toLocaleDateString().toLowerCase();
        const matchDate = dateStr.includes(q);
        if (!matchRef && !matchType && !matchNotes && !matchDate) {
          return false;
        }
      }

      // 3. Date range filter (Start Date & End Date)
      if (historyStartDate || historyEndDate) {
        const movDate = new Date(mov.timestamp);
        const movYMD = `${movDate.getFullYear()}-${String(movDate.getMonth() + 1).padStart(2, '0')}-${String(movDate.getDate()).padStart(2, '0')}`;
        if (historyStartDate && movYMD < historyStartDate) return false;
        if (historyEndDate && movYMD > historyEndDate) return false;
      }

      return true;
    });
  }, [productMovements, historyTypeFilter, historySearch, historyStartDate, historyEndDate]);

  if (!isOpen || !product) return null;

  const { cartons: boxes, loosePieces: looseLadi } = decomposePieces(product.totalPieces, product.packSize);
  const lowStock = isLowStock(product.totalPieces, product.lowStockThresholdPieces);
  const costPerLadi = product.purchaseRateCarton / (product.packSize || 1);
  const marginPerLadi = product.salePricePiece - costPerLadi;
  const marginPerBox = product.salePriceCarton - product.purchaseRateCarton;

  const handleConfirmAddStock = () => {
    if (addBoxes > 0 || addLadi > 0) {
      onQuickAddStock(
        product,
        addBoxes,
        addLadi,
        salePriceBox,
        salePriceLadi,
        purchaseRateBox
      );
      setAddBoxes(1);
      setAddLadi(0);
      setShowAddStockForm(false);
      onClose();
    }
  };

  const handleExecuteDelete = () => {
    onDelete(product.id);
    setIsConfirmingDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 p-4 text-white flex items-start justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wide">
              {product.category}
            </span>
            <h3 className="text-base font-extrabold truncate mt-0.5">{product.name}</h3>
            {product.hindiName && (
              <p className="text-xs text-blue-100 mt-0.5">{product.hindiName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-blue-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* PERMANENT SAVED PACK SIZE CARD */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/40 dark:border-emerald-700/50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300">
                    Saved Master Pack Size
                  </span>
                  <span className="px-1.5 py-0.2 bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 rounded text-[9px] font-bold">
                    Fixed
                  </span>
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  1 Box = <span className="text-emerald-700 dark:text-emerald-400">{product.packSize} Ladi (लड़ी)</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onEdit(product)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg shadow-2xs hover:bg-emerald-100/50 dark:hover:bg-slate-700 flex items-center gap-1 active:scale-95 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          {/* Current Stock Banner */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Current Stock (मौजूदा माल)
              </span>
              {lowStock && (
                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold text-[10px] rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Low Stock Alert</span>
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {boxes} <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Box</span> + {looseLadi} <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Ladi</span>
                </div>
                <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mt-0.5">
                  = {product.totalPieces.toLocaleString('en-IN')} Total Ladi (लड़ी) in Master
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddStockForm(!showAddStockForm)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{lang === 'hi' ? 'स्टॉक जोड़ें' : 'Add Stock'}</span>
              </button>
            </div>

            {/* Quick Add Stock Form with Selling Price for Box and Ladi */}
            {showAddStockForm && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{lang === 'hi' ? 'स्टॉक जोड़ें व बिक्री भाव सेट करें:' : 'Add Stock & Set Selling Prices:'}</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    +{(addBoxes * product.packSize) + addLadi} Total Ladi
                  </span>
                </div>

                {/* Quantities to Add */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      {lang === 'hi' ? 'बॉक्स जोड़ें (Boxes to Add)' : 'Boxes to Add'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={addBoxes === 0 ? '' : addBoxes}
                      placeholder="0"
                      onChange={(e) => setAddBoxes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-center text-sm font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      {lang === 'hi' ? 'खुली लड़ी (Loose Ladi)' : 'Loose Ladi to Add'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={addLadi === 0 ? '' : addLadi}
                      placeholder="0"
                      onChange={(e) => setAddLadi(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-center text-sm font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Selling Prices & Rates at Stock Add Time */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300/80 dark:border-emerald-800/70 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{lang === 'hi' ? 'बिक्री भाव सेट करें (Set Selling Prices)' : 'Set Selling Prices for this Stock'}</span>
                    </span>
                    <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                      Per Box & Ladi
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Selling Price for Box */}
                    <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 shadow-2xs">
                      <label className="text-[10px] font-black text-slate-700 dark:text-slate-200 block mb-1">
                        {lang === 'hi' ? 'बॉक्स बिक्री भाव (Sale/Box)' : 'Selling Price / Box'} <span className="text-emerald-700 dark:text-emerald-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={salePriceBox === 0 ? '' : salePriceBox}
                          placeholder="0"
                          onChange={(e) => setSalePriceBox(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-6 pr-2 py-1 text-xs font-black text-emerald-700 dark:text-emerald-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-0.5 text-right">
                        1 Box = {product.packSize} Ladi
                      </span>
                    </div>

                    {/* Selling Price for Ladi */}
                    <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 shadow-2xs">
                      <label className="text-[10px] font-black text-slate-700 dark:text-slate-200 block mb-1">
                        {lang === 'hi' ? 'लड़ी बिक्री भाव (Sale/Ladi)' : 'Selling Price / Ladi'} <span className="text-emerald-700 dark:text-emerald-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={salePriceLadi === 0 ? '' : salePriceLadi}
                          placeholder="0"
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setSalePriceLadi(val);
                            // If box price not yet set, suggest standard bulk price
                            if (product.packSize > 0 && (!salePriceBox || salePriceBox === 0)) {
                              setSalePriceBox(Math.round(val * product.packSize * 0.95));
                            }
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-6 pr-2 py-1 text-xs font-black text-emerald-700 dark:text-emerald-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-0.5 text-right">
                        Single loose piece
                      </span>
                    </div>
                  </div>

                  {/* Purchase Cost (Buy Rate) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {lang === 'hi' ? 'खरीद दर (Buy Rate/Box):' : 'Purchase Cost (Buy/Box):'}
                    </span>
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={purchaseRateBox === 0 ? '' : purchaseRateBox}
                        placeholder="0"
                        onChange={(e) => setPurchaseRateBox(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-6 pr-2 py-0.5 text-xs font-bold text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 text-right"
                      />
                    </div>
                  </div>

                  {/* Live Margin Calculation */}
                  {salePriceBox > 0 && purchaseRateBox > 0 && (
                    <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg flex items-center justify-between border border-emerald-200 dark:border-emerald-800">
                      <span>{lang === 'hi' ? 'अनुमानित मुनाफा प्रति बॉक्स:' : 'Profit Margin / Box:'}</span>
                      <span className="font-black text-emerald-700 dark:text-emerald-400 text-xs">
                        +₹{(salePriceBox - purchaseRateBox).toFixed(0)} ({(((salePriceBox - purchaseRateBox) / purchaseRateBox) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Action Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStockForm(false)}
                    className="py-2.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition"
                  >
                    {lang === 'hi' ? 'रद्द' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAddStock}
                    disabled={addBoxes === 0 && addLadi === 0}
                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-98 transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {lang === 'hi'
                        ? `स्टॉक व भाव अपडेट करें (+${(addBoxes * product.packSize) + addLadi} लड़ी)`
                        : `Confirm Stock & Prices (+${(addBoxes * product.packSize) + addLadi} Ladi)`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Margins Card */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[11px] block">
              Pricing & Margin Breakdown
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Box Pricing (बॉक्स)</span>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Buy Rate:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{product.purchaseRateCarton}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Sale Rate:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{product.salePriceCarton}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-emerald-800 dark:text-emerald-300 font-extrabold">
                  <span>Margin:</span>
                  <span>+₹{marginPerBox}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Single Ladi Pricing (लड़ी)</span>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Cost/Ladi:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{costPerLadi.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Sale Rate:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{product.salePricePiece}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-emerald-800 dark:text-emerald-300 font-extrabold">
                  <span>Margin/Ladi:</span>
                  <span>+₹{marginPerLadi.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock History Timeline with Search & Date-Range Filter */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{lang === 'hi' ? 'स्टॉक हिस्ट्री (आवक - जावक)' : 'Stock Movement History'}</span>
              </h4>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                {filteredMovements.length} / {productMovements.length} {lang === 'hi' ? 'रिकॉर्ड' : 'Records'}
              </span>
            </div>

            {productMovements.length > 0 && (
              <div className="space-y-2">
                {/* Search Input & Type Filter */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder={
                        lang === 'hi'
                          ? 'बिल नंबर, सप्लायर या नोट खोजें...'
                          : 'Search bill #, supplier, note...'
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-6 py-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    {historySearch && (
                      <button
                        type="button"
                        onClick={() => setHistorySearch('')}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Quick Type Filter (All / In / Out) */}
                  <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setHistoryTypeFilter('all')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                        historyTypeFilter === 'all'
                          ? 'bg-slate-800 dark:bg-slate-700 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {lang === 'hi' ? 'सभी' : 'All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryTypeFilter('in')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                        historyTypeFilter === 'in'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                    >
                      +In
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryTypeFilter('out')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                        historyTypeFilter === 'out'
                          ? 'bg-rose-600 text-white'
                          : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                    >
                      -Out
                    </button>
                  </div>
                </div>

                {/* Date-Range Filter */}
                <div className="grid grid-cols-2 gap-1.5 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-0.5">
                      <Calendar className="w-2.5 h-2.5 text-slate-400" />
                      <span>{lang === 'hi' ? 'शुरुआती तारीख (From)' : 'From Date'}</span>
                    </label>
                    <input
                      type="date"
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-slate-400" />
                        <span>{lang === 'hi' ? 'अंतिम तारीख (To)' : 'To Date'}</span>
                      </label>
                      {(historyStartDate || historyEndDate || historySearch || historyTypeFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setHistorySearch('');
                            setHistoryStartDate('');
                            setHistoryEndDate('');
                            setHistoryTypeFilter('all');
                          }}
                          className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {productMovements.length === 0 ? (
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-slate-400 dark:text-slate-500 text-xs">
                {lang === 'hi'
                  ? 'इस प्रोडक्ट के लिए अभी कोई स्टॉक हिस्ट्री नहीं है।'
                  : 'No recent movements recorded for this product yet.'}
              </div>
            ) : filteredMovements.length === 0 ? (
              <div className="p-4 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-slate-500 dark:text-slate-400 space-y-1">
                <p className="font-bold text-xs">
                  {lang === 'hi'
                    ? 'चुनी गई तारीख या खोज के लिए कोई रिकॉर्ड नहीं मिला।'
                    : 'No stock movements match your search or date range.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setHistorySearch('');
                    setHistoryStartDate('');
                    setHistoryEndDate('');
                    setHistoryTypeFilter('all');
                  }}
                  className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {lang === 'hi' ? 'फ़िल्टर साफ़ करें (Clear Filters)' : 'Clear All Filters'}
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {filteredMovements.map((mov, index) => {
                  const isPositive = mov.totalPiecesDelta > 0;
                  return (
                    <div
                      key={`${mov.id}-${index}`}
                      className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between gap-2 text-xs hover:border-blue-200 dark:hover:border-blue-800 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white capitalize flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              isPositive
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {mov.type}
                          </span>
                          {mov.referenceId && (
                            <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                              {mov.referenceId}
                            </span>
                          )}
                        </div>
                        {mov.notes && (
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5 font-medium">
                            {mov.notes}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                          {new Date(mov.timestamp).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          •{' '}
                          {new Date(mov.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`font-black text-xs block ${
                            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isPositive ? '+' : '-'}
                          {mov.cartonQty} Box + {mov.pieceQty} Ladi
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                          Bal: {mov.remainingTotalPieces} Ladi
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800">
          {isConfirmingDelete ? (
            <div className="flex items-center justify-between gap-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl animate-in fade-in">
              <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Delete {product.name}?</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-lg shadow-xs transition"
                >
                  Yes, Delete (हटाएं)
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="p-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 rounded-xl border border-rose-200 dark:border-rose-800 transition flex items-center justify-center shrink-0"
                title="Delete product"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onEdit(product);
                  onClose();
                }}
                className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Product Details (पैक साइज बदलें)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
