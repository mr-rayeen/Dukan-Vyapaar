/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bill, Expense, Product, ShopSettings, StockMovement, SupplierPurchase } from './types';
import {
  getStoredBills,
  getStoredExpenses,
  getStoredMovements,
  getStoredProducts,
  getStoredPurchases,
  getStoredSettings,
  resetAppToDemoData,
  saveStoredBills,
  saveStoredExpenses,
  saveStoredMovements,
  saveStoredProducts,
  saveStoredPurchases,
  saveStoredSettings,
} from './utils/storage';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNavigation, TabKey } from './components/layout/BottomNavigation';
import { DashboardScreen } from './components/home/DashboardScreen';
import { BillingScreen } from './components/billing/BillingScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { ScanBillScreen } from './components/scan/ScanBillScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { ProductFormModal } from './components/inventory/ProductFormModal';
import { ProductDetailModal } from './components/inventory/ProductDetailModal';
import { BillSuccessModal } from './components/billing/BillSuccessModal';
import { PWAInstallModal } from './components/common/PWAInstallModal';
import { SettingsModal } from './components/common/SettingsModal';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { ToastProvider, showToast } from './components/common/ToastProvider';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { isLowStock } from './utils/stockLogic';
import { generateUniqueId } from './utils/idGenerator';

