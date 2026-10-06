import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';
import { WarehouseService } from '../services/warehouseService.ts';
import { Order, OrderStatus, PaymentMethod } from '../../shared/types.ts';

const router = Router();

// POST /api/orders - Place a new order with multi-warehouse fulfillment
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customer = db.getUserById(req.user!.id);
    if (!customer) {
      res.status(401).json({ success: false, message: 'Customer account not found.' });
      return;
    }

    const {
      items, // [{ productId, quantity }] or if omitted, orders from active cart
      shippingAddress,
      paymentMethod = 'UPI',
      notes,
      autoProcessPayment = true,
      simulatePaymentFailure = false,
    } = req.body;

    let orderItemsToProcess: { productId: string; quantity: number }[] = [];

    if (items && Array.isArray(items) && items.length > 0) {
      orderItemsToProcess = items;
    } else {
      // Pull items from customer's cart
      const cartItems = db.getCart(customer.id);
      if (cartItems.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Your cart is empty. Please add items before checking out.',
        });
        return;
      }
      orderItemsToProcess = cartItems.map((c) => ({
        productId: c.productId,
        quantity: c.quantity,
      }));
    }

    // Step 3 & 4: Multi-warehouse allocation plan
    const allocationResult = WarehouseService.planAllocation(orderItemsToProcess);

    if (!allocationResult.success) {
      res.status(400).json({
        success: false,
        message: allocationResult.message || 'Inventory allocation failed.',
      });
      return;
    }

    // Calculate total amount
    const totalAmount = allocationResult.allocations.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Step 5: Reserve stock across warehouses
    WarehouseService.reserveStock(allocationResult.allocations);

    const orderId = `ORD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
    const finalAddress =
      shippingAddress ||
      customer.address || {
        street: '14 Hill Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400050',
        country: 'India',
      };

    const newOrder: Order = {
      orderId,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      orderItems: allocationResult.allocations.map((alloc) => {
        const prod = db.getProductById(alloc.productId);
        return {
          productId: alloc.productId,
          productName: alloc.productName,
          price: alloc.price,
          quantity: alloc.quantity,
          image: prod ? prod.image : undefined,
          warehouseFulfillments: alloc.warehouseFulfillments,
        };
      }),
      totalAmount,
      shippingAddress: finalAddress,
      orderStatus: 'PLACED',
      paymentStatus: 'PENDING',
      paymentMethod: (paymentMethod as PaymentMethod) || 'UPI',
      fulfillmentType: allocationResult.isSplit ? 'SPLIT_ORDER' : 'SINGLE_WAREHOUSE',
      fulfillmentDetails: allocationResult.fulfillmentDetails,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save order
    db.addOrder(newOrder);

    // Clear cart if items came from cart
    if (!items || items.length === 0) {
      db.clearCart(customer.id);
    }

    // Notification 1: Order Placed
    db.addNotification({
      customerId: customer.id,
      orderId: newOrder.orderId,
      message: `Your order ${newOrder.orderId} for ₹${totalAmount.toLocaleString('en-IN')} has been placed successfully (${newOrder.fulfillmentType === 'SPLIT_ORDER' ? 'Split across multiple warehouses' : 'Single warehouse routing'}).`,
      type: 'ORDER_PLACED',
      isRead: false,
    });

    // Step 8 & 9: Auto-process simulated payment if requested
    let paymentRecord = null;
    if (autoProcessPayment) {
      const isSuccess = !simulatePaymentFailure;
      paymentRecord = db.addPayment({
        paymentId: `PAY-${Date.now().toString().slice(-5)}`,
        orderId: newOrder.orderId,
        amount: totalAmount,
        paymentMethod: newOrder.paymentMethod,
        paymentStatus: isSuccess ? 'SUCCESS' : 'FAILED',
        transactionId: `TXN-${newOrder.paymentMethod.toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-6)}`,
        paymentDate: new Date().toISOString(),
        customerEmail: customer.email,
      });

      if (isSuccess) {
        newOrder.paymentStatus = 'SUCCESS';
        newOrder.orderStatus = 'CONFIRMED';
        newOrder.updatedAt = new Date().toISOString();
        db.updateOrder(newOrder.orderId, {
          paymentStatus: 'SUCCESS',
          orderStatus: 'CONFIRMED',
        });

        // Deduct reserved stock
        WarehouseService.deductReservedStock(newOrder.orderItems);

        // Notification: Payment Success
        db.addNotification({
          customerId: customer.id,
          orderId: newOrder.orderId,
          message: `Payment of ₹${totalAmount.toLocaleString('en-IN')} via ${newOrder.paymentMethod} verified successfully! Your order is now CONFIRMED.`,
          type: 'PAYMENT_SUCCESS',
          isRead: false,
        });
      } else {
        newOrder.paymentStatus = 'FAILED';
        db.updateOrder(newOrder.orderId, {
          paymentStatus: 'FAILED',
        });

        db.addNotification({
          customerId: customer.id,
          orderId: newOrder.orderId,
          message: `Payment simulation of ₹${totalAmount.toLocaleString('en-IN')} failed. You may retry payment from Order Details.`,
          type: 'PAYMENT_FAILED',
          isRead: false,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      order: newOrder,
      payment: paymentRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order due to server error.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/orders - Get orders (admins get all, customers get own)
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const orders =
    user.role === 'admin' ? db.getOrders() : db.getOrdersByCustomerId(user.id);

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

// GET /api/orders/:id
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const order = db.getOrderById(id);

  if (!order) {
    res.status(404).json({
      success: false,
      message: `Order with ID '${id}' not found.`,
    });
    return;
  }

  // Access check: Customer can only view their own order
  if (req.user!.role !== 'admin' && order.customerId !== req.user!.id) {
    res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own orders.',
    });
    return;
  }

  const payment = db.getPaymentByOrderId(order.orderId);

  res.status(200).json({
    success: true,
    order,
    payment,
  });
});

// GET /api/orders/customer/:customerId
router.get('/customer/:customerId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { customerId } = req.params;

  if (req.user!.role !== 'admin' && req.user!.id !== customerId) {
    res.status(403).json({
      success: false,
      message: 'Access denied.',
    });
    return;
  }

  const orders = db.getOrdersByCustomerId(customerId);

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

// PUT /api/orders/:id/status (Admin only)
router.put('/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses: OrderStatus[] = [
    'PLACED',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ];

  if (!validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: `Invalid order status. Must be one of: ${validStatuses.join(', ')}`,
    });
    return;
  }

  const order = db.getOrderById(id);
  if (!order) {
    res.status(404).json({
      success: false,
      message: `Order with ID '${id}' not found.`,
    });
    return;
  }

  const previousStatus = order.orderStatus;
  const updatedOrder = db.updateOrder(id, { orderStatus: status });

  // Handle inventory state transitions
  if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
    // Release stock if not already fulfilled/delivered
    WarehouseService.releaseStock(order.orderItems);

    db.addNotification({
      customerId: order.customerId,
      orderId: order.orderId,
      message: `Your order ${order.orderId} has been CANCELLED by the system/admin. Any reserved stock has been returned to warehouses.`,
      type: 'ORDER_CANCELLED',
      isRead: false,
    });
  } else {
    // Status change notifications
    let notifType: 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'SYSTEM' = 'SYSTEM';
    if (status === 'CONFIRMED') notifType = 'ORDER_CONFIRMED';
    if (status === 'SHIPPED') notifType = 'ORDER_SHIPPED';
    if (status === 'DELIVERED') notifType = 'ORDER_DELIVERED';

    db.addNotification({
      customerId: order.customerId,
      orderId: order.orderId,
      message: `Order ${order.orderId} status updated to: ${status}.`,
      type: notifType,
      isRead: false,
    });
  }

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}.`,
    order: updatedOrder,
  });
});

