import React, { useState, useEffect } from 'react';
import { Boxes, Edit, AlertTriangle, CheckCircle2, Search, X } from 'lucide-react';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';

export const AdminInventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [newQuantity, setNewQuantity] = useState(0);

  const { success, error } = useToast();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getInventory();
      if (res.success) {
        setInventory(res.inventory || []);
      }
    } catch {
      error('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const res = await api.inventory.update(editingItem.inventoryId, {
        quantity: newQuantity,
      });
      if (res.success) {
        success('Inventory quantity adjusted successfully.');
        setEditingItem(null);
        loadInventory();
      }
    } catch (err: any) {
      error(err.message || 'Failed to update stock');
    }
  };

  const filtered = inventory.filter(
    (item) =>
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.productId.toLowerCase().includes(search.toLowerCase()) ||
      item.warehouseName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Multi-Warehouse Inventory Matrix</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical stock counts, in-flight reservations, and calculated available units
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU or Warehouse..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Product SKU</th>
                <th className="py-3 px-4 font-semibold">Product Name</th>
                <th className="py-3 px-4 font-semibold">Warehouse Hub</th>
                <th className="py-3 px-4 font-semibold text-right">Physical Total</th>
                <th className="py-3 px-4 font-semibold text-right">Reserved (In-Flight)</th>
                <th className="py-3 px-4 font-semibold text-right">Available for Order</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.inventoryId} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.productId}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{item.productName}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="font-medium text-slate-900">{item.warehouseName}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {item.warehouseId}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-amber-600 font-medium">
                    {item.reservedQuantity}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                    {item.availableQuantity}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.availableQuantity <= 2 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                        Critical
                      </span>
                    ) : item.availableQuantity <= 5 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                        Low
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                        Healthy
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setNewQuantity(item.quantity);
                      }}
                      className="px-2.5 py-1 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg font-semibold text-xs"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Adjust Inventory Stock</h3>
                <p className="text-[11px] text-slate-500">
                  {editingItem.productName} @ {editingItem.warehouseName}
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStock} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Currently Reserved:</span>
                  <span className="font-mono font-bold text-amber-600">
                    {editingItem.reservedQuantity} units
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>New Available will be:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {Math.max(0, newQuantity - editingItem.reservedQuantity)} units
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Total Physical Quantity in Warehouse
                </label>
                <input
                  type="number"
                  min={editingItem.reservedQuantity}
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Must be ≥ reserved quantity ({editingItem.reservedQuantity}) to satisfy pending allocations.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-2 border border-slate-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
