import { INITIAL_MENU_ITEMS, DEFAULT_APP_SETTINGS } from '../data/mockData';
import { getISTDateString } from './slotUtils';

/**
 * Local Storage Data Access Layer for QuickBite
 * Replaces Supabase backend with 100% in-browser, persistent LocalStorage.
 * Supports cross-tab and in-tab live updates via storage & custom events.
 */

const STORAGE_KEYS = {
  MENU_ITEMS: 'quickbite_menu_items',
  APP_SETTINGS: 'quickbite_app_settings',
  ORDERS: 'quickbite_orders',
  STAFF_PIN: 'quickbite_staff_pin',
};

const DEFAULT_STAFF_PIN = '123456';

// Helper to notify active views (same-tab custom event & cross-tab storage sync)
function notifyOrderUpdate(payload) {
  try {
    window.dispatchEvent(new CustomEvent('quickbite-orders-update', { detail: payload }));
  } catch (e) {
    console.error('Error dispatching update event:', e);
  }
}

// -----------------------------------------------------------------------------
// Storage Readers and Writers
// -----------------------------------------------------------------------------

function getStoredMenuItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
      return INITIAL_MENU_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MENU_ITEMS;
  }
}

function getStoredAppSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(DEFAULT_APP_SETTINGS));
      return DEFAULT_APP_SETTINGS;
    }
    return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

function getStoredOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

function getStoredStaffPin() {
  return localStorage.getItem(STORAGE_KEYS.STAFF_PIN) || DEFAULT_STAFF_PIN;
}

// Compatibility flag
export const isSupabaseConfigured = false;

// -----------------------------------------------------------------------------
// PUBLIC API METHODS
// -----------------------------------------------------------------------------

/**
 * Fetch all menu items
 */
export async function apiFetchMenuItems() {
  return getStoredMenuItems();
}

/**
 * Fetch canteen settings
 */
export async function apiFetchAppSettings() {
  return getStoredAppSettings();
}

/**
 * Fetch aggregated slot order counts for today (active orders only)
 */
export async function apiFetchSlotCounts() {
  const orders = getStoredOrders();
  const today = getISTDateString();
  const countsMap = {};

  orders.forEach((order) => {
    // Only count today's active orders (exclude cancelled & no_show)
    if (
      order.order_date === today &&
      order.status !== 'cancelled' &&
      order.status !== 'no_show'
    ) {
      const slot = order.pickup_slot;
      countsMap[slot] = (countsMap[slot] || 0) + 1;
    }
  });

  return countsMap;
}

/**
 * Staff: Fetch today's orders
 */
export async function apiFetchStaffOrders(staffPin) {
  const validPin = getStoredStaffPin();
  if (String(staffPin).trim() !== String(validPin).trim()) {
    throw new Error('Invalid staff PIN.');
  }

  const orders = getStoredOrders();
  const today = getISTDateString();

  return orders
    .filter((o) => o.order_date === today)
    .sort((a, b) => (b.order_number || 0) - (a.order_number || 0));
}

/**
 * Student: Fetch own order status using order ID
 */
export async function apiFetchStudentOrder(orderId, orderToken) {
  const orders = getStoredOrders();
  const order = orders.find((o) => o.id === orderId || o.order_id === orderId);
  if (!order) {
    throw new Error('Order not found.');
  }
  return order;
}

/**
 * Place an order into local storage
 * Enforces slot order limit, calculates daily reset order number, and broadcasts update
 */
