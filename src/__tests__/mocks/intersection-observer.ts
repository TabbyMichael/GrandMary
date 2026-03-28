// Mock IntersectionObserver for Framer Motion compatibility
class MockIntersectionObserver implements IntersectionObserver {
  callback: IntersectionObserverCallback;
  observations: Map<Element, IntersectionObserverEntry> = new Map();
  root: Element | Document | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    if (options) {
      this.root = options.root || null;
      this.rootMargin = options.rootMargin || '0px';
      this.thresholds = Array.isArray(options.threshold) 
        ? options.threshold 
        : [options.threshold || 0];
    }
  }

  observe(target: Element) {
    // Simulate immediate intersection
    const entry = {
      target,
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRect: target.getBoundingClientRect(),
      rootBounds: this.root ? (this.root as Element).getBoundingClientRect() : null,
      time: Date.now(),
    } as IntersectionObserverEntry;

    this.observations.set(target, entry);
    
    // Call callback asynchronously to simulate real behavior
    setTimeout(() => this.callback([entry], this), 0);
  }

  unobserve(target: Element) {
    this.observations.delete(target);
  }

  disconnect() {
    this.observations.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return Array.from(this.observations.values());
  }
}

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  callback: ResizeObserverCallback;
  observations: Map<Element, ResizeObserverEntry> = new Map();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element, options?: ResizeObserverOptions) {
    const rect = target.getBoundingClientRect();
    const entry = {
      target,
      contentRect: rect,
      borderBoxSize: [{ blockSize: rect.height, inlineSize: rect.width }],
      contentBoxSize: [{ blockSize: rect.height, inlineSize: rect.width }],
      devicePixelContentBoxSize: [{ blockSize: rect.height, inlineSize: rect.width }],
    } as ResizeObserverEntry;

    this.observations.set(target, entry);
    
    setTimeout(() => this.callback([entry], this), 0);
  }

  unobserve(target: Element) {
    this.observations.delete(target);
  }

  disconnect() {
    this.observations.clear();
  }
}

// Export for use in setup
export { MockIntersectionObserver, MockResizeObserver };
