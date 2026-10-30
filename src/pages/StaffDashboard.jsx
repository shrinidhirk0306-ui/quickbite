import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  ChefHat, 
  Sliders, 
  Flame, 
  RefreshCw, 
  Ban, 
  AlertCircle
} from 'lucide-react';
import { 
  apiFetchStaffOrders, 
  apiFetchMenuItems, 
  apiFetchAppSettings,
  apiUpdateOrderStatus,
  apiToggleSoldOut,
  apiUpdateSetting,
  subscribeToOrders,
  apiResetOrders
} from '../lib/storage';
import { 
  generatePickupSlots, 
  getISTDate
} from '../lib/slotUtils';

export function StaffDashboard({ staffPin, onExitToStudent }) {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'kitchen' | 'settings'
  const [newSlotLimit, setNewSlotLimit] = useState('20');
  const [newCutoff, setNewCutoff] = useState('15');
  const [newLastPickup, setNewLastPickup] = useState('13:00');
  const [settingFeedback, setSettingFeedback] = useState('');

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [todayOrders, items, appSettings] = await Promise.all([
        apiFetchStaffOrders(staffPin),
        apiFetchMenuItems(),
        apiFetchAppSettings(),
      ]);
      setOrders(todayOrders);
      setMenuItems(items);
      setSettings(appSettings);
      setNewSlotLimit(appSettings.slot_order_limit || '20');
      setNewCutoff(appSettings.cutoff_minutes_before_break || '15');
      setNewLastPickup(appSettings.last_pickup_time || '13:00');
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Setup 5-second polling interval for live board synchronization
    const pollInterval = setInterval(() => {
      loadAllData();
    }, 5000);

    // Setup Realtime Live Subscription
    const unsubscribe = subscribeToOrders(() => {
      loadAllData();
    });

    return () => {
      clearInterval(pollInterval);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [staffPin]);

  const breakStart = settings?.break_start_time || '12:30';
  const lastPickupTime = settings?.last_pickup_time || '13:00';
  const slotLimit = parseInt(settings?.slot_order_limit || '20', 10);
  const slots = generatePickupSlots(breakStart, lastPickupTime);

  // Determine current slot in IST
  const ist = getISTDate();
  const currentISTMinutes = ist.getHours() * 60 + ist.getMinutes();

  // Find slot that matches current time
  const currentSlot = slots.find(
    (s) => currentISTMinutes >= s.startMinutes && currentISTMinutes < s.endMinutes
  );

  // Group active orders by slot (excluding cancelled and no-show for capacity)
  const ordersBySlot = slots.map((slot) => {
    const slotOrders = orders.filter((o) => o.pickup_slot === slot.label);
    const activeSlotOrders = slotOrders.filter(
      (o) => o.status !== 'cancelled' && o.status !== 'no_show'
    );
    return {
      slot,
      orders: slotOrders,
      activeCount: activeSlotOrders.length,
      isCurrent: currentSlot?.id === slot.id,
    };
  });

  // Calculate kitchen prep tally: items needed across upcoming slots
  const itemPrepTally = {};
  orders.forEach((order) => {
    if (order.status === 'preparing') {
      const itemsList = order.order_items || order.items || [];
      itemsList.forEach((it) => {
        const name = it.item_name || it.name;
        itemPrepTally[name] = (itemPrepTally[name] || 0) + (it.quantity || 1);
      });
    }
  });

  // Handle status update
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await apiUpdateOrderStatus(orderId, newStatus, staffPin);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Handle sold out toggle
  const handleToggleSoldOut = async (itemId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await apiToggleSoldOut(itemId, newStatus, staffPin);
      setMenuItems((prev) =>
        prev.map((m) => (m.id === itemId ? { ...m, is_sold_out: newStatus } : m))
      );
    } catch (err) {
      alert('Error toggling sold out: ' + err.message);
    }
  };

  // Handle setting updates
  const handleSaveSlotLimit = async (e) => {
    e.preventDefault();
    try {
      await apiUpdateSetting('slot_order_limit', newSlotLimit, staffPin);
      setSettingFeedback('Slot limit updated to ' + newSlotLimit + ' orders per slot!');
      setTimeout(() => setSettingFeedback(''), 3000);
      setSettings((prev) => ({ ...prev, slot_order_limit: newSlotLimit }));
    } catch (err) {
      alert('Failed to update setting: ' + err.message);
    }
  };

  const handleSaveCutoff = async (e) => {
    e.preventDefault();
    try {
      await apiUpdateSetting('cutoff_minutes_before_break', newCutoff, staffPin);
      setSettingFeedback('Cutoff updated to ' + newCutoff + ' minutes before break!');
      setTimeout(() => setSettingFeedback(''), 3000);
      setSettings((prev) => ({ ...prev, cutoff_minutes_before_break: newCutoff }));
    } catch (err) {
      alert('Failed to update setting: ' + err.message);
    }
  };

  const handleSaveLastPickup = async (e) => {
    e.preventDefault();
    try {
      await apiUpdateSetting('last_pickup_time', newLastPickup, staffPin);
      setSettingFeedback('Last pickup time updated to ' + newLastPickup + '!');
      setTimeout(() => setSettingFeedback(''), 3000);
      setSettings((prev) => ({ ...prev, last_pickup_time: newLastPickup }));
    } catch (err) {
      alert('Failed to update setting: ' + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onExitToStudent}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl active:scale-95 transition-all shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Student View</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Local Storage Active
          </span>
          <button
            onClick={loadAllData}
            title="Refresh"
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 active:rotate-180 transition-transform shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-md mb-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400">
            Canteen Control Desk
          </span>
          <h1 className="text-xl font-black tracking-tight">Orders & Kitchen</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {orders.length} total orders placed today
          </p>
        </div>
        <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-orange-600/30">
          <ChefHat className="w-6 h-6" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-200/80 p-1 rounded-2xl mb-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'orders'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Slots ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kitchen')}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'kitchen'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Kitchen Tally
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Stock & Limits
        </button>
      </div>

      {/* TAB 1: ORDERS GROUPED BY SLOT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {ordersBySlot.map(({ slot, orders: slotOrders, activeCount, isCurrent }) => (
            <div
              key={slot.id}
              className={`rounded-3xl border transition-all ${
                isCurrent
                  ? 'bg-orange-50/60 border-orange-300 ring-2 ring-orange-500/20 shadow-md'
                  : slotOrders.length > 0
                  ? 'bg-white border-slate-200 shadow-xs'
                  : 'bg-white/60 border-slate-200/60 opacity-75'
              }`}
            >
              {/* Slot Header */}
              <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      isCurrent
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block leading-tight">
                      {slot.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                        ● Current Active Slot
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                    activeCount >= slotLimit
                      ? 'bg-red-100 text-red-700'
                      : activeCount > 0
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {activeCount} / {slotLimit} orders
                </span>
              </div>

              {/* Orders inside this slot */}
              <div className="p-3 space-y-3">
                {slotOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 py-1 text-center font-medium">
                    No orders booked for this slot
                  </p>
                ) : (
                  slotOrders.map((ord) => {
                    const orderItemsList = ord.order_items || ord.items || [];
                    const displayNum = String(ord.order_number).padStart(2, '0');
                    const isCancelled = ord.status === 'cancelled';
                    const isNoShow = ord.status === 'no_show';

                    return (
                      <div
                        key={ord.id}
                        className={`rounded-2xl p-3 border space-y-2.5 transition-all ${
                          isCancelled || isNoShow
                            ? 'bg-slate-100/60 border-slate-200 opacity-60'
                            : 'bg-slate-50/90 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-slate-900">
                                #{displayNum}
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {ord.student_name}
                              </span>
                              {isCancelled && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                  Cancelled (Slot Freed)
                                </span>
                              )}
                              {isNoShow && (
                                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                  No-Show (Slot Freed)
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {ord.student_class}{ord.phone_number ? ` · ${ord.phone_number}` : ''}
                            </span>
                          </div>

                          <span className="text-xs font-black text-slate-900">
                            ₹{ord.total_amount}
                          </span>
                        </div>

                        {/* Items ordered */}
                        <div className="bg-white rounded-xl p-2 border border-slate-100 text-xs space-y-1">
                          {orderItemsList.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-slate-700"
                            >
                              <span className="font-semibold">
                                {item.quantity}x {item.item_name || item.name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                ₹{item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Status Change Buttons & Cancel/No-show */}
                        {!isCancelled && !isNoShow ? (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                                  ord.status === 'preparing'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                🍳 Prep
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(ord.id, 'ready')}
                                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                                  ord.status === 'ready'
                                    ? 'bg-orange-600 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                🔔 Ready
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(ord.id, 'picked_up')}
                                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                                  ord.status === 'picked_up'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                ✅ Picked
                              </button>
                            </div>

                            {/* Release slot options */}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Cancel Order #${displayNum} for ${ord.student_name}? This will free up their slot.`)) {
                                    handleUpdateStatus(ord.id, 'cancelled');
                                  }
                                }}
                                className="flex-1 py-1 rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                              >
                                ✕ Cancel Order
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Mark #${displayNum} as No-Show? This will release their slot capacity.`)) {
                                    handleUpdateStatus(ord.id, 'no_show');
                                  }
                                }}
                                className="flex-1 py-1 rounded-lg text-[10px] font-bold text-purple-700 hover:bg-purple-50 border border-purple-200 transition-colors"
                              >
                                🚫 Mark No-Show
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline"
                            >
                              Re-open order
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: KITCHEN PREP TALLY */}
      {activeTab === 'kitchen' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Cook Next Tally:</strong> Aggregated count of each item currently marked as <strong>Preparing</strong> across today's slots.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Items to Cook Now</span>
              <span className="text-orange-600 font-extrabold">Active Queue</span>
            </h2>

            {Object.keys(itemPrepTally).length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <ChefHat className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Kitchen is all caught up!</p>
                <p className="text-[11px]">No pending items in preparing status</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {Object.entries(itemPrepTally).map(([itemName, count]) => (
                  <div key={itemName} className="py-3 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">{itemName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Need:</span>
                      <span className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STOCK & SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Change Slot Limit */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-orange-600" />
              Slot Order Limit
            </h2>
            <p className="text-xs text-slate-500">
              Maximum orders students can place in any single 5-minute slot.
            </p>

            {settingFeedback && (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-2.5 rounded-xl border border-emerald-200 font-semibold">
                {settingFeedback}
              </div>
            )}

            <form onSubmit={handleSaveSlotLimit} className="flex gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={newSlotLimit}
                onChange={(e) => setNewSlotLimit(e.target.value)}
                className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                Save Limit
              </button>
            </form>
          </div>

          {/* Change Pre-order Cutoff & Pickup Times */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              Cutoff & Slot Timing (IST)
            </h2>
            <p className="text-xs text-slate-500">
              Break starts 12:30 PM, classes resume 1:10 PM.
            </p>

            <form onSubmit={handleSaveCutoff} className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-600">
                Cutoff Minutes Before Break (e.g. 15 mins = 12:15 PM)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={newCutoff}
                  onChange={(e) => setNewCutoff(e.target.value)}
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                >
                  Save Cutoff Mins
                </button>
              </div>
            </form>

            <form onSubmit={handleSaveLastPickup} className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-600">
                Last Pickup Time (24h format, e.g. 13:00 for 12:55 - 13:00 slot)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="13:00"
                  value={newLastPickup}
                  onChange={(e) => setNewLastPickup(e.target.value)}
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                >
                  Save Last Slot Time
                </button>
              </div>
            </form>
          </div>

          {/* Sold Out Inventory Toggles */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5 text-orange-600" />
                Menu Availability
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Tap to toggle</span>
            </div>

            <div className="divide-y divide-slate-100">
              {menuItems.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <span className="text-[11px] text-slate-400 font-medium">₹{item.price}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSoldOut(item.id, item.is_sold_out)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      item.is_sold_out
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {item.is_sold_out ? '🔴 Sold Out' : '🟢 Available'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Today's Orders (Local Storage Utility) */}
          <div className="bg-white rounded-3xl p-4 border border-red-200/80 shadow-xs space-y-2">
            <h2 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              Reset Local Storage Orders
            </h2>
            <p className="text-xs text-slate-500">
              Clear all orders placed today in local storage to start a clean shift or test again.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("Are you sure you want to clear today's orders in Local Storage?")) {
                  try {
                    await apiResetOrders(staffPin);
                    await loadAllData();
                    alert("Today's orders have been cleared.");
                  } catch (e) {
                    alert('Error: ' + e.message);
                  }
                }
              }}
              className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors active:scale-95"
            >
              🗑️ Clear Today's Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
