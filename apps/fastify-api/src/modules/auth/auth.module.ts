import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { Logger } from "@hl8/logger";
import { AuthController } from "./controllers/auth.controller.js";
import { authProviders } from "./providers/auth.providers.js";
import { JwtStrategy } from "./strategies/jwt.strategy.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { PoliciesGuard } from "./guards/policies.guard.js";

/**
 * @description 认证模块骨架，负责聚合登录与刷新令牌能力
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: "jwt" })],
  controllers: [AuthController],
  providers: [
    Logger,
    JwtStrategy,
    JwtAuthGuard,
    ...authProviders,
    PoliciesGuard,
  ],
  exports: [
    PassportModule,
    Logger,
    JwtStrategy,
    JwtAuthGuard,
    ...authProviders,
    PoliciesGuard,
  ],
})
export class AuthModule {}
