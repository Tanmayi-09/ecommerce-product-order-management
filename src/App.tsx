import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';

import { DemoSwitcher } from './components/DemoSwitcher.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminSidebar } from './components/AdminSidebar.tsx';
import { AiShoppingModal } from './components/AiShoppingModal.tsx';

// Customer Pages
import { HomePage } from './pages/HomePage.tsx';
import { ProductsPage } from './pages/ProductsPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { CartPage } from './pages/CartPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { MyOrdersPage } from './pages/MyOrdersPage.tsx';
import { OrderDetailPage } from './pages/OrderDetailPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { ApiDocsPage } from './pages/ApiDocsPage.tsx';
import { WarehouseManagerPage } from './pages/WarehouseManagerPage.tsx';

// Admin Pages
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { AdminOrdersPage } from './pages/AdminOrdersPage.tsx';
import { AdminProductsPage } from './pages/AdminProductsPage.tsx';
import { AdminWarehousesPage } from './pages/AdminWarehousesPage.tsx';
import { AdminInventoryPage } from './pages/AdminInventoryPage.tsx';
import { AdminCustomersPage } from './pages/AdminCustomersPage.tsx';

function MainLayout() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParams, setPageParams] = useState<any>({});
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const { isAdmin } = useAuth();

  const handleNavigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminSection = currentPage.startsWith('admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* 1. Reviewer Demo Account Switcher Bar */}
      <DemoSwitcher />

      {/* 2. Top Header Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
      />

      {/* 3. Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdminSection ? (
          <div className="flex flex-col lg:flex-row gap-8">
            <AdminSidebar
              currentTab={currentPage}
              onSelectTab={(tab) => handleNavigate(tab)}
              onNavigateHome={() => handleNavigate('home')}
            />
            <div className="flex-1 min-w-0">
              {currentPage === 'admin-dashboard' && (
                <AdminDashboardPage onNavigate={handleNavigate} />
              )}
              {currentPage === 'admin-orders' && (
                <AdminOrdersPage onNavigate={handleNavigate} />
              )}
              {currentPage === 'admin-products' && <AdminProductsPage />}
              {currentPage === 'admin-warehouses' && <AdminWarehousesPage />}
              {currentPage === 'admin-inventory' && <AdminInventoryPage />}
              {currentPage === 'admin-customers' && <AdminCustomersPage />}
            </div>
          </div>
        ) : (
          <>
            {currentPage === 'home' && (
              <HomePage
                onNavigate={handleNavigate}
                onOpenAiAssistant={() => setIsAiModalOpen(true)}
              />
            )}
            {currentPage === 'products' && (
              <ProductsPage onNavigate={handleNavigate} />
            )}
            {currentPage === 'product-detail' && (
              <ProductDetailPage
                productId={pageParams.productId || 'PROD-101'}
                onNavigate={handleNavigate}
              />
            )}
            {currentPage === 'cart' && <CartPage onNavigate={handleNavigate} />}
            {currentPage === 'checkout' && (
              <CheckoutPage onNavigate={handleNavigate} />
            )}
            {currentPage === 'orders' && (
              <MyOrdersPage onNavigate={handleNavigate} />
            )}
            {currentPage === 'order-detail' && (
              <OrderDetailPage
                orderId={pageParams.orderId || 'ORD-9821'}
                onNavigate={handleNavigate}
              />
            )}
            {currentPage === 'profile' && (
              <ProfilePage onNavigate={handleNavigate} />
            )}
            {currentPage === 'login' && (
              <LoginPage onNavigate={handleNavigate} />
            )}
            {currentPage === 'register' && (
              <RegisterPage onNavigate={handleNavigate} />
            )}
            {currentPage === 'api-docs' && <ApiDocsPage />}
            {currentPage === 'warehouse-manager' && (
              <WarehouseManagerPage onNavigate={handleNavigate} />
            )}
          </>
        )}
      </main>

      {/* 4. Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* 5. Grounded AI Shopping Assistant Modal */}
      <AiShoppingModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onViewProduct={(id) => handleNavigate('product-detail', { productId: id })}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <MainLayout />
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
