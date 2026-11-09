import React, { useState, useMemo } from 'react';
import { Bill, Expense, Product } from '../../types';
import {
  getDailySalesData,
  getMonthlyProfitTrends,
  getCategoryPerformance,
  getStockItemsDistribution,
} from '../../utils/analyticsLogic';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  DollarSign,
  ArrowUpRight,
  Package,
  Layers,
  Sparkles,
  ReceiptText,
  Plus,
  Boxes,
} from 'lucide-react';

interface RechartsAnalyticsSectionProps {
  bills: Bill[];
  products: Product[];
  expenses?: Expense[];
  onOpenExpenseModal?: () => void;
  lang: 'hi' | 'en';
}

export const RechartsAnalyticsSection: React.FC<RechartsAnalyticsSectionProps> = ({
  bills,
  products,
  expenses = [],
  onOpenExpenseModal,
  lang,
}) => {
  // Pie view toggle: 'stock' (All stocked items) vs 'category' (Category sales)
  const [pieMode, setPieMode] = useState<'stock' | 'category'>('stock');

  // 1. Daily sales data for last 7 days
  const daily7DaysRaw = useMemo(() => getDailySalesData(bills, 7), [bills]);
  const barChartData = useMemo(() => {
    return daily7DaysRaw.map((d) => ({
      day: d.label,
      fullDate: d.dateKey,
      sales: d.total,
      cash: d.cash,
      upi: d.upi,
      udhar: d.udhar,
      billsCount: d.billCount,
    }));
  }, [daily7DaysRaw]);

  const total7DaySales = useMemo(
    () => barChartData.reduce((acc, curr) => acc + curr.sales, 0),
    [barChartData]
  );
  const avgDailySales = Math.round(total7DaySales / (barChartData.length || 1));

  // 2. Monthly profit trends data (last 6 months) with expenses factored into true Net Profit
  const monthlyProfitData = useMemo(
    () => getMonthlyProfitTrends(bills, products, 6, expenses),
    [bills, products, expenses]
  );
  const totalNetProfit6M = useMemo(
    () => monthlyProfitData.reduce((acc, curr) => acc + curr.profit, 0),
    [monthlyProfitData]
  );
  const totalGrossProfit6M = useMemo(
    () => monthlyProfitData.reduce((acc, curr) => acc + curr.grossProfit, 0),
    [monthlyProfitData]
  );
  const totalExpenses6M = useMemo(
    () => monthlyProfitData.reduce((acc, curr) => acc + curr.expenses, 0),
    [monthlyProfitData]
  );
  const avgMarginPercent = useMemo(() => {
    const totalRev = monthlyProfitData.reduce((acc, curr) => acc + curr.revenue, 0);
    return totalRev > 0 ? Math.round((totalNetProfit6M / totalRev) * 100) : 0;
  }, [monthlyProfitData, totalNetProfit6M]);

  // 3. Category performance data for Pie chart
  const categoryData = useMemo(
    () => getCategoryPerformance(bills, products),
    [bills, products]
  );
  const topCategory = categoryData[0];

  // 4. All Stocked Items Distribution for Pie chart
  const stockItemsData = useMemo(
    () => getStockItemsDistribution(products),
    [products]
  );
  const totalGodownStockValue = useMemo(
    () => stockItemsData.reduce((acc, curr) => acc + curr.stockValue, 0),
    [stockItemsData]
  );
  const topStockedProduct = stockItemsData[0];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 rounded-2xl p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded text-[9px] font-black uppercase tracking-wider">
                Recharts Analytics
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <h3 className="text-base font-black mt-1">
              {lang === 'hi' ? 'स्मार्ट सेल्स व प्रॉफिट ग्राफ़' : 'Interactive Visual Analytics'}
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              {lang === 'hi'
                ? 'पिछले 7 दिन की बिक्री, मासिक मुनाफा और टॉप कैटेगरी'
                : '7-Day Sales, Monthly Profits & Category Breakdown'}
            </p>
          </div>
        </div>
      </div>

      {/* 1. BAR CHART: Daily Sales of the last 7 days */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'hi' ? 'दैनिक बिक्री (पिछले 7 दिन)' : 'Daily Sales (Last 7 Days)'}</span>
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              ₹{total7DaySales.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Avg: ₹{avgDailySales.toLocaleString('en-IN')} / {lang === 'hi' ? 'दिन' : 'day'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>7 Days</span>
          </div>
        </div>

        {/* Recharts BarChart Container */}
        <div className="h-56 w-full pt-2 -ml-2">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.2} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={{ stroke: '#475569', strokeOpacity: 0.3 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-[11px] space-y-1 border border-slate-700">
                        <div className="font-extrabold text-emerald-400 text-xs">{data.day}</div>
                        <div className="font-black text-white text-sm">
                          ₹{Number(data.sales).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-300 pt-1 border-t border-slate-800 flex items-center justify-between gap-3">
                          <span>{data.billsCount} {lang === 'hi' ? 'बिल' : 'bills'}</span>
                          <span className="text-emerald-400">Cash: ₹{data.cash}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="sales"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. LINE CHART: Monthly Profit Trends */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{lang === 'hi' ? 'शुद्ध मासिक मुनाफा (True Net Profit)' : 'Monthly True Net Profit Trends'}</span>
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              ₹{totalNetProfit6M.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Gross: ₹{totalGrossProfit6M.toLocaleString('en-IN')}</span>
              <span>•</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">Expenses: -₹{totalExpenses6M.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenExpenseModal && (
              <button
                type="button"
                onClick={onOpenExpenseModal}
                className="flex items-center gap-1 px-2 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-lg text-[10px] font-extrabold border border-rose-200 dark:border-rose-800 transition active:scale-95"
              >
                <Plus className="w-3 h-3" />
                <span>{lang === 'hi' ? 'खर्च' : 'Expense'}</span>
              </button>
            )}
            <span className="text-[10px] font-extrabold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
              6 Months
            </span>
          </div>
        </div>

        {/* Recharts LineChart Container */}
        <div className="h-56 w-full pt-2 -ml-2">
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={monthlyProfitData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.2} />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={{ stroke: '#475569', strokeOpacity: 0.3 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-[11px] space-y-1.5 border border-slate-700">
                        <div className="font-extrabold text-teal-300 text-xs">{data.label}</div>
                        <div className="flex justify-between gap-3 text-xs">
                          <span className="text-slate-300">{lang === 'hi' ? 'शुद्ध नेट मुनाफा:' : 'True Net Profit:'}</span>
                          <strong className="text-emerald-400 font-black">₹{Number(data.profit).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="space-y-0.5 text-[10px] text-slate-300 pt-1 border-t border-slate-800">
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">{lang === 'hi' ? 'सकल मुनाफा (Gross):' : 'Gross Profit:'}</span>
                            <span className="text-teal-300 font-semibold">₹{data.grossProfit}</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-rose-400">{lang === 'hi' ? 'दुकान खर्च (Expenses):' : 'Shop Expenses:'}</span>
                            <span className="text-rose-400 font-bold">-₹{data.expenses}</span>
                          </div>
                          <div className="flex justify-between gap-3 text-slate-400 pt-0.5 border-t border-slate-800/60">
                            <span>{lang === 'hi' ? 'बिक्री:' : 'Sales:'} ₹{data.revenue}</span>
                            <span className="text-teal-400">{data.marginPercent}% margin</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#0d9488"
                strokeWidth={3}
                dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#14b8a6', stroke: '#0f766e', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. PIE CHART: All Stocked Items & Category Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {pieMode === 'stock'
                  ? (lang === 'hi' ? 'गोदाम स्टॉक ग्राफ (All Stocked Items)' : 'Stocked Items Distribution')
                  : (lang === 'hi' ? 'कैटेगरी बिक्री ग्राफ (Category Sales)' : 'Category Performance')}
              </span>
            </span>
            <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              {pieMode === 'stock'
                ? `₹${totalGodownStockValue.toLocaleString('en-IN')}`
                : (topCategory ? topCategory.name : 'All Categories')}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {pieMode === 'stock'
                ? `${stockItemsData.length} ${lang === 'hi' ? 'आइटम गोदाम में' : 'products in godown'}`
                : (topCategory ? `Top: ${topCategory.percentage}% share` : 'Category sales')}
            </span>
          </div>

          {/* Mode Switcher Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-black shrink-0">
            <button
              type="button"
              onClick={() => setPieMode('stock')}
              className={`px-2 py-1 rounded-md transition ${
                pieMode === 'stock'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lang === 'hi' ? 'स्टॉक' : 'Stock Items'}
            </button>
            <button
              type="button"
              onClick={() => setPieMode('category')}
              className={`px-2 py-1 rounded-md transition ${
                pieMode === 'category'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lang === 'hi' ? 'कैटेगरी' : 'Categories'}
            </button>
          </div>
        </div>

        {/* Recharts PieChart Container */}
        <div className="h-60 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-[11px] space-y-1 border border-slate-700">
                        <div className="font-extrabold text-emerald-300 text-xs truncate max-w-[200px]">
                          {data.name}
                        </div>
                        <div className="font-black text-white text-sm">
                          ₹{Number(pieMode === 'stock' ? data.stockValue : data.value).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-300 flex justify-between gap-3 pt-0.5 border-t border-slate-800">
                          <span>{data.percentage}% of total</span>
                          <span>
                            {pieMode === 'stock'
                              ? `${data.cartons} Box + ${data.loosePieces} Ladi`
                              : `${data.pieces} Ladi sold`}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={pieMode === 'stock' ? stockItemsData : categoryData}
                dataKey={pieMode === 'stock' ? 'stockValue' : 'value'}
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={82}
                paddingAngle={3}
              >
                {(pieMode === 'stock' ? stockItemsData : categoryData).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend List */}
        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          {(pieMode === 'stock' ? stockItemsData : categoryData).slice(0, 8).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-800/70 p-1.5 rounded-lg"
            >
              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-[10px]">
                  {item.name}
                </span>
              </div>
              <span className="font-black text-slate-900 dark:text-white shrink-0 text-[10px]">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
