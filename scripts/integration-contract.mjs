import { access, readFile } from "node:fs/promises";
import path from "node:path";

export const RELEASE_VERSION = "1.2.0";
export const MCP_URL = "https://maxstat.ru/api/mcp";
export const TOKEN_HEADER = "X-API-Token";
export const TOKEN_ENV = "MAXSTAT_API_TOKEN";

const JSON_FILES = [
  "server.json",
  "package.json",
  "mcp-config.example.json",
  ".agents/plugins/marketplace.json",
  ".claude-plugin/marketplace.json",
  "plugins/maxstat/.codex-plugin/plugin.json",
  "plugins/maxstat/.claude-plugin/plugin.json",
  "plugins/maxstat/.mcp.json",
  "gemini-extension.json",
  "configs/claude-code.json",
  "configs/claude-desktop.json",
  "configs/cursor.json",
  "configs/generic-mcp.json",
  "configs/jetbrains.json",
  "configs/vscode.json",
  "configs/windsurf.json",
];

const TOOL_NAMES = [
  "get_categories",
  "search_channels",
  "get_channel",
  "add_channel",
  "search_posts",
  "get_channel_subscribers",
  "get_channel_views",
  "get_channel_likes",
  "get_channel_posts",
  "get_post",
  "get_post_views",
  "get_post_likes",
  "create_channel_subscription",
  "create_keyword_subscription",
  "get_subscriptions",
  "get_subscription",
  "update_subscription",
  "delete_subscription",
  "get_account_subscription",
  "get_account_limits",
  "get_account_usage",
];

const ALLOWED_TOKEN_VALUES = new Set([
  "<API_TOKEN>",
  "${MAXSTAT_API_TOKEN}",
  "${env:MAXSTAT_API_TOKEN}",
  "${input:maxstat-api-token}",
  "MAXSTAT_API_TOKEN",
  "X-API-Token:${MAXSTAT_API_TOKEN}",
]);

export async function readJson(rootDir, relativePath) {
  const filePath = path.join(rootDir, relativePath);
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function valueAt(object, objectPath) {
  return objectPath.reduce((value, key) => value?.[key], object);
}

function expectEqual(errors, file, label, actual, expected) {
  if (actual !== expected) {
    errors.push(
      `${file}: ${label} must be ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`,
    );
  }
}

function inspectSecrets(errors, file, value, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      inspectSecrets(errors, file, item, [...trail, index]),
    );
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const childTrail = [...trail, key];
      if (
        key === "Authorization" ||
        key.toLowerCase() === "bearer_token_env_var"
      ) {
        errors.push(
          `${file}: ${childTrail.join(".")} is invalid; MaxStat authentication must use ${TOKEN_HEADER}.`,
        );
      }
      if (
        (key === TOKEN_HEADER || key === TOKEN_ENV) &&
        typeof child === "string" &&
        !ALLOWED_TOKEN_VALUES.has(child)
      ) {
        errors.push(
          `${file}: hardcoded token found at ${childTrail.join(".")}; use a documented placeholder.`,
        );
      }
      inspectSecrets(errors, file, child, childTrail);
    }
    return;
  }

  if (
    typeof value === "string" &&
    /(?:maxstat|mcp)[_-](?:live|test|prod)[_-][A-Za-z0-9]{8,}/i.test(value)
  ) {
    errors.push(
      `${file}: hardcoded token-like value found at ${trail.join(".")}.`,
    );
  }
}

function checkHttpConfig(
  errors,
  documents,
  file,
  serverPath,
  urlKey,
  expectedToken,
) {
  const document = documents.get(file);
  if (!document) {
    return;
  }
  const server = valueAt(document, serverPath);
  expectEqual(
    errors,
    file,
    `${serverPath.join(".")}.${urlKey}`,
    server?.[urlKey],
    MCP_URL,
  );
  expectEqual(
    errors,
    file,
    `${serverPath.join(".")}.headers.${TOKEN_HEADER}`,
    server?.headers?.[TOKEN_HEADER],
    expectedToken,
  );
}

async function checkRelativePath(errors, rootDir, sourceFile, relativePath) {
  if (
    typeof relativePath !== "string" ||
    !relativePath.startsWith("./") ||
    relativePath.includes("..")
  ) {
    errors.push(
      `${sourceFile}: path ${JSON.stringify(relativePath)} must start with ./ and stay inside the package.`,
    );
    return;
  }
  if (!(await exists(path.join(rootDir, relativePath)))) {
    errors.push(
      `${sourceFile}: referenced path ${relativePath} does not exist.`,
    );
  }
}

