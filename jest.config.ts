/** @type {import("ts-jest").JestConfigWithTsJest} **/
export default {
  preset: "ts-jest",
  collectCoverage: false,
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts"
  ],
  coverageReporters: ["lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -20,
    }
  },
  roots: [
    "<rootDir>/src/"
  ],
  // setupFiles: [
  //   "<rootDir>/setupJest.js"
  // ],
  testEnvironment: "jsdom",
  transform: {
    "^.+.ts?$": ["ts-jest",{}],
    // "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/default-mock.js",
    // "\\.(css|scss)$": "<rootDir>/__mocks__/default-mock.js"
  },
  // transformIgnorePatterns: [
  //   "/node_modules/(?!lodash-es)"
  // ],
};