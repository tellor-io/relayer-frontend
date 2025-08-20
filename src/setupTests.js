// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.matchMedia for Material-UI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver for Chart.js
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for Material-UI components
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Suppress console warnings during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

// Restore console.error after tests
afterAll(() => {
  console.error = originalError;
});

// Global test utilities
global.testUtils = {
  // Mock data generators
  generateMockTellorData: (count = 5) => {
    return Array.from({ length: count }, (_, i) => ({
      value: `2000.${i.toString().padStart(2, '0')}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      aggregatePower: (1000 + i * 100).toString(),
      relayTimestamp: new Date(Date.now() - i * 60000 + 5000).toISOString(),
      timeDifference: `${(5 + i * 0.5).toFixed(1)}s`,
      blockNumber: (12345 + i).toString(),
      _rawTimestamp: Date.now() - i * 60000
    }));
  },
  
  generateMockDataBankData: (count = 5, feed = 'BTC/USD') => {
    return Array.from({ length: count }, (_, i) => ({
      value: `${50000 + i * 100}.00`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      aggregatePower: (500 + i * 50).toString(),
      relayTimestamp: new Date(Date.now() - i * 60000 + 2000).toISOString(),
      timeDifference: `${(2 + i * 0.3).toFixed(1)}s`,
      blockNumber: (67890 + i).toString(),
      pair: feed,
      txHash: `update_${feed.replace('/', '_')}_${i + 1}_${Date.now()}`,
      note: `Update ${i + 1}/${count}`,
      _rawTimestamp: Date.now() - i * 60000
    }));
  },
  
  // Mock ethers utilities
  mockEthersProvider: () => ({
    getBlockNumber: jest.fn().mockResolvedValue(12345),
    getBlock: jest.fn().mockResolvedValue({
      number: 12345,
      timestamp: Math.floor(Date.now() / 1000)
    })
  }),
  
  mockEthersContract: () => ({
    getAllExtendedData: jest.fn().mockResolvedValue([]),
    getAggregateValueCount: jest.fn().mockResolvedValue(0),
    getAggregateByIndex: jest.fn().mockResolvedValue([])
  }),
  
  // Test data validation
  validateTestData: (data, requiredFields = []) => {
    if (!data) return false;
    if (requiredFields.length === 0) return true;
    return requiredFields.every(field => 
      data.hasOwnProperty(field) && data[field] !== null && data[field] !== undefined
    );
  },
  
  // Wait utilities
  waitForCondition: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkCondition = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Condition not met within timeout'));
        } else {
          setTimeout(checkCondition, 100);
        }
      };
      checkCondition();
    });
  },
  
  // DOM utilities
  getElementByText: (text, container = document) => {
    return Array.from(container.querySelectorAll('*')).find(element => 
      element.textContent?.includes(text)
    );
  },
  
  // Style utilities
  getComputedStyle: (element, property) => {
    const style = window.getComputedStyle(element);
    return style.getPropertyValue(property);
  }
};
