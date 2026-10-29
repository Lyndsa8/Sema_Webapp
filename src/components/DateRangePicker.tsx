import React, { useState, useRef, useEffect } from 'react';
import { Calendar, CalendarRange, X, ChevronDown, Check } from 'lucide-react';

export type DateRangePreset = 'all' | 'today' | 'yesterday' | '24h' | '7d' | '30d' | 'custom';

export interface DateRangeValue {
  preset: DateRangePreset;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (val: DateRangeValue) => void;
  className?: string;
}

const PRESET_OPTIONS: { id: DateRangePreset; label: string; desc: string }[] = [
  { id: 'all', label: 'All Dates', desc: 'Show all historical incidents' },
  { id: 'today', label: 'Today', desc: 'Created since 00:00 today' },
  { id: 'yesterday', label: 'Yesterday', desc: 'Created yesterday' },
  { id: '24h', label: 'Past 24 Hours', desc: 'Rolling last 24 hours' },
  { id: '7d', label: 'Past 7 Days', desc: 'Last 7 calendar days' },
  { id: '30d', label: 'Past 30 Days', desc: 'Last 30 calendar days' },
  { id: 'custom', label: 'Custom Range', desc: 'Pick custom start and end date' },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectPreset = (preset: DateRangePreset) => {
    const today = new Date();
    const toYMD = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === 'all') {
      onChange({ preset: 'all', startDate: '', endDate: '' });
      setIsOpen(false);
      return;
    }

    if (preset === 'today') {
      const ymd = toYMD(today);
      onChange({ preset: 'today', startDate: ymd, endDate: ymd });
      setIsOpen(false);
      return;
    }

    if (preset === 'yesterday') {
      const yest = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const ymd = toYMD(yest);
      onChange({ preset: 'yesterday', startDate: ymd, endDate: ymd });
      setIsOpen(false);
      return;
    }

    if (preset === '24h') {
      const start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      onChange({ preset: '24h', startDate: toYMD(start), endDate: toYMD(today) });
      setIsOpen(false);
      return;
    }

    if (preset === '7d') {
      const start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      onChange({ preset: '7d', startDate: toYMD(start), endDate: toYMD(today) });
      setIsOpen(false);
      return;
    }

    if (preset === '30d') {
      const start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      onChange({ preset: '30d', startDate: toYMD(start), endDate: toYMD(today) });
      setIsOpen(false);
      return;
    }

    if (preset === 'custom') {
      onChange({
        preset: 'custom',
        startDate: value.startDate || toYMD(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
        endDate: value.endDate || toYMD(today),
      });
    }
  };

  const isFiltered = value.preset !== 'all' || Boolean(value.startDate) || Boolean(value.endDate);

  const getButtonLabel = (): string => {
    if (value.preset === 'today') return 'Today';
    if (value.preset === 'yesterday') return 'Yesterday';
    if (value.preset === '24h') return 'Past 24h';
    if (value.preset === '7d') return 'Past 7 days';
    if (value.preset === '30d') return 'Past 30 days';
    if (value.startDate && value.endDate) {
      if (value.startDate === value.endDate) return value.startDate;
      return `${value.startDate} → ${value.endDate}`;
    }
    if (value.startDate) return `From ${value.startDate}`;
    if (value.endDate) return `Until ${value.endDate}`;
    return 'Date Filter';
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`h-8 px-2.5 text-xs font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
            isFiltered
              ? 'bg-emerald-50 text-emerald-900 border-emerald-400 font-semibold ring-1 ring-emerald-300'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
          title="Filter visible incidents by date range"
        >
          <CalendarRange className={`w-3.5 h-3.5 ${isFiltered ? 'text-emerald-700' : 'text-slate-500'}`} />
          <span className="truncate max-w-[140px] sm:max-w-[190px]">{getButtonLabel()}</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isFiltered && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ preset: 'all', startDate: '', endDate: '' });
            }}
            className="p-1 -ml-6 mr-1 z-10 text-slate-400 hover:text-rose-600 cursor-pointer rounded-full"
            title="Clear date filter"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-76 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 space-y-3 text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Filter by Date Range</span>
            </div>
            {isFiltered && (
              <button
                type="button"
                onClick={() => handleSelectPreset('all')}
                className="text-2xs font-semibold text-rose-600 hover:text-rose-800 underline cursor-pointer"
              >
                Reset to all
              </button>
            )}
          </div>

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_OPTIONS.map((opt) => {
              const isSelected = value.preset === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectPreset(opt.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer flex items-center justify-between border ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                      : 'bg-slate-50/60 hover:bg-slate-100 text-slate-700 border-slate-200/70 font-medium'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3 h-3 text-emerald-700 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Pickers */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              Custom Date Boundaries
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={value.startDate}
                  onChange={(e) => {
                    onChange({
                      preset: 'custom',
                      startDate: e.target.value,
                      endDate: value.endDate,
                    });
                  }}
                  className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={value.endDate}
                  onChange={(e) => {
                    onChange({
                      preset: 'custom',
                      startDate: value.startDate,
                      endDate: e.target.value,
                    });
                  }}
                  className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 truncate">
              {isFiltered ? getButtonLabel() : 'Showing all dates'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
