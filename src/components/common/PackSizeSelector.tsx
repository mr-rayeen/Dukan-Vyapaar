import React, { useState } from 'react';
import { STANDARD_PACK_SIZES } from '../../utils/stockLogic';
import { Package, Lock, Edit2 } from 'lucide-react';

interface PackSizeSelectorProps {
  value: number;
  onChange: (newSize: number) => void;
  isLocked?: boolean;
  onUnlock?: () => void;
  label?: string;
  showHelper?: boolean;
  required?: boolean;
}

export const PackSizeSelector: React.FC<PackSizeSelectorProps> = ({
  value,
  onChange,
  isLocked = false,
  onUnlock,
  label = 'Pack Size (1 Box = ? Ladi)',
  showHelper = true,
  required = true,
}) => {
  const isPreset = STANDARD_PACK_SIZES.includes(value);
  const [isCustomMode, setIsCustomMode] = useState(!isPreset && value > 0);
  const [customValue, setCustomValue] = useState(isPreset ? '' : String(value || ''));

  if (isLocked) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Pack Size (Saved)
              </span>
              <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded">
                Master Locked
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              1 Box ={' '}
              <span className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2">
                {value} Ladi
              </span>
            </div>
          </div>
        </div>

        {onUnlock && (
          <button
            type="button"
            onClick={onUnlock}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition"
            title="Edit pack size in master"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
            <span>Edit</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          1 Box = {value || 0} Ladi
        </span>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-5 gap-1.5">
        {STANDARD_PACK_SIZES.slice(0, 5).map((size) => {
          const isSelected = !isCustomMode && value === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => {
                setIsCustomMode(false);
                onChange(size);
              }}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition flex flex-col items-center justify-center active:scale-95 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600 ring-offset-1 dark:ring-offset-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>{size} Ladi</span>
              <span
                className={`text-[9px] font-normal ${
                  isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'
                }`}
              >
                1 Box
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
        {STANDARD_PACK_SIZES.slice(5).map((size) => {
          const isSelected = !isCustomMode && value === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => {
                setIsCustomMode(false);
                onChange(size);
              }}
              className={`py-1.5 px-1 text-center rounded-lg text-xs font-bold transition active:scale-95 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {size} Ladi
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            setIsCustomMode(true);
            if (customValue) onChange(Number(customValue));
          }}
          className={`py-1.5 px-2 text-center rounded-lg text-xs font-bold transition active:scale-95 ${
            isCustomMode
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/60'
          }`}
        >
          Custom...
        </button>
      </div>

      {/* Custom Pack Size Input Box */}
      {isCustomMode && (
        <div className="pt-1 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              min="1"
              max="5000"
              placeholder="Enter ladi in 1 box (e.g. 12, 24)"
              value={customValue}
              onChange={(e) => {
                const val = e.target.value;
                setCustomValue(val);
                if (val && Number(val) > 0) {
                  onChange(Number(val));
                }
              }}
              className="w-full bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              autoFocus
            />
            <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
              Ladi / Box
            </span>
          </div>
        </div>
      )}

      {showHelper && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
          💡 <span className="font-medium text-slate-700 dark:text-slate-300">Stock Logic:</span> Stock is saved in total ladi, but shown as <strong className="text-emerald-700 dark:text-emerald-400">Box + Loose Ladi (बॉक्स + लड़ी)</strong> in all bills.
        </p>
      )}
    </div>
  );
};
