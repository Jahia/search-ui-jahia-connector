# search-ui-jahia-connector Changelog

## 1.0.0

### Breaking Changes

* The package is now ESM-only and ships TypeScript declarations. (#102)

### Bug Fixes

* Changed the search request: the connector sends the search term, the sort, the filters and the page settings as GraphQL variables. Jahia receives a search term exactly as the visitor typed it.

* Fix searchTerm handling in GraphQL query (#92)

* Bump version to 2.0.17 (#91)
  Update release workflow for npm publishing, update to Yarn 4 and Node 20 via mise config (#88)

* Use 'yarn npm publish' for the registry publication (#94)
