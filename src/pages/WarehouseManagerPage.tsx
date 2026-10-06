import React, { useState, useEffect } from 'react';
import {
  Building2,
  Package,
  Boxes,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Check,
  Send,
  Edit,
  Sliders,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';

interface WarehouseManagerPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const WarehouseManagerPage: React.FC<WarehouseManagerPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>('WH-HYD');
  const [warehouseInfo, setWarehouseInfo] = useState<any | null>(null);
  const [warehouseInventory, setWarehouseInventory] = useState<any[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock edit state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedStock, setEditedStock] = useState<number>(0);

  useEffect(() => {
    loadWarehousesList();
  }, []);

  useEffect(() => {
    if (activeWarehouseId) {
      loadWarehouseData(activeWarehouseId);
    }
  }, [activeWarehouseId]);

  const loadWarehousesList = async () => {
    try {
      const res = await api.warehouses.getAll();
      if (res.success && res.warehouses) {
        setWarehouses(res.warehouses);
        // Default to user's assigned warehouse if available
        if (user?.assignedWarehouseId) {
          setActiveWarehouseId(user.assignedWarehouseId);
        } else if (res.warehouses.length > 0) {
          setActiveWarehouseId(res.warehouses[0].warehouseId);
        }
      }
    } catch {
      error('Failed to load warehouses list.');
    }
  };

  const loadWarehouseData = async (whId: string) => {
    try {
      setLoading(true);
      const [whRes, ordersRes] = await Promise.all([
        api.warehouses.getById(whId),
        api.warehouses.getAssignedOrders(whId),
      ]);

      if (whRes.success) {
        setWarehouseInfo(whRes.warehouse);
        setWarehouseInventory(whRes.inventory || []);
      }
      if (ordersRes.success) {
        setAssignedOrders(ordersRes.orders || []);
      }
    } catch {
      error('Failed to load warehouse data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePackLeg = async (orderId: string) => {
    try {
      const res = await api.warehouses.packOrder(activeWarehouseId, orderId);
      if (res.success) {
        success(`Fulfillment leg packed for order ${orderId}!`);
        loadWarehouseData(activeWarehouseId);
      }
    } catch (err: any) {
      error(err.message || 'Failed to pack order leg.');
    }
  };

  const handleShipLeg = async (orderId: string) => {
    try {
      const res = await api.warehouses.shipOrder(activeWarehouseId, orderId);
      if (res.success) {
        success(`Fulfillment leg marked as SHIPPED for order ${orderId}!`);
        loadWarehouseData(activeWarehouseId);
      }
    } catch (err: any) {
      error(err.message || 'Failed to dispatch order.');
    }
  };

  const handleSaveStock = async (productId: string) => {
    try {
      const res = await api.warehouses.updateStock(activeWarehouseId, productId, editedStock);
      if (res.success) {
        success(`Stock updated for ${productId} to ${editedStock} units.`);
        setEditingProductId(null);
        loadWarehouseData(activeWarehouseId);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update stock quantity.');
    }
  };

  const lowStockItems = warehouseInventory.filter((inv) => inv.availableQuantity <= 5);
  const totalAvailableUnits = warehouseInventory.reduce(
    (sum, i) => sum + i.availableQuantity,
    0
  );
  const totalReservedUnits = warehouseInventory.reduce(
    (sum, i) => sum + i.reservedQuantity,
    0
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            Module 3 & 13: Warehouse Manager Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Fulfillment Center Hub Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Manage local stock, inspect assigned multi-warehouse split order allocations, and
            transition packages from <code className="text-amber-300">PACKED</code> to{' '}
            <code className="text-emerald-300">SHIPPED</code>.
          </p>
        </div>

        {/* Warehouse Selector Switcher */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex flex-col gap-1.5 shrink-0">
          <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Select Active Warehouse Hub:
          </label>
          <select
            value={activeWarehouseId}
            onChange={(e) => setActiveWarehouseId(e.target.value)}
            className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>
                {w.warehouseName} ({w.warehouseId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warehouse Hub Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
              Active Hub
            </span>
            <h3 className="font-bold text-sm text-slate-900 truncate max-w-[150px]">
              {warehouseInfo?.warehouseName || 'Loading...'}
            </h3>
            <span className="text-[10px] text-slate-500 block truncate">
              {warehouseInfo?.location}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
              Available Stock
            </span>
            <h3 className="font-extrabold text-xl text-emerald-600">
              {totalAvailableUnits} units
            </h3>
            <span className="text-[10px] text-slate-500 block">
              Across {warehouseInventory.length} distinct SKUs
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
              Reserved in Orders
            </span>
            <h3 className="font-extrabold text-xl text-amber-600">
              {totalReservedUnits} units
            </h3>
            <span className="text-[10px] text-slate-500 block">In-flight active orders</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
              Assigned Orders
            </span>
            <h3 className="font-extrabold text-xl text-purple-600">
              {assignedOrders.length} orders
            </h3>
            <span className="text-[10px] text-slate-500 block">Pending / active fulfillment</span>
          </div>
        </div>
      </div>

      {/* Section 1: Assigned Orders & Pick/Pack Workflow */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Assigned Customer Fulfillment Queue
            </h2>
            <p className="text-xs text-slate-500">
              Orders requiring item pick, pack, and dispatch from{' '}
              <strong>{warehouseInfo?.warehouseName}</strong>
            </p>
          </div>
          <button
            onClick={() => loadWarehouseData(activeWarehouseId)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors w-fit"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Refresh Queue
          </button>
        </div>

        {assignedOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No pending order fulfillments assigned to this warehouse currently.
          </div>
        ) : (
          <div className="space-y-4">
            {assignedOrders.map((order) => {
              const myFulfillment = order.fulfillmentDetails?.find(
                (f: any) => f.warehouseId === activeWarehouseId
              );

              return (
                <div
                  key={order.orderId}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {order.orderId}
                      </span>
                      <StatusBadge status={order.orderStatus} size="sm" />
                      <StatusBadge status={order.fulfillmentType} size="sm" />
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      Customer: <strong>{order.customerName}</strong> ({order.customerEmail}) •{' '}
                      Destination: {order.shippingAddress?.city}, {order.shippingAddress?.state}
                    </div>

                    {/* Specific items assigned to THIS warehouse */}
                    <div className="pt-2 border-t border-slate-200 text-xs">
                      <span className="text-[10px] uppercase font-bold text-indigo-700 block mb-1">
                        Items to Pick & Pack from this Hub:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {myFulfillment?.items?.map((it: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white border border-indigo-200 text-indigo-900 px-2.5 py-1 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>{it.productName}</span>
                            <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {it.quantity}x
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Warehouse Action Controls */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Leg Status:{' '}
                      <strong className="text-slate-800">
                        {myFulfillment?.status || 'PENDING_PACKING'}
                      </strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePackLeg(order.orderId)}
                        disabled={
                          myFulfillment?.status === 'PACKED' ||
                          myFulfillment?.status === 'SHIPPED' ||
                          order.orderStatus === 'DELIVERED'
                        }
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Pack Order Leg
                      </button>

                      <button
                        onClick={() => handleShipLeg(order.orderId)}
                        disabled={
                          myFulfillment?.status === 'SHIPPED' || order.orderStatus === 'DELIVERED'
                        }
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Mark as Shipped
                      </button>
                    </div>

                    <button
                      onClick={() => onNavigate('order-detail', { orderId: order.orderId })}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline mt-1"
                    >
                      View Full Order Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Local Warehouse Stock Management */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-600" />
              Local Inventory Stock for {warehouseInfo?.warehouseName}
            </h2>
            <p className="text-xs text-slate-500">
              Direct physical count management. Available quantity updates instantly for the router.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                <th className="py-2.5 px-3 font-semibold">SKU / ID</th>
                <th className="py-2.5 px-3 font-semibold">Product Name</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold text-right">Physical Total</th>
                <th className="py-2.5 px-3 font-semibold text-right">Reserved (In-Flight)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Available for Dispatch</th>
                <th className="py-2.5 px-3 font-semibold text-right">Quick Stock Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {warehouseInventory.map((item) => {
                const isEditing = editingProductId === item.productId;
                return (
                  <tr key={item.productId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {item.productId}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {item.productName}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{item.category}</td>
                    <td className="py-3 px-3 text-right font-medium text-slate-800">
                      {item.quantity} units
                    </td>
                    <td className="py-3 px-3 text-right text-amber-600 font-medium">
                      {item.reservedQuantity} units
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">
                      {item.availableQuantity} units
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min={item.reservedQuantity}
                            value={editedStock}
                            onChange={(e) => setEditedStock(Number(e.target.value))}
                            className="w-16 px-2 py-1 text-xs font-bold border border-indigo-400 rounded-lg text-right"
                          />
                          <button
                            onClick={() => handleSaveStock(item.productId)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingProductId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingProductId(item.productId);
                            setEditedStock(item.quantity);
                          }}
                          className="px-2.5 py-1 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg font-semibold text-xs inline-flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
