import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, SlidersHorizontal, AlertCircle, ArrowUpDown } from 'lucide-react';
import { Product } from '../../shared/types.ts';
import { api } from '../services/api.ts';
import { useCart } from '../context/CartContext.tsx';

interface ProductsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'stock'>('featured');
  const { addToCart } = useCart();

  const categories = [
    'All',
    'Electronics',
    'Laptops',
    'Mobiles',
    'Accessories',
    'Home Appliances',
  ];

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, search]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.products.getAll({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: search.trim() || undefined,
      });
      if (res.success) {
        setProducts(res.products || []);
      }
    } catch (err) {
      console.warn('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort client-side for ultra-fast response
  let displayed = [...products];

  if (inStockOnly) {
    displayed = displayed.filter((p) => p.stockQuantity > 0);
  }

  if (sortBy === 'price-asc') {
    displayed.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    displayed.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'stock') {
    displayed.sort((a, b) => b.stockQuantity - a.stockQuantity);
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Search */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time inventory routed across 3 fulfillment hubs
          </p>
        </div>

        {/* Search input */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, category, specs..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Category pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort & In-stock toggles */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            In Stock Only
          </label>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs focus:outline-none pr-1"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock">Highest Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 h-72 animate-pulse space-y-3">
              <div className="bg-slate-200 h-40 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No products found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search keywords or clearing the category filters.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setInStockOnly(false);
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayed.map((product) => (
            <div
              key={product.productId}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Product Image */}
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

                {product.stockQuantity <= 3 ? (
                  <span className="absolute top-2.5 right-2.5 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    Only {product.stockQuantity} Left!
                  </span>
                ) : (
                  <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {product.stockQuantity} in stock
                  </span>
                )}
              </div>

              {/* Product Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-600 block mb-0.5">
                    ID: {product.productId}
                  </span>
                  <h3
                    onClick={() => onNavigate('product-detail', { productId: product.productId })}
                    className="font-bold text-sm text-slate-900 hover:text-indigo-600 cursor-pointer line-clamp-1"
                  >
                    {product.productName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-600 uppercase font-medium block">
                      Price
                    </span>
                    <span className="font-extrabold text-base text-slate-900">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onNavigate('product-detail', { productId: product.productId })}
                      className="text-xs text-slate-600 hover:text-indigo-600 font-medium px-2 py-1.5"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => addToCart(product.productId, 1)}
                      disabled={product.stockQuantity <= 0}
                      className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-sm"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
