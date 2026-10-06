import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle2, ArrowRight } from 'lucide-react';
import { Order, OrderStatus } from '../../shared/types.ts';
import { api } from '../services/api.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { useToast } from '../context/ToastContext.tsx';

interface AdminOrdersPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AdminOrdersPage: React.FC<AdminOrdersPageProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { success, error } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getOrders();
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch {
      error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await api.orders.updateStatus(orderId, newStatus);
      if (res.success) {
        success(`Order ${orderId} updated to ${newStatus}`);
        loadOrders();
        if (selectedOrder?.orderId === orderId) {
          setSelectedOrder(res.order);
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to update order status');
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || o.orderStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders & Fulfillment Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor state transitions, warehouse fulfillment splits, and payment reconciliations
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
        {['ALL', 'PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(
          (st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                selectedStatus === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          )
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Order ID</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Total Amount</th>
                <th className="py-3 px-4 font-semibold">Fulfillment Type</th>
                <th className="py-3 px-4 font-semibold">Order Status</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((o) => (
                <tr key={o.orderId} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.orderId}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 block">{o.customerName}</span>
                    <span className="text-[10px] text-slate-400">{o.customerEmail}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(o.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-slate-900">
                    ₹{o.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={o.fulfillmentType} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={o.orderStatus}
                      onChange={(e) => handleUpdateStatus(o.orderId, e.target.value as OrderStatus)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold focus:outline-none"
                    >
                      <option value="PLACED">PLACED</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={o.paymentStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="px-2.5 py-1 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg font-semibold"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 font-mono">
                  {selectedOrder.orderId}
                </h3>
                <StatusBadge status={selectedOrder.orderStatus} size="sm" />
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-700">Customer Details:</span>
                <p>
                  {selectedOrder.customerName} ({selectedOrder.customerEmail})
                </p>
                <p className="text-slate-500">
                  {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city},{' '}
                  {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.zipCode}
                </p>
              </div>

              {/* Warehouse Dispatch Plan */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Warehouse Dispatch Plan ({selectedOrder.fulfillmentType}):
                </span>
                {selectedOrder.fulfillmentDetails?.map((f, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{f.warehouseName}</span>
                      <span className="font-mono text-slate-500">{f.warehouseId}</span>
                    </div>
                    <div className="mt-1 space-y-0.5 text-slate-600">
                      {f.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>• {it.productName}</span>
                          <span className="font-bold">{it.quantity} unit(s)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    onNavigate('order-detail', { orderId: selectedOrder.orderId });
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                >
                  Open Full Order View →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
