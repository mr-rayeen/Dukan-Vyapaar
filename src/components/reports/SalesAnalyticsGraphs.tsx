import React, { useState, useMemo } from 'react';
import { Bill, Product, ShopSettings } from '../../types';
import {
  getDailySalesData,
  getMonthlySalesData,
  getQuarterlySalesData,
  getCustomerUdharSummary,
  getUdharOverallMetrics,
  getTopSellingProducts,
  DailyDataPoint,
  MonthlyDataPoint,
  QuarterlyDataPoint,
} from '../../utils/analyticsLogic';
import { shareViaWhatsApp } from '../../utils/printerService';
import {
  TrendingUp,
  Calendar,
  CreditCard,
  DollarSign,
  PieChart,
  BarChart3,
  ArrowUpRight,
  UserCheck,
  AlertCircle,
  Share2,
  Package,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface SalesAnalyticsGraphsProps {
  bills: Bill[];
  products: Product[];
  settings: ShopSettings;
  lang: 'hi' | 'en';
}

type TimeframeMode = 'daily' | 'monthly' | 'quarterly' | 'udhar';

export const SalesAnalyticsGraphs: React.FC<SalesAnalyticsGraphsProps> = ({
  bills,
  products,
  settings,
  lang,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeMode>('daily');
  const [dailyRangeDays, setDailyRangeDays] = useState<number>(7);
  const [monthlyRangeMonths, setMonthlyRangeMonths] = useState<number>(6);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  // Computed data points
  const dailyData = useMemo(
    () => getDailySalesData(bills, dailyRangeDays),
    [bills, dailyRangeDays]
  );
  const monthlyData = useMemo(
    () => getMonthlySalesData(bills, monthlyRangeMonths),
    [bills, monthlyRangeMonths]
  );
  const quarterlyData = useMemo(() => getQuarterlySalesData(bills), [bills]);
  const udharMetrics = useMemo(() => getUdharOverallMetrics(bills), [bills]);
  const customerUdhar = useMemo(() => getCustomerUdharSummary(bills), [bills]);
  const topProducts = useMemo(() => getTopSellingProducts(bills), [bills]);

  // Overall totals across all bills
  const totalRevenue = bills.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalCash = bills
    .filter((b) => b.paymentMethod === 'cash')
    .reduce((acc, b) => acc + b.totalAmount, 0);
  const totalUpi = bills
    .filter((b) => b.paymentMethod === 'upi')
    .reduce((acc, b) => acc + b.totalAmount, 0);
  const totalUdhar = bills
    .filter((b) => b.paymentMethod === 'udhar')
    .reduce((acc, b) => acc + b.totalAmount, 0);

  const cashPercent = totalRevenue > 0 ? Math.round((totalCash / totalRevenue) * 100) : 0;
  const upiPercent = totalRevenue > 0 ? Math.round((totalUpi / totalRevenue) * 100) : 0;
  const udharPercent = totalRevenue > 0 ? Math.round((totalUdhar / totalRevenue) * 100) : 0;

  // Active chart data based on timeframe
  const activeChartData = useMemo(() => {
    if (timeframe === 'daily') {
      return dailyData.map((d) => ({
        label: d.label,
        subLabel: d.dateKey,
        total: d.total,
        cash: d.cash,
        upi: d.upi,
        udhar: d.udhar,
        bills: d.billCount,
      }));
    }
    if (timeframe === 'monthly') {
      return monthlyData.map((m) => ({
        label: m.shortLabel,
        subLabel: m.label,
        total: m.total,
        cash: m.cash,
        upi: m.upi,
        udhar: m.udhar,
        bills: m.billCount,
      }));
    }
    if (timeframe === 'quarterly') {
      return quarterlyData.map((q) => ({
        label: q.label,
        subLabel: q.quarterName,
        total: q.total,
        cash: q.cash,
        upi: q.upi,
        udhar: q.udhar,
        bills: q.billCount,
      }));
    }
    return [];
  }, [timeframe, dailyData, monthlyData, quarterlyData]);

  // Find max total for Y-scaling
  const maxTotal = useMemo(() => {
    const maxVal = Math.max(...activeChartData.map((d) => d.total), 1000);
    // Round up to nearest nice number
    if (maxVal <= 5000) return 5000;
    if (maxVal <= 10000) return 10000;
    if (maxVal <= 25000) return 25000;
    if (maxVal <= 50000) return 50000;
    if (maxVal <= 100000) return 100000;
    return Math.ceil(maxVal / 50000) * 50000;
  }, [activeChartData]);

  const selectedPoint =
    selectedBarIndex !== null && activeChartData[selectedBarIndex]
      ? activeChartData[selectedBarIndex]
      : null;

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* Timeframe Selector Pill Bar */}
      <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-4 gap-1 text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => {
            setTimeframe('daily');
            setSelectedBarIndex(null);
          }}
          className={`py-2 rounded-lg transition active:scale-95 text-center ${
            timeframe === 'daily'
              ? 'bg-white text-slate-900 shadow-xs font-black'
              : 'hover:text-slate-900'
          }`}
        >
          {lang === 'hi' ? 'दैनिक (Day)' : 'Day'}
        </button>

        <button
          type="button"
          onClick={() => {
            setTimeframe('monthly');
            setSelectedBarIndex(null);
          }}
          className={`py-2 rounded-lg transition active:scale-95 text-center ${
            timeframe === 'monthly'
              ? 'bg-white text-slate-900 shadow-xs font-black'
              : 'hover:text-slate-900'
          }`}
        >
          {lang === 'hi' ? 'मासिक (Month)' : 'Month'}
        </button>

        <button
          type="button"
          onClick={() => {
            setTimeframe('quarterly');
            setSelectedBarIndex(null);
          }}
          className={`py-2 rounded-lg transition active:scale-95 text-center ${
            timeframe === 'quarterly'
              ? 'bg-white text-slate-900 shadow-xs font-black'
              : 'hover:text-slate-900'
          }`}
        >
          {lang === 'hi' ? 'तिमाही (Quarter)' : 'Quarter'}
        </button>

        <button
          type="button"
          onClick={() => {
            setTimeframe('udhar');
            setSelectedBarIndex(null);
          }}
          className={`py-2 rounded-lg transition active:scale-95 text-center ${
            timeframe === 'udhar'
              ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
              : 'hover:text-slate-900'
          }`}
        >
          {lang === 'hi' ? 'उधार ट्रैकर' : 'Udhar Track'}
        </button>
      </div>

      {/* Main KPI Highlights */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Cash (नकद)</span>
          <div className="text-sm font-black text-emerald-950 mt-0.5">₹{totalCash.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">{cashPercent}% of total</span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
          <span className="text-[10px] font-bold text-blue-800 uppercase block">UPI (ऑनलाइन)</span>
          <div className="text-sm font-black text-blue-950 mt-0.5">₹{totalUpi.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-blue-700 font-semibold">{upiPercent}% of total</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
          <span className="text-[10px] font-bold text-amber-800 uppercase block">Udhar (उधार)</span>
          <div className="text-sm font-black text-amber-950 mt-0.5">₹{totalUdhar.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-amber-700 font-semibold">{udharPercent}% of total</span>
        </div>
      </div>

      {/* CHART VIEW FOR DAILY / MONTHLY / QUARTERLY */}
      {timeframe !== 'udhar' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          {/* Subheader / Range Filters */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>
                  {timeframe === 'daily'
                    ? lang === 'hi'
                      ? 'दैनिक बिक्री रुझान (Daily Sales Trend)'
                      : 'Daily Sales Performance'
                    : timeframe === 'monthly'
                    ? lang === 'hi'
                      ? 'मासिक बिक्री रुझान (Monthly Sales Trend)'
                      : 'Monthly Sales Performance'
                    : lang === 'hi'
                    ? 'तिमाही बिक्री रुझान (Quarterly Sales)'
                    : 'Quarterly Sales (Q1-Q4)'}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Tap on any bar to see detailed Cash, UPI & Udhar split
              </p>
            </div>

            {/* Range Toggle if Daily */}
            {timeframe === 'daily' && (
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold text-slate-600">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      setDailyRangeDays(days);
                      setSelectedBarIndex(null);
                    }}
                    className={`px-2 py-0.5 rounded ${
                      dailyRangeDays === days
                        ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            )}

            {/* Range Toggle if Monthly */}
            {timeframe === 'monthly' && (
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold text-slate-600">
                {[6, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMonthlyRangeMonths(m);
                      setSelectedBarIndex(null);
                    }}
                    className={`px-2 py-0.5 rounded ${
                      monthlyRangeMonths === m
                        ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {m}M
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Stacked Bar Chart */}
          <div className="relative pt-2">
            {/* Legend */}
            <div className="flex items-center justify-end gap-3 text-[10px] font-bold text-slate-600 mb-2">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                <span>Cash</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" />
                <span>UPI</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                <span>Udhar</span>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-44 w-full flex items-end gap-1.5 sm:gap-2 border-b border-slate-200 pb-2 relative">
              {/* Background horizontal guide lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
                <div className="border-b border-dashed border-slate-300 w-full flex justify-end text-[9px] text-slate-400 pr-1">
                  ₹{(maxTotal / 1000).toFixed(0)}k
                </div>
                <div className="border-b border-dashed border-slate-300 w-full flex justify-end text-[9px] text-slate-400 pr-1">
                  ₹{(maxTotal / 2000).toFixed(0)}k
                </div>
                <div className="border-b border-dashed border-slate-300 w-full" />
              </div>

              {/* Bars */}
              {activeChartData.map((item, index) => {
                const heightPercent = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
                const safeHeight = Math.max(heightPercent, item.total > 0 ? 5 : 2);
                
                // Segments height percentages
                const cashH = item.total > 0 ? (item.cash / item.total) * 100 : 0;
                const upiH = item.total > 0 ? (item.upi / item.total) * 100 : 0;
                const udharH = item.total > 0 ? (item.udhar / item.total) * 100 : 0;

                const isSelected = selectedBarIndex === index;

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedBarIndex(isSelected ? null : index)}
                    className="flex-1 h-full flex flex-col justify-end items-center cursor-pointer group relative z-10"
                  >
                    {/* Bar Stack Container */}
                    <div
                      style={{ height: `${safeHeight}%` }}
                      className={`w-full max-w-[32px] rounded-t-md overflow-hidden flex flex-col-reverse transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-slate-900 ring-offset-1 scale-105'
                          : 'group-hover:opacity-90'
                      }`}
                    >
                      {/* Cash segment (bottom) */}
                      {cashH > 0 && (
                        <div
                          style={{ height: `${cashH}%` }}
                          className="bg-emerald-500 w-full"
                          title={`Cash: ₹${item.cash}`}
                        />
                      )}
                      {/* UPI segment (middle) */}
                      {upiH > 0 && (
                        <div
                          style={{ height: `${upiH}%` }}
                          className="bg-blue-500 w-full"
                          title={`UPI: ₹${item.upi}`}
                        />
                      )}
                      {/* Udhar segment (top) */}
                      {udharH > 0 && (
                        <div
                          style={{ height: `${udharH}%` }}
                          className="bg-amber-500 w-full"
                          title={`Udhar: ₹${item.udhar}`}
                        />
                      )}
                      {/* Empty filler if zero */}
                      {item.total === 0 && (
                        <div className="bg-slate-200 w-full h-full" />
                      )}
                    </div>

                    {/* Bottom Label */}
                    <span
                      className={`text-[9px] mt-1.5 truncate max-w-full text-center font-bold ${
                        isSelected ? 'text-slate-900 font-black' : 'text-slate-500'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected Bar Details Card */}
            {selectedPoint && (
              <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-400">
                    {selectedPoint.subLabel}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {selectedPoint.bills} {lang === 'hi' ? 'बिल कटे' : 'bills'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Total</span>
                    <strong className="text-white">₹{selectedPoint.total}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-400 block">Cash</span>
                    <strong className="text-emerald-300">₹{selectedPoint.cash}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-blue-400 block">UPI</span>
                    <strong className="text-blue-300">₹{selectedPoint.upi}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-amber-400 block">Udhar</span>
                    <strong className="text-amber-300">₹{selectedPoint.udhar}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEDICATED UDHARI TRACKER VIEW */}
      {timeframe === 'udhar' && (
        <div className="space-y-3.5">
          {/* Udhar Health & Recovery Meter Card */}
          <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                  {lang === 'hi' ? 'उधार रिकवरी रिपोर्ट' : 'Credit Recovery Health'}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  ₹{udharMetrics.totalPendingUdhar.toLocaleString('en-IN')} <span className="text-xs font-semibold text-rose-600">Pending</span>
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {udharMetrics.recoveryRate.toFixed(0)}% Recovered
                </span>
              </div>
            </div>

            {/* Progress Bar of Recovery */}
            <div className="space-y-1">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${udharMetrics.recoveryRate}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title="Settled Udhar"
                />
                <div
                  style={{ width: `${100 - udharMetrics.recoveryRate}%` }}
                  className="bg-rose-500 h-full transition-all duration-500"
                  title="Pending Udhar"
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span className="text-emerald-700">₹{udharMetrics.totalUdharSettled.toLocaleString('en-IN')} Settled ({udharMetrics.settledCount} bills)</span>
                <span className="text-rose-600">₹{udharMetrics.totalPendingUdhar.toLocaleString('en-IN')} Unpaid ({udharMetrics.pendingCount} bills)</span>
              </div>
            </div>
          </div>

          {/* Customer-wise Outstanding Udhar Graph */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                {lang === 'hi' ? 'ग्राहक-वार बकाया ग्राफ़ (Top Borrowers)' : 'Customer-wise Pending Udhar'}
              </span>
              <span className="text-[10px] text-slate-400">
                {customerUdhar.length} total customers
              </span>
            </div>

            {customerUdhar.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                {lang === 'hi' ? 'कोई बकाया उधार नहीं है!' : 'No pending customer credit!'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {customerUdhar.slice(0, 5).map((cust, idx) => {
                  const maxCustDebt = Math.max(...customerUdhar.map((c) => c.totalPending), 1);
                  const widthPercent = (cust.totalPending / maxCustDebt) * 100;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900 truncate max-w-[180px]">
                          {cust.customerName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-600 font-black">
                            ₹{cust.totalPending.toLocaleString('en-IN')}
                          </span>
                          {cust.customerPhone && (
                            <button
                              type="button"
                              onClick={() => {
                                // Find any bill of this customer
                                const bill = bills.find((b) => b.customerName.toLowerCase() === cust.customerName.toLowerCase());
                                if (bill) shareViaWhatsApp(bill, settings);
                              }}
                              className="p-1 rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                              title="Send Reminder on WhatsApp"
                            >
                              <Share2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bar indicator */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(widthPercent, 5)}%` }}
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>{cust.pendingBillsCount} pending bills</span>
                        <span>Settled: ₹{cust.totalSettled.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue Breakdown Proportions Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
        <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide block">
          {lang === 'hi' ? 'भुगतान माध्यम वितरण (Payment Mode Split)' : 'Payment Method Share'}
        </span>

        {/* Proportional Strip */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${cashPercent}%` }}
            className="bg-emerald-500 h-full"
            title={`Cash: ${cashPercent}%`}
          />
          <div
            style={{ width: `${upiPercent}%` }}
            className="bg-blue-500 h-full"
            title={`UPI: ${upiPercent}%`}
          />
          <div
            style={{ width: `${udharPercent}%` }}
            className="bg-amber-500 h-full"
            title={`Udhar: ${udharPercent}%`}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-600 pt-1">
          <div className="flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Cash ({cashPercent}%)</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>UPI ({upiPercent}%)</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Udhar ({udharPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Top 5 Best-Selling Products */}
      {topProducts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
              {lang === 'hi' ? 'सर्वाधिक बिकने वाले सामान (Top Selling)' : 'Top Selling Products'}
            </span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-2">
            {topProducts.map((p, idx) => {
              const maxRev = topProducts[0].totalRevenue || 1;
              const widthPct = (p.totalRevenue / maxRev) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">
                      {idx + 1}. {p.productName}
                    </span>
                    <span className="font-black text-slate-900">
                      ₹{p.totalRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(widthPct, 4)}%` }}
                      className="bg-emerald-500 h-full rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{p.totalPieces} Ladi sold</span>
                    <span>{p.billCount} bills</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
