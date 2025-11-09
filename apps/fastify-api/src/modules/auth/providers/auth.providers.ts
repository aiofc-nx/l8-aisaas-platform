import type { Provider } from "@nestjs/common";
import { Logger } from "@hl8/logger";
import {
  AuthConfig,
  AUTH_ACCOUNT_REPOSITORY_TOKEN,
  AUTH_SESSION_REPOSITORY_TOKEN,
  TOKEN_SERVICE_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_PAYLOAD_BUILDER_TOKEN,
  InMemoryAuthAccountRepository,
  JwtTokenService,
  BcryptPasswordHasher,
  LoginService,
  RefreshService,
  Actions,
  Subjects,
  CaslAbilityFactory,
  TokenBuilderService,
} from "@hl8/auth";
import { MikroOrmAuthSessionRepository } from "@hl8/persistence-postgres";
import { validateSync } from "class-validator";
import { hashSync } from "bcryptjs";

export const AUTH_CONFIG_TOKEN = Symbol("AUTH_CONFIG_TOKEN");

const DEFAULT_ADMIN_USER_ID = "33333333-3333-4333-8333-333333333333";
const DEFAULT_ADMIN_TENANT_ID = "11111111-1111-4111-8111-111111111111";
const DEFAULT_ADMIN_EMAIL =
  process.env.AUTH_SEED_ADMIN_EMAIL ?? "admin@example.com";
const DEFAULT_ADMIN_PASSWORD =
  process.env.AUTH_SEED_ADMIN_PASSWORD ?? "Admin@123";

function createAuthConfig(logger: Logger): AuthConfig {
  const config = new AuthConfig();
  config.accessTokenSecret =
    process.env.AUTH_ACCESS_TOKEN_SECRET ?? "dev-access-secret";
  config.refreshTokenSecret =
    process.env.AUTH_REFRESH_TOKEN_SECRET ?? "dev-refresh-secret";
  config.accessTokenExpiresIn =
    process.env.AUTH_ACCESS_TOKEN_EXPIRES_IN ?? "3600s";
  config.refreshTokenExpiresIn =
    process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN ?? "604800s";
  if (process.env.AUTH_HEADER_NAME) {
    config.authHeaderName = process.env.AUTH_HEADER_NAME;
  }
  if (process.env.AUTH_TENANT_HEADER_NAME) {
    config.tenantHeaderName = process.env.AUTH_TENANT_HEADER_NAME;
  }

  const validationErrors = validateSync(config, {
    whitelist: true,
    forbidUnknownValues: true,
  });

  if (validationErrors.length > 0) {
    logger.error("认证配置校验失败", undefined, {
      errors: validationErrors.map((error) => error.toString()),
    });
    throw new Error("认证配置校验失败，请检查环境变量设置");
  }

  return config;
}

const seedAdminAccount = (): ConstructorParameters<
  typeof InMemoryAuthAccountRepository
>[0] => [
  {
    userId: DEFAULT_ADMIN_USER_ID,
    tenantId: DEFAULT_ADMIN_TENANT_ID,
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: hashSync(DEFAULT_ADMIN_PASSWORD, 12),
    roles: [
      {
        roleId: "role-platform-admin",
        name: "platform-admin",
        permissions: [
          {
            permissionId: "perm-user-create",
            name: "创建租户用户",
            action: Actions.Manage,
            subject: Subjects.User,
          },
          {
            permissionId: "perm-tenant-manage",
            name: "管理租户配置",
            action: Actions.Manage,
            subject: Subjects.Tenant,
          },
        ],
      },
    ],
  },
];

/**
 * @description 认证模块依赖提供者
 */
export const authProviders: Provider[] = [
  {
    provide: AUTH_CONFIG_TOKEN,
    useFactory: (logger: Logger) => createAuthConfig(logger),
    inject: [Logger],
  },
  {
    provide: AuthConfig,
    useExisting: AUTH_CONFIG_TOKEN,
  },
  {
    provide: AUTH_ACCOUNT_REPOSITORY_TOKEN,
    useFactory: () => new InMemoryAuthAccountRepository(seedAdminAccount()),
  },
  {
    provide: AUTH_SESSION_REPOSITORY_TOKEN,
    useClass: MikroOrmAuthSessionRepository,
  },
  {
    provide: TOKEN_SERVICE_TOKEN,
    useFactory: (config: AuthConfig, logger: Logger) => {
      const targetLogger =
        typeof logger.child === "function"
          ? logger.child({ context: "JwtTokenService" })
          : logger;
      return new JwtTokenService(config, targetLogger);
    },
    inject: [AUTH_CONFIG_TOKEN, Logger],
  },
  {
    provide: PASSWORD_HASHER_TOKEN,
    useFactory: () => new BcryptPasswordHasher(),
  },
  TokenBuilderService,
  {
    provide: TOKEN_PAYLOAD_BUILDER_TOKEN,
    useExisting: TokenBuilderService,
  },
  {
    provide: CaslAbilityFactory,
    useFactory: (logger: Logger) => new CaslAbilityFactory(logger),
    inject: [Logger],
  },
  LoginService,
  RefreshService,
];
