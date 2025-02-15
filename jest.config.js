export default {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true,
  collectCoverageFrom: ['src/**/*.(t|j)s', '!src/main.ts'],
  testTimeout: 25000
}
