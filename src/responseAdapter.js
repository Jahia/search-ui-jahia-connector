import { getFacets, getResults } from "./responseAdapters";

export default function adaptResponse(response, resultsPerPage) {
    const results = getResults(response.data.jcr.searches.search.hits);
    const totalPages = Math.ceil(response.data.jcr.searches.search.totalHits/resultsPerPage);
    const totalResults = response.data.jcr.searches.search.totalHits;
    const requestId = "";
    const facets = getFacets(response);

    return {
        results,
        totalPages,
        totalResults,
        requestId,
        ...(Object.keys(facets).length > 0 && { facets })
    };
}
