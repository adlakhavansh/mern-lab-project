import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWishlist } from '../services/api';
import WishlistCard from '../components/WishlistCard';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setItems((await getWishlist()).wishlist); }
    catch { setError('We couldn\'t load your wishlist.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading your wishlist...</div>;

  if (error) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-semibold">Something went wrong.</h2>
        <p className="text-gray-500 mt-2">{error}</p>
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

  if (items.length === 0) {
    return (
      <div className="text-center mt-10">
        <p className="text-4xl" aria-hidden="true">❤️</p>
        <h2 className="text-xl font-semibold mt-3">Your wishlist is empty</h2>
        <p className="text-gray-500 mt-2">Save products you love and find them here later.</p>
        <Link
          to="/products"
          className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h1 className="text-2xl font-bold text-gray-800">My Wishlist</h1>
      <p className="text-gray-500 mb-6">{items.length} {items.length === 1 ? 'product' : 'products'} saved</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(product => (
          <WishlistCard
            key={product._id}
            product={product}
            onRemoved={(id) => setItems(current => current.filter(p => p._id !== id))}
          />
        ))}
      </div>
    </div>
  );
}
