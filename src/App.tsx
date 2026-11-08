/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
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
    return (saved === 'hi' || saved === 'en') ? saved : 'en';
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
    setIsDarkMode((prev) => !prev);
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

  // Auto-sync state to LocalStorage
  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  useEffect(() => {
    saveStoredBills(bills);
  }, [bills]);

  useEffect(() => {
    saveStoredMovements(movements);
  }, [movements]);

  useEffect(() => {
    saveStoredPurchases(purchases);
  }, [purchases]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredExpenses(expenses);
  }, [expenses]);

  const handleSaveExpense = (newExpense: Expense) => {
    setExpenses((prev) => {
      const updated = [newExpense, ...prev];
      saveStoredExpenses(updated);
      return updated;
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => {
      const updated = prev.filter((e) => e.id !== expenseId);
      saveStoredExpenses(updated);
      return updated;
    });
  };

  // Handle Save Bill & Stock Deduction
  const handleSaveBill = (newBill: Bill) => {
    // 1. Deduct Stock for all bill items
    let updatedProducts = [...products];
    const newMovements: StockMovement[] = [];

    newBill.items.forEach((item) => {
      const piecesSold = (item.cartonQty * item.packSize) + item.pieceQty;
      
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
  };

  // Handle Supplier Purchase (from Camera OCR or Manual)
  const handleConfirmPurchase = (purchase: SupplierPurchase, updatedProductsList: Product[]) => {
    const newMovements: StockMovement[] = [];

    purchase.items.forEach((item) => {
      const piecesAdded = (item.cartonQty * item.packSize) + item.pieceQty;
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
  };

  // Save / Update Product Master
  const handleSaveProduct = (product: Product, isNew: boolean) => {
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
    } else {
      setProducts(products.map((p) => (p.id === product.id ? product : p)));
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
    const piecesToAdd = (addedCartons * product.packSize) + addedPieces;
    const newTotal = product.totalPieces + piecesToAdd;

    const effectiveSaleBox = (newSalePriceCarton !== undefined && newSalePriceCarton > 0) ? newSalePriceCarton : product.salePriceCarton;
    const effectiveSalePiece = (newSalePricePiece !== undefined && newSalePricePiece > 0) ? newSalePricePiece : product.salePricePiece;
    const effectivePurchaseBox = (newPurchaseRateCarton !== undefined && newPurchaseRateCarton > 0) ? newPurchaseRateCarton : product.purchaseRateCarton;

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

    // Update open detail modal
    setSelectedProductForDetail((prev) =>
      prev && prev.id === product.id
        ? {
            ...prev,
            totalPieces: newTotal,
            salePriceCarton: effectiveSaleBox,
            salePricePiece: effectiveSalePiece,
            purchaseRateCarton: effectivePurchaseBox,
          }
        : prev
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      saveStoredProducts(updated);
      return updated;
    });
    setSelectedProductForDetail(null);
    setIsProductFormOpen(false);
    setProductToEdit(null);
  };

  // Handle Delete Bill (Cancel wrong bill & restore deducted stock back to godown)
  const handleDeleteBill = (billId: string) => {
    const billToDelete = bills.find((b) => b.id === billId);
    if (!billToDelete) return;

    // 1. Restore stock to products
    let updatedProducts = [...products];
    const newMovements: StockMovement[] = [];

    billToDelete.items.forEach((item) => {
      const piecesToRestore = (item.cartonQty * item.packSize) + item.pieceQty;

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
  };

  // Settle Udhar Bill completely
  const handleSettleUdhar = (billId: string) => {
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
            payments: [...(b.payments || []), { ...paymentRecord, billNumber: b.billNumber, amount: payment.amount }],
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
  };

  // Reset to Demo Data
  const handleResetDemoData = () => {
    resetAppToDemoData();
    setProducts(getStoredProducts());
    setBills(getStoredBills());
    setMovements(getStoredMovements());
    setPurchases(getStoredPurchases());
    setSettings(getStoredSettings());
    setExpenses(getStoredExpenses());
  };

  // Low Stock Count for badge
  const lowStockCount = products.filter((p) =>
    isLowStock(p.totalPieces, p.lowStockThresholdPieces)
  ).length;

  return (
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
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
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
          onToggleLang={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onOpenInstall={() => setIsInstallModalOpen(true)}
          isDesktopFrame={isDesktopFrame}
          onToggleDesktopFrame={() => setIsDesktopFrame(!isDesktopFrame)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Screen Router View */}
        <main className="flex-1 p-3 overflow-y-auto">
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
            />
          )}

          {currentTab === 'scan' && (
            <ScanBillScreen
              products={products}
              onConfirmPurchase={handleConfirmPurchase}
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
        onSave={(newSettings) => setSettings(newSettings)}
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
  );
}
