import fs from 'fs';
import path from 'path';
import {
  User,
  Warehouse,
  Product,
  Inventory,
  CartItem,
  Order,
  Payment,
  Notification,
} from '../../shared/types.ts';
import {
  seedUsers,
  seedWarehouses,
  seedProducts,
  seedInventory,
  seedOrders,
  seedPayments,
  seedNotifications,
} from './seedData.ts';

export interface DatabaseSchema {
  users: User[];
  warehouses: Warehouse[];
  products: Product[];
  inventory: Inventory[];
  cartItems: CartItem[];
  orders: Order[];
  payments: Payment[];
  notifications: Notification[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ecommerce_db.json');

class DatabaseEngine {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        if (parsed.users && parsed.products && parsed.warehouses && parsed.inventory) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to read existing database file, re-initializing with seed data:', err);
    }

    // Default seeded database
    const initialData: DatabaseSchema = {
      users: [...seedUsers],
      warehouses: [...seedWarehouses],
      products: [...seedProducts],
      inventory: [...seedInventory],
      cartItems: [],
      orders: [...seedOrders],
      payments: [...seedPayments],
      notifications: [...seedNotifications],
    };

    this.saveDataDirect(initialData);
    return initialData;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  public save() {
    this.saveDataDirect(this.data);
  }

  public resetToSeed(): DatabaseSchema {
    this.data = {
      users: [...seedUsers],
      warehouses: [...seedWarehouses],
      products: [...seedProducts],
      inventory: [...seedInventory],
      cartItems: [],
      orders: [...seedOrders],
      payments: [...seedPayments],
      notifications: [...seedNotifications],
    };
    this.save();
    return this.data;
  }

  // --- Users ---
  public getUsers() {
    return this.data.users;
  }

  public getUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  // --- Products ---
  public getProducts() {
    return this.data.products;
  }

  public getProductById(id: string) {
    return this.data.products.find((p) => p.productId === id);
  }

  public addProduct(product: Product) {
    this.data.products.push(product);
    this.save();
    return product;
  }

  public updateProduct(id: string, updates: Partial<Product>) {
    const idx = this.data.products.findIndex((p) => p.productId === id);
    if (idx === -1) return null;
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.products[idx];
  }

  public deleteProduct(id: string) {
    const idx = this.data.products.findIndex((p) => p.productId === id);
    if (idx === -1) return false;
    this.data.products.splice(idx, 1);
    // Also remove related inventory records
    this.data.inventory = this.data.inventory.filter((inv) => inv.productId !== id);
    this.save();
    return true;
  }

  // Sync overall product stock with inventory totals
  public syncProductStock(productId: string) {
    const product = this.getProductById(productId);
    if (!product) return;
    const invRecords = this.data.inventory.filter((inv) => inv.productId === productId);
    const totalAvailable = invRecords.reduce((sum, inv) => sum + (inv.quantity - inv.reservedQuantity), 0);
    product.stockQuantity = Math.max(0, totalAvailable);
    product.updatedAt = new Date().toISOString();
    this.save();
  }

  // --- Warehouses ---
  public getWarehouses() {
    return this.data.warehouses;
  }

  public getWarehouseById(id: string) {
    return this.data.warehouses.find((w) => w.warehouseId === id);
  }

  public addWarehouse(warehouse: Warehouse) {
    this.data.warehouses.push(warehouse);
    this.save();
    return warehouse;
  }

  public updateWarehouse(id: string, updates: Partial<Warehouse>) {
    const idx = this.data.warehouses.findIndex((w) => w.warehouseId === id);
    if (idx === -1) return null;
    this.data.warehouses[idx] = { ...this.data.warehouses[idx], ...updates };
    this.save();
    return this.data.warehouses[idx];
  }

  public deleteWarehouse(id: string) {
    const idx = this.data.warehouses.findIndex((w) => w.warehouseId === id);
    if (idx === -1) return false;
    this.data.warehouses.splice(idx, 1);
    // remove inventory from that warehouse
    this.data.inventory = this.data.inventory.filter((inv) => inv.warehouseId !== id);
    this.save();
    return true;
  }

  // --- Inventory ---
  public getInventory() {
    // Ensure availableQuantity is always synchronized
    return this.data.inventory.map((inv) => ({
      ...inv,
      availableQuantity: Math.max(0, inv.quantity - inv.reservedQuantity),
    }));
  }

  public getInventoryByProductId(productId: string) {
    return this.getInventory().filter((inv) => inv.productId === productId);
  }

  public getInventoryByWarehouseId(warehouseId: string) {
    return this.getInventory().filter((inv) => inv.warehouseId === warehouseId);
  }

  public getInventoryRecord(productId: string, warehouseId: string) {
    return this.data.inventory.find(
      (inv) => inv.productId === productId && inv.warehouseId === warehouseId
    );
  }

  public setInventoryStock(productId: string, warehouseId: string, quantity: number, reservedQuantity = 0) {
    let inv = this.getInventoryRecord(productId, warehouseId);
    if (inv) {
      inv.quantity = quantity;
      inv.reservedQuantity = reservedQuantity;
      inv.availableQuantity = Math.max(0, quantity - reservedQuantity);
      inv.updatedAt = new Date().toISOString();
    } else {
      inv = {
        inventoryId: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId,
        warehouseId,
        quantity,
        reservedQuantity,
        availableQuantity: Math.max(0, quantity - reservedQuantity),
        updatedAt: new Date().toISOString(),
      };
      this.data.inventory.push(inv);
    }
    this.syncProductStock(productId);
    this.save();
    return inv;
  }

  public updateInventoryById(inventoryId: string, updates: Partial<Inventory>) {
    const inv = this.data.inventory.find((i) => i.inventoryId === inventoryId);
    if (!inv) return null;
    if (updates.quantity !== undefined) inv.quantity = updates.quantity;
    if (updates.reservedQuantity !== undefined) inv.reservedQuantity = updates.reservedQuantity;
    inv.availableQuantity = Math.max(0, inv.quantity - inv.reservedQuantity);
    inv.updatedAt = new Date().toISOString();
    this.syncProductStock(inv.productId);
    this.save();
    return inv;
  }

  // --- Cart ---
  public getCart(customerId: string) {
    const items = this.data.cartItems.filter((c) => c.customerId === customerId);
    return items.map((item) => {
      const prod = this.getProductById(item.productId);
      return {
        ...item,
        product: prod,
      };
    });
  }

  public addToCart(customerId: string, productId: string, quantity: number) {
    let item = this.data.cartItems.find(
      (c) => c.customerId === customerId && c.productId === productId
    );
    if (item) {
      item.quantity += quantity;
    } else {
      item = {
        id: `CART-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customerId,
        productId,
        quantity,
        addedAt: new Date().toISOString(),
      };
      this.data.cartItems.push(item);
    }
    this.save();
    return item;
  }

  public updateCartItem(id: string, quantity: number) {
    const item = this.data.cartItems.find((c) => c.id === id);
    if (!item) return null;
    if (quantity <= 0) {
      this.data.cartItems = this.data.cartItems.filter((c) => c.id !== id);
    } else {
      item.quantity = quantity;
    }
    this.save();
    return item;
  }

  public removeCartItem(id: string) {
    const idx = this.data.cartItems.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.data.cartItems.splice(idx, 1);
    this.save();
    return true;
  }

  public clearCart(customerId: string) {
    this.data.cartItems = this.data.cartItems.filter((c) => c.customerId !== customerId);
    this.save();
  }

  // --- Orders ---
  public getOrders() {
    return this.data.orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getOrderById(orderId: string) {
    return this.data.orders.find((o) => o.orderId === orderId);
  }

  public getOrdersByCustomerId(customerId: string) {
    return this.getOrders().filter((o) => o.customerId === customerId);
  }

  public addOrder(order: Order) {
    this.data.orders.unshift(order);
    this.save();
    return order;
  }

  public updateOrder(orderId: string, updates: Partial<Order>) {
    const idx = this.data.orders.findIndex((o) => o.orderId === orderId);
    if (idx === -1) return null;
    this.data.orders[idx] = {
      ...this.data.orders[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.orders[idx];
  }

  // --- Payments ---
  public getPayments() {
    return this.data.payments;
  }

  public getPaymentByOrderId(orderId: string) {
    return this.data.payments.find((p) => p.orderId === orderId);
  }

  public addPayment(payment: Payment) {
    this.data.payments.unshift(payment);
    this.save();
    return payment;
  }

  // --- Notifications ---
  public getNotifications(customerId?: string) {
    if (customerId) {
      return this.data.notifications
        .filter((n) => n.customerId === customerId || n.customerId === 'ALL')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return this.data.notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public addNotification(notification: Omit<Notification, 'notificationId' | 'createdAt'>) {
    const newNotif: Notification = {
      ...notification,
      notificationId: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(newNotif);
    this.save();
    return newNotif;
  }

  public markNotificationAsRead(notificationId: string) {
    const notif = this.data.notifications.find((n) => n.notificationId === notificationId);
    if (!notif) return null;
    notif.isRead = true;
    this.save();
    return notif;
  }

  public markAllNotificationsAsRead(customerId: string) {
    this.data.notifications.forEach((n) => {
      if (n.customerId === customerId || n.customerId === 'ALL') {
        n.isRead = true;
      }
    });
    this.save();
  }
}

export const db = new DatabaseEngine();
