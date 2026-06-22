import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Beamup Supply Chain API',
      version: '1.0.0',
      description: 'REST API for Beamup inventory & supply chain intelligence platform',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Development' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Item: {
          type: 'object',
          properties: {
            _id:         { type: 'string', example: '6670abc123' },
            sku:         { type: 'string', example: 'SKU-001' },
            name:        { type: 'string', example: 'Industrial Sensor A' },
            description: { type: 'string', example: 'High-precision IoT sensor' },
            category:    { type: 'string', example: 'Electronics' },
            quantity:    { type: 'number', example: 150 },
            warehouseId: { type: 'string', example: 'WH-NY-01' },
            status:      { type: 'string', enum: ['in_stock', 'low_stock', 'out_of_stock', 'in_transit'] },
            price:       { type: 'number', example: 89.99 },
            tags:        { type: 'array', items: { type: 'string' } },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id:   { type: 'string' },
            email: { type: 'string', example: 'user@beamup.ai' },
            name:  { type: 'string', example: 'Gil' },
            role:  { type: 'string', enum: ['admin', 'ops', 'viewer'] },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user:  { $ref: '#/components/schemas/User' },
                token: { type: 'string' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth',  description: 'Authentication endpoints' },
      { name: 'Items', description: 'Inventory item management' },
    ],
    paths: {
      // ─── Auth ──────────────────────────────────────────────────
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'name'],
                  properties: {
                    email:    { type: 'string', example: 'user@beamup.ai' },
                    password: { type: 'string', example: 'secret123' },
                    name:     { type: 'string', example: 'Gil' },
                    role:     { type: 'string', enum: ['admin', 'ops', 'viewer'] },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'User created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            '409': { description: 'Email already in use' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email:    { type: 'string', example: 'user@beamup.ai' },
                    password: { type: 'string', example: 'secret123' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user',
          responses: {
            '200': { description: 'Current user data' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      // ─── Items ─────────────────────────────────────────────────
      '/api/items': {
        get: {
          tags: ['Items'],
          summary: 'List all items',
          parameters: [
            { in: 'query', name: 'category',    schema: { type: 'string' } },
            { in: 'query', name: 'status',      schema: { type: 'string', enum: ['in_stock', 'low_stock', 'out_of_stock', 'in_transit'] } },
            { in: 'query', name: 'warehouseId', schema: { type: 'string' } },
            { in: 'query', name: 'search',      schema: { type: 'string' } },
            { in: 'query', name: 'page',        schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit',       schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': { description: 'Paginated list of items' },
          },
        },
        post: {
          tags: ['Items'],
          summary: 'Create a new item',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['sku', 'name', 'category', 'warehouseId', 'price'],
                  properties: {
                    sku:         { type: 'string', example: 'SKU-099' },
                    name:        { type: 'string', example: 'New Sensor' },
                    description: { type: 'string' },
                    category:    { type: 'string', example: 'Electronics' },
                    quantity:    { type: 'number', example: 100 },
                    warehouseId: { type: 'string', example: 'WH-NY-01' },
                    price:       { type: 'number', example: 49.99 },
                    tags:        { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Item created' },
            '409': { description: 'SKU already exists' },
          },
        },
      },
      '/api/items/{id}': {
        get: {
          tags: ['Items'],
          summary: 'Get item by ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Item found' },
            '404': { description: 'Item not found' },
          },
        },
        put: {
          tags: ['Items'],
          summary: 'Update an item',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } },
          },
          responses: {
            '200': { description: 'Item updated' },
            '404': { description: 'Item not found' },
          },
        },
        delete: {
          tags: ['Items'],
          summary: 'Delete an item',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            '204': { description: 'Item deleted' },
            '404': { description: 'Item not found' },
          },
        },
      },
      '/api/items/{id}/quantity': {
        patch: {
          tags: ['Items'],
          summary: 'Adjust item quantity',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['delta'],
                  properties: { delta: { type: 'integer', example: -10, description: 'Positive to add, negative to subtract' } },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Quantity adjusted' },
            '404': { description: 'Item not found' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
