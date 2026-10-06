# ShopKart — Viva Preparation

Every viva question from Labs 01–06, answered against the code in **this** repo, with the
file to open if the TA asks "show me". Read the answer, then open the file and find the line.

---

## Lab 01 — Authentication

**Why bcrypt instead of encryption?**
Encryption is reversible — anyone with the key reads every password. bcrypt is a one-way
hash: you can only check a guess against it, never recover the original. It is also
deliberately slow and salted, so two customers with the same password get different hashes
and brute-forcing is expensive. See `backend/controllers/customer.controller.js` —
`bcrypt.hash(password, await bcrypt.genSalt(10))` on register, `bcrypt.compare` on login.

**What goes in a JWT payload?**
Only what identifies the request and nothing secret. Ours carries just `{ id: customerId }`
— `backend/utils/generateToken.js`. The payload is base64, not encrypted: anyone can read
it. The signature is what stops tampering, because changing the payload invalidates it.
Never put a password or anything private in there.

**Why does the cookie need HttpOnly?**
HttpOnly makes the cookie invisible to `document.cookie`, so injected JavaScript (XSS)
cannot steal the token. The browser still attaches it to every request automatically. If we
stored the JWT in `localStorage`, any script on the page could read and exfiltrate it.
See `res.cookie('token', token, { httpOnly: true, ... })` in `utils/generateToken.js`.

**Why never return the password?**
Even a hash is material for an offline attack — the attacker can grind guesses against it
with no rate limit. The frontend has no use for it either. We strip it two ways: register
returns a hand-built object with only the four safe fields, and `auth.middleware.js` loads
the customer with `.select('-password')`.

**What does the auth middleware do?**
It is the one place that turns a cookie into a trusted identity: read the cookie, verify the
signature with `JWT_SECRET`, load that customer from MongoDB, attach it to `req.user`, call
`next()`. Any failure answers 401 and the route never runs. Every protected route mounts it
(`router.use(protect)`), so authentication is not something each controller remembers to do.

**Bonus — change password.** `PATCH /customers/change-password` verifies the old password
with `bcrypt.compare` before hashing the new one. Verifying the old password is what stops
someone with a stolen session from locking the real owner out.

---

## Lab 02 — Frontend auth

**Why `withCredentials: true`?**
By default `axios`/`fetch` do not send cookies on cross-origin requests, and
`localhost:5173` → `localhost:5000` is cross-origin (different port). Without it the
`token` cookie never leaves the browser and every protected call 401s. It is set once in
`frontend/src/services/api.js`. The server side of the same deal is
`cors({ origin: 'http://localhost:5173', credentials: true })` in `backend/index.js` —
both halves are required, and `credentials: true` is why the origin cannot be `*`.

**Why can't JavaScript read an HttpOnly cookie?**
The browser enforces it: the cookie exists in the cookie jar and is attached to requests,
but it is not exposed to the `document.cookie` API. That is the whole point — see Lab 01.

**Why is `/home` a protected route?**
It renders a specific customer's data. Being a *route* guard, it is only UX: it stops the
page rendering an error and sends the visitor to `/login`. The real protection is on the
server, because anyone can call the API directly. Ours is `components/ProtectedRoute.jsx`
— one guard wrapping `/home`, `/wishlist`, `/cart`, `/checkout`, `/orders`.

**Why fetch `/customers/me` instead of storing the user?**
Because the client cannot be trusted to know whether it is logged in. The cookie may have
expired, been cleared, or the account deleted. Asking the server is the only honest answer,
and it is the same request that proves the cookie is still valid. A user object kept in
state would survive logout and go stale.

**Authentication vs authorization.**
Authentication is *who are you* — the JWT and `protect`. Authorization is *are you allowed
to do this* — e.g. `Order.findOne({ _id, user: req.user._id })` in
`controllers/order.controller.js`, which authenticates you and then refuses an order that
is not yours.

---

## Lab 03 — Product catalog

**Why MongoDB instead of hardcoded React data?**
One source of truth. Price, stock and catalogue change without a redeploy, every client sees
the same data, and search/filter can run where the data lives. Hardcoded arrays go stale and
cannot be shared between the cart, the wishlist and orders.

