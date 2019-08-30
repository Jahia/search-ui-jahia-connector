import {getFacets, getResults} from './responseAdapters';

export default function adaptResponse(response, resultsPerPage) {
    const requestId = '';
    const results = getResults(response.data.jcr.searches.search.hits);
    if (results.length === 0) {
        return {
            results,
            requestId
        };
    }
    const totalPages = Math.ceil(response.data.jcr.searches.search.totalHits / resultsPerPage);
    const totalResults = response.data.jcr.searches.search.totalHits;

    const facets = getFacets(response);

    return {
        results,
        totalPages,
        totalResults,
        requestId,
        ...(Object.keys(facets).length > 0 && {facets})
    };
}
