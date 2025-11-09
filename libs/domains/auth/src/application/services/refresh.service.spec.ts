import { describe, beforeEach, it, expect, jest } from "@jest/globals";
import { Logger } from "@hl8/logger";
import { UserId, TenantId } from "@hl8/user";
import { GeneralUnauthorizedException } from "@hl8/exceptions";
import { AuthSession } from "../../domain/aggregates/auth-session.aggregate.js";
import { AuthSessionRepository } from "../../interfaces/auth-session.repository.js";
import { TokenService } from "../../interfaces/token.service.js";
import { TokenPayloadBuilder } from "../../interfaces/token-payload-builder.js";
import { AccessToken } from "../../domain/value-objects/access-token.vo.js";
import { RefreshToken } from "../../domain/value-objects/refresh-token.vo.js";
import { RefreshService } from "./refresh.service.js";
import { RefreshCommand } from "../commands/refresh.command.js";
import { AccessTokenPayload } from "../../domain/value-objects/access-token-payload.vo.js";
import { RefreshTokenPayload } from "../../domain/value-objects/refresh-token-payload.vo.js";

const USER_ID = UserId.fromString("cccccccc-cccc-4ccc-8ccc-cccccccccccc");
const TENANT_ID = TenantId.fromString("dddddddd-dddd-4ddd-8ddd-dddddddddddd");

describe("RefreshService", () => {
  let service: RefreshService;
  let sessions: jest.Mocked<AuthSessionRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let existingSession: AuthSession;
  let tokenPayloadBuilder: jest.Mocked<TokenPayloadBuilder>;

  const loggerStub = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as Logger;

  beforeEach(async () => {
    const createBuilder = () =>
      ({
        buildAccessPayload: jest.fn(
          ({ sessionId, userId, tenantId, roles, permissions }) =>
            new AccessTokenPayload(
              sessionId,
              userId,
              tenantId,
              roles,
              permissions,
            ),
        ),
        buildRefreshPayload: jest.fn(
          ({ sessionId, userId, tenantId }) =>
            new RefreshTokenPayload(sessionId, userId, tenantId),
        ),
      }) as jest.Mocked<TokenPayloadBuilder>;

    const initialTokenPayloadBuilder = createBuilder();

    const initialTokenService = {
      signAccessToken: jest.fn(async () =>
        AccessToken.create(
          "initial-access",
          new Date(Date.now() + 1800 * 1000),
        ),
      ),
      signRefreshToken: jest.fn(async () =>
        RefreshToken.create(
          "initial-refresh",
          new Date(Date.now() + 3 * 24 * 3600 * 1000),
        ),
      ),
    } as jest.Mocked<TokenService>;

    existingSession = await AuthSession.issue({
      userId: USER_ID,
      tenantId: TENANT_ID,
      roles: ["platform-admin"],
      permissions: ["manage:User"],
      tokenService: initialTokenService,
      tokenPayloadBuilder: initialTokenPayloadBuilder,
    });
    existingSession.pullDomainEvents();

    tokenService = {
      signAccessToken: jest.fn(async () =>
        AccessToken.create("new-access", new Date(Date.now() + 3600 * 1000)),
      ),
      signRefreshToken: jest.fn(async () =>
        RefreshToken.create(
          "new-refresh",
          new Date(Date.now() + 7 * 24 * 3600 * 1000),
        ),
      ),
    } as jest.Mocked<TokenService>;

    tokenPayloadBuilder = createBuilder();

    sessions = {
      save: jest.fn(async () => {}),
      findBySessionId: jest.fn(async () => existingSession),
      findByRefreshToken: jest.fn(async (token) =>
        token === existingSession.refreshToken.value ? existingSession : null,
      ),
      revoke: jest.fn(async () => {}),
    } as jest.Mocked<AuthSessionRepository>;

    service = new RefreshService(
      loggerStub,
      sessions,
      tokenService,
      tokenPayloadBuilder,
    );
  });

  it("should refresh tokens successfully", async () => {
    const result = await service.execute(
      new RefreshCommand(existingSession.refreshToken.value),
    );

    expect(result.accessToken).toBe("new-access");
    expect(result.refreshToken).toBe("new-refresh");
    expect(result.sessionId).toEqual(existingSession.sessionId.value);
    expect(result.issuedAt).toBeInstanceOf(Date);
    expect(result.events).toHaveLength(1);
    expect(sessions.save).toHaveBeenCalledTimes(1);
    expect(tokenService.signAccessToken).toHaveBeenCalledTimes(1);
    expect(tokenService.signRefreshToken).toHaveBeenCalledTimes(1);
    expect(tokenPayloadBuilder.buildAccessPayload).toHaveBeenCalledTimes(1);
    expect(tokenPayloadBuilder.buildRefreshPayload).toHaveBeenCalledTimes(1);
  });

  it("should reject empty refresh token", async () => {
    await expect(
      service.execute(new RefreshCommand("")),
    ).rejects.toBeInstanceOf(GeneralUnauthorizedException);
    expect(sessions.findByRefreshToken).not.toHaveBeenCalled();
  });
  it("should reject unknown refresh token", async () => {
    await expect(
      service.execute(new RefreshCommand("not-found-token")),
    ).rejects.toBeInstanceOf(GeneralUnauthorizedException);
  });
});
