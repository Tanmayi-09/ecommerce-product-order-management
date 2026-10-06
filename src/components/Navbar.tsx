import React, { useState } from 'react';
import {
  ShoppingBag,
  ShoppingCart,
  Bell,
  Code2,
  Sparkles,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  Package,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  onOpenAiAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenAiAssistant,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base sm:text-lg leading-tight tracking-tight">
                Nexus Commerce
              </div>
              <div className="text-[10px] text-slate-700 font-medium tracking-tight">
                API-Based Product & Order System
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'home'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('products')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'products'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => onNavigate('orders')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'orders' || currentPage === 'order-detail'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              My Orders
            </button>
            <button
              onClick={() => onNavigate('api-docs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                currentPage === 'api-docs'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-emerald-700 hover:bg-emerald-50/70'
              }`}
            >
              <Code2 className="w-4 h-4" />
              API Explorer
              <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full uppercase">
                REST
              </span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage.startsWith('admin')
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                Admin Hub
              </button>
            )}
          </nav>

          {/* Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Assistant Button */}
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
              title="Open Catalog AI Assistant"
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.notificationId}
                          onClick={() => {
                            markAsRead(n.notificationId);
                            if (n.orderId) {
                              onNavigate('order-detail', { orderId: n.orderId });
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                            !n.isRead ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                              !n.isRead ? 'bg-indigo-600' : 'bg-transparent'
                            }`}
                          />
                          <div className="flex-1">
                            <p className="text-slate-800 font-medium leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-600 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              • {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Shopping Cart */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[90px]">
                    {user?.name || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase font-medium">
                    {user?.role || 'Guest'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 hidden md:inline" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 py-1.5 text-sm">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-600 truncate">{user?.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 text-xs"
                  >
                    <UserIcon className="w-4 h-4 text-slate-600" />
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('orders');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 text-xs"
                  >
                    <Package className="w-4 h-4 text-slate-600" />
                    Order History
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        onNavigate('admin-dashboard');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-purple-50 flex items-center gap-2 text-purple-700 text-xs font-medium"
                    >
                      <Layers className="w-4 h-4" />
                      Admin Dashboard
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      onNavigate('home');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 text-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('products');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700"
          >
            Products
          </button>
          <button
            onClick={() => {
              onNavigate('orders');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700"
          >
            My Orders
          </button>
          <button
            onClick={() => {
              onNavigate('api-docs');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-50 text-emerald-700 flex items-center justify-between"
          >
            <span>API Documentation & Tester</span>
            <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              REST
            </span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('admin-dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 text-purple-700"
            >
              Admin Dashboard
            </button>
          )}
        </div>
      )}
    </header>
  );
};
