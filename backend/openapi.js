/** OpenAPI 3.0 contract for the MODÉ API. Keep this file in sync with index.js. */
const idParam = {
  name: 'id', in: 'path', required: true,
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }, description: 'MongoDB document id',
};
const productIdParam = { ...idParam, name: 'productId', description: 'MongoDB product id' };
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const array = (items) => ({ type: 'array', items });
const error = { type: 'object', required: ['error'], properties: { error: { type: 'string' } } };
const product = {
  type: 'object', required: ['id', 'name', 'category', 'type', 'price', 'color', 'image', 'stock'],
  properties: {
    id: { type: 'string', example: '507f1f77bcf86cd799439011' }, name: { type: 'string' },
    category: { type: 'string', example: 'dresses' }, type: { type: 'string' },
    price: { type: 'number', format: 'float', minimum: 0, example: 129 }, color: { type: 'string' },
    image: { type: 'string', format: 'uri' }, stock: { type: 'integer', minimum: 0 },
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
  },
};
const user = { type: 'object', properties: {
  id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string', format: 'email' },
  role: { type: 'string', enum: ['customer', 'admin'] },
  status: { type: 'string', enum: ['active', 'deactivated'] },
  createdAt: { type: 'string', format: 'date-time' },
} };
const category = { type: 'object', properties: {
  id: { type: 'string' }, name: { type: 'string' }, icon: { type: 'string', example: '👗' },
  parent: { type: 'string', nullable: true }, order: { type: 'integer' },
  createdAt: { type: 'string', format: 'date-time' },
} };
const coupon = { type: 'object', properties: {
  id: { type: 'string' }, code: { type: 'string', example: 'SUMMER20' },
  description: { type: 'string' }, type: { type: 'string', enum: ['percent', 'fixed'] },
  value: { type: 'number', minimum: 0 }, minOrder: { type: 'number', minimum: 0 },
  expiresAt: { type: 'string', format: 'date-time', nullable: true }, active: { type: 'boolean' },
  usageLimit: { type: 'integer', nullable: true }, usedCount: { type: 'integer' },
  createdAt: { type: 'string', format: 'date-time' },
} };
const review = { type: 'object', properties: {
  id: { type: 'string' }, productId: { type: 'string' }, product: ref('Product'),
  userId: { type: 'string' }, name: { type: 'string' }, rating: { type: 'integer', minimum: 1, maximum: 5 },
  title: { type: 'string' }, comment: { type: 'string' },
  status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
  createdAt: { type: 'string', format: 'date-time' },
} };
const authResponse = { type: 'object', properties: { token: { type: 'string' }, user } };
const auth = [{ bearerAuth: [] }];
const jsonBody = (schema, required = true) => ({ required, content: { 'application/json': { schema } } });
const response = (description, schema, status = '200') => ({ [status]: { description, content: schema ? { 'application/json': { schema } } : undefined } });
const message = { type: 'object', properties: { message: { type: 'string' } } };

