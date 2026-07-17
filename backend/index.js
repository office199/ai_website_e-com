require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi');

const app = express();
const PORT = process.env.PORT || 4000;
const { MONGODB_URI, JWT_SECRET } = process.env;
const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required. Copy backend/.env.example to backend/.env and configure MongoDB.');
}
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
}

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// Interactive API documentation. Open http://localhost:4000/api-docs in a browser.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, {
  customSiteTitle: 'MODÉ API documentation',
  swaggerOptions: { persistAuthorization: true },
}));
app.get('/api-docs.json', (_req, res) => res.json(openapi));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    status: { type: String, enum: ['active', 'deactivated'], default: 'active' },
  },
  { timestamps: true }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    category: { type: String, required: true, trim: true, lowercase: true, maxlength: 40 },
    type: { type: String, required: true, trim: true, maxlength: 100 },
    price: { type: Number, required: true, min: 0 },
    color: { type: String, required: true, trim: true, maxlength: 60 },
    image: { type: String, required: true, trim: true, maxlength: 2000 },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

const wishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

const newsletterSubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  },
  { timestamps: true }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        image: { type: String, required: true },
        color: { type: String, required: true },
        category: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' },
  },
  { timestamps: true }
);

// Taxonomy managed from the admin console. Top-level categories use parent: null;
// subcategories point at their parent category. Each carries an icon chosen at creation.
const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    icon: { type: String, trim: true, maxlength: 16, default: '🏷️' },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Promotional codes created by administrators.
const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 160, default: '' },
    type: { type: String, enum: ['percent', 'fixed'], required: true, default: 'percent' },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, min: 0, default: 0 },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Customer reviews on products. Moderated by administrators (pending/approved/rejected).
const reviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Cart = mongoose.model('Cart', cartSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);
const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
const Order = mongoose.model('Order', orderSchema);
const Category = mongoose.model('Category', categorySchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const Review = mongoose.model('Review', reviewSchema);

const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
});

const publicProduct = (product) => {
  if (!product) return null;
  return {
    id: product._id.toString(),
    name: product.name,
    category: product.category,
    type: product.type,
    price: product.price,
    color: product.color,
    image: product.image,
    stock: product.stock,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const publicCategory = (category) => ({
  id: category._id.toString(),
  name: category.name,
  icon: category.icon,
  parent: category.parent ? category.parent.toString() : null,
  order: category.order,
  createdAt: category.createdAt,
});

const publicCoupon = (coupon) => ({
  id: coupon._id.toString(),
  code: coupon.code,
  description: coupon.description,
  type: coupon.type,
  value: coupon.value,
  minOrder: coupon.minOrder,
  expiresAt: coupon.expiresAt,
  active: coupon.active,
  usageLimit: coupon.usageLimit,
  usedCount: coupon.usedCount,
  createdAt: coupon.createdAt,
});

const publicReview = (review) => ({
  id: review._id.toString(),
  productId: review.product && review.product._id ? review.product._id.toString() : (review.product ? review.product.toString() : null),
  product: review.product && review.product.name ? publicProduct(review.product) : null,
  userId: review.user && review.user._id ? review.user._id.toString() : (review.user ? review.user.toString() : null),
  name: review.name,
  rating: review.rating,
  title: review.title,
  comment: review.comment,
  status: review.status,
  createdAt: review.createdAt,
});

const publicCart = (cart) =>
  (cart?.items || [])
    .filter((item) => item.product)
    .map((item) => ({
      productId: item.product._id.toString(),
      quantity: item.quantity,
      product: publicProduct(item.product),
    }));

const publicOrder = (order, includeUser = false) => {
  const result = {
    id: order.orderNumber,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      productId: item.product?.toString(),
      quantity: item.quantity,
      product: {
        id: item.product?.toString(),
        name: item.name,
        price: item.price,
        image: item.image,
        color: item.color,
        category: item.category,
      },
    })),
  };

  if (includeUser && order.user) result.user = publicUser(order.user);
  return result;
};

const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '7d' });

const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication is required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Your account no longer exists.' });
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Your session is invalid or has expired.' });
  }
};

const requireAdmin = [requireAuth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administrator access is required.' });
  return next();
}];

const validObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateProductPayload = (body, partial = false) => {
  const fields = ['name', 'category', 'type', 'price', 'color', 'image', 'stock'];
  const payload = {};

  for (const field of fields) {
    if (body[field] === undefined) {
      if (!partial) return { error: `${field} is required.` };
      continue;
    }
    payload[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
  }

  for (const field of ['name', 'category', 'type', 'color', 'image']) {
    if (payload[field] !== undefined && !payload[field]) return { error: `${field} cannot be empty.` };
  }
  for (const field of ['price', 'stock']) {
    if (payload[field] !== undefined) {
      const number = Number(payload[field]);
      if (!Number.isFinite(number) || number < 0) return { error: `${field} must be a non-negative number.` };
      payload[field] = number;
    }
  }
  if (payload.stock !== undefined && !Number.isInteger(payload.stock)) return { error: 'stock must be a whole number.' };
  if (payload.image !== undefined && !/^https?:\/\//i.test(payload.image)) return { error: 'image must be an http(s) URL.' };

  return { payload };
};

const validateCouponPayload = (body, partial = false) => {
  const payload = {};
  const required = !partial;

  if (body.code !== undefined || required) {
    const code = String(body.code || '').trim().toUpperCase();
    if (!code) return { error: 'Coupon code is required.' };
    if (!/^[A-Z0-9-]{3,40}$/.test(code)) return { error: 'Code must be 3–40 letters, numbers or dashes.' };
    payload.code = code;
  }
  if (body.type !== undefined || required) {
    payload.type = ['percent', 'fixed'].includes(body.type) ? body.type : 'percent';
  }
  if (body.value !== undefined || required) {
    const value = Number(body.value);
    if (!Number.isFinite(value) || value < 0) return { error: 'Discount value must be a non-negative number.' };
    payload.value = value;
  }
  if (payload.type === 'percent' && payload.value !== undefined && payload.value > 100) {
    return { error: 'A percentage discount cannot exceed 100.' };
  }
  if (body.description !== undefined) payload.description = String(body.description).trim().slice(0, 160);
  if (body.minOrder !== undefined) {
    const minOrder = Number(body.minOrder);
    if (!Number.isFinite(minOrder) || minOrder < 0) return { error: 'Minimum order must be a non-negative number.' };
    payload.minOrder = minOrder;
  }
  if (body.expiresAt !== undefined) {
    if (!body.expiresAt) {
      payload.expiresAt = null;
    } else {
      const expiresAt = new Date(body.expiresAt);
      if (Number.isNaN(expiresAt.getTime())) return { error: 'Invalid expiry date.' };
      payload.expiresAt = expiresAt;
    }
  }
  if (body.usageLimit !== undefined) payload.usageLimit = body.usageLimit ? Math.max(0, Math.floor(Number(body.usageLimit))) : null;
  if (body.active !== undefined) payload.active = Boolean(body.active);

  if (!Object.keys(payload).length) return { error: 'Provide at least one coupon field to update.' };
  return { payload };
};

const getPopulatedCart = async (userId) =>
  Cart.findOne({ user: userId }).populate('items.product');

app.get('/api/health', (_req, res) => {
  res.json({ ok: mongoose.connection.readyState === 1, service: 'MODÉ API' });
});

// Authentication
app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters.' });

    const existingUser = await User.exists({ email });
    if (existingUser) return res.status(409).json({ error: 'An account with that email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const role = adminEmails.includes(email) ? 'admin' : 'customer';
    const user = await User.create({ name, email, passwordHash, role });
    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact an administrator.' });
    }

    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

app.post('/api/newsletter', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    await NewsletterSubscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
    return res.status(201).json({ message: 'You are subscribed.' });
  } catch (error) {
    return next(error);
  }
});

// Public catalogue
app.get('/api/products', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = String(req.query.category).toLowerCase();
    const products = await Product.find(filter).sort({ createdAt: -1 });
    return res.json(products.map(publicProduct));
  } catch (error) {
    return next(error);
  }
});

app.get('/api/products/:id', async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found.' });
    const product = await Product.findById(req.params.id);
    return product ? res.json(publicProduct(product)) : res.status(404).json({ error: 'Product not found.' });
  } catch (error) {
    return next(error);
  }
});

