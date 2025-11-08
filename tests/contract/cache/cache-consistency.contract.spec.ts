import { readFile } from "node:fs/promises";
import path from "node:path";
import { load } from "js-yaml";

type SchemaObject = Record<string, any>;

interface OpenAPIDocument {
  paths: Record<string, any>;
  components: {
    schemas: Record<string, SchemaObject>;
  };
}

let document: OpenAPIDocument;

beforeAll(async () => {
  const specPath = path.resolve(
    __dirname,
    "../../..",
    "specs/001-cache-strategy/contracts/cache-management.openapi.yaml",
  );
  const raw = await readFile(specPath, "utf-8");
  document = load(raw) as OpenAPIDocument;
});

describe("Cache write consistency contract", () => {
  it("should define invalidation endpoint contract", () => {
    const invalidationPath = document.paths?.["/internal/cache/invalidations"];
    expect(invalidationPath?.post).toBeDefined();

    const postOperation = invalidationPath.post as Record<string, any>;
    const requestSchema =
      postOperation?.requestBody?.content?.["application/json"]?.schema;
    expect(requestSchema?.$ref).toContain("InvalidateRequest");

    const acceptedResponse = postOperation?.responses?.["202"];
    expect(acceptedResponse).toBeDefined();
    const acceptedSchema =
      acceptedResponse?.content?.["application/json"]?.schema;
    expect(acceptedSchema?.$ref).toContain("InvalidateAccepted");

    const badRequest = postOperation?.responses?.["400"];
    expect(badRequest?.description).toContain("中文错误消息");
  });

  it("should expose invalidate request schema requirements", () => {
    const invalidateSchema =
      document.components?.schemas?.InvalidateRequest ?? {};
    const requiredFields = new Set(invalidateSchema.required as string[]);
    ["domain", "tenantId", "keys", "reason"].forEach((field) =>
      expect(requiredFields.has(field)).toBe(true),
    );

    const keysSchema = invalidateSchema.properties?.keys;
    expect(keysSchema?.type).toBe("array");
    expect(keysSchema?.items?.type).toBe("string");
    expect(keysSchema?.minItems).toBeGreaterThan(0);
  });

  it("should define prefetch endpoint contract", () => {
    const prefetchPath = document.paths?.["/internal/cache/prefetch"];
    expect(prefetchPath?.post).toBeDefined();

    const postOperation = prefetchPath.post as Record<string, any>;
    const requestSchema =
      postOperation?.requestBody?.content?.["application/json"]?.schema;
    expect(requestSchema?.$ref).toContain("PrefetchRequest");

    const successResponse = postOperation?.responses?.["200"];
    expect(successResponse).toBeDefined();
    const successSchema =
      successResponse?.content?.["application/json"]?.schema;
    expect(successSchema?.$ref).toContain("PrefetchResult");
  });

  it("should expose prefetch result metrics fields", () => {
    const resultSchema = document.components?.schemas?.PrefetchResult ?? {};
    expect(resultSchema.properties?.refreshed?.type).toBe("integer");
    const failuresSchema = resultSchema.properties?.failures;
    expect(failuresSchema?.type).toBe("array");
    expect(failuresSchema?.items?.properties?.key?.type).toBe("string");
    expect(failuresSchema?.items?.properties?.message?.description).toContain(
      "中文",
    );
  });
});
