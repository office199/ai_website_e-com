/** OpenAPI 3.0 contract for the MODÉ API. Keep this file in sync with index.js. */
const idParam = {
  name: 'id', in: 'path', required: true,
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }, description: 'MongoDB product id',
};
const productIdParam = { ...idParam, name: 'productId', description: 'MongoDB product id' };
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
  role: { type: 'string', enum: ['customer', 'admin'] }, createdAt: { type: 'string', format: 'date-time' },
} };
const authResponse = { type: 'object', properties: { token: { type: 'string' }, user } };
const auth = [{ bearerAuth: [] }];
const jsonBody = (schema, required = true) => ({ required, content: { 'application/json': { schema } } });
const response = (description, schema, status = '200') => ({ [status]: { description, content: schema ? { 'application/json': { schema } } : undefined } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const array = (items) => ({ type: 'array', items });
const message = { type: 'object', properties: { message: { type: 'string' } } };

module.exports = {
  openapi: '3.0.3',
  info: { title: 'MODÉ API', version: '1.0.0', description: 'REST API for the MODÉ e-commerce storefront. Use Authorize to enter a JWT as a Bearer token.' },
  servers: [{ url: 'http://localhost:4000', description: 'Local development' }, { url: '/', description: 'Current host' }],
  tags: [
    { name: 'System' }, { name: 'Authentication' }, { name: 'Catalogue' }, { name: 'Cart' },
    { name: 'Wishlist' }, { name: 'Orders' }, { name: 'Admin' },
  ],
  paths: {
    '/api/health': { get: { tags: ['System'], summary: 'Check API and MongoDB status', responses: response('Health status', { type: 'object', properties: { ok: { type: 'boolean' }, service: { type: 'string' } } }) } },
    '/api/auth/signup': { post: { tags: ['Authentication'], summary: 'Create an account', requestBody: jsonBody({ type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string', minLength: 2 }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8, format: 'password' } } }), responses: { ...response('Account created', ref('AuthResponse'), '201'), ...response('Validation or duplicate email', ref('Error'), '400') } } },
    '/api/auth/login': { post: { tags: ['Authentication'], summary: 'Log in and receive a JWT', requestBody: jsonBody({ type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } }), responses: { ...response('Logged in', ref('AuthResponse')), ...response('Invalid credentials', ref('Error'), '401') } } },
    '/api/auth/me': { get: { tags: ['Authentication'], summary: 'Get the current user', security: auth, responses: { ...response('Current user', { type: 'object', properties: { user: ref('User') } }), ...response('Unauthenticated', ref('Error'), '401') } } },
    '/api/newsletter': { post: { tags: ['Authentication'], summary: 'Subscribe to the newsletter', requestBody: jsonBody({ type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }), responses: response('Subscribed (or already subscribed)', message, '201') } },
    '/api/products': { get: { tags: ['Catalogue'], summary: 'List products', parameters: [{ name: 'category', in: 'query', schema: { type: 'string' }, description: 'Optional category filter' }], responses: response('Products', array(ref('Product'))) } },
    '/api/products/{id}': { get: { tags: ['Catalogue'], summary: 'Get one product', parameters: [idParam], responses: { ...response('Product', ref('Product')), ...response('Not found', ref('Error'), '404') } } },
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
    '/api/admin/products': { post: { tags: ['Admin'], summary: 'Create a product', security: auth, requestBody: jsonBody(ref('ProductInput')), responses: response('Created product', ref('Product'), '201') } },
    '/api/admin/products/{id}': {
      patch: { tags: ['Admin'], summary: 'Update a product', security: auth, parameters: [idParam], requestBody: jsonBody(ref('ProductInput'), false), responses: response('Updated product', ref('Product')) },
      delete: { tags: ['Admin'], summary: 'Delete a product', security: auth, parameters: [idParam], responses: { '204': { description: 'Deleted' } } },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Paste the JWT returned by signup or login.' } },
    schemas: {
      Error: error, User: user, Product: product,
      AuthResponse: authResponse,
      ProductInput: { type: 'object', required: ['name', 'category', 'type', 'price', 'color', 'image', 'stock'], properties: { name: { type: 'string' }, category: { type: 'string' }, type: { type: 'string' }, price: { type: 'number', minimum: 0 }, color: { type: 'string' }, image: { type: 'string', format: 'uri' }, stock: { type: 'integer', minimum: 0 } } },
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
      Metrics: { type: 'object', properties: { revenue: { type: 'number' }, orders: { type: 'integer' }, customers: { type: 'integer' }, averageOrderValue: { type: 'number' }, salesByDay: array({ type: 'object', properties: { label: { type: 'string' }, revenue: { type: 'number' } } }) } },
    },
  },
};
