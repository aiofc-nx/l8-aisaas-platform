import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import request from "supertest";
import {
  CacheClientProvider,
  CacheMetricsHook,
  CacheReadService,
  TenantConfigKeyBuilder,
} from "@hl8/cache";
import { Logger } from "@hl8/logger";
import {
  TENANT_CONFIG_DATA_SOURCE,
  type TenantConfigurationDataSource,
  type TenantConfigurationRecord,
} from "../../../src/modules/tenant-config/tenant-config.types.js";
import { TenantConfigController } from "../../../src/modules/tenant-config/tenant-config.controller.js";
import { TenantConfigService } from "../../../src/modules/tenant-config/tenant-config.service.js";
import { ClsService } from "nestjs-cls";

class StubLogger implements Logger {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
  verbose = jest.fn();
  child = jest.fn().mockReturnThis();
  setContext?(): void {}
  overrideLogger?(): void {}
  logMessage?(): void {}
}

describe("TenantConfig 缓存集成", () => {
  let app: INestApplication;
  const redisStore = new Map<string, string>();
  const redisClient = {
    get: jest.fn(async (key: string) => redisStore.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      redisStore.set(key, value);
      return "OK";
    }),
  } as {
    get: jest.Mock<Promise<string | null>, [string]>;
    set: jest.Mock<Promise<string>, [string, string]>;
  };

  const cacheClientProviderStub = {
    getClient: jest.fn(() => redisClient as unknown as any),
  };

  const dataSource: TenantConfigurationDataSource & {
    fetchTenantConfiguration: jest.Mock;
  } = {
    fetchTenantConfiguration: jest.fn(async (tenantId: string) => {
      return {
        tenantId,
        displayName: `租户 ${tenantId}`,
        updatedAt: new Date().toISOString(),
        version: 1,
      } satisfies TenantConfigurationRecord;
    }),
  } as unknown as TenantConfigurationDataSource & {
    fetchTenantConfiguration: jest.Mock;
  };

  const metricsStub = {
    recordHit: jest.fn(),
    recordMiss: jest.fn(),
    recordOriginLatency: jest.fn(),
    recordLockWait: jest.fn(),
    recordFailure: jest.fn(),
  };

  const clsServiceStub = {
    set: jest.fn(),
    get: jest.fn(),
    run: jest.fn(),
  };

  beforeEach(() => {
    redisStore.clear();
    redisClient.get.mockClear();
    redisClient.set.mockClear();
    dataSource.fetchTenantConfiguration.mockClear();
    cacheClientProviderStub.getClient.mockClear();
    clsServiceStub.set.mockClear();
    clsServiceStub.get.mockClear();
    clsServiceStub.run.mockClear();
  });

  beforeAll(async () => {
    const createLoggerStub = () => {
      const stub = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
        child: jest.fn().mockReturnThis(),
      };
      return stub as unknown as ReturnType<typeof createLoggerStub> & {
        log: jest.Mock;
        error: jest.Mock;
        warn: jest.Mock;
        debug: jest.Mock;
        verbose: jest.Mock;
        child: jest.Mock;
      };
    };

    const loggerStub = createLoggerStub();

    const moduleRef = await Test.createTestingModule({
      controllers: [TenantConfigController],
      providers: [
        TenantConfigService,
        {
          provide: TenantConfigKeyBuilder,
          useFactory: () =>
            new TenantConfigKeyBuilder(loggerStub as unknown as Logger),
        },
        {
          provide: CacheMetricsHook,
          useValue: metricsStub as unknown as CacheMetricsHook,
        },
        {
          provide: CacheClientProvider,
          useValue: cacheClientProviderStub as unknown as CacheClientProvider,
        },
        {
          provide: CacheReadService,
          useFactory: () =>
            new CacheReadService(
              cacheClientProviderStub as unknown as CacheClientProvider,
              metricsStub as unknown as CacheMetricsHook,
              loggerStub as unknown as Logger,
            ),
        },
        {
          provide: ClsService,
          useValue: clsServiceStub as unknown as ClsService,
        },
        { provide: Logger, useValue: loggerStub as unknown as Logger },
        {
          provide: TENANT_CONFIG_DATA_SOURCE,
          useValue: dataSource,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("首次请求回源加载，后续命中缓存", async () => {
    await request(app.getHttpServer())
      .get("/internal/cache/tenant-config/tenant-001")
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ tenantId: "tenant-001" });
      });

    expect(dataSource.fetchTenantConfiguration).toHaveBeenCalledTimes(1);

    await request(app.getHttpServer())
      .get("/internal/cache/tenant-config/tenant-001")
      .expect(200);

    expect(dataSource.fetchTenantConfiguration).toHaveBeenCalledTimes(1);
    expect(redisClient.get).toHaveBeenCalledTimes(2);
    expect(redisClient.set).toHaveBeenCalledTimes(1);
  });
});
