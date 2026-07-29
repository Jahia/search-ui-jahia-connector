---
# Allowed version bumps: patch, minor, major
search-ui-jahia-connector: major
---

BREAKING: the package is now ESM-only and ships TypeScript declarations. Removed Babel, replaced Jest with Vitest, and the build is now `tsc`. CommonJS consumers (`require()`) are no longer supported.

The connector, `Field` and `FieldType` are typed from the package root, along with the shapes of the contract — `JahiaSearchAPIConnectorOptions`, `RequestState`, `QueryConfig`, `ResponseState`, `AutocompleteResponseState`, `SearchResult`, `FacetConfig` and friends — so a TypeScript app can annotate its search configuration without redeclaring it.
