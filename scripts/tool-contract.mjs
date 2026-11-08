export const TOOL_CREDITS = Object.freeze({
  get_categories: 0,
  search_channels: 3,
  get_channel: 1,
  add_channel: 0,
  search_posts: 3,
  get_channel_subscribers: 5,
  get_channel_views: 5,
  get_channel_likes: 5,
  get_channel_posts: 5,
  get_post: 1,
  get_post_views: 5,
  get_post_likes: 5,
  get_account_subscription: 0,
  get_account_limits: 0,
  get_account_usage: 0,
});

export const TOOL_NAMES = Object.freeze(Object.keys(TOOL_CREDITS));

function creditsFromText(value) {
  if (typeof value !== "string") {
    return null;
  }
  const cost = value.split("·").at(-1).trim();
  if (/^бесплатно$/iu.test(cost)) {
    return 0;
  }
  const match = cost.match(/^(\d+)(?:\s+кредит(?:а|ов)?)?$/u);
  return match ? Number(match[1]) : null;
}

function validateTools(tools) {
  const errors = [];
  const seen = new Set();
  for (const { name, credits } of tools) {
    if (typeof name !== "string" || !Object.hasOwn(TOOL_CREDITS, name)) {
      errors.push(`unsupported tool ${JSON.stringify(name)}.`);
      continue;
    }
    if (seen.has(name)) {
      errors.push(`duplicate tool ${name}.`);
    }
    seen.add(name);
    if (credits !== TOOL_CREDITS[name]) {
      errors.push(`${name}: credits must be ${TOOL_CREDITS[name]}, got ${JSON.stringify(credits)}.`);
    }
  }
  for (const name of TOOL_NAMES) {
    if (!seen.has(name)) {
      errors.push(`missing tool ${name}.`);
    }
  }
  return errors;
}

export function validateToolTable(content) {
  const tools = [...content.matchAll(/^\|\s*`([a-z][a-z0-9_]*)`\s*\|([^\n]*)/gm)].map((match) => {
    const cells = match[2].split("|");
    return { name: match[1], credits: creditsFromText(cells.at(-2)) };
  });
  return validateTools(tools);
}

export function validateDeclaredToolCounts(content) {
  const counts = [
    ...content.matchAll(/\b(\d+)(?:[ -](?:MCP|MaxStat))?[ -](?:tools?|инструмент(?:а|ов)?)(?![\p{L}\p{N}_])/giu),
    ...content.matchAll(/MCP_tools-(\d+)-/g),
  ];
  return counts
    .filter((match) => Number(match[1]) !== TOOL_NAMES.length)
    .map((match) => `tool count must be ${TOOL_NAMES.length}, got ${match[1]}.`);
}

export function validatePublicApi(schema) {
  if (!schema?.paths || typeof schema.paths !== "object" || Array.isArray(schema.paths)) {
    return ["OpenAPI paths must be an object."];
  }
  const methods = new Set(["get", "post", "put", "patch", "delete", "head", "options", "trace"]);
  const tools = [];
  for (const item of Object.values(schema.paths)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return ["OpenAPI path items must be objects."];
    }
    for (const [method, operation] of Object.entries(item)) {
      if (methods.has(method)) {
        tools.push({
          name: operation?.operationId,
          credits: creditsFromText(operation?.summary),
        });
      }
    }
  }
  return validateTools(tools);
}
