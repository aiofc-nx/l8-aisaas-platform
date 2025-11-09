export default {
  displayName: "@hl8/application-kernel",
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  rootDir: ".",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "js"],
  coverageDirectory: "../../coverage/libs/application-kernel",
  testMatch: ["**/*.spec.ts"],
  setupFilesAfterEnv: ["<rootDir>/../../../jest.setup.js"],
};
