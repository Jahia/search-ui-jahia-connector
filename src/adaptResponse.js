import {getFacets, getResults} from './responseAdapters';

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
