import type {Field} from './field.js';
import type {
    FacetResponse,
    FacetTypeDeclaration,
    NormalizedFacets,
    SearchData,
    SearchHit,
    SearchResult
} from './types.js';

export function getFacets(
    facets: Partial<SearchData> | undefined,
    queryConfig: {facets?: Record<string, FacetTypeDeclaration>}
): NormalizedFacets {
    if (!queryConfig.facets || Object.entries(queryConfig.facets).length === 0) {
        return {};
    }

    const normalizedFacets: NormalizedFacets = {};
    if (facets) {
        Object.entries(queryConfig.facets).forEach(([facetName, facet]) => {
            normalizedFacets[facetName] = [];
            // The cast asserts two things the map cannot express: the alias resolves to a facet
            // rather than to `results`, and the facet is present at all. A facet declared in the
            // config but omitted from the response is undefined here, and the next line throws —
            // pinned by the characterization tests as a known bug.
            const facetResponse = facets[facetName.replace(/[.:]/g, '_')] as FacetResponse;
            facetResponse.field = facetName;
            facetResponse.type = facet.type;
            if (facet.type === 'date_range' || facet.type === 'range') {
                facetResponse.type = 'range';
                facetResponse.data = facetResponse.data.map(entry => ({count: entry.count, value: entry.name}));
            }

            normalizedFacets[facetName].push(facetResponse);
        });
    }

    return normalizedFacets;
}

export function getResults(hits: SearchHit[], fields: Field[]): SearchResult[] {
    return hits.map(hit => {
        const result: SearchResult = {
            id: {
                // Default property that is required by rendering View component
                raw: hit.id
            }
        };
        fields.forEach(field => field.resolveResponseField(hit, result));
        return result;
    });
}
