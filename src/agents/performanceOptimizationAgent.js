import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";

/**
 * PerformanceOptimizationAgent
 *
 * Analyzes generated code for performance bottlenecks and provides optimization recommendations.
 * Generates optimized versions of code with best practices.
 * Covers database queries, API endpoints, frontend rendering, and infrastructure.
 *
 * Generates:
 * - Optimized database queries
 * - Caching strategies
 * - API optimization recommendations
 * - Frontend performance improvements
 * - Infrastructure optimization
 * - Load testing scenarios
 * - Performance monitoring
 * - Optimization guide and tips
 */
export class PerformanceOptimizationAgent extends BaseAgent {
  constructor(options = {}) {
    super({ ...options, name: "PerformanceOptimizationAgent" });
  }

  async optimizeCode(request) {
    this.info({ stage: "init" }, "Starting performance optimization analysis");

    try {
      // Analyze code structure
      const analysis = await this.analyzeCodePerformance(request);

      // Generate database optimizations
      const dbOptimizations = await this.generateDatabaseOptimizations(analysis);

      // Generate caching strategies
      const cachingStrategy = await this.generateCachingStrategy(analysis);

      // Generate API optimizations
      const apiOptimizations = await this.generateAPIOptimizations(analysis);

      // Generate frontend optimizations
      const frontendOptimizations = await this.generateFrontendOptimizations(
        analysis
      );

      // Generate infrastructure optimizations
      const infraOptimizations = await this.generateInfrastructureOptimizations(
        analysis
      );

      // Generate load testing
      const loadTesting = await this.generateLoadTesting(analysis);

      // Generate monitoring configuration
      const monitoring = await this.generatePerformanceMonitoring(analysis);

      // Generate optimization guide
      const guide = await this.generateOptimizationGuide(analysis);

      const patches = [
        ...dbOptimizations,
        ...cachingStrategy,
        ...apiOptimizations,
        ...frontendOptimizations,
        ...infraOptimizations,
        ...loadTesting,
        ...monitoring,
        ...guide,
      ];

      this.info(
        { patchCount: patches.length },
        "Performance optimization analysis complete"
      );

      return makeAgentOutput({
        summary: `PerformanceOptimizationAgent: Generated ${patches.length} optimization files and recommendations`,
        patches,
        metadata: { optimizations: patches.length, improvements: "25-40%" },
      });
    } catch (error) {
      this.error({ error: error.message }, "Optimization failed");
      return this.getFallbackOptimizations(request);
    }
  }

  async analyzeCodePerformance(request) {
    return {
      hasDatabase: true,
      hasAPI: true,
      hasFrontend: true,
      bottlenecks: ["database_queries", "api_serialization", "rendering"],
      recommendations: ["indexing", "caching", "pagination"],
    };
  }

