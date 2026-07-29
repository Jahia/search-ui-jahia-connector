/**
 * The connector's contract, expressed in Search UI's own types — @elastic/search-ui exports
 * RequestState, QueryConfig, ResponseState and friends, so only what Jahia genuinely diverges on is
 * declared here. JSDoc only: this module emits no runtime code.
 *
 * Import RequestState, Filter, SearchResult, Facet and the rest straight from @elastic/search-ui;
 * the connector uses them unchanged.
 *
 * Three divergences, all of them real:
 *
 * 1. result_fields holds Field instances, not Search UI's Record<string, FieldConfiguration>. The
 *    Jahia API needs to know whether a field comes off the ES hit or the JCR node, which is what
 *    Field encodes.
 * 2. Facets take Jahia-only options (disjunctive, hierarchical, rootPath, max, minDoc) and only
 *    three of the facet types exist here.
 * 3. Neither response is a complete Search UI response state: the connector fills in what the Jahia
 *    API returns and leaves the rest to Search UI's defaults, so the missing keys are typed away
 *    rather than pretended into existence.
 */

/**
 * Configuration of one facet, keyed by field name. Search UI's FacetConfiguration types `type` as a
 * bare string; here it is one of the three Jahia builds a query for. `ranges` is Search UI's
 * FilterValueRange, whose from/to reach Jahia verbatim — numbers, ISO dates, or date math like
 * 'now-1w'.
 *
 * @typedef {Omit<import('@elastic/search-ui').FacetConfiguration, 'type'> & {
 *     type: 'value'|'range'|'date_range',
 *     disjunctive?: boolean,
 *     hierarchical?: boolean,
 *     rootPath?: string,
 *     max?: number,
 *     minDoc?: number
 * }} JahiaFacetConfiguration
 */

/**
 * A search query configuration — Search UI's QueryConfig with the two Jahia-specific substitutions.
 *
 * @typedef {Omit<import('@elastic/search-ui').QueryConfig, 'result_fields'|'facets'> & {
 *     result_fields?: import('./field.js').Field[],
 *     facets?: Record<string, JahiaFacetConfiguration>
 * }} JahiaQueryConfig
 */

/**
 * An autocomplete query configuration. `suggestions` is accepted so that a Search UI configuration
 * type-checks, but the Jahia API has none: asking for them warns and returns nothing.
 *
 * @typedef {{
 *     results?: JahiaQueryConfig,
 *     suggestions?: import('@elastic/search-ui').SuggestionsQueryConfig
 * }} JahiaAutocompleteQueryConfig
 */

/**
 * One bucket of a facet result. Search UI types ResponseState.facets as Record<string, any>, so this
 * says what Jahia actually puts there: its FacetValue, plus the keys tree facets add.
 *
 * @typedef {import('@elastic/search-ui').FacetValue & {
 *     key?: string,
 *     hasChildren?: boolean,
 *     rootPath?: string,
 *     filter?: string
 * }} JahiaFacetValue
 */

/**
 * The buckets of one facet, under the field and type it was requested with. date_range facets come
 * back as 'range'.
 *
 * @typedef {Omit<import('@elastic/search-ui').Facet, 'data'> & {data: JahiaFacetValue[]}} JahiaFacet
 */

/**
 * What onSearch resolves to: the slice of Search UI's ResponseState this connector fills in.
 * totalPages and totalResults are absent when nothing matched, and facets only appears when the
 * query configured some.
 *
 * @typedef {Pick<import('@elastic/search-ui').ResponseState, 'results'|'requestId'>
 *     & {totalPages?: number, totalResults?: number, facets?: Record<string, JahiaFacet[]>}
 * } JahiaResponseState
 */

/**
 * What onAutocomplete resolves to: nothing at all unless the query configured a result section,
 * since the Jahia API has no suggestions.
 *
 * @typedef {Partial<Pick<import('@elastic/search-ui').AutocompleteResponseState, 'autocompletedResults'>>} JahiaAutocompleteResponseState
 */

export {};
