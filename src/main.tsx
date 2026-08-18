// Environment fetch guard for sandboxed browser iframes
try {
  if (typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch.bind(window);
    let currentFetch = originalFetch;
    Object.defineProperty(window, 'fetch', {
      get: () => currentFetch,
      set: (newFetch) => {
        currentFetch = newFetch;
      },
      configurable: true,
      enumerable: true,
    });
  }
} catch (e) {
  // Silent fallback
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'katex/dist/katex.min.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
