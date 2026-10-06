import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';
import { requireAdmin } from '../middleware/auth.ts';
import { Warehouse } from '../../shared/types.ts';

const router = Router();

// GET /api/warehouses
router.get('/', (_req: Request, res: Response) => {
  const warehouses = db.getWarehouses();
  // enrich with stock statistics
  const inventory = db.getInventory();
  const enriched = warehouses.map((wh) => {
    const whInv = inventory.filter((i) => i.warehouseId === wh.warehouseId);
    const totalUnits = whInv.reduce((sum, i) => sum + i.quantity, 0);
    const availableUnits = whInv.reduce((sum, i) => sum + i.availableQuantity, 0);
    const reservedUnits = whInv.reduce((sum, i) => sum + i.reservedQuantity, 0);
    const distinctSkus = whInv.length;

    return {
      ...wh,
      totalUnits,
      availableUnits,
      reservedUnits,
      distinctSkus,
    };
  });

  res.status(200).json({
    success: true,
    count: enriched.length,
    warehouses: enriched,
  });
});

// GET /api/warehouses/:id
router.get('/:id', (req: Request, res: Response) => {
  const warehouse = db.getWarehouseById(req.params.id);
  if (!warehouse) {
    res.status(404).json({
      success: false,
      message: `Warehouse with ID '${req.params.id}' not found.`,
    });
    return;
  }

  const warehouseInventory = db.getInventoryByWarehouseId(warehouse.warehouseId).map((inv) => {
    const prod = db.getProductById(inv.productId);
    return {
      ...inv,
      productName: prod ? prod.productName : 'Unknown Product',
      category: prod ? prod.category : 'N/A',
      price: prod ? prod.price : 0,
    };
  });

  res.status(200).json({
    success: true,
    warehouse,
    inventory: warehouseInventory,
  });
});

// POST /api/warehouses (Admin only)
router.post('/', requireAdmin, (req: Request, res: Response) => {
  const { warehouseName, location, capacity, status } = req.body;

  if (!warehouseName || !location) {
    res.status(400).json({
      success: false,
      message: 'Warehouse name and location are required.',
    });
    return;
  }

  const warehouseId = `WH-${(db.getWarehouses().length + 1).toString().padStart(2, '0')}`;
  const newWarehouse: Warehouse = {
    warehouseId,
    warehouseName,
    location,
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    capacity: Number(capacity) || 10000,
    createdAt: new Date().toISOString(),
  };

  db.addWarehouse(newWarehouse);

  res.status(201).json({
    success: true,
    message: 'Warehouse created successfully.',
    warehouse: newWarehouse,
  });
});

// PUT /api/warehouses/:id (Admin only)
router.put('/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const wh = db.getWarehouseById(id);

  if (!wh) {
    res.status(404).json({
      success: false,
      message: `Warehouse with ID '${id}' not found.`,
    });
    return;
  }

  const updates: Partial<Warehouse> = {};
  if (req.body.warehouseName !== undefined) updates.warehouseName = req.body.warehouseName;
  if (req.body.location !== undefined) updates.location = req.body.location;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.capacity !== undefined) updates.capacity = Number(req.body.capacity);

  const updated = db.updateWarehouse(id, updates);

  res.status(200).json({
    success: true,
    message: 'Warehouse updated successfully.',
    warehouse: updated,
  });
});

// DELETE /api/warehouses/:id (Admin only)
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deleteWarehouse(id);

  if (!success) {
    res.status(404).json({
      success: false,
      message: `Warehouse with ID '${id}' not found.`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: `Warehouse '${id}' deleted successfully.`,
  });
});

// GET /api/warehouses/:id/orders - Get orders assigned to a specific warehouse
router.get('/:id/orders', (req: Request, res: Response) => {
  const { id } = req.params;
  const allOrders = db.getOrders();

  // Find orders where this warehouse participates in fulfillment
  const assignedOrders = allOrders.filter((o) =>
    o.fulfillmentDetails?.some((f) => f.warehouseId === id)
  );

  res.status(200).json({
    success: true,
    count: assignedOrders.length,
    warehouseId: id,
    orders: assignedOrders,
  });
});

