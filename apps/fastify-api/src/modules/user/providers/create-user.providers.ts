import type { Provider } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Logger } from "@hl8/logger";
import type { UserRepository } from "@hl8/user";
import { CreateTenantUserService, CreateTenantUserUseCase } from "@hl8/user";
import { MikroOrmUserRepository } from "@hl8/persistence-postgres";
import { UserProjectionRepository } from "@hl8/persistence-postgres";
import { USER_PROJECTION_REPOSITORY } from "@hl8/user";

export const USER_REPOSITORY_TOKEN = Symbol("USER_REPOSITORY_TOKEN");
export const USER_PROJECTION_REPOSITORY_TOKEN = USER_PROJECTION_REPOSITORY;

/**
 * @description 用户模块依赖提供者列表
 */
export const userModuleProviders: Provider[] = [
  {
    provide: USER_REPOSITORY_TOKEN,
    useClass: MikroOrmUserRepository,
  },
  {
    provide: CreateTenantUserService,
    useFactory: (repository: UserRepository, logger: Logger) => {
      return new CreateTenantUserService(repository, logger);
    },
    inject: [USER_REPOSITORY_TOKEN, Logger],
  },
  {
    provide: USER_PROJECTION_REPOSITORY_TOKEN,
    useClass: UserProjectionRepository,
  },
  {
    provide: CreateTenantUserUseCase,
    useFactory: (commandBus: CommandBus, logger: Logger) =>
      new CreateTenantUserUseCase(commandBus, logger),
    inject: [CommandBus, Logger],
  },
];
