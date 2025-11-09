import {
  afterAll,
  beforeAll,
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
import {
  AUTH_SESSION_REPOSITORY_TOKEN,
  InMemoryAuthSessionRepository,
} from "@hl8/auth";
import { AuthModule } from "../../../src/modules/auth/auth.module.js";
import { setupClsModule } from "@hl8/async-storage";
import { getEntityManagerToken, getRepositoryToken } from "@mikro-orm/nestjs";
import { TenantContextExecutor } from "@hl8/multi-tenancy";
import { AuthSessionEntity } from "@hl8/persistence-postgres";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Admin@123";

describe("AuthController (integration)", () => {
  let app: INestApplication;
  let sessionRepository: InMemoryAuthSessionRepository;

  const loggerStub = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as Logger;

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

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [setupClsModule(), AuthModule],
    })
      .overrideProvider(AUTH_SESSION_REPOSITORY_TOKEN)
      .useValue(new InMemoryAuthSessionRepository())
      .overrideProvider(Logger)
      .useValue(loggerStub)
      .overrideProvider(getEntityManagerToken("postgres"))
      .useValue(createEntityManagerStub())
      .overrideProvider(getRepositoryToken(AuthSessionEntity, "postgres"))
      .useValue({})
      .overrideProvider(TenantContextExecutor)
      .useValue({
        getTenantIdOrFail: jest.fn(
          () => "11111111-1111-4111-8111-111111111111",
        ),
        runWithTenantContext: jest.fn(
          async (_tenantId, handler: () => Promise<unknown>) => handler(),
        ),
      })
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

    sessionRepository = app.get(AUTH_SESSION_REPOSITORY_TOKEN);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    sessionRepository.clear();
    jest.clearAllMocks();
  });

  const loginRequest = () =>
    request(app.getHttpServer())
      .post("/auth/login")
      .set("Content-Type", "application/json");

  const refreshRequest = () =>
    request(app.getHttpServer())
      .post("/auth/refresh")
      .set("Content-Type", "application/json");

  it("should login successfully", async () => {
    const response = await loginRequest().send({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject({
      tokenType: "Bearer",
    });
    expect(typeof response.body.accessToken).toBe("string");
    expect(typeof response.body.refreshToken).toBe("string");
    expect(response.body.expiresIn).toBeGreaterThan(3500);
    expect(response.body.refreshExpiresIn).toBeGreaterThan(600000);
  });

  it("should reject invalid credentials", async () => {
    const response = await loginRequest().send({
      email: ADMIN_EMAIL,
      password: "WrongPassword",
    });

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.detail ?? response.body.message).toContain(
      "登录凭证无效",
    );
  });

  it("should refresh token successfully", async () => {
    const loginResponse = await loginRequest().send({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    expect(loginResponse.status).toBe(HttpStatus.OK);

    const { refreshToken, accessToken } = loginResponse.body;

    const refreshResponse = await refreshRequest().send({
      refreshToken,
    });

    expect(refreshResponse.status).toBe(HttpStatus.OK);
    expect(refreshResponse.body.accessToken).not.toBe(accessToken);
    expect(refreshResponse.body.refreshToken).not.toBe(refreshToken);
    expect(refreshResponse.body.refreshExpiresIn).toBeGreaterThan(600000);
  });

  it("should reject invalid refresh token", async () => {
    const response = await refreshRequest().send({
      refreshToken: "invalid-token-value",
    });

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.detail ?? response.body.message).toContain(
      "刷新令牌无效或已过期",
    );
  });
});
