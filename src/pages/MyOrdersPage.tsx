import React, { useEffect, useState } from 'react';
import { Package, ArrowRight, Clock, AlertCircle, ShoppingBag } from 'lucide-react';
import { Order, OrderStatus } from '../../shared/types.ts';
import { api } from '../services/api.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';

interface MyOrdersPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MyOrdersPage: React.FC<MyOrdersPageProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.orders.getAll();
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.warn('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders =
    filterStatus === 'ALL'
      ? orders
      : orders.filter((o) => o.orderStatus === filterStatus);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track multi-warehouse shipments, payment records, and lifecycle updates
          </p>
        </div>

        {/* Filter by status */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          {['ALL', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 h-36 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No orders found</h3>
          <p className="text-xs text-slate-500">
            {filterStatus === 'ALL'
              ? "You haven't placed any orders yet."
              : `No orders matching status '${filterStatus}'.`}
          </p>
          <button
            onClick={() => onNavigate('products')}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.orderId}
              onClick={() => onNavigate('order-detail', { orderId: order.orderId })}
              className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Order Info */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {order.orderId}
                  </span>
                  <StatusBadge status={order.orderStatus} size="sm" />
                  <StatusBadge status={order.paymentStatus} size="sm" />
                  <StatusBadge status={order.fulfillmentType} size="sm" />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(order.createdAt).toLocaleDateString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span>{order.orderItems.length} item(s)</span>
                </div>

                {/* Items preview snippet */}
                <div className="flex items-center gap-2 flex-wrap">
                  {order.orderItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                    >
                      {item.productName} ({item.quantity}x)
                    </span>
                  ))}
                </div>
              </div>

              {/* Price & Action */}
              <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0 gap-2">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">
                    Total Amount
                  </span>
                  <span className="text-lg font-extrabold text-slate-900">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <button className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
