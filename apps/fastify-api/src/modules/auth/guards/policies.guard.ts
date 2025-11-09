import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { Logger } from "@hl8/logger";
import {
  AppAbility,
  AUTH_ACCOUNT_REPOSITORY_TOKEN,
  CaslAbilityFactory,
  Permission,
  Actions,
  Subjects,
} from "@hl8/auth";
import type { AuthAccountRepository } from "@hl8/auth";
import { UserId } from "@hl8/user";
import { ClsService } from "nestjs-cls";
import { POLICIES_KEY } from "../decorators/check-policies.decorator.js";
import type { PolicyHandlerDescriptor } from "../policies/policy-handler.type.js";
import type { JwtRequestUser } from "../types/jwt-request-user.type.js";

type AuthorizedFastifyRequest = FastifyRequest & {
  ability?: AppAbility;
  user?: JwtRequestUser;
};

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: CaslAbilityFactory,
    @Inject(AUTH_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: AuthAccountRepository,
    private readonly clsService: ClsService,
    private readonly logger: Logger,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const handlers =
      this.reflector.getAllAndOverride<PolicyHandlerDescriptor[]>(
        POLICIES_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (handlers.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthorizedFastifyRequest>();

    const ability = await this.resolveAbility(request);

    const results = await Promise.all(
      handlers.map((handler) => this.executePolicyHandler(handler, ability)),
    );

    if (results.every(Boolean)) {
      return true;
    }

    throw new ForbiddenException("无权访问当前资源");
  }

  private async resolveAbility(
    request: AuthorizedFastifyRequest,
  ): Promise<AppAbility> {
    if (request.ability) {
      return request.ability;
    }

    const context = this.extractUserContext(request);
    if (!context) {
      throw new ForbiddenException("缺少认证上下文");
    }

    const userId = this.parseUserId(context.userId);

    if (context.permissions && context.permissions.length > 0) {
      const permissions = context.permissions
        .map((code, index) => this.normalizePermission(code, index))
        .filter((permission): permission is Permission => permission !== null);

      if (permissions.length > 0) {
        const ability = this.abilityFactory.createFromPermissions(permissions);
        this.attachUserContext(request, context);
        request.ability = ability;
        return ability;
      }
    }

    const account = await this.accountRepository.findByUserId(userId);
    if (!account) {
      throw new ForbiddenException("平台管理员未绑定权限，请联系系统管理员");
    }

    const ability = this.abilityFactory.createForAccount(account);
    this.attachUserContext(request, {
      userId: account.userId.value,
      tenantId: context.tenantId ?? account.tenantId.value,
      permissions: context.permissions,
    });
    request.ability = ability;

    return ability;
  }

  private extractUserContext(
    request: AuthorizedFastifyRequest,
  ): { userId: string; tenantId?: string; permissions?: string[] } | null {
    const rawUser = request.user;
    if (rawUser && typeof rawUser === "object") {
      const { userId, tenantId, permissions } = rawUser;
      if (userId) {
        return {
          userId,
          tenantId,
          permissions,
        };
      }
    }
    return null;
  }

  private parseUserId(value: string): UserId {
    try {
      return UserId.fromString(value);
    } catch (_error) {
      throw new BadRequestException("平台管理员标识不是有效的 UUID");
    }
  }

  private normalizePermission(code: string, index: number): Permission | null {
    const [actionCode, subjectCode] = code.split(":");
    const action = this.resolveAction(actionCode);
    const subject = this.resolveSubject(subjectCode);
    if (!action || !subject) {
      this.logger.warn("无法解析权限代码，已跳过", { code });
      return null;
    }
    return new Permission(`jwt-permission-${index}`, code, action, subject);
  }

  private resolveAction(action?: string): Actions | null {
    if (!action) {
      return null;
    }
    return Object.values(Actions).includes(action as Actions)
      ? (action as Actions)
      : null;
  }

  private resolveSubject(subject?: string): Subjects | null {
    if (!subject) {
      return null;
    }
    return Object.values(Subjects).includes(subject as Subjects)
      ? (subject as Subjects)
      : null;
  }

  private attachUserContext(
    request: AuthorizedFastifyRequest,
    context: { userId: string; tenantId?: string; permissions?: string[] },
  ): void {
    const user: JwtRequestUser = {
      userId: context.userId,
      tenantId: context.tenantId,
      permissions: context.permissions,
    };
    request.user = user;
    this.clsService.set("auth.user", {
      userId: context.userId,
      tenantId: context.tenantId,
      permissions: context.permissions,
    });
  }

  private async executePolicyHandler(
    handler: PolicyHandlerDescriptor,
    ability: AppAbility,
  ): Promise<boolean> {
    if (typeof handler === "function") {
      return Boolean(await handler(ability));
    }
    if (typeof handler.handle === "function") {
      return Boolean(await handler.handle(ability));
    }
    this.logger.warn("检测到无效的策略处理器", { handler });
    return false;
  }
}
