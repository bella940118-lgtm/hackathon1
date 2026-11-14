# Splitzy collaboration notes

## Work together safely

- Keep this as the shared `main` foundation. Do not force-push or rewrite shared history.
- Each developer should work on their assigned feature branch and open a pull request to `main` for the other developer to review.
- Agree on the files and interface changes before editing shared contracts. Keep `src/types/index.ts` stable while the two feature branches are in progress.
- `feature/frontend` owns group management, UI, item splitting, tax/tip calculations, and settlement.
- `feature/ai-scanner` owns receipt upload, Anthropic Claude API integration, and receipt recognition/extraction.
- Pull or rebase from `main` before starting and before opening a pull request. Resolve conflicts together, especially in shared files.
- Make small commits with clear messages. Never commit `.env.local`, API keys, customer data, or generated build output.
- Run `npm run typecheck` and `npm run build` before asking for review. Do not merge without both developers reviewing the change.

## Shared data contract

Import `Group`, `Member`, `Receipt`, `ReceiptItem`, and `Expense` from `@/types`. If a feature needs a contract change, discuss it first and update this shared file on `main` before rebasing both feature branches.

## Receipt recognition configuration

- The planned receipt recognition provider is Anthropic Claude.
- Use `ANTHROPIC_API_KEY` for local development, stored only in the ignored `.env.local` file.
- Keep `.env.example` as a key-free template. Do not add API keys to source files, commits, or pull requests.
- The Claude API integration is not implemented in the foundation; the mock receipt remains available without credentials.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
