import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/cart
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.id;
  const items = db.getCart(customerId);

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.product ? item.product.price * item.quantity : 0);
  }, 0);

  res.status(200).json({
    success: true,
    count: items.length,
    items,
    subtotal,
  });
});

// POST /api/cart
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.id;
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    res.status(400).json({
      success: false,
      message: 'productId is required.',
    });
    return;
  }

  const numQty = Number(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    res.status(400).json({
      success: false,
      message: 'Quantity must be a positive number.',
    });
    return;
  }

  const product = db.getProductById(productId);
  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found.',
    });
    return;
  }

  if (product.stockQuantity < numQty) {
    res.status(400).json({
      success: false,
      message: `Only ${product.stockQuantity} units available across all warehouses.`,
    });
    return;
  }

  const item = db.addToCart(customerId, productId, numQty);

  res.status(201).json({
    success: true,
    message: `Added ${product.productName} to cart.`,
    item,
  });
});

// PUT /api/cart/:id
router.put('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined) {
    res.status(400).json({
      success: false,
      message: 'Quantity is required.',
    });
    return;
  }

  const numQty = Number(quantity);
  const updated = db.updateCartItem(id, numQty);

  if (!updated && numQty > 0) {
    res.status(404).json({
      success: false,
      message: 'Cart item not found.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: numQty <= 0 ? 'Item removed from cart.' : 'Cart item quantity updated.',
    item: updated,
  });
});

// DELETE /api/cart/:id
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.removeCartItem(id);

  if (!success) {
    res.status(404).json({
      success: false,
      message: 'Cart item not found.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Cart item removed successfully.',
  });
});

// DELETE /api/cart - Clear all cart items
router.delete('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.id;
  db.clearCart(customerId);

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully.',
  });
});

export default router;
