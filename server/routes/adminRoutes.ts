import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/admin/dashboard - Aggregated stats and chart data
router.get('/dashboard', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  const customers = users.filter((u) => u.role === 'customer');
  const products = db.getProducts();
  const orders = db.getOrders();
  const warehouses = db.getWarehouses();
  const inventory = db.getInventory();

  // Metrics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'SUCCESS')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrders = orders.filter(
    (o) => o.orderStatus === 'PLACED' || o.orderStatus === 'PROCESSING'
  ).length;

  const lowStockProducts = products.filter((p) => p.stockQuantity <= 5).length;

  // Chart 1: Order Status Breakdown
  const orderStatusCounts: Record<string, number> = {
    PLACED: 0,
    CONFIRMED: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
  orders.forEach((o) => {
    if (orderStatusCounts[o.orderStatus] !== undefined) {
      orderStatusCounts[o.orderStatus]++;
    }
  });

  // Chart 2: Category distribution
  const categoryCounts: Record<string, { count: number; totalStock: number }> = {};
  products.forEach((p) => {
    if (!categoryCounts[p.category]) {
      categoryCounts[p.category] = { count: 0, totalStock: 0 };
    }
    categoryCounts[p.category].count++;
    categoryCounts[p.category].totalStock += p.stockQuantity;
  });

  // Chart 3: Warehouse Stock Distribution
  const warehouseDistribution = warehouses.map((wh) => {
    const whInv = inventory.filter((i) => i.warehouseId === wh.warehouseId);
    const available = whInv.reduce((sum, i) => sum + i.availableQuantity, 0);
    const reserved = whInv.reduce((sum, i) => sum + i.reservedQuantity, 0);
    return {
      warehouseId: wh.warehouseId,
      warehouseName: wh.warehouseName,
      location: wh.location,
      availableStock: available,
      reservedStock: reserved,
      totalStock: available + reserved,
    };
  });

  // Chart 4: Recent revenue / fulfillment splits
  const splitOrdersCount = orders.filter((o) => o.fulfillmentType === 'SPLIT_ORDER').length;
  const singleWarehouseOrdersCount = orders.filter((o) => o.fulfillmentType === 'SINGLE_WAREHOUSE').length;

  res.status(200).json({
    success: true,
    stats: {
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      lowStockProducts,
      pendingOrders,
      warehouseCount: warehouses.length,
      splitOrdersCount,
      singleWarehouseOrdersCount,
    },
    charts: {
      orderStatus: orderStatusCounts,
      categories: categoryCounts,
      warehouses: warehouseDistribution,
      fulfillmentSplit: {
        singleWarehouse: singleWarehouseOrdersCount,
        splitOrder: splitOrdersCount,
      },
    },
    recentOrders: orders.slice(0, 5),
    lowStockAlerts: products.filter((p) => p.stockQuantity <= 5),
  });
});

// GET /api/admin/customers
router.get('/customers', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  const orders = db.getOrders();

  const customers = users
    .filter((u) => u.role === 'customer')
    .map((u) => {
      const userOrders = orders.filter((o) => o.customerId === u.id);
      const totalSpent = userOrders
        .filter((o) => o.paymentStatus === 'SUCCESS')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      const { password: _, ...customerData } = u;

      return {
        ...customerData,
        orderCount: userOrders.length,
        totalSpent,
      };
    });

  res.status(200).json({
    success: true,
    count: customers.length,
    customers,
  });
});

// GET /api/admin/orders
router.get('/orders', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const orders = db.getOrders();
  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

// GET /api/admin/products
router.get('/products', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const products = db.getProducts();
  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

// GET /api/admin/inventory
router.get('/inventory', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const inventory = db.getInventory();
  const enriched = inventory.map((inv) => {
    const prod = db.getProductById(inv.productId);
    const wh = db.getWarehouseById(inv.warehouseId);
    return {
      ...inv,
      productName: prod ? prod.productName : 'Unknown',
      category: prod ? prod.category : 'N/A',
      warehouseName: wh ? wh.warehouseName : 'Unknown',
    };
  });

  res.status(200).json({
    success: true,
    count: enriched.length,
    inventory: enriched,
  });
});

// POST /api/admin/reset-database
router.post('/reset-database', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  db.resetToSeed();
  res.status(200).json({
    success: true,
    message: 'Database has been successfully reset to initial demo seeds.',
  });
});

export default router;
