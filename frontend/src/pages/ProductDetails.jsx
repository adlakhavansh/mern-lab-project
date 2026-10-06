import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try { setProduct((await api.get(`/products/${id}`)).data); }
      catch { setError('Product not found.'); }
      finally { setLoading(false); }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;
  if (!product) return null;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow border flex flex-col md:flex-row gap-8">
      <div className="md:w-1/2 flex justify-center bg-gray-50 rounded">
        <img src={product.image} alt={product.name} className="max-h-96 object-contain" />
      </div>
      <div className="md:w-1/2 flex flex-col justify-center">
        <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-2">{product.category}</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
        <p className="text-2xl font-semibold text-gray-800 mb-6">₹{product.price}</p>
        <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
        <span className={`px-3 py-1 rounded w-max text-sm font-medium mb-8 ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
        </span>
        <button className="bg-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={product.stock === 0}>
          Add to Cart
        </button>
        <button onClick={() => navigate('/products')} className="mt-4 text-gray-500 hover:text-gray-800 underline text-sm text-left">
          ← Back to Products
        </button>
      </div>
    </div>
  );
}