async function pngDimensions(filePath) {
  const header = await readFile(filePath);
  const signature = header.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || header.length < 24) {
    return null;
  }
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
  };
}

export async function validateRepository(rootDir) {
  const errors = [];
  const documents = new Map();

  for (const file of JSON_FILES) {
    try {
      const document = await readJson(rootDir, file);
      documents.set(file, document);
      inspectSecrets(errors, file, document);
    } catch (error) {
      errors.push(`${file}: cannot read valid JSON (${error.message}).`);
    }
  }

  const versionTargets = [
    ["server.json", ["version"]],
    ["package.json", ["version"]],
    [".claude-plugin/marketplace.json", ["version"]],
    ["plugins/maxstat/.codex-plugin/plugin.json", ["version"]],
    ["plugins/maxstat/.claude-plugin/plugin.json", ["version"]],
    ["gemini-extension.json", ["version"]],
  ];
  for (const [file, objectPath] of versionTargets) {
    if (documents.has(file)) {
      expectEqual(
        errors,
        file,
        objectPath.join("."),
        valueAt(documents.get(file), objectPath),
        RELEASE_VERSION,
      );
    }
  }

  const codexMarketplace = documents.get(".agents/plugins/marketplace.json");
  if (codexMarketplace) {
    if (Object.hasOwn(codexMarketplace, "version")) {
      errors.push(
        ".agents/plugins/marketplace.json: remove unsupported top-level version field.",
      );
    }
    expectEqual(
      errors,
      ".agents/plugins/marketplace.json",
      "plugins[0].source.path",
      codexMarketplace.plugins?.[0]?.source?.path,
      "./plugins/maxstat",
    );
    await checkRelativePath(
      errors,
      rootDir,
      ".agents/plugins/marketplace.json",
      codexMarketplace.plugins?.[0]?.source?.path,
    );
  }

  const claudeMarketplace = documents.get(".claude-plugin/marketplace.json");
  if (claudeMarketplace) {
    expectEqual(
      errors,
      ".claude-plugin/marketplace.json",
      "plugins[0].source",
      claudeMarketplace.plugins?.[0]?.source,
      "./plugins/maxstat",
    );
    if (Object.hasOwn(claudeMarketplace.plugins?.[0] ?? {}, "version")) {
      errors.push(
        ".claude-plugin/marketplace.json: keep the plugin version only in plugin.json.",
      );
    }
    await checkRelativePath(
      errors,
      rootDir,
      ".claude-plugin/marketplace.json",
      claudeMarketplace.plugins?.[0]?.source,
    );
  }

  const codexPluginFile = "plugins/maxstat/.codex-plugin/plugin.json";
  const codexPlugin = documents.get(codexPluginFile);
  if (codexPlugin) {
    for (const manifestPath of [
      codexPlugin.skills,
      codexPlugin.interface?.composerIcon,
      codexPlugin.interface?.logo,
    ]) {
      await checkRelativePath(
        errors,
        path.join(rootDir, "plugins/maxstat"),
        codexPluginFile,
        manifestPath,
      );
    }
    if ((codexPlugin.interface?.defaultPrompt?.length ?? 0) > 3) {
      errors.push(
        `${codexPluginFile}: interface.defaultPrompt supports at most 3 entries.`,
      );
    }
  }

  const claudePluginFile = "plugins/maxstat/.claude-plugin/plugin.json";
  const claudePlugin = documents.get(claudePluginFile);
  if (claudePlugin) {
    for (const manifestPath of [claudePlugin.skills, claudePlugin.mcpServers]) {
      await checkRelativePath(
        errors,
        path.join(rootDir, "plugins/maxstat"),
        claudePluginFile,
        manifestPath,
      );
    }
  }

  const serverManifest = documents.get("server.json");
  if (serverManifest) {
    const remote = serverManifest.remotes?.[0];
    const header = remote?.headers?.find((item) => item.name === TOKEN_HEADER);
    expectEqual(errors, "server.json", "remotes[0].url", remote?.url, MCP_URL);
    expectEqual(
      errors,
      "server.json",
      `${TOKEN_HEADER}.isRequired`,
      header?.isRequired,
      true,
    );
    expectEqual(
      errors,
      "server.json",
      `${TOKEN_HEADER}.isSecret`,
      header?.isSecret,
      true,
    );
  }

  if (codexPlugin) {
    expectEqual(
      errors,
      codexPluginFile,
      "mcpServers.maxstat.url",
      codexPlugin.mcpServers?.maxstat?.url,
      MCP_URL,
    );
    expectEqual(
      errors,
      codexPluginFile,
      `mcpServers.maxstat.env_http_headers.${TOKEN_HEADER}`,
      codexPlugin.mcpServers?.maxstat?.env_http_headers?.[TOKEN_HEADER],
      TOKEN_ENV,
    );
  }

  checkHttpConfig(
    errors,
    documents,
    "plugins/maxstat/.mcp.json",
    ["mcpServers", "maxstat"],
    "url",
    "${MAXSTAT_API_TOKEN}",
  );
  checkHttpConfig(
    errors,
    documents,
    "configs/claude-code.json",
    ["mcpServers", "maxstat"],
    "url",
    "${MAXSTAT_API_TOKEN}",
  );
  checkHttpConfig(
    errors,
    documents,
    "configs/cursor.json",
    ["mcpServers", "maxstat"],
    "url",
    "${env:MAXSTAT_API_TOKEN}",
  );
  checkHttpConfig(
    errors,
    documents,
    "configs/generic-mcp.json",
    ["mcpServers", "maxstat"],
    "url",
    "<API_TOKEN>",
  );
  checkHttpConfig(
    errors,
    documents,
    "configs/jetbrains.json",
    ["mcpServers", "maxstat"],
    "url",
    "<API_TOKEN>",
  );
  checkHttpConfig(
    errors,
    documents,
    "configs/vscode.json",
    ["servers", "maxstat"],
    "url",
    "${input:maxstat-api-token}",
  );
  checkHttpConfig(
    errors,
    documents,
    "configs/windsurf.json",
    ["mcpServers", "maxstat"],
    "serverUrl",
    "${env:MAXSTAT_API_TOKEN}",
  );
  checkHttpConfig(
    errors,
    documents,
    "mcp-config.example.json",
    ["mcpServers", "maxstat"],
    "url",
    "<API_TOKEN>",
  );

  const gemini = documents.get("gemini-extension.json");
  if (gemini) {
    expectEqual(
      errors,
      "gemini-extension.json",
      "mcpServers.maxstat.httpUrl",
      gemini.mcpServers?.maxstat?.httpUrl,
      MCP_URL,
    );
    expectEqual(
      errors,
      "gemini-extension.json",
      `mcpServers.maxstat.headers.${TOKEN_HEADER}`,
      gemini.mcpServers?.maxstat?.headers?.[TOKEN_HEADER],
      "${MAXSTAT_API_TOKEN}",
    );
    const setting = gemini.settings?.find((item) => item.envVar === TOKEN_ENV);
    expectEqual(
      errors,
      "gemini-extension.json",
      `${TOKEN_ENV}.sensitive`,
      setting?.sensitive,
      true,
    );
    expectEqual(
      errors,
      "gemini-extension.json",
      "contextFileName",
      gemini.contextFileName,
      "GEMINI.md",
    );
  }

  const claudeDesktop = documents.get("configs/claude-desktop.json");
  if (claudeDesktop) {
    const config = claudeDesktop.mcpServers?.maxstat;
    const args = config?.args ?? [];
    if (!args.includes(MCP_URL)) {
      errors.push(
        `configs/claude-desktop.json: mcp-remote args must include ${MCP_URL}.`,
      );
    }
    if (!args.includes("X-API-Token:${MAXSTAT_API_TOKEN}")) {
      errors.push(
        `configs/claude-desktop.json: mcp-remote must forward ${TOKEN_HEADER}.`,
      );
    }
    expectEqual(
      errors,
      "configs/claude-desktop.json",
      `mcpServers.maxstat.env.${TOKEN_ENV}`,
      config?.env?.[TOKEN_ENV],
      "<API_TOKEN>",
    );
  }

  const codexTomlPath = path.join(rootDir, "configs/codex.toml");
  try {
    const codexToml = await readFile(codexTomlPath, "utf8");
    for (const required of [
      MCP_URL,
      TOKEN_HEADER,
      TOKEN_ENV,
      "env_http_headers",
    ]) {
      if (!codexToml.includes(required)) {
        errors.push(`configs/codex.toml: missing ${required}.`);
      }
    }
    if (codexToml.includes("bearer_token_env_var")) {
      errors.push(
        `configs/codex.toml: MaxStat authentication must use ${TOKEN_HEADER}.`,
      );
    }
  } catch (error) {
    errors.push(`configs/codex.toml: cannot read file (${error.message}).`);
  }

  const skillFile = "plugins/maxstat/skills/maxstat-analytics/SKILL.md";
  try {
    const skill = await readFile(path.join(rootDir, skillFile), "utf8");
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatter) {
      errors.push(`${skillFile}: invalid YAML frontmatter delimiters.`);
    } else if (!/^name:\s*maxstat-analytics\s*$/m.test(frontmatter[1])) {
      errors.push(`${skillFile}: frontmatter name must be maxstat-analytics.`);
    }
    for (const heading of [
      "## Рабочий порядок",
      "## Сценарии",
      "## Безопасность",
      "## Справочник инструментов",
    ]) {
      if (!skill.includes(heading)) {
        errors.push(`${skillFile}: missing Russian heading ${heading}.`);
      }
    }
    for (const tool of TOOL_NAMES) {
      if (!skill.includes(`\`${tool}\``)) {
        errors.push(`${skillFile}: missing tool ${tool}.`);
      }
    }
  } catch (error) {
    errors.push(`${skillFile}: cannot read file (${error.message}).`);
  }

  for (const [file, minimumWidth, square] of [
    ["assets/maxstat-icon.png", 256, true],
    ["assets/maxstat-cline-400.png", 400, true],
    ["assets/maxstat-logo.png", 512, false],
    ["plugins/maxstat/assets/maxstat-icon.png", 256, true],
    ["plugins/maxstat/assets/maxstat-logo.png", 512, false],
  ]) {
    try {
      const dimensions = await pngDimensions(path.join(rootDir, file));
      if (
        !dimensions ||
        dimensions.width < minimumWidth ||
        (square && dimensions.width !== dimensions.height)
      ) {
        errors.push(`${file}: invalid PNG dimensions.`);
      }
    } catch (error) {
      errors.push(`${file}: cannot read PNG (${error.message}).`);
    }
  }

  try {
    const dimensions = await pngDimensions(
      path.join(rootDir, "assets/maxstat-cline-400.png"),
    );
    if (dimensions?.width !== 400 || dimensions?.height !== 400) {
      errors.push("assets/maxstat-cline-400.png: must be exactly 400×400.");
    }
  } catch (error) {
    errors.push(
      `assets/maxstat-cline-400.png: cannot read PNG (${error.message}).`,
    );
  }

  for (const mediaFile of [
    "assets/maxstat-mcp-demo.mp4",
    "assets/maxstat-mcp-demo.gif",
  ]) {
    if (!(await exists(path.join(rootDir, mediaFile)))) {
      errors.push(`${mediaFile}: required launch asset is missing.`);
    }
  }

  try {
    const readme = await readFile(path.join(rootDir, "README.md"), "utf8");
    for (const required of [
      "codex plugin marketplace add fbmdata/maxstat-mcp",
      "claude plugin marketplace add fbmdata/maxstat-mcp",
      "gemini extensions install https://github.com/fbmdata/maxstat-mcp",
      "configs/windsurf.json",
      "configs/jetbrains.json",
      "configs/claude-desktop.json",
      "OAuth 2.1",
    ]) {
      if (!readme.includes(required)) {
        errors.push(
          `README.md: missing canonical installation text ${required}.`,
        );
      }
    }
    if (readme.includes("--bearer-token-env-var")) {
      errors.push(
        `README.md: obsolete Codex bearer-token command is forbidden.`,
      );
    }
    if (
      readme.includes(
        "![Логотип ООО «ФБМ Аналитикс»](assets/maxstat-logo.png)",
      )
    ) {
      errors.push("README.md: duplicated full-width company logo is forbidden.");
    }
  } catch (error) {
    errors.push(`README.md: cannot read file (${error.message}).`);
  }

  for (const [file, required, forbidden] of [
    [
      "llms-install.md",
      [
        MCP_URL,
        "Streamable HTTP",
        TOKEN_HEADER,
        TOKEN_ENV,
        "get_account_limits",
        "tools/list",
      ],
      [/\bnpx\s+(?:-y\s+)?maxstat-mcp\b/i, /\bnpm\s+install\s+maxstat-mcp\b/i],
    ],
  ]) {
    try {
      const content = await readFile(path.join(rootDir, file), "utf8");
      for (const text of required) {
        if (!content.includes(text)) {
          errors.push(`${file}: missing required text ${text}.`);
        }
      }
      for (const pattern of forbidden) {
        if (pattern.test(content)) {
          errors.push(`${file}: contains forbidden local package install.`);
        }
      }
      if (/\b[0-9a-f]{64}\b/i.test(content)) {
        errors.push(`${file}: contains a token-like 64-character hex value.`);
      }
    } catch (error) {
      errors.push(`${file}: cannot read file (${error.message}).`);
    }
  }

  return errors;
}