export async function apiPlaceOrder({ student_name, student_class, phone_number, pickup_slot, items }) {
  const orders = getStoredOrders();
  const settings = getStoredAppSettings();
  const today = getISTDateString();

  const slotLimit = parseInt(settings.slot_order_limit || '20', 10);

  // Check current capacity for the requested slot
  const currentSlotOrders = orders.filter(
    (o) =>
      o.order_date === today &&
      o.pickup_slot === pickup_slot &&
      o.status !== 'cancelled' &&
      o.status !== 'no_show'
  );

  if (currentSlotOrders.length >= slotLimit) {
    throw new Error(
      `Slot "${pickup_slot}" is full (maximum ${slotLimit} orders reached). Please select another slot.`
    );
  }

  // Calculate daily sequence number (starts at 1 each day)
  const todayOrders = orders.filter((o) => o.order_date === today);
  const nextOrderNumber =
    todayOrders.length > 0
      ? Math.max(...todayOrders.map((o) => o.order_number || 0)) + 1
      : 1;

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const orderToken = Math.random().toString(36).substring(2, 10);

  const formattedItems = items.map((item) => ({
    id: item.id,
    item_id: item.id,
    name: item.name,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  const totalAmount = formattedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

  const newOrder = {
    id: orderId,
    order_id: orderId,
    order_number: nextOrderNumber,
    order_date: today,
    student_name: student_name.trim(),
    student_class: student_class.trim(),
    phone_number: phone_number || '',
    pickup_slot,
    items: formattedItems,
    order_items: formattedItems,
    total_amount: totalAmount,
    status: 'preparing',
    token: orderToken,
    created_at: new Date().toISOString(),
  };

  orders.push(newOrder);
  saveStoredOrders(orders);
  notifyOrderUpdate({ event: 'INSERT', new: newOrder });

  return newOrder;
}

/**
 * Verify 6-digit Staff PIN against localStorage
 */
export async function apiVerifyStaffPin(pin) {
  const validPin = getStoredStaffPin();
  return String(pin).trim() === String(validPin).trim();
}

/**
 * Staff: Update order status (preparing -> ready -> picked_up -> cancelled -> no_show)
 */
export async function apiUpdateOrderStatus(orderId, newStatus, staffPin) {
  const validPin = getStoredStaffPin();
  if (String(staffPin).trim() !== String(validPin).trim()) {
    throw new Error('Unauthorized');
  }

  const orders = getStoredOrders();
  const orderIndex = orders.findIndex((o) => o.id === orderId || o.order_id === orderId);
  if (orderIndex === -1) {
    throw new Error('Order not found.');
  }

  orders[orderIndex].status = newStatus;
  saveStoredOrders(orders);
  notifyOrderUpdate({ event: 'UPDATE', new: orders[orderIndex] });
  return orders[orderIndex];
}

/**
 * Staff: Toggle sold out for a menu item
 */
export async function apiToggleSoldOut(itemId, isSoldOut, staffPin) {
  const validPin = getStoredStaffPin();
  if (String(staffPin).trim() !== String(validPin).trim()) {
    throw new Error('Unauthorized');
  }

  const items = getStoredMenuItems();
  const itemIndex = items.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    throw new Error('Menu item not found.');
  }

  items[itemIndex].is_sold_out = isSoldOut;
  localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
  notifyOrderUpdate({ event: 'MENU_UPDATE', new: items[itemIndex] });
  return items[itemIndex];
}

/**
 * Staff: Update setting (e.g. slot_order_limit, cutoff_minutes_before_break, last_pickup_time)
 */
export async function apiUpdateSetting(key, value, staffPin) {
  const validPin = getStoredStaffPin();
  if (String(staffPin).trim() !== String(validPin).trim()) {
    throw new Error('Unauthorized');
  }

  const settings = getStoredAppSettings();
  settings[key] = String(value);
  localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
  notifyOrderUpdate({ event: 'SETTINGS_UPDATE', key, value });
  return settings;
}

/**
 * Staff: Reset today's orders (helpful for testing/new day)
 */
export async function apiResetOrders(staffPin) {
  const validPin = getStoredStaffPin();
  if (String(staffPin).trim() !== String(validPin).trim()) {
    throw new Error('Unauthorized');
  }

  const today = getISTDateString();
  const orders = getStoredOrders();
  const remainingOrders = orders.filter((o) => o.order_date !== today);
  saveStoredOrders(remainingOrders);
  notifyOrderUpdate({ event: 'RESET_TODAY' });
  return true;
}

/**
 * Realtime subscription for Orders (in-tab custom event + cross-tab storage listener)
 */
export function subscribeToOrders(onUpdate) {
  const handleCustomEvent = (e) => {
    onUpdate(e.detail || { event: 'UPDATE' });
  };

  const handleStorageEvent = (e) => {
    if (e.key === STORAGE_KEYS.ORDERS || e.key === STORAGE_KEYS.MENU_ITEMS || e.key === STORAGE_KEYS.APP_SETTINGS) {
      onUpdate({ event: 'STORAGE_CHANGE', key: e.key });
    }
  };

  window.addEventListener('quickbite-orders-update', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener('quickbite-orders-update', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
