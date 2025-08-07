# Development Guidelines & Standards

## Code Standards

### Naming Conventions
```javascript
// Files: kebab-case
user-service.js
blood-request.controller.js

// Classes: PascalCase
class BloodRequestManager {}
class DonorMatcher {}

// Functions: camelCase
function findNearbyDonors() {}
function sendWhatsAppNotification() {}

// Constants: UPPER_SNAKE_CASE
const MAX_NOTIFICATION_RETRIES = 3;
const DEFAULT_SEARCH_RADIUS = 15;

// Interfaces/Types: PascalCase with 'I' prefix
interface IDonor {}
interface IBloodRequest {}
```

### Service Structure
```
src/
├── services/
│   ├── user/
│   │   ├── user.controller.js
│   │   ├── user.service.js
│   │   ├── user.repository.js
│   │   ├── user.model.js
│   │   └── user.test.js
│   └── notification/
│       └── ...
├── shared/
│   ├── utils/
│   ├── middleware/
│   └── constants/
└── config/
```

## Git Workflow

### Branch Strategy
```
main (production)
├── develop (staging)
│   ├── feature/BDMS-123-donor-registration
│   ├── feature/BDMS-124-whatsapp-integration
│   └── hotfix/BDMS-125-critical-matching-bug
```

### Commit Convention
```bash
# Format: <type>(<scope>): <subject>

feat(donor): add WhatsApp OTP verification
fix(matching): correct distance calculation algorithm
docs(api): update donor endpoint documentation
perf(query): optimize geospatial donor search
test(notification): add WhatsApp delivery tests
```

## Code Review Checklist
- [ ] Follows naming conventions
- [ ] Includes unit tests (>90% coverage)
- [ ] Updates API documentation
- [ ] Handles errors appropriately
- [ ] Includes input validation
- [ ] Considers security implications
- [ ] Optimizes database queries
- [ ] Updates relevant documentation

## Performance Benchmarks
```javascript
const performanceBenchmarks = {
  apiResponse: 200,        // ms
  dbQuery: 50,            // ms
  whatsappDelivery: 3000, // ms
  donorMatching: 1000,    // ms
  pageLoad: 2000          // ms
};
```

## Testing Standards

### Unit Test Structure
```javascript
describe('DonorMatcher', () => {
  describe('findNearbyDonors', () => {
    it('should return donors within specified radius', async () => {
      // Arrange
      const request = createMockBloodRequest();
      
      // Act
      const donors = await donorMatcher.findNearbyDonors(request);
      
      // Assert
      expect(donors).toHaveLength(5);
      expect(donors[0].distance).toBeLessThan(15);
    });
  });
});
```

### Testing Pyramid
- **Unit Tests (60%)**: Business logic and utilities
- **Integration Tests (30%)**: API and service integration  
- **E2E Tests (10%)**: Critical user journeys