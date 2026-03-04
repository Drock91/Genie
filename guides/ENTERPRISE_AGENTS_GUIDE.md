# GENIE Enterprise Agents Guide

## Overview

The Enterprise Agents enable GENIE to generate complete, production-ready applications with databases, authentication, and type-safe API integration.

## Critical Path Agents (Now Available)

### 1. Database Architect Agent

**Purpose:** Generate complete database schemas (Prisma + SQL + migrations + types)

**Trigger:** `agents.databaseArchitect`

**Input:** Requirements describing your data model

**Example Request:**
```
"Design database for an e-commerce platform with 
users, products, orders, reviews, and inventory tracking"
```

**Output Patches Generated:**
- `schema.sql` - Raw SQL CREATE statements
- `prisma/schema.prisma` - Prisma ORM schema (can be deployed immediately)
- `src/types/schema.ts` - TypeScript interface definitions
- `prisma/seed.ts` - Database seeding data
- `migrations/001_init.sql` - Initial migration file
- `DATABASE.md` - Schema documentation

**Key Capabilities:**
- Supports PostgreSQL, MySQL, MongoDB
- Automatically indexes important fields
- Handles relationships (1:1, 1:N, N:N)
- Generates TypeScript types for all models
- Includes audit fields (createdAt, updatedAt)
- Mock analyzer fallback for LLM failures

**Usage Example:**
```javascript
const request = {
  type: 'database-design',
  description: 'ecommerce platform database'
};

const patches = await agents.databaseArchitect.designSchema(request);
// patches[0]: schema.sql
// patches[1]: prisma/schema.prisma
// patches[2]: src/types/schema.ts
```

---

### 2. User & Auth Agent

**Purpose:** Generate complete user authentication and authorization system

**Trigger:** `agents.userAuth`

**Input:** Auth requirements and features

**Example Request:**
```
"Generate authentication system with JWT tokens, 
email verification, password reset, and role-based access control"
```

**Output Patches Generated:**
- `src/auth/routes.js` - Auth endpoints (register, login, refresh, logout)
- `src/auth/middleware.js` - Authentication verification and error handling
- `src/utils/authUtils.js` - Password hashing, token generation, validation
- `src/services/emailService.js` - Email templates and sending logic
- `src/auth/rbac.js` - Role-based access control enforcement
- `prisma/auth-schema-additions.prisma` - User, LoginSession, AuditLog models
- `.env.example` - Required environment variables

**Authentication Routes:**

```
POST   /auth/register          - Create new user account
POST   /auth/verify-email      - Verify email with token
POST   /auth/login             - Login and receive JWT + refresh token
POST   /auth/refresh           - Refresh access token (token refresh strategy)
POST   /auth/forgot-password   - Request password reset
POST   /auth/reset-password    - Complete password reset
GET    /auth/me                - Get current logged-in user
PATCH  /auth/profile           - Update user profile
POST   /auth/logout            - Logout and invalidate tokens
```

**Security Features Built-in:**
- ✅ Bcrypt password hashing
- ✅ JWT access tokens (15 min)
- ✅ Refresh tokens (7 days)
- ✅ Email verification with expiration
- ✅ Password reset with security token
- ✅ Account lockout after 5 failed attempts
- ✅ Session tracking and invalidation
- ✅ Audit logging for all auth events
- ✅ Rate limiting configuration
- ✅ Role-based access control (admin, moderator, user)

**Prisma Models Generated:**
```prisma
model User {
  id String @id @default(cuid())
  email String @unique
  password String
  firstName String
  lastName String
  role Role @default(USER)
  emailVerified Boolean @default(false)
  emailVerificationToken String?
  emailVerificationTokenExpires DateTime?
  passwordResetToken String?
  passwordResetTokenExpires DateTime?
  failedLoginAttempts Int @default(0)
  lockedUntil DateTime?
  lastLogin DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  loginSessions LoginSession[]
  auditLogs AuditLog[]
}

model LoginSession {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id])
  refreshToken String @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model AuditLog {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id])
  action String
  resource String
  metadata Json
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}
```

