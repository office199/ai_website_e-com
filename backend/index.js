const express = require('express');
const app = express();

app.use(express.json());

// Enable CORS for all methods and headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const products = [
  {
    id: 1,
    name: 'The Essential Blazer',
    category: 'women',
    type: 'Women · Tailoring',
    price: 148,
    color: 'Oat',
    image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=900&q=85',
    stock: 18
  },
  {
    id: 2,
    name: 'Relaxed Studio Shirt',
    category: 'men',
    type: 'Men · New in',
    price: 82,
    color: 'White',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=85',
    stock: 32
  },
  {
    id: 3,
    name: 'Soft Knit Set',
    category: 'baby',
    type: 'Baby · 0–24 months',
    price: 48,
    color: 'Rose',
    image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=85',
    stock: 24
  },
  {
    id: 4,
    name: 'Weekend Denim',
    category: 'kids',
    type: 'Kids · Everyday',
    price: 62,
    color: 'Indigo',
    image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=900&q=85',
    stock: 12
  }
];

let carts = {};
let wishlists = {};
let orders = [
  {
    id: 'MO-10428',
    userId: 'demo',
    total: 230,
    status: 'Processing',
    createdAt: '2025-03-08',
    items: [
      { productId: 1, quantity: 1, product: products[0] },
      { productId: 2, quantity: 1, product: products[1] }
    ]
  }
];

const findProduct = id => products.find(p => p.id === Number(id));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'MODÉ API' }));

app.get('/api/products', (req, res) => {
  const list = req.query.category 
    ? products.filter(p => p.category === req.query.category.toLowerCase()) 
    : products;
  res.json(list);
});

app.get('/api/products/:id', (req, res) => {
  const p = findProduct(req.params.id);
  p ? res.json(p) : res.status(404).json({ error: 'Product not found' });
});

app.get('/api/cart/:userId', (req, res) => {
  res.json(carts[req.params.userId] || []);
});

app.post('/api/cart/:userId', (req, res) => {
  const p = findProduct(req.body.productId);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  const cart = carts[req.params.userId] || [];
  const row = cart.find(x => x.productId === p.id);
  if (row) {
    row.quantity += req.body.quantity || 1;
  } else {
    cart.push({ productId: p.id, quantity: req.body.quantity || 1, product: p });
  }
  carts[req.params.userId] = cart;
  res.status(201).json(cart);
});

app.patch('/api/cart/:userId/:productId', (req, res) => {
  const cart = carts[req.params.userId] || [];
  const row = cart.find(x => x.productId === Number(req.params.productId));
  if (!row) return res.status(404).json({ error: 'Item not found' });
  row.quantity = Number(req.body.quantity);
  res.json(row);
});

app.delete('/api/cart/:userId/:productId', (req, res) => {
  carts[req.params.userId] = (carts[req.params.userId] || []).filter(x => x.productId !== Number(req.params.productId));
  res.status(204).end();
});

app.get('/api/wishlist/:userId', (req, res) => {
  res.json(wishlists[req.params.userId] || []);
});

app.post('/api/wishlist/:userId', (req, res) => {
  const p = findProduct(req.body.productId);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  const list = wishlists[req.params.userId] || [];
  if (!list.some(x => x.id === p.id)) {
    list.push(p);
  }
  wishlists[req.params.userId] = list;
  res.status(201).json(list);
});

app.delete('/api/wishlist/:userId/:productId', (req, res) => {
  wishlists[req.params.userId] = (wishlists[req.params.userId] || []).filter(x => x.id !== Number(req.params.productId));
  res.status(204).end();
});

app.get('/api/orders/:userId', (req, res) => {
  res.json(orders.filter(o => o.userId === req.params.userId));
});

app.post('/api/orders', (req, res) => {
  const userId = req.body.userId || 'demo';
  const cartItems = carts[userId] || [];
  const total = req.body.total || 0;
  
  const order = {
    id: `MO-${10429 + orders.length}`,
    userId: userId,
    total: total,
    status: 'Processing',
    createdAt: new Date().toISOString().slice(0, 10),
    items: [...cartItems]
  };
  
  orders.push(order);
  // Clear cart after placing order
  carts[userId] = [];
  res.status(201).json(order);
});

// Admin endpoints
app.get('/api/admin/metrics', (req, res) => {
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0) + 24662; // original static baseline
  const totalOrders = 384 + orders.length - 1;
  res.json({
    revenue: totalRevenue,
    orders: totalOrders,
    customers: 1204,
    conversion: 3.8
  });
});

app.get('/api/admin/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/admin/products', (req, res) => {
  const p = {
    id: products.length > 0 ? Math.max(...products.map(x => x.id)) + 1 : 1,
    name: req.body.name || 'New Product',
    category: req.body.category || 'women',
    type: req.body.type || 'New Category',
    price: Number(req.body.price) || 0,
    color: req.body.color || 'Default',
    image: req.body.image || 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=900&q=85',
    stock: Number(req.body.stock) || 0
  };
  products.push(p);
  res.status(201).json(p);
});

app.patch('/api/admin/products/:id', (req, res) => {
  const p = findProduct(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  
  if (req.body.name !== undefined) p.name = req.body.name;
  if (req.body.category !== undefined) p.category = req.body.category;
  if (req.body.type !== undefined) p.type = req.body.type;
  if (req.body.price !== undefined) p.price = Number(req.body.price);
  if (req.body.color !== undefined) p.color = req.body.color;
  if (req.body.image !== undefined) p.image = req.body.image;
  if (req.body.stock !== undefined) p.stock = Number(req.body.stock);
  
  res.json(p);
});

app.delete('/api/admin/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id === Number(req.params.id));
  if (index < 0) return res.status(404).json({ error: 'Product not found' });
  products.splice(index, 1);
  res.status(204).end();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`MODÉ API listening on :${PORT}`));
