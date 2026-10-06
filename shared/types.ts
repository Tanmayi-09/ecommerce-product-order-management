export type UserRole = 'customer' | 'admin' | 'warehouse_manager';

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
  assignedWarehouseId?: string; // For warehouse_manager
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
  managerName?: string;
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
  sku?: string;
  rating?: number;
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
  | 'PENDING'
  | 'PLACED'
  | 'CONFIRMED'
  | 'PAYMENT_PENDING'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Cash on Delivery';

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
  status?: 'PENDING_PACKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED';
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
  expectedDeliveryDate?: string;
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
  | 'ORDER_PACKED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'STOCK_ALERT'
  | 'WAREHOUSE_ASSIGNED'
  | 'SYSTEM';

export interface Notification {
  notificationId: string;
  customerId: string;
  orderId?: string;
  warehouseId?: string;
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
  deliveredOrders: number;
  cancelledOrders: number;
  warehouseCount: number;
}
