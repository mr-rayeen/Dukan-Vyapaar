import React, { useState, useRef } from 'react';
import { Product, SupplierPurchase, SupplierPurchaseItem } from '../../types';
import { PackSizeSelector } from '../common/PackSizeSelector';
import { composePieces, decomposePieces } from '../../utils/stockLogic';
import { generateUniqueId } from '../../utils/idGenerator';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  Tag,
} from 'lucide-react';

interface ScanBillScreenProps {
  products: Product[];
  onConfirmPurchase: (purchase: SupplierPurchase, updatedProducts: Product[]) => void;
  lang: 'hi' | 'en';
}

export const ScanBillScreen: React.FC<ScanBillScreenProps> = ({
  products,
  onConfirmPurchase,
  lang,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [billImage, setBillImage] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [reviewItems, setReviewItems] = useState<SupplierPurchaseItem[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Match OCR product name with existing master products
  const matchProductInMaster = (name: string): Product | undefined => {
    const clean = name.toLowerCase().trim();
    return products.find((p) => {
      const pName = p.name.toLowerCase();
      return (
        pName === clean ||
        pName.includes(clean) ||
        clean.includes(pName) ||
        (p.hindiName && p.hindiName.toLowerCase().includes(clean))
      );
    });
  };

  // Process OCR Response data into review items with LOCKED pack size for existing products
  const setupReviewItems = (rawItems: any[], supplier: string, invNo: string, invDate: string) => {
    const mapped: SupplierPurchaseItem[] = rawItems.map((item) => {
      const matched = matchProductInMaster(item.productName);

      if (matched) {
        // EXISTING PRODUCT: Auto-load saved pack size from master and LOCK it!
        return {
          productName: matched.name,
          matchedProductId: matched.id,
          isNewProduct: false,
          packSize: matched.packSize, // Locked from master!
          isPackSizeLocked: true, // Master Locked!
          cartonQty: item.cartonQty || 0,
          pieceQty: item.pieceQty || 0,
          rate: item.rate || matched.purchaseRateCarton || 0,
          rateType: (item.rateType as 'carton' | 'piece') || 'carton',
          totalAmount:
            item.totalAmount ||
            ((item.cartonQty || 0) * (item.rate || matched.purchaseRateCarton || 0)),
          confidence: (item.confidence as 'high' | 'medium' | 'low') || 'high',
          salePriceCarton: item.salePriceCarton || matched.salePriceCarton || Math.round((item.rate || matched.purchaseRateCarton || 0) * 1.15),
          salePricePiece: item.salePricePiece || matched.salePricePiece || Math.round(((item.rate || matched.purchaseRateCarton || 0) / (matched.packSize || 1)) * 1.25),
        };
      } else {
        // NEW PRODUCT: Ask user for pack size once, then save to master!
        const defaultPack = item.suggestedPackSize || 24;
        const buyRate = item.rate || 300;
        return {
          productName: item.productName || 'New FMCG Product',
          isNewProduct: true,
          packSize: defaultPack,
          isPackSizeLocked: false, // User can select pack size
          cartonQty: item.cartonQty !== undefined ? item.cartonQty : 5,
          pieceQty: item.pieceQty !== undefined ? item.pieceQty : 0,
          rate: buyRate,
          rateType: (item.rateType as 'carton' | 'piece') || 'carton',
          totalAmount:
            item.totalAmount ||
            ((item.cartonQty || 5) * buyRate),
          confidence: (item.confidence as 'high' | 'medium' | 'low') || 'medium',
          salePriceCarton: item.salePriceCarton || Math.round(buyRate * 1.15),
          salePricePiece: item.salePricePiece || Math.round((buyRate / defaultPack) * 1.25),
        };
      }
    });

    setSupplierName(supplier || 'Wholesale Supplier');
    setInvoiceNumber(invNo || `PB-${Math.floor(1000 + Math.random() * 9000)}`);
    setInvoiceDate(invDate || new Date().toISOString().split('T')[0]);
    setReviewItems(mapped);
    setReviewMode(true);
    setIsProcessing(false);
  };

  // Call OCR API with image base64
  const handleProcessImage = async (base64Str: string) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ocr-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Str,
          mimeType: 'image/jpeg',
        }),
      });

      if (!res.ok) {
        throw new Error(`OCR processing failed: ${res.statusText}`);
      }

      const data = await res.json();
      setupReviewItems(
        data.items || [],
        data.supplierName || 'Rajdhani Wholesale Mart',
        data.invoiceNumber || 'INV-9901',
        data.invoiceDate || new Date().toISOString().split('T')[0]
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Could not process bill photo. Try again or use Sample Bill.');
      setIsProcessing(false);
    }
  };

  // File Input Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setBillImage(base64);
      handleProcessImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // Instant Sample Bill Test (for easy 1-tap testing without requiring a physical paper invoice)
  const handleLoadSampleBill = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // Simulate bill containing 2 existing products + 2 new products
      const sampleItems = [
        {
          productName: 'Parle-G Gold Biscuits (100g)',
          cartonQty: 10,
          pieceQty: 0,
          rate: 240,
          rateType: 'carton',
          totalAmount: 2400,
          confidence: 'high',
        },
        {
          productName: 'Maggi 2-Minute Masala Noodles (70g)',
          cartonQty: 8,
          pieceQty: 12,
          rate: 600,
          rateType: 'carton',
          totalAmount: 4950,
          confidence: 'high',
        },
        {
          productName: 'Britannia Good Day Butter (65g)', // NEW PRODUCT!
          cartonQty: 12,
          pieceQty: 0,
          rate: 480,
          rateType: 'carton',
          totalAmount: 5760,
          confidence: 'high',
          suggestedPackSize: 36,
        },
        {
          productName: 'Haldiram Bhujia Sev (200g)', // NEW PRODUCT with low confidence demo!
          cartonQty: 6,
          pieceQty: 4,
          rate: 420,
          rateType: 'carton',
          totalAmount: 2590,
          confidence: 'low', // triggers yellow highlight!
          suggestedPackSize: 24,
        },
      ];

      setupReviewItems(
        sampleItems,
        'Shree Ganesh FMCG Distributors Pvt Ltd',
        'INV-2026-8842',
        new Date().toISOString().split('T')[0]
      );
    }, 800);
  };

  // Update Review Item
  const handleUpdateItem = (index: number, updates: Partial<SupplierPurchaseItem>) => {
    const updated = [...reviewItems];
    const current = updated[index];
    const nextItem = { ...current, ...updates };

    // recalculate total
    if (nextItem.rateType === 'carton') {
      nextItem.totalAmount = nextItem.cartonQty * nextItem.rate;
    } else {
      const totalPieces = (nextItem.cartonQty * nextItem.packSize) + nextItem.pieceQty;
      nextItem.totalAmount = totalPieces * nextItem.rate;
    }

    updated[index] = nextItem;
    setReviewItems(updated);
  };

  const handleRemoveReviewItem = (index: number) => {
    setReviewItems(reviewItems.filter((_, idx) => idx !== index));
  };

  // CONFIRM & ADD STOCK TO MASTER
  const handleConfirmAddStock = () => {
    if (reviewItems.length === 0) {
      setErrorMsg('No items to add into stock!');
      return;
    }

    // Check that all new products have a valid pack size > 0
    for (const item of reviewItems) {
      if (!item.packSize || item.packSize <= 0) {
        setErrorMsg(`Please specify pack size for "${item.productName}"`);
        return;
      }
    }

    // Clone products list
    let updatedProducts = [...products];

    reviewItems.forEach((item) => {
      const piecesToAdd = (item.cartonQty * item.packSize) + item.pieceQty;

      if (item.matchedProductId) {
        // EXISTING PRODUCT: Increase stock & update selling prices if set
        updatedProducts = updatedProducts.map((p) => {
          if (p.id === item.matchedProductId) {
            return {
              ...p,
              totalPieces: p.totalPieces + piecesToAdd,
              purchaseRateCarton: item.rate > 0 ? item.rate : p.purchaseRateCarton,
              salePriceCarton: (item.salePriceCarton && item.salePriceCarton > 0) ? item.salePriceCarton : p.salePriceCarton,
              salePricePiece: (item.salePricePiece && item.salePricePiece > 0) ? item.salePricePiece : p.salePricePiece,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });
      } else {
        // NEW PRODUCT: Create in master with permanently saved pack size and selling prices!
        const newProduct: Product = {
          id: generateUniqueId('prod'),
          name: item.productName,
          category: 'Grocery & FMCG',
          packSize: item.packSize, // Saved permanently in master!
          totalPieces: piecesToAdd,
          purchaseRateCarton: item.rate,
          salePriceCarton: (item.salePriceCarton && item.salePriceCarton > 0) ? item.salePriceCarton : Math.round(item.rate * 1.15),
          salePricePiece: (item.salePricePiece && item.salePricePiece > 0) ? item.salePricePiece : Math.round((item.rate / item.packSize) * 1.25),
          lowStockThresholdPieces: item.packSize * 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedProducts.push(newProduct);
      }
    });

    // Create Purchase Record
    const totalPurchaseAmount = reviewItems.reduce((acc, i) => acc + i.totalAmount, 0);
    const purchaseRecord: SupplierPurchase = {
      id: generateUniqueId('pur'),
      invoiceNumber,
      supplierName,
      invoiceDate,
      totalAmount: totalPurchaseAmount,
      items: reviewItems,
      scannedAt: new Date().toISOString(),
    };

    onConfirmPurchase(purchaseRecord, updatedProducts);
    setSuccessMsg(true);
    setReviewMode(false);
  };

  return (
    <div className="space-y-3 pb-24">
      {/* Hidden file & camera inputs */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Title Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-2xl p-4 text-white shadow-md">
        <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wide">
          {lang === 'hi' ? 'कैमरा पर्ची स्कैनर (AI Purchase OCR)' : 'Camera Purchase Bill OCR'}
        </span>
        <h2 className="text-xl font-black mt-0.5 tracking-tight">
          {lang === 'hi' ? 'सप्लायर पर्ची स्कैन करें' : 'Scan Supplier Bill'}
        </h2>
        <p className="text-xs text-blue-100 mt-0.5">
          {lang === 'hi'
            ? 'पर्ची की फोटो खींचें, बॉक्स और लड़ी स्वतः निकल आएंगे।'
            : 'Capture invoice photo to auto-extract items, boxes, ladi & rates.'}
        </p>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 text-center space-y-2 animate-in zoom-in">
          <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-extrabold text-sm text-emerald-950">
            {lang === 'hi' ? 'स्टॉक सफलतापूर्वक गोदाम में जुड़ गया!' : 'Stock Successfully Added to Godown!'}
          </h3>
          <p className="text-xs text-emerald-800">
            All pack sizes and cartons have been saved into the master inventory.
          </p>
          <button
            type="button"
            onClick={() => {
              setSuccessMsg(false);
              setReviewItems([]);
              setBillImage(null);
            }}
            className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Scan Another Bill (दूसरी पर्ची स्कैन करें)
          </button>
        </div>
      )}

      {/* Capture Mode Screen (When not reviewing) */}
      {!reviewMode && !successMsg && (
        <div className="space-y-3">
          {/* Main Action Buttons */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-inner">
              <Camera className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                {lang === 'hi' ? 'पर्ची की साफ फोटो लें' : 'Snap Supplier Invoice Photo'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Works with printed wholesale bills, GST tax invoices, challans, and handwritten kaccha parchi.
              </p>
            </div>

            {isProcessing ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center gap-3 text-blue-800 text-xs font-bold">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span>AI Gemini is reading invoice items & pack sizes...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Big Camera Button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-black text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-2.5 transition"
                >
                  <Camera className="w-5 h-5" />
                  <span>{lang === 'hi' ? 'कैमरा खोलें (Take Photo)' : 'Take Photo with Camera'}</span>
                </button>

                {/* Upload from Gallery Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>{lang === 'hi' ? 'गैलरी से फोटो चुनें (Upload Photo)' : 'Upload Invoice from Gallery'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick 1-Tap Demo Test Button */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase text-amber-900 tracking-wide block">
                Instant 1-Tap Test (परीक्षण हेतु)
              </span>
              <p className="text-xs text-amber-950 font-semibold truncate">
                Test with realistic sample wholesale distributor bill
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleLoadSampleBill}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs shrink-0 transition flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Bill</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* REVIEW SCREEN (As explicitly required by prompt) */}
      {reviewMode && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Review Screen (जांच और पुष्टि)</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {reviewItems.length} Items Detected
              </span>
            </div>

            {/* Supplier & Bill Header Inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Supplier Name</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Bill Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* List of Detected Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-600 uppercase">
                Products in Purchase Bill
              </span>
              <span className="text-[10px] text-slate-400">
                Yellow = Low Confidence
              </span>
            </div>

            {reviewItems.map((item, index) => {
              const isLowConfidence = item.confidence === 'low';
              const matchedProduct = item.matchedProductId
                ? products.find((p) => p.id === item.matchedProductId)
                : null;

              return (
                <div
                  key={index}
                  className={`border rounded-xl p-3 shadow-2xs space-y-2.5 transition ${
                    isLowConfidence
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300' // Yellow highlight if confidence is low!
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Top row: Product Name & Master Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => handleUpdateItem(index, { productName: e.target.value })}
                          className="font-extrabold text-xs text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none w-full"
                        />
                      </div>

                      {/* Existing vs New Product Badge */}
                      <div className="flex items-center gap-2 mt-1">
                        {item.isPackSizeLocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            <Lock className="w-3 h-3 text-emerald-700" />
                            <span>1 Box = {item.packSize} Ladi (Saved in Master)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                            <Plus className="w-3 h-3" />
                            <span>New Product (Set Pack Size Once)</span>
                          </span>
                        )}

                        {isLowConfidence && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Check Low OCR</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveReviewItem(index)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* PACK SIZE SECTION:
                      For EXISTING products: locked & greyed out.
                      For NEW products: active PackSizeSelector.
                  */}
                  <div className="pt-1">
                    {item.isPackSizeLocked ? (
                      <div className="bg-slate-100/90 border border-slate-200 rounded-lg p-2 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-slate-500" />
                          <span className="font-semibold text-slate-700">
                            Saved Pack Size: <strong>1 Box = {item.packSize} Ladi</strong>
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Locked in Master
                        </span>
                      </div>
                    ) : (
                      <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-2.5">
                        <PackSizeSelector
                          value={item.packSize}
                          onChange={(newSize) => handleUpdateItem(index, { packSize: newSize })}
                          label="Choose Pack Size for New Product (1 Box = ? Ladi)"
                          showHelper={false}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Editable Quantities: Box, Loose Ladi, Buy Rate */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        Boxes (बॉक्स)
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={item.cartonQty === 0 ? '' : item.cartonQty}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateItem(index, { cartonQty: parseInt(e.target.value) || 0 })
                        }
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        Ladi (खुली लड़ी)
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={item.pieceQty === 0 ? '' : item.pieceQty}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateItem(index, { pieceQty: parseInt(e.target.value) || 0 })
                        }
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <span className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        Buy/Box (खरीद)
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={item.rate === 0 ? '' : item.rate}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateItem(index, { rate: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Selling Price for Box & Selling Price for Ladi at Stock Addition */}
                  <div className="bg-emerald-50/70 border border-emerald-300/80 rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-emerald-900 uppercase flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>{lang === 'hi' ? 'बिक्री भाव सेट करें' : 'Set Selling Prices'}</span>
                      </span>
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-200/80 px-1.5 py-0.5 rounded">
                        Box & Ladi
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white border border-emerald-200 rounded-md p-1.5">
                        <span className="text-[9px] font-bold text-slate-600 block">
                          Sale / Box (बॉक्स भाव)
                        </span>
                        <div className="relative mt-0.5">
                          <span className="absolute left-1.5 top-0.5 text-[11px] font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={item.salePriceCarton === 0 ? '' : item.salePriceCarton}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateItem(index, { salePriceCarton: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full pl-4 pr-1 py-0.5 text-xs font-black text-emerald-700 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="bg-white border border-emerald-200 rounded-md p-1.5">
                        <span className="text-[9px] font-bold text-slate-600 block">
                          Sale / Ladi (लड़ी भाव)
                        </span>
                        <div className="relative mt-0.5">
                          <span className="absolute left-1.5 top-0.5 text-[11px] font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={item.salePricePiece === 0 ? '' : item.salePricePiece}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateItem(index, { salePricePiece: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full pl-4 pr-1 py-0.5 text-xs font-black text-emerald-700 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Item Total calculation */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500">
                      Total Ladi: <strong>{(item.cartonQty * item.packSize) + item.pieceQty} Ladi</strong>
                    </span>
                    <span className="font-black text-slate-900 text-sm">
                      ₹{item.totalAmount.toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Review Summary & Confirm Button */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Total Bill Amount</span>
              <span className="text-xl font-black text-white">
                ₹{reviewItems.reduce((acc, i) => acc + i.totalAmount, 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReviewMode(false)}
                className="py-3 px-3 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAddStock}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Add Stock (स्टॉक अपडेट करें)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
