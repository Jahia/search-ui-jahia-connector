export function getFacets(facets) {
    let normalizedFacets = {};
    facets.forEach(facet => {
        normalizedFacets[facet.field] = [];
        normalizedFacets[facet.field].push(facet);
    });
    return normalizedFacets;
}

export function getResults(hits, fields) {
    return hits.filter(hit => {
        return hit.node !== null;
    }).map(hit => {
        let result = {
            id: {
                //Default property that is required by rendering View component
                raw: hit.node.uuid
            }
        };
        fields.forEach(field => field.resolveResponseField(hit, result));
        return result;
    });
}
