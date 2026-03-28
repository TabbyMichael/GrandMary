import { vi } from 'vitest';

// Mock IntersectionObserver before any imports - this is critical
global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => {
  const instance = {
    observe: vi.fn((element) => {
      // Simulate immediate intersection
      setTimeout(() => {
        if (element && typeof element.getBoundingClientRect === 'function') {
          const rect = element.getBoundingClientRect();
          callback([{
            target: element,
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: rect,
            intersectionRect: rect,
            rootBounds: null,
            time: Date.now(),
          }], instance);
        }
      }, 0);
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
    root: options?.root || null,
    rootMargin: options?.rootMargin || '0px',
    thresholds: options?.threshold || [0],
  };
  return instance;
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn((element) => {
    setTimeout(() => {
      if (element && typeof element.getBoundingClientRect === 'function') {
        const rect = element.getBoundingClientRect();
        callback([{
          target: element,
          contentRect: rect,
          borderBoxSize: [{ blockSize: rect.height || 100, inlineSize: rect.width || 100 }],
          contentBoxSize: [{ blockSize: rect.height || 100, inlineSize: rect.width || 100 }],
          devicePixelContentBoxSize: [{ blockSize: rect.height || 100, inlineSize: rect.width || 100 }],
        }], this);
      }
    }, 0);
  }),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: vi.fn(() => ({
    getPropertyValue: vi.fn(() => ''),
    display: 'block',
    visibility: 'visible',
    opacity: '1',
  })),
});

// Mock HTMLElement methods
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  value: vi.fn(() => ({
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: vi.fn(),
  })),
});

// Mock window.scrollY and other scroll properties
Object.defineProperty(window, 'scrollY', {
  value: 0,
  writable: true,
});

Object.defineProperty(window, 'scrollX', {
  value: 0,
  writable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  const id = Math.random();
  setTimeout(cb, 16);
  return id;
});
global.cancelAnimationFrame = vi.fn();

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

// Mock console methods
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Import all mocks after global setup
import './mocks/framer-motion-complete';
import './mocks/supabase-working';
