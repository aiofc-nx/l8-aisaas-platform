import type { MongoAbility } from "@casl/ability";
import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import { Logger } from "@hl8/logger";
import { AuthAccount } from "../../domain/entities/auth-account.entity.js";
import { Permission } from "../../domain/entities/permission.entity.js";
import { Actions } from "../../domain/enums/actions.enum.js";
import { Subjects } from "../../domain/enums/subjects.enum.js";

export type AppAbility = MongoAbility<[Actions, Subjects]>;

/**
 * @description CASL 能力工厂，根据角色/权限映射生成能力对象
 */
export class CaslAbilityFactory {
  constructor(private readonly logger: Logger) {}

  public createForAccount(account: AuthAccount): AppAbility {
    const permissions = account
      .getRoles()
      .flatMap((role) => role.getPermissions());
    return this.createFromPermissions(permissions);
  }

  public createFromPermissions(permissions: Permission[]): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    permissions.forEach((permission) => {
      const subject =
        permission.subject === Subjects.All ? Subjects.All : permission.subject;
      can(permission.action, subject);
    });

    const ability = build({
      detectSubjectType: (item: unknown) => {
        if (item && typeof item === "object") {
          const record = item as {
            subject?: Subjects;
            __caslSubjectType__?: Subjects;
            constructor?: { name?: string };
          };
          return (
            record.subject ??
            record.__caslSubjectType__ ??
            (record.constructor?.name as Subjects | undefined) ??
            Subjects.All
          );
        }
        return Subjects.All;
      },
    });

    this.logger.log("CASL 能力已生成", {
      permissions: permissions.map(
        (permission) => `${permission.action}:${permission.subject}`,
      ),
    });

    return ability;
  }
}
