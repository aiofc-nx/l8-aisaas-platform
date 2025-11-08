import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageJsonUrl = new URL("../../package.json", import.meta.url);
const packageRootDir = fileURLToPath(new URL("../..", import.meta.url));
const requireModule = createRequire(packageJsonUrl);

let redlockExports: Record<string, unknown>;
try {
  redlockExports = requireModule("@anchan828/nest-redlock");
} catch {
  try {
    redlockExports = requireModule("../testing/redlock.mock.js");
  } catch {
    const candidates = [
      path.resolve(packageRootDir, "src/testing/redlock.mock.cjs"),
      path.resolve(process.cwd(), "src/testing/redlock.mock.cjs"),
      path.resolve(
        process.cwd(),
        "libs/infra/cache/src/testing/redlock.mock.cjs",
      ),
    ];
    const fallbackPath = candidates.find((candidate) => existsSync(candidate));
    if (!fallbackPath) {
      throw new Error("Unable to resolve cache redlock mock file.");
    }
    redlockExports = requireModule(fallbackPath);
  }
}

export const { RedlockModule, RedlockService } = redlockExports as {
  RedlockModule: typeof import("@anchan828/nest-redlock").RedlockModule;
  RedlockService: typeof import("@anchan828/nest-redlock").RedlockService;
};
