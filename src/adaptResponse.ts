import {getFacets, getResults} from './responseAdapters.js';
import type {Field} from './field.js';
import type {AdaptedResponse, QueryConfig, SearchResponse} from './types.js';

export default function adaptResponse(
    response: SearchResponse,
    resultsPerPage: number | undefined,
    queryConfig: QueryConfig
): AdaptedResponse {
    const requestId = '';
    // Non-null: `in` proves the key is present but does not un-optional the declared type.
    const fields = 'results' in queryConfig ? queryConfig.results!.result_fields : queryConfig.result_fields;
    const resultsResponse = response.data.search.results;
    const results = getResults(resultsResponse.hits, fields as Field[]);
    if (results.length === 0) {
        return {
            results,
            requestId
        };
    }

    const totalResults = resultsResponse.totalHits;
    // Non-null: an absent page size yields NaN pages rather than throwing, unchanged.
    const totalPages = Math.ceil(totalResults / resultsPerPage!);

    // A no-op carried over from the JS implementation: the results payload has no `results` key.
    delete (resultsResponse as {results?: unknown}).results;
    const facets = getFacets(response.data.search, queryConfig);
    return {
        results,
        totalPages,
        totalResults,
        requestId,
        ...(Object.keys(facets).length > 0 && {facets})
    };
}
