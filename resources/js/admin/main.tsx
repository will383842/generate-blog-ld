/**
 * Main Entry Point
 * File 397 - Application bootstrap
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Styles
import '../../css/app.css';

// i18n initialization
import './i18n';

// ============================================================================
// Environment Check
// ============================================================================

if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Content Engine Admin - Development Mode');
  console.log('📦 React version:', React.version);

  // Accessibility testing with axe-core (development only)
  import('@axe-core/react').then(({ default: axe }) => {
    axe(React, ReactDOM, 1000);
    console.log('♿ Axe accessibility testing enabled');
  });
}


// ============================================================================
// Root Element
// ============================================================================

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Failed to find the root element. Make sure there is a <div id="root"></div> in your HTML.'
  );
}

// ============================================================================
// React 18 Root
// ============================================================================

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ============================================================================
// Hot Module Replacement (Development)
// ============================================================================

if (import.meta.hot) {
  import.meta.hot.accept();
}

// ============================================================================
// Service Worker Registration (Production)
// ============================================================================

if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

// ============================================================================
// Global Error Handling
// ============================================================================

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Could send to error monitoring service
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Could send to error monitoring service
});
