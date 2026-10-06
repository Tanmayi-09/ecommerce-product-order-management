import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  PackageCheck,
  XCircle,
} from 'lucide-react';
import { Order, Payment, OrderStatus } from '../../shared/types.ts';
import { api } from '../services/api.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface OrderDetailPageProps {
  orderId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({ orderId, onNavigate }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { success, error } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await api.orders.getById(orderId);
      if (res.success) {
        setOrder(res.order);
        setPayment(res.payment);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this order? Reserved warehouse inventory will be restored.')) return;

    try {
      setCancelling(true);
      const res = await api.orders.cancel(order.orderId);
      if (res.success) {
        success('Order has been cancelled and stock released back to warehouses.');
        await loadOrderDetails();
      }
    } catch (err: any) {
      error(err.message || 'Could not cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    try {
      setRetryingPayment(true);
      const res = await api.payments.process({
        orderId: order.orderId,
        amount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        simulateFail: false,
      });
      if (res.success) {
        success('Payment retry was successful! Order is now CONFIRMED.');
        await loadOrderDetails();
      }
    } catch (err: any) {
      error(err.message || 'Payment simulation failed.');
    } finally {
      setRetryingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
        <p className="text-slate-600">Order not found.</p>
        <button
          onClick={() => onNavigate('orders')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  // Steps for the order status tracker
  const statusSteps: OrderStatus[] = [
    'PLACED',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  const currentStepIdx = statusSteps.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'CANCELLED';

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('orders')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Orders
        </button>

        <div className="flex items-center gap-2">
          {['PLACED', 'CONFIRMED'].includes(order.orderStatus) && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin-orders')}
              className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Manage in Admin Hub →
            </button>
          )}
        </div>
      </div>

      {/* Header card with order summary */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
                {order.orderId}
              </h1>
              <StatusBadge status={order.orderStatus} />
              <StatusBadge status={order.paymentStatus} />
              <StatusBadge status={order.fulfillmentType} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()} • Customer: {order.customerName} ({order.customerEmail})
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 uppercase font-medium block">
              Total Amount
            </span>
            <span className="text-2xl font-extrabold text-indigo-600">
              ₹{order.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Order Lifecycle Progress Tracker */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Order Fulfillment Progress Tracker
          </h3>

          {isCancelled ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong>Order Cancelled:</strong> This order was cancelled. Any reserved warehouse stock was automatically returned to the available inventory pool.
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-x-auto pb-4">
                <div className="flex items-center justify-between min-w-[620px]">
                  {statusSteps.map((step, idx) => {
                    const isDone = currentStepIdx >= idx;
                    const isCurrent = currentStepIdx === idx;

                    return (
                      <div key={step} className="flex flex-col items-center relative flex-1 text-center">
                        {/* Connecting bar */}
                        {idx !== 0 && (
                          <div
                            className={`absolute top-4 -left-1/2 w-full h-1 -z-0 transition-all ${
                              currentStepIdx >= idx ? 'bg-indigo-600' : 'bg-slate-200'
                            }`}
                          />
                        )}

                        {/* Step circle */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all ${
                            isDone
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>

                        <span
                          className={`text-[11px] font-semibold mt-2 capitalize ${
                            isCurrent
                              ? 'text-indigo-600 font-bold'
                              : isDone
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Multi-Warehouse Fulfillment & Payment Transaction Receipt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Multi-Warehouse Fulfillment Breakdown Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                FULFILLMENT PLAN
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Total Warehouses Used: {order.fulfillmentDetails?.length || 1}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Intelligent multi-warehouse optimization routed this order across{' '}
            {order.fulfillmentDetails?.length || 1} regional fulfillment center(s):
          </p>

          <div className="space-y-3">
            {order.fulfillmentDetails && order.fulfillmentDetails.length > 0 ? (
              order.fulfillmentDetails.map((f, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Warehouse:
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {f.warehouseName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {f.warehouseId}
                      </span>
                      {f.status && (
                        <span className="text-[10px] font-semibold text-purple-700 block mt-0.5">
                          {f.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-500 text-[11px]">{f.location}</p>

                  <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-600 text-[11px] uppercase">
                      Products Dispatched:
                    </span>
                    {f.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-white p-1.5 rounded-lg border border-slate-200/60"
                      >
                        <span className="font-medium text-slate-800">• {it.productName}</span>
                        <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">
                          {it.quantity} × unit(s)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">Standard single-warehouse dispatch.</p>
            )}
          </div>
        </div>

        {/* Simulated Payment Receipt Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Simulated Payment Transaction
              </h3>
            </div>
            <StatusBadge status={order.paymentStatus} size="sm" />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono font-bold text-slate-800">
                {payment?.transactionId || 'TXN-PENDING-000'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Method:</span>
              <span className="font-semibold text-slate-800">{order.paymentMethod}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-bold text-slate-900">
                ₹{order.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Timestamp:</span>
              <span className="text-slate-700">
                {payment?.paymentDate
                  ? new Date(payment.paymentDate).toLocaleString()
                  : new Date(order.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center">
              <span className="text-slate-500">Gateway Status:</span>
              <span
                className={`font-bold ${
                  order.paymentStatus === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {order.paymentStatus === 'SUCCESS' ? 'SIMULATED SUCCESS (VERIFIED)' : 'FAILED / PENDING'}
              </span>
            </div>
          </div>

          {order.paymentStatus === 'FAILED' && (
            <button
              onClick={handleRetryPayment}
              disabled={retryingPayment}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {retryingPayment ? 'Processing simulated retry...' : 'Retry Simulated Payment'}
            </button>
          )}

          <p className="text-[11px] text-slate-400 leading-normal">
            Safe demo payment simulation engine complying with project security standards (no real card or banking data stored).
          </p>
        </div>
      </div>

      {/* Shipping Address & Order Items Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              Delivery Destination
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {order.shippingAddress?.street}, {order.shippingAddress?.city},{' '}
              {order.shippingAddress?.state} - {order.shippingAddress?.zipCode},{' '}
              {order.shippingAddress?.country}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">
            Ordered Line Items ({order.orderItems.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-semibold">Product</th>
                  <th className="py-2.5 px-3 font-semibold">Unit Price</th>
                  <th className="py-2.5 px-3 font-semibold">Quantity</th>
                  <th className="py-2.5 px-3 font-semibold">Assigned Warehouse(s)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Item Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.orderItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                        />
                      )}
                      <div>
                        <span className="font-semibold text-slate-900 block">{item.productName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.productId}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-3 px-3">
                      {item.warehouseFulfillments ? (
                        <div className="space-y-0.5">
                          {item.warehouseFulfillments.map((wf, wfi) => (
                            <span
                              key={wfi}
                              className="inline-block text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium mr-1"
                            >
                              {wf.warehouseName} ({wf.quantity}u)
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Default Central Hub</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
