// Global test teardown - runs once after all tests
module.exports = async () => {
  // Clean up global test environment
  delete global.__TEST__;
  
  // Clean up global test utilities
  delete global.testUtils;
  
  // Clean up mocks
  if (typeof window !== 'undefined') {
    // Clean up window mocks
    delete window.matchMedia;
    delete window.ResizeObserver;
    delete window.IntersectionObserver;
    delete window.fetch;
    delete window.localStorage;
    delete window.sessionStorage;
  }
  
  // Clean up global mocks
  delete global.ResizeObserver;
  delete global.IntersectionObserver;
  delete global.fetch;
  
  // Reset environment variables
  delete process.env.REACT_APP_TEST_MODE;
  
  // Clean up any remaining timers
  jest.clearAllTimers();
  
  // Clean up any remaining mocks
  jest.clearAllMocks();
  
  // Reset modules
  jest.resetModules();
  
  console.log('🧹 Global test teardown completed');
};
