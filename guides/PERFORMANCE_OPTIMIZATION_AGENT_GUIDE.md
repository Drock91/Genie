# PerformanceOptimizationAgent Guide

## Overview

The **PerformanceOptimizationAgent** analyzes generated code for performance bottlenecks and provides comprehensive optimization recommendations. It generates optimized code, configuration files, testing utilities, and a detailed optimization guide.

## Capabilities

### 1. **Database Optimization** ✅
- Query optimization analysis
- Index recommendations
- N+1 query elimination
- Connection pooling configuration
- Aggregation optimization
- Batch operation patterns

### 2. **Caching Strategy** ✅
- Multi-layer caching (Memory, Redis, HTTP)
- Cache invalidation patterns
- Selective field loading
- Cache warming
- Cache statistics tracking

### 3. **API Optimization** ✅
- Response compression (gzip)
- Request/response optimization
- Serialization optimization
- Batch endpoints
- Pagination optimization
- ETag support
- Request deduplication

### 4. **Frontend Optimization** ✅
- Code splitting strategies
- Lazy loading components
- Memoization patterns
- Virtual scrolling
- Image optimization
- Service Worker caching
- Bundle optimization

### 5. **Infrastructure Optimization** ✅
- Nginx configuration
- Load balancing setup
- Connection optimization
- Caching middleware
- Rate limiting

### 6. **Performance Testing** ✅
- K6 load testing
- Performance benchmarking
- Stress testing
- Throughput monitoring
- Metrics collection

## Generated Files

### Database Optimization (1 file)
- `database.js` - Optimized queries, indexes, pagination

### Caching (1 file)
- `cache.js` - Redis caching strategy, multi-layer cache

### API Optimization (1 file)
- `api.js` - Compression, serialization, batch endpoints

### Frontend Optimization (1 file)
- `frontend.ts` - Code splitting, lazy loading, memoization

### Infrastructure (1 file)
- `nginx.conf` - Nginx performance configuration

### Load Testing (1 file)
- `loadtest.js` - K6 load testing scripts

### Monitoring (1 file)
- `performance-monitoring.js` - Metrics collection

### Documentation (1 file)
- `OPTIMIZATION_GUIDE.md` - Comprehensive guide

## Performance Improvements

### Expected Results

| Optimization | Impact |
|---|---|
| Database indexing | 50-100x faster queries |
| Caching | 10-100x faster responses |
| Compression | 70% bandwidth reduction |
| Load balancing | 3-5x throughput improvement |
| Code splitting | 30-50% bundle size reduction |
| **All combined** | **100-500x improvement** |

### Typical Metrics

**Before Optimization:**
- API response: 500-1000ms
- Database query: 200-500ms
- Page load: 3-5s
- Throughput: 100 requests/sec

**After Optimization:**
- API response: 50-100ms
- Database query: 5-20ms
- Page load: 500-1000ms
- Throughput: 500-1000 requests/sec

## Usage Examples

### Database Optimization

**Problem: N+1 Query Issue**
```javascript
// ❌ BEFORE: N+1 problem - 1 + N queries
const users = await User.findAll();
const usersWithPosts = await Promise.all(
  users.map(u => Post.findAll({ where: { userId: u.id } }))
);

// ✅ AFTER: Single optimized query
const users = await User.findAll({ include: ['posts'] });
```

**Applied:**
```bash
# Auto-generated optimized query
import { getUsersWithPostsOptimized } from './optimizations/database';
const users = await getUsersWithPostsOptimized();
```

### Caching Strategy

**Basic Usage:**
```javascript
import { withCache, invalidateUserCache } from './optimizations/cache';

// Automatic caching with fallback
const user = await withCache(
  `user:${userId}`,
  () => prisma.user.findUnique({ where: { id: userId } }),
  300 // 5 minute TTL
);

// Invalidate cache on update
await user.update({ name: 'New Name' });
await invalidateUserCache(userId);
```

