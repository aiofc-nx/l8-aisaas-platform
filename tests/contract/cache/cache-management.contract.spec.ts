import { readFile } from "node:fs/promises";
import path from "node:path";
import { load } from "js-yaml";

type OpenAPIDocument = {
  paths: Record<string, unknown>;
  components: {
    schemas: Record<string, unknown>;
  };
};

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

describe("Cache Management OpenAPI contract", () => {
  it("should expose namespace listing endpoint with data array response", () => {
    const namespacesPath = (document.paths ?? {})[
      "/internal/cache/namespaces"
    ] as Record<string, any> | undefined;
    expect(namespacesPath).toBeDefined();

    const getOperation = namespacesPath?.get as Record<string, any> | undefined;
    expect(getOperation?.responses?.["200"]).toBeDefined();

    const successResponse = getOperation?.responses?.["200"] as Record<
      string,
      any
    >;
    const schema = successResponse?.content?.["application/json"]?.schema;
    expect(schema?.type).toBe("object");
    expect(schema?.properties?.data?.type).toBe("array");
    expect(schema?.properties?.data?.items?.$ref).toContain(
      "NamespacePolicyDto",
    );
  });

  it("should define NamespacePolicyDto schema with required fields", () => {
    const schemas = document.components?.schemas ?? {};
    const policySchema = schemas["NamespacePolicyDto"] as Record<string, any>;
    expect(policySchema).toBeDefined();
    const required = new Set(policySchema.required as string[]);
    [
      "domain",
      "keyPrefix",
      "separator",
      "defaultTTL",
      "evictionPolicy",
    ].forEach((field) => expect(required.has(field)).toBe(true));
    expect(policySchema.properties?.domain?.example).toBe("tenant-config");
    expect(policySchema.properties?.evictionPolicy?.enum).toEqual(
      expect.arrayContaining(["double-delete", "refresh", "ttl-only"]),
    );
  });
});