// Public category taxonomy (managed by administrators)
app.get('/api/categories', async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ order: 1, createdAt: 1 });
    return res.json(categories.map(publicCategory));
  } catch (error) {
    return next(error);
  }
});

// Reviews: approved reviews are public, any authenticated customer may submit one
app.get('/api/products/:id/reviews', async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found.' });
    const reviews = await Review.find({ product: req.params.id, status: 'approved' }).sort({ createdAt: -1 });
    return res.json(reviews.map(publicReview));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/products/:id/reviews', requireAuth, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found.' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();
    const title = String(req.body.title || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    if (!comment) return res.status(400).json({ error: 'Please write a short review.' });

    const existing = await Review.findOne({ product: product._id, user: req.user._id });
    if (existing) return res.status(409).json({ error: 'You have already reviewed this product.' });

    const review = await Review.create({
      product: product._id,
      user: req.user._id,
      name: req.user.name,
      rating,
      title,
      comment,
      status: 'pending',
    });
    return res.status(201).json(publicReview(review));
  } catch (error) {
    return next(error);
  }
});

// Cart (the authenticated user is always the cart owner)
app.get('/api/cart', requireAuth, async (req, res, next) => {
  try {
    const cart = await getPopulatedCart(req.user._id);
    return res.json(publicCart(cart));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/cart', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    const quantity = Number(req.body.quantity || 1);
    if (!validObjectId(productId)) return res.status(400).json({ error: 'A valid product is required.' });
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ error: 'Quantity must be a whole number greater than zero.' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    if (product.stock < quantity) return res.status(400).json({ error: 'That quantity is not currently in stock.' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });
    const item = cart.items.find((cartItem) => cartItem.product.toString() === product._id.toString());
    const nextQuantity = (item?.quantity || 0) + quantity;
    if (nextQuantity > product.stock) return res.status(400).json({ error: 'That quantity is not currently in stock.' });

    if (item) item.quantity = nextQuantity;
    else cart.items.push({ product: product._id, quantity });
    await cart.save();
    await cart.populate('items.product');
    return res.status(201).json(publicCart(cart));
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/cart/:productId', requireAuth, async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity);
    if (!validObjectId(req.params.productId) || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'A valid product and quantity are required.' });
    }

    const [cart, product] = await Promise.all([
      Cart.findOne({ user: req.user._id }),
      Product.findById(req.params.productId),
    ]);
    const item = cart?.items.find((cartItem) => cartItem.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ error: 'Cart item not found.' });
    if (!product || product.stock < quantity) return res.status(400).json({ error: 'That quantity is not currently in stock.' });

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product');
    return res.json(publicCart(cart));
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/cart/:productId', requireAuth, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.productId)) return res.status(404).json({ error: 'Cart item not found.' });
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(204).end();
    cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
    await cart.save();
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// Wishlist
app.get('/api/wishlist', requireAuth, async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
    return res.json((wishlist?.products || []).filter(Boolean).map(publicProduct));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/wishlist', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!validObjectId(productId)) return res.status(400).json({ error: 'A valid product is required.' });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = new Wishlist({ user: req.user._id, products: [] });
    if (!wishlist.products.some((id) => id.toString() === product.id)) wishlist.products.push(product._id);
    await wishlist.save();
    await wishlist.populate('products');
    return res.status(201).json(wishlist.products.filter(Boolean).map(publicProduct));
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/wishlist/:productId', requireAuth, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.productId)) return res.status(404).json({ error: 'Wishlist item not found.' });
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter((id) => id.toString() !== req.params.productId);
      await wishlist.save();
    }
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// Orders
app.get('/api/orders', requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(orders.map((order) => publicOrder(order)));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/orders', requireAuth, async (req, res, next) => {
  try {
    const cart = await getPopulatedCart(req.user._id);
    const validItems = (cart?.items || []).filter((item) => item.product);
    if (!validItems.length) return res.status(400).json({ error: 'Your bag is empty.' });

    const unavailable = validItems.find((item) => item.product.stock < item.quantity);
    if (unavailable) return res.status(400).json({ error: `${unavailable.product.name} no longer has enough stock.` });

    const subtotal = validItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shipping = subtotal >= 100 ? 0 : 12;
    const total = subtotal + shipping;

    // Reserve inventory before recording the order. The stock condition protects against concurrent checkouts.
    for (const item of validItems) {
      const reserved = await Product.findOneAndUpdate(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!reserved) return res.status(409).json({ error: `${item.product.name} just sold out. Please review your bag.` });
    }

    const order = await Order.create({
      orderNumber: `MO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      user: req.user._id,
      items: validItems.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        color: item.product.color,
        category: item.product.category,
        quantity: item.quantity,
      })),
      subtotal,
      shipping,
      total,
    });

    cart.items = [];
    await cart.save();
    return res.status(201).json(publicOrder(order));
  } catch (error) {
    return next(error);
  }
});

// Administrator-only store management
app.get('/api/admin/metrics', ...requireAdmin, async (_req, res, next) => {
  try {
    const [revenueResult, orders, customers, products, pendingReviews] = await Promise.all([
      Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Review.countDocuments({ status: 'pending' }),
    ]);

    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 6);
    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: start }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' } } },
    ]);
    const revenueByDate = new Map(dailyRevenue.map((row) => [row._id, row.revenue]));
    const salesByDay = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { label: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).slice(0, 1), revenue: revenueByDate.get(key) || 0 };
    });

    const revenue = revenueResult[0]?.total || 0;
    return res.json({
      revenue,
      orders,
      customers,
      products,
      pendingReviews,
      averageOrderValue: orders ? revenue / orders : 0,
      salesByDay,
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/orders', ...requireAdmin, async (_req, res, next) => {
  try {
    const orders = await Order.find().populate('user').sort({ createdAt: -1 }).limit(50);
    return res.json(orders.map((order) => publicOrder(order, true)));
  } catch (error) {
    return next(error);
  }
});

// User management
app.get('/api/admin/users', ...requireAdmin, async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json(users.map(publicUser));
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/admin/users/:id', ...requireAdmin, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'User not found.' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    const isSelf = req.user._id.toString() === target._id.toString();
    const update = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });
      update.name = name;
    }
    if (req.body.role !== undefined) {
      if (!['customer', 'admin'].includes(req.body.role)) return res.status(400).json({ error: 'Invalid role.' });
      if (isSelf && req.body.role !== 'admin') return res.status(400).json({ error: 'You cannot remove your own administrator role.' });
      update.role = req.body.role;
    }
    if (req.body.status !== undefined) {
      if (!['active', 'deactivated'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid status.' });
      if (isSelf && req.body.status === 'deactivated') return res.status(400).json({ error: 'You cannot deactivate your own account.' });
      update.status = req.body.status;
    }
    if (!Object.keys(update).length) return res.status(400).json({ error: 'Provide at least one field to update.' });

    const updated = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    return res.json(publicUser(updated));
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/users/:id', ...requireAdmin, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'User not found.' });
    if (req.user._id.toString() === req.params.id) return res.status(400).json({ error: 'You cannot delete your own account.' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    await Promise.all([
      Cart.deleteOne({ user: user._id }),
      Wishlist.deleteOne({ user: user._id }),
      Review.deleteMany({ user: user._id }),
    ]);
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/products', ...requireAdmin, async (req, res, next) => {
  try {
    const { payload, error } = validateProductPayload(req.body);
    if (error) return res.status(400).json({ error });
    const product = await Product.create(payload);
    return res.status(201).json(publicProduct(product));
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/admin/products/:id', ...requireAdmin, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found.' });
    const { payload, error } = validateProductPayload(req.body, true);
    if (error) return res.status(400).json({ error });
    if (!Object.keys(payload).length) return res.status(400).json({ error: 'Provide at least one product field to update.' });
    const product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    return product ? res.json(publicProduct(product)) : res.status(404).json({ error: 'Product not found.' });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/products/:id', ...requireAdmin, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found.' });
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    await Promise.all([
      Cart.updateMany({}, { $pull: { items: { product: product._id } } }),
      Wishlist.updateMany({}, { $pull: { products: product._id } }),
      Review.deleteMany({ product: product._id }),
    ]);
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// Category management (categories and subcategories, each with an icon)
app.get('/api/admin/categories', ...requireAdmin, async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ order: 1, createdAt: 1 });
    return res.json(categories.map(publicCategory));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/categories', ...requireAdmin, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Category name is required.' });
    const icon = String(req.body.icon || '').trim().slice(0, 16) || '🏷️';
    let parent = null;
    if (req.body.parent) {
      if (!validObjectId(req.body.parent)) return res.status(400).json({ error: 'Invalid parent category.' });
      parent = req.body.parent;
    }
    const order = Number.isFinite(Number(req.body.order)) ? Number(req.body.order) : 0;
    const category = await Category.create({ name, icon, parent, order });
    return res.status(201).json(publicCategory(category));
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/admin/categories/:id', ...requireAdmin, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'Category not found.' });
    const update = {};
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ error: 'Category name cannot be empty.' });
      update.name = name;
    }
    if (req.body.icon !== undefined) update.icon = String(req.body.icon).trim().slice(0, 16) || '🏷️';
    if (req.body.order !== undefined && Number.isFinite(Number(req.body.order))) update.order = Number(req.body.order);
    if (req.body.parent !== undefined) {
      if (req.body.parent && req.body.parent.toString() === req.params.id) return res.status(400).json({ error: 'A category cannot be its own parent.' });
      update.parent = req.body.parent && validObjectId(req.body.parent) ? req.body.parent : null;
    }
    if (!Object.keys(update).length) return res.status(400).json({ error: 'Provide at least one field to update.' });
    const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    return category ? res.json(publicCategory(category)) : res.status(404).json({ error: 'Category not found.' });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/categories/:id', ...requireAdmin, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'Category not found.' });
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found.' });
    // Cascade: remove subcategories when a parent category is deleted.
    await Category.deleteMany({ parent: category._id });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// Coupon management
app.get('/api/admin/coupons', ...requireAdmin, async (_req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.json(coupons.map(publicCoupon));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/coupons', ...requireAdmin, async (req, res, next) => {
  try {
    const { payload, error } = validateCouponPayload(req.body);
    if (error) return res.status(400).json({ error });
    const coupon = await Coupon.create(payload);
    return res.status(201).json(publicCoupon(coupon));
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/admin/coupons/:id', ...requireAdmin, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'Coupon not found.' });
    const { payload, error } = validateCouponPayload(req.body, true);
    if (error) return res.status(400).json({ error });
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    return coupon ? res.json(publicCoupon(coupon)) : res.status(404).json({ error: 'Coupon not found.' });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/coupons/:id', ...requireAdmin, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'Coupon not found.' });
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// Review moderation
app.get('/api/admin/reviews', ...requireAdmin, async (req, res, next) => {
  try {
    const filter = {};
    if (['pending', 'approved', 'rejected'].includes(req.query.status)) filter.status = req.query.status;
    const reviews = await Review.find(filter).populate('product').sort({ createdAt: -1 }).limit(200);
    return res.json(reviews.map(publicReview));
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/admin/reviews/:id', ...requireAdmin, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'Review not found.' });
    const update = {};
    if (req.body.rating !== undefined) {
      const rating = Number(req.body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
      update.rating = rating;
    }
    if (req.body.title !== undefined) update.title = String(req.body.title).trim().slice(0, 120);
    if (req.body.comment !== undefined) {
      const comment = String(req.body.comment).trim();
      if (!comment) return res.status(400).json({ error: 'Comment cannot be empty.' });
      update.comment = comment;
    }
    if (req.body.status !== undefined) {
      if (!['pending', 'approved', 'rejected'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid status.' });
      update.status = req.body.status;
    }
    if (!Object.keys(update).length) return res.status(400).json({ error: 'Provide at least one field to update.' });
    const review = await Review.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).populate('product');
    return review ? res.json(publicReview(review)) : res.status(404).json({ error: 'Review not found.' });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/reviews/:id', ...requireAdmin, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ error: 'Review not found.' });
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

app.use((error, _req, res, _next) => {
  if (error?.code === 11000) return res.status(409).json({ error: 'That record already exists.' });
  if (error?.name === 'ValidationError') return res.status(400).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`MODÉ API listening on :${PORT}`));
}

// Exported for tooling and tests. The server only starts when this file is run directly.
module.exports = {
  app,
  validateProductPayload,
  validateCouponPayload,
  publicUser,
  publicCategory,
  publicCoupon,
  publicReview,
};

if (require.main === module) {
  start().catch((error) => {
    console.error('Unable to start MODÉ API:', error.message);
    process.exit(1);
  });
}
