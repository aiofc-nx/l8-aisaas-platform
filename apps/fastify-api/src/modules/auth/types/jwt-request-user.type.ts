/**
 * @description JWT 认证后的请求用户上下文
 */
export interface JwtRequestUser {
  userId: string;
  tenantId?: string;
  roles?: string[];
  permissions?: string[];
  sessionId?: string;
}
