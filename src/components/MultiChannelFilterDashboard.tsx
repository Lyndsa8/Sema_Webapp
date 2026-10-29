import React from 'react';
import {
  Layers,
  Zap,
  TrendingUp,
  Radio,
  Sparkles,
  MapPin,
  X,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export const CANONICAL_CHANNELS = [
  'Twitter',
  'Zuri',
  'One App',
  'LinkedIn',
  'Web Voice',
  'WhatsApp',
  'Call Center',
  'USSD',
  'Email',
  'Instagram',
] as const;

export const CHANNELS = [
  'All Channels',
  ...CANONICAL_CHANNELS,
] as const;

export const OPERATIONAL_CATEGORIES = [
  'All Categories',
  'Network Outage',
  'Slow Internet',
  'Voice Calls',
  'M-PESA',
  'Fibre',
  'Billing',
  'Coverage',
] as const;

export const LOCATIONS = [
  'All Locations',
  'Ruaka',
  'Nairobi',
  'Kiambu',
  'Mombasa',
  'Nakuru',
  'Kisumu',
  'Eldoret',
  'Nyeri',
] as const;

interface MultiChannelFilterDashboardProps {
  totalCount: number;
  activeTab: 'feed' | 'clusters';
  onSelectTab: (tab: 'feed' | 'clusters') => void;
  priorityRanking: boolean;
  onTogglePriorityRanking: () => void;
  onSimulateInflow: () => void;
  isSimulating?: boolean;

  // Selected filters
  selectedChannel: string;
  onSelectChannel: (channel: string) => void;
  channelCounts: Record<string, number>;

  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;

  selectedLocation: string;
  onSelectLocation: (location: string) => void;
  locationCounts: Record<string, number>;

  onResetLocation: () => void;
}

export const MultiChannelFilterDashboard: React.FC<MultiChannelFilterDashboardProps> = ({
  totalCount,
  activeTab,
  onSelectTab,
  priorityRanking,
  onTogglePriorityRanking,
  onSimulateInflow,
  isSimulating = false,

  selectedChannel,
  onSelectChannel,
  channelCounts,

  selectedCategory,
  onSelectCategory,
  categoryCounts,

  selectedLocation,
  onSelectLocation,
  locationCounts,

  onResetLocation,
}) => {
  return (
    <div className="space-y-3.5">
      {/* 1. Top Bar: Tabs & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab 1: Multi-Channel Feed */}
          <button
            type="button"
            onClick={() => onSelectTab('feed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs border ${
              activeTab === 'feed'
                ? 'bg-white border-slate-200/90 text-slate-900 shadow-2xs'
                : 'bg-slate-100/80 hover:bg-slate-200 border-transparent text-slate-600'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>Multi-Channel Feed</span>
            <span className="px-2 py-0.5 rounded-full text-2xs font-mono font-bold bg-emerald-100 text-emerald-800">
              {totalCount}
            </span>
          </button>

          {/* Tab 2: Issue Clustering (Root Cause) */}
          <button
            type="button"
            onClick={() => onSelectTab('clusters')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === 'clusters'
                ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold shadow-2xs'
                : 'bg-white hover:bg-amber-50/60 border-slate-200/90 text-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>Issue Clustering (Root Cause)</span>
            <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-amber-100/90 text-amber-900 border border-amber-200/80">
              5 clusters · Ruaka (73)
            </span>
          </button>
        </div>

        {/* Right: Ranking & Inflow Stream Action */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onTogglePriorityRanking}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              priorityRanking
                ? 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-400 text-emerald-800'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title="Toggle priority ranking (Urgent first vs timestamp order)"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Priority Ranking: {priorityRanking ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={onSimulateInflow}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#006b52] hover:bg-[#005e46] shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            title="Simulate live incoming multi-channel customer complaint"
          >
            {isSimulating ? (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-200 animate-spin" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
            )}
            <span>Simulate Inflow Stream</span>
          </button>
        </div>
      </div>

      {/* 2. Main Filter Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        {/* Section 1: Channel Aggregation Sources */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
              <Radio className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>CHANNEL AGGREGATION SOURCES:</span>
            </div>
            <p className="text-2xs text-slate-500">
              Aggregating Call Center CRM, Social Media, Zuri, One App, USSD &amp; Email into one unified dashboard
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {CHANNELS.map((channel) => {
              const isSelected = selectedChannel === channel;
              const count = channelCounts[channel] || 0;

              return (
                <button
                  key={channel}
                  type="button"
                  onClick={() => onSelectChannel(channel)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer select-none border ${
                    isSelected
                      ? 'bg-[#005e46] text-white border-[#005e46] font-semibold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/90'
                  }`}
                >
                  <span>{channel}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-emerald-950/40 text-emerald-100' : 'bg-slate-200/90 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: AI Categorization (Automated) */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>AI CATEGORIZATION (AUTOMATED):</span>
            </div>
            <p className="text-2xs text-slate-500">
              AI automatically classifies incoming complaints into 7 operational categories
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {OPERATIONAL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer select-none border ${
                    isSelected
                      ? 'bg-[#005e46] text-white border-[#005e46] font-semibold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/90'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-emerald-950/40 text-emerald-100' : 'bg-slate-200/90 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Incident Location Filter */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>INCIDENT LOCATION FILTER:</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 self-start sm:self-auto">
              <span>Select Town / County:</span>
              <select
                value={selectedLocation}
                onChange={(e) => onSelectLocation(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer min-w-[130px]"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {LOCATIONS.map((loc) => {
              const isSelected = selectedLocation === loc;
              const count = locationCounts[loc] || 0;

              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => onSelectLocation(loc)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer select-none border ${
                    isSelected
                      ? 'bg-[#005e46] text-white border-[#005e46] font-semibold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/90'
                  }`}
                >
                  <MapPin className={`w-3 h-3 shrink-0 ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`} />
                  <span>{loc}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-emerald-950/40 text-emerald-100' : 'bg-slate-200/90 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Active Location Banner */}
        {selectedLocation !== 'All Locations' && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 animate-fadeIn">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                Location Filter Active: <strong className="font-bold">&ldquo;{selectedLocation}&rdquo;</strong>
              </span>
              <span className="text-2xs text-emerald-800">
                (Showing {locationCounts[selectedLocation] || 0} complaints for this area)
              </span>
            </div>

            <button
              type="button"
              onClick={onResetLocation}
              className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 cursor-pointer text-xs"
            >
              <X className="w-3 h-3" />
              <span>Clear Location Filter</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
