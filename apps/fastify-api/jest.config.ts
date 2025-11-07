import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const workspaceRoot = path.resolve(process.cwd(), "..", "..");
const libsRoot = path.resolve(workspaceRoot, "libs");
const redlockEsmEntry = require.resolve("@anchan828/nest-redlock");
const redlockEsmRoot = path.dirname(redlockEsmEntry);
const redlockEsmMapper = path.join(redlockEsmRoot, "$1").replace(/\\/g, "/");

export default {
  collectCoverageFrom: [
    "src/**/*.(t|j)s",
    "!src/**/*.spec.ts",
    "!src/**/*.test.ts",
  ],
  coverageDirectory: "../coverage",
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  roots: ["<rootDir>", "<rootDir>/../test"],
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
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)$": "<rootDir>/$1",
    "^@hl8/config$": path.resolve(libsRoot, "infra/config/src/index.ts"),
    "^@hl8/logger$": path.resolve(libsRoot, "infra/logger/src/index.ts"),
    "^@hl8/cache$": path.resolve(libsRoot, "infra/cache/src/index.ts"),
    "^@hl8/exceptions$": path.resolve(
      libsRoot,
      "infra/exceptions/src/index.ts",
    ),
    "^@hl8/bootstrap$": path.resolve(libsRoot, "infra/bootstrap/src/index.ts"),
    "^@hl8/async-storage$": path.resolve(
      libsRoot,
      "infra/async-storage/src/index.ts",
    ),
    "^@anchan828/nest-redlock/dist/esm/(.*)$": redlockEsmMapper,
  },
};
