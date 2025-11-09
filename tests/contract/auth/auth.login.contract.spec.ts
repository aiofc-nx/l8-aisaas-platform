import { readFile } from "node:fs/promises";
import path from "node:path";
import { load } from "js-yaml";

type OpenAPIDocument = {
  paths?: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
};

let document: OpenAPIDocument;

beforeAll(async () => {
  const specPath = path.resolve(
    __dirname,
    "../../..",
    "specs/002-create-user/contracts/auth.login.openapi.yaml",
  );
  const raw = await readFile(specPath, "utf-8");
  document = load(raw) as OpenAPIDocument;
});

describe("Auth contract", () => {
  it("should expose /auth/login endpoint with expected request/response", () => {
    const endpoint = document.paths?.["/auth/login"];
    expect(endpoint?.post).toBeDefined();

    const requestSchema =
      endpoint?.post?.requestBody?.content?.["application/json"]?.schema;
    expect(requestSchema?.$ref).toContain("LoginRequest");

    const successResponse = endpoint?.post?.responses?.["200"];
    expect(successResponse?.description).toContain("登录成功");
    const successSchema =
      successResponse?.content?.["application/json"]?.schema;
    expect(successSchema?.$ref).toContain("LoginResponse");

    const unauthorizedResponse = endpoint?.post?.responses?.["401"];
    expect(unauthorizedResponse?.description).toContain("登录凭证无效");

    const lockedResponse = endpoint?.post?.responses?.["423"];
    expect(lockedResponse?.description).toContain("账户被锁定或禁用");
  });

  it("should validate LoginRequest schema", () => {
    const schema = document.components?.schemas?.LoginRequest ?? {};
    const required = new Set(schema.required as string[]);
    expect(required.has("email")).toBe(true);
    expect(required.has("password")).toBe(true);
    expect(schema.properties?.email?.format).toBe("email");
  });

  it("should expose /auth/refresh endpoint with expected schemas", () => {
    const endpoint = document.paths?.["/auth/refresh"];
    expect(endpoint?.post).toBeDefined();

    const requestSchema =
      endpoint?.post?.requestBody?.content?.["application/json"]?.schema;
    expect(requestSchema?.$ref).toContain("RefreshRequest");

    const successResponse = endpoint?.post?.responses?.["200"];
    const successSchema =
      successResponse?.content?.["application/json"]?.schema;
    expect(successSchema?.$ref).toContain("LoginResponse");

    const unauthorizedResponse = endpoint?.post?.responses?.["401"];
    expect(unauthorizedResponse?.description).toContain("刷新令牌无效");
  });

  it("should describe LoginResponse fields", () => {
    const schema = document.components?.schemas?.LoginResponse ?? {};
    const required = new Set(schema.required as string[]);
    ["accessToken", "refreshToken", "expiresIn", "refreshExpiresIn"].forEach(
      (field) => expect(required.has(field)).toBe(true),
    );
    expect(schema.properties?.tokenType?.example).toBe("Bearer");
    expect(schema.properties?.issuedAt?.format).toBe("date-time");
  });
});
