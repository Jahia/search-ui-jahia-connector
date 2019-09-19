const facetTypes = {
    value: 'VALUE',
    range: 'RANGE'
};

export default function facets(request, queryConfig) {
    if (!queryConfig.facets || Object.entries(queryConfig.facets).length === 0) {
        return ``;
    }
    let processedFacets = [];
    Object.entries(queryConfig.facets).forEach(([facetName, facet]) => {
        //handle filter values
        let selections = [];
        let filters = request.filters;
        if (filters) {
            filters.filter(filter => facetName === filter.field).forEach(filter => {
                switch (facet.type) {
                    case "value":
                    default:
                        filter.values.forEach(value => selections.push(`{value: "${value}"}`));
                        break;
                        //Other cases to be implemented in the future
                }
            });
        }
        processedFacets.push(`{ field: "${facetName}", type: ${facetTypes[facet.type]}, disjunctive:  ${!!facet.disjunctive} ${facet.size ?  `, max: ${facet.size},` : ''} ${selections.length > 0 ? `, selections: [${selections.join(',')}]` : ''} }`);
    });
    return `, facetsInput: {facets: [${processedFacets.join(',')}]}`;
}