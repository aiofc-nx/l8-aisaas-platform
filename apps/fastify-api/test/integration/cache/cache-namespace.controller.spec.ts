import { describe, beforeAll, afterAll, it, expect, jest } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import request from "supertest";
import {
  CacheConfig,
  CacheEvictionPolicy,
  CacheNamespacePolicyConfig,
  CacheNamespaceRegistry,
  CacheNamespaceService,
  RedisClientConfig,
  DEFAULT_CACHE_KEY_SEPARATOR,
  TENANT_CONFIG_CACHE_DOMAIN,
  TENANT_CONFIG_CACHE_TTL_SECONDS,
} from "@hl8/cache";
import { Logger } from "@hl8/logger";
import { CacheNamespaceController } from "../../../src/modules/cache/cache-namespace.controller.js";

describe("CacheNamespaceController (integration)", () => {
  let app: INestApplication;

  const loggerStub = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } satisfies Record<string, jest.Mock>;

  const createCacheConfig = () => {
    const config = new CacheConfig();
    const clientConfig = new RedisClientConfig();
    clientConfig.clientKey = "default";
    clientConfig.namespace = TENANT_CONFIG_CACHE_DOMAIN;

    config.clients = [clientConfig];
    config.defaultClientKey = "default";
    const policy = new CacheNamespacePolicyConfig();
    policy.domain = TENANT_CONFIG_CACHE_DOMAIN;
    policy.keyPrefix = "tc";
    policy.keySuffix = null;
    policy.defaultTTL = TENANT_CONFIG_CACHE_TTL_SECONDS;
    policy.evictionPolicy = CacheEvictionPolicy.DoubleDelete;
    policy.hitThresholdAlert = 0.8;
    config.namespacePolicies = [policy];

    return config;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CacheNamespaceController],
      providers: [
        CacheNamespaceService,
        {
          provide: CacheNamespaceRegistry,
          useFactory: (config: CacheConfig, logger: Logger) =>
            new CacheNamespaceRegistry(config, logger),
          inject: [CacheConfig, Logger],
        },
        { provide: CacheConfig, useValue: createCacheConfig() },
        { provide: Logger, useValue: loggerStub as unknown as Logger },
      ],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return configured namespace policies", async () => {
    await request(app.getHttpServer())
      .get("/internal/cache/namespaces")
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data).toHaveLength(1);
        expect(body.data[0]).toMatchObject({
          domain: TENANT_CONFIG_CACHE_DOMAIN,
          keyPrefix: "tc",
          separator: DEFAULT_CACHE_KEY_SEPARATOR,
          defaultTTL: TENANT_CONFIG_CACHE_TTL_SECONDS,
          evictionPolicy: "double-delete",
        });
      });
  });
});
