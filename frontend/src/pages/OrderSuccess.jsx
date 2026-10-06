import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../services/api';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOrder(id)
      .then(data => setOrder(data.order))
      .catch(() => setError('We couldn\'t find that order.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading your order...</div>;
  if (error) return <div className="text-center mt-10 text-red-600">{error}</div>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow border text-center">
      <p className="text-4xl" aria-hidden="true">✅</p>
      <h1 className="text-2xl font-bold mt-3 text-gray-800">Order Placed Successfully</h1>

      <dl className="mt-6 space-y-3 text-left">
        <div className="flex justify-between gap-4 border-b pb-2">
          <dt className="text-gray-500">Order ID</dt>
          <dd className="font-mono text-sm break-all">{order._id}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b pb-2">
          <dt className="text-gray-500">Total</dt>
          <dd className="font-bold">₹{order.totalAmount.toLocaleString('en-IN')}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b pb-2">
          <dt className="text-gray-500">Status</dt>
          <dd className="font-medium">{order.status.replace('_', ' ')}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Payment</dt>
          <dd className="font-medium">{order.paymentStatus}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/orders"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          View My Orders
        </Link>
        <Link
          to="/products"
          className="border px-4 py-2 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
