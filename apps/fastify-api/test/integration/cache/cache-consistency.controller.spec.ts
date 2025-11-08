import { beforeAll, afterAll, describe, expect, it, jest } from "@jest/globals";
import { INestApplication, HttpStatus } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import request from "supertest";
import {
  CacheClientProvider,
  CacheConsistencyService,
  CacheNotificationService,
  CacheNamespaceRegistry,
  CacheConfig,
  CacheNamespacePolicyConfig,
  CacheEvictionPolicy,
} from "@hl8/cache";
import { Logger } from "@hl8/logger";
import { HttpAdapterHost, ModuleRef } from "@nestjs/core";
import { CacheConsistencyController } from "../../../src/modules/cache/cache-consistency.controller.js";
import type Redlock from "redlock";
import { ResourceLockedError } from "redlock";
import { HttpExceptionFilter } from "@hl8/exceptions";
import { HttpStatus } from "@nestjs/common";

const createCacheConfig = () => {
  const config = new CacheConfig();
  const policy = new CacheNamespacePolicyConfig();
  policy.domain = "tenant-config";
  policy.keyPrefix = "tc";
  policy.keySuffix = null;
  policy.separator = ":";
  policy.defaultTTL = 300;
  policy.evictionPolicy = CacheEvictionPolicy.DoubleDelete;
  config.namespacePolicies = [policy];
  config.defaultClientKey = "default";
  return config;
};

describe("CacheConsistencyController (integration)", () => {
  let app: INestApplication;
  const cacheConfig = createCacheConfig();

  const loggerStub = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } satisfies Record<string, jest.Mock>;

  const notificationStub = {
    publishInvalidation: jest.fn(async () => undefined),
    publishLockContention: jest.fn(async () => undefined),
    publishPrefetchRequested: jest.fn(async () => ({
      refreshed: 2,
      failures: [],
    })),
  } satisfies Partial<CacheNotificationService>;

  const redlockUsing = jest.fn(
    async (
      _resources: string[],
      _duration: number,
      routine: (signal: {
        aborted: boolean;
        error?: Error;
      }) => Promise<unknown>,
    ) => routine({ aborted: false }),
  );
  const redlockMock = { using: redlockUsing } as unknown as Redlock;

  const moduleRefStub = {
    get: jest.fn().mockReturnValue(redlockMock),
  } satisfies Partial<ModuleRef>;

  beforeAll(async () => {
    const clientProvider = new CacheClientProvider(
      undefined,
      cacheConfig,
      loggerStub as unknown as Logger,
    );
    const registry = new CacheNamespaceRegistry(
      cacheConfig,
      loggerStub as unknown as Logger,
    );

    const testingModule = await Test.createTestingModule({
      controllers: [CacheConsistencyController],
      providers: [
        CacheConsistencyService,
        { provide: CacheNotificationService, useValue: notificationStub },
        { provide: CacheClientProvider, useValue: clientProvider },
        { provide: CacheNamespaceRegistry, useValue: registry },
        { provide: CacheConfig, useValue: cacheConfig },
        { provide: ModuleRef, useValue: moduleRefStub },
        { provide: Logger, useValue: loggerStub as unknown as Logger },
      ],
    }).compile();

    app = testingModule.createNestApplication(new FastifyAdapter());
    const httpAdapterHost = testingModule.get(HttpAdapterHost);
    app.useGlobalFilters(
      new HttpExceptionFilter(httpAdapterHost, loggerStub as unknown as Logger),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    redlockUsing.mockImplementation(async (_resources, _duration, routine) =>
      routine({ aborted: false }),
    );
    (moduleRefStub.get as jest.Mock).mockReturnValue(redlockMock);
  });

  it("should accept invalidation request and emit notification", async () => {
    await request(app.getHttpServer())
      .post("/internal/cache/invalidations")
      .send({
        domain: "tenant-config",
        tenantId: "tenant-1",
        keys: ["tenant-config:tenant-1:profile"],
        reason: "业务更新",
      })
      .expect(HttpStatus.ACCEPTED)
      .expect(({ body }) => {
        expect(typeof body.requestId).toBe("string");
        expect(body.requestId.length).toBeGreaterThan(0);
        expect(new Date(body.scheduledAt).toString()).not.toBe("Invalid Date");
      });

    expect(redlockUsing).toHaveBeenCalled();
    expect(notificationStub.publishInvalidation).toHaveBeenCalledWith({
      domain: "tenant-config",
      tenantId: "tenant-1",
      keys: ["tenant-config:tenant-1:profile"],
      reason: "业务更新",
    });
  });

  it("should return conflict when lock contention happens", async () => {
    redlockUsing.mockRejectedValueOnce(new ResourceLockedError("busy"));

    await request(app.getHttpServer())
      .post("/internal/cache/invalidations")
      .send({
        domain: "tenant-config",
        tenantId: "tenant-1",
        keys: ["tenant-config:tenant-1:profile"],
        reason: "业务更新",
      })
      .expect(HttpStatus.CONFLICT)
      .expect(({ body }) => {
        expect(body.detail ?? body.message).toContain("缓存锁正在使用中");
      });

    expect(notificationStub.publishLockContention).toHaveBeenCalledWith({
      domain: "tenant-config",
      tenantId: "tenant-1",
      keys: ["tenant-config:tenant-1:profile"],
      lockResource: "lock:cache:tenant-config:tenant-1",
    });
  });

  it("should handle prefetch requests", async () => {
    (
      notificationStub.publishPrefetchRequested as jest.Mock
    ).mockResolvedValueOnce({
      refreshed: 2,
      failures: [],
    });

    await request(app.getHttpServer())
      .post("/internal/cache/prefetch")
      .send({
        domain: "tenant-config",
        tenantId: "tenant-1",
        keys: [
          "tenant-config:tenant-1:profile",
          "tenant-config:tenant-1:feature",
        ],
        bypassLock: true,
      })
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body).toEqual({ refreshed: 2, failures: [] });
      });

    expect(notificationStub.publishPrefetchRequested).toHaveBeenCalledWith({
      domain: "tenant-config",
      tenantId: "tenant-1",
      keys: [
        "tenant-config:tenant-1:profile",
        "tenant-config:tenant-1:feature",
      ],
      bypassLock: true,
    });
  });
});