**Multi-Layer Cache:**
```javascript
// Checks memory cache first, then Redis, then database
const product = await getProductCached(productId);

// Warm up cache on startup
await warmCache();

// Monitor cache efficiency
const stats = await getCacheStats();
```

**Implementation:**
```javascript
// Enable in your app
import { withCache, warmCache } from './optimizations/cache';

app.on('startup', async () => {
  await warmCache(); // Pre-load hot data
});
```

### API Optimization

**Compression:**
```javascript
import { setupAPIOptimizations } from './optimizations/api';

setupAPIOptimizations(app);
// Automatically enables gzip, sets limits, configures timeouts
```

**Selective Field Loading:**
```javascript
// ❌ Before: Load everything
const product = await getProduct(id);

// ✅ After: Only needed fields
const product = await getProductOptimized(id, false);
```

**Batch Endpoint:**
```javascript
// Combine multiple requests
const response = await fetch('/api/batch', {
  method: 'POST',
  body: JSON.stringify({
    requests: [
      { type: 'user', id: '123' },
      { type: 'product', id: 'abc' },
      { type: 'product', id: 'def' }
    ]
  })
});
```

### Frontend Optimization

**Code Splitting:**
```javascript
// Lazy load components
export const ProductList = lazy(() => import('./ProductList'));
export const UserProfile = lazy(() => import('./UserProfile'));

// In routes
<Suspense fallback={<Loader />}>
  <ProductList />
</Suspense>
```

**Memoization:**
```javascript
// Avoid unnecessary re-renders
const ProductCard = React.memo(({ product, onAddToCart }) => {
  return <div>...</div>;
});

// Memoized expensive computations
const filtered = useMemo(() => {
  return products.filter(p => p.price > threshold);
}, [products, threshold]);
```

**Virtual Scrolling:**
```javascript
// Render only visible items
<FixedSizeList
  height={600}
  itemCount={10000}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>{items[index]}</div>
  )}
</FixedSizeList>
```

### Nginx Configuration

```nginx
# Enable gzip compression
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json;

# Cache static assets
location ~* \.(js|css|png|jpg)$ {
  expires 30d;
  add_header Cache-Control "public, immutable";
}

# Load balancing
upstream api {
  least_conn;
  server api-1:3000;
  server api-2:3000;
  server api-3:3000;
}
```

### Load Testing

**Run K6:**
```bash
k6 run tests/load/loadtest.js
```

**Output:**
```
    ✓ GET /products returns 200
    ✓ response time < 500ms
    ✓ GET /products/:id returns 200
    
  data_received..................: 12 MB
  data_sent.......................: 2 MB
  http_req_duration..............: avg=245ms p(95)=450ms p(99)=890ms
  http_req_failed.................: 0.00%
```

### Performance Monitoring

**Track Metrics:**
```javascript
import PerformanceMonitor from './monitoring/performance';

// Record duration
PerformanceMonitor.recordDuration('process', () => {
  return expensive_operation();
});

// Get stats
const metrics = PerformanceMonitor.getMetrics();
console.log(metrics);
// Output:
// {
//   process: {
//     count: 100,
//     min: 45,
//     max: 156,
//     avg: 98,
//     p50: 95,
//     p95: 142,
//     p99: 154
//   }
// }
```

## Quick Start

### 1. Enable Database Optimization
```bash
# Add indexes
npm run migrations:create -- add-indexes

# Verify index usage
npm run db:analyze
```

### 2. Configure Caching
```javascript
import Redis from 'ioredis';
import { withCache, warmCache } from './optimizations/cache';

const redis = new Redis();

// Warm cache on startup
app.listen(3000, async () => {
  await warmCache();
  console.log('Cache warmed');
});
```

### 3. Setup API Optimization
```javascript
import { setupAPIOptimizations } from './optimizations/api';

setupAPIOptimizations(app);
```

### 4. Enable Frontend Code Splitting
```javascript
// Update your route definitions
const routes = [
  { path: '/', component: lazy(() => import('./pages/Home')) },
  { path: '/products', component: lazy(() => import('./pages/Products')) }
];
```

