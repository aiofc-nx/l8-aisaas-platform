import { describe, expect, it, beforeEach } from "@jest/globals";
import { Logger } from "@hl8/logger";
import { EmailAddress, TenantId, UserId } from "@hl8/user";
import { CaslAbilityFactory } from "./casl-ability.factory.js";
import { Actions } from "../../domain/enums/actions.enum.js";
import { Subjects } from "../../domain/enums/subjects.enum.js";
import { AuthAccount } from "../../domain/entities/auth-account.entity.js";
import { Role } from "../../domain/entities/role.entity.js";
import { Permission } from "../../domain/entities/permission.entity.js";

const USER_ID = UserId.fromString("99999999-9999-4999-8999-999999999999");
const TENANT_ID = TenantId.fromString("11111111-1111-4111-8111-111111111111");

describe("CaslAbilityFactory", () => {
  let factory: CaslAbilityFactory;

  const loggerStub = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as Logger;

  beforeEach(() => {
    jest.clearAllMocks();
    factory = new CaslAbilityFactory(loggerStub);
  });

  it("should grant manage permission on User subject", () => {
    const account = new AuthAccount(
      USER_ID,
      TENANT_ID,
      EmailAddress.create("ability@example.com"),
      "$2a$12$abcdefghijklmnopqrstuv",
      [
        new Role("role-admin", "platform-admin", [
          new Permission(
            "perm-manage-user",
            "管理用户",
            Actions.Manage,
            Subjects.User,
          ),
        ]),
      ],
    );

    const ability = factory.createForAccount(account);

    expect(ability.can(Actions.Manage, Subjects.User)).toBe(true);
    expect(ability.can(Actions.Manage, Subjects.Tenant)).toBe(false);
  });

  it("should treat ALL subject as universal access", () => {
    const account = new AuthAccount(
      USER_ID,
      TENANT_ID,
      EmailAddress.create("super@example.com"),
      "$2a$12$abcdefghijklmnopqrstuv",
      [
        new Role("role-super", "super-admin", [
          new Permission(
            "perm-manage-all",
            "全局管理",
            Actions.Manage,
            Subjects.All,
          ),
        ]),
      ],
    );

    const ability = factory.createForAccount(account);

    expect(ability.can(Actions.Manage, Subjects.User)).toBe(true);
    expect(ability.can(Actions.Manage, Subjects.Tenant)).toBe(true);
  });
});