**Usage Example:**
```javascript
const request = {
  type: 'auth-system',
  features: ['email-verification', 'password-reset', 'rbac', 'session-tracking']
};

const patches = await agents.userAuth.generateAuthSystem(request);
// patches[0]: src/auth/routes.js
// patches[1]: src/auth/middleware.js
// patches[2]: src/utils/authUtils.js
// patches[3]: src/services/emailService.js
// patches[4]: src/auth/rbac.js
// patches[5]: prisma/auth-schema-additions.prisma
// patches[6]: .env.example
```

---

### 3. API Integration Agent

**Purpose:** Generate type-safe frontend API client with React hooks

**Trigger:** `agents.apiIntegration`

**Input:** API endpoints and data models

**Example Request:**
```
"Generate React API client with TypeScript types for 
user auth, products, orders, and reviews endpoints"
```

**Output Patches Generated:**
- `src/api/client.ts` - Main API client with automatic token injection and refresh
- `src/api/hooks.ts` - React Query hooks for common operations
- `src/api/errors.ts` - Error handling utilities
- `src/types/api.ts` - TypeScript types for all responses
- `src/api/constants.ts` - API endpoints and configuration
- `src/api/mock.ts` - Mock API server for development (MSW)

**React Query Hooks Generated:**

```typescript
// Authentication
const login = useLogin()              // POST /auth/login
const register = useRegister()        // POST /auth/register
const logout = useLogout()            // POST /auth/logout
const user = useCurrentUser()         // GET /auth/me

// Generic hooks for any endpoint
const { data, isLoading } = useApiQuery(endpoint, params)
const { mutate } = useApiMutation(method, endpoint)

// Pagination
const { data, fetchNextPage } = useInfiniteApiQuery(endpoint, params)

// Usage Example:
const { data: user, isLoading } = useCurrentUser()
const loginMutation = useLogin()

const handleLogin = async () => {
  const result = await loginMutation.mutateAsync({
    email: 'user@example.com',
    password: 'password'
  })
  // Token automatically stored and injected in headers
}
```

**Client Features:**
- ✅ Automatic JWT token injection in headers
- ✅ Automatic token refresh on 401 response
- ✅ Request/response interceptors
- ✅ Error handling with specific status codes
- ✅ TypeScript types for all endpoints
- ✅ React Query integration for caching/refetching
- ✅ Mock API server for development
- ✅ Pagination support (infinite queries)
- ✅ Custom headers support
- ✅ Request cancellation

**API Client Configuration:**

```typescript
// src/api/constants.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
export const API_TIMEOUT = 30000
export const TOKEN_STORAGE_KEY = 'access_token'
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token'

// Endpoints
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
    resetPassword: '/auth/reset-password',
  },
  users: {
    list: '/users',
    get: (id) => `/users/${id}`,
    update: (id) => `/users/${id}`,
    delete: (id) => `/users/${id}`,
  },
  // ... more endpoints
}
```

**Token Refresh Strategy:**

```typescript
// Automatic refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt refresh
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { 
        refreshToken 
      })
      if (response.status === 200) {
        // Store new tokens and retry original request
        localStorage.setItem(TOKEN_STORAGE_KEY, response.data.accessToken)
        return apiClient(error.config)
      }
    }
    return Promise.reject(error)
  }
)
```

**Usage Example:**
```javascript
const request = {
  type: 'api-integration',
  framework: 'react',
  endpoints: [
    { method: 'POST', path: '/auth/login', response: 'LoginResponse' },
    { method: 'GET', path: '/users/:id', response: 'User' },
    { method: 'POST', path: '/orders', response: 'Order' },
  ]
};

const patches = await agents.apiIntegration.generateApiClient(request);
// patches[0]: src/api/client.ts
// patches[1]: src/api/hooks.ts
// patches[2]: src/api/errors.ts
// patches[3]: src/types/api.ts
// patches[4]: src/api/constants.ts
// patches[5]: src/api/mock.ts
```

