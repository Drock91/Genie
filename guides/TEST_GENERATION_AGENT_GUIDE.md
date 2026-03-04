# TestGenerationAgent Guide

## Overview

The **TestGenerationAgent** automatically generates comprehensive test suites for all generated code. It creates unit tests, integration tests, end-to-end tests, and related testing infrastructure.

## Capabilities

### 1. **Unit Test Generation** ✅
- Tests for individual functions, classes, and methods
- Jest configuration and utilities
- Coverage targets: 80-95%
- Mocking and fixtures

### 2. **Integration Test Generation** ✅
- API endpoint testing with supertest
- Database integration tests
- Service layer testing
- Transaction testing

### 3. **End-to-End Test Generation** ✅
- User workflow testing with Playwright
- Registration and login flows
- Product browsing and search
- Shopping cart and checkout
- Multi-browser support

### 4. **Test Infrastructure** ✅
- Jest configuration
- Vitest configuration
- Playwright configuration
- Test utilities and helpers
- Mock data fixtures
- Test data factories

### 5. **CI/CD Integration** ✅
- GitHub Actions workflows
- Automated test execution
- Coverage reporting
- Artifact uploading
- Multi-stage testing pipeline

### 6. **Performance Testing** ✅
- K6 load testing scripts
- Performance benchmarks
- Stress testing configurations
- Throughput monitoring

## Generated Files

### Unit Tests (3-5 files)
- `auth.test.js` - Authentication service tests
- `database.test.js` - Database model tests
- `utils.test.js` - Utility function tests
- `services.test.js` - Business logic tests
- `middleware.test.js` - Middleware tests

### Integration Tests (2-3 files)
- `api.integration.test.js` - API endpoint tests
- `database.integration.test.js` - Database integration tests
- `auth.integration.test.js` - Authentication flow tests

### E2E Tests (2-4 files)
- `user-flow.spec.js` - User registration and login
- `product-flow.spec.js` - Product browsing and search
- `checkout-flow.spec.js` - Complete purchase flow
- `admin-flow.spec.js` - Admin operations

### Test Configuration (3 files)
- `jest.config.js` - Jest configuration
- `vitest.config.js` - Vitest configuration
- `playwright.config.js` - Playwright configuration

### Test Utilities (3 files)
- `test-utils.js` - Helper functions
- `fixtures.js` - Mock data
- `setup.js` - Test setup and teardown

### CI/CD (1 file)
- `.github/workflows/test.yml` - GitHub Actions workflow

### Documentation (2 files)
- `TESTING.md` - Testing guide
- `test-coverage.json` - Coverage configuration

## Usage Examples

### Running Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Run single test file
npm test -- auth.test.js

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

### Test Structure

```javascript
describe('Feature', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    // Arrange
    const input = test data;

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Writing Unit Tests

**Function testing:**
```javascript
describe('calculateTotal', () => {
  it('should sum array of numbers', () => {
    expect(calculateTotal([1, 2, 3])).toBe(6);
  });

  it('should handle empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('should handle negative numbers', () => {
    expect(calculateTotal([-1, 2, -3])).toBe(-2);
  });
});
```

**Class testing:**
```javascript
describe('UserService', () => {
  let service;

  beforeEach(() => {
    service = new UserService();
  });

  it('should create user', async () => {
    const user = await service.create({
      email: 'test@example.com',
      password: 'Pass123!',
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});
```

### Writing Integration Tests

```javascript
describe('API Integration', () => {
  let authToken;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!',
      });
    authToken = response.body.token;
  });

  it('should get user profile', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('test@example.com');
  });
});
```

### Writing E2E Tests

```javascript
test('should complete checkout flow', async ({ page }) => {
  // Navigate to products
  await page.goto('http://localhost:3000/products');

  // Add product to cart
  await page.click('[data-testid="product-card"]:first-child button');

  // Go to cart
  await page.goto('http://localhost:3000/cart');

  // Checkout
  await page.click('button:has-text("Checkout")');

  // Fill payment
  await page.fill('input[name="card"]', '4532015112830366');

  // Submit
  await page.click('button:has-text("Pay")');

  // Verify order confirmation
  await expect(page.locator('text=Order Confirmed')).toBeVisible();
});
```

## Test Coverage

### Target Coverage
- Overall: 80-95%
- Critical paths: 100%
- Business logic: 90%+
- Utilities: 85%+

### Check Coverage
```bash
npm test -- --coverage
open coverage/index.html
```

### Coverage by Category
| Category | Target |
|---|---|
| Statements | 80% |
| Branches | 80% |
| Functions | 80% |
| Lines | 80% |

## Continuous Integration

### GitHub Actions Workflow
Automatically runs:
1. Unit tests with coverage
2. Integration tests
3. E2E browser tests
4. Coverage reporting

### Local Validation
```bash
# Before pushing
npm run test:all
```

## Best Practices

### ✅ Do
- Test behavior, not implementation
- Use descriptive test names
- Keep tests focused and small
- Isolate external dependencies
- Use fixtures for consistency
- Use data builders for complex objects
- Test error cases
- Keep tests DRY with helpers

### ❌ Don't
- Test implementation details
- Hard-code test data
- Create interdependent tests
- Mock too much (use integration tests)
- Skip flaky tests (fix them)
- Test third-party libraries
- Use sleep() for timing

## Debugging Tests

### Debug Single Test
```bash
npm test -- --testNamePattern="should do something"
```

### Debug with Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Debug E2E
```bash
npx playwright test --debug

