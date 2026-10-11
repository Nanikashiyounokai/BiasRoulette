/**
 * 抽選・角度計算などのドメインロジックは React Native に依存しない純粋な TypeScript なので、
 * jest-expo ではなく ts-jest で直接テストする。
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  // Homebrew の watchman が壊れていると jest 起動時に落ちる（TripReady と同じ対処）
  watchman: false,
};
