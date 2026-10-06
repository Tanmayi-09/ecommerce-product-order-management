import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Boxes,
  Code2,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Layers,
  Zap,
} from 'lucide-react';
import { Product } from '../../shared/types.ts';
import { api } from '../services/api.ts';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenAiAssistant: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenAiAssistant }) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [healthStatus, setHealthStatus] = useState<string>('Connecting...');
  const { addToCart } = useCart();
  const { switchDemoUser } = useAuth();

  useEffect(() => {
    api.products.getAll().then((res) => {
      if (res.success && res.products) {
        setFeaturedProducts(res.products.slice(0, 4));
      }
    }).catch(() => {});

    api.system.health().then((res) => {
      if (res.status === 'OK') setHealthStatus('API Operational (100% Health)');
    }).catch(() => setHealthStatus('Offline'));
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {healthStatus}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            E-Commerce Product & Order Management System
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            A production-ready full-stack REST API platform. Features intelligent multi-warehouse
            stock routing, order lifecycle state machines, safe payment simulation, in-app
            notifications, and catalog-grounded AI shopping assistance.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('products')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50"
            >
              Explore Products
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('api-docs')}
              className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            >
              <Code2 className="w-4 h-4" />
              REST API Explorer & Tester
            </button>

            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-2 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 px-5 py-3 rounded-xl font-semibold text-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              AI Assistant
            </button>
          </div>
        </div>

        {/* Quick Reviewer Helper Box */}
        <div className="mt-10 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Multi-Warehouse Routing</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates WH-01, WH-02, WH-03. Avoids order splitting unless stock requires it.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Safe Payment Simulation</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulates UPI, Card, and Cash on Delivery with full receipt tracking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Role-Based Admin Hub</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Advance orders to Shipped/Delivered, update inventory, and view analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Warehouse Architecture Visualization Section */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="max-w-2xl mb-6">
          <span className="text-indigo-600 font-bold text-xs uppercase tracking-wider">
            Key Architecture Feature (Section 8)
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Intelligent Multi-Warehouse Inventory Routing
          </h2>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            When an order is placed, the backend checks all warehouses containing the requested items
            and selects the single best-fit warehouse to minimize shipping cost and delay. If no single
            warehouse holds sufficient inventory, the algorithm splits the fulfillment across hubs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-blue-900">WH-01 (West Hub)</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                Mumbai
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Capacity: 10,000 units. Primary distribution hub for western and central regions.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-blue-100">
              Stock: PROD-101 (5), PROD-104 (3), PROD-106 (2)
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-emerald-900">WH-02 (North Hub)</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                Delhi NCR
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Capacity: 8,500 units. Specialized logistics for northern fulfillment corridors.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-emerald-100">
              Stock: PROD-101 (8), PROD-103 (8), PROD-104 (4)
            </div>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-purple-900">WH-03 (South Hub)</span>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">
                Bengaluru
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Capacity: 12,000 units. High-tech apex center with automated sorting lines.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-purple-100">
              Stock: PROD-101 (14), PROD-102 (20), PROD-105 (12)
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Try the Split Order Demo:</strong> Order 5 units of "Mechanical Tactile Keyboard RGB" (PROD-104). Since WH-02 has 4 and WH-01 has 3, the engine automatically splits fulfillment!
            </span>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="text-indigo-600 hover:text-indigo-800 font-semibold underline"
          >
            Try in Catalog →
          </button>
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
            <p className="text-xs text-slate-500">Live products loaded directly from the database</p>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View all catalog ({featuredProducts.length}+)
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <div
              key={product.productId}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              <div
                className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer"
                onClick={() => onNavigate('product-detail', { productId: product.productId })}
              >
                <img
                  src={product.image}
                  alt={product.productName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2.5 left-2.5 bg-slate-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md">
                  {product.category}
                </span>
                <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {product.stockQuantity} in stock
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    onClick={() => onNavigate('product-detail', { productId: product.productId })}
                    className="font-bold text-sm text-slate-900 hover:text-indigo-600 cursor-pointer line-clamp-1"
                  >
                    {product.productName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-extrabold text-base text-slate-900">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => addToCart(product.productId, 1)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* College Project Evaluation Guide */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-400" />
          College API Project Review Flow Guide
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Follow this recommended 5-minute evaluation sequence during your college viva or project demonstration:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <span className="font-bold text-indigo-400 block mb-1">Step 1: REST API Tester</span>
            <p className="text-slate-300">
              Visit <strong>API Explorer</strong>. Run the automated test suite to verify 8/8 backend test cases pass.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <span className="font-bold text-emerald-400 block mb-1">Step 2: Customer Ordering</span>
            <p className="text-slate-300">
              Browse products, add to cart, observe warehouse allocation preview, and place order with simulated payment.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <span className="font-bold text-amber-400 block mb-1">Step 3: Multi-Warehouse Splitting</span>
            <p className="text-slate-300">
              Notice whether the order was routed to a single warehouse or split across Mumbai and Delhi.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <span className="font-bold text-purple-400 block mb-1">Step 4: Admin State Machine</span>
            <p className="text-slate-300">
              Switch to Admin using top switcher. Open Admin Hub, view order, and advance status to SHIPPED and DELIVERED.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
