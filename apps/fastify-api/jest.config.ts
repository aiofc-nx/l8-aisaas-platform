import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, "..", "..");
const libsRoot = path.resolve(workspaceRoot, "libs");

export default {
  collectCoverageFrom: [
    "src/**/*.(t|j)s",
    "!src/**/*.spec.ts",
    "!src/**/*.test.ts",
  ],
  coverageDirectory: "../coverage",
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testEnvironment: "node",
  testMatch: [
    "**/*.spec.ts",
    "../test/integration/**/*.spec.ts",
    "../test/e2e/**/*.spec.ts",
  ],
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "ESNext",
          moduleResolution: "NodeNext",
        },
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@hl8|ioredis|class-transformer|class-validator)/)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@hl8/config$": path.resolve(libsRoot, "infra/config/src/index.ts"),
    "^@hl8/logger$": path.resolve(libsRoot, "infra/logger/src/index.ts"),
  },
};
