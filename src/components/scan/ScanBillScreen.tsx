import React, { useState, useRef, useMemo } from 'react';
import { Product, SupplierPurchase, SupplierPurchaseItem } from '../../types';
import { PackSizeSelector } from '../common/PackSizeSelector';
import { generateUniqueId } from '../../utils/idGenerator';
import { showToast } from '../common/ToastProvider';
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
  Calendar,
  Layers,
  Tag,
  ChevronDown,
  Check,
  Package,
  X,
  Eye,
  Clock,
  Building2,
} from 'lucide-react';

interface ScanBillScreenProps {
  products: Product[];
  purchases?: SupplierPurchase[];
  onConfirmPurchase: (purchase: SupplierPurchase, updatedProducts: Product[]) => void;
  onDeletePurchase?: (purchaseId: string) => void;
  lang: 'hi' | 'en';
}

export const ScanBillScreen: React.FC<ScanBillScreenProps> = ({
  products,
  purchases = [],
  onConfirmPurchase,
  onDeletePurchase,
  lang,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setBillImage] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [reviewItems, setReviewItems] = useState<SupplierPurchaseItem[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Custom Smooth Dropdown state: 'bulk' | itemIndex | null
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<number | 'bulk' | null>(null);
  const [addingCategoryForIndex, setAddingCategoryForIndex] = useState<number | 'bulk' | null>(null);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Purchase History Detail Modal & Delete Confirmation State
  const [selectedPurchase, setSelectedPurchase] = useState<SupplierPurchase | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Combine existing product categories + standard wholesale presets + newly created categories
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    [
      'Namkeen',
      'Biscuit',
      'Snacks & Chips',
      'Kurkure & Fryums',
      'Confectionery',
      'Beverages',
      'Spices & Masala',
      'General',
    ].forEach((c) => set.add(c));
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    customCategories.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    return Array.from(set);
  }, [products, customCategories]);

  // Sort and group purchase history date-wise (newest date on top, newest bill inside date on top)
  const groupedPurchasesByDate = useMemo(() => {
    const getSortTimestamp = (p: SupplierPurchase) => {
      const scanTs = p.scannedAt ? new Date(p.scannedAt).getTime() : NaN;
      const invTs = p.invoiceDate ? new Date(p.invoiceDate).getTime() : NaN;
      if (!isNaN(scanTs)) return scanTs;
      if (!isNaN(invTs)) return invTs;
      return 0;
    };

    const sorted = [...purchases].sort((a, b) => getSortTimestamp(b) - getSortTimestamp(a));

    const groupsMap = new Map<
      string,
      {
        dateKey: string;
        items: SupplierPurchase[];
        totalAmount: number;
        totalBoxes: number;
        totalLadi: number;
      }
    >();

    sorted.forEach((pur) => {
      let dateKey = 'Unknown Date';
      const rawDate = pur.scannedAt || pur.invoiceDate;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
            d.getDate()
          ).padStart(2, '0')}`;
        } else if (pur.invoiceDate) {
          dateKey = pur.invoiceDate;
        }
      }

      const existing = groupsMap.get(dateKey);
      const billBoxes = pur.items.reduce((s, it) => s + (Number(it.cartonQty) || 0), 0);
      const billLadi = pur.items.reduce(
        (s, it) =>
          s + (Number(it.cartonQty) || 0) * (Number(it.packSize) || 1) + (Number(it.pieceQty) || 0),
        0
      );

      if (existing) {
        existing.items.push(pur);
        existing.totalAmount += Number(pur.totalAmount) || 0;
        existing.totalBoxes += billBoxes;
        existing.totalLadi += billLadi;
      } else {
        groupsMap.set(dateKey, {
          dateKey,
          items: [pur],
          totalAmount: Number(pur.totalAmount) || 0,
          totalBoxes: billBoxes,
          totalLadi: billLadi,
        });
      }
    });

    return Array.from(groupsMap.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [purchases]);

  const formatDateBanner = (dateKey: string) => {
    try {
      const [y, m, d] = dateKey.split('-').map(Number);
      if (!y || !m || !d) return dateKey;
      const dateObj = new Date(y, m - 1, d);
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}`;
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      const yestKey = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(yest.getDate()).padStart(2, '0')}`;

      const formatted = dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      if (dateKey === todayKey) {
        return lang === 'hi' ? `आज (${formatted})` : `Today, ${formatted}`;
      }
      if (dateKey === yestKey) {
        return lang === 'hi' ? `कल (${formatted})` : `Yesterday, ${formatted}`;
      }
      return formatted;
    } catch {
      return dateKey;
    }
  };

  const formatTimeFromIso = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Match OCR product name with existing master products (exact match so similar variants stay distinct)
  const matchProductInMaster = (name: string): Product | undefined => {
    if (!name) return undefined;
    const clean = name.toLowerCase().trim();
    if (!clean) return undefined;
    return products.find((p) => {
      const pName = p.name.toLowerCase().trim();
      return (
        pName === clean ||
        (p.hindiName && p.hindiName.toLowerCase().trim() === clean)
      );
    });
  };

  // Process OCR Response data into review items with LOCKED pack size for existing products
  const setupReviewItems = (rawItems: any[], supplier: string, invNo: string, invDate: string) => {
    const mapped: SupplierPurchaseItem[] = rawItems.map((item) => {
      const matched = matchProductInMaster(item.productName);

      if (matched) {
        // EXISTING PRODUCT: Auto-load saved pack size & category from master
        return {
          productName: matched.name,
          matchedProductId: matched.id,
          isNewProduct: false,
          category: matched.category || item.category || 'Namkeen',
          packSize: matched.packSize, // Locked from master!
          isPackSizeLocked: true, // Master Locked!
          cartonQty: Number(item.cartonQty) || 0,
          pieceQty: Number(item.pieceQty) || 0,
          rate: Number(item.rate) || matched.purchaseRateCarton || 0,
          rateType: (item.rateType as 'carton' | 'piece') || 'carton',
          totalAmount:
            Number(item.totalAmount) ||
            ((Number(item.cartonQty) || 0) * (Number(item.rate) || matched.purchaseRateCarton || 0)),
          confidence: (item.confidence as 'high' | 'medium' | 'low') || 'high',
          salePriceCarton:
            item.salePriceCarton ||
            matched.salePriceCarton ||
            Math.round((Number(item.rate) || matched.purchaseRateCarton || 0) * 1.15),
          salePricePiece:
            item.salePricePiece ||
            matched.salePricePiece ||
            Math.round(
              ((Number(item.rate) || matched.purchaseRateCarton || 0) / (matched.packSize || 1)) *
                1.25
            ),
        };
      } else {
        // NEW PRODUCT: Ask user for pack size & category, then save to master!
        const defaultPack = Number(item.suggestedPackSize) || 21;
        const buyRate = Number(item.rate) || 300;
        const cQty = item.cartonQty !== undefined ? Number(item.cartonQty) : 5;
        const pQty = item.pieceQty !== undefined ? Number(item.pieceQty) : 0;
        return {
          productName: item.productName || 'New FMCG Product',
          isNewProduct: true,
          category: item.category || 'Namkeen',
          packSize: [10, 12, 21, 24].includes(defaultPack) ? defaultPack : 21,
          isPackSizeLocked: false, // User can select pack size
          cartonQty: cQty,
          pieceQty: pQty,
          rate: buyRate,
          rateType: (item.rateType as 'carton' | 'piece') || 'carton',
          totalAmount: Number(item.totalAmount) || cQty * buyRate,
          confidence: (item.confidence as 'high' | 'medium' | 'low') || 'high',
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

  // Compress camera/gallery image on client before uploading so photos upload & process in a few seconds
  const compressImageForOCR = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read image file'));
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onerror = () => resolve(dataUrl);
        img.onload = () => {
          try {
            const MAX_DIM = 1100;
            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(dataUrl);
              return;
            }
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.78);
            resolve(compressedBase64);
          } catch {
            resolve(dataUrl);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  // Call OCR API with compressed image base64 and automatic retry
  const handleProcessImage = async (base64Str: string) => {
    setIsProcessing(true);
    setErrorMsg(null);

    const attemptFetch = async (timeoutMs: number) => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch('/api/ocr-bill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Str,
            mimeType: 'image/jpeg',
          }),
          signal: controller.signal,
        });
        window.clearTimeout(timeoutId);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data.message || data.error || `OCR processing failed (${res.status})`
          );
        }
        return data;
      } catch (e) {
        window.clearTimeout(timeoutId);
        throw e;
      }
    };

    try {
      let data: any;
      try {
        data = await attemptFetch(75000);
      } catch {
        // Automatic 1-time retry if a transient timeout or network blip occurred
        data = await attemptFetch(75000);
      }

      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        setupReviewItems(
          [
            {
              productName: 'New Bill Item',
              cartonQty: 1,
              pieceQty: 0,
              rate: 250,
              rateType: 'carton',
              totalAmount: 250,
              confidence: 'low',
              suggestedPackSize: 21,
              category: 'Namkeen',
            },
          ],
          data.supplierName || 'Wholesale Supplier',
          data.invoiceNumber || `PB-${Math.floor(1000 + Math.random() * 9000)}`,
          data.invoiceDate || new Date().toISOString().split('T')[0]
        );
        const warnText =
          lang === 'hi'
            ? 'फोटो में अक्षर धुंधले थे — आप नीचे सीधे आइटम का नाम और बॉक्स भर सकते हैं।'
            : 'Photo text was unclear — you can edit or add items directly below.';
        setErrorMsg(warnText);
        showToast({
          type: 'warning',
          title: lang === 'hi' ? 'फोटो धुंधली थी (Manual Review)' : 'Unclear Bill Photo',
          message: warnText,
        });
        return;
      }

      setupReviewItems(
        data.items,
        data.supplierName || 'Wholesale Supplier',
        data.invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        data.invoiceDate || new Date().toISOString().split('T')[0]
      );
      showToast({
        type: 'success',
        title: lang === 'hi' ? 'पर्ची स्कैन हो गई!' : 'Bill Scanned Successfully!',
        message:
          lang === 'hi'
            ? `${data.items.length} आइटम पढ़े गए (${data.supplierName || 'Supplier'})`
            : `Extracted ${data.items.length} items from bill`,
      });
    } catch (err: any) {
      console.error(err);
      const isTimeout = err?.name === 'AbortError';
      const errText = isTimeout
        ? lang === 'hi'
          ? 'सर्वर में अधिक समय लग रहा है। कृपया दोबारा कोशिश करें या "Load Sample Bill" दबाएं।'
          : 'Scan timed out. Please try again or use Manual / Sample Bill.'
        : lang === 'hi'
        ? `पर्ची स्कैन नहीं हो सकी (${err.message || 'Network/OCR Error'})। कृपया दोबारा कोशिश करें या नीचे "खुद आइटम जोड़ें" दबाएं।`
        : `Could not process bill photo (${err.message || 'Error'}). Try again or add items manually.`;
      setErrorMsg(errText);
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'स्कैन फेल हुआ!' : 'Bill Scan Failed',
        message: errText,
      });
      setIsProcessing(false);
    }
  };

  // File Input Handler with instant compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const compressedBase64 = await compressImageForOCR(file);
      setBillImage(compressedBase64);
      await handleProcessImage(compressedBase64);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err?.message || 'Could not load image');
    } finally {
      e.target.value = '';
    }
  };

  // Start Manual Purchase Bill Entry directly
  const handleStartManualBill = () => {
    setErrorMsg(null);
    setupReviewItems(
      [
        {
          productName: products[0]?.name || 'Parle-G Gold Biscuits (100g)',
          cartonQty: 5,
          pieceQty: 0,
          rate: products[0]?.purchaseRateCarton || 240,
          rateType: 'carton',
          totalAmount: (products[0]?.purchaseRateCarton || 240) * 5,
          confidence: 'high',
          suggestedPackSize: products[0]?.packSize || 24,
          category: products[0]?.category || 'Biscuit',
        },
      ],
      'Wholesale Supplier',
      `PB-${Math.floor(1000 + Math.random() * 9000)}`,
      new Date().toISOString().split('T')[0]
    );
  };

  // Add another blank item row inside Review Mode
  const handleAddBlankReviewItem = () => {
    const defaultPack = 21;
    const defaultRate = 300;
    setReviewItems((prev) => [
      ...prev,
      {
        productName: 'New Item',
        isNewProduct: true,
        category: prev[prev.length - 1]?.category || 'Namkeen',
        packSize: defaultPack,
        isPackSizeLocked: false,
        cartonQty: 1,
        pieceQty: 0,
        rate: defaultRate,
        rateType: 'carton',
        totalAmount: defaultRate,
        confidence: 'high',
        salePriceCarton: Math.round(defaultRate * 1.15),
        salePricePiece: Math.round((defaultRate / defaultPack) * 1.25),
      },
    ]);
    showToast({
      type: 'info',
      title: lang === 'hi' ? 'नया आइटम रो जोड़ा गया' : 'New Item Row Added',
      message: lang === 'hi' ? 'आइटम का नाम और पेटी भरें' : 'Enter item details below',
    });
  };

  // Instant Sample Bill Test
  const handleLoadSampleBill = () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setTimeout(() => {
      const sampleItems = [
        {
          productName: 'Parle-G Gold Biscuits (100g)',
          cartonQty: 10,
          pieceQty: 0,
          rate: 240,
          rateType: 'carton',
          totalAmount: 2400,
          confidence: 'high',
          category: 'Biscuit',
        },
        {
          productName: 'Maggi 2-Minute Masala Noodles (70g)',
          cartonQty: 8,
          pieceQty: 12,
          rate: 600,
          rateType: 'carton',
          totalAmount: 4950,
          confidence: 'high',
          category: 'Snacks & Chips',
        },
        {
          productName: 'Britannia Good Day Butter (65g)',
          cartonQty: 12,
          pieceQty: 0,
          rate: 480,
          rateType: 'carton',
          totalAmount: 5760,
          confidence: 'high',
          suggestedPackSize: 21,
          category: 'Biscuit',
        },
        {
          productName: 'Haldiram Bhujia Sev (200g)',
          cartonQty: 6,
          pieceQty: 4,
          rate: 420,
          rateType: 'carton',
          totalAmount: 2590,
          confidence: 'low',
          suggestedPackSize: 10,
          category: 'Namkeen',
        },
      ];

      setupReviewItems(
        sampleItems,
        'Shree Ganesh FMCG Distributors Pvt Ltd',
        'INV-2026-8842',
        new Date().toISOString().split('T')[0]
      );
    }, 300);
  };

  // Update Review Item
  const handleUpdateItem = (index: number, updates: Partial<SupplierPurchaseItem>) => {
    const updated = [...reviewItems];
    const current = updated[index];
    const nextItem = { ...current, ...updates };

    if (updates.productName !== undefined) {
      const matched = matchProductInMaster(updates.productName);
      if (matched) {
        nextItem.matchedProductId = matched.id;
        nextItem.isNewProduct = false;
        nextItem.packSize = matched.packSize;
        nextItem.isPackSizeLocked = true;
        if (!updates.category) {
          nextItem.category = matched.category || nextItem.category || 'Namkeen';
        }
      } else {
        nextItem.matchedProductId = undefined;
        nextItem.isNewProduct = true;
        nextItem.isPackSizeLocked = false;
      }
    }

    if (nextItem.rateType === 'carton') {
      nextItem.totalAmount = nextItem.cartonQty * nextItem.rate;
    } else {
      const totalPieces = nextItem.cartonQty * nextItem.packSize + nextItem.pieceQty;
      nextItem.totalAmount = totalPieces * nextItem.rate;
    }

    updated[index] = nextItem;
    setReviewItems(updated);
  };

  // Save a newly created category and apply it to the selected item or all items
  const handleSaveNewCategory = (target: number | 'bulk') => {
    const clean = newCategoryInput.trim();
    if (!clean) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'कैटेगरी का नाम खाली है!' : 'Category Name Required',
        message: lang === 'hi' ? 'कृपया कैटेगरी का नाम लिखें' : 'Please enter a valid category name.',
      });
      return;
    }
    if (!customCategories.includes(clean)) {
      setCustomCategories((prev) => [...prev, clean]);
    }
    if (target === 'bulk') {
      setReviewItems((prev) => prev.map((it) => ({ ...it, category: clean })));
    } else {
      handleUpdateItem(target, { category: clean });
    }
    setNewCategoryInput('');
    setAddingCategoryForIndex(null);
    setOpenCategoryDropdown(null);
    showToast({
      type: 'success',
      title: lang === 'hi' ? 'नई कैटेगरी बनाई गई!' : 'New Category Created!',
      message:
        target === 'bulk'
          ? `${clean} (${lang === 'hi' ? 'सभी आइटम पर लागू' : 'Applied to all items'})`
          : `${clean}`,
    });
  };

  // Bulk apply a category to all review items
  const handleApplyCategoryToAll = (cat: string) => {
    setReviewItems((prev) => prev.map((it) => ({ ...it, category: cat })));
    setOpenCategoryDropdown(null);
    showToast({
      type: 'success',
      title: lang === 'hi' ? 'सभी आइटम की कैटेगरी बदली गई!' : 'Bulk Category Applied!',
      message: `${reviewItems.length} items → ${cat}`,
    });
  };

  const handleRemoveReviewItem = (index: number) => {
    const removed = reviewItems[index];
    setReviewItems(reviewItems.filter((_, idx) => idx !== index));
    if (removed) {
      showToast({
        type: 'warning',
        title: lang === 'hi' ? 'आइटम लिस्ट से हटाया गया' : 'Item Removed from List',
        message: removed.productName,
      });
    }
  };

  // CONFIRM & ADD STOCK TO MASTER
  const handleConfirmAddStock = () => {
    if (reviewItems.length === 0) {
      const msg = lang === 'hi' ? 'स्टॉक में जोड़ने के लिए कोई आइटम नहीं है!' : 'No items to add into stock!';
      setErrorMsg(msg);
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'कोई आइटम नहीं है!' : 'Empty Item List',
        message: msg,
      });
      return;
    }

    for (const item of reviewItems) {
      if (!item.packSize || item.packSize <= 0) {
        const msg =
          lang === 'hi'
            ? `"${item.productName}" का पैक साइज (Pack Size) चुनें!`
            : `Please specify pack size for "${item.productName}"`;
        setErrorMsg(msg);
        showToast({
          type: 'error',
          title: lang === 'hi' ? 'पैक साइज अधूरा है!' : 'Invalid Pack Size',
          message: msg,
        });
        return;
      }
    }

    let updatedProducts = [...products];

    reviewItems.forEach((item) => {
      const piecesToAdd = item.cartonQty * item.packSize + item.pieceQty;
      const finalCategory = item.category?.trim() || 'Namkeen';

      if (item.matchedProductId) {
        updatedProducts = updatedProducts.map((p) => {
          if (p.id === item.matchedProductId) {
            return {
              ...p,
              category: finalCategory,
              packSize: item.packSize > 0 ? item.packSize : p.packSize,
              totalPieces: p.totalPieces + piecesToAdd,
              purchaseRateCarton: item.rate > 0 ? item.rate : p.purchaseRateCarton,
              salePriceCarton:
                item.salePriceCarton && item.salePriceCarton > 0
                  ? item.salePriceCarton
                  : p.salePriceCarton,
              salePricePiece:
                item.salePricePiece && item.salePricePiece > 0
                  ? item.salePricePiece
                  : p.salePricePiece,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });
      } else {
        const newProduct: Product = {
          id: generateUniqueId('prod'),
          name: item.productName,
          category: finalCategory,
          packSize: item.packSize,
          totalPieces: piecesToAdd,
          purchaseRateCarton: item.rate,
          salePriceCarton:
            item.salePriceCarton && item.salePriceCarton > 0
              ? item.salePriceCarton
              : Math.round(item.rate * 1.15),
          salePricePiece:
            item.salePricePiece && item.salePricePiece > 0
              ? item.salePricePiece
              : Math.round((item.rate / item.packSize) * 1.25),
          lowStockThresholdPieces: item.packSize * 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedProducts.push(newProduct);
      }
    });

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
    setReviewMode(false);
    setReviewItems([]);
    setBillImage(null);
    setErrorMsg(null);
    setOpenCategoryDropdown(null);
    setAddingCategoryForIndex(null);
    setNewCategoryInput('');
    setSuccessMsg(true);
    window.setTimeout(() => {
      setSuccessMsg(false);
    }, 3000);
  };

  return (
    <div className="space-y-3 pb-24 relative">
      {/* Invisible backdrop when custom dropdown is open */}
      {openCategoryDropdown !== null && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setOpenCategoryDropdown(null)}
        />
      )}

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
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-4 text-center space-y-2 animate-in zoom-in">
          <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h3 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100">
            {lang === 'hi'
              ? 'स्टॉक सफलतापूर्वक गोदाम में जुड़ गया!'
              : 'Stock Successfully Added to Godown!'}
          </h3>
          <p className="text-xs text-emerald-800 dark:text-emerald-300">
            {lang === 'hi'
              ? 'सभी आइटम, लड़ी और खरीद बिल हिस्ट्री में सेव हो गए हैं।'
              : 'All pack sizes, categories and cartons have been saved into inventory & history below.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSuccessMsg(false);
              setReviewItems([]);
              setBillImage(null);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            {lang === 'hi' ? 'दूसरी पर्ची स्कैन करें' : 'Scan Another Bill'}
          </button>
        </div>
      )}

      {/* Capture Mode Screen (When not reviewing) */}
      {!reviewMode && (
        <div className="space-y-3">
          {/* Main Action Buttons */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-2xs text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/70 border-4 border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto shadow-inner">
              <Camera className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {lang === 'hi' ? 'पर्ची की साफ फोटो लें' : 'Snap Supplier Invoice Photo'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {lang === 'hi'
                  ? 'प्रिंटेड होलसेल बिल, जीएसटी चालान और हाथ की लिखी कच्ची पर्ची दोनों काम करते हैं।'
                  : 'Works with printed wholesale bills, GST tax invoices, challans, and handwritten kaccha parchi.'}
              </p>
            </div>

            {isProcessing ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl flex flex-col items-center justify-center gap-2 text-blue-800 dark:text-blue-200 text-xs font-bold">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                <span>
                  {lang === 'hi'
                    ? 'पर्ची से आइटम और बॉक्स पढ़े जा रहे हैं (3-5 सेकंड)...'
                    : 'Reading invoice items & pack sizes (3-5 seconds)...'}
                </span>
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
                  <span>
                    {lang === 'hi' ? 'कैमरा खोलें (Take Photo)' : 'Take Photo with Camera'}
                  </span>
                </button>

                {/* Upload from Gallery Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-98 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Upload className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>
                    {lang === 'hi'
                      ? 'गैलरी से फोटो चुनें (Upload Photo)'
                      : 'Upload Invoice from Gallery'}
                  </span>
                </button>

                {/* Direct Manual Purchase Entry Button */}
                <button
                  type="button"
                  onClick={handleStartManualBill}
                  className="w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {lang === 'hi'
                      ? 'बिना फोटो खुद पर्ची चढ़ाएं (Manual Purchase Entry)'
                      : 'Enter Purchase Bill Manually'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Quick 1-Tap Demo Test Button */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/70 rounded-xl p-3.5 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase text-amber-900 dark:text-amber-300 tracking-wide block">
                Instant 1-Tap Test (परीक्षण हेतु)
              </span>
              <p className="text-xs text-amber-950 dark:text-amber-200 font-semibold truncate">
                {lang === 'hi'
                  ? 'सैंपल होलसेल बिल से तुरंत टेस्ट करें'
                  : 'Test with realistic sample wholesale distributor bill'}
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
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-bold space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleStartManualBill}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-black transition"
                >
                  {lang === 'hi' ? '+ खुद आइटम जोड़ें' : '+ Enter Manually'}
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleBill}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold transition"
                >
                  {lang === 'hi' ? 'सैंपल बिल लोड करें' : 'Load Sample Bill'}
                </button>
              </div>
            </div>
          )}

          {/* PURCHASE BILL & STOCK ADDITION HISTORY (Date-wise Newest to Oldest) */}
          <div className="pt-2 space-y-2.5">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                      {lang === 'hi'
                        ? 'खरीद बिल व स्टॉक हिस्ट्री (Purchase History)'
                        : 'Purchase Bill & Stock History'}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      {lang === 'hi'
                        ? 'तारीख के अनुसार (नया ऊपर, पुराना नीचे) • विवरण के लिए बिल पर टैप करें'
                        : 'Sorted newest to oldest by date • Tap any bill for full stock details'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {purchases.length} {lang === 'hi' ? 'बिल' : 'Bills'}
                </span>
              </div>
            </div>

            {groupedPurchasesByDate.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center space-y-1.5">
                <Package className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  {lang === 'hi'
                    ? 'अभी तक कोई सप्लायर खरीद बिल नहीं जोड़ा गया है'
                    : 'No supplier purchase bills added yet'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'hi'
                    ? 'ऊपर कैमरा या गैलरी से बिल स्कैन करके स्टॉक जोड़ें।'
                    : 'Scan a bill above or enter manually to add stock and track history.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedPurchasesByDate.map((group) => (
                  <div key={group.dateKey} className="space-y-2">
                    {/* Date Group Header Banner */}
                    <div className="bg-slate-200/80 dark:bg-slate-800/95 border border-slate-300/80 dark:border-slate-700 rounded-xl px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                          {formatDateBanner(group.dateKey)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          {group.items.length} {lang === 'hi' ? 'बिल' : 'Bills'} • +{group.totalBoxes}{' '}
                          {lang === 'hi' ? 'बॉक्स' : 'Box'}
                        </span>
                      </div>
                      <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                        ₹{group.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* All Purchase Bills for this Date */}
                    <div className="space-y-2 pl-1">
                      {group.items.map((pur) => {
                        const billBoxes = pur.items.reduce(
                          (s, it) => s + (Number(it.cartonQty) || 0),
                          0
                        );
                        const billLooseLadi = pur.items.reduce(
                          (s, it) => s + (Number(it.pieceQty) || 0),
                          0
                        );
                        const billTotalLadi = pur.items.reduce(
                          (s, it) =>
                            s +
                            (Number(it.cartonQty) || 0) * (Number(it.packSize) || 1) +
                            (Number(it.pieceQty) || 0),
                          0
                        );
                        const timeLabel = formatTimeFromIso(pur.scannedAt);
                        const isConfirmingDelete = confirmDeleteId === pur.id;

                        return (
                          <div
                            key={pur.id}
                            onClick={() => setSelectedPurchase(pur)}
                            className="bg-white dark:bg-slate-800 hover:bg-slate-50/90 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs transition cursor-pointer active:scale-[0.99]"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/90 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    #{pur.invoiceNumber}
                                  </span>
                                  {timeLabel && (
                                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" />
                                      {timeLabel}
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-1 truncate flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{pur.supplierName}</span>
                                </h4>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-sm font-black text-slate-900 dark:text-white block">
                                  ₹{(Number(pur.totalAmount) || 0).toLocaleString('en-IN')}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                                  {lang === 'hi' ? 'कुल माल राशि' : 'Bill Value'}
                                </span>
                              </div>
                            </div>

                            {/* Stock Added Summary Pills */}
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  +{billBoxes} {lang === 'hi' ? 'बॉक्स' : 'Boxes'}
                                  {billLooseLadi > 0
                                    ? ` + ${billLooseLadi} ${lang === 'hi' ? 'खुली लड़ी' : 'Ladi'}`
                                    : ''}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {pur.items.length} {lang === 'hi' ? 'आइटम' : 'Items'} ({billTotalLadi}{' '}
                                  {lang === 'hi' ? 'कुल लड़ी' : 'Total Ladi'})
                                </span>
                              </div>

                              {/* View Detail & Delete Action Buttons */}
                              <div
                                className="flex items-center gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isConfirmingDelete ? (
                                  <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-700 rounded-lg px-2 py-1">
                                    <span className="text-[10px] font-extrabold text-rose-800 dark:text-rose-200 mr-1">
                                      {lang === 'hi' ? 'डिलीट करें?' : 'Delete?'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeletePurchase?.(pur.id);
                                        setConfirmDeleteId(null);
                                        if (selectedPurchase?.id === pur.id) {
                                          setSelectedPurchase(null);
                                        }
                                      }}
                                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-black"
                                    >
                                      {lang === 'hi' ? 'हां' : 'Yes'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold"
                                    >
                                      {lang === 'hi' ? 'नहीं' : 'No'}
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPurchase(pur)}
                                      className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-extrabold flex items-center gap-1 transition"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>{lang === 'hi' ? 'विवरण' : 'Details'}</span>
                                    </button>
                                    {onDeletePurchase && (
                                      <button
                                        type="button"
                                        title={lang === 'hi' ? 'बिल डिलीट करें' : 'Delete Purchase Bill'}
                                        onClick={() => setConfirmDeleteId(pur.id)}
                                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 transition"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REVIEW SCREEN */}
      {reviewMode && (
        <div className="space-y-3">
          {errorMsg && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-xl text-amber-900 dark:text-amber-200 text-xs font-bold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Review & Edit Bill (जांच और पुष्टि)</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {reviewItems.length} Items Detected
              </span>
            </div>

            {/* Supplier & Bill Header Inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                  Bill Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Smooth Custom Bulk Category Dropdown for Entire Bill */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 relative">
              {addingCategoryForIndex === 'bulk' ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                  <input
                    type="text"
                    autoFocus
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNewCategory('bulk');
                    }}
                    placeholder={
                      lang === 'hi'
                        ? 'नई कैटेगरी का नाम लिखें...'
                        : 'New category name...'
                    }
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-indigo-400 dark:border-indigo-500 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveNewCategory('bulk')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black shrink-0 shadow-2xs"
                  >
                    {lang === 'hi' ? 'सेव' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingCategoryForIndex(null);
                      setNewCategoryInput('');
                    }}
                    className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-bold shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
                    <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span>
                      {lang === 'hi' ? 'सबकी कैटेगरी सेट करें:' : 'All Items Category:'}
                    </span>
                  </span>

                  {/* Custom Smooth Trigger Button */}
                  <div className="relative z-30">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenCategoryDropdown(
                          openCategoryDropdown === 'bulk' ? null : 'bulk'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-indigo-50/90 dark:bg-slate-900 hover:bg-indigo-100/80 dark:hover:bg-slate-800 border border-indigo-200 dark:border-slate-600 text-indigo-900 dark:text-indigo-200 text-[11px] font-extrabold flex items-center gap-2 shadow-2xs transition active:scale-98"
                    >
                      <Tag className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>
                        {lang === 'hi' ? 'कैटेगरी चुनें' : 'Select Category'}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-indigo-500 transition-transform duration-200 ${
                          openCategoryDropdown === 'bulk' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Custom Smooth Popover Menu */}
                    {openCategoryDropdown === 'bulk' && (
                      <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                          {lang === 'hi'
                            ? 'सभी आइटम पर लागू करें'
                            : 'Apply to All Items'}
                        </div>
                        <div className="max-h-48 overflow-y-auto py-1 divide-y divide-slate-50 dark:divide-slate-700/40">
                          {availableCategories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => handleApplyCategoryToAll(cat)}
                              className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center justify-between transition"
                            >
                              <span className="truncate">{cat}</span>
                              <span className="text-[10px] text-slate-400">All</span>
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenCategoryDropdown(null);
                            setAddingCategoryForIndex('bulk');
                            setNewCategoryInput('');
                          }}
                          className="w-full px-3 py-2.5 bg-indigo-50/90 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 border-t border-indigo-100 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center gap-1.5 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {lang === 'hi'
                              ? '+ नई कैटेगरी बनाएं'
                              : '+ Create New Category'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* List of Detected Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Products in Purchase Bill
              </span>
              <button
                type="button"
                onClick={handleAddBlankReviewItem}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-2xs active:scale-95 transition"
              >
                <Plus className="w-3 h-3" />
                <span>{lang === 'hi' ? 'आइटम जोड़ें' : 'Add Item'}</span>
              </button>
            </div>

            {reviewItems.map((item, index) => {
              const isLowConfidence = item.confidence === 'low';
              const activeCategory = item.category || 'Namkeen';
              const isDropdownOpen = openCategoryDropdown === index;

              return (
                <div
                  key={index}
                  className={`border rounded-xl p-3 shadow-2xs space-y-2.5 transition relative ${
                    isLowConfidence
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 ring-2 ring-amber-300 dark:ring-amber-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Top row: Product Name & Custom Smooth Category Dropdown */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) =>
                            handleUpdateItem(index, { productName: e.target.value })
                          }
                          className="font-extrabold text-xs text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:outline-none w-full pb-0.5"
                        />
                      </div>

                      {/* Existing vs New Product Badge + Custom Smooth Category Dropdown */}
                      <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.isPackSizeLocked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                              <Lock className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                              <span>1 Box = {item.packSize} Ladi</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                              <Plus className="w-3 h-3" />
                              <span>
                                {item.isNewProduct
                                  ? 'New Product'
                                  : `1 Box = ${item.packSize} Ladi`}
                              </span>
                            </span>
                          )}

                          {isLowConfidence && (
                            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-900/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Low OCR</span>
                            </span>
                          )}
                        </div>

                        {/* Smooth Custom Category Pill & Floating Menu */}
                        {addingCategoryForIndex !== index && (
                          <div className="relative z-30">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenCategoryDropdown(isDropdownOpen ? null : index)
                              }
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 border transition active:scale-95 ${
                                isDropdownOpen
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                                  : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-slate-700'
                              }`}
                            >
                              <Tag
                                className={`w-3 h-3 ${
                                  isDropdownOpen
                                    ? 'text-white'
                                    : 'text-blue-600 dark:text-blue-400'
                                }`}
                              />
                              <span className="max-w-[110px] truncate">{activeCategory}</span>
                              <ChevronDown
                                className={`w-3 h-3 transition-transform duration-200 ${
                                  isDropdownOpen ? 'rotate-180 text-white' : 'text-slate-400'
                                }`}
                              />
                            </button>

                            {isDropdownOpen && (
                              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-150">
                                <div className="max-h-44 overflow-y-auto py-1 divide-y divide-slate-50 dark:divide-slate-700/40">
                                  {availableCategories.map((cat) => {
                                    const isSelected = cat === activeCategory;
                                    return (
                                      <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                          handleUpdateItem(index, { category: cat });
                                          setOpenCategoryDropdown(null);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition ${
                                          isSelected
                                            ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                                        }`}
                                      >
                                        <span className="truncate">{cat}</span>
                                        {isSelected && (
                                          <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenCategoryDropdown(null);
                                    setAddingCategoryForIndex(index);
                                    setNewCategoryInput('');
                                  }}
                                  className="w-full px-3 py-2 bg-blue-50/90 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 border-t border-blue-100 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-black flex items-center gap-1.5 transition"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>
                                    {lang === 'hi'
                                      ? '+ नई कैटेगरी बनाएं'
                                      : '+ New Category'}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Slim Inline New Category Input */}
                      {addingCategoryForIndex === index && (
                        <div className="flex items-center gap-1.5 mt-2 animate-in fade-in duration-150">
                          <input
                            type="text"
                            autoFocus
                            value={newCategoryInput}
                            onChange={(e) => setNewCategoryInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveNewCategory(index);
                            }}
                            placeholder={
                              lang === 'hi'
                                ? 'नई कैटेगरी का नाम...'
                                : 'New category name...'
                            }
                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-blue-400 dark:border-blue-500 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveNewCategory(index)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black shrink-0"
                          >
                            {lang === 'hi' ? 'जोड़ें' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingCategoryForIndex(null);
                              setNewCategoryInput('');
                            }}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-bold shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveReviewItem(index)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* PACK SIZE SECTION */}
                  <div className="pt-1">
                    {item.isPackSizeLocked ? (
                      <div className="bg-slate-100/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            Saved Pack Size:{' '}
                            <strong className="text-emerald-700 dark:text-emerald-400">
                              1 Box = {item.packSize} Ladi
                            </strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateItem(index, { isPackSizeLocked: false })
                          }
                          className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800"
                        >
                          {lang === 'hi' ? 'बदलें (Edit Ladi)' : 'Change Ladi'}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-blue-50/60 dark:bg-slate-900/90 border border-blue-200 dark:border-blue-800/80 rounded-lg p-2.5">
                        <PackSizeSelector
                          value={item.packSize}
                          onChange={(newSize) =>
                            handleUpdateItem(index, { packSize: newSize })
                          }
                          label={
                            lang === 'hi'
                              ? 'लड़ी चुनें (1 Box = ? Ladi)'
                              : 'Choose Pack Size (1 Box = ? Ladi)'
                          }
                          showHelper={false}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Editable Quantities: Box, Loose Ladi, Buy Rate */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                        Boxes (बॉक्स)
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={item.cartonQty === 0 ? '' : item.cartonQty}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateItem(index, {
                            cartonQty: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-center text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                        Ladi (खुली लड़ी)
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={item.pieceQty === 0 ? '' : item.pieceQty}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateItem(index, {
                            pieceQty: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-center text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                        Buy/Box (खरीद)
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={item.rate === 0 ? '' : item.rate}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateItem(index, {
                            rate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-center text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Selling Price for Box & Selling Price for Ladi at Stock Addition */}
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300/80 dark:border-emerald-800/80 rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-emerald-900 dark:text-emerald-300 uppercase flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {lang === 'hi' ? 'बिक्री भाव सेट करें' : 'Set Selling Prices'}
                        </span>
                      </span>
                      <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-900/70 px-1.5 py-0.5 rounded">
                        Box & Ladi
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/70 rounded-md p-1.5">
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 block">
                          Sale / Box (बॉक्स भाव)
                        </span>
                        <div className="relative mt-0.5">
                          <span className="absolute left-1.5 top-0.5 text-[11px] font-bold text-slate-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={
                              item.salePriceCarton === 0 ? '' : item.salePriceCarton
                            }
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateItem(index, {
                                salePriceCarton: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full pl-4 pr-1 py-0.5 text-xs font-black text-emerald-700 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/70 rounded-md p-1.5">
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 block">
                          Sale / Ladi (लड़ी भाव)
                        </span>
                        <div className="relative mt-0.5">
                          <span className="absolute left-1.5 top-0.5 text-[11px] font-bold text-slate-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={item.salePricePiece === 0 ? '' : item.salePricePiece}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateItem(index, {
                                salePricePiece: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full pl-4 pr-1 py-0.5 text-xs font-black text-emerald-700 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Item Total calculation */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Total Ladi:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {item.cartonQty * item.packSize + item.pieceQty} Ladi
                      </strong>
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      ₹{item.totalAmount.toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Review Summary & Confirm Button */}
          <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Total Bill Amount</span>
              <span className="text-xl font-black text-white">
                ₹{reviewItems.reduce((acc, i) => acc + i.totalAmount, 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setReviewMode(false);
                  setOpenCategoryDropdown(null);
                }}
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

      {/* PURCHASE BILL DETAIL MODAL (When user taps a purchase bill in history) */}
      {selectedPurchase && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedPurchase(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-700 rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-700 to-blue-700 p-4 text-white flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider">
                    #{selectedPurchase.invoiceNumber}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-100 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateBanner(
                      (selectedPurchase.scannedAt || selectedPurchase.invoiceDate || '').slice(0, 10)
                    )}
                  </span>
                </div>
                <h3 className="text-base font-black mt-1 truncate">
                  {selectedPurchase.supplierName}
                </h3>
                <p className="text-[11px] text-indigo-100 font-medium">
                  {lang === 'hi'
                    ? 'सप्लायर खरीद बिल और जोड़े गए स्टॉक का पूरा विवरण'
                    : 'Complete breakdown of stock added & purchase rates'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 shrink-0 text-center">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl p-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  {lang === 'hi' ? 'कुल आइटम' : 'Total Items'}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {selectedPurchase.items.length}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl p-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  {lang === 'hi' ? 'जोड़ा गया स्टॉक' : 'Stock Added'}
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  +
                  {selectedPurchase.items.reduce(
                    (s, it) => s + (Number(it.cartonQty) || 0),
                    0
                  )}{' '}
                  Box (
                  {selectedPurchase.items.reduce(
                    (s, it) =>
                      s +
                      (Number(it.cartonQty) || 0) * (Number(it.packSize) || 1) +
                      (Number(it.pieceQty) || 0),
                    0
                  )}{' '}
                  Ladi)
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl p-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  {lang === 'hi' ? 'बिल राशि' : 'Bill Amount'}
                </span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  ₹{(Number(selectedPurchase.totalAmount) || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedPurchase.items.map((it, idx) => {
                const totalLadi =
                  (Number(it.cartonQty) || 0) * (Number(it.packSize) || 1) +
                  (Number(it.pieceQty) || 0);
                return (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black text-slate-400">
                            #{idx + 1}
                          </span>
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {it.productName}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {it.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {it.category}
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                            1 Box = {it.packSize} Ladi
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          ₹{(Number(it.totalAmount) || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          ₹{it.rate}/Box
                        </span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                        +{it.cartonQty} Box
                        {it.pieceQty > 0 ? ` + ${it.pieceQty} Loose Ladi` : ''} ({totalLadi} Ladi)
                      </span>
                      {(it.salePriceCarton || it.salePricePiece) && (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          Sale: ₹{it.salePriceCarton || '-'}/Box • ₹{it.salePricePiece || '-'}/Ladi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer with Delete Option & Close */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shrink-0">
              {onDeletePurchase && (
                <>
                  {confirmDeleteId === selectedPurchase.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950 border border-rose-300 dark:border-rose-700 rounded-xl px-2.5 py-1.5">
                      <span className="text-[10px] font-extrabold text-rose-800 dark:text-rose-200">
                        {lang === 'hi'
                          ? 'बिल और जोड़ा गया स्टॉक हटाएं?'
                          : 'Delete bill & revert stock?'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeletePurchase(selectedPurchase.id);
                          setConfirmDeleteId(null);
                          setSelectedPurchase(null);
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black"
                      >
                        {lang === 'hi' ? 'हां, हटाएं' : 'Yes, Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold"
                      >
                        {lang === 'hi' ? 'रद्द' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedPurchase.id)}
                      className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 dark:hover:bg-rose-900/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-extrabold flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{lang === 'hi' ? 'बिल डिलीट करें' : 'Delete Bill'}</span>
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="ml-auto px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-black transition"
              >
                {lang === 'hi' ? 'बंद करें (Close)' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