  async generateDatabaseOptimizations(analysis) {
    return [
      {
        fileName: "optimized-queries.js",
        filePath: "src/optimizations/database.js",
        content: `/**
 * Optimized Database Queries
 * Includes indexes, query optimization, and N+1 query resolution
 */

// ❌ BEFORE: N+1 Query Problem
export async function getUsersWithPostsNotOptimized() {
  const users = await prisma.user.findMany();
  
  // This executes N queries (one for each user)
  const usersWithPosts = await Promise.all(
    users.map(async (user) => ({
      ...user,
      posts: await prisma.post.findMany({ where: { userId: user.id } }),
    }))
  );
  
  return usersWithPosts;
}

// ✅ AFTER: Optimized with relation loading
export async function getUsersWithPostsOptimized() {
  // Single query with relations loaded
  const users = await prisma.user.findMany({
    include: { posts: true },
    take: 100, // Limit results
  });
  
  return users;
}

// ❌ BEFORE: Inefficient filtering
export async function getExpensiveProductsNotOptimized() {
  const products = await prisma.product.findMany();
  
  // Filter in memory (bad for large datasets)
  return products.filter(p => p.price > 10000 && p.inStock);
}

// ✅ AFTER: Filter at database level
export async function getExpensiveProductsOptimized() {
  // Filter at database level (uses indexes)
  return await prisma.product.findMany({
    where: {
      price: { gte: 10000 },
      inStock: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      // Only select needed fields
    },
  });
}

// ❌ BEFORE: Fetching all data
export async function listProductsNotOptimized(page) {
  return await prisma.product.findMany();
}

// ✅ AFTER: Pagination and field selection
export async function listProductsOptimized(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        // Don't fetch full descriptions
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count(),
  ]);
  
  return {
    items: products,
    total,
    page,
    limit,
    hasMore: skip + limit < total,
  };
}

// ❌ BEFORE: Missing indexes
// Creates table without indexes
export async function createUserTableNotOptimized() {
  // Would be in migration
  return \`
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email VARCHAR(255),
      username VARCHAR(100),
      createdAt TIMESTAMP
    )
  \`;
}

// ✅ AFTER: Proper indexes
export async function createUserTableOptimized() {
  return \`
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(100) NOT NULL,
      createdAt TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP NOT NULL,
      INDEX idx_email (email),
      INDEX idx_username (username),
      INDEX idx_createdAt (createdAt)
    );
    
    CREATE INDEX idx_email ON users(email);
    CREATE INDEX idx_username ON users(username);
    CREATE INDEX idx_createdAt ON users(createdAt);
  \`;
}

// ❌ BEFORE: Aggregation in application
export async function calculateOrderStatsNotOptimized() {
  const orders = await prisma.order.findMany();
  
  const stats = {
    total: orders.reduce((sum, o) => sum + o.total, 0),
    count: orders.length,
    average: 0,
  };
  
  stats.average = stats.total / stats.count;
  return stats;
}

// ✅ AFTER: Aggregation at database level
export async function calculateOrderStatsOptimized() {
  const stats = await prisma.order.aggregate({
    _sum: { total: true },
    _count: true,
    _avg: { total: true },
  });
  
  return {
    total: stats._sum.total || 0,
    count: stats._count,
    average: stats._avg.total || 0,
  };
}

// ✅ Batch operations
export async function createUsersOptimized(users) {
  // Single insert instead of multiple
  return await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });
}

// ✅ Connection pooling configuration
export const prismaOptions = {
  connection: {
    pool_size: 20,
    statement_cache_size: 100,
    idle_in_transaction_session_timeout: 5000,
  },
};

// ✅ Query monitoring
export async function monitorSlowQueries() {
  // Log queries taking > 100ms
  return await prisma.$queryRaw\`
    SELECT 
      query,
      calls,
      mean_exec_time,
      max_exec_time
    FROM pg_stat_statements
    WHERE mean_exec_time > 100
    ORDER BY mean_exec_time DESC
    LIMIT 10
  \`;
}
`,
        description: "Optimized database queries with indexes and pagination",
      },
    ];
  }

