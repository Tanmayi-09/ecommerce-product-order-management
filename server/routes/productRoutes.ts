import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';
import { requireAdmin } from '../middleware/auth.ts';
import { Product } from '../../shared/types.ts';

const router = Router();

// GET /api/products/search?q=...
router.get('/search', (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  const products = db.getProducts();

  if (!query) {
    res.status(200).json({ success: true, count: products.length, products });
    return;
  }

  const results = products.filter(
    (p) =>
      p.productName.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
  );

  res.status(200).json({
    success: true,
    count: results.length,
    products: results,
  });
});

// GET /api/products
router.get('/', (req: Request, res: Response) => {
  let products = db.getProducts();

  const { category, search, minPrice, maxPrice, status } = req.query;

  if (status) {
    products = products.filter((p) => p.status === status);
  }

  if (category && category !== 'All') {
    products = products.filter(
      (p) => p.category.toLowerCase() === String(category).toLowerCase()
    );
  }

  if (search) {
    const q = String(search).toLowerCase();
    products = products.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  if (minPrice) {
    const min = Number(minPrice);
    if (!isNaN(min)) {
      products = products.filter((p) => p.price >= min);
    }
  }

  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) {
      products = products.filter((p) => p.price <= max);
    }
  }

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

// GET /api/products/:id
router.get('/:id', (req: Request, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    res.status(404).json({
      success: false,
      message: `Product with ID '${req.params.id}' not found.`,
    });
    return;
  }

  // Also include warehouse breakdown for product details view
  const warehouseBreakdown = db.getInventoryByProductId(product.productId).map((inv) => {
    const wh = db.getWarehouseById(inv.warehouseId);
    return {
      warehouseId: inv.warehouseId,
      warehouseName: wh ? wh.warehouseName : 'Unknown Warehouse',
      location: wh ? wh.location : 'Unknown Location',
      quantity: inv.quantity,
      reservedQuantity: inv.reservedQuantity,
      availableQuantity: inv.availableQuantity,
    };
  });

  res.status(200).json({
    success: true,
    product,
    inventoryBreakdown: warehouseBreakdown,
  });
});

// POST /api/products (Admin only)
router.post('/', requireAdmin, (req: Request, res: Response) => {
  const { productName, description, category, price, image, stockQuantity, warehouseId } =
    req.body;

  if (!productName || !category || price === undefined) {
    res.status(400).json({
      success: false,
      message: 'Product name, category, and price are required.',
    });
    return;
  }

  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    res.status(400).json({
      success: false,
      message: 'Price must be a positive number.',
    });
    return;
  }

  const initialStock = Number(stockQuantity) || 10;
  const targetWarehouse = warehouseId || 'WH-01';

  const productId = `PROD-${Date.now().toString().slice(-4)}`;
  const newProduct: Product = {
    productId,
    productName,
    description: description || 'High-performance equipment engineered for modern professionals.',
    category,
    price: numPrice,
    image:
      image ||
      'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80',
    stockQuantity: initialStock,
    warehouseId: targetWarehouse,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addProduct(newProduct);

  // Set initial inventory in the designated warehouse
  db.setInventoryStock(productId, targetWarehouse, initialStock, 0);

  res.status(201).json({
    success: true,
    message: 'Product created successfully with warehouse allocation.',
    product: newProduct,
  });
});

// PUT /api/products/:id (Admin only)
router.put('/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const product = db.getProductById(id);

  if (!product) {
    res.status(404).json({
      success: false,
      message: `Product with ID '${id}' not found.`,
    });
    return;
  }

  const updates: Partial<Product> = {};
  if (req.body.productName !== undefined) updates.productName = req.body.productName;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.category !== undefined) updates.category = req.body.category;
  if (req.body.price !== undefined) {
    const p = Number(req.body.price);
    if (!isNaN(p) && p >= 0) updates.price = p;
  }
  if (req.body.image !== undefined) updates.image = req.body.image;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.warehouseId !== undefined) updates.warehouseId = req.body.warehouseId;

  const updated = db.updateProduct(id, updates);

  res.status(200).json({
    success: true,
    message: 'Product updated successfully.',
    product: updated,
  });
});

// DELETE /api/products/:id (Admin only)
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deleteProduct(id);

  if (!success) {
    res.status(404).json({
      success: false,
      message: `Product with ID '${id}' not found.`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: `Product '${id}' deleted successfully.`,
  });
});

export default router;
