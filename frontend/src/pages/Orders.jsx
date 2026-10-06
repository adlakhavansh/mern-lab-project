import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../services/api';
import OrderCard from '../components/OrderCard';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setOrders((await getOrders()).orders); }
    catch { setError('Unable to load your orders.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading your orders...</div>;

  if (error) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-semibold">{error}</h2>
        <button
          type="button"
          onClick={load}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center mt-10">
        <p className="text-4xl" aria-hidden="true">📦</p>
        <h2 className="text-xl font-semibold mt-3">You have not placed any orders yet.</h2>
        <Link
          to="/products"
          className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map(order => <OrderCard key={order._id} order={order} />)}
      </div>
    </div>
  );
}
