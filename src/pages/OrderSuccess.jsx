import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ChefHat, 
  BellRing, 
  CheckCheck, 
  ArrowLeft,
  Copy
} from 'lucide-react';
import { subscribeToOrders, apiFetchStudentOrder } from '../lib/storage';

export function OrderSuccess({ order, onOrderAnother }) {
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'preparing');
  const [copied, setCopied] = useState(false);

  const isTerminalStatus = ['picked_up', 'cancelled', 'no_show'].includes(currentStatus);

  // Poll every 10s for status updates (authorized via student's secret token)
  // Stops polling once order reaches terminal status ('picked_up', 'cancelled', 'no_show')
  useEffect(() => {
    if (!order || isTerminalStatus) return;
    const targetId = order.order_id || order.id;
    const token = order.token;

    const checkStatus = async () => {
      try {
        const updated = await apiFetchStudentOrder(targetId, token);
        if (updated && updated.status && updated.status !== currentStatus) {
          setCurrentStatus(updated.status);
        }
      } catch (e) {
        console.error('Failed to poll order status', e);
      }
    };

    // Initial check
    checkStatus();

    // 10-second active poll interval (stops automatically when terminal status is reached)
    const pollInterval = setInterval(checkStatus, 10000);

    // Also listen to storage events in local fallback mode
    const unsubscribe = subscribeToOrders(() => {
      checkStatus();
    });

    return () => {
      clearInterval(pollInterval);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [order, currentStatus, isTerminalStatus]);

  if (!order) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-sm text-slate-500">No active order found.</p>
        <button
          onClick={onOrderAnother}
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  // Format order number with leading zeros (e.g. #01, #02)
  const displayOrderNum = String(order.order_number).padStart(2, '0');

  const steps = [
    { key: 'preparing', label: 'Preparing in Kitchen', icon: ChefHat },
    { key: 'ready', label: 'Ready for Pickup!', icon: BellRing },
    { key: 'picked_up', label: 'Picked Up', icon: CheckCheck },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStatus);

  const handleCopyTicket = () => {
    const text = `LunchLine Order #${displayOrderNum} | Slot: ${order.pickup_slot} | ${order.student_name} (${order.student_class})\nPickup & Track: https://quickbite-orpin-tau.vercel.app/`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24 space-y-4">
      {/* Top success badge */}
      <div className="text-center space-y-1">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Confirmed!</h1>
        <p className="text-xs text-slate-500 font-medium">
          Your food will be packed and ready in your slot
        </p>
      </div>

      {/* Main Digital Canteen Ticket */}
      <div className="bg-white rounded-3xl border-2 border-orange-200 shadow-md overflow-hidden relative">
        {/* Decorative Ticket Header Notch */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-4 text-white text-center relative">
          <p className="text-[11px] font-bold uppercase tracking-widest text-orange-100">
            Canteen Pickup Ticket
          </p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-4xl font-black tracking-tight drop-shadow-xs">
              #{displayOrderNum}
            </span>
          </div>
          <span className="text-xs font-semibold bg-white/20 px-3 py-0.5 rounded-full mt-1 inline-block">
            Today's Order Reset
          </span>
        </div>

        {/* Pickup Slot Highlight */}
        <div className="p-4 bg-orange-50/70 border-b border-dashed border-orange-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-orange-950 uppercase tracking-wider">
                Your Pickup Slot
              </p>
              <p className="text-base font-black text-slate-900">{order.pickup_slot}</p>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-white text-orange-700 border border-orange-200 px-2.5 py-1 rounded-xl shadow-2xs">
            5 Min Window
          </span>
        </div>

        {/* Live Order Status Stepper */}
        <div className="p-4 bg-white border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">Kitchen Live Status</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              {!isTerminalStatus && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              {isTerminalStatus ? 'Final Status' : 'Live Sync (10s)'}
            </span>
          </div>

          {currentStatus === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-800 font-semibold">
              ❌ This order was cancelled by canteen staff. Slot has been freed.
            </div>
          )}

          {currentStatus === 'no_show' && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 text-xs text-purple-800 font-semibold">
              🚫 Marked as No-Show by canteen staff.
            </div>
          )}

          <div className="space-y-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isDone = currentStepIndex > idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all ${
                    isCurrent
                      ? 'bg-orange-50 border border-orange-200 text-orange-950 font-bold shadow-xs'
                      : isDone
                      ? 'bg-slate-50 text-slate-500 font-medium'
                      : 'text-slate-300 font-normal'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
                      isCurrent
                        ? 'bg-orange-600 text-white shadow-xs'
                        : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs flex-1">{step.label}</span>
                  {isCurrent && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md animate-pulse">
                      Now
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details & Student Info */}
        <div className="p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-100">
            <span>Student:</span>
            <span className="font-bold text-slate-900">
              {order.student_name} ({order.student_class})
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="font-bold text-slate-700 block">Ordered Items:</span>
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-slate-600">
                <span>
                  {item.quantity}x {item.name || item.item_name}
                </span>
                <span className="font-semibold text-slate-900">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-800">Total Amount:</span>
            <span className="font-black text-base text-slate-900">₹{order.total_amount}</span>
          </div>
        </div>

        {/* Pickup Location & Payment Info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <MapPin className="w-4 h-4 text-orange-600" />
            <span>Pickup at 6th Floor Canteen — Counter 1</span>
          </div>
          <p className="text-[11px] text-slate-500 pl-5 leading-relaxed">
            Show this order #{displayOrderNum} at the counter. Pay <strong>₹{order.total_amount}</strong> via UPI QR or Cash upon taking your items.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopyTicket}
          className="flex-1 py-3 px-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
        >
          {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Ticket Copied!' : 'Copy Ticket Info'}</span>
        </button>

        <button
          type="button"
          onClick={onOrderAnother}
          className="flex-1 py-3 px-3 bg-slate-900 hover:bg-slate-800 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Order Another</span>
        </button>
      </div>
    </div>
  );
}