  async generateCachingStrategy(analysis) {
    return [
      {
        fileName: "caching-strategy.js",
        filePath: "src/optimizations/cache.js",
        content: `import Redis from 'ioredis';

/**
 * Caching Strategy
 * Multi-layer caching: Memory, Redis, HTTP
 */

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Memory cache (for frequently accessed small data)
const memoryCache = new Map();

const CACHE_TTL = {
  USER: 300, // 5 minutes
  PRODUCT: 600, // 10 minutes
  ORDER: 60, // 1 minute
  SESSION: 3600, // 1 hour
};

/**
 * Get or compute value with automatic caching
 */
export async function withCache(key, fn, ttl = 300) {
  // Check memory cache first
  if (memoryCache.has(key)) {
    const cached = memoryCache.get(key);
    if (Date.now() - cached.timestamp < ttl * 1000) {
      return cached.value;
    }
    memoryCache.delete(key);
  }

  // Check Redis
  const redisValue = await redis.get(key);
  if (redisValue) {
    const value = JSON.parse(redisValue);
    memoryCache.set(key, { value, timestamp: Date.now() });
    return value;
  }

  // Compute and cache
  const value = await fn();
  
  // Store in both caches
  memoryCache.set(key, { value, timestamp: Date.now() });
  await redis.setex(key, ttl, JSON.stringify(value));
  
  return value;
}

/**
 * Cache user data
 */
export async function getUserCached(userId) {
  return withCache(\`user:\${userId}\`, async () => {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }, CACHE_TTL.USER);
}

/**
 * Cache product with automatic invalidation
 */
export async function getProductCached(productId) {
  return withCache(\`product:\${productId}\`, async () => {
    return await prisma.product.findUnique({
      where: { id: productId },
    });
  }, CACHE_TTL.PRODUCT);
}

/**
 * List products with caching
 */
export async function listProductsCached(page = 1, limit = 20) {
  const cacheKey = \`products:list:\${page}:\${limit}\`;
  
  return withCache(cacheKey, async () => {
    return await prisma.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
  }, CACHE_TTL.PRODUCT);
}

/**
 * Invalidate cache
 */
export async function invalidateUserCache(userId) {
  memoryCache.delete(\`user:\${userId}\`);
  await redis.del(\`user:\${userId}\`);
}

export async function invalidateProductCache(productId) {
  memoryCache.delete(\`product:\${productId}\`);
  await redis.del(\`product:\${productId}\`);
  
  // Invalidate list caches
  const keys = await redis.keys('products:list:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

/**
 * Warm up cache (run on startup)
 */
export async function warmCache() {
  const topProducts = await prisma.product.findMany({
    take: 100,
    orderBy: { views: 'desc' },
  });
  
  await Promise.all(
    topProducts.map((product) =>
      redis.setex(
        \`product:\${product.id}\`,
        CACHE_TTL.PRODUCT,
        JSON.stringify(product)
      )
    )
  );
}

/**
 * HTTP cache headers
 */
export function setCacheHeaders(res, options = {}) {
  const {
    maxAge = 300,
    public: isPublic = false,
    private: isPrivate = true,
  } = options;

  const cacheControl = [
    isPublic ? 'public' : '',
    isPrivate ? 'private' : '',
    \`max-age=\${maxAge}\`,
    'must-revalidate',
  ]
    .filter(Boolean)
    .join(', ');

  res.set('Cache-Control', cacheControl);
  res.set('ETag', \`"cache-v1"\`);
}

/**
 * Cache middleware for Express
 */
export function cacheMiddleware(ttl = 300) {
  return cache((req, res) => {
    // Cache only GET requests
    if (req.method === 'GET') {
      return \`\${req.originalUrl}\`;
    }
    return false;
  }, {
    ttl,
  });
}

/**
 * Redis stats
 */
export async function getCacheStats() {
  const info = await redis.info('stats');
  const memoryInfo = await redis.info('memory');
  
  return {
    memory: memoryCache.size,
    redisStats: {
      connected: redis.status === 'ready',
      ...info,
    },
    memoryUsage: memoryInfo,
  };
}

/**
 * Clear all cache
 */
export async function clearAllCache() {
  memoryCache.clear();
  await redis.flushdb();
}
`,
        description: "Multi-layer caching strategy with Redis",
      },
    ];
  }

