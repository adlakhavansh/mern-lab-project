import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.fullName || !formData.email || !formData.password || !formData.phone) return setError('All fields are required');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters');

    try { await api.post('/customers/register', formData); navigate('/login'); }
    catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow border">
      <h2 className="text-2xl font-bold mb-4 text-center">Create Account</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input name="fullName" type="text" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="border p-2 rounded" />
        <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="border p-2 rounded" />
        <input name="password" type="password" placeholder="Password (min 6)" value={formData.password} onChange={handleChange} className="border p-2 rounded" />
        <input name="phone" type="text" placeholder="Phone" value={formData.phone} onChange={handleChange} className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Create Account</button>
      </form>
      <p className="mt-4 text-center">Already have an account? <Link className="text-blue-600" to="/login">Login</Link></p>
    </div>
  );
}
