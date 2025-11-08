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
import { USER_REPOSITORY_TOKEN } from "../../../src/modules/user/providers/create-user.providers.js";
import { InMemoryUserRepository } from "@hl8/user";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const PLATFORM_ADMIN_ID = "33333333-3333-4333-8333-333333333333";

describe("UserController (integration)", () => {
  let app: INestApplication;
  let repository: InMemoryUserRepository;
  let adminAccessToken: string;

  const loggerStub = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [setupClsModule(), AuthModule, UserModule],
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
