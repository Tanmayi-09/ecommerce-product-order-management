import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShoppingCart,
  Zap,
  Building2,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Product } from '../../shared/types.ts';
import { api } from '../services/api.ts';
import { useCart } from '../context/CartContext.tsx';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigate,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [inventoryBreakdown, setInventoryBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await api.products.getById(productId);
      if (res.success) {
        setProduct(res.product);
        setInventoryBreakdown(res.inventoryBreakdown || []);
      }
    } catch (err) {
      console.warn('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <p className="text-slate-600">Product not found.</p>
        <button
          onClick={() => onNavigate('products')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const handleBuyNow = async () => {
    const success = await addToCart(product.productId, quantity);
    if (success) {
      onNavigate('checkout');
    }
  };

  // Check if quantity fits into a single warehouse
  const singleWarehouseCandidate = inventoryBreakdown.find(
    (wh) => wh.availableQuantity >= quantity
  );
  const willSplit = !singleWarehouseCandidate && product.stockQuantity >= quantity;

  return (
    <div className="space-y-8 pb-16">
      {/* Back button */}
      <button
        onClick={() => onNavigate('products')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </button>

      {/* Main product overview */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-10">
        {/* Left: Product Image */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 aspect-square max-h-[480px]">
          <img
            src={product.image}
            alt={product.productName}
            className="w-full h-full object-cover"
          />
          <span className="absolute top-4 left-4 bg-slate-900/80 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-md">
            {product.category}
          </span>
          <span className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            SKU: {product.productId}
          </span>
        </div>

        {/* Right: Info & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                {product.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                {product.productName}
              </h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Inclusive of all taxes & simulated GST
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>

            {/* Warehouse Routing Forecast Notice */}
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                product.stockQuantity <= 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : willSplit
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {product.stockQuantity <= 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Out of Stock:</strong> No active warehouse currently has available inventory for this product.
                  </div>
                </>
              ) : willSplit ? (
                <>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Multi-Warehouse Fulfillment Required:</strong> Selected quantity ({quantity}) exceeds single-warehouse capacity. The system will intelligently split and dispatch from multiple hubs.
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Single-Warehouse Fulfillment:</strong> Full quantity ({quantity}) will be fulfilled directly from{' '}
                    <strong>{singleWarehouseCandidate?.warehouseName}</strong> without splitting.
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-bold text-slate-900 bg-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="px-3 py-1.5 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                  disabled={quantity >= product.stockQuantity}
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-500">
                ({product.stockQuantity} available total)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => addToCart(product.productId, quantity)}
                disabled={product.stockQuantity <= 0}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stockQuantity <= 0}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                Instant Buy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Warehouse Stock Breakdown Table (Key College Project Requirement) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Live Multi-Warehouse Inventory Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Verified physical units stored across registered regional hubs
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Warehouse Hub</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold text-right">Physical Total</th>
                <th className="py-3 px-4 font-semibold text-right">Reserved (In-Flight)</th>
                <th className="py-3 px-4 font-semibold text-right">Available for Order</th>
                <th className="py-3 px-4 font-semibold text-center">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventoryBreakdown.map((wh) => (
                <tr key={wh.warehouseId} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    {wh.warehouseName}
                    <span className="text-[10px] font-mono text-slate-600">({wh.warehouseId})</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{wh.location}</td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-800">{wh.quantity} units</td>
                  <td className="py-3.5 px-4 text-right text-amber-600 font-medium">{wh.reservedQuantity} units</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{wh.availableQuantity} units</td>
                  <td className="py-3.5 px-4 text-center">
                    {wh.availableQuantity >= quantity ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-[10px]">
                        Can Fulfill ({quantity} req)
                      </span>
                    ) : wh.availableQuantity > 0 ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-semibold text-[10px]">
                        Partial ({wh.availableQuantity} avail)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium text-[10px]">
                        No Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