// PUT /api/orders/:id/cancel (Customer can cancel their own order if still PLACED or CONFIRMED)
router.put('/:id/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const order = db.getOrderById(id);

  if (!order) {
    res.status(404).json({
      success: false,
      message: `Order with ID '${id}' not found.`,
    });
    return;
  }

  if (req.user!.role !== 'admin' && order.customerId !== req.user!.id) {
    res.status(403).json({
      success: false,
      message: 'Access denied.',
    });
    return;
  }

  if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)) {
    res.status(400).json({
      success: false,
      message: `Cannot cancel an order that is already ${order.orderStatus}.`,
    });
    return;
  }

  if (order.orderStatus === 'CANCELLED') {
    res.status(400).json({
      success: false,
      message: 'This order is already cancelled.',
    });
    return;
  }

  // Release inventory
  WarehouseService.releaseStock(order.orderItems);

  const updatedOrder = db.updateOrder(id, {
    orderStatus: 'CANCELLED',
  });

  db.addNotification({
    customerId: order.customerId,
    orderId: order.orderId,
    message: `Order ${order.orderId} was cancelled successfully. Inventory restored.`,
    type: 'ORDER_CANCELLED',
    isRead: false,
  });

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully and stock returned to warehouse inventory.',
    order: updatedOrder,
  });
});

export default router;
