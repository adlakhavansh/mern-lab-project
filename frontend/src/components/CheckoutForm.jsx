const FIELDS = [
  { name: 'fullName', label: 'Full Name', type: 'text', autoComplete: 'name' },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', inputMode: 'numeric' },
  { name: 'addressLine1', label: 'Address', type: 'text', autoComplete: 'address-line1' },
  { name: 'city', label: 'City', type: 'text', autoComplete: 'address-level2' },
  { name: 'state', label: 'State', type: 'text', autoComplete: 'address-level1' },
  { name: 'pincode', label: 'Pincode', type: 'text', autoComplete: 'postal-code', inputMode: 'numeric' }
];

export default function CheckoutForm({ values, errors, onChange, disabled }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Shipping Details</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {FIELDS.map(field => {
          const errorId = `${field.name}-error`;
          const hasError = Boolean(errors[field.name]);
          return (
            <div key={field.name} className={field.name === 'addressLine1' ? 'sm:col-span-2' : ''}>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                inputMode={field.inputMode}
                autoComplete={field.autoComplete}
                value={values[field.name]}
                onChange={(e) => onChange(field.name, e.target.value)}
                disabled={disabled}
                aria-invalid={hasError}
                aria-describedby={hasError ? errorId : undefined}
                className={`w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 ${hasError ? 'border-red-400' : ''}`}
              />
              {hasError && <p id={errorId} className="text-red-600 text-sm mt-1">{errors[field.name]}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
