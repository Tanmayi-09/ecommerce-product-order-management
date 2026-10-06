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

export default router;
