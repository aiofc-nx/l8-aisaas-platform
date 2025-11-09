import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { INestApplication, HttpStatus, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { HttpAdapterHost } from "@nestjs/core";
import request from "supertest";
import { Logger } from "@hl8/logger";
import { HttpExceptionFilter } from "@hl8/exceptions";
import { AuthModule } from "../../../src/modules/auth/auth.module.js";
import { UserModule } from "../../../src/modules/user/user.module.js";
import { setupClsModule } from "@hl8/async-storage";
import { TenantContextModule, TenantContextExecutor } from "@hl8/multi-tenancy";
import {
  USER_PROJECTION_REPOSITORY_TOKEN,
  USER_REPOSITORY_TOKEN,
} from "../../../src/modules/user/providers/create-user.providers.js";
import { InMemoryUserRepository } from "@hl8/user";
import { MongoDomainEventStore } from "@hl8/persistence-mongo";
import {
  AuthSessionEntity,
  UserEntity,
  UserProjectionEntity,
  UserProjectionRepository,
} from "@hl8/persistence-postgres";
import {
  AUTH_SESSION_REPOSITORY_TOKEN,
  InMemoryAuthSessionRepository,
} from "@hl8/auth";
import { getEntityManagerToken, getRepositoryToken } from "@mikro-orm/nestjs";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const PLATFORM_ADMIN_ID = "33333333-3333-4333-8333-333333333333";

const createEntityManagerStub = () => ({
  persist: jest.fn(),
  persistAndFlush: jest.fn(),
  flush: jest.fn(),
  assign: jest.fn(),
  remove: jest.fn(),
  nativeInsert: jest.fn(),
  nativeUpdate: jest.fn(),
  nativeDelete: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const createRepositoryStub = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  assign: jest.fn(),
  persistAndFlush: jest.fn(),
  nativeInsert: jest.fn(),
  nativeUpdate: jest.fn(),
  nativeDelete: jest.fn(),
});

describe("UserController (integration)", () => {
  let app: INestApplication;
  const inMemoryRepo = new InMemoryUserRepository();
  const projectionStub = {
    upsert: jest.fn(),
  };
  const eventStoreStub = {
    append: jest.fn(),
    load: jest.fn(),
    clear: jest.fn(),
  };

  let repository: InMemoryUserRepository;
  let adminAccessToken: string;

  const loggerStub = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [
        setupClsModule(),
        AuthModule,
        TenantContextModule.register(),
        UserModule,
      ],
    })
      .overrideProvider(AUTH_SESSION_REPOSITORY_TOKEN)
      .useValue(new InMemoryAuthSessionRepository())
      .overrideProvider(USER_REPOSITORY_TOKEN)
      .useValue(inMemoryRepo)
      .overrideProvider(USER_PROJECTION_REPOSITORY_TOKEN)
      .useValue(projectionStub)
      .overrideProvider(MongoDomainEventStore)
      .useValue(eventStoreStub)
      .overrideProvider(getEntityManagerToken("postgres"))
      .useValue(createEntityManagerStub())
      .overrideProvider(getEntityManagerToken("mongo"))
      .useValue(createEntityManagerStub())
      .overrideProvider(getRepositoryToken(AuthSessionEntity, "postgres"))
      .useValue({})
      .overrideProvider(getRepositoryToken(UserEntity, "postgres"))
      .useValue(createRepositoryStub())
      .overrideProvider(getRepositoryToken(UserProjectionEntity, "postgres"))
      .useValue(createRepositoryStub())
      .overrideProvider(UserProjectionRepository)
      .useValue(projectionStub)
      .overrideProvider(TenantContextExecutor)
      .useValue({
        getTenantIdOrFail: jest.fn(() => TENANT_ID),
        runWithTenantContext: jest.fn(
          async (_tenantId, handler: () => Promise<unknown>) => handler(),
        ),
      })
      .overrideProvider(Logger)
      .useValue(loggerStub)
      .compile();

    app = testingModule.createNestApplication(new FastifyAdapter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    const httpAdapterHost = testingModule.get(HttpAdapterHost);
    app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost, loggerStub));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    repository = app.get(USER_REPOSITORY_TOKEN);

    adminAccessToken = await login("admin@example.com", "Admin@123");
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    repository.clear();
    projectionStub.upsert.mockClear();
    eventStoreStub.append.mockClear();
    jest.clearAllMocks();
  });

  const login = async (email: string, password: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password });

    expect(response.status).toBe(HttpStatus.OK);
    return response.body.accessToken as string;
  };

  const createRequest = (token: string | null = adminAccessToken) => {
    const req = request(app.getHttpServer()).post(
      `/internal/tenants/${TENANT_ID}/users`,
    );
    if (token) {
      req.set("Authorization", `Bearer ${token}`);
    }
    req.set("x-tenant-id", TENANT_ID);
    return req;
  };

  it("should create tenant user successfully", async () => {
    const response = await createRequest().send({
      displayName: "张晓明",
      email: "zhangxm@example.com",
      mobile: "13800138000",
    });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject({
      tenantId: TENANT_ID,
      status: "待激活",
    });
    expect(typeof response.body.userId).toBe("string");
    expect(
      typeof response.body.requestId === "string" ||
        response.body.requestId === undefined,
    ).toBe(true);
  });

  it("should reject duplicated email with conflict", async () => {
    await createRequest().send({
      displayName: "首个用户",
      email: "dup@example.com",
    });

    const response = await createRequest().send({
      displayName: "重复用户",
      email: "dup@example.com",
    });

    expect(response.status).toBe(HttpStatus.CONFLICT);
    expect(response.body.detail ?? response.body.message).toContain(
      "邮箱 dup@example.com 已被占用",
    );
  });

  it("should reject invalid mobile number", async () => {
    const response = await createRequest().send({
      displayName: "手机号错误",
      email: "invalid-mobile@example.com",
      mobile: "12345",
    });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.detail ?? response.body.message).toContain(
      "手机号格式不正确",
    );
  });

  it("should reject when auth context missing", async () => {
    const response = await createRequest(null).send({
      displayName: "缺少上下文",
      email: "missing-context@example.com",
    });

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.detail ?? response.body.message).toContain(
      "访问令牌无效或已过期",
    );
  });
});
