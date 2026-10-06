import React, { useEffect, useState } from 'react';
import {
  Users,
  ShoppingBag,
  PackageCheck,
  IndianRupee,
  AlertTriangle,
  Clock,
  Building2,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { OrderStatus } from '../../shared/types.ts';

interface AdminDashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getDashboard();
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load admin metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await api.orders.updateStatus(orderId, newStatus);
      if (res.success) {
        success(`Order ${orderId} updated to ${newStatus}`);
        loadDashboard();
      }
    } catch (err: any) {
      error(err.message || 'Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recentOrders = data?.recentOrders || [];
  const lowStockAlerts = data?.lowStockAlerts || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Operations Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics, warehouse inventory health, and order fulfillment status
        </p>
      </div>

      {/* 6 Required Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Customers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Customers</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.totalCustomers || 0}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Registered</span>
          </div>
        </div>

        {/* Card 2: Total Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Products</span>
            <ShoppingBag className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.totalProducts || 0}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Active SKUs</span>
          </div>
        </div>

        {/* Card 3: Total Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Orders</span>
            <PackageCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.totalOrders || 0}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">All Time</span>
          </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-slate-900 truncate">
              ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Settled</span>
          </div>
        </div>

        {/* Card 5: Low Stock Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-rose-600">
              {stats.lowStockProducts || 0}
            </span>
            <span className="text-[10px] text-rose-500 font-medium block mt-0.5">SKUs &lt;= 5 units</span>
          </div>
        </div>

        {/* Card 6: Pending Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-600">
              {stats.pendingOrders || 0}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Need Dispatch</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Order Lifecycle Status Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Order Lifecycle Distribution
          </h3>

          <div className="space-y-3 pt-2">
            {Object.entries(charts.orderStatus || {}).map(([status, count]: [string, any]) => {
              const total = stats.totalOrders || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 capitalize">
                      {status.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="font-mono text-slate-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === 'DELIVERED'
                          ? 'bg-emerald-500'
                          : status === 'SHIPPED'
                          ? 'bg-purple-500'
                          : status === 'CANCELLED'
                          ? 'bg-rose-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Multi-Warehouse Inventory Status */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" />
            Warehouse Hub Stock Distribution
          </h3>

          <div className="space-y-4 pt-2">
            {(charts.warehouses || []).map((wh: any) => {
              const maxCap = 100;
              const totalStock = wh.totalStock || 0;
              return (
                <div key={wh.warehouseId} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{wh.warehouseName}</span>
                      <span className="text-[10px] text-slate-400 block">{wh.location}</span>
                    </div>
                    <span className="font-extrabold text-sm text-indigo-600">
                      {wh.availableStock} <span className="text-[10px] text-slate-500 font-normal">avail</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${Math.min(100, (wh.availableStock / 40) * 100)}%` }}
                        title="Available Stock"
                      />
                      <div
                        className="bg-amber-400 h-full"
                        style={{ width: `${Math.min(100, (wh.reservedStock / 40) * 100)}%` }}
                        title="Reserved Stock"
                      />
                    </div>
                    <span className="font-mono text-[10px]">
                      {wh.reservedStock} res
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders Table with State Transitions */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-500">Directly advance order state machine during demo</p>
          </div>
          <button
            onClick={() => onNavigate('admin-orders')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View all orders ({stats.totalOrders})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-2.5 px-3 font-semibold">Order ID</th>
                <th className="py-2.5 px-3 font-semibold">Customer</th>
                <th className="py-2.5 px-3 font-semibold">Amount</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Fulfillment</th>
                <th className="py-2.5 px-3 font-semibold text-right">Quick State Advance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((o: any) => (
                <tr key={o.orderId} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.orderId}</td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-800 block">{o.customerName}</span>
                    <span className="text-[10px] text-slate-400">{o.customerEmail}</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    ₹{o.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={o.orderStatus} size="sm" />
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={o.fulfillmentType} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <select
                      value={o.orderStatus}
                      onChange={(e) => handleUpdateStatus(o.orderId, e.target.value as OrderStatus)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium focus:outline-none"
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-sm text-rose-900">
              Active Low Stock Alerts (Critical Inventory &lt;= 5 units)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {lowStockAlerts.map((p: any) => (
              <div
                key={p.productId}
                className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{p.productName}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{p.productId}</span>
                  <div className="mt-1">
                    <span className="text-rose-600 font-extrabold text-sm">
                      {p.stockQuantity} units left
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('admin-inventory')}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
                >
                  Restock →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
