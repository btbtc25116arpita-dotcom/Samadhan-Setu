# Samadhan Setu

Samadhan Setu is a Jharkhand-focused civic innovation workspace that connects local challenges with people and organisations who can help solve them.

## Run & Operate

- Preview: `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/samadhan-setu run dev`
- The Replit workflow `Samadhan Setu Preview` runs the preview automatically.
- `pnpm --filter @workspace/samadhan-setu run typecheck` — typecheck the web app
- `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/samadhan-setu run build` — build the web app
- `pnpm run typecheck` — typecheck all workspace packages
- The current Samadhan Setu preview uses demo data and browser local storage; it does not require `DATABASE_URL` to launch.

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19 + Vite 7
- Styling: Tailwind CSS 4
- UI: Radix UI primitives, Lucide icons, Wouter routing
- Supporting API/database packages are present in the workspace but are not required by the current frontend demo.

## Where things live

- `artifacts/samadhan-setu/src/App.tsx` — main routes, role flows, demo data, and local-storage state
- `artifacts/samadhan-setu/src/index.css` — theme tokens and global styles
- `artifacts/samadhan-setu/vite.config.ts` — Vite, port, base path, and Replit preview settings
- `artifacts/samadhan-setu/.replit-artifact/artifact.toml` — artifact metadata and service configuration

## Architecture decisions

- The frontend is served at the workspace root (`/`) so the Replit preview opens directly to Samadhan Setu.
- Demo role and notification state is kept in browser local storage to make the imported prototype usable without external services.
- Vite is configured to read `PORT` and `BASE_PATH` from the workflow environment.

## Product

- Public landing and role-selection flows
- Citizen problem reporting
- Community problem management
- University innovation challenges
- Industry collaboration
- Projects, analytics, notifications, profile, and help screens
- Role-specific dashboards for citizens, students, faculty, industry, government, and community managers

## User preferences

No project-specific preferences recorded.

## Gotchas

- Use pnpm; the repository enforces pnpm through its preinstall script.
- The workspace-wide `pnpm run build` currently also builds `artifacts/mockup-sandbox`, whose Vite config requires a `PORT`; build Samadhan Setu directly with `PORT=5173 BASE_PATH=/` when validating this app alone.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
