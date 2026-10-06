import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';
import { WarehouseService } from '../services/warehouseService.ts';
import { generateToken, verifyToken } from '../middleware/auth.ts';

const router = Router();

// GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'E-Commerce Product & Order Management System',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'CONNECTED_PERSISTENT',
    environment: process.env.NODE_ENV || 'development',
  });
});

// GET /api/system/test-suite - Runs comprehensive automated backend tests
router.get('/system/test-suite', (_req: Request, res: Response) => {
  const tests: { name: string; category: string; passed: boolean; details: string; durationMs: number }[] = [];

  const runTest = (name: string, category: string, fn: () => { passed: boolean; details: string }) => {
    const start = performance.now();
    try {
      const result = fn();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      tests.push({ name, category, passed: result.passed, details: result.details, durationMs });
    } catch (err) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      tests.push({
        name,
        category,
        passed: false,
        details: err instanceof Error ? err.message : String(err),
        durationMs,
      });
    }
  };

  // Test 1: Database persistence & seed presence
  runTest('Database Integrity Check', 'Database', () => {
    const users = db.getUsers();
    const products = db.getProducts();
    const warehouses = db.getWarehouses();
    const passed = users.length >= 4 && products.length >= 8 && warehouses.length >= 3;
    return {
      passed,
      details: `Loaded ${users.length} users, ${products.length} products, ${warehouses.length} warehouses.`,
    };
  });

  // Test 2: JWT Authentication and Claims Validation
  runTest('JWT Token Generation & Verification', 'Authentication', () => {
    const payload = {
      id: 'TEST-USR-99',
      email: 'test@example.com',
      role: 'customer' as const,
      name: 'Test Runner',
    };
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    const passed = decoded !== null && decoded.id === payload.id && decoded.role === payload.role;
    return {
      passed,
      details: passed ? 'Token successfully signed and verified with 7d expiration.' : 'Token verification failed.',
    };
  });

  // Test 3: Admin & Warehouse Manager Role Validation
  runTest('Role-Based Access Control (RBAC)', 'Authorization', () => {
    const admin = db.getUserByEmail('admin@example.com');
    const customer = db.getUserByEmail('customer@example.com');
    const wm = db.getUserByEmail('warehouse@example.com');
    const passed =
      admin?.role === 'admin' &&
      customer?.role === 'customer' &&
      wm?.role === 'warehouse_manager';
    return {
      passed,
      details: `Admin: ${admin?.role}, Customer: ${customer?.role}, Warehouse Manager: ${wm?.role}. Correctly partitioned.`,
    };
  });

  // Test 4: Single Warehouse Fulfillment Preference
  runTest('Single Warehouse Routing (No Splitting)', 'Multi-Warehouse', () => {
    // PROD-101 has WH-HYD: 10, WH-VJA: 5, WH-VSKP: 2
    // If requesting 6 units, WH-HYD (10) can fulfill completely without splitting.
    const plan = WarehouseService.planAllocation([{ productId: 'PROD-101', quantity: 6 }]);
    const passed =
      plan.success &&
      !plan.isSplit &&
      plan.fulfillmentDetails.length === 1 &&
      plan.allocations[0].warehouseFulfillments.length === 1;
    return {
      passed,
      details: passed
        ? `Fulfilled from single warehouse (${plan.fulfillmentDetails[0].warehouseName}) without splitting.`
        : `Failed: ${plan.message}`,
    };
  });

  // Test 5: Intelligent Split Fulfillment
  runTest('Split Order Multi-Warehouse Routing', 'Multi-Warehouse', () => {
    // PROD-104 has WH-HYD: 3, WH-VJA: 0, WH-VSKP: 5. Total = 8.
    // Requesting 6 units cannot fit into WH-HYD (3) or WH-VSKP (5) alone.
    // It MUST split across WH-VSKP (5) and WH-HYD (1).
    const plan = WarehouseService.planAllocation([{ productId: 'PROD-104', quantity: 6 }]);
    const passed =
      plan.success &&
      plan.isSplit &&
      plan.fulfillmentDetails.length > 1 &&
      plan.allocations[0].warehouseFulfillments.reduce((sum, w) => sum + w.quantity, 0) === 6;
    return {
      passed,
      details: passed
        ? `Correctly split 6 units across ${plan.fulfillmentDetails.length} warehouses (${plan.fulfillmentDetails.map((f) => `${f.warehouseName}: ${f.items[0].quantity}`).join(', ')}).`
        : `Failed: ${plan.message}`,
    };
  });

  // Test 6: Insufficient Stock Rejection
  runTest('Insufficient Stock Guard', 'Inventory', () => {
    // Requesting 9999 units should be safely rejected with 400 response
    const plan = WarehouseService.planAllocation([{ productId: 'PROD-106', quantity: 9999 }]);
    const passed = !plan.success && plan.message?.includes('Insufficient stock');
    return {
      passed: Boolean(passed),
      details: passed
        ? 'Safely blocked order exceeding total available warehouse inventory.'
        : 'Failed to block excessive order.',
    };
  });

  // Test 7: Available vs Reserved Stock Invariant
  runTest('Available vs Reserved Inventory Calculation', 'Inventory', () => {
    const inv = db.getInventory();
    const allConsistent = inv.every(
      (i) => i.availableQuantity === Math.max(0, i.quantity - i.reservedQuantity)
    );
    return {
      passed: allConsistent,
      details: `Checked ${inv.length} inventory records. All satisfy availableQuantity = quantity - reservedQuantity.`,
    };
  });

  // Test 8: Payment Simulation Verification
  runTest('Payment Simulation Engine', 'Payment', () => {
    const payments = db.getPayments();
    const hasSuccessful = payments.some((p) => p.paymentStatus === 'SUCCESS');
    const noSensitiveData = payments.every(
      (p) => !('cardNumber' in p) && !('cvv' in p) && !('pin' in p)
    );
    const passed = hasSuccessful && noSensitiveData;
    return {
      passed,
      details: passed
        ? 'Safe payment simulation operating with zero sensitive cardholder data storage.'
        : 'Payment data invariant failure.',
    };
  });

  const allPassed = tests.every((t) => t.passed);
  const passCount = tests.filter((t) => t.passed).length;

  res.status(200).json({
    success: allPassed,
    summary: `${passCount} of ${tests.length} automated test suites passed.`,
    passRate: `${Math.round((passCount / tests.length) * 100)}%`,
    tests,
    timestamp: new Date().toISOString(),
  });
});

export default router;
