import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';
import { requireAdmin } from '../middleware/auth.ts';
import { WarehouseService } from '../services/warehouseService.ts';

const router = Router();

// GET /api/inventory/low-stock
router.get('/low-stock', (_req: Request, res: Response) => {
  const LOW_STOCK_THRESHOLD = 5;
  const products = db.getProducts();
  const lowStockProducts = products
    .filter((p) => p.stockQuantity <= LOW_STOCK_THRESHOLD)
    .map((p) => {
      const warehouseDistribution = db.getInventoryByProductId(p.productId).map((inv) => {
        const wh = db.getWarehouseById(inv.warehouseId);
        return {
          warehouseId: inv.warehouseId,
          warehouseName: wh ? wh.warehouseName : 'Unknown',
          quantity: inv.quantity,
          availableQuantity: inv.availableQuantity,
        };
      });

      return {
        ...p,
        threshold: LOW_STOCK_THRESHOLD,
        isCriticallyLow: p.stockQuantity <= 2,
        warehouses: warehouseDistribution,
      };
    });

  res.status(200).json({
    success: true,
    count: lowStockProducts.length,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    products: lowStockProducts,
  });
});

// GET /api/inventory
router.get('/', (_req: Request, res: Response) => {
  const inventory = db.getInventory();
  const enriched = inventory.map((inv) => {
    const prod = db.getProductById(inv.productId);
    const wh = db.getWarehouseById(inv.warehouseId);
    return {
      ...inv,
      productName: prod ? prod.productName : 'Unknown Product',
      category: prod ? prod.category : 'N/A',
      price: prod ? prod.price : 0,
      warehouseName: wh ? wh.warehouseName : 'Unknown Warehouse',
      warehouseLocation: wh ? wh.location : 'N/A',
    };
  });

  res.status(200).json({
    success: true,
    count: enriched.length,
    inventory: enriched,
  });
});

// GET /api/inventory/:productId
router.get('/:productId', (req: Request, res: Response) => {
  const { productId } = req.params;
  const records = db.getInventoryByProductId(productId);
  const prod = db.getProductById(productId);

  const enriched = records.map((inv) => {
    const wh = db.getWarehouseById(inv.warehouseId);
    return {
      ...inv,
      warehouseName: wh ? wh.warehouseName : 'Unknown Warehouse',
      warehouseLocation: wh ? wh.location : 'N/A',
      warehouseStatus: wh ? wh.status : 'INACTIVE',
    };
  });

  const totalQuantity = records.reduce((s, r) => s + r.quantity, 0);
  const totalReserved = records.reduce((s, r) => s + r.reservedQuantity, 0);
  const totalAvailable = records.reduce((s, r) => s + r.availableQuantity, 0);

  res.status(200).json({
    success: true,
    productId,
    productName: prod ? prod.productName : 'Unknown Product',
    totalQuantity,
    totalReserved,
    totalAvailable,
    warehouses: enriched,
  });
});

// PUT /api/inventory/:id (Admin only)
router.put('/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity, reservedQuantity } = req.body;

  if (quantity === undefined && reservedQuantity === undefined) {
    res.status(400).json({
      success: false,
      message: 'Quantity or reservedQuantity must be provided.',
    });
    return;
  }

  const updates: { quantity?: number; reservedQuantity?: number } = {};
  if (quantity !== undefined) {
    const q = Number(quantity);
    if (isNaN(q) || q < 0) {
      res.status(400).json({ success: false, message: 'Quantity must be a non-negative number.' });
      return;
    }
    updates.quantity = q;
  }

  if (reservedQuantity !== undefined) {
    const r = Number(reservedQuantity);
    if (isNaN(r) || r < 0) {
      res.status(400).json({
        success: false,
        message: 'Reserved quantity must be a non-negative number.',
      });
      return;
    }
    updates.reservedQuantity = r;
  }

  const updated = db.updateInventoryById(id, updates);
  if (!updated) {
    res.status(404).json({
      success: false,
      message: `Inventory record '${id}' not found.`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Inventory updated successfully.',
    inventory: updated,
  });
});

// POST /api/inventory/plan - Test / preview multi-warehouse allocation
router.post('/plan', (req: Request, res: Response) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Items array with { productId, quantity } required.',
    });
    return;
  }

  const plan = WarehouseService.planAllocation(items);

  res.status(plan.success ? 200 : 400).json(plan);
});

export default router;
