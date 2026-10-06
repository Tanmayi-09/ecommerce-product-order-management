import React, { useEffect, useState } from 'react';
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Truck,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { api } from '../services/api.ts';

interface CartPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const { items, subtotal, updateQuantity, removeFromCart, clearCart, isLoading } = useCart();
  const [fulfillmentPlan, setFulfillmentPlan] = useState<any | null>(null);
  const [checkingPlan, setCheckingPlan] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      checkFulfillment();
    } else {
      setFulfillmentPlan(null);
    }
  }, [items]);

  const checkFulfillment = async () => {
    try {
      setCheckingPlan(true);
      const planItems = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
      const res = await api.inventory.planAllocation(planItems);
      setFulfillmentPlan(res);
    } catch {
      setFulfillmentPlan(null);
    } finally {
      setCheckingPlan(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 my-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Looks like you haven't added any products to your cart yet. Explore our product catalog to test warehouse allocation.
        </p>
        <button
          onClick={() => onNavigate('products')}
          className="mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors"
        >
          Browse Products
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {items.length} unique item(s) in your basket
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Cart Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={item.product?.image}
                    alt={item.product?.productName}
                    className="w-16 h-16 object-cover rounded-xl bg-slate-100 border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.productId}
                    </span>
                    <h3
                      onClick={() => onNavigate('product-detail', { productId: item.productId })}
                      className="font-bold text-sm text-slate-900 hover:text-indigo-600 cursor-pointer truncate"
                    >
                      {item.product?.productName || 'Unknown Product'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      ₹{(item.product?.price || 0).toLocaleString('en-IN')} each
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  {/* Quantity controls */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-slate-900 bg-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-bold text-xs"
                    >
                      +
                    </button>
                  </div>

                  {/* Total & Delete */}
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-slate-900">
                      ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-medium mt-0.5"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Intelligent Fulfillment Router Preview */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Warehouse Allocation Engine Preview
              </h4>
            </div>

            {checkingPlan ? (
              <p className="text-xs text-slate-500 italic">Calculating optimal warehouse routing...</p>
            ) : fulfillmentPlan && fulfillmentPlan.success ? (
              <div className="space-y-2 text-xs">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    fulfillmentPlan.isSplit
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {fulfillmentPlan.isSplit ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span>
                      {fulfillmentPlan.isSplit
                        ? 'Split Order Routing (Multi-Warehouse Dispatch)'
                        : 'Single Warehouse Direct Routing (No Splitting)'}
                    </span>
                  </div>
                  <span className="font-bold text-[11px] uppercase">
                    {fulfillmentPlan.fulfillmentDetails.length} Hub(s)
                  </span>
                </div>

                {/* Hub breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {fulfillmentPlan.fulfillmentDetails.map((f: any) => (
                    <div
                      key={f.warehouseId}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div className="font-semibold text-slate-900 flex items-center justify-between">
                        <span>{f.warehouseName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {f.warehouseId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{f.location}</p>
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-700">
                        {f.items.map((it: any) => (
                          <div key={it.productId} className="flex justify-between">
                            <span className="truncate max-w-[150px]">{it.productName}:</span>
                            <span className="font-bold">{it.quantity} unit(s)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-rose-600">
                {fulfillmentPlan?.message || 'Unable to allocate warehouse stock.'}
              </p>
            )}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 h-fit">
          <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
            Order Summary
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal:</span>
              <span className="font-semibold text-slate-900">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Standard Logistics:</span>
              <span className="text-emerald-600 font-bold">FREE (Demo)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Simulated GST (18% included):</span>
              <span className="font-semibold text-slate-900">
                ₹{Math.round(subtotal * 0.18).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between text-sm">
              <span className="font-bold text-slate-900">Total Payable:</span>
              <span className="font-extrabold text-lg text-indigo-600">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('checkout')}
            disabled={fulfillmentPlan && !fulfillmentPlan.success}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/20"
          >
            Proceed to Checkout
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('products')}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium py-1"
          >
            ← Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
