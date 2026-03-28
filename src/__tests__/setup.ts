import { vi } from 'vitest';
import { MockIntersectionObserver, MockResizeObserver } from './mocks/intersection-observer';
import './mocks/supabase'; // Import to set up Supabase mocks
import './mocks/framer-motion'; // Import to set up Framer Motion mocks

// Mock import.meta.env for Vite environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

// Set up global mocks for browser APIs
global.IntersectionObserver = MockIntersectionObserver;
global.ResizeObserver = MockResizeObserver;

// Mock console methods to avoid noise in tests
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
