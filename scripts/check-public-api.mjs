#!/usr/bin/env node
import { TOOL_NAMES, validatePublicApi } from "./tool-contract.mjs";

const url = "https://maxstat.ru/api/openapi.json";

try {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    throw new Error(`OpenAPI request failed: HTTP ${response.status}.`);
  }
  const errors = validatePublicApi(await response.json());
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
  process.stdout.write(`Public OpenAPI matches all ${TOOL_NAMES.length} tools and credit costs.\n`);
} catch (error) {
  process.stderr.write(`Public API check failed: ${error.message}\n`);
  process.exitCode = 1;
}
