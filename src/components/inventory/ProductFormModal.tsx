import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { PackSizeSelector } from '../common/PackSizeSelector';
import { composePieces, decomposePieces } from '../../utils/stockLogic';
import { generateUniqueId } from '../../utils/idGenerator';
import { X, Package, Tag, Barcode, DollarSign, AlertTriangle, Trash2 } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product, isNew: boolean) => void;
  onDelete?: (productId: string) => void;
  productToEdit?: Product | null;
  lang: 'hi' | 'en';
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  productToEdit,
  lang,
}) => {
  const isNew = !productToEdit;

  const [name, setName] = useState('');
  const [hindiName, setHindiName] = useState('');
  const [category, setCategory] = useState('General Grocery');
  const [barcode, setBarcode] = useState('');
  const [packSize, setPackSize] = useState<number>(24);
  const [boxes, setBoxes] = useState<number>(0);
  const [looseLadi, setLooseLadi] = useState<number>(0);
  const [purchaseRateBox, setPurchaseRateBox] = useState<number>(240);
  const [salePriceLadi, setSalePriceLadi] = useState<number>(12);
  const [salePriceBox, setSalePriceBox] = useState<number>(280);
  const [lowStockThresholdPieces, setLowStockThresholdPieces] = useState<number>(24);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        const stock = decomposePieces(productToEdit.totalPieces, productToEdit.packSize);
        setName(productToEdit.name || '');
        setHindiName(productToEdit.hindiName || '');
        setCategory(productToEdit.category || 'General Grocery');
        setBarcode(productToEdit.barcode || '');
        setPackSize(productToEdit.packSize || 24);
        setBoxes(stock.cartons);
        setLooseLadi(stock.loosePieces);
        setPurchaseRateBox(productToEdit.purchaseRateCarton || 240);
        setSalePriceLadi(productToEdit.salePricePiece || 12);
        setSalePriceBox(productToEdit.salePriceCarton || 280);
        setLowStockThresholdPieces(productToEdit.lowStockThresholdPieces || 24);
      } else {
        setName('');
        setHindiName('');
        setCategory('General Grocery');
        setBarcode('');
        setPackSize(24);
        setBoxes(0);
        setLooseLadi(0);
        setPurchaseRateBox(240);
        setSalePriceLadi(12);
        setSalePriceBox(280);
        setLowStockThresholdPieces(24);
      }
      setIsConfirmingDelete(false);
      setError(null);
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleLadiPriceChange = (val: number) => {
    setSalePriceLadi(val);
    if (packSize > 0 && (!salePriceBox || salePriceBox === 0)) {
      setSalePriceBox(Math.round(val * packSize * 0.95)); // standard 5% bulk discount
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(lang === 'hi' ? 'कृपया प्रोडक्ट का नाम दर्ज करें।' : 'Please enter product name.');
      return;
    }
    if (!packSize || packSize <= 0) {
      setError(lang === 'hi' ? 'कृपया पैक साइज चुनें (1 बॉक्स में कितने लड़ी)।' : 'Please specify pack size (ladi in 1 box).');
      return;
    }

    const calculatedTotalPieces = composePieces(boxes, looseLadi, packSize);

    const productData: Product = {
      id: productToEdit ? productToEdit.id : generateUniqueId('prod'),
      name: name.trim(),
      hindiName: hindiName.trim() || undefined,
      category: category.trim() || 'General Grocery',
      barcode: barcode.trim() || undefined,
      packSize, // Saved permanently in product master!
      totalPieces: calculatedTotalPieces,
      purchaseRateCarton: purchaseRateBox || 0,
      salePricePiece: salePriceLadi || 0,
      salePriceCarton: salePriceBox || 0,
      lowStockThresholdPieces: lowStockThresholdPieces || packSize,
      createdAt: productToEdit ? productToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(productData, isNew);
    onClose();
  };

  const handleDelete = () => {
    if (productToEdit && onDelete) {
      onDelete(productToEdit.id);
      setIsConfirmingDelete(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-200" />
            <h3 className="font-extrabold text-base">
              {isNew
                ? lang === 'hi' ? 'नया प्रोडक्ट जोड़ें (Product Master)' : 'Add New Product Master'
                : lang === 'hi' ? 'प्रोडक्ट एडिट करें' : 'Edit Product Master'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-emerald-100 hover:text-white hover:bg-emerald-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Product Basic Info */}
          <div className="space-y-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'hi' ? 'प्रोडक्ट का नाम (Product Name)' : 'Product Name'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Parle-G Gold Biscuits (100g)"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'hi' ? 'हिन्दी नाम (वैकल्पिक)' : 'Hindi / Local Name'}
                </label>
                <input
                  type="text"
                  placeholder="उदा. पारले-जी बिस्कुट"
                  value={hindiName}
                  onChange={(e) => setHindiName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Biscuits, Spices"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* PACK SIZE SELECTOR: 1 Box = X Ladi */}
          <div className="bg-emerald-50/50 border-2 border-emerald-500/40 rounded-xl p-3">
            <PackSizeSelector
              value={packSize}
              onChange={(newSize) => setPackSize(newSize)}
              label={lang === 'hi' ? 'पैक साइज (1 बॉक्स में कितने लड़ी)' : 'Pack Size (1 Box = ? Ladi)'}
              required
            />
          </div>

          {/* Initial Stock Inputs (Boxes + Loose Ladi) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">
                {lang === 'hi' ? 'प्रारंभिक स्टॉक (Current Stock)' : 'Current Stock in Godown'}
              </label>
              <span className="text-[11px] font-extrabold text-blue-700">
                Total: {composePieces(boxes, looseLadi, packSize)} Ladi (लड़ी)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-1">
                  Boxes (बॉक्स)
                </span>
                <input
                  type="number"
                  min="0"
                  value={boxes === 0 ? '' : boxes}
                  placeholder="0"
                  onChange={(e) => setBoxes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-center text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-1">
                  Loose Ladi (खुली लड़ी)
                </span>
                <input
                  type="number"
                  min="0"
                  value={looseLadi === 0 ? '' : looseLadi}
                  placeholder="0"
                  onChange={(e) => setLooseLadi(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-center text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-500">
              Formula: ({boxes || 0} Box × {packSize} Ladi) + {looseLadi || 0} Loose = <strong className="text-slate-800">{composePieces(boxes, looseLadi, packSize)} Total Ladi</strong>
            </p>
          </div>

          {/* Pricing: Purchase & Selling Prices (Box & Ladi) */}
          <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'hi' ? 'बिक्री भाव सेट करें (Selling Prices)' : 'Selling Prices & Margin'}</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                Box & Ladi Rate
              </span>
            </div>

            {/* Selling Prices for Box and Ladi */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white border border-emerald-200 rounded-xl p-2.5 shadow-2xs">
                <span className="text-[10px] font-black text-slate-800 block mb-1">
                  {lang === 'hi' ? 'बॉक्स बिक्री भाव (Sale/Box)' : 'Selling Price / Box'} <span className="text-emerald-700">*</span>
                </span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={salePriceBox === 0 ? '' : salePriceBox}
                    placeholder="0"
                    onChange={(e) => setSalePriceBox(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-6 pr-2 py-1.5 text-xs font-black text-emerald-700 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5 text-right">
                  1 Box = {packSize} Ladi
                </span>
              </div>

              <div className="bg-white border border-emerald-200 rounded-xl p-2.5 shadow-2xs">
                <span className="text-[10px] font-black text-slate-800 block mb-1">
                  {lang === 'hi' ? 'लड़ी बिक्री भाव (Sale/Ladi)' : 'Selling Price / Ladi'} <span className="text-emerald-700">*</span>
                </span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={salePriceLadi === 0 ? '' : salePriceLadi}
                    placeholder="0"
                    onChange={(e) => handleLadiPriceChange(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-6 pr-2 py-1.5 text-xs font-black text-emerald-700 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5 text-right">
                  Single piece rate
                </span>
              </div>
            </div>

            {/* Purchase Rate & Margin */}
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-600">
                  {lang === 'hi' ? 'खरीद दर (Buy Rate/Box):' : 'Purchase Cost (Buy/Box):'}
                </span>
                <div className="relative w-32">
                  <span className="absolute left-2.5 top-1 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={purchaseRateBox === 0 ? '' : purchaseRateBox}
                    placeholder="0"
                    onChange={(e) => setPurchaseRateBox(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md pl-6 pr-2 py-0.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-right"
                  />
                </div>
              </div>

              {purchaseRateBox > 0 && salePriceBox > 0 && (
                <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg flex items-center justify-between border border-emerald-200">
                  <span>{lang === 'hi' ? 'मुनाफा प्रति बॉक्स (Profit/Box):' : 'Profit Per Box:'}</span>
                  <span className="font-extrabold text-emerald-700 text-xs">
                    ₹{(salePriceBox - purchaseRateBox).toFixed(0)} ({(((salePriceBox - purchaseRateBox) / purchaseRateBox) * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Barcode & Low Stock Threshold */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Barcode (Optional)
              </label>
              <input
                type="text"
                placeholder="Scan or enter"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Low Stock Alert (Ladi)
              </label>
              <input
                type="number"
                min="1"
                value={lowStockThresholdPieces}
                onChange={(e) => setLowStockThresholdPieces(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <span>{isNew ? 'Save Product in Master (पैक साइज सेव करें)' : 'Update Product Master'}</span>
            </button>

            {!isNew && onDelete && (
              isConfirmingDelete ? (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
                  <span className="text-xs font-bold text-rose-800">Confirm delete this item?</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg transition"
                    >
                      Yes, Delete (हटाएं)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-2.5 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Item from Inventory (सामान हटाएं)</span>
                </button>
              )
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