# Also generates trace for analysis
npx playwright show-trace trace.zip
```

## Common Issues

### Issue: Tests are flaky
**Causes:**
- Race conditions
- Timing issues
- Mock data inconsistency

**Solutions:**
- Use waitFor() instead of sleep()
- Increase timeouts
- Isolate external state
- Mock time dependencies

### Issue: Slow tests
**Causes:**
- Real database calls
- Real API calls
- Large test data

**Solutions:**
- Mock external dependencies
- Use test database
- Use fixtures
- Run tests in parallel

### Issue: Coverage gaps
**Causes:**
- Untested code paths
- Error handling not tested
- Edge cases missed

**Solutions:**
- Add error case tests
- Test edge cases
- Use Istanbul reports
- Code review with focus on coverage

## Performance Metrics

### Typical Test Execution Times
- Unit tests: < 5 seconds (500 tests)
- Integration tests: 10-30 seconds
- E2E tests: 30-60 seconds
- Full suite: 60-90 seconds

### Optimization Tips
- Run unit tests first (fastest)
- Use test parallelization
- Reduce E2E test counts
- Cache fixture data
- Use test database snapshots

## Test Utilities

### Helper Functions
```javascript
// Create test user
const user = await createTestUser({ email: 'custom@test.com' });

// Generate JWT token
const token = createTestToken({ id: user.id });

// Make authenticated request
const response = await authenticatedRequest(req, token);

// Clear database between tests
await clearDatabase();

// Wait for condition
await waitFor(() => element.isVisible(), 5000);
```

### Mock Data
```javascript
// Import fixtures
import { mockUsers, mockProducts, mockOrders } from './fixtures';

// Use in tests
const users = mockUsers.slice(); // Clone to avoid mutations
```

## Integration with CI/CD

### GitHub Actions Features
- Runs on push and pull requests
- Parallel job execution
- Artifact storage for reports
- Coverage reporting
- Test result display

### Slack Integration
```yaml
- name: Report to Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
```

## Monitoring Test Health

### Key Metrics
- Test pass rate
- Test execution time
- Code coverage %
- Flaky test frequency
- Coverage trend

### Dashboard Setup
```bash
npm run metrics:collect
npm run metrics:report
```

## Advanced Topics

### Snapshot Testing
```javascript
it('should match snapshot', () => {
  const component = render(<Product {...props} />);
  expect(component).toMatchSnapshot();
});
```

### Performance Testing
```javascript
it('should complete in < 100ms', () => {
  const start = performance.now();
  myFunction();
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(100);
});
```

### Visual Regression Testing
```javascript
test('should match visual regression', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveScreenshot();
});
```

## Support & Resources

### Documentation
- Jest: https://jestjs.io/
- Playwright: https://playwright.dev/
- Vitest: https://vitest.dev/
- Testing Library: https://testing-library.com/

### Common Patterns
- Arrange-Act-Assert (AAA)
- Given-When-Then (GWT)
- Test Pyramid (Unit > Integration > E2E)
- FIRST principles (Fast, Isolated, Repeatable, Self-checking, Timely)

---

**Last Updated**: 2024-02-19  
**Version**: 1.0.0
