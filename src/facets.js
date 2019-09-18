const facetTypes = {
    value: 'VALUE',
    range: 'RANGE'
};

export default function facets(request, queryConfig) {
    if (Object.entries(queryConfig.facets).length === 0) {
        return ``;
    }
    let processedFacets = [];
    Object.entries(queryConfig.facets).forEach(([facetName, facet]) => {
        //handle filter values
        let selections = [];
        request.filters.filter(filter => facetName === filter.field).forEach(filter => {
            if (filter) {
                switch (facet.type) {
                    case "value":
                        filter.values.forEach(value => selections.push(`{value: "${value}"}`));
                        break;
                    case "range":
                        //not implemented yet
                        return;
                }
            }
        });
        processedFacets.push(`{ field: "${facetName}", type: ${facetTypes[facet.type]}, disjunctive:  ${!!facet.disjunctive} ${facet.size ?  `, max: ${facet.size},` : ''} ${selections.length > 0 ? `, selections: [${selections.join(',')}]` : ''} }`);
    });
    return `, facets: {facetsInput: [${processedFacets.join(',')}]}`;
}