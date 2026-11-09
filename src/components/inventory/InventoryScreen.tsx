import React, { useState, useMemo, useRef } from 'react';
import { Product } from '../../types';
import { decomposePieces, isLowStock } from '../../utils/stockLogic';
import {
  Search,
  Plus,
  AlertTriangle,
  ChevronRight,
  Boxes,
  Trash2,
  CheckSquare,
  Square,
  FolderPlus,
  Tag,
  X,
  CheckCircle2,
} from 'lucide-react';

interface InventoryScreenProps {
  products: Product[];
  onOpenAddProduct: () => void;
  onSelectProduct: (product: Product) => void;
  onOpenAddStock?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onBulkDeleteProducts?: (productIds: string[]) => void;
  onBulkUpdateCategory?: (productIds: string[], newCategory: string) => void;
  lang: 'hi' | 'en';
}

const PRESET_CATEGORIES = [
  'Namkeen',
  'Biscuit',
  'Snacks & Chips',
  'Kurkure & Fryums',
  'Confectionery',
  'Beverages',
  'Spices & Masala',
  'General',
];

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  products,
  onOpenAddProduct,
  onSelectProduct,
  onOpenAddStock,
  onDeleteProduct,
  onBulkDeleteProducts,
  onBulkUpdateCategory,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Multi-select state (triggered by holding/long-pressing an item or tapping Select button)
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState<boolean>(false);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState<boolean>(false);
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');

  // Long-press timer refs
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [products]);

  const allAvailableCategories = useMemo(() => {
    const set = new Set<string>(categories);
    PRESET_CATEGORIES.forEach((c) => set.add(c));
    return Array.from(set);
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (filterLowStockOnly) {
      list = list.filter((p) => isLowStock(p.totalPieces, p.lowStockThresholdPieces));
    }
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.hindiName && p.hindiName.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(q))
      );
    }
    return list;
  }, [products, filterLowStockOnly, selectedCategory, searchQuery]);

  // Overall totals
  let totalGodownBoxes = 0;
  let totalGodownLadi = 0;
  products.forEach((p) => {
    totalGodownLadi += p.totalPieces;
    const { cartons } = decomposePieces(p.totalPieces, p.packSize);
    totalGodownBoxes += cartons;
  });

  const lowStockCount = products.filter((p) =>
    isLowStock(p.totalPieces, p.lowStockThresholdPieces)
  ).length;

  // Toggle selection of a single product
  const toggleSelectProduct = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      if (next.size === 0) {
        setShowBulkDeleteConfirm(false);
        setShowBulkCategoryModal(false);
      }
      return next;
    });
  };

  // Exit selection mode completely
  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setShowBulkDeleteConfirm(false);
    setShowBulkCategoryModal(false);
    setCustomCategoryInput('');
  };

  // Select All / Deselect All currently filtered products
  const handleToggleSelectAll = () => {
    const allFilteredSelected =
      filteredProducts.length > 0 &&
      filteredProducts.every((p) => selectedIds.has(p.id));

    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      filteredProducts.forEach((p) => next.add(p.id));
      setSelectedIds(next);
    }
  };

  // Long-press handlers for hold-to-select
  const handlePressStart = (productId: string) => {
    longPressTriggeredRef.current = false;
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setIsSelectionMode(true);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.add(productId);
        return next;
      });
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {
          // ignore vibration errors
        }
      }
    }, 420);
  };

  const handlePressCancel = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Apply bulk category update
  const handleApplyBulkCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed || selectedIds.size === 0) return;
    const idsArray = Array.from(selectedIds);
    if (onBulkUpdateCategory) {
      onBulkUpdateCategory(idsArray, trimmed);
    }
    exitSelectionMode();
  };

  // Confirm bulk delete
  const handleConfirmBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const idsArray = Array.from(selectedIds);
    if (onBulkDeleteProducts) {
      onBulkDeleteProducts(idsArray);
    } else if (onDeleteProduct) {
      idsArray.forEach((id) => onDeleteProduct(id));
    }
    exitSelectionMode();
  };

  return (
    <div className="space-y-3 pb-28">
      {/* Top Inventory Summary Bar */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wide">
              {lang === 'hi' ? 'गोदाम स्टॉक (Godown Inventory)' : 'Godown Stock Summary'}
            </span>
            <h2 className="text-xl font-black mt-0.5 tracking-tight">
              {totalGodownBoxes}{' '}
              <span className="text-xs font-normal text-blue-200">
                {lang === 'hi' ? 'बॉक्स' : 'Boxes'}
              </span>
            </h2>
            <div className="text-xs text-blue-100 mt-0.5">
              {products.length} Products Master • {totalGodownLadi.toLocaleString('en-IN')} Total Ladi (लड़ी)
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAddProduct}
            className="bg-white text-blue-900 font-black text-xs px-3.5 py-2.5 rounded-xl shadow-md active:scale-95 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>{lang === 'hi' ? 'नया आइटम' : 'Add Item'}</span>
          </button>
        </div>
      </div>

      {/* Search & Quick Filters */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-2xs space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={
              lang === 'hi'
                ? 'प्रोडक्ट, कैटेगरी या बारकोड खोजें...'
                : 'Search product, category, or barcode...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0 transition active:scale-95 ${
              filterLowStockOnly
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>
              {lang === 'hi' ? 'कम स्टॉक' : 'Low Stock'} ({lowStockCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition active:scale-95 ${
              selectedCategory === 'all' && !filterLowStockOnly
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'hi' ? 'सभी कैटेगरी (All)' : 'All Categories'}
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setFilterLowStockOnly(false);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 transition active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sticky Multi-Select Action Panel (Active when holding an item or tapping Select) */}
      {isSelectionMode && (
        <div className="sticky top-2 z-30 bg-slate-900 text-white rounded-2xl p-3 shadow-xl border border-blue-500/40 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-xs">
                {selectedIds.size} {lang === 'hi' ? 'चयनित' : 'Selected'}
              </span>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-[11px] border border-slate-700 transition active:scale-95"
              >
                {filteredProducts.length > 0 &&
                filteredProducts.every((p) => selectedIds.has(p.id))
                  ? lang === 'hi'
                    ? 'सब अनसेलेक्ट करें'
                    : 'Unselect All'
                  : lang === 'hi'
                  ? `सभी चुनें (${filteredProducts.length})`
                  : `Select All (${filteredProducts.length})`}
              </button>
            </div>

            <button
              type="button"
              onClick={exitSelectionMode}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'बंद करें' : 'Done'}</span>
            </button>
          </div>

          {/* Primary Bulk Buttons: Add to Category & Delete Selected */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => {
                setShowBulkCategoryModal((prev) => !prev);
                setShowBulkDeleteConfirm(false);
              }}
              className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
                selectedIds.size === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span>
                {lang === 'hi' ? 'कैटेगरी में डालें' : 'Add to Category'}
              </span>
            </button>

            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => {
                setShowBulkDeleteConfirm((prev) => !prev);
                setShowBulkCategoryModal(false);
              }}
              className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
                selectedIds.size === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {lang === 'hi'
                  ? `एक साथ हटाएं (${selectedIds.size})`
                  : `Delete (${selectedIds.size})`}
              </span>
            </button>
          </div>

          {/* Inline Bulk Category Picker Drawer */}
          {showBulkCategoryModal && selectedIds.size > 0 && (
            <div className="p-3 bg-slate-800/95 rounded-xl border border-blue-500/30 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-blue-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  {lang === 'hi'
                    ? `${selectedIds.size} आइटम के लिए कैटेगरी चुनें या नई बनाएं:`
                    : `Select or create category for ${selectedIds.size} items:`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowBulkCategoryModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Existing & Preset Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {allAvailableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleApplyBulkCategory(cat)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-blue-600 text-white text-xs font-bold transition active:scale-95 flex items-center gap-1 border border-slate-600"
                  >
                    <Tag className="w-3 h-3 text-blue-300" />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>

              {/* Custom New Category Input */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  placeholder={
                    lang === 'hi'
                      ? 'या नई कैटेगरी का नाम लिखें (जैसे: Namkeen)...'
                      : 'Or type new category name...'
                  }
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  disabled={!customCategoryInput.trim()}
                  onClick={() => handleApplyBulkCategory(customCategoryInput)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black text-xs rounded-lg transition active:scale-95 shrink-0"
                >
                  {lang === 'hi' ? 'जोड़ें' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* Inline Bulk Delete Confirmation */}
          {showBulkDeleteConfirm && selectedIds.size > 0 && (
            <div className="p-3 bg-rose-950/90 border border-rose-500/50 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black text-rose-200 block">
                  {lang === 'hi'
                    ? `क्या आप चुने गए ${selectedIds.size} आइटम हमेशा के लिए हटाना चाहते हैं?`
                    : `Permanently delete ${selectedIds.size} selected items?`}
                </span>
                <span className="text-[10px] text-rose-300">
                  {lang === 'hi'
                    ? 'यह सामान गोदाम मास्टर से हट जाएगा।'
                    : 'These items will be removed from product master.'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg shadow-xs active:scale-95 transition"
                >
                  {lang === 'hi' ? 'हाँ, हटाएं' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-2.5 py-1.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg active:scale-95 transition"
                >
                  {lang === 'hi' ? 'रद्द' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Products List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide block">
              {lang === 'hi' ? 'स्टॉक सूची (Product Master)' : 'Products in Master'} ({filteredProducts.length})
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {lang === 'hi'
                ? 'आइटम दबाए रखें (Hold) एक साथ कई आइटम चुनने के लिए'
                : 'Hold any item to multi-select for bulk category or delete'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isSelectionMode) {
                exitSelectionMode();
              } else {
                setIsSelectionMode(true);
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition active:scale-95 ${
              isSelectionMode
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>
              {isSelectionMode
                ? lang === 'hi'
                  ? 'चयन बंद करें'
                  : 'Exit Select'
                : lang === 'hi'
                ? 'एक साथ चुनें (Select)'
                : 'Select Multiple'}
            </span>
          </button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center text-slate-500 space-y-2">
            <Boxes className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No products found matching filters.
            </p>
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              + Create New Product
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => {
              const { cartons: boxes, loosePieces: looseLadi } = decomposePieces(
                product.totalPieces,
                product.packSize
              );
              const lowStock = isLowStock(
                product.totalPieces,
                product.lowStockThresholdPieces
              );
              const isZero = product.totalPieces <= 0;
              const isSelected = selectedIds.has(product.id);

              if (!isSelectionMode && deletingProductId === product.id) {
                return (
                  <div
                    key={product.id}
                    className="p-3 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-xl flex items-center justify-between gap-2 shadow-xs animate-in fade-in"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black text-rose-900 dark:text-rose-200 block truncate">
                        Delete {product.name}?
                      </span>
                      <span className="text-[10px] text-rose-700 dark:text-rose-400">
                        {lang === 'hi'
                          ? 'यह सामान इन्वेंटरी से हमेशा के लिए हट जाएगा।'
                          : 'This will be permanently removed from master.'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteProduct) onDeleteProduct(product.id);
                          setDeletingProductId(null);
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-lg shadow-xs active:scale-95 transition"
                      >
                        {lang === 'hi' ? 'हटाएं' : 'Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingProductId(null);
                        }}
                        className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg active:scale-95 transition"
                      >
                        {lang === 'hi' ? 'रद्द' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={product.id}
                  onTouchStart={() => handlePressStart(product.id)}
                  onTouchEnd={handlePressCancel}
                  onTouchMove={handlePressCancel}
                  onMouseDown={() => handlePressStart(product.id)}
                  onMouseUp={handlePressCancel}
                  onMouseLeave={handlePressCancel}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handlePressCancel();
                    setIsSelectionMode(true);
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      next.add(product.id);
                      return next;
                    });
                  }}
                  onClick={() => {
                    if (longPressTriggeredRef.current) {
                      longPressTriggeredRef.current = false;
                      return;
                    }
                    if (isSelectionMode) {
                      toggleSelectProduct(product.id);
                    } else {
                      onSelectProduct(product);
                    }
                  }}
                  className={`bg-white dark:bg-slate-800 border rounded-xl p-3 shadow-2xs cursor-pointer transition select-none flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500/30'
                      : lowStock
                      ? 'border-rose-300 bg-rose-50/20 dark:border-rose-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  {/* Selection Checkbox when in Multi-Select Mode */}
                  {isSelectionMode && (
                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-slate-400 flex items-center justify-center">
                          <Square className="w-4 h-4 opacity-0" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {/* Product Name, Category Badge & Low Stock */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {product.name}
                      </h4>
                      {product.category && (
                        <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[9px] font-bold rounded shrink-0">
                          {product.category}
                        </span>
                      )}
                      {lowStock && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black rounded uppercase shrink-0">
                          Low Stock
                        </span>
                      )}
                    </div>

                    {product.hindiName && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        {product.hindiName}
                      </span>
                    )}

                    {/* Stock Math Badges */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {/* Saved Pack Size Pill */}
                      <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        1 Box = {product.packSize} Ladi
                      </span>

                      {/* Displayed Stock in Boxes + Loose Ladi */}
                      <span
                        className={`text-[11px] font-black ${
                          isZero
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {boxes} Box + {looseLadi} Ladi
                      </span>

                      {/* Total ladi */}
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        ({product.totalPieces} Total Ladi)
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                      Sale:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        ₹{product.salePriceCarton}
                      </strong>
                      /Box •{' '}
                      <strong className="text-slate-900 dark:text-white">
                        ₹{product.salePricePiece}
                      </strong>
                      /Ladi
                    </div>
                  </div>

                  {!isSelectionMode && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenAddStock) {
                            onOpenAddStock(product);
                          } else {
                            onSelectProduct(product);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold rounded-lg shadow-2xs active:scale-95 transition flex items-center gap-1"
                        title={
                          lang === 'hi'
                            ? 'स्टॉक जोड़ें व भाव सेट करें'
                            : 'Add Stock & Prices'
                        }
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{lang === 'hi' ? 'स्टॉक' : 'Stock'}</span>
                      </button>

                      {onDeleteProduct && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingProductId(product.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition active:scale-95"
                          title={lang === 'hi' ? 'सामान हटाएं (Delete)' : 'Delete Item'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="text-slate-400">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
