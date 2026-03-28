import { vi } from 'vitest';

// Create a complete Framer Motion mock that handles all hooks and components
const createFramerMotionMock = () => {
  // Mock motion components as regular HTML elements
  const motionComponents = {
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

  // Mock useInView to always return true (element is in view)
  const useInView = vi.fn(() => true);

  // Mock useAnimation
  const useAnimation = vi.fn(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    set: vi.fn(),
  }));

  // Mock useScroll
  const useScroll = vi.fn(() => ({
    scrollY: { get: () => 0 },
    scrollYProgress: { get: () => 0 },
  }));

  // Mock useTransform
  const useTransform = vi.fn((value, transformer) => {
    if (typeof transformer === 'function') {
      return transformer(value);
    }
    return value;
  });

  // Mock useSpring
  const useSpring = vi.fn(() => ({
    set: vi.fn(),
    stop: vi.fn(),
    get: () => ({}),
  }));

  // Mock AnimatePresence
  const AnimatePresence = ({ children }: { children: React.ReactNode }) => children;

  // Mock motion value
  const motionValue = vi.fn((initial) => ({
    get: () => initial,
    set: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  }));

  return {
    motion: motionComponents,
    useInView,
    useAnimation,
    useScroll,
    useTransform,
    useSpring,
    AnimatePresence,
    motionValue,
  };
};

const framerMotionMock = createFramerMotionMock();

// Mock the entire framer-motion module
vi.mock('framer-motion', () => framerMotionMock);

// Export for potential use in tests
export const {
  motion,
  useInView,
  useAnimation,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
  motionValue,
} = framerMotionMock;