// PUT /api/warehouses/:id/fulfillments/:orderId/pack - Warehouse Manager packs order
router.put('/:id/fulfillments/:orderId/pack', (req: Request, res: Response) => {
  const { id, orderId } = req.params;
  const order = db.getOrderById(orderId);

  if (!order) {
    res.status(404).json({ success: false, message: `Order ${orderId} not found.` });
    return;
  }

  const fulfillment = order.fulfillmentDetails?.find((f) => f.warehouseId === id);
  if (!fulfillment) {
    res.status(404).json({ success: false, message: `Warehouse ${id} is not assigned to order ${orderId}.` });
    return;
  }

  fulfillment.status = 'PACKED';

  // Check if all fulfillment legs are now packed
  const allPacked = order.fulfillmentDetails.every((f) => f.status === 'PACKED' || f.status === 'SHIPPED' || f.status === 'DELIVERED');
  if (allPacked && order.orderStatus !== 'SHIPPED' && order.orderStatus !== 'DELIVERED') {
    order.orderStatus = 'PACKED';
  }

  order.updatedAt = new Date().toISOString();
  db.save();

  db.addNotification({
    customerId: order.customerId,
    orderId: order.orderId,
    warehouseId: id,
    message: `Warehouse ${fulfillment.warehouseName} has PACKED your items for order ${order.orderId}.`,
    type: 'ORDER_PACKED',
    isRead: false,
  });

  res.status(200).json({
    success: true,
    message: `Order ${orderId} marked as PACKED by warehouse ${id}.`,
    order,
  });
});

// PUT /api/warehouses/:id/fulfillments/:orderId/ship - Warehouse Manager dispatches order
router.put('/:id/fulfillments/:orderId/ship', (req: Request, res: Response) => {
  const { id, orderId } = req.params;
  const order = db.getOrderById(orderId);

  if (!order) {
    res.status(404).json({ success: false, message: `Order ${orderId} not found.` });
    return;
  }

  const fulfillment = order.fulfillmentDetails?.find((f) => f.warehouseId === id);
  if (!fulfillment) {
    res.status(404).json({ success: false, message: `Warehouse ${id} is not assigned to order ${orderId}.` });
    return;
  }

  fulfillment.status = 'SHIPPED';

  // Check if all legs are shipped
  const allShipped = order.fulfillmentDetails.every((f) => f.status === 'SHIPPED' || f.status === 'DELIVERED');
  if (allShipped && order.orderStatus !== 'DELIVERED') {
    order.orderStatus = 'SHIPPED';
  }

  order.updatedAt = new Date().toISOString();
  db.save();

  db.addNotification({
    customerId: order.customerId,
    orderId: order.orderId,
    warehouseId: id,
    message: `Your package from ${fulfillment.warehouseName} has been SHIPPED (Order: ${order.orderId}).`,
    type: 'ORDER_SHIPPED',
    isRead: false,
  });

  res.status(200).json({
    success: true,
    message: `Order ${orderId} marked as SHIPPED by warehouse ${id}.`,
    order,
  });
});

// PUT /api/warehouses/:id/stock/:productId - Warehouse Manager updates stock
router.put('/:id/stock/:productId', (req: Request, res: Response) => {
  const { id, productId } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || Number(quantity) < 0) {
    res.status(400).json({ success: false, message: 'Valid positive quantity required.' });
    return;
  }

  const inv = db.getInventoryRecord(productId, id);
  const reserved = inv ? inv.reservedQuantity : 0;
  const updatedInv = db.setInventoryStock(productId, id, Number(quantity), reserved);

  res.status(200).json({
    success: true,
    message: `Stock updated for ${productId} at warehouse ${id}.`,
    inventory: updatedInv,
  });
});

export default router;
