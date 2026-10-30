<div align="center">

# 🍱 QuickBite / LunchLine
### College Canteen Pre-Ordering & Queue-Elimination System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-quickbite--orpin--tau.vercel.app-ff5722?style=for-the-badge&logo=vercel&logoColor=white)](https://quickbite-orpin-tau.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-quickbite-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/shrinidhirk0306-ui/quickbite)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)]()

**A fast, mobile-first campus food ordering application designed to solve peak lunch-hour stampedes.**  
Students pre-order fresh meals from their classrooms and pick them up during their designated **5-minute window** without waiting in long queues.

👉 **[Launch Live Web Application](https://quickbite-orpin-tau.vercel.app/)** 👈

---

</div>

## 🌐 Live Deployment

| Attribute | Details |
| :--- | :--- |
| **Production URL** | 🚀 **[https://quickbite-orpin-tau.vercel.app/](https://quickbite-orpin-tau.vercel.app/)** |
| **Hosting Platform** | [Vercel](https://vercel.com/) |
| **Repository** | [github.com/shrinidhirk0306-ui/quickbite](https://github.com/shrinidhirk0306-ui/quickbite) |
| **Backend / Storage** | 100% In-Browser `localStorage` with reactive cross-tab event sync (Zero config required) |
| **Default Staff PIN** | `123456` |

---

## 🎯 The Problem & Our Solution

- **The Problem:** 1,000+ students rush to the 6th-floor canteen simultaneously during a 40-minute break (12:30 PM – 1:10 PM). Canteen counters get congested, orders get delayed, and students spend half their break waiting in lines.
- **The Solution:** Students order from their phones before the cutoff. Each student selects an exact **5-minute pickup slot** (e.g., 12:35 PM – 12:40 PM). Canteen staff prepare food ahead of time according to the aggregated kitchen tally. Students walk up, show their digital order number, pay via cash or UPI, and grab their hot meal instantly.

---

## ✨ Features

### 👨‍🎓 For Students
- **Smart 5-Minute Slots:** Select an available pickup slot with real-time capacity meters. Slots that hit the capacity ceiling are automatically marked **FULL**.
- **Digital Canteen Ticket:** Generates an easy-to-read order badge (`#01`, `#02`, etc.) resetting every morning.
- **Live Kitchen Status Stepper:** Real-time progression indicators:
  - 🍳 `Preparing in Kitchen`
  - 🔔 `Ready for Pickup!`
  - ✅ `Picked Up`
- **Instant Share & Copy:** 1-tap copy of the order ticket with student name, class, slot, and live tracking link.
- **Zero Payment Friction:** "Pay at Pickup" policy (UPI QR or Cash at Counter 1) with no credit card or advance fee needed.
- **Auto-saved Details:** Remembers student name, section, and contact number for quick 10-second repeat orders.

### 🧑‍🍳 For Canteen Staff & Kitchen
- **Protected Access Desk:** Dedicated staff portal unlocked with a 6-digit numeric PIN (**Default:** `123456`).
- **Slot-by-Slot Board:** Orders grouped into distinct 5-minute time intervals, highlighting the currently active break slot.
- **Live Kitchen Prep Tally:** Aggregate count of every menu item currently marked as *Preparing*, allowing cooks to batch-prepare without missing items.
- **Dynamic Slot Reallocation:** Cancelling an order or marking an uncollected order as **No-Show** automatically restores capacity to that 5-minute slot.
- **Live Inventory Controls:** 1-tap toggle to mark menu items **Available 🟢** or **Sold Out 🔴**.
- **Configurable Limits:** Adjust slot order limits (e.g., 20 orders/slot), pre-order cutoff buffers, and last pickup times directly from the dashboard.
- **Reset Shift Utility:** Clear today's test orders anytime to start fresh.

---

## 🕒 Campus Timing & Cutoff Matrix (IST)

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Break Starts** | `12:30 PM IST` | Official lunchtime bell rings |
| **Classes Resume** | `1:10 PM IST` | 40-minute total campus break duration |
| **Last Pickup Slot** | `12:55 PM – 1:00 PM` | Final slot window before classes resume |
| **Pre-Order Cutoff** | `15 Mins Before Break` | Orders strictly close at `12:15 PM IST` |
| **Slot Intervals** | `5 Minutes` | 12:30–12:35, 12:35–12:40, 12:40–12:45, etc. |
| **Slot Limit** | `20 orders / slot` | Configurable per kitchen capacity |

> **Note for Testing:** During local development and testing, an optional **Dev Override** toggle allows testing slot bookings outside normal canteen hours.

---

## 💾 Local Storage Architecture

QuickBite runs with **zero cloud database configuration**:
- **Menu Items (`quickbite_menu_items`)**: Seeded with classic canteen favorites (Sandwiches, Samosas, Burgers, Maggi, Cold Coffee, Chai) and updated dynamically.
- **Settings (`quickbite_app_settings`)**: Stores operational parameters.
- **Orders (`quickbite_orders`)**: Persisted locally with slot capacity locks, daily resetting sequence numbering, and secret student lookup tokens.
- **Reactive Multi-Tab Sync**: Uses standard DOM `CustomEvent` for instant same-tab rendering and the browser `storage` API to synchronize changes across different tabs or windows in real time.

---

## 📁 Project Structure

```text
Quickbite/
├── public/                 # Static assets & icons
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/             # Brand images and SVGs
│   ├── components/         # Reusable presentation components
│   │   ├── MenuItemCard.jsx
│   │   ├── Navbar.jsx
│   │   └── SlotSelector.jsx
│   ├── context/            # React context for state
│   │   └── CartContext.jsx
│   ├── data/               # Default seeds & menu items
│   │   └── mockData.js
│   ├── lib/                # Core utilities & storage layer
│   │   ├── slotUtils.js    # IST time & 5-min slot generator
│   │   └── storage.js      # LocalStorage data access & event sync
│   ├── pages/              # Application views
│   │   ├── MenuPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── OrderSuccess.jsx
│   │   ├── StaffAuthModal.jsx
│   │   └── StaffDashboard.jsx
│   ├── App.jsx             # Main view router
│   ├── main.jsx            # React root mount
│   └── index.css           # Tailwind CSS styles
├── index.html              # HTML shell with Open Graph meta tags
├── package.json
├── vercel.json             # Vercel SPA routing configuration
└── vite.config.js          # Vite build config
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (version 18 or newer)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shrinidhirk0306-ui/quickbite.git
   cd quickbite
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```text
   http://localhost:5173
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🔒 Staff Access Credentials

| Credential | Value |
| :--- | :--- |
| **Portal Location** | Click the **Staff** button in the header |
| **Default 6-Digit PIN** | `123456` |
| **Permissions** | Live order management, kitchen prep queue, slot limits, stock toggles |

---

## 🚢 Deployment

The project is pre-configured for **[Vercel](https://vercel.com)**:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Framework:** `Vite`
- **Routing:** Supported via [`vercel.json`](./vercel.json) rewrites.

Live URL: **[https://quickbite-orpin-tau.vercel.app/](https://quickbite-orpin-tau.vercel.app/)**

---

<div align="center">

Built with ❤️ for hassle-free college lunch breaks.  
© 2026 [QuickBite](https://quickbite-orpin-tau.vercel.app/) — Created by [shrinidhirk0306-ui](https://github.com/shrinidhirk0306-ui)

</div>
