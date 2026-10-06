import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try { await api.post('/customers/logout'); }
    catch (error) { console.error('Logout failed', error); } // e.g. already logged out (401)
    finally { navigate('/login'); }
  };
  return (
    <nav className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold">ShopKart</h1>
      <div className="space-x-4">
        <Link className="hover:underline" to="/home">Home</Link>
        <Link className="hover:underline" to="/products">Products</Link>
        <Link className="hover:underline" to="/login">Login</Link>
        <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition">Logout</button>
      </div>
    </nav>
  );
}
