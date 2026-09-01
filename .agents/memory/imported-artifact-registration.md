---
name: Imported artifact registration
description: Platform behavior observed when a repository is imported with existing artifact metadata.
---

An imported artifact can have a valid `.replit-artifact/artifact.toml` and a running workflow while still being absent from the artifact registry used by presentation and screenshot helpers.

**Why:** In that state, artifact lookup and presentation fail even though the Vite server responds normally; treating the registry failure as an app failure leads to unnecessary restructuring.

**How to apply:** Check `listArtifacts()` before presenting an imported app. If it is empty, preserve the imported structure, verify the configured workflow and HTTP response directly, and avoid creating a duplicate artifact for the existing slug.