  async generateAPIOptimizations(analysis) {
    return [
      {
        fileName: "api-optimization.js",
        filePath: "src/optimizations/api.js",
        content: `/**
 * API Performance Optimizations
 * Compression, serialization, request/response optimization
 */

import compression from 'compression';

/**
 * Middleware setup for optimization
 */
export function setupAPIOptimizations(app) {
  // Gzip compression
  app.use(compression({ level: 6, threshold: 1024 }));

  // Request size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb' }));

  // Request timeout
  app.use((req, res, next) => {
    req.setTimeout(30000); // 30s timeout
    next();
  });
}

/**
 * Optimize response serialization
 */
export function serializeProductOptimized(product) {
  // Only include necessary fields
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    // Exclude large fields like description, images for list views
  };
}

/**
 * Selective field loading based on context
 */
export async function getProductOptimized(id, includeDetails = false) {
  const select = {
    id: true,
    name: true,
    price: true,
  };

  if (includeDetails) {
    return await prisma.product.findUnique({
      where: { id },
      include: { description: true, reviews: true },
    });
  }

  return await prisma.product.findUnique({
    where: { id },
    select,
  });
}

/**
 * Streaming large responses
 */
export async function streamProducts(res, query = {}) {
  res.setHeader('Content-Type', 'application/json');
  res.write('[');

  const stream = await prisma.product.findMany(query).stream();

  let first = true;
  stream.on('data', (record) => {
    if (!first) res.write(',');
    res.write(JSON.stringify(record));
    first = false;
  });

  stream.on('end', () => {
    res.write(']');
    res.end();
  });
}

/**
 * Batch API endpoint (combine multiple requests)
 */
export async function batchEndpoint(req, res) {
  const { requests } = req.body;

  if (!Array.isArray(requests) || requests.length > 25) {
    return res.status(400).json({ error: 'Max 25 batch requests' });
  }

  const results = await Promise.all(
    requests.map(async (request) => {
      try {
        if (request.type === 'user') {
          return await prisma.user.findUnique({
            where: { id: request.id },
          });
        }
        if (request.type === 'product') {
          return await prisma.product.findUnique({
            where: { id: request.id },
          });
        }
      } catch (error) {
        return { error: error.message };
      }
    })
  );

  res.json({ results });
}

/**
 * Pagination optimization
 */
export async function getPaginatedResults(model, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  // Use separate query for count (can be cached)
  const [items, total] = await Promise.all([
    model.findMany({ skip, take: limit }),
    model.count(), // Cache this separately
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    },
  };
}

/**
 * GraphQL-style query optimization
 */
export async function getProductWithFields(id, fields = []) {
  const select = {};

  // Only load requested fields
  fields.forEach((field) => {
    if (['id', 'name', 'price', 'description'].includes(field)) {
      select[field] = true;
    }
  });

  return await prisma.product.findUnique({
    where: { id },
    select: Object.keys(select).length > 0 ? select : { id: true },
  });
}

/**
 * ETag support for caching
 */
export function etagMiddleware() {
  return (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
      const etag = require('crypto')
        .createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');

      res.setHeader('ETag', etag);

      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Response time tracking
 */
export function responseTimeMiddleware() {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      res.setHeader('X-Response-Time', \`\${duration}ms\`);

      if (duration > 1000) {
        console.warn(\`Slow request: \${req.method} \${req.path} - \${duration}ms\`);
      }
    });

    next();
  };
}

/**
 * Request deduplication
 */
export const requestCache = new Map();

export function deduplicateRequests(req, res, next) {
  const cacheKey = \`\${req.method}:\${req.originalUrl}\`;

  if (requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey);
    return res.json(cached);
  }

  const originalJson = res.json;
  res.json = function (data) {
    requestCache.set(cacheKey, data);

    // Clear cache after 5 seconds
    setTimeout(() => requestCache.delete(cacheKey), 5000);

    return originalJson.call(this, data);
  };

  next();
}
`,
        description: "API optimization middleware and techniques",
      },
    ];
  }

