import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { WarehouseService } from '../services/warehouseService.ts';
import { PaymentMethod, Payment } from '../../shared/types.ts';

const router = Router();

// POST /api/payments/process - Simulate payment processing
router.post('/process', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { orderId, amount, paymentMethod = 'UPI', simulateFail = false } = req.body;

  if (!orderId) {
    res.status(400).json({
      success: false,
      message: 'orderId is required.',
    });
    return;
  }

  const order = db.getOrderById(orderId);
  if (!order) {
    res.status(404).json({
      success: false,
      message: `Order with ID '${orderId}' not found.`,
    });
    return;
  }

  // Verify access
  if (req.user!.role !== 'admin' && order.customerId !== req.user!.id) {
    res.status(403).json({
      success: false,
      message: 'Access denied.',
    });
    return;
  }

  if (order.paymentStatus === 'SUCCESS') {
    res.status(400).json({
      success: false,
      message: 'This order is already paid.',
    });
    return;
  }

  const isSuccess = !simulateFail;
  const method: PaymentMethod = paymentMethod || order.paymentMethod || 'UPI';
  const payAmount = Number(amount) || order.totalAmount;

  const payment: Payment = {
    paymentId: `PAY-${Date.now().toString().slice(-6)}`,
    orderId: order.orderId,
    amount: payAmount,
    paymentMethod: method,
    paymentStatus: isSuccess ? 'SUCCESS' : 'FAILED',
    transactionId: `TXN-${method.toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 899 + 100)}`,
    paymentDate: new Date().toISOString(),
    customerEmail: order.customerEmail,
  };

  db.addPayment(payment);

  if (isSuccess) {
    db.updateOrder(order.orderId, {
      paymentStatus: 'SUCCESS',
      orderStatus: order.orderStatus === 'PLACED' ? 'CONFIRMED' : order.orderStatus,
    });

    // Deduct stock permanently if previously reserved
    WarehouseService.deductReservedStock(order.orderItems);

    db.addNotification({
      customerId: order.customerId,
      orderId: order.orderId,
      message: `Payment of ₹${payAmount.toLocaleString('en-IN')} for order ${order.orderId} processed successfully (${payment.transactionId}).`,
      type: 'PAYMENT_SUCCESS',
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: 'Payment simulated and processed successfully.',
      payment,
    });
  } else {
    db.updateOrder(order.orderId, {
      paymentStatus: 'FAILED',
    });

    db.addNotification({
      customerId: order.customerId,
      orderId: order.orderId,
      message: `Payment simulation of ₹${payAmount.toLocaleString('en-IN')} failed for order ${order.orderId}. Please retry.`,
      type: 'PAYMENT_FAILED',
      isRead: false,
    });

    res.status(400).json({
      success: false,
      message: 'Payment simulation failed (Simulated failure response).',
      payment,
    });
  }
});

// GET /api/payments/:orderId
router.get('/:orderId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { orderId } = req.params;
  const payment = db.getPaymentByOrderId(orderId);

  if (!payment) {
    res.status(404).json({
      success: false,
      message: `No payment transaction found for order ID '${orderId}'.`,
    });
    return;
  }

  const order = db.getOrderById(orderId);
  if (order && req.user!.role !== 'admin' && order.customerId !== req.user!.id) {
    res.status(403).json({
      success: false,
      message: 'Access denied.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    payment,
  });
});

export default router;
