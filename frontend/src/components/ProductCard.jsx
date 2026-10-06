import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { wishlistIds, toggleWishlistItem } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const saved = wishlistIds.has(product._id);

  const handleWishlist = async () => {
    if (pending) return; // a second click must not fire a second request
    setPending(true);
    setError('');
    try { await toggleWishlistItem(product._id); }
    catch (err) {
      setError(err.response?.status === 401 ? 'Log in to save products.' : 'Unable to save product.');
    }
    finally { setPending(false); }
  };

  const wishlistLabel = pending ? 'Saving...' : saved ? '♥ Added to Wishlist' : '♡ Add to Wishlist';

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition bg-white flex flex-col">
      <div className="relative">
        <img src={product.image} alt={product.name} className="h-48 w-full object-contain mb-4" />
        <button
          type="button"
          onClick={handleWishlist}
          disabled={pending}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute top-0 right-0 h-10 w-10 rounded-full bg-white/90 border text-lg leading-none shadow-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
        </button>
      </div>
      <h2 className="text-lg font-semibold truncate">{product.name}</h2>
      <p className="text-gray-500 text-sm">{product.category}</p>
      <p className="text-xl font-bold mt-2 text-blue-600">₹{product.price.toLocaleString('en-IN')}</p>
      <p className="text-sm text-gray-500 mt-1">
        {product.stock > 0 ? `${product.stock} units left` : 'Out of Stock'}
      </p>
      {error && <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>}
      <div className="mt-4 flex flex-col gap-2">
        <Link
          className="text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          to={`/products/${product._id}`}
        >
          View Details
        </Link>
        <button
          type="button"
          onClick={handleWishlist}
          disabled={pending}
          className="py-2 rounded border text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        >
          {wishlistLabel}
        </button>
      </div>
    </div>
  );
}
