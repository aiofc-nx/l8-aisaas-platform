import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { CqrsModule } from "@nestjs/cqrs";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Logger } from "@hl8/logger";
import { TenantContextModule } from "@hl8/multi-tenancy";
import {
  LoginCommandHandler,
  RefreshCommandHandler,
  LoginUseCase,
  RefreshTokenUseCase,
} from "@hl8/auth";
import { AuthController } from "./controllers/auth.controller.js";
import { authProviders } from "./providers/auth.providers.js";
import { JwtStrategy } from "./strategies/jwt.strategy.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { PoliciesGuard } from "./guards/policies.guard.js";
import { AuthSessionEntity } from "@hl8/persistence-postgres";

/**
 * @description 认证模块骨架，负责聚合登录与刷新令牌能力
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    CqrsModule,
    TenantContextModule.register(),
    MikroOrmModule.forFeature([AuthSessionEntity], "postgres"),
  ],
  controllers: [AuthController],
  providers: [
    Logger,
    JwtStrategy,
    JwtAuthGuard,
    LoginCommandHandler,
    RefreshCommandHandler,
    LoginUseCase,
    RefreshTokenUseCase,
    ...authProviders,
    PoliciesGuard,
  ],
  exports: [
    PassportModule,
    Logger,
    JwtStrategy,
    JwtAuthGuard,
    LoginCommandHandler,
    RefreshCommandHandler,
    LoginUseCase,
    RefreshTokenUseCase,
    ...authProviders,
    PoliciesGuard,
  ],
})
export class AuthModule {}
