import {
  User,
  Product,
  Warehouse,
  Inventory,
  CartItem,
  Order,
  Payment,
  Notification,
  OrderStatus,
  PaymentMethod,
} from '../../shared/types.ts';

const API_BASE = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  [key: string]: any;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: `Server returned non-JSON response (${response.status} ${response.statusText})`,
  }));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: any) =>
      request<{ success: boolean; token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getProfile: () => request<{ success: boolean; user: User }>('/auth/profile'),
  },

  // Products
  products: {
    getAll: (params: { category?: string; search?: string; minPrice?: number; maxPrice?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.category && params.category !== 'All') query.set('category', params.category);
      if (params.search) query.set('search', params.search);
      if (params.minPrice) query.set('minPrice', String(params.minPrice));
      if (params.maxPrice) query.set('maxPrice', String(params.maxPrice));
      const qs = query.toString();
      return request<{ success: boolean; count: number; products: Product[] }>(
        `/products${qs ? `?${qs}` : ''}`
      );
    },
    getById: (id: string) =>
      request<{ success: boolean; product: Product; inventoryBreakdown: any[] }>(`/products/${id}`),
    search: (q: string) =>
      request<{ success: boolean; count: number; products: Product[] }>(
        `/products/search?q=${encodeURIComponent(q)}`
      ),
    create: (productData: any) =>
      request<{ success: boolean; message: string; product: Product }>('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      }),
    update: (id: string, updates: any) =>
      request<{ success: boolean; message: string; product: Product }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/products/${id}`, {
        method: 'DELETE',
      }),
  },

  // Warehouses
  warehouses: {
    getAll: () =>
      request<{ success: boolean; count: number; warehouses: (Warehouse & { totalUnits: number; availableUnits: number; reservedUnits: number; distinctSkus: number })[] }>(
        '/warehouses'
      ),
    getById: (id: string) =>
      request<{ success: boolean; warehouse: Warehouse; inventory: any[] }>(`/warehouses/${id}`),
    create: (data: any) =>
      request<{ success: boolean; message: string; warehouse: Warehouse }>('/warehouses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, updates: any) =>
      request<{ success: boolean; message: string; warehouse: Warehouse }>(`/warehouses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/warehouses/${id}`, {
        method: 'DELETE',
      }),
  },

  // Inventory
  inventory: {
    getAll: () => request<{ success: boolean; count: number; inventory: any[] }>('/inventory'),
    getByProductId: (productId: string) =>
      request<{
        success: boolean;
        productId: string;
        productName: string;
        totalQuantity: number;
        totalReserved: number;
        totalAvailable: number;
        warehouses: any[];
      }>(`/inventory/${productId}`),
    update: (id: string, updates: { quantity?: number; reservedQuantity?: number }) =>
      request<{ success: boolean; message: string; inventory: Inventory }>(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    getLowStock: () =>
      request<{ success: boolean; count: number; lowStockThreshold: number; products: any[] }>(
        '/inventory/low-stock'
      ),
    planAllocation: (items: { productId: string; quantity: number }[]) =>
      request<{
        success: boolean;
        message?: string;
        isSplit: boolean;
        allocations: any[];
        fulfillmentDetails: any[];
      }>('/inventory/plan', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
  },

  // Cart
  cart: {
    get: () =>
      request<{ success: boolean; count: number; items: CartItem[]; subtotal: number }>('/cart'),
    add: (productId: string, quantity = 1) =>
      request<{ success: boolean; message: string; item: CartItem }>('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      }),
    update: (id: string, quantity: number) =>
      request<{ success: boolean; message: string; item: CartItem }>(`/cart/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }),
    remove: (id: string) =>
      request<{ success: boolean; message: string }>(`/cart/${id}`, {
        method: 'DELETE',
      }),
    clear: () => request<{ success: boolean; message: string }>('/cart', { method: 'DELETE' }),
  },

  // Orders
  orders: {
    create: (orderPayload: {
      items?: { productId: string; quantity: number }[];
      shippingAddress?: any;
      paymentMethod?: PaymentMethod;
      notes?: string;
      autoProcessPayment?: boolean;
      simulatePaymentFailure?: boolean;
    }) =>
      request<{ success: boolean; message: string; order: Order; payment: Payment | null }>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      }),
    getAll: () => request<{ success: boolean; count: number; orders: Order[] }>('/orders'),
    getById: (id: string) =>
      request<{ success: boolean; order: Order; payment: Payment | null }>(`/orders/${id}`),
    getByCustomer: (customerId: string) =>
      request<{ success: boolean; count: number; orders: Order[] }>(`/orders/customer/${customerId}`),
    updateStatus: (id: string, status: OrderStatus) =>
      request<{ success: boolean; message: string; order: Order }>(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    cancel: (id: string) =>
      request<{ success: boolean; message: string; order: Order }>(`/orders/${id}/cancel`, {
        method: 'PUT',
      }),
  },

  // Payments
  payments: {
    process: (payload: {
      orderId: string;
      amount: number;
      paymentMethod?: PaymentMethod;
      simulateFail?: boolean;
    }) =>
      request<{ success: boolean; message: string; payment: Payment }>('/payments/process', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getByOrderId: (orderId: string) =>
      request<{ success: boolean; payment: Payment }>(`/payments/${orderId}`),
  },

  // Notifications
  notifications: {
    getAll: () =>
      request<{
        success: boolean;
        unreadCount: number;
        count: number;
        notifications: Notification[];
      }>('/notifications'),
    markRead: (id: string) =>
      request<{ success: boolean; message: string; notification: Notification }>(
        `/notifications/${id}/read`,
        { method: 'PUT' }
      ),
    markAllRead: () =>
      request<{ success: boolean; message: string }>('/notifications/read-all', {
        method: 'PUT',
      }),
  },

  // Admin
  admin: {
    getDashboard: () => request<any>('/admin/dashboard'),
    getCustomers: () => request<{ success: boolean; count: number; customers: any[] }>('/admin/customers'),
    getOrders: () => request<{ success: boolean; count: number; orders: Order[] }>('/admin/orders'),
    getProducts: () => request<{ success: boolean; count: number; products: Product[] }>('/admin/products'),
    getInventory: () => request<{ success: boolean; count: number; inventory: any[] }>('/admin/inventory'),
    resetDatabase: () =>
      request<{ success: boolean; message: string }>('/admin/reset-database', {
        method: 'POST',
      }),
  },

  // AI Assistant
  ai: {
    askAssistant: (query: string, history: { role: string; content: string }[] = []) =>
      request<{
        success: boolean;
        message: string;
        recommendedProducts: Product[];
        suggestedQueries: string[];
      }>('/ai/assistant', {
        method: 'POST',
        body: JSON.stringify({ query, history }),
      }),
  },

  // Health and Testing
  system: {
    health: () => request<any>('/health'),
    runTestSuite: () =>
      request<{
        success: boolean;
        summary: string;
        passRate: string;
        tests: { name: string; category: string; passed: boolean; details: string; durationMs: number }[];
        timestamp: string;
      }>('/system/test-suite'),
  },

  // Direct generic request for the interactive API Explorer
  rawRequest: async (
    method: string,
    endpoint: string,
    body?: any,
    customHeaders?: Record<string, string>
  ) => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const start = performance.now();
    const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: ['GET', 'HEAD'].includes(method) ? undefined : JSON.stringify(body),
      });
      const durationMs = Math.round((performance.now() - start) * 10) / 10;
      const data = await response.json().catch(() => ({ rawText: 'Non-JSON response' }));

      return {
        status: response.status,
        statusText: response.statusText,
        durationMs,
        data,
      };
    } catch (err) {
      const durationMs = Math.round((performance.now() - start) * 10) / 10;
      return {
        status: 0,
        statusText: 'Network Error',
        durationMs,
        data: { error: err instanceof Error ? err.message : String(err) },
      };
    }
  },
};
