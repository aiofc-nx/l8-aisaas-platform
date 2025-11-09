import { readFile } from "node:fs/promises";
import path from "node:path";
import { load } from "js-yaml";

interface OpenAPIDocument {
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
  };
}

let document: OpenAPIDocument;

beforeAll(async () => {
  const specPath = path.resolve(
    __dirname,
    "../../..",
    "specs/002-create-user/contracts/user.create.openapi.yaml",
  );
  const raw = await readFile(specPath, "utf-8");
  document = load(raw) as OpenAPIDocument;
});

describe("User creation contract", () => {
  it("should define POST /tenants/{tenantId}/users endpoint", () => {
    const endpoint = document.paths?.["/tenants/{tenantId}/users"];
    expect(endpoint?.post).toBeDefined();
    const requestSchema =
      endpoint?.post?.requestBody?.content?.["application/json"]?.schema;
    expect(requestSchema?.$ref).toContain("CreateUserRequest");

    const createdResponse = endpoint?.post?.responses?.["201"];
    expect(createdResponse?.description).toContain("创建成功");
    const responseSchema =
      createdResponse?.content?.["application/json"]?.schema;
    expect(responseSchema?.$ref).toContain("CreateUserResponse");

    const conflictResponse = endpoint?.post?.responses?.["409"];
    expect(conflictResponse?.description).toContain("邮箱或手机号发生冲突");

    const unauthorizedResponse = endpoint?.post?.responses?.["401"];
    expect(unauthorizedResponse?.description).toContain("未认证");
  });

  it("should require displayName and email fields", () => {
    const schema = document.components?.schemas?.CreateUserRequest ?? {};
    const required = new Set(schema.required as string[]);
    expect(required.has("displayName")).toBe(true);
    expect(required.has("email")).toBe(true);

    const displayName = schema.properties?.displayName ?? {};
    expect(displayName.maxLength).toBe(50);
    const rolesSchema = schema.properties?.roles ?? {};
    expect(rolesSchema.type).toBe("array");
    expect(rolesSchema.items?.enum).toContain("tenant-admin");
  });

  it("should expose response fields with requestId", () => {
    const schema = document.components?.schemas?.CreateUserResponse ?? {};
    const required = new Set(schema.required as string[]);
    ["userId", "tenantId", "status", "createdAt"].forEach((field) =>
      expect(required.has(field)).toBe(true),
    );
    expect(schema.properties?.status?.enum).toContain("待激活");
    expect(schema.properties?.requestId?.description).toContain("追踪 ID");
  });
});
