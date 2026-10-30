import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  GraduationCap, 
  Phone, 
  AlertCircle, 
  ShoppingBag,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { SlotSelector } from '../components/SlotSelector';
import { 
  apiFetchAppSettings, 
  apiFetchSlotCounts, 
  apiPlaceOrder 
} from '../lib/storage';
import { 
  generatePickupSlots, 
  checkCutoffStatus 
} from '../lib/slotUtils';

export function CheckoutPage({ onBackToMenu, onOrderSuccess, bypassCutoff }) {
  const { cart, totalCount, totalAmount, clearCart } = useCart();

  // Student form state
  const [studentName, setStudentName] = useState(() => localStorage.getItem('last_student_name') || '');
  const [studentClass, setStudentClass] = useState(() => localStorage.getItem('last_student_class') || '');
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem('last_student_phone') || '');
  const [selectedSlot, setSelectedSlot] = useState('');

  // Settings & slot capacity state
  const [settings, setSettings] = useState(null);
  const [ordersBySlot, setOrdersBySlot] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadSlotData() {
      try {
        const [appSettings, slotCounts] = await Promise.all([
          apiFetchAppSettings(),
          apiFetchSlotCounts(),
        ]);
        setSettings(appSettings);
        setOrdersBySlot(slotCounts || {});
      } catch (err) {
        console.error('Failed to load slot capacity', err);
      }
    }
    loadSlotData();
  }, []);

  // Compute slots
  const breakStart = settings?.break_start_time || '12:30';
  const breakEnd = settings?.break_end_time || '13:10';
  const lastPickupTime = settings?.last_pickup_time || '13:00';
  const slotLimit = parseInt(settings?.slot_order_limit || '20', 10);
  const cutoffMins = parseInt(settings?.cutoff_minutes_before_break || '15', 10);

  // Generates 12:30 - 12:35 up to 12:55 - 13:00
  const availableSlots = generatePickupSlots(breakStart, lastPickupTime);

  // Pre-select first available non-full slot if none selected yet
  useEffect(() => {
    if (!selectedSlot && availableSlots.length > 0) {
      const firstAvailable = availableSlots.find(
        (slot) => (ordersBySlot[slot.label] || 0) < slotLimit
      );
      if (firstAvailable) {
        setSelectedSlot(firstAvailable.label);
      }
    }
  }, [availableSlots, ordersBySlot, selectedSlot, slotLimit]);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!studentName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!studentClass.trim()) {
      setErrorMessage('Please enter your class / section (e.g. CSE-3A)');
      return;
    }
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length > 0 && cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number, or leave it blank');
      return;
    }
    if (!selectedSlot) {
      setErrorMessage('Please choose a 5-minute pickup slot');
      return;
    }
    if (cart.length === 0) {
      setErrorMessage('Your cart is empty');
      return;
    }

    // Cutoff check
    const cutoffStatus = checkCutoffStatus(breakStart, cutoffMins, breakEnd, bypassCutoff);
    if (cutoffStatus.isClosed) {
      setErrorMessage(cutoffStatus.message);
      return;
    }

    // Save details locally for student's convenience on next orders
    localStorage.setItem('last_student_name', studentName.trim());
    localStorage.setItem('last_student_class', studentClass.trim());
    localStorage.setItem('last_student_phone', cleanPhone);

    try {
      setIsSubmitting(true);
      // Place order in local storage
      const result = await apiPlaceOrder({
        student_name: studentName.trim(),
        student_class: studentClass.trim(),
        phone_number: cleanPhone,
        pickup_slot: selectedSlot,
        items: cart,
      });

      // Clear the cart upon successful placement
      clearCart();

      // Pass created order result to success screen
      onOrderSuccess({
        order_id: result.order_id,
        order_number: result.order_number,
        pickup_slot: result.pickup_slot,
        student_name: studentName.trim(),
        student_class: studentClass.trim(),
        phone_number: cleanPhone,
        total_amount: totalAmount,
        items: [...cart],
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Order placement failed:', err);
      setErrorMessage(err.message || 'Unable to place order. Slot may have just filled up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 pb-28">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>
        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
          Step 2 of 2
        </span>
      </div>

      <h1 className="text-xl font-black text-slate-900 tracking-tight mb-1">
        Choose Pickup Slot & Details
      </h1>
      <p className="text-xs text-slate-500 mb-4">
        Skip the 6th floor rush by arriving during your exact 5-minute window.
      </p>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-red-900">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="space-y-5">
        {/* Step A: Slot Selection */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs">
          <SlotSelector
            slots={availableSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            ordersBySlot={ordersBySlot}
            slotLimit={slotLimit}
          />
        </section>

        {/* Step B: Student Details */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-orange-600" />
            Student Information
          </h2>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Class / Section <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE-3B"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Phone <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Optional 10-digit #"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step C: Order Summary */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
              Order Items ({totalCount})
            </h2>
            <button
              type="button"
              onClick={onBackToMenu}
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              Edit items
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {cart.map((item) => (
              <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-md">
                    {item.quantity}x
                  </span>
                  <span className="font-semibold text-slate-800">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Total to Pay at Pickup:</span>
            <span className="text-base font-black text-slate-900">₹{totalAmount}</span>
          </div>
        </section>

        {/* Payment Method Notice */}
        <div className="bg-slate-100/90 rounded-2xl p-3 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">💵</span>
            <div>
              <p className="font-bold">Pay at Pickup (UPI or Cash)</p>
              <p className="text-[11px] text-slate-500">Show order # at 6th floor Counter 1</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            No advance fee
          </span>
        </div>

        {/* Submit Order Button */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedSlot}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
            isSubmitting || !selectedSlot
              ? 'bg-slate-400 cursor-not-allowed shadow-none'
              : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Reserving your pickup slot...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Confirm Order & Slot ({selectedSlot || 'Select Slot'})</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
