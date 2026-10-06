import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wishlistIds, toggleWishlistItem, addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try { setProduct((await api.get(`/products/${id}`)).data); }
      catch { setError('Product not found.'); }
      finally { setLoading(false); }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (adding) return;
    setAdding(true);
    setMessage('');
    try {
      await addToCart(product._id);
      setMessage('Added to your cart.');
    } catch (err) {
      setMessage(
        err.response?.status === 401
          ? 'Log in to add items to your cart.'
          : err.response?.data?.message || 'Could not add to cart.'
      );
    } finally { setAdding(false); }
  };

  const handleWishlist = async () => {
    if (pending) return;
    setPending(true);
    setMessage('');
    try { await toggleWishlistItem(product._id); }
    catch (err) {
      setMessage(err.response?.status === 401 ? 'Log in to save products.' : 'Unable to save product.');
    }
    finally { setPending(false); }
  };

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading...</div>;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;
  if (!product) return null;

  const saved = wishlistIds.has(product._id);
  const soldOut = product.stock === 0;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow border flex flex-col md:flex-row gap-8">
      <div className="md:w-1/2 flex justify-center bg-gray-50 rounded">
        <img src={product.image} alt={product.name} className="max-h-96 object-contain" />
      </div>
      <div className="md:w-1/2 flex flex-col justify-center">
        <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-2">{product.category}</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
        <p className="text-2xl font-semibold text-gray-800 mb-6">₹{product.price.toLocaleString('en-IN')}</p>
        <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
        <span className={`px-3 py-1 rounded w-max text-sm font-medium mb-6 ${soldOut ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {soldOut ? 'Out of Stock' : `${product.stock} in stock`}
        </span>
        {message && <p className="text-sm mb-4 text-gray-700" role="status">{message}</p>}
        <button
          type="button"
          onClick={handleAddToCart}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={soldOut || adding}
        >
          {soldOut ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Cart'}
        </button>
        <button
          type="button"
          onClick={handleWishlist}
          disabled={pending}
          aria-pressed={saved}
          className="mt-3 py-3 px-6 rounded-lg border font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        >
          {pending ? 'Saving...' : saved ? '♥ Remove from Wishlist' : '♡ Add to Wishlist'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="mt-4 text-gray-500 hover:text-gray-800 underline text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          ← Back to Products
        </button>
      </div>
    </div>
  );
}
