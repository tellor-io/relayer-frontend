import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress script errors from browser extensions and third-party scripts
// These errors are typically from browser extensions injecting code and don't affect app functionality
if (typeof window !== 'undefined') {
  const originalErrorHandler = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Suppress generic "Script error" messages (often from browser extensions/CORS)
    if (message === 'Script error.' || message === 'Script error') {
      return true; // Suppress the error
    }
    
    // Suppress window.ethereum errors (from browser extensions trying to access wallet)
    if (typeof message === 'string' && (
      message.includes('window.ethereum') || 
      message.includes('selectedAddress') ||
      message.includes('undefined is not an object')
    )) {
      return true; // Suppress the error
    }
    
    // Call original handler if it exists
    if (originalErrorHandler) {
      return originalErrorHandler.call(this, message, source, lineno, colno, error);
    }
    
    return false; // Don't suppress other errors
  };

  // Suppress unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const reasonStr = typeof reason === 'string' ? reason : (reason.message || String(reason));
      if (reasonStr.includes('Script error') || 
          reasonStr.includes('window.ethereum') ||
          reasonStr.includes('selectedAddress')) {
        event.preventDefault();
      }
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 