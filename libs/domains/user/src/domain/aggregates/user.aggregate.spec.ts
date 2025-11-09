import { describe, expect, it } from "@jest/globals";
import { DisplayName } from "../value-objects/display-name.vo.js";
import { EmailAddress } from "../value-objects/email-address.vo.js";
import { MobilePhone } from "../value-objects/mobile-phone.vo.js";
import { TenantId } from "../value-objects/tenant-id.vo.js";
import { PlatformAdminId } from "../value-objects/platform-admin-id.vo.js";
import { UserRole } from "../enums/user-role.enum.js";
import { UserStatus } from "../enums/user-status.enum.js";
import { UserDomainException } from "../exceptions/user-domain.exception.js";
import { User } from "./user.aggregate.js";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const ADMIN_ID = "22222222-2222-4222-8222-222222222222";

describe("User Aggregate", () => {
  it("should create user with pending activation status and emit event", () => {
    const user = User.create({
      tenantId: TenantId.fromString(TENANT_ID),
      displayName: DisplayName.create("张晓明"),
      email: EmailAddress.create("zhangxm@example.com"),
      mobile: MobilePhone.fromNullable("13800138000"),
      roles: [UserRole.TenantAdmin],
      createdBy: PlatformAdminId.fromString(ADMIN_ID),
    });

    expect(user.status).toBe(UserStatus.PendingActivation);
    expect(user.roles).toEqual([UserRole.TenantAdmin]);
    const events = user.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].toJSON()).toMatchObject({
      tenantId: TENANT_ID,
      createdBy: ADMIN_ID,
    });
  });

  it("should enforce at least one role when assigning", () => {
    const user = User.create({
      tenantId: TenantId.fromString(TENANT_ID),
      displayName: DisplayName.create("李四"),
      email: EmailAddress.create("lisi@example.com"),
      roles: [UserRole.TenantAdmin],
      createdBy: PlatformAdminId.fromString(ADMIN_ID),
    });
    user.pullDomainEvents();

    expect(() => user.assignRoles([])).toThrow(UserDomainException);
  });

  it("should deduplicate assigned roles", () => {
    const user = User.create({
      tenantId: TenantId.fromString(TENANT_ID),
      displayName: DisplayName.create("王五"),
      email: EmailAddress.create("wangwu@example.com"),
      roles: [UserRole.TenantAdmin, UserRole.TenantAdmin],
      createdBy: PlatformAdminId.fromString(ADMIN_ID),
    });
    user.pullDomainEvents();
    user.assignRoles([UserRole.TenantAdmin, UserRole.TenantAdmin]);
    expect(user.roles).toEqual([UserRole.TenantAdmin]);
  });
});
