const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();
// Local DNS refuses SRV lookups for mongodb+srv URIs; use public resolvers
require('node:dns').setServers(['1.1.1.1', '8.8.8.8']);

const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

const connectDB = () => mongoose.connect(process.env.MONGO_URI);

// Only listen when started directly; tests import `app` and bind their own port
if (require.main === module) {
  connectDB()
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
    })
    .catch(err => console.error(err));
}

module.exports = { app, connectDB };
