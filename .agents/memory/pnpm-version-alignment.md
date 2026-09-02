---
name: pnpm version alignment
description: Environment-specific pnpm behavior during imported workspace setup
---

When an imported workspace declares a pnpm version that differs from the installed Replit pnpm executable, the wrapper may stall while trying to self-download the declared version through the package firewall. Aligning the root packageManager declaration with the installed executable lets the existing lockfile install normally.

**Why:** The version download can fail or hang before dependency resolution starts, leaving the preview workflow unable to open its configured port even though the app configuration is otherwise valid.

**How to apply:** Check the installed pnpm version and the root packageManager field before diagnosing the app itself. Preserve the existing lockfile and workspace structure; only align the declaration when the environment cannot obtain the declared version.