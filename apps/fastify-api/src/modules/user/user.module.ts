import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Logger } from "@hl8/logger";
import { AuthModule } from "../auth/auth.module.js";
import { UserController } from "./controllers/user.controller.js";
import { userModuleProviders } from "./providers/create-user.providers.js";
import {
  UserEntity,
  UserProjectionEntity,
  UserProjectionRepository,
} from "@hl8/persistence-postgres";
import { MongoDomainEventStore } from "@hl8/persistence-mongo";
import { CqrsModule } from "@nestjs/cqrs";
import {
  CreateTenantUserCommandHandler,
  UserCreatedEventHandler,
} from "@hl8/user";

/**
 * @description 用户管理模块，聚合用户控制器与相关服务提供者
 * @remarks
 * - 暂时仅包含创建租户用户用例，后续可在此模块扩展更多用户能力
 * - 所有依赖的服务、仓储均通过 `userModuleProviders` 注入，便于日后替换实现
 */
const commandHandlers = [CreateTenantUserCommandHandler];
const eventHandlers = [UserCreatedEventHandler];

@Module({
  controllers: [UserController],
  providers: [
    Logger,
    MongoDomainEventStore,
    ...userModuleProviders,
    ...commandHandlers,
    ...eventHandlers,
  ],
  exports: [...userModuleProviders],
  imports: [
    AuthModule,
    CqrsModule,
    MikroOrmModule.forFeature([UserEntity, UserProjectionEntity], "postgres"),
    MikroOrmModule.forFeature([], "mongo"),
  ],
})
export class UserModule {}
