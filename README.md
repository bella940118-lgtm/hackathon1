# Splitzy

Splitzy helps friends scan a receipt, divide the bill fairly, and settle up. The hackathon tagline is **Scan. Split. Settle.** This repository contains the shared project foundation and a responsive homepage; it is not a complete expense-splitting app yet.

## Run Splitzy on your computer

You need Node.js 20.9 or newer and npm. From this folder, open a terminal and run:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). To stop the local server, press `Ctrl+C` in the terminal.

Before opening a pull request, run:

```bash
npm run typecheck
npm run build
```

## Project map

- `src/app/` — Next.js App Router pages and API routes
- `src/app/groups/` — group creation feature starting point
- `src/app/scan/` — receipt scanning feature starting point
- `src/app/api/receipt/` — demo receipt endpoint (`GET /api/receipt`)
- `src/components/` — reusable interface pieces
- `src/lib/splitting/` — place for independent split and settlement calculations
- `src/lib/receipt/` — receipt helpers and sample data
- `src/types/` — shared TypeScript contracts for groups, members, receipts, items, and expenses

The sample receipt is returned by `http://localhost:3000/api/receipt` and works without an Anthropic key. Receipt recognition is planned to use the Anthropic Claude API; that integration is not implemented yet. `.env.example` lists the optional `ANTHROPIC_API_KEY` variable for later development. If you need a local `.env.local`, copy the example and put your own key there; `.env.local` is ignored by Git, so never commit the file or share the key.

## Two-person GitHub workflow

`main` is the shared foundation. Once both developers are ready, create the planned branches from the latest `main`:

- `feature/frontend` — group management, UI, item splitting, tax/tip calculations, and settlement
- `feature/ai-scanner` — receipt upload, Anthropic Claude API integration, and receipt recognition/extraction

Work on your own branch, commit small changes, and open a pull request back to `main` for your teammate to review. Agree before changing shared types in `src/types/index.ts`. See [AGENTS.md](./AGENTS.md) for the collaboration rules. No feature branches have been created as part of this foundation setup.

## Current limits

There are no real payments, database, authentication, or live Anthropic Claude API integration in this foundation. The groups and scan pages are simple placeholders for the feature branches.
