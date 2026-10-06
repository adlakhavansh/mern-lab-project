import { Link } from 'react-router-dom';
export default function ProductCard({ product }) {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition bg-white flex flex-col">
      <img src={product.image} alt={product.name} className="h-48 w-full object-contain mb-4" />
      <h2 className="text-lg font-semibold truncate">{product.name}</h2>
      <p className="text-gray-500 text-sm">{product.category}</p>
      <p className="text-xl font-bold mt-2 text-blue-600">₹{product.price}</p>
      <p className="text-sm text-gray-500 mt-1">{product.stock} units left</p>
      <Link className="mt-4 text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700" to={`/products/${product._id}`}>View Details</Link>
    </div>
  );
}
