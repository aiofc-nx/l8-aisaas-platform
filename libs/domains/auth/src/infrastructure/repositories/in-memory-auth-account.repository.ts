import { EmailAddress, TenantId, UserId } from "@hl8/user";
import { AuthAccount } from "../../domain/entities/auth-account.entity.js";
import { AuthAccountRepository } from "../../interfaces/auth-account.repository.js";
import { Role } from "../../domain/entities/role.entity.js";
import { Permission } from "../../domain/entities/permission.entity.js";
import { Actions } from "../../domain/enums/actions.enum.js";
import { Subjects } from "../../domain/enums/subjects.enum.js";

/**
 * @description 内存认证账户仓储，提供示例平台管理员数据
 */
export class InMemoryAuthAccountRepository implements AuthAccountRepository {
  private readonly itemsByEmail = new Map<string, AuthAccount>();

  private readonly itemsByUserId = new Map<string, AuthAccount>();

  constructor(
    seed?: Array<{
      userId: string;
      tenantId: string;
      email: string;
      passwordHash: string;
      roles: Array<{
        roleId: string;
        name: string;
        permissions: Array<{
          permissionId: string;
          name: string;
          action: string;
          subject: string;
        }>;
      }>;
    }>,
  ) {
    if (seed) {
      seed.forEach((item) => this.insert(item));
    }
  }

  public async findByEmail(email: EmailAddress): Promise<AuthAccount | null> {
    return this.itemsByEmail.get(email.value) ?? null;
  }

  public async findByUserId(userId: UserId): Promise<AuthAccount | null> {
    return this.itemsByUserId.get(userId.value) ?? null;
  }

  public addAccount(seed: {
    userId: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    roles: Array<{
      roleId: string;
      name: string;
      permissions: Array<{
        permissionId: string;
        name: string;
        action: string;
        subject: string;
      }>;
    }>;
  }): void {
    this.insert(seed);
  }

  private insert(seed: {
    userId: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    roles: Array<{
      roleId: string;
      name: string;
      permissions: Array<{
        permissionId: string;
        name: string;
        action: string;
        subject: string;
      }>;
    }>;
  }): void {
    const roles = seed.roles.map(
      (role) =>
        new Role(
          role.roleId,
          role.name,
          role.permissions.map(
            (permission) =>
              new Permission(
                permission.permissionId,
                permission.name,
                permission.action as Actions,
                permission.subject as Subjects,
              ),
          ),
        ),
    );

    const account = new AuthAccount(
      UserId.fromString(seed.userId),
      TenantId.fromString(seed.tenantId),
      EmailAddress.create(seed.email),
      seed.passwordHash,
      roles,
    );

    this.itemsByEmail.set(account.email.value, account);
    this.itemsByUserId.set(account.userId.value, account);
  }
}
