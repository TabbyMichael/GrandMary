module.exports = {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.js'],
  globals: {},
  preset: null,
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.(js|jsx|ts|tsx)',
    '!src/**/*.d.ts',
    '!src/server.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  passWithNoTests: true,
  transform: {},
  transformIgnorePatterns: [
    'node_modules/(?!(supabase|@supabase)/)'
  ],
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
