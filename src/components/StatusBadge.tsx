import React from 'react';
import { OrderStatus, PaymentStatus } from '../../shared/types.ts';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | 'SINGLE_WAREHOUSE' | 'SPLIT_ORDER' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  switch (status) {
    // Order Statuses
    case 'PLACED':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
      label = 'Placed';
      break;
    case 'CONFIRMED':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      label = 'Confirmed';
      break;
    case 'PROCESSING':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Processing';
      break;
    case 'SHIPPED':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      label = 'Shipped';
      break;
    case 'OUT_FOR_DELIVERY':
      colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
      label = 'Out for Delivery';
      break;
    case 'DELIVERED':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Delivered';
      break;
    case 'CANCELLED':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Cancelled';
      break;

    // Payment Statuses
    case 'SUCCESS':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      label = 'Paid (Success)';
      break;
    case 'PENDING':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Payment Pending';
      break;
    case 'FAILED':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Payment Failed';
      break;

    // Fulfillment Types
    case 'SINGLE_WAREHOUSE':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
      label = 'Single Warehouse';
      break;
    case 'SPLIT_ORDER':
      colorClasses = 'bg-orange-50 text-orange-700 border-orange-200 font-medium';
      label = 'Split Order (Multi-Hub)';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${sizeClasses} ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
};
