import assert from "node:assert/strict";
import test from "node:test";

async function loadContract() {
  try {
    return await import("../scripts/tool-contract.mjs");
  } catch (error) {
    assert.fail(`tool contract must load: ${error.message}`);
  }
}

function publicApi() {
  const operations = [
    ["get_categories", "бесплатно"],
    ["search_channels", "3 кредита"],
    ["get_channel", "1 кредит"],
    ["add_channel", "бесплатно"],
    ["search_posts", "3 кредита"],
    ["get_channel_subscribers", "5 кредитов"],
    ["get_channel_views", "5 кредитов"],
    ["get_channel_likes", "5 кредитов"],
    ["get_channel_posts", "5 кредитов"],
    ["get_post", "1 кредит"],
    ["get_post_views", "5 кредитов"],
    ["get_post_likes", "5 кредитов"],
    ["get_account_subscription", "бесплатно"],
    ["get_account_limits", "бесплатно"],
    ["get_account_usage", "бесплатно"],
  ];
  return {
    paths: Object.fromEntries(operations.map(([name, cost]) => [
      `/${name}`,
      { get: { operationId: name, summary: `Operation · ${cost}` } },
    ])),
  };
}

test("the public API contract accepts all 15 operations and their costs", async () => {
  const { validatePublicApi } = await loadContract();
  assert.deepEqual(validatePublicApi(publicApi()), []);
});

test("a billing subscription remains required when webhook subscriptions are absent", async () => {
  const { validatePublicApi } = await loadContract();
  const schema = publicApi();
  delete schema.paths["/get_account_subscription"];
  assert(validatePublicApi(schema).some((error) => error.includes("missing") && error.includes("get_account_subscription")));
});

test("a new public operation requires a contract update", async () => {
  const { validatePublicApi } = await loadContract();
  const schema = publicApi();
  schema.paths["/new"] = { post: { operationId: "create_keyword_subscription", summary: "бесплатно" } };
  assert(validatePublicApi(schema).some((error) => error.includes("unsupported") && error.includes("create_keyword_subscription")));
});

test("duplicate public operation IDs are rejected", async () => {
  const { validatePublicApi } = await loadContract();
  const schema = publicApi();
  schema.paths["/duplicate"] = schema.paths["/get_categories"];
  assert(validatePublicApi(schema).some((error) => error.includes("duplicate") && error.includes("get_categories")));
});

test("a changed public credit cost requires a contract update", async () => {
  const { validatePublicApi } = await loadContract();
  const schema = publicApi();
  schema.paths["/search_posts"].get.summary = "Поиск · 4 кредита";
  assert(validatePublicApi(schema).some((error) => error.includes("search_posts") && error.includes("credits")));
});

test("an undocumented public credit cost is rejected", async () => {
  const { validatePublicApi } = await loadContract();
  const schema = publicApi();
  delete schema.paths["/get_post"].get.summary;
  assert(validatePublicApi(schema).some((error) => error.includes("get_post") && error.includes("credits")));
});

test("path-level OpenAPI metadata does not become an MCP tool", async () => {
  const { validatePublicApi } = await loadContract();
  const schema = publicApi();
  schema.paths["/get_categories"].parameters = [{ name: "example", in: "query" }];
  assert.deepEqual(validatePublicApi(schema), []);
});

test("malformed or empty public schemas fail with actionable errors", async () => {
  const { validatePublicApi } = await loadContract();
  for (const schema of [null, {}, { paths: [] }, { paths: {} }]) {
    assert(validatePublicApi(schema).length > 0);
  }
});

test("tool counts are checked in Russian, English, and badges", async () => {
  const { validateDeclaredToolCounts } = await loadContract();
  for (const content of ["21 инструмент", "21 инструмента", "21 инструментов", "21 MCP tools", "21 MaxStat tools", "MCP_tools-21-4830E6"]) {
    assert(validateDeclaredToolCounts(content).length > 0, content);
  }
  assert.deepEqual(validateDeclaredToolCounts("15 инструментов · 15 MCP tools · MCP_tools-15-4830E6"), []);
});
