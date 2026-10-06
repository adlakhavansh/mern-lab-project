import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function WishlistCard({ product, onRemoved }) {
  const { dropWishlistItem } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleRemove = async () => {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await dropWishlistItem(product._id);
      onRemoved(product._id);
    } catch {
      setError('Could not remove this product.');
      setPending(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white flex flex-col">
      <img src={product.image} alt={product.name} className="h-48 w-full object-contain mb-4" />
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
          onClick={handleRemove}
          disabled={pending}
          className="py-2 rounded border border-red-200 text-red-600 text-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60"
        >
          {pending ? 'Removing...' : 'Remove ♥'}
        </button>
      </div>
    </div>
  );
}
