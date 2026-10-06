const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret_for_hmac';

const { app, connectDB } = require('../index');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

let base;
let server;
const created = { customerIds: [], orderIds: [] };

// Minimal cookie-jar fetch: Express sets one `token` cookie, so store the raw header
const makeClient = () => {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(cookie ? { cookie } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const setCookie = res.headers.getSetCookie?.() ?? [];
    if (setCookie.length) cookie = setCookie.map(c => c.split(';')[0]).join('; ');
    let json = null;
    try { json = await res.json(); } catch { /* empty body */ }
    return { status: res.status, body: json };
  };
};

const registerCustomer = async () => {
  const client = makeClient();
  const email = `labtest+${Date.now()}${Math.random().toString(36).slice(2, 7)}@example.com`;
  const reg = await client('POST', '/customers/register', {
    fullName: 'Lab Test', email, password: 'test1234', phone: '9876543210'
  });
  assert.equal(reg.status, 201, JSON.stringify(reg.body));
  created.customerIds.push(reg.body.customer._id);
  await client('POST', '/customers/login', { email, password: 'test1234' });
  return client;
};

test.before(async () => {
  await connectDB();
  server = app.listen(0);
  await new Promise(r => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (created.customerIds.length) await Customer.deleteMany({ _id: { $in: created.customerIds } });
  if (created.orderIds.length) {
    await mongoose.model('Order').deleteMany({ _id: { $in: created.orderIds } });
  }
  server?.close();
  await mongoose.disconnect();
});

test('wishlist: rejects an unauthenticated request', async () => {
  const anon = makeClient();
  const res = await anon('GET', '/wishlist');
  assert.equal(res.status, 401);
});

test('wishlist: rejects a malformed product id with 400, not 500', async () => {
  const client = await registerCustomer();
  const res = await client('POST', '/wishlist/not-an-objectid');
  assert.equal(res.status, 400);
});

test('wishlist: add, reject duplicate with 409, list populated, remove', async () => {
  const client = await registerCustomer();
  const product = await Product.findOne({ stock: { $gt: 0 } });

  const add = await client('POST', `/wishlist/${product._id}`);
  assert.equal(add.status, 201);

  const dup = await client('POST', `/wishlist/${product._id}`);
  assert.equal(dup.status, 409);

  const list = await client('GET', '/wishlist');
  assert.equal(list.status, 200);
  assert.equal(list.body.count, 1);
  // populate() ran: the entry is the product document, not a bare id
  assert.equal(list.body.wishlist[0].name, product.name);
  assert.equal(list.body.wishlist[0].price, product.price);

  const del = await client('DELETE', `/wishlist/${product._id}`);
  assert.equal(del.status, 200);

  const again = await client('DELETE', `/wishlist/${product._id}`);
  assert.equal(again.status, 404);
});

test('wishlist: 404 for a product that does not exist', async () => {
  const client = await registerCustomer();
  const ghost = new mongoose.Types.ObjectId();
  const res = await client('POST', `/wishlist/${ghost}`);
  assert.equal(res.status, 404);
  // Assert on the body too: Express's own 404 for an unmounted route would
  // otherwise make this test pass without the product lookup existing.
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /not found/i);
});

test('wishlist: one customer never sees another customer wishlist', async () => {
  const a = await registerCustomer();
  const b = await registerCustomer();
  const product = await Product.findOne({ stock: { $gt: 0 } });
  await a('POST', `/wishlist/${product._id}`);

  const bList = await b('GET', '/wishlist');
  assert.equal(bList.body.count, 0);
});

test('wishlist: toggle saves then unsaves and reports the count', async () => {
  const client = await registerCustomer();
  const product = await Product.findOne({ stock: { $gt: 0 } });

  const on = await client('PATCH', `/wishlist/${product._id}/toggle`);
  assert.equal(on.status, 200);
  assert.equal(on.body.saved, true);
  assert.equal(on.body.count, 1);

  const off = await client('PATCH', `/wishlist/${product._id}/toggle`);
  assert.equal(off.body.saved, false);
  assert.equal(off.body.count, 0);
});

test('cart: rejects an unauthenticated request', async () => {
  const anon = makeClient();
  assert.equal((await anon('GET', '/cart')).status, 401);
});

test('cart: adding the same product twice increments quantity instead of duplicating', async () => {
  const client = await registerCustomer();
  const product = await Product.findOne({ stock: { $gte: 2 } });

  const first = await client('POST', `/cart/${product._id}`);
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.equal(first.body.cart.length, 1);
  assert.equal(first.body.cart[0].quantity, 1);

  const second = await client('POST', `/cart/${product._id}`);
  assert.equal(second.body.cart.length, 1, 'no duplicate row for the same product');
  assert.equal(second.body.cart[0].quantity, 2);
  // populate() ran
  assert.equal(second.body.cart[0].product.name, product.name);
});

test('cart: refuses to exceed available stock', async () => {
  const client = await registerCustomer();
  const product = await Product.findOne({ stock: { $gt: 0 } });

  const tooMany = await client('PATCH', `/cart/${product._id}`, { quantity: product.stock + 1 });
  assert.equal(tooMany.status, 404, 'product is not in the cart yet');

  await client('POST', `/cart/${product._id}`);
  const over = await client('PATCH', `/cart/${product._id}`, { quantity: product.stock + 1 });
  assert.equal(over.status, 400);

  const atLimit = await client('PATCH', `/cart/${product._id}`, { quantity: product.stock });
  assert.equal(atLimit.status, 200);
  assert.equal(atLimit.body.cart[0].quantity, product.stock);

  // one more "add" would push past stock
  const bump = await client('POST', `/cart/${product._id}`);
  assert.equal(bump.status, 400);
});

test('cart: refuses a product that is out of stock', async () => {
  const client = await registerCustomer();
  const soldOut = await Product.findOne({ stock: 0 });
  if (!soldOut) return; // seed data always has one, but do not fail the suite if it changed
  const res = await client('POST', `/cart/${soldOut._id}`);
  assert.equal(res.status, 400);
  assert.match(res.body.message, /out of stock/i);
});

test('cart: rejects quantity below 1 and non-numeric quantity', async () => {
  const client = await registerCustomer();
  const product = await Product.findOne({ stock: { $gt: 0 } });
  await client('POST', `/cart/${product._id}`);

  assert.equal((await client('PATCH', `/cart/${product._id}`, { quantity: 0 })).status, 400);
  assert.equal((await client('PATCH', `/cart/${product._id}`, { quantity: -3 })).status, 400);
  assert.equal((await client('PATCH', `/cart/${product._id}`, { quantity: 'two' })).status, 400);
});

test('cart: rejects a malformed product id with 400, not 500', async () => {
  const client = await registerCustomer();
  assert.equal((await client('POST', '/cart/not-an-objectid')).status, 400);
});

test('cart: remove empties the row and reports the updated cart', async () => {
  const client = await registerCustomer();
  const product = await Product.findOne({ stock: { $gt: 0 } });
  await client('POST', `/cart/${product._id}`);

  const removed = await client('DELETE', `/cart/${product._id}`);
  assert.equal(removed.status, 200);
  assert.equal(removed.body.cart.length, 0);

  assert.equal((await client('DELETE', `/cart/${product._id}`)).status, 404);
});
