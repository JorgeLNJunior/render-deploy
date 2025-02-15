/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  preset: 'ts-jest',
  resolver: 'ts-jest-resolver',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: true
      }
    ]
  },
  verbose: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  testTimeout: 25000,
  testEnvironment: 'node'
}
