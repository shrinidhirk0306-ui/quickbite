import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { apiVerifyStaffPin } from '../lib/storage';

export function StaffAuthModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleKeyClick = (digit) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (pin.length < 6) {
      setError('Please enter all 6 digits of the staff PIN');
      return;
    }

    try {
      setLoading(true);
      setError('');
      // Verified via secure database RPC function with 5-attempt rate-limit lockout
      const isValid = await apiVerifyStaffPin(pin);
      if (isValid) {
        onSuccess(pin);
        onClose();
        setPin('');
      } else {
        setError('Incorrect PIN. Default is 123456');
        setPin('');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Verification failed. Try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 absolute top-4 right-4 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 mb-5">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Canteen Staff Access</h2>
          <p className="text-xs text-slate-500">
            Enter 6-digit PIN to manage live orders & kitchen
          </p>
        </div>

        {/* Error / Lockout Alert */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold leading-tight">{error}</span>
          </div>
        )}

        {/* 6 PIN Dots Display */}
        <div className="flex justify-center items-center gap-2.5 mb-6">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const hasDigit = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                  hasDigit
                    ? 'bg-orange-600 border-orange-600 scale-110 shadow-xs'
                    : 'bg-slate-100 border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyClick(String(digit))}
              className="h-12 bg-slate-50 hover:bg-orange-50 active:bg-orange-100 text-slate-800 hover:text-orange-900 font-black text-lg rounded-2xl transition-colors shadow-2xs border border-slate-200/60"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="h-12 bg-slate-50 hover:bg-slate-100 text-slate-400 font-bold text-xs rounded-2xl transition-colors border border-slate-200/60 uppercase"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="h-12 bg-slate-50 hover:bg-orange-50 active:bg-orange-100 text-slate-800 font-black text-lg rounded-2xl transition-colors shadow-2xs border border-slate-200/60"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-2xl transition-colors border border-slate-200/60"
          >
            ⌫
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || pin.length < 6}
          className={`w-full py-3 rounded-2xl font-bold text-xs text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
            loading || pin.length < 6
              ? 'bg-slate-300 cursor-not-allowed shadow-none'
              : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying securely...</span>
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>Unlock Staff Dashboard</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-400 text-center mt-3 font-medium">
          Default 6-digit staff PIN: <span className="font-bold text-slate-600">123456</span>
          <br />
          <span className="text-[10px] text-slate-400">(Locks for 5 mins after 5 wrong tries)</span>
        </p>
      </div>
    </div>
  );
}
