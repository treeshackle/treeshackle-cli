module.exports = {
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!**/__tests__/**"],
  globals: {
    __DEV__: process.env.NODE_ENV !== "production"
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts?(x)"],
  transform: {
    "^.+\\.(ts|tsx)$": "babel-jest"
  }
};
