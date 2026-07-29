---
# Allowed version bumps: patch, minor, major
search-ui-jahia-connector: major
---

Fixed searches containing quotes, ampersands, angle brackets or line breaks, which were altered or rejected before.

Search terms are now sent to Jahia exactly as typed. Previously they were HTML-escaped into the query text, so someone searching for `Ben & Jerry's` actually searched for `Ben &amp; Jerry&#39;s`, and pasting anything containing a line break failed the search outright. The same applies to facet values: selecting a value containing a quote used to break the search. Also fixed: a facet range starting at 0 no longer loses its lower bound, a hierarchical facet with no root path no longer sends the text "undefined", and searching for `0` now returns results for `0` instead of everything.

BREAKING: the search query is now sent with GraphQL variables rather than with every value written into the query text, which is what makes the above safe. If you call `Field.resolveRequestField()` yourself it now takes an argument and you should stop calling it directly — it is internal to building the query. If you pass a `workspace` that is not a valid GraphQL enum name, or a sort direction that is not one, the connector now reports the problem instead of sending a query the server rejects; check those values are plain names such as `LIVE` or `ASC`. Applications that only configure the connector and render Search UI components need no changes.
