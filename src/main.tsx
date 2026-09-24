import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign browser ResizeObserver loop notification from bubbling as uncaught runtime errors
if (typeof window !== 'undefined') {
  const resizeObserverErrRegex = /ResizeObserver loop (completed with undelivered notifications|limit exceeded)/i;
  
  const isResizeObserverError = (e: unknown) => {
    if (!e) return false;
    if (typeof e === 'string') return resizeObserverErrRegex.test(e);
    if (typeof e === 'object') {
      const err = e as { message?: string; reason?: { message?: string } | string };
      if (err.message && resizeObserverErrRegex.test(err.message)) return true;
      if (err.reason) {
        const reasonMsg = typeof err.reason === 'string' ? err.reason : err.reason.message;
        if (reasonMsg && resizeObserverErrRegex.test(reasonMsg)) return true;
      }
    }
    return false;
  };

  window.addEventListener('error', (event) => {
    if (isResizeObserverError(event.message) || isResizeObserverError(event.error)) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (isResizeObserverError(event.reason)) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
  }, true);

  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (isResizeObserverError(message) || isResizeObserverError(error)) {
      return true;
    }
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };

  if (typeof window.ResizeObserver !== 'undefined') {
    const OriginalRO = window.ResizeObserver;
    window.ResizeObserver = class PatchedResizeObserver extends OriginalRO {
      constructor(callback: ResizeObserverCallback) {
        super((entries, observer) => {
          window.requestAnimationFrame(() => {
            try {
              callback(entries, observer);
            } catch (err) {
              if (!isResizeObserverError(err)) {
                console.error(err);
              }
            }
          });
        });
      }
    };
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
