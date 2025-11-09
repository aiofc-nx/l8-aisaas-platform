import path from "node:path";
import { createRequire } from "node:module";

const nodeRequire = createRequire(path.resolve(process.cwd(), "package.json"));
const workspaceRoot = path.resolve(process.cwd());
const libsRoot = path.resolve(workspaceRoot, "libs");
const redlockEsmEntry = nodeRequire.resolve("@anchan828/nest-redlock");
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
    "^@hl8/multi-tenancy$": path.resolve(
      libsRoot,
      "infra/multi-tenancy/src/index.ts",
    ),
    "^@hl8/persistence-mongo$": path.resolve(
      libsRoot,
      "infra/persistence/mongo/src/index.ts",
    ),
    "^@hl8/persistence-postgres$": path.resolve(
      libsRoot,
      "infra/persistence/postgres/src/index.ts",
    ),
    "^@hl8/user$": path.resolve(libsRoot, "domains/user/src/index.ts"),
    "^@hl8/auth$": path.resolve(libsRoot, "domains/auth/src/index.ts"),
    "^@anchan828/nest-redlock/dist/esm/(.*)$": redlockEsmMapper,
  },
};