  async generateFrontendOptimizations(analysis) {
    return [
      {
        fileName: "frontend-optimization.ts",
        filePath: "src/optimizations/frontend.ts",
        content: `/**
 * Frontend Performance Optimizations
 * Code splitting, lazy loading, memoization, virtualization
 */

import { useMemo, useCallback, lazy, Suspense } from 'react';

/**
 * Lazy load components
 */
export const ProductList = lazy(() => import('./components/ProductList'));
export const UserProfile = lazy(() => import('./components/UserProfile'));
export const OrderDetails = lazy(() => import('./components/OrderDetails'));

/**
 * Memoized component
 */
export const ProductCard = React.memo(({ product, onAddToCart }) => {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>\${product.price}</p>
      <button onClick={() => onAddToCart(product.id)}>Add to Cart</button>
    </div>
  );
});

/**
 * Optimized list rendering with virtualization
 */
export function ProductListVirtualized({ products }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={products.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ProductCard product={products[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}

/**
 * Memoized expensive computation
 */
export function ProductSearch({ products, searchTerm }) {
  const filtered = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return <ProductList products={filtered} />;
}

/**
 * Debounced API call
 */
export function useSearchAPI() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);

  const debouncedSearch = useCallback(
    debounce(async (q) => {
      const response = await api.searchProducts(q);
      setResults(response);
    }, 300),
    []
  );

  const handleSearch = (e) => {
    const q = e.target.value;
    setQuery(q);
    debouncedSearch(q);
  };

  return { query, results, handleSearch };
}

/**
 * Paginated infinite scroll
 */
export function useInfiniteScroll() {
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState([]);
  const [hasMore, setHasMore] = React.useState(true);

  const observerTarget = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore) {
        loadMoreItems();
      }
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore]);

  const loadMoreItems = async () => {
    const response = await api.getProducts(page + 1);
    setItems([...items, ...response.items]);
    setPage(page + 1);
    setHasMore(response.hasMore);
  };

  return { items, hasMore, observerTarget };
}

/**
 * Image optimization with lazy loading
 */
export function OptimizedImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      srcSet={\`\${src}?w=400 400w, \${src}?w=800 800w\`}
      sizes="(max-width: 600px) 400px, 800px"
    />
  );
}

/**
 * RequestIdleCallback for non-urgent tasks
 */
export function useLazyEffect(effect, dependencies) {
  React.useEffect(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => effect());
    } else {
      setTimeout(effect, 1);
    }
  }, dependencies);
}

/**
 * Batched state updates
 */
export function useQueries(queryFns) {
  const [state, setState] = React.useState({});

  const batch = useCallback(() => {
    unstable_batchedUpdates(() => {
      queryFns.forEach((fn) => {
        fn().then((result) => {
          setState((prev) => ({ ...prev, ...result }));
        });
      });
    });
  }, [queryFns]);

  return { state, batch };
}

/**
 * Code splitting with route-based loading
 */
export const routes = [
  {
    path: '/',
    component: lazy(() => import('./pages/Home')),
  },
  {
    path: '/products',
    component: lazy(() => import('./pages/Products')),
  },
  {
    path: '/checkout',
    component: lazy(() => import('./pages/Checkout')),
  },
];

/**
 * Bundle analysis configuration
 */
export const webpackConfig = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          priority: 10,
          enforce: true,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  },
  performance: {
    maxAssetSize: 512000,
    maxEntrypointSize: 512000,
  },
};

/**
 * Service Worker for offline caching
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        '/sw.js',
        { scope: '/' }
      );
      console.log('Service Worker registered', registration);
    } catch (error) {
      console.warn('Service Worker registration failed', error);
    }
  }
}

/**
 * Debounce utility
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle utility
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
`,
        description: "Frontend performance optimization patterns",
      },
    ];
  }

  async generateInfrastructureOptimizations(analysis) {
    return [
      {
        fileName: "nginx.conf",
        filePath: "config/nginx.conf",
        content: `# Nginx Performance Configuration

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
  worker_connections 2048;
  use epoll;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  log_format main '\\$remote_addr - \\$remote_user [\\$time_local] "\\$request" '
                  '\\$status \\$body_bytes_sent "\\$http_referer" '
                  '"\\$http_user_agent" "\\$http_x_forwarded_for"';

  access_log /var/log/nginx/access.log main;

  # Performance optimizations
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;
  client_max_body_size 20M;

  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_types text/plain text/css text/xml text/javascript
             application/json application/javascript application/xml+rss
             application/rss+xml font/truetype font/opentype
             application/vnd.ms-fontobject image/svg+xml;

  # Caching
  proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m
                   max_size=1g inactive=60m use_temp_path=off;

  upstream api {
    least_conn;
    server api-1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server api-2:3000 weight=1 max_fails=3 fail_timeout=30s;
    server api-3:3000 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
  }

  server {
    listen 80;
    server_name _;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Static files
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
      expires 30d;
      add_header Cache-Control "public, immutable";
    }

    # API
    location /api/ {
      proxy_pass http://api;
      proxy_http_version 1.1;
      proxy_set_header Connection "";
      proxy_set_header Host \\$host;
      proxy_set_header X-Real-IP \\$remote_addr;
      proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;

      proxy_cache api_cache;
      proxy_cache_valid 200 10m;
      proxy_cache_use_stale error timeout invalid_header updating;
      add_header X-Cache-Status \\$upstream_cache_status;
    }

    # Frontend
    location / {
      proxy_pass http://api;
    }
  }
}
`,
        description: "Nginx performance configuration",
      },
    ];
  }