export default function App() {
  // Persistence state
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [bills, setBills] = useState<Bill[]>(() => getStoredBills());
  const [movements, setMovements] = useState<StockMovement[]>(() => getStoredMovements());
  const [purchases, setPurchases] = useState<SupplierPurchase[]>(() => getStoredPurchases());
  const [settings, setSettings] = useState<ShopSettings>(() => getStoredSettings());
  const [expenses, setExpenses] = useState<Expense[]>(() => getStoredExpenses());

  // UI State
  const [currentTab, setCurrentTab] = useState<TabKey>('home');
  const [initialReportSubTab, setInitialReportSubTab] = useState<
    'graphs' | 'daily' | 'expenses' | 'profit' | 'udhar' | 'stock' | 'collections'
  >('daily');
  const [lang, setLang] = useState<'hi' | 'en'>(() => {
    const saved = localStorage.getItem('app_lang');
    return saved === 'hi' || saved === 'en' ? saved : 'en';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_dark_mode');
    return saved === 'true';
  });
  const [isDesktopFrame, setIsDesktopFrame] = useState<boolean>(false);

  // Sync dark mode class on html root and localStorage
  useEffect(() => {
    localStorage.setItem('app_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sync language to localStorage
  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      showToast({
        type: 'info',
        title: next
          ? lang === 'hi'
            ? 'डार्क मोड ऑन हो गया'
            : 'Dark Mode Enabled'
          : lang === 'hi'
          ? 'लाइट मोड ऑन हो गया'
          : 'Light Mode Enabled',
        duration: 2000,
      });
      return next;
    });
  };

  // Modals
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [openDetailWithAddStock, setOpenDetailWithAddStock] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [latestBill, setLatestBill] = useState<Bill | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const isOnline = useOnlineStatus();

  // Auto-sync state to LocalStorage safely
  useEffect(() => {
    try {
      saveStoredProducts(products);
    } catch (e: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'स्टॉक सेव करने में त्रुटि' : 'Failed to Save Inventory',
        message: e?.message || 'LocalStorage error',
      });
    }
  }, [products, lang]);

  useEffect(() => {
    try {
      saveStoredBills(bills);
    } catch (e: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'बिल सेव करने में त्रुटि' : 'Failed to Save Bills',
        message: e?.message || 'LocalStorage error',
      });
    }
  }, [bills, lang]);

  useEffect(() => {
    try {
      saveStoredMovements(movements);
    } catch {
      // Non-critical history log
    }
  }, [movements]);

  useEffect(() => {
    try {
      saveStoredPurchases(purchases);
    } catch (e: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'खरीद बिल सेव करने में त्रुटि' : 'Failed to Save Purchase History',
        message: e?.message || 'LocalStorage error',
      });
    }
  }, [purchases, lang]);

  useEffect(() => {
    try {
      saveStoredSettings(settings);
    } catch {
      // Non-critical
    }
  }, [settings]);

  useEffect(() => {
    try {
      saveStoredExpenses(expenses);
    } catch (e: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'खर्च सेव करने में त्रुटि' : 'Failed to Save Expenses',
        message: e?.message || 'LocalStorage error',
      });
    }
  }, [expenses, lang]);

  const handleSaveExpense = (newExpense: Expense) => {
    try {
      if (!newExpense.title?.trim() || Number(newExpense.amount) <= 0) {
        showToast({
          type: 'error',
          title: lang === 'hi' ? 'खर्च सेव नहीं हुआ' : 'Could Not Save Expense',
          message:
            lang === 'hi'
              ? 'कृपया खर्च का नाम और सही राशि (₹0 से अधिक) दर्ज करें।'
              : 'Please enter a valid expense title and amount greater than ₹0.',
        });
        return;
      }
      setExpenses((prev) => {
        const updated = [newExpense, ...prev];
        saveStoredExpenses(updated);
        return updated;
      });
      setIsExpenseModalOpen(false);
      showToast({
        type: 'success',
        title: lang === 'hi' ? 'खर्च जोड़ा गया' : 'Expense Recorded',
        message: `${newExpense.title} • ₹${newExpense.amount.toLocaleString('en-IN')}`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'खर्च जोड़ने में एरर' : 'Failed to Add Expense',
        message: err?.message || 'Unexpected error while saving expense',
      });
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    try {
      const target = expenses.find((e) => e.id === expenseId);
      setExpenses((prev) => {
        const updated = prev.filter((e) => e.id !== expenseId);
        saveStoredExpenses(updated);
        return updated;
      });
      showToast({
        type: 'warning',
        title: lang === 'hi' ? 'खर्च हटाया गया' : 'Expense Deleted',
        message: target
          ? `${target.title} (₹${target.amount.toLocaleString('en-IN')})`
          : lang === 'hi'
          ? 'खर्च रिकॉर्ड डिलीट कर दिया गया।'
          : 'Expense entry removed successfully.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'खर्च डिलीट नहीं हुआ' : 'Failed to Delete Expense',
        message: err?.message || 'Unexpected error while deleting expense',
      });
    }
  };

  // Handle Save Bill & Stock Deduction
  const handleSaveBill = (newBill: Bill) => {
    try {
      if (!newBill.items || newBill.items.length === 0) {
        showToast({
          type: 'error',
          title: lang === 'hi' ? 'बिल खाली है!' : 'Cannot Save Empty Bill',
          message:
            lang === 'hi'
              ? 'कृपया बिल बनाने के लिए कम से कम 1 आइटम जोड़ें।'
              : 'Please add at least 1 item to the bill before saving.',
        });
        return;
      }

      // 1. Deduct Stock for all bill items
      let updatedProducts = [...products];
      const newMovements: StockMovement[] = [];

      newBill.items.forEach((item) => {
        const piecesSold = item.cartonQty * item.packSize + item.pieceQty;

        updatedProducts = updatedProducts.map((p) => {
          if (p.id === item.productId) {
            const newTotalPieces = Math.max(0, p.totalPieces - piecesSold);
            newMovements.push({
              id: generateUniqueId(`mov-${item.productId}`),
              productId: p.id,
              productName: p.name,
              type: 'sale',
              cartonQty: item.cartonQty,
              pieceQty: item.pieceQty,
              totalPiecesDelta: -piecesSold,
              remainingTotalPieces: newTotalPieces,
              referenceId: newBill.billNumber,
              timestamp: newBill.createdAt,
            });
            return {
              ...p,
              totalPieces: newTotalPieces,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });
      });

      setProducts(updatedProducts);
      setBills([newBill, ...bills]);
      setMovements([...newMovements, ...movements]);
      setLatestBill(newBill);

      showToast({
        type: 'success',
        title:
          lang === 'hi'
            ? `बिल #${newBill.billNumber} सेव हो गया!`
            : `Bill #${newBill.billNumber} Saved!`,
        message:
          lang === 'hi'
            ? `${newBill.customerName || 'Cash Customer'} • ₹${newBill.totalAmount.toLocaleString('en-IN')} (${newBill.items.length} आइटम)`
            : `${newBill.customerName || 'Cash Customer'} • ₹${newBill.totalAmount.toLocaleString('en-IN')} (${newBill.items.length} items)`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'बिल सेव करने में समस्या' : 'Failed to Save Bill',
        message: err?.message || 'Error while saving bill and updating stock',
      });
    }
  };

  // Handle Supplier Purchase (from Camera OCR or Manual)
  const handleConfirmPurchase = (purchase: SupplierPurchase, updatedProductsList: Product[]) => {
    try {
      const newMovements: StockMovement[] = [];

      purchase.items.forEach((item) => {
        const piecesAdded = item.cartonQty * item.packSize + item.pieceQty;
        const targetProd = updatedProductsList.find((p) => p.name === item.productName);

        if (targetProd) {
          newMovements.push({
            id: generateUniqueId(`mov-${targetProd.id}`),
            productId: targetProd.id,
            productName: targetProd.name,
            type: 'purchase',
            cartonQty: item.cartonQty,
            pieceQty: item.pieceQty,
            totalPiecesDelta: piecesAdded,
            remainingTotalPieces: targetProd.totalPieces,
            referenceId: purchase.invoiceNumber,
            notes: `Supplier: ${purchase.supplierName}`,
            timestamp: purchase.scannedAt,
          });
        }
      });

      setProducts(updatedProductsList);
      setPurchases([purchase, ...purchases]);
      setMovements([...newMovements, ...movements]);

      const totalBoxes = purchase.items.reduce((s, it) => s + (Number(it.cartonQty) || 0), 0);
      showToast({
        type: 'success',
        title:
          lang === 'hi'
            ? 'सप्लायर बिल व स्टॉक जुड़ गया!'
            : 'Purchase Bill & Stock Added!',
        message:
          lang === 'hi'
            ? `बिल #${purchase.invoiceNumber} (${purchase.supplierName}) • +${totalBoxes} बॉक्स (₹${purchase.totalAmount.toLocaleString('en-IN')})`
            : `Bill #${purchase.invoiceNumber} (${purchase.supplierName}) • +${totalBoxes} Boxes (₹${purchase.totalAmount.toLocaleString('en-IN')})`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'स्टॉक जोड़ने में समस्या' : 'Failed to Add Purchase Stock',
        message: err?.message || 'Error saving supplier purchase bill',
      });
    }
  };

  // Delete Supplier Purchase Bill & Revert Added Stock from Inventory
  const handleDeletePurchase = (purchaseId: string) => {
    try {
      const purchaseToDelete = purchases.find((p) => p.id === purchaseId);
      if (!purchaseToDelete) {
        showToast({
          type: 'error',
          title: lang === 'hi' ? 'बिल नहीं मिला' : 'Purchase Bill Not Found',
          message: lang === 'hi' ? 'यह खरीद बिल पहले ही हटाया जा चुका है।' : 'This purchase record no longer exists.',
        });
        return;
      }

      let updatedProducts = [...products];
      const newMovements: StockMovement[] = [];

      purchaseToDelete.items.forEach((item) => {
        const piecesToDeduct = item.cartonQty * item.packSize + item.pieceQty;
        updatedProducts = updatedProducts.map((p) => {
          const isMatch =
            (item.matchedProductId && p.id === item.matchedProductId) ||
            p.name.trim().toLowerCase() === item.productName.trim().toLowerCase();
          if (isMatch) {
            const nextTotal = Math.max(0, p.totalPieces - piecesToDeduct);
            newMovements.push({
              id: generateUniqueId(`mov-${p.id}`),
              productId: p.id,
              productName: p.name,
              type: 'adjustment',
              cartonQty: item.cartonQty,
              pieceQty: item.pieceQty,
              totalPiecesDelta: -piecesToDeduct,
              remainingTotalPieces: nextTotal,
              referenceId: purchaseToDelete.invoiceNumber,
              notes: `Purchase Bill Deleted: ${purchaseToDelete.invoiceNumber} (${purchaseToDelete.supplierName})`,
              timestamp: new Date().toISOString(),
            });
            return {
              ...p,
              totalPieces: nextTotal,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });
      });

      const updatedPurchases = purchases.filter((p) => p.id !== purchaseId);
      const updatedMovements = [...newMovements, ...movements];

      setProducts(updatedProducts);
      setPurchases(updatedPurchases);
      setMovements(updatedMovements);

      saveStoredProducts(updatedProducts);
      saveStoredPurchases(updatedPurchases);
      saveStoredMovements(updatedMovements);

      showToast({
        type: 'warning',
        title:
          lang === 'hi'
            ? `खरीद बिल #${purchaseToDelete.invoiceNumber} डिलीट किया गया`
            : `Purchase Bill #${purchaseToDelete.invoiceNumber} Deleted`,
        message:
          lang === 'hi'
            ? `${purchaseToDelete.supplierName} का बिल हटाया गया और जोड़ा गया स्टॉक वापस घटा दिया गया।`
            : `Removed bill from ${purchaseToDelete.supplierName} and reverted added stock from inventory.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'खरीद बिल डिलीट नहीं हुआ' : 'Failed to Delete Purchase Bill',
        message: err?.message || 'Error reverting stock for deleted purchase bill',
      });
    }
  };

  // Save / Update Product Master
  const handleSaveProduct = (product: Product, isNew: boolean) => {
    try {
      if (!product.name?.trim()) {
        showToast({
          type: 'error',
          title: lang === 'hi' ? 'प्रोडक्ट का नाम ज़रूरी है' : 'Product Name Required',
          message: lang === 'hi' ? 'कृपया प्रोडक्ट का नाम दर्ज करें।' : 'Please enter a valid product name.',
        });
        return;
      }

      if (isNew) {
        setProducts([product, ...products]);
        setMovements([
          {
            id: generateUniqueId(`mov-${product.id}`),
            productId: product.id,
            productName: product.name,
            type: 'adjustment',
            cartonQty: Math.floor(product.totalPieces / (product.packSize || 1)),
            pieceQty: product.totalPieces % (product.packSize || 1),
            totalPiecesDelta: product.totalPieces,
            remainingTotalPieces: product.totalPieces,
            notes: 'Opening Stock in Master',
            timestamp: new Date().toISOString(),
          },
          ...movements,
        ]);
        showToast({
          type: 'success',
          title: lang === 'hi' ? 'नया प्रोडक्ट जोड़ा गया!' : 'New Product Created!',
          message: `${product.name} • 1 Box = ${product.packSize} Ladi (${product.category || 'General'})`,
        });
      } else {
        setProducts(products.map((p) => (p.id === product.id ? product : p)));
        showToast({
          type: 'success',
          title: lang === 'hi' ? 'प्रोडक्ट अपडेट हो गया!' : 'Product Updated!',
          message: `${product.name} • Sale: ₹${product.salePriceCarton}/Box, ₹${product.salePricePiece}/Ladi`,
        });
      }
      setIsProductFormOpen(false);
      setProductToEdit(null);
      setSelectedProductForDetail(null);
      setOpenDetailWithAddStock(false);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'प्रोडक्ट सेव नहीं हुआ' : 'Failed to Save Product',
        message: err?.message || 'Unexpected error saving product details',
      });
    }
  };

  // Quick Add Stock to individual product with Selling Price for Box and Ladi
  const handleQuickAddStock = (
    product: Product,
    addedCartons: number,
    addedPieces: number,
    newSalePriceCarton?: number,
    newSalePricePiece?: number,
    newPurchaseRateCarton?: number
  ) => {
    try {
      const piecesToAdd = addedCartons * product.packSize + addedPieces;
      if (piecesToAdd <= 0) {
        showToast({
          type: 'error',
          title: lang === 'hi' ? 'स्टॉक संख्या गलत है' : 'Invalid Stock Quantity',
          message:
            lang === 'hi'
              ? 'कृपया जोड़ने के लिए कम से कम 1 बॉक्स या 1 लड़ी भरें।'
              : 'Please enter at least 1 Box or 1 Ladi to add into stock.',
        });
        return;
      }

      const newTotal = product.totalPieces + piecesToAdd;

      const effectiveSaleBox =
        newSalePriceCarton !== undefined && newSalePriceCarton > 0
          ? newSalePriceCarton
          : product.salePriceCarton;
      const effectiveSalePiece =
        newSalePricePiece !== undefined && newSalePricePiece > 0
          ? newSalePricePiece
          : product.salePricePiece;
      const effectivePurchaseBox =
        newPurchaseRateCarton !== undefined && newPurchaseRateCarton > 0
          ? newPurchaseRateCarton
          : product.purchaseRateCarton;

      const updated = products.map((p) =>
        p.id === product.id
          ? {
              ...p,
              totalPieces: newTotal,
              salePriceCarton: effectiveSaleBox,
              salePricePiece: effectiveSalePiece,
              purchaseRateCarton: effectivePurchaseBox,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      setProducts(updated);

      setMovements([
        {
          id: generateUniqueId(`mov-${product.id}`),
          productId: product.id,
          productName: product.name,
          type: 'purchase',
          cartonQty: addedCartons,
          pieceQty: addedPieces,
          totalPiecesDelta: piecesToAdd,
          remainingTotalPieces: newTotal,
          notes: `Restock: +${addedCartons} Box, +${addedPieces} Ladi (Sale: ₹${effectiveSaleBox}/Box, ₹${effectiveSalePiece}/Ladi)`,
          timestamp: new Date().toISOString(),
        },
        ...movements,
      ]);

      // Auto-close detail & manual stock modal after stock is added
      setSelectedProductForDetail(null);
      setOpenDetailWithAddStock(false);

      showToast({
        type: 'success',
        title: lang === 'hi' ? 'स्टॉक गोदाम में जुड़ गया!' : 'Stock Added Successfully!',
        message: `${product.name}: +${addedCartons} Box${addedPieces > 0 ? `, +${addedPieces} Ladi` : ''}`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'स्टॉक अपडेट फेल हुआ' : 'Failed to Add Stock',
        message: err?.message || 'Error updating product inventory',
      });
    }
  };

  const handleDeleteProduct = (productId: string) => {
    try {
      const targetProd = products.find((p) => p.id === productId);
      setProducts((prev) => {
        const updated = prev.filter((p) => p.id !== productId);
        saveStoredProducts(updated);
        return updated;
      });
      setSelectedProductForDetail(null);
      setIsProductFormOpen(false);
      setProductToEdit(null);

      showToast({
        type: 'warning',
        title: lang === 'hi' ? 'प्रोडक्ट हटा दिया गया' : 'Product Deleted',
        message: targetProd
          ? `"${targetProd.name}" इन्वेंटरी से डिलीट कर दिया गया।`
          : lang === 'hi'
          ? 'आइटम इन्वेंटरी से हटाया गया।'
          : 'Product removed from master inventory.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'प्रोडक्ट डिलीट नहीं हुआ' : 'Failed to Delete Product',
        message: err?.message || 'Error deleting product',
      });
    }
  };

  const handleBulkDeleteProducts = (productIds: string[]) => {
    try {
      if (!productIds || productIds.length === 0) return;
      const idSet = new Set(productIds);
      setProducts((prev) => {
        const updated = prev.filter((p) => !idSet.has(p.id));
        saveStoredProducts(updated);
        return updated;
      });
      if (selectedProductForDetail && idSet.has(selectedProductForDetail.id)) {
        setSelectedProductForDetail(null);
      }
      if (productToEdit && idSet.has(productToEdit.id)) {
        setIsProductFormOpen(false);
        setProductToEdit(null);
      }
      showToast({
        type: 'warning',
        title:
          lang === 'hi'
            ? `${productIds.length} प्रोडक्ट्स डिलीट किए गए`
            : `${productIds.length} Products Deleted`,
        message:
          lang === 'hi'
            ? 'चुने गए सभी आइटम इन्वेंटरी से सफलतापूर्वक हटा दिए गए हैं।'
            : 'All selected items have been removed from master inventory.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'बल्क डिलीट फेल हुआ' : 'Bulk Delete Failed',
        message: err?.message || 'Could not delete selected products',
      });
    }
  };

  const handleBulkUpdateCategory = (productIds: string[], newCategory: string) => {
    try {
      const trimmedCat = newCategory.trim();
      if (!trimmedCat) {
        showToast({
          type: 'error',
          title: lang === 'hi' ? 'कैटेगरी का नाम खाली है' : 'Category Name Empty',
          message: lang === 'hi' ? 'कृपया सही कैटेगरी चुनें या लिखें।' : 'Please enter a valid category name.',
        });
        return;
      }
      const idSet = new Set(productIds);
      const nowIso = new Date().toISOString();
      setProducts((prev) => {
        const updated = prev.map((p) =>
          idSet.has(p.id)
            ? {
                ...p,
                category: trimmedCat,
                updatedAt: nowIso,
              }
            : p
        );
        saveStoredProducts(updated);
        return updated;
      });
      showToast({
        type: 'success',
        title: lang === 'hi' ? 'कैटेगरी अपडेट हो गई!' : 'Category Updated!',
        message:
          lang === 'hi'
            ? `${productIds.length} आइटम्स को "${trimmedCat}" कैटेगरी में जोड़ा गया।`
            : `Moved ${productIds.length} items to "${trimmedCat}" category.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'कैटेगरी बदलने में त्रुटि' : 'Failed to Update Category',
        message: err?.message || 'Error updating product categories',
      });
    }
  };

  // Handle Delete Bill (Cancel wrong bill & restore deducted stock back to godown)
  const handleDeleteBill = (billId: string) => {
    try {
      const billToDelete = bills.find((b) => b.id === billId);
      if (!billToDelete) {
        showToast({
          type: 'error',
          title: lang === 'hi' ? 'बिल नहीं मिला' : 'Bill Not Found',
          message: lang === 'hi' ? 'यह बिल पहले ही डिलीट हो चुका है।' : 'Could not find the bill to delete.',
        });
        return;
      }

      // 1. Restore stock to products
      let updatedProducts = [...products];
      const newMovements: StockMovement[] = [];

      billToDelete.items.forEach((item) => {
        const piecesToRestore = item.cartonQty * item.packSize + item.pieceQty;

        updatedProducts = updatedProducts.map((p) => {
          if (p.id === item.productId) {
            const restoredTotal = p.totalPieces + piecesToRestore;
            newMovements.push({
              id: generateUniqueId(`mov-${item.productId}`),
              productId: p.id,
              productName: p.name,
              type: 'adjustment',
              cartonQty: item.cartonQty,
              pieceQty: item.pieceQty,
              totalPiecesDelta: piecesToRestore,
              remainingTotalPieces: restoredTotal,
              referenceId: billToDelete.billNumber,
              notes: `Bill Cancelled: ${billToDelete.billNumber} (स्टॉक वापस जोड़ा गया)`,
              timestamp: new Date().toISOString(),
            });
            return {
              ...p,
              totalPieces: restoredTotal,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });
      });

      const updatedBills = bills.filter((b) => b.id !== billId);
      const updatedMovements = [...newMovements, ...movements];

      setProducts(updatedProducts);
      setBills(updatedBills);
      setMovements(updatedMovements);

      saveStoredProducts(updatedProducts);
      saveStoredBills(updatedBills);
      saveStoredMovements(updatedMovements);

      if (latestBill?.id === billId) {
        setIsSuccessModalOpen(false);
        setLatestBill(null);
      }

      showToast({
        type: 'warning',
        title:
          lang === 'hi'
            ? `बिल #${billToDelete.billNumber} रद्द व डिलीट किया गया`
            : `Bill #${billToDelete.billNumber} Cancelled & Deleted`,
        message:
          lang === 'hi'
            ? `${billToDelete.customerName} का बिल हटाया गया और उसका सारा स्टॉक वापस गोदाम में जोड़ दिया गया।`
            : `Deleted bill for ${billToDelete.customerName} and restored all items back to stock.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'बिल डिलीट करने में समस्या' : 'Failed to Delete Bill',
        message: err?.message || 'Error deleting bill and restoring stock',
      });
    }
  };

  // Settle Udhar Bill completely
  const handleSettleUdhar = (billId: string) => {
    try {
      const targetBill = bills.find((b) => b.id === billId);
      if (!targetBill) return;

      const remainingToPay = Math.max(0, targetBill.totalAmount - (targetBill.paidAmount || 0));
      const nowIso = new Date().toISOString();
      const paymentRecord = {
        id: generateUniqueId('pay'),
        billId: targetBill.id,
        billNumber: targetBill.billNumber,
        customerName: targetBill.customerName,
        customerPhone: targetBill.customerPhone,
        amount: remainingToPay,
        paymentMethod: 'cash' as const,
        notes: 'Full Udhar Settlement',
        date: nowIso,
        createdAt: nowIso,
      };

      const updated = bills.map((b) =>
        b.id === billId
          ? {
              ...b,
              isUdharPaid: true,
              paidAmount: b.totalAmount,
              updatedAt: nowIso,
              payments: [...(b.payments || []), paymentRecord],
            }
          : b
      );
      setBills(updated);
      saveStoredBills(updated);

      if (latestBill && latestBill.id === billId) {
        const fresh = updated.find((b) => b.id === billId);
        if (fresh) setLatestBill(fresh);
      }

      showToast({
        type: 'success',
        title: lang === 'hi' ? 'उधार पूरा चुकता हो गया!' : 'Udhar Fully Settled!',
        message:
          lang === 'hi'
            ? `${targetBill.customerName} • ₹${remainingToPay.toLocaleString('en-IN')} जमा (बिल #${targetBill.billNumber})`
            : `${targetBill.customerName} • ₹${remainingToPay.toLocaleString('en-IN')} received (Bill #${targetBill.billNumber})`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'उधार चुकता करने में समस्या' : 'Failed to Settle Udhar',
        message: err?.message || 'Error settling udhar bill',
      });
    }
  };

  // Record Part Payment or Custom Collection against a bill or customer account
  const handleRecordPartPayment = (payment: {
    billId?: string;
    customerName: string;
    customerPhone?: string;
    amount: number;
    paymentMethod: 'cash' | 'upi';
    notes?: string;
  }) => {
    try {
      if (!payment.amount || payment.amount <= 0) {
        showToast({
          type: 'error',
          title: lang === 'hi' ? 'गलत पेमेंट राशि' : 'Invalid Payment Amount',
          message: lang === 'hi' ? 'कृपया ₹0 से अधिक राशि दर्ज करें।' : 'Please enter a payment amount greater than ₹0.',
        });
        return;
      }

      const nowIso = new Date().toISOString();
      const paymentRecord = {
        id: generateUniqueId('pay'),
        billId: payment.billId,
        customerName: payment.customerName,
        customerPhone: payment.customerPhone,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        notes: payment.notes,
        date: nowIso,
        createdAt: nowIso,
      };

      let updatedBills = [...bills];

      if (payment.billId) {
        // Allocate to specific bill
        updatedBills = updatedBills.map((b) => {
          if (b.id === payment.billId) {
            const currentPaid = b.paidAmount || 0;
            const newPaid = currentPaid + payment.amount;
            const isFullyPaid = newPaid >= b.totalAmount;
            return {
              ...b,
              paidAmount: newPaid,
              isUdharPaid: isFullyPaid,
              updatedAt: nowIso,
              payments: [
                ...(b.payments || []),
                { ...paymentRecord, billNumber: b.billNumber, amount: payment.amount },
              ],
            };
          }
          return b;
        });
      } else {
        // Allocate sequentially across customer's pending udhar bills (FIFO)
        let unallocated = payment.amount;
        const customerPendingBills = updatedBills.filter(
          (b) =>
            b.customerName.trim().toLowerCase() === payment.customerName.trim().toLowerCase() &&
            b.paymentMethod === 'udhar' &&
            !b.isUdharPaid
        );

        updatedBills = updatedBills.map((b) => {
          if (customerPendingBills.some((cb) => cb.id === b.id) && unallocated > 0) {
            const currentPaid = b.paidAmount || 0;
            const remainingOnBill = Math.max(0, b.totalAmount - currentPaid);
            const payToThis = Math.min(unallocated, remainingOnBill);
            unallocated -= payToThis;
            const newPaid = currentPaid + payToThis;
            const isFullyPaid = newPaid >= b.totalAmount;
            return {
              ...b,
              paidAmount: newPaid,
              isUdharPaid: isFullyPaid,
              updatedAt: nowIso,
              payments: [
                ...(b.payments || []),
                { ...paymentRecord, amount: payToThis, billNumber: b.billNumber, billId: b.id },
              ],
            };
          }
          return b;
        });
      }

      setBills(updatedBills);
      saveStoredBills(updatedBills);

      if (latestBill) {
        const fresh = updatedBills.find((b) => b.id === latestBill.id);
        if (fresh) setLatestBill(fresh);
      }

      showToast({
        type: 'success',
        title: lang === 'hi' ? 'पेमेंट / कलेक्शन जमा हो गया!' : 'Payment Recorded!',
        message: `${payment.customerName} • +₹${payment.amount.toLocaleString('en-IN')} (${payment.paymentMethod.toUpperCase()})`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'पेमेंट सेव नहीं हुआ' : 'Failed to Record Payment',
        message: err?.message || 'Error recording customer payment',
      });
    }
  };

  // Reset to Demo Data
  const handleResetDemoData = () => {
    try {
      resetAppToDemoData();
      setProducts(getStoredProducts());
      setBills(getStoredBills());
      setMovements(getStoredMovements());
      setPurchases(getStoredPurchases());
      setSettings(getStoredSettings());
      setExpenses(getStoredExpenses());
      setIsSettingsModalOpen(false);
      setSelectedProductForDetail(null);
      setOpenDetailWithAddStock(false);
      setIsProductFormOpen(false);
      showToast({
        type: 'info',
        title: lang === 'hi' ? 'डेमो डेटा रीसेट हो गया' : 'Demo Data Restored',
        message:
          lang === 'hi'
            ? 'सभी सैंपल प्रोडक्ट्स, बिल और हिस्ट्री रीसेट कर दिए गए हैं।'
            : 'All sample products, bills, and purchase history have been reset.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'रीसेट करने में समस्या' : 'Reset Failed',
        message: err?.message || 'Could not reset demo data',
      });
    }
  };

  // Low Stock Count for badge
  const lowStockCount = products.filter((p) =>
    isLowStock(p.totalPieces, p.lowStockThresholdPieces)
  ).length;

  return (
    <ToastProvider lang={lang}>
      <div
        className={`min-h-screen ${
          isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
        } flex flex-col items-center justify-start transition-colors duration-200 ${
          isDesktopFrame ? 'py-4 md:py-8' : ''
        }`}
      >
        {/* Offline Alert Strip */}
        {!isOnline && (
          <div className="w-full bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-xs z-50">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>
              {lang === 'hi'
                ? 'ऑफलाइन मोड सक्रिय — सभी बिल व स्टॉक आपके फोन में सुरक्षित सेव हो रहे हैं।'
                : 'Offline Mode Active — All billing & box/ladi inventory is saved locally on device.'}
            </span>
          </div>
        )}

        {/* Main Container: Mobile viewport or Phone Frame */}
        <div
          className={`w-full max-w-md ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 text-slate-800'
          } min-h-screen flex flex-col relative transition-all duration-300 ${
            isDesktopFrame
              ? 'rounded-[40px] shadow-2xl border-8 border-slate-800 dark:border-slate-700 overflow-hidden min-h-[850px] max-h-[92vh]'
              : 'shadow-sm'
          }`}
        >
          {/* Phone Frame Speaker / Dynamic Island on desktop simulation */}
          {isDesktopFrame && (
            <div className="bg-slate-900 py-1.5 flex items-center justify-center shrink-0">
              <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-800" />
                <span className="w-8 h-1 rounded-full bg-slate-800" />
              </div>
            </div>
          )}

          {/* Header */}
          <MobileHeader
            settings={settings}
            isOnline={isOnline}
            lang={lang}
            onToggleLang={() => {
              const nextLang = lang === 'hi' ? 'en' : 'hi';
              setLang(nextLang);
              showToast({
                type: 'info',
                title: nextLang === 'hi' ? 'हिन्दी भाषा चुन ली गई' : 'Switched to English',
                duration: 1800,
              });
            }}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onOpenInstall={() => setIsInstallModalOpen(true)}
            isDesktopFrame={isDesktopFrame}
            onToggleDesktopFrame={() => setIsDesktopFrame(!isDesktopFrame)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />

          {/* Screen Router View with Smooth Transitions & Error Boundary */}
          <main className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
            <AppErrorBoundary
              key={currentTab}
              sectionName={currentTab.toUpperCase()}
              onResetToHome={() => setCurrentTab('home')}
              lang={lang}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  {currentTab === 'home' && (
                    <DashboardScreen
                      products={products}
                      bills={bills}
                      settings={settings}
                      expenses={expenses}
                      onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
                      lang={lang}
                      onNavigate={(tab, subTab) => {
                        if (tab === 'reports' && subTab) {
                          setInitialReportSubTab(subTab as any);
                        }
                        setCurrentTab(tab);
                      }}
                      onOpenAddProduct={() => {
                        setProductToEdit(null);
                        setIsProductFormOpen(true);
                      }}
                      onViewBill={(bill) => {
                        const fresh = bills.find((b) => b.id === bill.id) || bill;
                        setLatestBill(fresh);
                        setIsSuccessModalOpen(true);
                      }}
                    />
                  )}

                  {currentTab === 'billing' && (
                    <BillingScreen
                      products={products}
                      settings={settings}
                      lang={lang}
                      onSaveBill={handleSaveBill}
                      onOpenSuccessModal={(bill) => {
                        setLatestBill(bill);
                        setIsSuccessModalOpen(true);
                      }}
                    />
                  )}

                  {currentTab === 'inventory' && (
                    <InventoryScreen
                      products={products}
                      lang={lang}
                      onOpenAddProduct={() => {
                        setProductToEdit(null);
                        setIsProductFormOpen(true);
                      }}
                      onSelectProduct={(product) => {
                        setSelectedProductForDetail(product);
                        setOpenDetailWithAddStock(false);
                      }}
                      onOpenAddStock={(product) => {
                        setSelectedProductForDetail(product);
                        setOpenDetailWithAddStock(true);
                      }}
                      onDeleteProduct={handleDeleteProduct}
                      onBulkDeleteProducts={handleBulkDeleteProducts}
                      onBulkUpdateCategory={handleBulkUpdateCategory}
                    />
                  )}

                  {currentTab === 'scan' && (
                    <ScanBillScreen
                      products={products}
                      purchases={purchases}
                      onConfirmPurchase={handleConfirmPurchase}
                      onDeletePurchase={handleDeletePurchase}
                      lang={lang}
                    />
                  )}

                  {currentTab === 'reports' && (
                    <ReportsScreen
                      bills={bills}
                      products={products}
                      settings={settings}
                      expenses={expenses}
                      initialTab={initialReportSubTab}
                      onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
                      onDeleteExpense={handleDeleteExpense}
                      onSettleUdhar={handleSettleUdhar}
                      onRecordPartPayment={handleRecordPartPayment}
                      onViewBill={(bill) => {
                        const fresh = bills.find((b) => b.id === bill.id) || bill;
                        setLatestBill(fresh);
                        setIsSuccessModalOpen(true);
                      }}
                      onDeleteBill={handleDeleteBill}
                      lang={lang}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </AppErrorBoundary>
          </main>

          {/* Bottom Navigation */}
          <BottomNavigation
            currentTab={currentTab}
            onTabChange={(tab) => {
              if (tab === 'reports') {
                setInitialReportSubTab('daily');
              }
              setCurrentTab(tab);
            }}
            cartCount={0}
            lowStockCount={lowStockCount}
            lang={lang}
          />
        </div>

        {/* MODALS */}
        {/* 1. Add / Edit Product Modal */}
        <ProductFormModal
          isOpen={isProductFormOpen}
          onClose={() => {
            setIsProductFormOpen(false);
            setProductToEdit(null);
          }}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
          productToEdit={productToEdit}
          lang={lang}
        />

        {/* 2. Product Detail Modal */}
        <ProductDetailModal
          product={selectedProductForDetail}
          movements={movements}
          isOpen={Boolean(selectedProductForDetail)}
          defaultOpenAddStock={openDetailWithAddStock}
          onClose={() => {
            setSelectedProductForDetail(null);
            setOpenDetailWithAddStock(false);
          }}
          onEdit={(prod) => {
            setSelectedProductForDetail(null);
            setOpenDetailWithAddStock(false);
            setProductToEdit(prod);
            setIsProductFormOpen(true);
          }}
          onQuickAddStock={handleQuickAddStock}
          onDelete={handleDeleteProduct}
          lang={lang}
        />

        {/* 3. Bill Success / Print / WhatsApp Modal */}
        <BillSuccessModal
          bill={latestBill}
          settings={settings}
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          lang={lang}
        />

        {/* 4. Install Mobile App (PWA / APK) Modal */}
        <PWAInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          lang={lang}
        />

        {/* 5. Shop Settings & Profile Modal */}
        <SettingsModal
          settings={settings}
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={(newSettings) => {
            setSettings(newSettings);
            showToast({
              type: 'success',
              title: lang === 'hi' ? 'दुकान सेटिंग्स सेव हो गईं!' : 'Shop Settings Saved!',
              message: newSettings.shopName,
            });
          }}
          onResetDemoData={handleResetDemoData}
          lang={lang}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* 6. Daily Shop Expense Modal */}
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSaveExpense={handleSaveExpense}
          onDeleteExpense={handleDeleteExpense}
          expenses={expenses}
          lang={lang}
        />
      </div>
    </ToastProvider>
  );
}

