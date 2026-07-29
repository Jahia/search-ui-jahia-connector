---
# Allowed version bumps: patch, minor, major
search-ui-jahia-connector: minor
---

Added accurate types for the connector options, field, facet and result shapes, so mistakes in a search configuration are caught while you build instead of coming back as a failed query. TypeScript users get these automatically — no `@types/` package, and no change to how the connector behaves at run time. If your project already type-checks against this package, a configuration that was previously accepted as `any` may now be reported as an error; the reported property is the one to correct.
