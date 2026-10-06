import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const { product, quantity } = item;

  const run = async (action) => {
    if (pending) return;
    setPending(true);
    setError('');
    try { await action(); }
    catch (err) { setError(err.response?.data?.message || 'Could not update your cart.'); }
    finally { setPending(false); }
  };

  const atStockLimit = quantity >= product.stock;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
      <img src={product.image} alt={product.name} className="h-24 w-24 object-contain shrink-0 self-center sm:self-auto" />

      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${product._id}`}
          className="font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          {product.name}
        </Link>
        <p className="text-sm text-gray-500">{product.category}</p>
        <p className="text-sm text-gray-700 mt-1">₹{product.price.toLocaleString('en-IN')} each</p>
        {error && <p className="text-sm text-red-600 mt-1" role="alert">{error}</p>}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease quantity of ${product.name}`}
          onClick={() => run(() => updateQuantity(product._id, quantity - 1))}
          disabled={pending || quantity <= 1}
          className="h-11 w-11 rounded border text-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
        >
          −
        </button>
        <span className="w-8 text-center font-medium" aria-live="polite">{quantity}</span>
        <button
          type="button"
          aria-label={`Increase quantity of ${product.name}`}
          onClick={() => run(() => updateQuantity(product._id, quantity + 1))}
          disabled={pending || atStockLimit}
          title={atStockLimit ? `Only ${product.stock} in stock` : undefined}
          className="h-11 w-11 rounded border text-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
        >
          +
        </button>
      </div>

      <div className="sm:text-right sm:w-32">
        <p className="font-bold">₹{(product.price * quantity).toLocaleString('en-IN')}</p>
        <button
          type="button"
          onClick={() => run(() => removeFromCart(product._id))}
          disabled={pending}
          className="mt-1 text-sm text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 rounded disabled:opacity-60"
        >
          {pending ? 'Working...' : 'Remove'}
        </button>
      </div>
    </div>
  );
}