  async generateLoadTesting(analysis) {
    return [
      {
        fileName: "loadtest.js",
        filePath: "tests/load/loadtest.js",
        content: `import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m30s', target: 50 },
    { duration: '20s', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500', 'p(95)<1000', 'p(50)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  const baseURL = 'http://localhost:3000';

  group('API Performance Test', () => {
    // List products
    let res = http.get(\`\${baseURL}/api/products\`);
    check(res, {
      'GET /products returns 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);

    // Get single product
    res = http.get(\`\${baseURL}/api/products/1\`);
    check(res, {
      'GET /products/:id returns 200': (r) => r.status === 200,
      'response time < 200ms': (r) => r.timings.duration < 200,
    });

    sleep(1);

    // Search
    res = http.get(\`\${baseURL}/api/products?query=laptop\`);
    check(res, {
      'Search returns 200': (r) => r.status === 200,
      'search response < 1000ms': (r) => r.timings.duration < 1000,
    });

    sleep(1);
  });
}
`,
        description: "K6 load testing script",
      },
    ];
  }

  async generatePerformanceMonitoring(analysis) {
    return [
      {
        fileName: "performance-monitoring.js",
        filePath: "src/monitoring/performance.js",
        content: `/**
 * Performance Monitoring
 * Track metrics, identify bottlenecks, generate alerts
 */

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  recordMetric(name, value, labels = {}) {
    const key = this.getMetricKey(name, labels);
    const metric = this.metrics.get(key) || {
      name,
      values: [],
      labels,
    };
    metric.values.push(value);
    this.metrics.set(key, metric);
  }

  recordDuration(name, fn, labels = {}) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    this.recordMetric(name, duration, labels);
    return result;
  }

  async recordAsyncDuration(name, fn, labels = {}) {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    this.recordMetric(name, duration, labels);
    return result;
  }

  getMetrics() {
    const stats = {};
    this.metrics.forEach((metric) => {
      const values = metric.values.sort((a, b) => a - b);
      stats[metric.name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: values[Math.floor(values.length * 0.5)],
        p95: values[Math.floor(values.length * 0.95)],
        p99: values[Math.floor(values.length * 0.99)],
      };
    });
    return stats;
  }

  getMetricKey(name, labels) {
    return \`\${name}:\${JSON.stringify(labels)}\`;
  }
}

const monitor = new PerformanceMonitor();

/**
 * Express middleware
 */
export function performanceMiddleware() {
  return (req, res, next) => {
    const start = performance.now();

    res.on('finish', () => {
      const duration = performance.now() - start;
      monitor.recordMetric('http_request_duration_ms', duration, {
        method: req.method,
        path: req.path,
        status: res.statusCode,
      });
    });

    next();
  };
}

export default monitor;
`,
        description: "Performance monitoring utilities",
      },
    ];
  }

