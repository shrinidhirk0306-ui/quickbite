import React from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export function SlotSelector({
  slots,
  selectedSlot,
  onSelectSlot,
  ordersBySlot = {},
  slotLimit = 20,
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-orange-600" />
          5-Minute Pickup Slots
        </span>
        <span>Max {slotLimit} orders / slot</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {slots.map((slot) => {
          const currentCount = ordersBySlot[slot.label] || 0;
          const isFull = currentCount >= slotLimit;
          const isSelected = selectedSlot === slot.label;
          const spotsLeft = Math.max(0, slotLimit - currentCount);

          return (
            <button
              key={slot.id}
              type="button"
              disabled={isFull}
              onClick={() => onSelectSlot(slot.label)}
              className={`relative p-3 rounded-2xl border text-left transition-all duration-200 active:scale-95 flex flex-col justify-between min-h-[74px] ${
                isFull
                  ? 'border-slate-200 bg-slate-100/80 cursor-not-allowed opacity-60'
                  : isSelected
                  ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-500 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span
                  className={`text-xs font-bold ${
                    isSelected ? 'text-orange-950 font-black' : 'text-slate-800'
                  }`}
                >
                  {slot.label}
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                )}
              </div>

              <div className="mt-1 flex items-center justify-between">
                {isFull ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-100/80 px-2 py-0.5 rounded-md">
                    <AlertCircle className="w-3 h-3" />
                    FULL
                  </span>
                ) : (
                  <span
                    className={`text-[11px] font-semibold ${
                      spotsLeft <= 3
                        ? 'text-amber-600'
                        : isSelected
                        ? 'text-orange-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {spotsLeft} spots left
                  </span>
                )}

                {/* Micro progress bar for slot capacity */}
                {!isFull && (
                  <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        spotsLeft <= 3 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (currentCount / slotLimit) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
