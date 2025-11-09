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
import { AuthModule } from "../../../src/modules/auth/auth.module.js";
import { UserModule } from "../../../src/modules/user/user.module.js";
import { setupClsModule } from "@hl8/async-storage";
import { Actions, Subjects } from "@hl8/auth";
import {
  AUTH_ACCOUNT_REPOSITORY_TOKEN,
  InMemoryAuthAccountRepository,
} from "@hl8/auth";
import { hashSync } from "bcryptjs";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const ALLOWED_ADMIN_ID = "33333333-3333-4333-8333-333333333333";
const LIMITED_ADMIN_ID = "44444444-4444-4444-8444-444444444444";

describe("Authorization policies (integration)", () => {
  let app: INestApplication;
  let accountRepository: InMemoryAuthAccountRepository;
  let allowedAccessToken: string;
  let limitedAccessToken: string;

  const loggerStub = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
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

    accountRepository = app.get(AUTH_ACCOUNT_REPOSITORY_TOKEN);
    accountRepository.addAccount({
      userId: LIMITED_ADMIN_ID,
      tenantId: TENANT_ID,
      email: "limited@example.com",
      passwordHash: hashSync("Limited@123", 12),
      roles: [
        {
          roleId: "role-viewer",
          name: "tenant-viewer",
          permissions: [
            {
              permissionId: "perm-view-tenant",
              name: "查看租户",
              action: Actions.ReadAny,
              subject: Subjects.Tenant,
            },
          ],
        },
      ],
    });

    allowedAccessToken = await login("admin@example.com", "Admin@123");
    limitedAccessToken = await login("limited@example.com", "Limited@123");
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const login = async (email: string, password: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password });

    expect(response.status).toBe(HttpStatus.OK);
    return response.body.accessToken as string;
  };

  const createUserRequest = (token?: string) => {
    const req = request(app.getHttpServer())
      .post(`/internal/tenants/${TENANT_ID}/users`)
      .set("Content-Type", "application/json");
    if (token) {
      req.set("Authorization", `Bearer ${token}`);
    }
    return req;
  };

  it("should return 401 when auth context is missing", async () => {
    const response = await createUserRequest().send({
      displayName: "张晓明",
      email: "missing@example.com",
    });

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.detail ?? response.body.message).toContain(
      "访问令牌无效或已过期",
    );
  });

  it("should return 403 when account lacks required permission", async () => {
    const response = await createUserRequest(limitedAccessToken).send({
      displayName: "权限不足",
      email: "forbidden@example.com",
    });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
    expect(response.body.detail ?? response.body.message).toContain(
      "无权访问当前资源",
    );
  });

  it("should allow creation when permission satisfied", async () => {
    const response = await createUserRequest(allowedAccessToken).send({
      displayName: "被授权用户",
      email: "authorized@example.com",
    });

    expect(response.status).toBe(HttpStatus.CREATED);
  });
});
