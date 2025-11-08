import { describe, expect, it, beforeEach } from "@jest/globals";
import type { Logger } from "@hl8/logger";
import { InMemoryUserRepository } from "../../infrastructure/repositories/in-memory-user.repository.js";
import { CreateTenantUserService } from "./create-tenant-user.service.js";
import { EmailAlreadyExistsException } from "../../domain/exceptions/email-already-exists.exception.js";
import { UserRole } from "../../domain/enums/user-role.enum.js";
import { UserDomainException } from "../../domain/exceptions/user-domain.exception.js";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const ADMIN_ID = "22222222-2222-4222-8222-222222222222";

describe("CreateTenantUserService", () => {
  let repository: InMemoryUserRepository;
  let logger: Logger;
  let service: CreateTenantUserService;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    logger = {
      log: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    } as unknown as Logger;
    service = new CreateTenantUserService(repository, logger);
  });

  it("should create user and return domain events", async () => {
    const result = await service.execute({
      tenantId: TENANT_ID,
      createdBy: ADMIN_ID,
      displayName: "张晓明",
      email: "zhangxm@example.com",
      mobile: "13800138000",
      roles: [UserRole.TenantAdmin],
    });

    expect(result.user.email.value).toBe("zhangxm@example.com");
    expect(result.events).toHaveLength(1);
    const stored = await repository.findByEmail(result.user.email);
    expect(stored).not.toBeNull();
  });

  it("should throw when email already exists", async () => {
    await service.execute({
      tenantId: TENANT_ID,
      createdBy: ADMIN_ID,
      displayName: "首个用户",
      email: "dup@example.com",
    });

    await expect(
      service.execute({
        tenantId: TENANT_ID,
        createdBy: ADMIN_ID,
        displayName: "重复用户",
        email: "dup@example.com",
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyExistsException);
  });

  it("should reject unsupported roles", async () => {
    await expect(
      service.execute({
        tenantId: TENANT_ID,
        createdBy: ADMIN_ID,
        displayName: "角色非法",
        email: "role@example.com",
        roles: ["unknown-role"],
      }),
    ).rejects.toBeInstanceOf(UserDomainException);
  });
  it("should reject invalid mobile numbers", async () => {
    await expect(
      service.execute({
        tenantId: TENANT_ID,
        createdBy: ADMIN_ID,
        displayName: "手机号非法",
        email: "mobile@example.com",
        mobile: "12345",
      }),
    ).rejects.toBeInstanceOf(UserDomainException);
  });
});
