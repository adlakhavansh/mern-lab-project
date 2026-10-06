import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try { setUser((await api.get('/customers/me')).data); }
      catch { navigate('/login'); }
      finally { setLoading(false); }
    };
    fetchUser();
  }, [navigate]);

  if (loading) return <div className="text-center mt-10">Loading profile...</div>;
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow border">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Welcome to ShopKart, {user.fullName}!</h2>
      <div className="space-y-2 text-lg">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone}</p>
      </div>
    </div>
  );
}
