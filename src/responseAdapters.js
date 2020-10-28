export function getFacets(facets, queryConfig) {
    if (!queryConfig.facets || Object.entries(queryConfig.facets).length === 0) {
        return {};
    }

    const normalizedFacets = {};
    if (facets) {
        Object.entries(queryConfig.facets).forEach(([facetName, facet]) => {
            normalizedFacets[facetName] = [];
            const facetResponse = facets[facetName.replace(/[.:]/g, '_')];
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

export function getResults(hits, fields) {
    return hits.map(hit => {
        const result = {
            id: {
                // Default property that is required by rendering View component
                raw: hit.id
            }
        };
        fields.forEach(field => field.resolveResponseField(hit, result));
        return result;
    });
}
