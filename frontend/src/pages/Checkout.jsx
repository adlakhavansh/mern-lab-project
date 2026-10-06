import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createPaymentOrder, verifyPayment } from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';
import CheckoutForm from '../components/CheckoutForm';
import OrderSummary from '../components/OrderSummary';

const EMPTY = { fullName: '', phone: '', addressLine1: '', city: '', state: '', pincode: '' };

// Mirrors the server's rules in backend/controllers/order.controller.js.
// The client check saves a round trip; the server check is the one that counts.
const validate = (values) => {
  const errors = {};
  if (!values.fullName.trim()) errors.fullName = 'Full name is required.';
  if (!/^[6-9]\d{9}$/.test(values.phone.trim())) errors.phone = 'Enter a valid 10-digit mobile number.';
  if (!values.addressLine1.trim()) errors.addressLine1 = 'Address is required.';
  if (!values.city.trim()) errors.city = 'City is required.';
  if (!values.state.trim()) errors.state = 'State is required.';
  if (!/^\d{6}$/.test(values.pincode.trim())) errors.pincode = 'Pincode must contain 6 digits.';
  return errors;
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, subtotal, loading, clearCartState, refreshCart } = useCart();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [placing, setPlacing] = useState(false);

  const onChange = (name, value) => {
    setValues(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: undefined }));
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setServerError('');

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return; // never call the backend on invalid input

    setPlacing(true);
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        setServerError('Could not reach the payment gateway. Check your connection and try again.');
        setPlacing(false);
        return;
      }

      const data = await createPaymentOrder(values);

      const paymentObject = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'ShopKart',
        description: 'ShopKart Order',
        order_id: data.razorpayOrderId,
        prefill: { name: values.fullName, contact: values.phone },

        // A successful sheet is not a successful payment. The backend decides,
        // by checking the HMAC signature against the order it stored.
        handler: async (response) => {
          try {
            await verifyPayment({
              shopKartOrderId: data.shopKartOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            clearCartState();
            navigate(`/order-success/${data.shopKartOrderId}`, { replace: true });
          } catch (err) {
            setServerError(
              err.response?.data?.message
              || 'Payment could not be verified. Your cart has not been cleared.'
            );
            setPlacing(false);
          }
        },

        modal: {
          // Closing the sheet must give the button back
          ondismiss: () => {
            setServerError('Payment cancelled. Your cart has not been cleared.');
            setPlacing(false);
          }
        }
      });

      paymentObject.on('payment.failed', (response) => {
        setServerError(
          `Payment failed${response?.error?.description ? `: ${response.error.description}` : ''}. `
          + 'Your cart has not been cleared. Please try again.'
        );
        setPlacing(false);
      });

      paymentObject.open();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not start checkout. Please try again.');
      // A rejected order creation may have been a stock change — resync the cart
      refreshCart();
      setPlacing(false);
    }
  };

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading your cart...</div>;

  if (cartItems.length === 0) {
    return (
      <div className="text-center mt-10">
        <h1 className="text-xl font-semibold">Your cart is empty.</h1>
        <p className="text-gray-500 mt-2">Add something before checking out.</p>
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
    <form onSubmit={handlePlaceOrder} className="mt-6" noValidate>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <CheckoutForm values={values} errors={errors} onChange={onChange} disabled={placing} />

        <OrderSummary items={cartItems} total={subtotal}>
          {serverError && (
            <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2" role="alert">
              {serverError}
            </p>
          )}
          <button
            type="submit"
            disabled={placing}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          >
            {placing ? 'Placing order...' : 'Place Order'}
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Payment is handled by Razorpay in Test Mode.
          </p>
        </OrderSummary>
      </div>
    </form>
  );
}
