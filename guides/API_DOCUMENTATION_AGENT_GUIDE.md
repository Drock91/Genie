# APIDocumentationAgent Guide

## Overview

The **APIDocumentationAgent** automatically generates comprehensive API documentation. It creates OpenAPI/Swagger specifications, Postman collections, TypeScript types, interactive documentation, and complete API guides.

## Capabilities

### 1. **OpenAPI/Swagger Generation** ✅
- OpenAPI 3.0.0 specification
- YAML and JSON formats
- Complete endpoint definitions
- Request/response schemas
- Authentication specifications
- Error codes and messages

### 2. **Interactive Documentation** ✅
- SwaggerUI integration
- ReDoc alternative interface
- Live API testing
- Automatic client generation

### 3. **Postman Collection** ✅
- Complete endpoint definitions
- Environment variables
- Authentication headers
- Request/response examples
- Collection variables

### 4. **Type Definitions** ✅
- TypeScript interfaces
- Request/response types
- Error types
- Pagination types
- Complete type safety

### 5. **API Client Libraries** ✅
- TypeScript API client
- Automatic token management
- Error handling
- Request interceptors
- Response transformation

### 6. **Documentation Guides** ✅
- API reference guide
- Authentication guide
- Error handling guide
- Rate limiting guide
- Code examples

## Generated Files

### Specifications (2 files)
- `openapi.yaml` - OpenAPI specification (YAML)
- `openapi.json` - OpenAPI specification (JSON)

### Interactive Documentation (2 files)
- `swagger.js` - SwaggerUI integration
- `redoc.html` - ReDoc interface

### Collections (1 file)
- `postman-collection.json` - Postman collection

### Type Definitions (1 file)
- `types.ts` - TypeScript interfaces and types

### Client Library (1 file)
- `apiClient.ts` - Production-ready API client

### Documentation (5 files)
- `API.md` - Complete API reference
- `AUTHENTICATION.md` - Authentication guide
- `ERRORS.md` - Error handling guide
- `RATE_LIMITING.md` - Rate limiting documentation
- `EXAMPLES.md` - Code examples

## Usage Examples

### Accessing Documentation

#### SwaggerUI
```
http://localhost:3000/api-docs
```

#### ReDoc
```
http://localhost:3000/redoc.html
```

### Setting Up Swagger

```javascript
import { setupSwagger } from './config/swagger';

app.use(express.static('docs'));
setupSwagger(app);
```

### Using the API Client

**TypeScript:**
```typescript
import { ApiClient } from './services/apiClient';

const api = new ApiClient({
  baseURL: 'https://api.example.com/api/v1',
  token: 'your-jwt-token'
});

// Register
const auth = await api.register({
  email: 'user@example.com',
  password: 'Password123!',
  username: 'username'
});

// Login
const loginResponse = await api.login({
  email: 'user@example.com',
  password: 'Password123!'
});

// Get current user
const user = await api.getCurrentUser();

// List products
const products = await api.getProducts(1, 20);

// Search products
const results = await api.searchProducts('laptop');

// Create order
const order = await api.createOrder({
  items: [
    { productId: 'prod-123', quantity: 2, price: 9999 }
  ]
});

// Get orders
const orders = await api.getOrders();
```

**JavaScript:**
```javascript
const { ApiClient } = require('./services/apiClient');

const api = new ApiClient();

api.login({
  email: 'user@example.com',
  password: 'Password123!'
})
.then(response => {
  console.log('Logged in:', response.user);
  return api.getProducts();
})
.then(products => {
  console.log('Products:', products);
})
.catch(error => {
  console.error('API Error:', error.message);
});
```

**cURL:**
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "username": "username"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'

# Get products
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/products

# Create order
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "prod-123",
        "quantity": 2,
        "price": 9999
      }
    ]
  }'
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Users
- `GET /users/me` - Get current user profile
- `GET /users/{id}` - Get user by ID
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Products
- `GET /products` - List products (paginated)
- `GET /products/{id}` - Get product details
- `POST /products` - Create product (admin)
- `PUT /products/{id}` - Update product (admin)
- `DELETE /products/{id}` - Delete product (admin)
- `GET /products/search?q=term` - Search products

### Orders
- `POST /orders` - Create order
- `GET /orders` - List user's orders
- `GET /orders/{id}` - Get order details
- `PUT /orders/{id}` - Update order
- `DELETE /orders/{id}` - Cancel order

## Authentication

### JWT Bearer Token
All protected endpoints require:
```
Authorization: Bearer <your-jwt-token>
```

### Token Structure
```
Header.Payload.Signature
```

### Token Expiration
- Access token: 15 minutes
- Refresh token: 7 days

