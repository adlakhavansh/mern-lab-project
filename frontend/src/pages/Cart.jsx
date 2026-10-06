import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import OrderSummary from '../components/OrderSummary';

export default function Cart() {
  // Everything comes from the shared context — this page never fetches /cart
  // itself, which is what keeps it in step with the navbar badge.
  const { cartItems, loading, error, subtotal, itemCount, refreshCart } = useCart();

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading your cart...</div>;

  if (error) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-semibold">Unable to load your cart.</h2>
        <button
          type="button"
          onClick={refreshCart}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center mt-10">
        <p className="text-4xl" aria-hidden="true">🛒</p>
        <h2 className="text-xl font-semibold mt-3">Your cart is empty</h2>
        <p className="text-gray-500 mt-2">Looks like you haven&apos;t added anything yet.</p>
        <Link
          to="/products"
          className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h1 className="text-2xl font-bold text-gray-800">My Cart</h1>
      <p className="text-gray-500 mb-6">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(item => <CartItem key={item.product._id} item={item} />)}
        </div>

        <div className="lg:sticky lg:top-4">
          <OrderSummary items={cartItems} total={subtotal}>
            <Link
              to="/checkout"
              className="block text-center mt-4 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Proceed to Checkout
            </Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