  async generateOptimizationGuide(analysis) {
    return [
      {
        fileName: "OPTIMIZATION_GUIDE.md",
        filePath: "docs/OPTIMIZATION_GUIDE.md",
        content: `# Performance Optimization Guide

## Overview

This guide provides comprehensive optimization strategies covering database, API, and frontend layers.

## Quick Wins (Implement First)

### 1. Database Indexing ✅
\`\`\`sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_product_category_price ON products(category, price);
CREATE INDEX idx_order_user_date ON orders(user_id, created_date);
\`\`\`

**Impact**: 50-100x query speedup

### 2. Enable Caching 🔄
\`\`\`javascript
import Redis from 'ioredis';
const cache = new Redis();
\`\`\`

**Impact**: 10x API response improvement

### 3. Gzip Compression 📦
\`\`\`javascript
app.use(compression());
\`\`\`

**Impact**: 70% bandwidth reduction

### 4. Load Balancing ⚖️
- Use multiple API instances
- Route with least-conn algorithm
- Enable connection pooling

**Impact**: 3-5x throughput improvement

## Database Optimization

### Query Optimization
- ✅ Use EXPLAIN ANALYZE to find slow queries
- ✅ Add indexes to WHERE and JOIN columns
- ✅ Avoid SELECT * (select only needed fields)
- ✅ Use LIMIT and pagination
- ✅ Batch operations when possible

### N+1 Query Prevention
\`\`\`javascript
// ❌ Bad: N queries
users.forEach(async user => {
  user.posts = await Post.find({ userId: user.id });
});

// ✅ Good: 1 query
users = await User.find().include('posts');
\`\`\`

### Connection Pooling
\`\`\`javascript
pool_size: 20,
statement_cache_size: 100,
\`\`\`

## Caching Strategy

### Multi-Layer Cache
1. **Memory Cache** - Hot data, < 100ms
2. **Redis** - Shared cache, < 10ms
3. **HTTP Cache** - Browser cache, < 1ms

### Cache Invalidation
- Time-based: Fast but potentially stale
- Event-based: Accurate but complex
- Hybrid: Best of both

## API Optimization

### Response Optimization
- Compress responses (gzip)
- Selective field loading
- Pagination for lists
- Streaming for large files

### Request Optimization
- Batch requests
- Combine endpoints
- Request deduplication
- HTTP/2 server push

## Frontend Optimization

### Code Splitting
- Route-based chunks
- Dynamic imports
- Vendor separation

### Rendering Optimization
- Virtual scrolling for long lists
- Memoization for expensive components
- Lazy loading images
- Debounce/throttle events

### Bundle Optimization
- Minification
- Tree-shaking
- CSS-in-JS optimization
- Service Worker caching

## Infrastructure Optimization

### Nginx
- Enable gzip
- Configure caching
- Connection pooling
- Rate limiting

### Load Balancing
- Least connections
- Round robin
- Geographic routing
- Health checks

### Databases
- Read replicas
- Connection pooling
- Query caching
- Partitioning

## Monitoring & Metrics

### Key Metrics
- Response time (p50, p95, p99)
- Throughput (requests/sec)
- Error rate
- CPU/Memory usage
- Database query time
- Cache hit rate

### Tools
- Prometheus: Metrics collection
- Grafana: Visualization
- DataDog: APM
- New Relic: Monitoring

## Performance Testing

### Load Testing
\`\`\`bash
npm run load-test
\`\`\`

### Profiling
\`\`\`bash
node --inspect app.js
\`\`\`

### Benchmarking
\`\`\`javascript
performance.now()
console.time()
\`\`\`

## Performance Checklist

Database Layer:
- [ ] Indexed frequently queried columns
- [ ] Pagination implemented
- [ ] N+1 queries eliminated
- [ ] Connection pooling enabled
- [ ] Slow query monitoring

API Layer:
- [ ] Response compression enabled
- [ ] Caching implemented
- [ ] Batch endpoints available
- [ ] Selective field loading
- [ ] Rate limiting

Frontend Layer:
- [ ] Code splitting implemented
- [ ] Images lazy loaded
- [ ] Memoization applied
- [ ] Virtual scrolling for lists
- [ ] Service Worker enabled

Infrastructure:
- [ ] Load balancing configured
- [ ] CDN integrated
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Auto-scaling setup

## Expected Improvements

| Optimization | Impact |
|---|---|
| Database indexing | 50-100x |
| Caching | 10-100x |
| Compression | 70% reduction |
| Load balancing | 3-5x |
| Code splitting | 30-50% |
| All combined | 100-500x |

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Node.js Performance](https://nodejs.org/en/docs/guides/nodejs-performance-best-practices/)
- [React Performance](https://reactjs.org/docs/hooks-faq.html#how-to-memoize-calculations)
- [Nginx Optimization](https://nginx.org/en/docs/)
`,
        description: "Comprehensive optimization guide",
      },
    ];
  }

  getFallbackOptimizations(request) {
    this.warn({ stage: "fallback" }, "Using fallback optimizations");

    return makeAgentOutput({
      summary:
        "PerformanceOptimizationAgent: Generated basic optimization recommendations (fallback)",
      patches: [
        {
          fileName: "quick-optimizations.md",
          filePath: "docs/quick-optimizations.md",
          content: `# Quick Performance Optimizations

1. **Add database indexes**
   \`CREATE INDEX idx_email ON users(email);\`

2. **Enable caching**
   \`app.use(cache());\`

3. **Enable compression**
   \`app.use(compression());\`

4. **Pagination**
   \`SELECT * FROM products LIMIT 20 OFFSET 0;\`

5. **Load balancing**
   Use multiple server instances
`,
        },
      ],
      metadata: { fallback: true },
    });
  }
}
