import { Module } from "@nestjs/common";
import { Logger } from "@hl8/logger";
import { AuthModule } from "../auth/auth.module.js";
import { UserController } from "./controllers/user.controller.js";
import { userModuleProviders } from "./providers/create-user.providers.js";

/**
 * @description 用户管理模块，聚合用户控制器与相关服务提供者
 * @remarks
 * - 暂时仅包含创建租户用户用例，后续可在此模块扩展更多用户能力
 * - 所有依赖的服务、仓储均通过 `userModuleProviders` 注入，便于日后替换实现
 */
@Module({
  controllers: [UserController],
  providers: [Logger, ...userModuleProviders],
  exports: [...userModuleProviders],
  imports: [AuthModule],
})
export class UserModule {}
