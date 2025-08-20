# Testing Guide for Relayer Frontend

This document provides comprehensive guidance on testing the Relayer Frontend application to ensure all functionality remains intact as new features are added.

## 🧪 Test Structure

The testing suite is organized into several layers:

```
src/
├── __tests__/                    # Main test files
│   ├── App.test.js              # App component tests
│   └── integration.test.js      # Integration tests
├── components/
│   └── __tests__/               # Component-specific tests
│       ├── DataFeed.test.js     # DataFeed component tests
│       └── utils.test.js        # Utility function tests
├── test-setup/                   # Test configuration
│   ├── global-setup.js          # Global test setup
│   └── global-teardown.js       # Global test cleanup
├── __mocks__/                    # Mock files
│   └── fileMock.js              # Static asset mocks
├── setupTests.js                 # Jest setup configuration
└── jest.config.js                # Jest configuration
```

## 🚀 Running Tests

### Basic Test Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD pipeline
npm run test:ci

# Debug tests with Node.js inspector
npm run test:debug
```

### Test Coverage

The test suite aims for **70% coverage** across:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 📋 Test Categories

### 1. Unit Tests (`DataFeed.test.js`)

Tests individual component functionality:

- **Initial Rendering**: Loading states, logo display
- **Feed Selection**: Sepolia and Saga feed buttons
- **Contract Switching**: Tellor ↔ DataBank transitions
- **Chart Controls**: Time scale toggles, date inputs
- **Data Display**: Data rendering, pagination
- **Error Handling**: Graceful error management
- **Responsive Design**: Layout consistency
- **Accessibility**: Alt text, button content
- **State Management**: Feed selection persistence
- **Performance**: Rapid interaction handling

### 2. Utility Tests (`utils.test.js`)

Tests helper functions:

- **Time String Parsing**: `parseTimeString()` function
- **Time String Formatting**: `formatTimeString()` function
- **Data Processing**: Chart data preparation
- **Block Time Calculations**: Blockchain timing logic
- **Data Validation**: Transaction data integrity

### 3. Integration Tests (`integration.test.js`)

Tests component interactions:

- **Feed Selection Flow**: Complete Tellor → DataBank workflow
- **Chart Controls Integration**: Time scale + chart interaction
- **Data Flow**: Loading state transitions
- **UI Responsiveness**: Layout maintenance across states
- **Error Recovery**: Functionality after errors
- **Performance Integration**: Rapid interaction handling

### 4. App Tests (`App.test.js`)

Tests application structure:

- **Component Rendering**: App component display
- **Theme Application**: Material-UI theme integration
- **CSS Baseline**: Global styling setup
- **Component Hierarchy**: Proper component structure

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)

- **Environment**: jsdom for DOM testing
- **Coverage**: HTML, LCOV, and text reports
- **Transformers**: Babel for JSX, CSS stub for styles
- **Mocking**: Ethers.js and Chart.js mocks
- **Timeouts**: 10 seconds per test
- **Watch Plugins**: Filename and testname filtering

### Global Setup (`global-setup.js`)

- **Browser API Mocks**: matchMedia, ResizeObserver, etc.
- **Test Utilities**: Mock data generators, validation helpers
- **Environment Variables**: Test mode configuration
- **Console Suppression**: Reduced noise during tests

### Test Utilities

```javascript
// Available globally in tests
global.testUtils = {
  generateMockTellorData(count),      // Generate Tellor mock data
  generateMockDataBankData(count, feed), // Generate DataBank mock data
  mockEthersProvider(),               // Mock ethers provider
  mockEthersContract(),               // Mock ethers contract
  validateTestData(data, fields),     // Validate test data
  waitForCondition(condition, timeout), // Wait for async conditions
  getElementByText(text, container),  // Find element by text
  getComputedStyle(element, property) // Get computed styles
};
```

## 📝 Writing New Tests

### When Adding New Features

1. **Update Existing Tests**: Ensure new functionality doesn't break existing tests
2. **Add Component Tests**: Test new components in their own test files
3. **Extend Integration Tests**: Add tests for new user workflows
4. **Update Utility Tests**: Test new helper functions
5. **Maintain Coverage**: Keep coverage above 70%

### Test Naming Convention

```javascript
describe('Feature Name', () => {
  test('should do something specific', () => {
    // Test implementation
  });
  
  test('should handle edge case', () => {
    // Edge case test
  });
});
```

### Test Structure

```javascript
describe('Component Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Feature Group', () => {
    test('specific behavior', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## 🐛 Common Testing Issues

### 1. Async Operations

```javascript
// Use waitFor for async state changes
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### 2. Component State Changes

```javascript
// Wait for loading to complete
await waitFor(() => {
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
```

### 3. Mock Dependencies

```javascript
// Mock external libraries
jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn(),
  Contract: jest.fn(),
  // ... other mocks
}));
```

### 4. User Interactions

```javascript
// Simulate user clicks
const button = screen.getByText('Button Text');
fireEvent.click(button);
```

## 🔍 Debugging Tests

### Enable Verbose Logging

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- DataFeed.test.js

# Run specific test
npm test -- --testNamePattern="should render loading state"
```

### Debug Mode

```bash
# Run tests with Node.js inspector
npm run test:debug

# Then open Chrome DevTools and go to chrome://inspect
```

### Console Output

```javascript
// Uncomment in global-setup.js to see console output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
```

## 📊 Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### Coverage Output

- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **Console Summary**: Terminal output

### Coverage Thresholds

The build will fail if coverage drops below:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
- name: Run Tests
  run: npm run test:ci
```

### Coverage Badge

Add to README.md:
```markdown
[![Test Coverage](https://img.shields.io/badge/coverage-70%25-brightgreen)](https://github.com/your-repo/relayer-frontend)
```

## 🧹 Maintenance

### Regular Tasks

1. **Weekly**: Run full test suite
2. **Monthly**: Review and update test coverage
3. **Before Releases**: Ensure all tests pass
4. **After Bug Fixes**: Add regression tests

### Test Updates

When updating tests:
1. **Preserve Intent**: Keep original test purpose
2. **Update Selectors**: Use stable selectors (text content over CSS classes)
3. **Maintain Coverage**: Don't remove tests without replacement
4. **Document Changes**: Update this guide if needed

## 📚 Additional Resources

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Material-UI Testing](https://mui.com/material-ui/guides/testing/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing

When contributing to tests:

1. **Follow Patterns**: Use existing test structure
2. **Add Coverage**: Ensure new code is tested
3. **Update Documentation**: Keep this guide current
4. **Review Changes**: Have tests reviewed with code

---

**Remember**: Good tests are the foundation of reliable software. They give you confidence to refactor, add features, and deploy with peace of mind.
