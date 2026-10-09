---
# Allowed version bumps: patch, minor, major
search-ui-jahia-connector: patch
---

Changed the search request: the connector sends the search term, the sort, the filters and the page settings as GraphQL variables. Jahia receives a search term exactly as the visitor typed it.
