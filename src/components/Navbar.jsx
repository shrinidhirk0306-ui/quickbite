import { UtensilsCrossed, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function Navbar({ currentPage, onNavigate, onOpenStaffLogin }) {
  const { totalCount, totalAmount } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-xs">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onNavigate('menu')} 
          className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">LunchLine</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                6th Floor
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">College Canteen Pre-order</p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Canteen Staff Portal Link */}
          <button
            onClick={onOpenStaffLogin}
            aria-label="Staff Login"
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
            title="Canteen Staff Dashboard"
          >
            <ShieldCheck className="w-4 h-4 text-orange-600" />
            <span className="hidden sm:inline">Staff</span>
          </button>

          {/* Quick Cart Pill (if items exist) */}
          {totalCount > 0 && currentPage !== 'checkout' && (
            <button
              onClick={() => onNavigate('checkout')}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm shadow-orange-600/30 active:scale-95 transition-transform"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{totalCount}</span>
              <span className="opacity-80">·</span>
              <span>₹{totalAmount}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
