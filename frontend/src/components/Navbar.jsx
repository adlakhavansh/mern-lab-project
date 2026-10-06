import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { wishlistCount, itemCount, isAuthed, setIsAuthed, clearCartState } = useCart();

  const handleLogout = async () => {
    try { await api.post('/customers/logout'); }
    catch (error) { console.error('Logout failed', error); } // e.g. already logged out (401)
    finally {
      clearCartState();
      setIsAuthed(false);
      navigate('/login');
    }
  };

  const linkClass = 'hover:underline focus:outline-none focus:ring-2 focus:ring-white/70 rounded px-1';

  return (
    <nav className="bg-blue-600 p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-y-2">
      <Link to="/home" className="text-xl font-bold focus:outline-none focus:ring-2 focus:ring-white/70 rounded">
        ShopKart
      </Link>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:text-base">
        <Link className={linkClass} to="/home">Home</Link>
        <Link className={linkClass} to="/products">Products</Link>
        {isAuthed && <Link className={linkClass} to="/wishlist">Wishlist ({wishlistCount})</Link>}
        {isAuthed && <Link className={linkClass} to="/cart">Cart ({itemCount})</Link>}
        {isAuthed === false && <Link className={linkClass} to="/login">Login</Link>}
        {isAuthed && (
          <button
            type="button"
            onClick={handleLogout}
            className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
