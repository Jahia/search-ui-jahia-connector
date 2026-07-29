import type {Field} from './field.js';

/**
 * The shapes exchanged with Search UI and with the Jahia GraphQL search API.
 *
 * These describe what the connector actually reads, not the full Search UI contract: Search UI hands
 * its whole request state and query config to the connector, and only a subset of each is used.
 */

/** A single value on an adapted result, as consumed by Search UI's View components. */
export interface ResultField {
    raw?: unknown;
    snippet?: unknown;
}

/** An adapted result: one entry per configured field, keyed by alias, plus the always-present `id`. */
export type SearchResult = Record<string, ResultField>;

/** A hit as returned by the search API. The properties beyond `id` are the ones that were requested. */
export interface SearchHit {
    id: string;
    [property: string]: unknown;
}

/** A named bound, used both to declare a range facet and to report a selected one. */
export interface FacetRange {
    name: string;
    from?: string | number;
    to?: string | number;
}

/** A term facet, or — when `hierarchical` is `true` — a tree facet. */
export interface ValueFacetConfig {
    type: 'value';
    /** Render as a tree facet rather than a term facet. Only a literal `true` counts. */
    hierarchical?: boolean;
    /** Root of the tree. Tree facets only. */
    rootPath?: string;
    disjunctive?: boolean;
    max?: number;
    minDoc?: number;
}

/** A numeric (`range`) or date (`date_range`) facet. Both emit a `rangeFacet` query. */
export interface RangeFacetConfig {
    type: 'range' | 'date_range';
    ranges: FacetRange[];
    disjunctive?: boolean;
    max?: number;
    minDoc?: number;
}

export type FacetConfig = ValueFacetConfig | RangeFacetConfig;

/**
 * The part of a facet declaration the response side needs. Normalizing a response is keyed entirely
 * off each facet's type, so `getFacets` asks for no more than that.
 */
export interface FacetTypeDeclaration {
    type: FacetConfig['type'];
}

/**
 * The query config as handed to the connector by Search UI.
 *
 * `onSearch` receives it flat; `onAutocomplete` receives the results query nested under `results`.
 * Both `adaptRequest` and `adaptResponse` discriminate on `'results' in queryConfig`.
 */
export interface QueryConfig {
    /**
     * The fields to request and how to expose them on each result. An array in practice; a record
     * keyed by anything is also accepted, since only `Field` instances are read out of it.
     */
    result_fields?: Field[] | Record<string, unknown>;
    facets?: Record<string, FacetConfig>;
    /** Autocomplete only: the results query, one level down. */
    results?: QueryConfig & {resultsPerPage?: number};
    /** Autocomplete only, and unsupported — its presence triggers a warning. */
    suggestions?: unknown;
}

/** A facet selection made by the user, as carried in Search UI's request state. */
export interface RequestFilter {
    field: string;
    values: Array<string | FacetRange>;
    /** `any` maps to a GraphQL `OR` operation; anything else to `AND`. */
    type?: string;
}

/** The subset of Search UI's request state the connector reads. */
export interface RequestState {
    searchTerm?: string;
    resultsPerPage?: number;
    /** 1-based page number; the API is 0-based, so `adaptRequest` subtracts one. */
    current?: number;
    sortField?: string;
    sortDirection?: string;
    filters?: RequestFilter[];
}

/** The connector-level options folded into every request. */
export interface RequestOptions {
    siteKey: string;
    language: string;
    workspace: string;
    nodeType?: string;
    functionScore: string;
    resultsPerPage?: number;
}

export interface SearchResultsResponse {
    totalHits: number;
    took?: string;
    hits: SearchHit[];
}

/** One entry of a facet's `data` array. Term facets carry `value`, range facets `name`. */
export interface FacetDataEntry {
    count: number;
    value?: string;
    name?: string;
    [key: string]: unknown;
}

/**
 * A facet as returned by the API. `field` and `type` are not sent by the backend — `getFacets`
 * writes them onto the response object in place.
 */
export interface FacetResponse {
    data: FacetDataEntry[];
    field?: string;
    type?: string;
}

/** The `search` payload: the results, plus one entry per configured facet keyed by sanitized alias. */
export interface SearchData {
    results: SearchResultsResponse;
    [facetAlias: string]: SearchResultsResponse | FacetResponse;
}

export interface SearchResponse {
    data: {search: SearchData};
}

/** Facets normalized for Search UI: a single-element array per configured facet, keyed by field name. */
export type NormalizedFacets = Record<string, FacetResponse[]>;

/** What `onSearch` resolves to. `totalPages`, `totalResults` and `facets` are absent on no results. */
export interface AdaptedResponse {
    results: SearchResult[];
    requestId: string;
    totalPages?: number;
    totalResults?: number;
    facets?: NormalizedFacets;
}

/** What `onAutocomplete` resolves to. Empty when the query config asks for no results. */
export interface AutocompleteResponse {
    autocompletedResults?: SearchResult[];
}
