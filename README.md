# 🍱 LunchLine / QuickBite — College Canteen Pre-Ordering System

A fast, mobile-first web app designed for college campuses where students have a shared lunch break. Students can pre-order from their classrooms and collect their hot meals in a designated 5-minute pickup slot without standing in queues. Canteen staff manage live kitchen tallies and orders from a real-time dashboard.

---

## 💾 Local Storage Mode (Zero Configuration Required)

All application data is stored directly in your browser's **`localStorage`**:
- **Menu Items:** Initialized automatically with staple canteen items; availability can be toggled by staff.
- **Orders & Pickup Slots:** Enforces slot capacity and assigns daily reset order numbers (#01, #02, etc.).
- **Kitchen Status Updates:** Real-time sync across tabs using browser storage events and custom events.
- **Canteen Settings:** Configurable slot order limits, cutoff times, and lunch timing.
- **Staff Access:** Protected by 6-digit staff PIN (Default: `123456`).

---

## 🕒 Timing Configuration (IST - Asia/Kolkata)

- **Lunch Break Starts:** 12:30 PM IST
- **Classes Resume:** 1:10 PM IST (40-minute break window)
- **Last Pickup Slot:** 12:55 PM – 1:00 PM (`last_pickup_time = '13:00'`)
- **Pre-Order Cutoff:** 15 minutes before the break starts (strictly shuts off at 12:15 PM IST)
- **Slot Limit:** Configurable maximum orders per 5-minute slot (default: 20)

---

## 🛠️ Local Development & Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start local development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.
   *(During local development, the app includes a dev toggle to test order placement outside break hours).*

---

## 🔐 Staff Access

- Tap the **Staff** button in the header.
- Enter the 6-digit PIN: **`123456`**.
- From the staff dashboard, you can track orders by 5-minute slots, view the kitchen prep tally, toggle item availability, adjust slot limits, or reset today's orders.
