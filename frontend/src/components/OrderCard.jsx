import { Link } from 'react-router-dom';

export const STATUS_STYLES = {
  PENDING_PAYMENT: 'bg-gray-100 text-gray-700',
  PLACED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-amber-100 text-amber-800',
  DELIVERED: 'bg-green-100 text-green-800'
};

export const formatOrderDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function OrderCard({ order }) {
  const preview = order.items.slice(0, 3);
  const remaining = order.items.length - preview.length;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">Order #{order._id.slice(-8)}</p>
          <p className="text-sm text-gray-500">{formatOrderDate(order.createdAt)}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700'}`}>
          {order.status.replace('_', ' ')}
        </span>
      </div>

      <ul className="mt-3 text-sm text-gray-700 space-y-1">
        {preview.map(item => (
          <li key={item._id || item.product}>{item.name} × {item.quantity}</li>
        ))}
        {remaining > 0 && <li className="text-gray-500">+{remaining} more</li>}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t">
        <p className="font-bold">Total: ₹{order.totalAmount.toLocaleString('en-IN')}</p>
        <Link
          to={`/orders/${order._id}`}
          className="text-sm text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