**URL parameter vs query parameter.**
A URL parameter identifies *one* resource and is part of its address: `/products/:id`. A
query parameter modifies a *collection*: `/products?search=phone&category=Electronics`.
Rule of thumb: change the path when you mean a different thing, change the query when you
mean a different view of the same things.

**Why does `.map()` matter?**
It turns an array of data into an array of elements, so the UI is a function of the data.
Add a product in Mongo and a card appears with no code change. `pages/Products.jsx`:
`products.map(p => <ProductCard key={p._id} product={p} />)`. The `key` lets React match
elements to data across re-renders instead of rebuilding the list.

**Why loading and error states?**
Because a network request has three outcomes, not one. A blank screen during a slow request
looks broken, and a silent failure looks like "no products". All three states are explicit
in `Products.jsx`, `Wishlist.jsx`, `Cart.jsx` and `Orders.jsx`.

**What happens on an empty array?**
Nothing renders, which is why the empty state is a separate branch with its own message and
a way out ("Browse Products"). An empty result is a valid answer, not an error.

**Why filter on the backend?**
The frontend only ever holds the page it fetched. Filtering in React can only filter what
already arrived, so it silently misses matches and forces you to download the whole
collection. The database has the indexes. See `getProducts` in
`controllers/product.controller.js`, which builds the query object dynamically.

**Why separate the service layer from components?**
`services/api.js` owns the base URL, credentials and endpoint shapes in one place. A
component asks `getCart()` and does not know the URL. Change the port or a path once, not in
fifteen components.

---

## Lab 04 — Wishlist (MongoDB relationships)

**Why store ObjectIds, not product objects?**
The Product collection stays the source of truth. If you copy name and price into the
wishlist, then every price change has to be written to every wishlist that holds it — and
until it is, the customer sees a stale price. A reference is always current.
`models/customer.model.js`: `wishlist: [{ type: ObjectId, ref: 'Product' }]`.

**What does `ref: 'Product'` do?**
It is metadata for Mongoose, not a database constraint. MongoDB stores a plain ObjectId;
`ref` tells Mongoose which model to look in when you call `populate()`. There is no foreign
key and no cascade — which is why `getWishlist` filters out `null` entries for products that
were deleted after being saved.

**Embedding vs referencing.**
Embed when the child has no life of its own and is always read with the parent (the shipping
address inside an order). Reference when the child is shared, large, or changes
independently (products). Embedding duplicates and goes stale; referencing costs an extra
lookup.

**Why `populate()`?**
It replaces stored ObjectIds with the actual documents in one call, so the API can return
product names and prices while the database stores only references. We narrow it with
`select` so only the five fields the card needs cross the wire:
`.populate({ path: 'wishlist', select: 'name price category image stock' })`.

**Why must wishlist endpoints be protected, and why take the user from the JWT?**
A wishlist is personal data. If the id came from the request body or the URL, anyone could
read or write anyone else's wishlist by changing a number — the classic IDOR. The JWT is
signed, so `req.user._id` cannot be forged. That is why there is deliberately no
`GET /wishlist/:userId` in this codebase. Proof: the test
*"one customer never sees another customer wishlist"* in `backend/tests/api.test.js`.

**How are duplicates prevented, and what status?**
`customer.wishlist.some(id => id.equals(productId))` before pushing — and **409 Conflict**,
because the request was well-formed but conflicts with current state. Not 400 (the request
was fine) and not 200 (nothing was created).

**Why should the wishlist survive a refresh?**
Because it lives in MongoDB, not in React state. React state dies with the tab. That is also
why the heart icon still shows filled after a reload: `CartContext` fetches the saved ids on
mount.

---

## Lab 05 — Cart (state management)

**Why does the cart need global state?**
Four surfaces read the same cart: the product card, the cart page, the navbar badge and the
order summary. If each fetched its own copy they would drift — the navbar saying 2 while the
page shows 3. One provider, one copy: `frontend/src/context/CartContext.jsx`.

