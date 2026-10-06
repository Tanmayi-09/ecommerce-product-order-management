import React, { useState } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Truck,
  QrCode,
  Banknote,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import { PaymentMethod } from '../../shared/types.ts';

interface CheckoutPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { items, subtotal, refreshCart } = useCart();
  const { success, error } = useToast();

  const [shippingAddress, setShippingAddress] = useState({
    street: user?.address?.street || '14 Hill Road, Bandra West',
    city: user?.address?.city || 'Mumbai',
    state: user?.address?.state || 'Maharashtra',
    zipCode: user?.address?.zipCode || '400050',
    country: user?.address?.country || 'India',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      error('Your cart is empty.');
      onNavigate('products');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.orders.create({
        shippingAddress,
        paymentMethod,
        notes: notes.trim() || undefined,
        autoProcessPayment: true,
        simulatePaymentFailure: simulateFailure,
      });

      if (res.success && res.order) {
        await refreshCart();
        if (simulateFailure) {
          success(`Order ${res.order.orderId} placed (Payment Simulation Failed as requested).`);
        } else {
          success(`Order ${res.order.orderId} placed & confirmed successfully!`);
        }
        onNavigate('order-detail', { orderId: res.order.orderId });
      } else {
        error(res.message || 'Failed to place order.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to create order. Please check inventory stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Secure Checkout</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Step-by-step order placement with multi-warehouse stock reservation
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Shipping & Payment details */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Shipping Address */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              1. Delivery Shipping Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.street}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, street: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">City</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">State</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">PIN / Postal Code</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.zipCode}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.country}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, country: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Simulation Method */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              2. Simulated Payment Method
            </h2>

            <p className="text-xs text-slate-500">
              Select your simulated transaction method (Safe academic demonstration; no real financial data requested).
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                { id: 'Card', label: 'Card (Demo)', icon: CreditCard },
                { id: 'Cash on Delivery', label: 'Cash on Delivery', icon: Banknote },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all text-xs font-semibold ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Test Simulation Failure Toggle */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="font-semibold text-rose-700">
                  Simulate Payment Failure (Testing Mode)
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mt-1 pl-6">
                Useful for demonstrating payment failure state transitions and order retry flows during college review.
              </p>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1 text-xs">
                Delivery Instructions / Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Leave package with security guard"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Summary & Order Confirmation */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
              Items Summary ({items.length})
            </h3>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
              {items.map((i) => (
                <div key={i.id} className="py-2 flex justify-between items-center">
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-slate-800 truncate">{i.product?.productName}</p>
                    <span className="text-[10px] text-slate-400">Qty: {i.quantity}</span>
                  </div>
                  <span className="font-semibold text-slate-900 shrink-0">
                    ₹{((i.product?.price || 0) * i.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Amount:</span>
                <span className="font-extrabold text-base text-indigo-600">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Routing Warehouses & Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Place Order
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
