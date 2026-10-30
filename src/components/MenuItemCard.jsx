import React from 'react';
import { Plus, Minus, Ban } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function MenuItemCard({ item }) {
  const { cart, addItem, removeItem } = useCart();
  const cartItem = cart.find((i) => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isSoldOut = Boolean(item.is_sold_out);

  return (
    <div
      className={`relative bg-white rounded-2xl p-4 border transition-all duration-200 shadow-xs ${
        isSoldOut
          ? 'border-slate-200 bg-slate-50/70 opacity-75'
          : quantity > 0
          ? 'border-orange-300 ring-2 ring-orange-400/20 shadow-md shadow-orange-500/5'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl" role="img" aria-label={item.name}>
              {item.image_url || '🍽️'}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 leading-snug truncate">
                {item.name}
              </h3>
              <span className="inline-block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                {item.category}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-lg font-black text-slate-900">
              ₹{item.price}
            </span>
            {isSoldOut && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                <Ban className="w-3 h-3" />
                Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Action Button: Stepper or Add Button */}
        <div className="self-end sm:self-center shrink-0">
          {isSoldOut ? (
            <button
              disabled
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-200 text-slate-400 cursor-not-allowed"
            >
              Unavailable
            </button>
          ) : quantity > 0 ? (
            <div className="flex items-center bg-orange-50 border border-orange-200 rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Decrease ${item.name}`}
                className="w-8 h-8 rounded-lg bg-white text-orange-600 flex items-center justify-center font-bold active:scale-90 transition-transform shadow-xs"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-black text-sm text-orange-950">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => addItem(item)}
                aria-label={`Increase ${item.name}`}
                className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold active:scale-90 transition-transform shadow-xs shadow-orange-600/30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addItem(item)}
              aria-label={`Add ${item.name}`}
              className="flex items-center gap-1 px-4 py-2 bg-slate-900 hover:bg-orange-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>ADD</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
