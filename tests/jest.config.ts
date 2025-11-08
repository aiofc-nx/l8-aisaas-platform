import path from "node:path";
import type { Config } from "jest";

const config: Config = {
  displayName: "contract-tests",
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  rootDir: path.resolve(__dirname, "."),
  testMatch: ["<rootDir>/contract/**/*.spec.ts"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: path.resolve(__dirname, "tsconfig.contract.json"),
      },
    ],
  },
  moduleFileExtensions: ["ts", "js"],
  collectCoverage: false,
};

export default config;