### Getting a Token
```bash
# Register (returns token)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -d '{"email":"user@example.com","password":"Pass123!"}'

# Login (returns token)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -d '{"email":"user@example.com","password":"Pass123!"}'

# Refresh token
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Authorization: Bearer <old-token>"
```

## Request/Response Format

### Successful Response (200, 201)
```json
{
  "data": {
    "id": "123",
    "name": "Example"
  },
  "meta": {
    "timestamp": "2024-02-19T10:30:00Z"
  }
}
```

### Error Response (4xx, 5xx)
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "error details"
  },
  "timestamp": "2024-02-19T10:30:00Z"
}
```

### Paginated Response
```json
{
  "items": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasMore": true
  }
}
```

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| VALIDATION_ERROR | 400 | Invalid input parameters |
| INVALID_TOKEN | 401 | Token is invalid or expired |
| UNAUTHORIZED | 401 | Missing authentication |
| INSUFFICIENT_PERMISSIONS | 403 | Not authorized for resource |
| NOT_FOUND | 404 | Resource not found |
| DUPLICATE_EMAIL | 409 | Email already registered |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_SERVER_ERROR | 500 | Server error |

## Rate Limiting

### Limits
- Authenticated: 1000 requests/hour
- Unauthenticated: 100 requests/hour

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1705321200
```

### Error Response
```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "details": {
    "retryAfter": 3600
  }
}
```

## OpenAPI Schema Structure

```yaml
openapi: 3.0.0
info:
  title: API Title
  version: 1.0.0
  description: API Description

servers:
  - url: http://localhost:3000/api/v1
    description: Development

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id: { type: string }
        email: { type: string, format: email }
      required: [id, email]

paths:
  /endpoint:
    get:
      summary: Description
      security:
        - bearerAuth: []
      responses:
        200:
          description: Success
```

## Postman Import

### Import Collection
1. Open Postman
2. Click "Import"
3. Select `postman-collection.json`
4. Collection is now available

### Set Environment Variables
```json
{
  "token": "your-jwt-token",
  "userId": "user-123",
  "baseUrl": "http://localhost:3000/api/v1"
}
```

### Use in Requests
```
{{baseUrl}}/users/{{userId}}
Authorization: Bearer {{token}}
```

## SDK/Client Generation

### From OpenAPI Spec
```bash
# Using openapi-generator
openapi-generator generate -i docs/api/openapi.json \
  -g typescript-axios -o generated-client

# Using swagger-codegen
swagger-codegen generate -i docs/api/openapi.json \
  -l python -o generated-client
```

### Supported Languages
- TypeScript/JavaScript
- Python
- Go
- Java
- C#
- Ruby
- PHP
- And more...

## Versioning

### Current Version
- API Version: 1.0.0
- OpenAPI Version: 3.0.0

### Backward Compatibility
- Deprecated endpoints: marked in documentation
- Version headers: X-API-Version: 1
- Version in URL: /api/v1/ (recommended)

## Documentation Maintenance

### Keeping Docs Updated
1. Update OpenAPI spec when changing API
2. Run documentation generation
3. Regenerate client libraries
4. Update examples and guides

### Changelog
```markdown
## [1.0.0] - 2024-02-19
### Added
- Initial API release
- Authentication endpoints
- Products CRUD
- Orders management

### Changed
- n/a

### Deprecated
- n/a

### Removed
- n/a

### Fixed
- n/a
```

## Best Practices

### ✅ Do
- Use consistent field naming
- Document all parameters
- Provide examples for all endpoints
- Keep documentation updated
- Use semantic versioning
- Test with real use cases
- Document error scenarios
- Provide SDKs/clients

### ❌ Don't
- Document implementation details
- Break backward compatibility without versioning
- Mix API versions
- Forget rate limiting documentation
- Leave errors undocumented
- Use unclear field names
- Change behavior without update notification

## Integrations

### API Testing Tools
- Postman
- Insomnia
- Thunder Client
- REST Client (VS Code)

### CI/CD Integration
```yaml
- name: Test API
  run: |
    npm run test:api
    npm run test:load

- name: Generate Docs
  run: npm run docs:generate

- name: Validate OpenAPI
  run: npm run validate:openapi
```

## Support & Resources

### Documentation Tools
- Swagger/OpenAPI: https://swagger.io/
- ReDoc: https://redoc.ly/
- Postman: https://www.postman.com/
- Stoplight: https://stoplight.io/

### Related Agents
- TestGenerationAgent: Auto-generates API tests
- DeploymentAgent: Deploys API to production
- SecurityHardeningAgent: Adds security to API

---

**Last Updated**: 2024-02-19  
**Version**: 1.0.0
