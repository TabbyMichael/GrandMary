import { vi } from 'vitest';

// Mock Framer Motion
export const motion = {
  div: 'div',
  section: 'section',
  main: 'main',
  article: 'article',
  header: 'header',
  footer: 'footer',
  nav: 'nav',
  aside: 'aside',
  button: 'button',
  span: 'span',
  p: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  ul: 'ul',
  ol: 'ol',
  li: 'li',
  a: 'a',
  img: 'img',
  form: 'form',
  input: 'input',
  label: 'label',
  textarea: 'textarea',
  select: 'select',
  option: 'option',
};

// Mock useInView hook
export const useInView = vi.fn(() => true);

// Mock other Framer Motion hooks
export const useAnimation = vi.fn(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  set: vi.fn(),
}));

export const useScroll = vi.fn(() => ({
  scrollY: { get: () => 0 },
  scrollYProgress: { get: () => 0 },
}));

export const useTransform = vi.fn((value, transformer) => transformer(value));

export const useSpring = vi.fn(() => ({
  set: vi.fn(),
  stop: vi.fn(),
}));

export const AnimatePresence = ({ children }: { children: React.ReactNode }) => children;

// Mock the entire framer-motion module
vi.mock('framer-motion', () => ({
  motion,
  useInView,
  useAnimation,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
}));
