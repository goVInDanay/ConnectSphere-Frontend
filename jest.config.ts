module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",

  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
};