---

## Complete Enterprise Application Flow

### Step 1: Design Database
```bash
npm start -- "design database for a project management app 
with users, teams, projects, and tasks"
```
**Output:** Database schema, Prisma config, migrations, types

### Step 2: Add Authentication
```bash
npm start -- "add JWT authentication with email verification, 
password reset, and role-based access"
```
**Output:** Auth routes, middleware, email service, RBAC

### Step 3: Generate API Client
```bash
npm start -- "create React API client with hooks for users, 
teams, projects, and tasks"
```
**Output:** API client, React hooks, types, error handling

### Step 4: Deploy
Following agents available when needed:
- **DeploymentAgent** - Docker, Kubernetes, CI/CD
- **SecurityHardeningAgent** - Security audit and hardening
- **MonitoringAgent** - Logs, metrics, alerting

---

## Integration with Existing Orchestrator

The agents are fully integrated into GENIE's workflow:

```javascript
// In src/index.js
const agents = {
  // ... existing agents
  
  // Critical Path Agents (Enterprise)
  databaseArchitect: new DatabaseArchitectAgent({ 
    logger, 
    multiLlmSystem: global.multiLlmSystem 
  }),
  userAuth: new UserAuthAgent({ 
    logger, 
    multiLlmSystem: global.multiLlmSystem 
  }),
  apiIntegration: new ApiIntegrationAgent({ 
    logger, 
    multiLlmSystem: global.multiLlmSystem 
  }),
}

// Call through orchestrator
const result = await orchestrator.orchestrate({
  userRequest: 'design database for SaaS',
  availableAgents: agents,
  multiLlmSystem: global.multiLlmSystem,
})
```

---

## Request Patterns

### Pattern 1: Schema + Auth + API
**Request:**
```
"Build a complete SaaS application with user database, 
JWT authentication, and React frontend integration"
```

**Expected Flow:**
1. DatabaseArchitectAgent designs schema
2. UserAuthAgent adds auth system
3. ApiIntegrationAgent creates client

### Pattern 2: Database First
**Request:**
```
"Create database schema for an event management system 
with users, events, registrations, and tickets"
```

**Expected:** DatabaseArchitectAgent generates schema

### Pattern 3: Auth-Focused
**Request:**
```
"Add authentication and authorization system with 
email verification and multi-factor authentication"
```

**Expected:** UserAuthAgent with enhanced security

### Pattern 4: Frontend Integration
**Request:**
```
"Generate React hooks and API client for my backend 
with TypeScript types for all endpoints"
```

**Expected:** ApiIntegrationAgent with full type safety

---

## Error Handling & Fallbacks

All agents include fallback mechanisms:

- **LLM Unavailable:** Use mock analyzers with reasonable defaults
- **Invalid Input:** Return comprehensive error messages
- **Generation Failure:** Rollback with default templates
- **Type Errors:** Generate conservative, safe types

---

## What's Next?

Once these three agents are operational, you can build:

✅ Complete SaaS applications
✅ E-commerce platforms  
✅ Project management tools
✅ Content management systems
✅ Real-time collaboration apps
✅ Multi-tenant enterprise apps

All with professional-grade:
- Database design
- Security (authentication + authorization)
- Type safety
- Error handling
- Production readiness

---

## Performance Notes

- Database schema generation: ~2-3 seconds
- Auth system generation: ~3-4 seconds
- API client generation: ~2-3 seconds
- All operations use consensus LLM for quality

---

## Support & Troubleshooting

**Agent not responding:**
```bash
# Check agent registry
node -e "const g = require('./src/index.js'); console.log(Object.keys(g.agents))"
```

**Prisma schema issues:**
```bash
# Validate schema
npx prisma validate

# Generate client
npx prisma generate
```

**TypeScript errors:**
```bash
# Check types
npx tsc --noEmit
```

---

**Status:** ✅ All three critical-path agents operational and ready for enterprise application generation.
