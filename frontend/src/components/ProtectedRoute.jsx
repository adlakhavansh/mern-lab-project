import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../services/api';

// One guard for every page that needs a session, instead of a redirect
// copy-pasted into each one.
export default function ProtectedRoute() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authed | guest

  useEffect(() => {
    let active = true;
    api.get('/customers/me')
      .then(res => { if (active) { setUser(res.data); setStatus('authed'); } })
      .catch(() => { if (active) setStatus('guest'); });
    return () => { active = false; };
  }, []);

  if (status === 'loading') return <div className="text-center mt-10 text-gray-500">Checking your session...</div>;
  if (status === 'guest') return <Navigate to="/login" replace />;
  return <Outlet context={{ user }} />;
}
