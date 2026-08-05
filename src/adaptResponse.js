import {getFacets, getResults} from './responseAdapters.js';

/**
 * Adapt a Jahia Augmented Search response into the state Search UI renders from.
 *
 * @param {any} response the raw GraphQL response body
 * @param {number|undefined} resultsPerPage page size the query was made with, used to derive
 * totalPages. Undefined when the request state left it out — the query then defaults to 5 but
 * totalPages comes out NaN, which is pre-existing behaviour, not something the types should hide
 * @param {import('./types.js').JahiaQueryConfig|import('./types.js').JahiaAutocompleteQueryConfig} queryConfig
 * @returns {import('./types.js').JahiaResponseState}
 */
export default function adaptResponse(response, resultsPerPage, queryConfig) {
    const requestId = '';
    const fields = 'results' in queryConfig ? queryConfig.results.result_fields : queryConfig.result_fields;
    const resultsResponse = response.data.search.results;
    const results = getResults(resultsResponse.hits, fields);
    if (results.length === 0) {
        return {
            results,
            requestId
        };
    }

    const totalResults = resultsResponse.totalHits;
    const totalPages = Math.ceil(totalResults / resultsPerPage);

    delete resultsResponse.results;
    const facets = getFacets(response.data.search, queryConfig);
    return {
        results,
        totalPages,
        totalResults,
        requestId,
        ...(Object.keys(facets).length > 0 && {facets})
    };
}
