import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { diagnostics: false }],
  },
  verbose: true,
};

export default config;
