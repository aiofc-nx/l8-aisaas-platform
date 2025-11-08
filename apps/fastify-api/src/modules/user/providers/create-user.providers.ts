import type { Provider } from "@nestjs/common";
import { Logger } from "@hl8/logger";
import { CreateTenantUserService, InMemoryUserRepository } from "@hl8/user";

export const USER_REPOSITORY_TOKEN = Symbol("USER_REPOSITORY_TOKEN");

/**
 * @description 用户模块依赖提供者列表
 */
export const userModuleProviders: Provider[] = [
  {
    provide: USER_REPOSITORY_TOKEN,
    useClass: InMemoryUserRepository,
  },
  {
    provide: CreateTenantUserService,
    useFactory: (repository: InMemoryUserRepository, logger: Logger) => {
      return new CreateTenantUserService(repository, logger);
    },
    inject: [USER_REPOSITORY_TOKEN, Logger],
  },
];