### 5. Configure Load Balancing
```bash
# Copy nginx configuration
cp config/nginx.conf /etc/nginx/sites-available/api

# Reload nginx
sudo systemctl reload nginx
```

### 6. Run Load Tests
```bash
npm run test:load
```

## Optimization Checklist

### Quick Wins (30 min)
- [ ] Add database indexes
- [ ] Enable gzip compression
- [ ] Configure basic caching
- [ ] setup pagination

### Medium (2-4 hours)
- [ ] Implement Redis caching
- [ ] Add code splitting
- [ ] Set up load balancing
- [ ] Configure Nginx

### Comprehensive (1-2 days)
- [ ] Full frontend optimization
- [ ] Performance monitoring
- [ ] Load testing
- [ ] Infrastructure tuning
- [ ] CDN integration

## Performance Monitoring

### Key Metrics to Track
```javascript
// Response time distribution
{
  'p50': 100,   // Median
  'p95': 450,   // 95th percentile
  'p99': 890    // 99th percentile
}

// Error rate
const errorRate = failedRequests / totalRequests;

// Throughput
const throughput = totalRequests / timeInSeconds;

// Cache hit rate
const hitRate = cacheHits / (cacheHits + cacheMisses);
```

### Alerts to Set
```javascript
// Alert if p95 response time > 1000ms
if (metrics.p95 > 1000) notifyAlert();

// Alert if error rate > 1%
if (errorRate > 0.01) notifyAlert();

// Alert if throughput drops > 20%
if (throughput < baseline * 0.8) notifyAlert();
```

## Best Practices

### ✅ Do
- Profile before optimizing (measure, don't guess)
- Optimize in layers (DB → Cache → API → Frontend)
- Monitor production metrics
- Implement caching thoughtfully
- Use connection pooling
- Enable compression
- Test performance regularly
- Document optimization decisions

### ❌ Don't
- Optimize prematurely
- Cache everything
- Ignore database performance
- Skip load testing
- Forget about edge cases
- Optimize without metrics
- Over-complicate solutions
- Neglect maintenance

## Troubleshooting

### Issue: Cache inconsistency
**Symptoms:**
- Stale data returned
- Updates not reflected

**Solutions:**
- Implement proper invalidation
- Use event-based cache clearing
- Reduce TTL for frequently changing data
- Monitor cache hit rate

### Issue: High memory usage
**Symptoms:**
- Process consuming excess RAM
- Frequent crashes

**Solutions:**
- Reduce cache size
- Use time-based expiration
- Implement LRU cache limits
- Monitor memory in production

### Issue: Database slowness persists
**Symptoms:**
- Queries still slow after indexing
- High CPU on database

**Solutions:**
- Check index usage
- Analyze query plans
- Consider read replicas
- Implement connection pooling
- Check for lock contention

## Resources

### Tools
- K6: Load testing (https://k6.io/)
- Apache JMeter: Performance testing
- Clinic.js: Node.js profiling
- DataDog: APM and monitoring
- New Relic: Performance monitoring

### Documentation
- Node.js Performance: https://nodejs.org/en/docs/guides/nodejs-performance-best-practices/
- React Performance: https://reactjs.org/docs/optimizing-performance.html
- PostgreSQL Optimization: https://www.postgresql.org/docs/
- Nginx Performance: https://nginx.org/en/docs/

### Courses & Articles
- Web Vitals: https://web.dev/vitals/
- Frontend Performance: https://www.smashingmagazine.com/
- Database Performance: https://use-the-index-luke.com/

## Related Agents

- **TestGenerationAgent**: Tests performance optimizations
- **DeploymentAgent**: Deploys optimized infrastructure
- **APIDocumentationAgent**: Documents API performance characteristics
- **SecurityHardeningAgent**: Adds security without sacrificing performance

---

**Last Updated**: 2024-02-19  
**Version**: 1.0.0
