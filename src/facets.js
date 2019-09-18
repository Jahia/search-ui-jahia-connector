const facetTypes = {
    value: 'VALUE',
    range: 'RANGE'
};

export default function facets(request) {
    if (Object.entries(request.facets).length === 0) {
        return ``;
    }
    let processedFacets = [];
    Object.entries(request.facets).forEach(([facetName, facetGroup]) => {
        //handle filter values
        let selections = [];
        request.filters.filter(filter => facetName === filter.field).forEach(filter => {
            if (filter) {
                switch (filter.type) {
                    case "value":
                        filter.values.forEach(value => selections.push(`{value: "${value}"}`));
                        break;
                    case "range":
                        //not implemented yet
                        return;
                }
            }
        });
        facetGroup.forEach(facet => {
            processedFacets.push(`{ field: "${facetName}", type: ${facetTypes[facet.type]}, ${facet.size ?  `max: ${facet.size},` : ''} disjunctive: ${facet.disjunctive} ${selections.length > 0 ? `, selections: [${selections.join(',')}]` : ''} }`);
        });
    });
    return `, facets: {facetsInput: [${processedFacets.join(',')}]}`;
}