**Why shouldn't the navbar fetch the cart itself?**
It would be a second copy with its own timing, and nothing would tell it that a card just
added an item. It reads `itemCount` from the context instead, so one state update moves
every surface at once.

**Server state vs frontend state.**
Server state is the durable truth in MongoDB. Frontend state is a cache of it plus things
that only exist in the UI (which button is mid-request). Our rule: after every mutation the
server returns the whole populated cart and the context replaces its state from that
response — `runMutation` in `CartContext.jsx` — so the cache is never patched by guesswork.

**What is derived state? Why not store the subtotal?**
Derived state is computed from other state rather than stored: `itemCount` and `subtotal`
are `reduce` calls over `cartItems`. A stored subtotal is a second truth that goes wrong the
moment a price or quantity changes — and it would let the client dictate what it pays.
Formula: `Σ product.price × quantity`.

**Why does the cart need quantity but the wishlist doesn't?**
"I want three of these" is cart information. A wishlist only answers whether a product is
saved — a set, not a tally. That is why one is `[ObjectId]` and the other is
`[{ product, quantity }]`.

**Why not copy the product price into the cart?**
The customer should pay today's price, so the cart reads it live through `populate`. Orders
are the opposite — see Lab 06.

**How is stock enforced? What happens on adding twice?**
`addToCart` computes `nextQuantity` first and refuses with 400 if it exceeds `product.stock`
— so the row is never written in a bad state. Adding an existing product increments its
quantity instead of creating a second row. Tests: *"adding the same product twice increments
quantity"* and *"refuses to exceed available stock"*.

**How does the badge update without a refresh?**
Clicking Add calls the API, the response carries the new cart, the context sets state, React
re-renders everyone subscribed — the navbar included. Verified live: `Cart (0) → (1) → (2) → (3)`.

**How do you give one row its own loading state?**
`pending` lives inside `CartItem`, not in the context, so only that row's buttons disable.
Global state is for shared data; per-interaction state stays local.

**What if a mutation fails?** The context state is untouched (it only updates on a resolved
promise), and the component shows the server's message — e.g. "Only 10 units of X available".

---

## Lab 06 — Checkout, payments, orders

### Payments

**Why create the Razorpay order on the backend?**
The amount is decided there. If the browser created it, anyone could open DevTools and ask
to pay ₹1. The server computes the total from current prices and tells Razorpay the amount;
the browser only receives an `order_id` it cannot alter. `createPaymentOrder` in
`controllers/order.controller.js`.

**Why does the key secret never reach React?**
Anything in the bundle is public. The secret is what proves a payment notification really
came from Razorpay — a leaked secret lets anyone forge a valid signature. Only
`RAZORPAY_KEY_ID` is sent (`key:` in the response); the secret stays in `.env`, which is
gitignored. `config/razorpay.js` reads it server-side only.

**Why paise?**
Razorpay takes the amount in the currency's smallest unit, so INR is paise: ₹7,497 →
`749700`. Integers avoid floating-point rounding on money. Ours:
`Math.round(totalAmount * 100)`.

**What are the three Razorpay values?**
`razorpay_order_id` — the order the server created. `razorpay_payment_id` — the attempt that
succeeded. `razorpay_signature` — `HMAC_SHA256(order_id + "|" + payment_id, key_secret)`,
which only someone holding the secret could produce.

**Why is signature verification mandatory?**
Without it the "payment succeeded" claim comes from the browser, which the customer
controls. Recomputing the HMAC with our secret and comparing proves Razorpay said it. Ours
uses `crypto.timingSafeEqual` so comparison time does not leak the expected value.
**Important detail:** the HMAC is built from `order.razorpayOrderId` read out of our own
database, *not* from any `razorpay_order_id` in the request body — otherwise an attacker
could supply an order id they had a valid signature for. Test: *"signature is checked
against the stored razorpayOrderId, not a client-supplied one"*.

**Why not clear the cart when checkout merely opens?**
The customer may abandon the sheet or the payment may fail. Clearing early loses their cart
for nothing. The cart is emptied only after the signature verifies — and the test
*"verify-payment rejects a forged signature and leaves the cart alone"* proves the failure
path keeps it.

