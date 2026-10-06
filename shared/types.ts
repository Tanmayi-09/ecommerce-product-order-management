export type UserRole = 'customer' | 'admin';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Hashed password
  role: UserRole;
  phone?: string;
  address?: Address;
  createdAt: string;
}

export interface Warehouse {
  warehouseId: string;
  warehouseName: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE';
  capacity?: number;
  createdAt?: string;
}

export interface Product {
  productId: string;
  productName: string;
  description: string;
  category: string;
  price: number;
  image: string;
  stockQuantity: number; // total stock across all active warehouses
  warehouseId?: string; // primary warehouse ID
  status: 'ACTIVE' | 'DISCONTINUED';
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  inventoryId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number; // quantity - reservedQuantity
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  customerId: string;
  productId: string;
  product?: Product;
  quantity: number;
  addedAt: string;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type PaymentMethod = 'UPI' | 'Card' | 'Cash on Delivery';

export interface WarehouseAllocation {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
  warehouseFulfillments?: WarehouseAllocation[];
}

export interface WarehouseFulfillmentDetail {
  warehouseId: string;
  warehouseName: string;
  location: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
}

export interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderItems: OrderItem[];
  totalAmount: number;
  shippingAddress: Address;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  fulfillmentType: 'SINGLE_WAREHOUSE' | 'SPLIT_ORDER';
  fulfillmentDetails: WarehouseFulfillmentDetail[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  paymentId: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId: string;
  paymentDate: string;
  customerEmail?: string;
}

export type NotificationType =
  | 'ORDER_PLACED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'STOCK_ALERT'
  | 'SYSTEM';

export interface Notification {
  notificationId: string;
  customerId: string;
  orderId?: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  pendingOrders: number;
  warehouseCount: number;
}
