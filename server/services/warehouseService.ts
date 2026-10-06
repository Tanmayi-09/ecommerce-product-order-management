import { db } from '../db/database.ts';
import {
  OrderItem,
  WarehouseFulfillmentDetail,
  WarehouseAllocation,
} from '../../shared/types.ts';

export interface AllocationResult {
  success: boolean;
  message?: string;
  isSplit: boolean;
  allocations: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    warehouseFulfillments: WarehouseAllocation[];
  }[];
  fulfillmentDetails: WarehouseFulfillmentDetail[];
}

export class WarehouseService {
  /**
   * Plans allocation for cart/order items according to multi-warehouse intelligent rules:
   * 1. Total available stock across all active warehouses must be >= requested quantity.
   * 2. If a single warehouse can fulfill the entire quantity, choose that warehouse to prevent splitting.
   *    If multiple single warehouses can fulfill, choose the best fit (lowest stock that satisfies it to conserve large-pool warehouses, or closest).
   * 3. If NO single warehouse can fulfill, combine inventory from multiple warehouses (greedily from highest available down).
   * 4. Return complete warehouse allocation and breakdown.
   */
  public static planAllocation(
    items: { productId: string; quantity: number }[]
  ): AllocationResult {
    const warehouses = db.getWarehouses().filter((w) => w.status === 'ACTIVE');
    const warehouseMap = new Map(warehouses.map((w) => [w.warehouseId, w]));

    const plannedAllocations: AllocationResult['allocations'] = [];
    const fulfillmentMap = new Map<string, WarehouseFulfillmentDetail>();

    let orderRequiresSplit = false;

    for (const item of items) {
      const product = db.getProductById(item.productId);
      if (!product) {
        return {
          success: false,
          message: `Product ID ${item.productId} not found`,
          isSplit: false,
          allocations: [],
          fulfillmentDetails: [],
        };
      }

      // Get all active inventory records for this product
      const invRecords = db
        .getInventoryByProductId(item.productId)
        .filter((inv) => warehouseMap.has(inv.warehouseId) && inv.availableQuantity > 0);

      const totalAvailable = invRecords.reduce((sum, inv) => sum + inv.availableQuantity, 0);

      if (totalAvailable < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for '${product.productName}'. Requested: ${item.quantity}, Total Available across all warehouses: ${totalAvailable}.`,
          isSplit: false,
          allocations: [],
          fulfillmentDetails: [],
        };
      }

      // Rule 3 & 4: Check if any single warehouse can fulfill completely
      const singleFulfillmentCandidates = invRecords.filter(
        (inv) => inv.availableQuantity >= item.quantity
      );

      let itemAllocations: WarehouseAllocation[] = [];

      if (singleFulfillmentCandidates.length > 0) {
        // Pick best candidate: Prefer closest or smallest sufficient availableQuantity to minimize wastage
        // Sort ascending by availableQuantity so we pick the warehouse that fits without over-allocating large hubs
        singleFulfillmentCandidates.sort((a, b) => a.availableQuantity - b.availableQuantity);
        const chosen = singleFulfillmentCandidates[0];
        const wh = warehouseMap.get(chosen.warehouseId)!;

        itemAllocations.push({
          warehouseId: chosen.warehouseId,
          warehouseName: wh.warehouseName,
          quantity: item.quantity,
        });
      } else {
        // No single warehouse can fulfill -> SPLIT fulfillment required
        orderRequiresSplit = true;
        let remainingToFulfill = item.quantity;

        // Sort descending by availableQuantity to minimize the number of warehouses involved
        const sortedDesc = [...invRecords].sort(
          (a, b) => b.availableQuantity - a.availableQuantity
        );

        for (const inv of sortedDesc) {
          if (remainingToFulfill <= 0) break;
          const allocateFromThis = Math.min(inv.availableQuantity, remainingToFulfill);
          if (allocateFromThis > 0) {
            const wh = warehouseMap.get(inv.warehouseId)!;
            itemAllocations.push({
              warehouseId: inv.warehouseId,
              warehouseName: wh.warehouseName,
              quantity: allocateFromThis,
            });
            remainingToFulfill -= allocateFromThis;
          }
        }

        if (remainingToFulfill > 0) {
          return {
            success: false,
            message: `Could not complete warehouse fulfillment for '${product.productName}'.`,
            isSplit: false,
            allocations: [],
            fulfillmentDetails: [],
          };
        }
      }

      // Group into fulfillmentDetails
      for (const alloc of itemAllocations) {
        const wh = warehouseMap.get(alloc.warehouseId)!;
        if (!fulfillmentMap.has(alloc.warehouseId)) {
          fulfillmentMap.set(alloc.warehouseId, {
            warehouseId: alloc.warehouseId,
            warehouseName: wh.warehouseName,
            location: wh.location,
            status: 'PENDING_PACKING',
            items: [],
          });
        }
        fulfillmentMap.get(alloc.warehouseId)!.items.push({
          productId: product.productId,
          productName: product.productName,
          quantity: alloc.quantity,
        });
      }

      plannedAllocations.push({
        productId: product.productId,
        productName: product.productName,
        price: product.price,
        quantity: item.quantity,
        warehouseFulfillments: itemAllocations,
      });
    }

    // Check if overall order spans multiple warehouses
    if (fulfillmentMap.size > 1) {
      orderRequiresSplit = true;
    }

    return {
      success: true,
      isSplit: orderRequiresSplit,
      allocations: plannedAllocations,
      fulfillmentDetails: Array.from(fulfillmentMap.values()),
    };
  }

  /**
   * Commits the inventory reservation when an order is created.
   */
  public static reserveStock(allocations: AllocationResult['allocations']) {
    for (const alloc of allocations) {
      for (const whAlloc of alloc.warehouseFulfillments) {
        const inv = db.getInventoryRecord(alloc.productId, whAlloc.warehouseId);
        if (inv) {
          inv.reservedQuantity += whAlloc.quantity;
          inv.availableQuantity = Math.max(0, inv.quantity - inv.reservedQuantity);
          inv.updatedAt = new Date().toISOString();
        }
      }
      db.syncProductStock(alloc.productId);
    }
    db.save();
  }

  /**
   * Deducts quantity permanently once payment is successful / order is confirmed.
   */
  public static deductReservedStock(orderItems: OrderItem[]) {
    for (const item of orderItems) {
      if (item.warehouseFulfillments) {
        for (const whAlloc of item.warehouseFulfillments) {
          const inv = db.getInventoryRecord(item.productId, whAlloc.warehouseId);
          if (inv) {
            inv.quantity = Math.max(0, inv.quantity - whAlloc.quantity);
            inv.reservedQuantity = Math.max(0, inv.reservedQuantity - whAlloc.quantity);
            inv.availableQuantity = Math.max(0, inv.quantity - inv.reservedQuantity);
            inv.updatedAt = new Date().toISOString();
          }
        }
      }
      db.syncProductStock(item.productId);
    }
    db.save();
  }

  /**
   * Releases reserved stock if order is cancelled before shipping.
   */
  public static releaseStock(orderItems: OrderItem[]) {
    for (const item of orderItems) {
      if (item.warehouseFulfillments) {
        for (const whAlloc of item.warehouseFulfillments) {
          const inv = db.getInventoryRecord(item.productId, whAlloc.warehouseId);
          if (inv) {
            inv.reservedQuantity = Math.max(0, inv.reservedQuantity - whAlloc.quantity);
            inv.availableQuantity = Math.max(0, inv.quantity - inv.reservedQuantity);
            inv.updatedAt = new Date().toISOString();
          }
        }
      }
      db.syncProductStock(item.productId);
    }
    db.save();
  }
}
