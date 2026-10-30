import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Sparkles, 
  ArrowRight, 
  AlertTriangle, 
  Info,
  RefreshCw,
  Search
} from 'lucide-react';
import { MenuItemCard } from '../components/MenuItemCard';
import { useCart } from '../context/CartContext';
import { apiFetchMenuItems, apiFetchAppSettings } from '../lib/storage';
import { checkCutoffStatus, formatTime12, timeStrToMinutes } from '../lib/slotUtils';

export function MenuPage({ onGoToCheckout, bypassCutoff, onToggleBypassCutoff }) {
  const { totalCount, totalAmount } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Load menu and settings
  const loadData = async () => {
    try {
      setLoading(true);
      const [items, appSettings] = await Promise.all([
        apiFetchMenuItems(),
        apiFetchAppSettings(),
      ]);
      setMenuItems(items);
      setSettings(appSettings);
    } catch (err) {
      console.error('Failed to load menu data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute cutoff state
  const breakStart = settings?.break_start_time || '12:30';
  const breakEnd = settings?.break_end_time || '13:10';
  const cutoffMins = parseInt(settings?.cutoff_minutes_before_break || '15', 10);
  const cutoffStatus = checkCutoffStatus(breakStart, cutoffMins, breakEnd, bypassCutoff);

  // Derive categories
  const categories = ['All', ...new Set(menuItems.map((i) => i.category).filter(Boolean))];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const breakMins = timeStrToMinutes(breakStart);
  const formattedBreakTime = formatTime12(Math.floor(breakMins / 60), breakMins % 60);

  return (
    <div className="pb-28">
      {/* Canteen Header & Cutoff Notification */}
      <section className="bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent pt-4 pb-3 px-4">
        <div className="max-w-md mx-auto space-y-3">
          {/* Main Info Card */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-orange-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pre-Order for Today's Break</span>
              </div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                Lunch: {formattedBreakTime} – 1:10 PM
              </h1>
              <p className="text-xs text-slate-500">
                Pick up at 6th Floor Canteen Counter without waiting
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-orange-600">40m</span>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Break window</p>
            </div>
          </div>

          {/* Cutoff Status Alert */}
          <div
            className={`rounded-2xl p-3 flex items-start gap-2.5 text-xs border ${
              cutoffStatus.isClosed
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {cutoffStatus.isClosed ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{cutoffStatus.message}</p>
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-amber-200/50">
                <span className="text-[11px] opacity-75">
                  Cutoff: {cutoffMins} mins before {formattedBreakTime} (IST)
                </span>
                {/* Dev bypass toggle rendered ONLY during local development */}
                {import.meta.env.DEV && (
                  <button
                    type="button"
                    onClick={onToggleBypassCutoff}
                    className="text-[10px] font-bold underline text-slate-600 hover:text-orange-700"
                  >
                    {bypassCutoff ? 'Strict Mode (IST)' : '🧪 Dev Override'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Categories Bar */}
      <section className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 py-2.5 px-4">
        <div className="max-w-md mx-auto space-y-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search samosa, maggi, coffee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 border-none"
            />
          </div>

          {/* Horizontal category chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-orange-600 text-white shadow-xs shadow-orange-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Items List */}
      <main className="max-w-md mx-auto px-4 mt-3 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
            <span className="text-xs font-medium">Fetching today's menu...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
            <p className="text-2xl">🍽️</p>
            <p className="font-bold text-sm text-slate-800">No items found</p>
            <p className="text-xs text-slate-400">Try changing your search or category filter</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))
        )}

        {/* Payment Policy Tip */}
        <div className="bg-orange-50/70 rounded-2xl p-3 border border-orange-200/50 flex items-start gap-2.5 text-xs text-orange-900 mt-4">
          <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-bold">Pay at Pickup:</strong> Pay via UPI or Cash directly at Counter 1 when collecting your hot food.
          </p>
        </div>
      </main>

      {/* Sticky Bottom Checkout Bar (Active when items are in cart) */}
      {totalCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-lg font-black text-slate-900">₹{totalAmount}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Cash/UPI at pickup</p>
            </div>

            <button
              type="button"
              onClick={onGoToCheckout}
              disabled={cutoffStatus.isClosed}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white shadow-md transition-all active:scale-95 ${
                cutoffStatus.isClosed
                  ? 'bg-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'
              }`}
            >
              <span>{cutoffStatus.isClosed ? 'Ordering Closed' : 'Select Slot & Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
