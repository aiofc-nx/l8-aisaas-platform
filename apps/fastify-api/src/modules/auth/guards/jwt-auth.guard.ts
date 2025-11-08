import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ClsService } from "nestjs-cls";
import { Logger } from "@hl8/logger";
import type { JwtRequestUser } from "../types/jwt-request-user.type.js";

/**
 * @description JWT 认证守卫，负责验证访问令牌并写入 CLS 上下文
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(
    private readonly clsService: ClsService,
    private readonly logger: Logger,
  ) {
    super();
  }

  public override handleRequest(
    err: unknown,
    user: JwtRequestUser | false,
    info: unknown,
    context: ExecutionContext,
  ): JwtRequestUser {
    if (err || !user) {
      this.logger.warn("访问令牌验证失败", { info, err });
      throw new UnauthorizedException("访问令牌无效或已过期");
    }

    const request = context.switchToHttp().getRequest();
    request.user = user;

    this.clsService.set("auth.user", {
      userId: user.userId,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      sessionId: user.sessionId,
    });

    this.logger.log("JWT 守卫已写入上下文", {
      userId: user.userId,
      tenantId: user.tenantId,
    });

    return user;
  }
}
