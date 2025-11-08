import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { Logger } from "@hl8/logger";
import {
  CreateTenantUserCommand,
  CreateTenantUserService,
  EmailAlreadyExistsException,
  UserDomainException,
  UserStatus,
} from "@hl8/user";
import { Actions, Subjects } from "@hl8/auth";
import { CheckPolicies } from "../../auth/decorators/check-policies.decorator.js";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard.js";
import { PoliciesGuard } from "../../auth/guards/policies.guard.js";
import type { JwtRequestUser } from "../../auth/types/jwt-request-user.type.js";
import { CreateUserDto } from "../dto/create-user.dto.js";

const USER_STATUS_LABEL: Record<UserStatus, string> = {
  [UserStatus.PendingActivation]: "待激活",
  [UserStatus.Active]: "活跃",
  [UserStatus.Disabled]: "禁用",
  [UserStatus.Locked]: "锁定",
  [UserStatus.Expired]: "过期",
};

/**
 * @description 用户管理控制器，承载平台管理员在租户范围内的用户操作接口
 */
@Controller("internal/tenants")
export class UserController {
  constructor(
    private readonly createTenantUserService: CreateTenantUserService,
    private readonly logger: Logger,
  ) {}

  @Post(":tenantId/users")
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Actions.Manage, Subjects.User))
  @HttpCode(HttpStatus.CREATED)
  public async createTenantUser(
    @Param("tenantId") tenantId: string,
    @Body() dto: CreateUserDto,
    @Req() request: FastifyRequest,
  ) {
    const userContext = request.user as JwtRequestUser | undefined;
    if (!userContext?.userId) {
      throw new ForbiddenException("缺少认证上下文");
    }

    const command: CreateTenantUserCommand = {
      tenantId,
      createdBy: userContext.userId,
      displayName: dto.displayName,
      email: dto.email,
      mobile: dto.mobile ?? undefined,
      roles: dto.roles,
    };

    try {
      const { user } = await this.createTenantUserService.execute(command);

      const response = {
        userId: user.id.value,
        tenantId: user.tenantId.value,
        status: USER_STATUS_LABEL[user.status],
        createdAt: user.createdAt.toISOString(),
        requestId:
          (request as unknown as { requestId?: string }).requestId ??
          (typeof request.id === "string" ? request.id : undefined),
      };

      this.logger.log("创建租户用户成功", {
        tenantId: response.tenantId,
        userId: response.userId,
      });
      return response;
    } catch (error) {
      if (error instanceof EmailAlreadyExistsException) {
        throw new ConflictException(error.message);
      }
      if (error instanceof UserDomainException) {
        throw new BadRequestException(error.message);
      }
      this.logger.error("创建租户用户失败", undefined, {
        tenantId,
        email: dto.email,
        error,
      });
      throw error;
    }
  }
}