module.exports = {
  openapi: '3.0.3',
  info: { title: 'MODÉ API', version: '1.0.0', description: 'REST API for the MODÉ e-commerce storefront. Use Authorize to enter a JWT as a Bearer token.' },
  servers: [{ url: 'http://localhost:4000', description: 'Local development' }, { url: '/', description: 'Current host' }],
  tags: [
    { name: 'System' }, { name: 'Authentication' }, { name: 'Catalogue' }, { name: 'Cart' },
    { name: 'Wishlist' }, { name: 'Orders' }, { name: 'Reviews' }, { name: 'Admin' },
  ],
  paths: {
    '/api/health': { get: { tags: ['System'], summary: 'Check API and MongoDB status', responses: response('Health status', { type: 'object', properties: { ok: { type: 'boolean' }, service: { type: 'string' } } }) } },
    '/api/auth/signup': { post: { tags: ['Authentication'], summary: 'Create an account', requestBody: jsonBody({ type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string', minLength: 2 }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8, format: 'password' } } }), responses: { ...response('Account created', ref('AuthResponse'), '201'), ...response('Validation or duplicate email', ref('Error'), '400') } } },
    '/api/auth/login': { post: { tags: ['Authentication'], summary: 'Log in and receive a JWT', requestBody: jsonBody({ type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } }), responses: { ...response('Logged in', ref('AuthResponse')), ...response('Invalid credentials or deactivated', ref('Error'), '401') } } },
    '/api/auth/me': { get: { tags: ['Authentication'], summary: 'Get the current user', security: auth, responses: { ...response('Current user', { type: 'object', properties: { user: ref('User') } }), ...response('Unauthenticated', ref('Error'), '401') } } },
    '/api/newsletter': { post: { tags: ['Authentication'], summary: 'Subscribe to the newsletter', requestBody: jsonBody({ type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }), responses: response('Subscribed (or already subscribed)', message, '201') } },
    '/api/products': { get: { tags: ['Catalogue'], summary: 'List products', parameters: [{ name: 'category', in: 'query', schema: { type: 'string' }, description: 'Optional category filter' }], responses: response('Products', array(ref('Product'))) } },
    '/api/products/{id}': { get: { tags: ['Catalogue'], summary: 'Get one product', parameters: [idParam], responses: { ...response('Product', ref('Product')), ...response('Not found', ref('Error'), '404') } } },
    '/api/products/{id}/reviews': {
      get: { tags: ['Reviews'], summary: 'List approved reviews for a product', parameters: [idParam], responses: response('Approved reviews', array(ref('Review'))) },
      post: { tags: ['Reviews'], summary: 'Submit a product review (creates a pending review)', security: auth, parameters: [idParam], requestBody: jsonBody({ type: 'object', required: ['rating', 'comment'], properties: { rating: { type: 'integer', minimum: 1, maximum: 5 }, title: { type: 'string' }, comment: { type: 'string', maxLength: 1000 } } }), responses: { ...response('Review submitted', ref('Review'), '201'), ...response('Validation error', ref('Error'), '400') } },
    },
    '/api/categories': { get: { tags: ['Catalogue'], summary: 'List the category taxonomy', responses: response('Categories', array(ref('Category'))) } },
    '/api/cart': {
      get: { tags: ['Cart'], summary: 'Get the current user cart', security: auth, responses: response('Cart items', array(ref('CartItem'))) },
      post: { tags: ['Cart'], summary: 'Add a product to the cart', security: auth, requestBody: jsonBody({ type: 'object', required: ['productId'], properties: { productId: { type: 'string' }, quantity: { type: 'integer', minimum: 1, default: 1 } } }), responses: { ...response('Updated cart', array(ref('CartItem')), '201'), ...response('Invalid or unavailable product', ref('Error'), '400') } },
    },
    '/api/cart/{productId}': {
      patch: { tags: ['Cart'], summary: 'Set cart item quantity', security: auth, parameters: [productIdParam], requestBody: jsonBody({ type: 'object', required: ['quantity'], properties: { quantity: { type: 'integer', minimum: 1 } } }), responses: { ...response('Updated cart', array(ref('CartItem'))), ...response('Item not found', ref('Error'), '404') } },
      delete: { tags: ['Cart'], summary: 'Remove an item from the cart', security: auth, parameters: [productIdParam], responses: { '204': { description: 'Removed' } } },
    },
    '/api/wishlist': {
      get: { tags: ['Wishlist'], summary: 'Get the current wishlist', security: auth, responses: response('Wishlist products', array(ref('Product'))) },
      post: { tags: ['Wishlist'], summary: 'Add a product to the wishlist', security: auth, requestBody: jsonBody({ type: 'object', required: ['productId'], properties: { productId: { type: 'string' } } }), responses: response('Updated wishlist', array(ref('Product')), '201') },
    },
    '/api/wishlist/{productId}': { delete: { tags: ['Wishlist'], summary: 'Remove a wishlist product', security: auth, parameters: [productIdParam], responses: { '204': { description: 'Removed' } } } },
    '/api/orders': {
      get: { tags: ['Orders'], summary: 'List the current user orders', security: auth, responses: response('Orders', array(ref('Order'))) },
      post: { tags: ['Orders'], summary: 'Checkout the current cart', security: auth, description: 'Creates an order, reserves stock, and empties the cart. Shipping is free for subtotal >= 100, otherwise 12.', responses: { ...response('Created order', ref('Order'), '201'), ...response('Empty cart or insufficient stock', ref('Error'), '400') } },
    },
    '/api/admin/metrics': { get: { tags: ['Admin'], summary: 'Get dashboard metrics', security: auth, responses: response('Metrics', ref('Metrics')) } },
    '/api/admin/orders': { get: { tags: ['Admin'], summary: 'List the latest 50 orders', security: auth, responses: response('Orders with users', array(ref('AdminOrder'))) } },
    '/api/admin/users': {
      get: { tags: ['Admin'], summary: 'List all users', security: auth, responses: response('Users', array(ref('User'))) },
    },
    '/api/admin/users/{id}': {
      patch: { tags: ['Admin'], summary: 'Update a user (name, role, status)', security: auth, parameters: [idParam], requestBody: jsonBody({ type: 'object', properties: { name: { type: 'string' }, role: { type: 'string', enum: ['customer', 'admin'] }, status: { type: 'string', enum: ['active', 'deactivated'] } } }, false), responses: { ...response('Updated user', ref('User')), ...response('Not found or invalid', ref('Error'), '404') } },
      delete: { tags: ['Admin'], summary: 'Delete a user and their cart, wishlist and reviews', security: auth, parameters: [idParam], responses: { '204': { description: 'Deleted' } } },
    },
    '/api/admin/products': { post: { tags: ['Admin'], summary: 'Create a product', security: auth, requestBody: jsonBody(ref('ProductInput')), responses: response('Created product', ref('Product'), '201') } },
    '/api/admin/products/{id}': {
      patch: { tags: ['Admin'], summary: 'Update a product', security: auth, parameters: [idParam], requestBody: jsonBody(ref('ProductInput'), false), responses: response('Updated product', ref('Product')) },
      delete: { tags: ['Admin'], summary: 'Delete a product and related cart, wishlist and review entries', security: auth, parameters: [idParam], responses: { '204': { description: 'Deleted' } } },
    },
    '/api/admin/categories': {
      get: { tags: ['Admin'], summary: 'List all categories and subcategories', security: auth, responses: response('Categories', array(ref('Category'))) },
      post: { tags: ['Admin'], summary: 'Create a category or subcategory', security: auth, requestBody: jsonBody(ref('CategoryInput')), responses: response('Created category', ref('Category'), '201') },
    },
    '/api/admin/categories/{id}': {
      patch: { tags: ['Admin'], summary: 'Update a category', security: auth, parameters: [idParam], requestBody: jsonBody(ref('CategoryInput'), false), responses: response('Updated category', ref('Category')) },
      delete: { tags: ['Admin'], summary: 'Delete a category and its subcategories', security: auth, parameters: [idParam], responses: { '204': { description: 'Deleted' } } },
    },
    '/api/admin/coupons': {
      get: { tags: ['Admin'], summary: 'List all coupons', security: auth, responses: response('Coupons', array(ref('Coupon'))) },
      post: { tags: ['Admin'], summary: 'Create a coupon', security: auth, requestBody: jsonBody(ref('CouponInput')), responses: response('Created coupon', ref('Coupon'), '201') },
    },
    '/api/admin/coupons/{id}': {
      patch: { tags: ['Admin'], summary: 'Update a coupon', security: auth, parameters: [idParam], requestBody: jsonBody(ref('CouponInput'), false), responses: response('Updated coupon', ref('Coupon')) },
      delete: { tags: ['Admin'], summary: 'Delete a coupon', security: auth, parameters: [idParam], responses: { '204': { description: 'Deleted' } } },
    },
    '/api/admin/reviews': { get: { tags: ['Admin'], summary: 'List reviews for moderation', security: auth, parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] } }], responses: response('Reviews', array(ref('Review'))) } },
    '/api/admin/reviews/{id}': {
      patch: { tags: ['Admin'], summary: 'Edit or moderate a review (rating, title, comment, status)', security: auth, parameters: [idParam], requestBody: jsonBody(ref('ReviewInput'), false), responses: response('Updated review', ref('Review')) },
      delete: { tags: ['Admin'], summary: 'Delete a review', security: auth, parameters: [idParam], responses: { '204': { description: 'Deleted' } } },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Paste the JWT returned by signup or login.' } },
    schemas: {
      Error: error, User: user, Product: product, Category: category, Coupon: coupon, Review: review,
      AuthResponse: authResponse,
      ProductInput: { type: 'object', required: ['name', 'category', 'type', 'price', 'color', 'image', 'stock'], properties: { name: { type: 'string' }, category: { type: 'string' }, type: { type: 'string' }, price: { type: 'number', minimum: 0 }, color: { type: 'string' }, image: { type: 'string', format: 'uri' }, stock: { type: 'integer', minimum: 0 } } },
      CategoryInput: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, icon: { type: 'string' }, parent: { type: 'string', description: 'Parent category id for a subcategory' }, order: { type: 'integer' } } },
      CouponInput: { type: 'object', required: ['code', 'value'], properties: { code: { type: 'string' }, description: { type: 'string' }, type: { type: 'string', enum: ['percent', 'fixed'] }, value: { type: 'number', minimum: 0 }, minOrder: { type: 'number', minimum: 0 }, expiresAt: { type: 'string', format: 'date-time', nullable: true }, active: { type: 'boolean' }, usageLimit: { type: 'integer', nullable: true } } },
      ReviewInput: { type: 'object', properties: { rating: { type: 'integer', minimum: 1, maximum: 5 }, title: { type: 'string' }, comment: { type: 'string' }, status: { type: 'string', enum: ['pending', 'approved', 'rejected'] } } },
      CartItem: { type: 'object', properties: { productId: { type: 'string' }, quantity: { type: 'integer' }, product: ref('Product') } },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'MO-MFX2K1-ABCD' }, orderNumber: { type: 'string' },
          status: { type: 'string', enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'] },
          subtotal: { type: 'number' }, shipping: { type: 'number' }, total: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          items: array({
            type: 'object',
            properties: {
              productId: { type: 'string' }, quantity: { type: 'integer' },
              product: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, price: { type: 'number' }, image: { type: 'string' }, color: { type: 'string' }, category: { type: 'string' } } },
            },
          }),
        },
      },
      AdminOrder: { allOf: [ref('Order'), { type: 'object', properties: { user: ref('User') } }] },
      Metrics: { type: 'object', properties: { revenue: { type: 'number' }, orders: { type: 'integer' }, customers: { type: 'integer' }, products: { type: 'integer' }, pendingReviews: { type: 'integer' }, averageOrderValue: { type: 'number' }, salesByDay: array({ type: 'object', properties: { label: { type: 'string' }, revenue: { type: 'number' } } }) } },
    },
  },
};
