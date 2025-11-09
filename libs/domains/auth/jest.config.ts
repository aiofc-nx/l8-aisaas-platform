import path from "node:path";

const packageDir = path.resolve(process.cwd());
const libsRoot = path.resolve(packageDir, "..", "..");

export default {
  displayName: "@hl8/auth",
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  rootDir: ".",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@hl8/user$": path.resolve(libsRoot, "domains/user/src/index.ts"),
    "^@hl8/logger$": path.resolve(libsRoot, "infra/logger/src/index.ts"),
    "^@hl8/exceptions$": path.resolve(
      libsRoot,
      "infra/exceptions/src/index.ts",
    ),
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
  coverageDirectory: "../../coverage/libs/config",
  testMatch: ["**/*.spec.ts"],
  setupFilesAfterEnv: ["<rootDir>/../../../jest.setup.js"],
};