**What if the client just sent `paymentSuccess: true`?**
They would get goods for free. Never trust a client-side success flag; trust the signature.

### Orders

**Why does an order store name and price separately from Product?**
An order is a historical record of what was bought at what price. If it only referenced the
product, raising a price next month would silently rewrite last month's invoice. Snapshot
fields in `models/order.model.js`, proven by the test *"snapshot keeps the purchase-time
price when the product price changes later"*.

**Cart data vs order data.** Cart = live reference, must show today's price. Order =
immutable snapshot, must show the price paid. Same products, opposite requirements.

**Why does an order reference the user?** To scope every read to its owner and to list
"my orders". `user: { type: ObjectId, ref: 'Customer', required: true }`.

### Security and business logic

**Why calculate `totalAmount` on the server?** Because the client can send anything. We
ignore the body entirely and recompute from current `Product.price`.

**Why re-check stock at checkout?** Time passes between adding to the cart and paying, and
someone else may have bought the last unit. `createPaymentOrder` reloads the products and
refuses with 400 — tested by dropping stock to 1 with a quantity of 3 in the cart.

**Why not trust the frontend's order items?** They would be free to add items or change
prices. The server builds the items from the authenticated customer's own cart.

**How do you stop a customer reading someone else's order?** Make ownership part of the
query: `Order.findOne({ _id: req.params.id, user: req.user._id })`. A stranger's id simply
does not match, so it 404s — a 403 would confirm the order exists. Tested.

### State management

**Why clear global cart state after an order?** The server cart is empty; if the UI kept its
copy the navbar would still show items that no longer exist. `clearCartState()` runs right
after a successful verification.

**What if the backend succeeds but the frontend doesn't update?** The customer sees a stale
cart and may try to buy the same things again. The data is safe but the UI is lying.

**Why must the cart survive a failed order?** Rebuilding a cart is the work the customer
already did. Losing it over our error is the worst version of the failure.

### React

**Where does checkout form state live?** In `pages/Checkout.jsx`, which owns it and passes
values plus errors down to the presentational `CheckoutForm`. It is used by one page, so
putting it in global state would be noise — the opposite call from the cart, and for the
same reason: scope state to who needs it.

**What loading states exist while placing an order?** The button reads "Placing order..."
and is disabled; closing the Razorpay sheet (`modal.ondismiss`) re-enables it; failures show
a message in a `role="alert"` block.

**What if the cart is empty and someone opens `/checkout` directly?** The page renders
"Your cart is empty." with a link to products, and never shows the form. The server refuses
too, with 400.

---

## The 30-second architecture answer

```
Register / Login          bcrypt hash, JWT in an HttpOnly cookie
      ↓
protect middleware        cookie -> verified customer on req.user
      ↓
Products                  Mongo is the source of truth; search/filter/sort in the query
      ↓
Wishlist                  [ObjectId] refs + populate(); 409 on duplicate
      ↓
Cart                      [{ product, quantity }]; stock capped server-side
      ↓
CartContext               one copy of cart state; subtotal and badge derived
      ↓
Checkout                  client validates, server re-validates address + stock
      ↓
Server total              Σ latest price × quantity; body total ignored
      ↓
Order (PENDING_PAYMENT)   name/price snapshot written
      ↓
Razorpay order            amount in paise, created server-side
      ↓
Razorpay Checkout         browser gets order_id only; secret never leaves the server
      ↓
verify-payment            HMAC over the STORED order id; timing-safe compare
      ↓
PAID + PLACED             then, and only then, the cart is cleared
      ↓
My Orders                 scoped by user; snapshot prices never move
```

## If the TA asks "how do you know it works?"

```bash
cd backend && npm test
```

24 tests over the real API and database, including the ones that matter:
forged payment signature rejected, substituted order id rejected, cross-customer order read
refused, stock exhaustion refused mid-checkout, duplicate wishlist entry refused, cart
quantity capped at stock, and the purchase-time price surviving a product price change.
