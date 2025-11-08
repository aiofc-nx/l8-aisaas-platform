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
import { AuthController } from "../../../src/modules/auth/controllers/auth.controller.js";
import { authProviders } from "../../../src/modules/auth/providers/auth.providers.js";
import {
  AUTH_SESSION_REPOSITORY_TOKEN,
  InMemoryAuthSessionRepository,
} from "@hl8/auth";

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

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [...authProviders, { provide: Logger, useValue: loggerStub }],
    }).compile();

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
