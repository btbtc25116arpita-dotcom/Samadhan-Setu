---
name: TypeScript JSX modules
description: TypeScript compiler behavior for JSX-bearing modules in this workspace
---

JSX-bearing modules must use the `.tsx` extension in this workspace, or avoid JSX syntax when the file intentionally remains `.ts`.

**Why:** The app’s TypeScript configuration parses `.ts` files as TypeScript-only, so JSX in a `.ts` module fails both typecheck and Vite transformation.

**How to apply:** Use `.tsx` for React components and provider modules; keep `.ts` for non-JSX utilities and types.