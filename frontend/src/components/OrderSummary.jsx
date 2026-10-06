// Shared by the Cart page and Checkout so the two can never show
// different numbers for the same cart.
export default function OrderSummary({ items, total, children }) {
  const units = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Order Summary</h2>
      <ul className="space-y-2 text-sm">
        {items.map(item => (
          <li key={item.product._id} className="flex justify-between gap-4">
            <span className="truncate">{item.product.name} × {item.quantity}</span>
            <span className="shrink-0">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between text-sm text-gray-500 border-t mt-3 pt-3">
        <span>Items</span>
        <span>{units}</span>
      </div>
      <div className="flex justify-between font-bold text-lg mt-1">
        <span>Total</span>
        <span>₹{total.toLocaleString('en-IN')}</span>
      </div>
      {children}
    </div>
  );
}
