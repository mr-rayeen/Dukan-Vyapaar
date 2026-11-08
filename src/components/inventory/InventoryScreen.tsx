import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { decomposePieces, formatStock, isLowStock } from '../../utils/stockLogic';
import {
  Search,
  Plus,
  AlertTriangle,
  Package,
  Layers,
  ChevronRight,
  Filter,
  Boxes,
  Trash2,
} from 'lucide-react';

interface InventoryScreenProps {
  products: Product[];
  onOpenAddProduct: () => void;
  onSelectProduct: (product: Product) => void;
  onOpenAddStock?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  lang: 'hi' | 'en';
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  products,
  onOpenAddProduct,
  onSelectProduct,
  onOpenAddStock,
  onDeleteProduct,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

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

  const lowStockCount = products.filter((p) => isLowStock(p.totalPieces, p.lowStockThresholdPieces)).length;

  return (
    <div className="space-y-3 pb-24">
      {/* Top Inventory Summary Bar */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wide">
              {lang === 'hi' ? 'गोदाम स्टॉक (Godown Inventory)' : 'Godown Stock Summary'}
            </span>
            <h2 className="text-xl font-black mt-0.5 tracking-tight">
              {totalGodownBoxes} <span className="text-xs font-normal text-blue-200">{lang === 'hi' ? 'बॉक्स' : 'Boxes'}</span>
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
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={lang === 'hi' ? 'प्रोडक्ट या बारकोड खोजें...' : 'Search product or barcode...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shrink-0 transition active:scale-95 ${
              filterLowStockOnly
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>{lang === 'hi' ? 'कम स्टॉक' : 'Low Stock'} ({lowStockCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition active:scale-95 ${
              selectedCategory === 'all' && !filterLowStockOnly
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
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
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            {lang === 'hi' ? 'स्टॉक सूची (Product Master)' : 'Products in Master'} ({filteredProducts.length})
          </span>
          <span className="text-[10px] text-slate-500">
            Tap item for pack details & stock edit
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500 space-y-2">
            <Boxes className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No products found matching filters.</p>
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
              const { cartons: boxes, loosePieces: looseLadi } = decomposePieces(product.totalPieces, product.packSize);
              const lowStock = isLowStock(product.totalPieces, product.lowStockThresholdPieces);
              const isZero = product.totalPieces <= 0;

              if (deletingProductId === product.id) {
                return (
                  <div
                    key={product.id}
                    className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-center justify-between gap-2 shadow-xs animate-in fade-in"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black text-rose-900 block truncate">
                        Delete {product.name}?
                      </span>
                      <span className="text-[10px] text-rose-700">
                        {lang === 'hi' ? 'यह सामान इन्वेंटरी से हमेशा के लिए हट जाएगा।' : 'This will be permanently removed from master.'}
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
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg active:scale-95 transition"
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
                  onClick={() => onSelectProduct(product)}
                  className={`bg-white border rounded-xl p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition active:scale-99 flex items-center justify-between gap-3 ${
                    lowStock ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {/* Product Name & Hindi */}
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">
                        {product.name}
                      </h4>
                      {lowStock && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black rounded uppercase shrink-0">
                          Low Stock
                        </span>
                      )}
                    </div>

                    {product.hindiName && (
                      <span className="text-[11px] text-slate-500 block truncate">
                        {product.hindiName}
                      </span>
                    )}

                    {/* Stock Math Badges */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {/* Saved Pack Size Pill */}
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        1 Box = {product.packSize} Ladi
                      </span>

                      {/* Displayed Stock in Boxes + Loose Ladi */}
                      <span
                        className={`text-[11px] font-black ${
                          isZero ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        {boxes} Box + {looseLadi} Ladi
                      </span>

                      {/* Total ladi */}
                      <span className="text-[10px] font-semibold text-slate-500">
                        ({product.totalPieces} Total Ladi)
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="text-[11px] text-slate-600 mt-1 font-medium">
                      Sale: <strong className="text-slate-900">₹{product.salePriceCarton}</strong>/Box • <strong className="text-slate-900">₹{product.salePricePiece}</strong>/Ladi
                    </div>
                  </div>

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
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg shadow-2xs active:scale-95 transition flex items-center gap-1"
                      title={lang === 'hi' ? 'स्टॉक जोड़ें व भाव सेट करें' : 'Add Stock & Prices'}
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'hi' ? 'स्टॉक' : 'Stock'}</span>
                    </button>

                    {onDeleteProduct && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingProductId(product.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition active:scale-95"
                        title={lang === 'hi' ? 'सामान हटाएं (Delete)' : 'Delete Item'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="text-slate-400">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
