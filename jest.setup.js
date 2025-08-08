import '@testing-library/jest-dom';

// Mock WebCrypto API for testing environment
const mockCrypto = {
  getRandomValues: jest.fn((arr) => {
    // Fill with deterministic values for testing
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
  subtle: {
    generateKey: jest.fn(),
    importKey: jest.fn(),
    exportKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    deriveKey: jest.fn(),
    deriveBits: jest.fn(),
    digest: jest.fn(),
  },
};

// Mock global crypto object
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Mock TextEncoder and TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
  writable: true,
});