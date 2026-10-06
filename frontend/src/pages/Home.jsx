import { useOutletContext } from 'react-router-dom';

export default function Home() {
  const { user } = useOutletContext();

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
