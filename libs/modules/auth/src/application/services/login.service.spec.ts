import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { Logger } from "@hl8/logger";
import { EmailAddress, UserId, TenantId } from "@hl8/user";
import { GeneralUnauthorizedException } from "@hl8/exceptions";
import { AuthAccount } from "../../domain/entities/auth-account.entity.js";
import { Role } from "../../domain/entities/role.entity.js";
import { Permission } from "../../domain/entities/permission.entity.js";
import { Actions } from "../../domain/enums/actions.enum.js";
import { Subjects } from "../../domain/enums/subjects.enum.js";
import type { AuthSessionRepository } from "../../interfaces/auth-session.repository.js";
import type { AuthAccountRepository } from "../../interfaces/auth-account.repository.js";
import type { TokenService } from "../../interfaces/token.service.js";
import type { PasswordHasher } from "../../interfaces/password-hasher.js";
import { AccessToken } from "../../domain/value-objects/access-token.vo.js";
import { RefreshToken } from "../../domain/value-objects/refresh-token.vo.js";
import { LoginService } from "./login.service.js";
import { LoginCommand } from "../commands/login.command.js";

const USER_ID = UserId.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
const TENANT_ID = TenantId.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
const ACCOUNT_EMAIL = EmailAddress.create("login.spec@example.com");
const PASSWORD_HASH = "$2a$12$abcdefghijklmnopqrstuv";

describe("LoginService", () => {
  let service: LoginService;
  let accountRepository: jest.Mocked<AuthAccountRepository>;
  let sessions: jest.Mocked<AuthSessionRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let tokenService: jest.Mocked<TokenService>;

  const loggerStub = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as Logger;

  beforeEach(() => {
    const account = new AuthAccount(
      USER_ID,
      TENANT_ID,
      ACCOUNT_EMAIL,
      PASSWORD_HASH,
      [
        new Role("role", "platform-admin", [
          new Permission("perm", "创建用户", Actions.Manage, Subjects.User),
        ]),
      ],
    );

    accountRepository = {
      findByEmail: jest.fn(async (email) =>
        email.value === ACCOUNT_EMAIL.value ? account : null,
      ),
      findByUserId: jest.fn(async () => account),
    } as jest.Mocked<AuthAccountRepository>;

    sessions = {
      save: jest.fn(async () => {}),
      findBySessionId: jest.fn(async () => null),
      findByRefreshToken: jest.fn(async () => null),
      revoke: jest.fn(async () => {}),
    } as jest.Mocked<AuthSessionRepository>;

    passwordHasher = {
      compare: jest.fn(
        async (plain, hashed) =>
          plain === "CorrectPassword" && hashed === PASSWORD_HASH,
      ),
    } as jest.Mocked<PasswordHasher>;

    tokenService = {
      signAccessToken: jest.fn(async () =>
        AccessToken.create("access-token", new Date(Date.now() + 3600 * 1000)),
      ),
      signRefreshToken: jest.fn(async () =>
        RefreshToken.create(
          "refresh-token",
          new Date(Date.now() + 7 * 24 * 3600 * 1000),
        ),
      ),
    } as jest.Mocked<TokenService>;

    service = new LoginService(
      loggerStub,
      accountRepository,
      sessions,
      tokenService,
      passwordHasher,
    );
  });

  it("should login successfully and persist session", async () => {
    const result = await service.execute(
      new LoginCommand(ACCOUNT_EMAIL.value, "CorrectPassword"),
    );

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.sessionId).toBeDefined();
    expect(result.issuedAt).toBeInstanceOf(Date);
    expect(sessions.save).toHaveBeenCalledTimes(1);
    expect(tokenService.signAccessToken).toHaveBeenCalledTimes(1);
    expect(tokenService.signRefreshToken).toHaveBeenCalledTimes(1);
  });

  it("should reject when account is not found", async () => {
    await expect(
      service.execute(
        new LoginCommand("missing@example.com", "CorrectPassword"),
      ),
    ).rejects.toBeInstanceOf(GeneralUnauthorizedException);
    expect(passwordHasher.compare).not.toHaveBeenCalled();
  });

  it("should reject when password does not match", async () => {
    await expect(
      service.execute(new LoginCommand(ACCOUNT_EMAIL.value, "WrongPassword")),
    ).rejects.toBeInstanceOf(GeneralUnauthorizedException);
    expect(passwordHasher.compare).toHaveBeenCalled();
  });
  it("should reject when email format invalid", async () => {
    await expect(
      service.execute(new LoginCommand("invalid-email", "any")),
    ).rejects.toBeInstanceOf(GeneralUnauthorizedException);
    expect(accountRepository.findByEmail).not.toHaveBeenCalled();
  });
});
