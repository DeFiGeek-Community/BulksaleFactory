
module.exports = {
  "moduleFileExtensions": [
    "js", "ts"
  ],
  "testMatch": [
    "**/test/**/*.test.ts"
  ],
  setupFilesAfterEnv: [
    "jest-allure/dist/setup",
    "./jest.setup.js"
  ],
  "preset": "ts-jest",
  "testEnvironment": "node",
  "transform": {
    "node_modules/variables/.+\\.(j|t)sx?$": "ts-jest"
  },
  "transformIgnorePatterns": [
    "node_modules/(?!variables/.*)"
  ]
}