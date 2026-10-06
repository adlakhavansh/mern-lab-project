import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../services/api';
import { STATUS_STYLES, formatOrderDate } from '../components/OrderCard';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Ownership is enforced on the server, so someone else's id simply 404s
    getOrder(id)
      .then(data => setOrder(data.order))
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading order...</div>;
  if (error) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-semibold text-red-600">{error}</h2>
        <Link
          to="/orders"
          className="inline-block mt-4 text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  const address = order.shippingAddress;

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <Link
        to="/orders"
        className="text-sm text-gray-500 hover:text-gray-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      >
        ← Back to My Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-2 mt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Order #{order._id.slice(-8)}</h1>
          <p className="text-gray-500">{formatOrderDate(order.createdAt)}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700'}`}>
          {order.status.replace('_', ' ')}
        </span>
      </div>

      <div className="border rounded-lg bg-white shadow-sm mt-6 divide-y">
        {order.items.map(item => (
          <div key={item._id || item.product} className="p-4 flex items-center gap-4">
            {item.image && <img src={item.image} alt={item.name} className="h-16 w-16 object-contain shrink-0" />}
            <div className="flex-1 min-w-0">
              {/* Snapshot values: what the customer actually bought, at that price */}
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-sm text-gray-500">₹{item.price.toLocaleString('en-IN')} × {item.quantity}</p>
            </div>
            <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
          </div>
        ))}
        <div className="p-4 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="font-semibold mb-2">Shipping Address</h2>
          <address className="text-sm text-gray-700 not-italic leading-relaxed">
            {address.fullName}<br />
            {address.addressLine1}<br />
            {address.city}, {address.state} {address.pincode}<br />
            {address.phone}
          </address>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="font-semibold mb-2">Payment</h2>
          <p className="text-sm text-gray-700">Status: {order.paymentStatus}</p>
          {order.razorpayPaymentId && (
            <p className="text-sm text-gray-500 mt-1 break-all">Payment ID: {order.razorpayPaymentId}</p>
          )}
        </div>
      </div>
    </div>
  );
}
