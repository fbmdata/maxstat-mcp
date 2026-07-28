#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateRepository } from "./integration-contract.mjs";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const errors = await validateRepository(rootDir);

if (errors.length > 0) {
  for (const error of errors) {
    process.stderr.write(`- ${error}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write("All integration manifests are valid.\n");
}
