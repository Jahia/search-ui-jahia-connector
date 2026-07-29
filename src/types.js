/**
 * The shapes the connector exchanges with Search UI, named so that consumers can annotate their own
 * code with them. JSDoc only: this module emits no runtime code, and the package root re-exports
 * every type declared here.
 *
 * They describe what the connector actually reads and returns, which is a subset of Search UI's own
 * RequestState/QueryConfig — extra properties are accepted and ignored, as usual for object types.
 */

/**
 * One field of a result, in the form Search UI's View components read it: `raw` for plain values,
 * `snippet` for HTML-bearing ones (see the Field constructor's useSnippet).
 *
 * @typedef {{raw?: any, snippet?: any}} ResultField
 */

/**
 * A single hit: every field requested through result_fields, keyed by its alias — or by its name
 * with ':' replaced by '_' when no alias was given — plus the `id` the View components require.
 *
 * @typedef {Record<string, ResultField>} SearchResult
 */

/**
 * One range of a range or date_range facet. `from` and `to` reach Jahia verbatim, so they accept
 * whatever the backend does: numbers, ISO dates, or date math such as 'now-1w'.
 *
 * @typedef {Object} FacetRange
 * @property {string} name label of the range, and the value a selection of it carries
 * @property {string|number} [from] lower bound, inclusive
 * @property {string|number} [to] upper bound, exclusive
 */

/**
 * Configuration of one facet, keyed by field name under QueryConfig.facets.
 *
 * @typedef {Object} FacetConfig
 * @property {'value'|'range'|'date_range'} type
 * @property {boolean} [disjunctive] OR this facet's selections together instead of AND-ing them
 * @property {number} [max] cap on how many buckets come back
 * @property {number} [minDoc] minimum hit count for a bucket to come back (value facets)
 * @property {boolean} [hierarchical] request a tree facet rather than a term facet (value facets)
 * @property {string} [rootPath] subtree a hierarchical facet is rooted at
 * @property {FacetRange[]} [ranges] required by range and date_range facets
 */

/**
 * A facet selection, as Search UI reports it in the request state.
 *
 * @typedef {Object} SearchFilter
 * @property {string} field field name of the facet the selection belongs to
 * @property {string} [type] 'any' ORs the values together, anything else ANDs them
 * @property {any[]} values selected values: terms, or FacetRange names for range facets
 */

/**
 * The Search UI request state. Every property is optional — with none of them the connector queries
 * for an empty search term, page 1, 5 results per page.
 *
 * @typedef {Object} RequestState
 * @property {string} [searchTerm]
 * @property {number} [current] page number, 1-based
 * @property {number} [resultsPerPage]
 * @property {string} [sortField]
 * @property {string} [sortDirection] 'asc' or 'desc'; ignored unless sortField is set as well
 * @property {SearchFilter[]} [filters]
 */

/**
 * A query configuration passed to Search UI's SearchProvider: as searchQuery for onSearch, or as
 * autocompleteQuery for onAutocomplete, where the result configuration is nested under `results`.
 *
 * @typedef {Object} QueryConfig
 * @property {import('./field.js').Field[]} [result_fields] fields to request for every hit
 * @property {Record<string, FacetConfig>} [facets]
 * @property {number} [resultsPerPage]
 * @property {QueryConfig} [results] autocomplete only: the configuration of its result section
 * @property {Object} [suggestions] autocomplete only, and unsupported: the connector warns and ignores it
 */

/**
 * One bucket of a facet result.
 *
 * @typedef {Object} FacetResultEntry
 * @property {any} value
 * @property {number} count
 * @property {string} [key] tree facets only: the node the bucket stands for
 * @property {boolean} [hasChildren] tree facets only
 * @property {string} [rootPath] tree facets only
 * @property {string} [filter] tree facets only
 */

/**
 * The buckets of one facet, with the field and type they were requested under. date_range facets are
 * reported as 'range'.
 *
 * @typedef {Object} FacetResult
 * @property {string} field
 * @property {'value'|'range'} type
 * @property {FacetResultEntry[]} data
 */

/**
 * What onSearch resolves to. totalPages and totalResults are absent when nothing matched, and facets
 * only appears when the query configured some.
 *
 * @typedef {Object} ResponseState
 * @property {SearchResult[]} results
 * @property {string} requestId always empty: the Jahia API returns no request id
 * @property {number} [totalPages]
 * @property {number} [totalResults]
 * @property {Record<string, FacetResult[]>} [facets]
 */

/**
 * What onAutocomplete resolves to: nothing at all unless the autocomplete query configured a result
 * section, since suggestions are not supported.
 *
 * @typedef {Object} AutocompleteResponseState
 * @property {SearchResult[]} [autocompletedResults]
 */

export {};
