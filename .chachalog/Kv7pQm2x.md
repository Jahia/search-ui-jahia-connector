---
# Allowed version bumps: patch, minor, major
search-ui-jahia-connector: major
---

BREAKING: the package is now ESM-only and ships TypeScript declarations. Removed Babel, replaced Jest with Vitest, and the build is now `tsc`. CommonJS consumers (`require()`) are no longer supported.
