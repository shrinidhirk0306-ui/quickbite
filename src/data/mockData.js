/**
 * Seed & Fallback Mock Data for LunchLine
 * 8 College Canteen staples with prices, descriptions, and categories.
 */

export const INITIAL_MENU_ITEMS = [
  {
    id: 'item-1',
    name: 'Veg Cheese Sandwich',
    description: 'Fresh grilled brown bread with cheddar, cucumber, tomatoes & mint chutney',
    price: 50,
    category: 'Sandwiches',
    is_sold_out: false,
    image_url: '🥪',
  },
  {
    id: 'item-2',
    name: 'Crispy Samosa (2 pcs)',
    description: 'Golden fried crispy pastry stuffed with spiced potatoes & peas + tamarind dip',
    price: 30,
    category: 'Snacks',
    is_sold_out: false,
    image_url: '🥟',
  },
  {
    id: 'item-3',
    name: 'Aloo Tikki Burger',
    description: 'Crisp spiced potato patty, crunchy shredded cabbage, tomato & creamy mayo',
    price: 45,
    category: 'Burgers',
    is_sold_out: false,
    image_url: '🍔',
  },
  {
    id: 'item-4',
    name: 'Special Veg Fried Rice',
    description: 'Wok-tossed aromatic basmati rice with spring onions, carrots & bell peppers',
    price: 70,
    category: 'Meals',
    is_sold_out: false,
    image_url: '🍚',
  },
  {
    id: 'item-5',
    name: 'Canteen Masala Maggi',
    description: 'Double masala soupy noodles with butter, sweet corn & diced green peppers',
    price: 35,
    category: 'Snacks',
    is_sold_out: false,
    image_url: '🍜',
  },
  {
    id: 'item-6',
    name: 'Pav Bhaji (2 Pav)',
    description: 'Mashed spicy mixed vegetable curry tossed in butter, served with 2 warm pavs',
    price: 60,
    category: 'Meals',
    is_sold_out: false,
    image_url: '🍛',
  },
  {
    id: 'item-7',
    name: 'Thick Cold Coffee',
    description: 'Chilled creamy blended espresso milk topped with chocolate sauce',
    price: 40,
    category: 'Beverages',
    is_sold_out: false,
    image_url: '🥤',
  },
  {
    id: 'item-8',
    name: 'Ginger Masala Chai',
    description: 'Freshly pounded ginger and cardamom boiled with full-cream milk',
    price: 15,
    category: 'Beverages',
    is_sold_out: false,
    image_url: '☕',
  },
];

export const DEFAULT_APP_SETTINGS = {
  break_start_time: '12:30',
  break_end_time: '13:10', // Classes resume at 1:10 PM
  last_pickup_time: '13:00', // Last slot ends at 1:00 PM (12:55 - 13:00)
  cutoff_minutes_before_break: '15', // Pre-orders close at 12:15 PM
  slot_order_limit: '20',
};
