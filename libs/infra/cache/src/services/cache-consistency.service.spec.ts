import { describe, it, expect, beforeEach, jest } from "@jest/globals";
jest.mock("@anchan828/nest-redlock", () => ({
  __esModule: true,
  RedlockService: class {},
}));
import {
  GeneralBadRequestException,
  GeneralInternalServerException,
  MissingConfigurationForFeatureException,
} from "@hl8/exceptions";
import { Logger } from "@hl8/logger";
import { CacheClientProvider } from "./cache-client.provider.js";
import { CacheNamespaceRegistry } from "../config/cache-namespace.registry.js";
import { CacheConsistencyService } from "./cache-consistency.service.js";
import {
  CacheEvictionPolicy,
  CacheNamespacePolicyConfig,
} from "../config/cache-namespace-policy.config.js";
import type { RedlockService } from "@anchan828/nest-redlock";
import type { Redis } from "ioredis";

describe("CacheConsistencyService", () => {
  let service: CacheConsistencyService;
  const redisDel = jest.fn<Promise<number>, string[]>(async () => 1);
  const redisClient = { del: redisDel } as unknown as Redis;

  const cacheClientProvider = {
    getClient: jest.fn(() => redisClient),
  } as unknown as CacheClientProvider;

  const registry = {
    get: jest.fn(() => ({
      domain: "tenant-config",
      keyPrefix: "tc",
      keySuffix: null,
      separator: ":",
      defaultTTL: 300,
      evictionPolicy: CacheEvictionPolicy.DoubleDelete,
      hitThresholdAlert: null,
    })),
  } as unknown as CacheNamespaceRegistry;

  const redlockService = {
    using: jest.fn(async (_resources, _duration, routine) => {
      // @ts-expect-error Partial AbortSignal structure
      return routine({ aborted: false });
    }),
  } as unknown as RedlockService;

  const loggerStub = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as Logger;

  beforeEach(() => {
    jest.clearAllMocks();
    (cacheClientProvider.getClient as jest.Mock).mockReturnValue(redisClient);
    (registry.get as jest.Mock).mockImplementation(() => {
      const policy = new CacheNamespacePolicyConfig();
      policy.domain = "tenant-config";
      policy.keyPrefix = "tc";
      policy.keySuffix = null;
      policy.defaultTTL = 300;
      policy.evictionPolicy = CacheEvictionPolicy.DoubleDelete;
      return {
        domain: policy.domain,
        keyPrefix: policy.keyPrefix,
        keySuffix: policy.keySuffix,
        separator: ":",
        defaultTTL: policy.defaultTTL,
        evictionPolicy: policy.evictionPolicy,
        hitThresholdAlert: null,
      };
    });
    service = new CacheConsistencyService(
      cacheClientProvider,
      registry,
      redlockService,
      loggerStub,
    );
  });

  it("should execute double delete within lock", async () => {
    await service.invalidate({
      domain: "tenant-config",
      tenantId: "tenant-1",
      keys: ["tenant-config:tenant-1:profile"],
      reason: "写路径更新",
      delayMs: 0,
    });

    expect(redlockService.using).toHaveBeenCalled();
    expect(redisDel).toHaveBeenCalledTimes(2);
  });

  it("should validate required fields", async () => {
    await expect(
      service.invalidate({
        domain: "",
        tenantId: "tenant-1",
        keys: ["k1"],
        reason: "test",
      }),
    ).rejects.toBeInstanceOf(GeneralBadRequestException);

    await expect(
      service.invalidate({
        domain: "tenant-config",
        tenantId: "",
        keys: ["k1"],
        reason: "test",
      }),
    ).rejects.toBeInstanceOf(GeneralBadRequestException);

    await expect(
      service.invalidate({
        domain: "tenant-config",
        tenantId: "tenant-1",
        keys: [],
        reason: "test",
      }),
    ).rejects.toBeInstanceOf(GeneralBadRequestException);
  });

  it("should throw when policy missing", async () => {
    (registry.get as jest.Mock).mockReturnValue(undefined);

    await expect(
      service.invalidate({
        domain: "unknown",
        tenantId: "tenant-1",
        keys: ["k1"],
        reason: "test",
      }),
    ).rejects.toBeInstanceOf(MissingConfigurationForFeatureException);
  });

  it("should wrap unexpected errors", async () => {
    (redlockService.using as jest.Mock).mockRejectedValueOnce(
      new Error("lock failed"),
    );

    await expect(
      service.invalidate({
        domain: "tenant-config",
        tenantId: "tenant-1",
        keys: ["k1"],
        reason: "test",
      }),
    ).rejects.toBeInstanceOf(GeneralInternalServerException);
  });
});
