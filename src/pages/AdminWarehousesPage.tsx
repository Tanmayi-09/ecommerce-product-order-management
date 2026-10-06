import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Warehouse } from '../../shared/types.ts';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';

export const AdminWarehousesPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    warehouseName: '',
    location: '',
    capacity: 10000,
    status: 'ACTIVE',
  });

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const res = await api.warehouses.getAll();
      if (res.success) {
        setWarehouses(res.warehouses || []);
      }
    } catch {
      error('Failed to load warehouses.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.warehouses.create(formData);
      if (res.success) {
        success('Warehouse created successfully.');
        setShowAddModal(false);
        setFormData({ warehouseName: '', location: '', capacity: 10000, status: 'ACTIVE' });
        loadWarehouses();
      }
    } catch (err: any) {
      error(err.message || 'Failed to create warehouse.');
    }
  };

  const handleToggleStatus = async (wh: any) => {
    const nextStatus = wh.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.warehouses.update(wh.warehouseId, { status: nextStatus });
      if (res.success) {
        success(`Warehouse ${wh.warehouseId} marked as ${nextStatus}`);
        loadWarehouses();
      }
    } catch {
      error('Failed to update warehouse status');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Regional Fulfillment Warehouses</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage distribution centers that participate in multi-hub stock allocation
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          Add Warehouse Hub
        </button>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {warehouses.map((wh) => (
          <div
            key={wh.warehouseId}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                  {wh.warehouseId}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    wh.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {wh.status}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900">{wh.warehouseName}</h3>
              <p className="text-xs text-slate-500 mt-1">{wh.location}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Available</span>
                  <span className="font-extrabold text-sm text-emerald-600">
                    {wh.availableUnits || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Reserved</span>
                  <span className="font-extrabold text-sm text-amber-600">
                    {wh.reservedUnits || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">SKUs</span>
                  <span className="font-extrabold text-sm text-slate-800">
                    {wh.distinctSkus || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-600 text-[11px]">
                <span>Storage Capacity:</span>
                <span className="font-semibold text-slate-900">
                  {(wh.capacity || 10000).toLocaleString('en-IN')} units
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400">Toggle Operations:</span>
              <button
                onClick={() => handleToggleStatus(wh)}
                className={`text-xs font-semibold px-3 py-1 rounded-xl transition-colors ${
                  wh.status === 'ACTIVE'
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {wh.status === 'ACTIVE' ? 'Set Inactive' : 'Activate Hub'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Warehouse Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add New Warehouse Hub</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Warehouse Name</label>
                <input
                  type="text"
                  required
                  value={formData.warehouseName}
                  onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                  placeholder="e.g. East Hub - Kolkata Center"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Physical Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Salt Lake Sector V, Kolkata, West Bengal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Capacity (Units)</label>
                <input
                  type="number"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
