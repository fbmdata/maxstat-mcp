# MaxStat MCP Market Launch Implementation Plan

> **For Codex:** Execute each task in order and verify every external mutation
> from the reader's point of view.

**Goal:** Correct the two directory submissions, publish MCP discovery metadata,
prove Cline compatibility, and ship Russian launch assets for MaxStat MCP.

**Architecture:** The public `fbmdata/maxstat-mcp` repository remains the
canonical integration package. Discovery routes live in the separate MaxStat
Next.js application and serve a shared static server card. Marketplace changes
use the platforms' author flows. Marketing assets are generated reproducibly
from tracked source files and existing brand assets.

**Tech Stack:** Node.js 20+, Next.js App Router, Cline CLI, GitHub CLI, Railway
CLI, ffmpeg, Markdown/JSON.

---

## Task 1: Lock the public package contract

**Files:**

- Create: `llms-install.md`
- Create: `docs/launch-kit.ru.md`
- Modify: `README.md`
- Modify: `docs/catalog-submissions.md`
- Modify: `scripts/integration-contract.mjs`
- Modify: `tests/integration-contract.test.mjs`

1. Add failing tests for the Cline install guide, launch-kit coverage and
   forbidden local/npm installation claims.
2. Run `npm test` and confirm the new assertions fail.
3. Add the agent installation guide and Russian launch content.
4. Link both documents from the README and update the catalog ledger.
5. Run `npm test`, `npm run validate` and Markdown lint.

## Task 2: Publish the discovery server card

**Files in clean MaxStat site worktree:**

- Create: `frontend/app/.well-known/mcp-card.ts`
- Create: `frontend/app/.well-known/mcp.json/route.ts`
- Create: `frontend/app/.well-known/mcp/server-card.json/route.ts`
- Create: `frontend/tests/mcp-discovery.test.mjs`

1. Add a failing route-contract test.
2. Implement one immutable card and two GET route handlers.
3. Verify JSON, CORS, cache and endpoint metadata.
4. Run the focused test, frontend tests, CI check, typecheck and production
   build.
5. Commit and push through the production repository/pipeline.
6. Wait for the deployment and verify both live URLs.

## Task 3: Correct ServerHub and complete 402.ad

1. Open the existing ServerHub author listing.
2. Replace the generated npm command with the hosted endpoint configuration.
3. Verify the public listing no longer instructs users to run `npx`.
4. Complete the existing 402.ad form and challenge.
5. Verify the public or pending submission record.
6. Record final URLs/statuses in `docs/catalog-submissions.md`.

## Task 4: Verify and submit Cline

**Files:**

- Create: `assets/maxstat-cline-400.png`

1. Produce an exact 400×400 PNG from the existing square icon.
2. Install or run the official Cline CLI with an isolated data directory.
3. Give Cline only the repository installation guide, configure the remote
   server, and verify tool discovery plus a read-only tool call.
4. Remove the isolated secret-bearing data.
5. Create the official Marketplace submission issue with the required fields
   and image.
6. Verify the issue and update the catalog ledger.

## Task 5: Render the Russian demo video

**Files:**

- Create: `scripts/render-demo-video.sh`
- Create: `assets/maxstat-mcp-demo.mp4`
- Create: `assets/maxstat-mcp-demo.gif`

1. Add the rendering script with deterministic scene timing and brand colors.
2. Render MP4 and GIF assets from the existing logo/icon.
3. Verify codec, pixel format, dimensions, duration and GIF size.
4. Link the preview and download from `docs/launch-kit.ru.md`.

## Task 6: Release and final verification

1. Run all repository tests, validation and Markdown lint.
2. Scan tracked content for secret-like values and the supplied token.
3. Commit the scoped integration-package changes.
4. Push the branch, merge to `main`, and verify GitHub Actions.
5. Re-run live MCP and discovery checks.
6. Confirm ServerHub, 402.ad and Cline Marketplace statuses from their public
   pages.
