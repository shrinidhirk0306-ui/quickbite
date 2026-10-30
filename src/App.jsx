import React, { useState } from 'react';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { MenuPage } from './pages/MenuPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccess } from './pages/OrderSuccess';
import { StaffAuthModal } from './pages/StaffAuthModal';
import { StaffDashboard } from './pages/StaffDashboard';

export default function App() {
  // Navigation state: 'menu' | 'checkout' | 'success' | 'staff'
  const [currentPage, setCurrentPage] = useState('menu');
  const [activeOrder, setActiveOrder] = useState(null);

  // Staff Authentication state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffPin, setStaffPin] = useState(null);

  // In production builds, cutoff is ALWAYS strictly enforced (no bypass).
  // In development (import.meta.env.DEV), allow testing outside canteen hours.
  const [bypassCutoff, setBypassCutoff] = useState(() => Boolean(import.meta.env.DEV));

  const handleOrderSuccess = (orderData) => {
    setActiveOrder(orderData);
    setCurrentPage('success');
  };

  const handleStaffLoginSuccess = (verifiedPin) => {
    setStaffPin(verifiedPin);
    setCurrentPage('staff');
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
        {/* Navigation Bar (hidden in staff mode for full dashboard focus) */}
        {currentPage !== 'staff' && (
          <Navbar
            currentPage={currentPage}
            onNavigate={(page) => setCurrentPage(page)}
            onOpenStaffLogin={() => setIsStaffModalOpen(true)}
          />
        )}

        {/* Page Routing */}
        {currentPage === 'menu' && (
          <MenuPage
            onGoToCheckout={() => setCurrentPage('checkout')}
            bypassCutoff={bypassCutoff}
            onToggleBypassCutoff={() => setBypassCutoff((prev) => !prev)}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            onBackToMenu={() => setCurrentPage('menu')}
            onOrderSuccess={handleOrderSuccess}
            bypassCutoff={bypassCutoff}
          />
        )}

        {currentPage === 'success' && (
          <OrderSuccess
            order={activeOrder}
            onOrderAnother={() => setCurrentPage('menu')}
          />
        )}

        {currentPage === 'staff' && (
          <StaffDashboard
            staffPin={staffPin}
            onExitToStudent={() => setCurrentPage('menu')}
          />
        )}

        {/* PIN Security Modal for Staff */}
        <StaffAuthModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          onSuccess={handleStaffLoginSuccess}
        />
      </div>
    </CartProvider>
  );
}
