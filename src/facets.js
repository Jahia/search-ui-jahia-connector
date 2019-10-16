const facetTypeToInput = {
    value: 'term',
    range: 'numberRange',
    // eslint-disable-next-line camelcase
    date_range: 'dateRange'
};

function buildRangeValue(range) {
    let args = [`name: "${range.name}"`];
    if (range.from) {
        args.push(`from: "${range.from}"`);
    }

    if (range.to) {
        args.push(`to: "${range.to}"`);
    }

    return `{${args.join(',')}}`;
}

export default function facets(request, queryConfig) {
    if (!queryConfig.facets || Object.entries(queryConfig.facets).length === 0) {
        return '';
    }

    let processedFacets = {};
    Object.entries(queryConfig.facets).forEach(([facetName, facet]) => {
        // Handle filter values
        let filters = request.filters;
        if (processedFacets[facet.type] === undefined) {
            processedFacets[facet.type] = {};
        }

        processedFacets[facet.type][facetName] = {facet: facet};
        if (filters) {
            let selections = [];
            filters.filter(filter => facetName === filter.field).forEach(filter => {
                switch (facet.type) {
                    case 'range':
                    case 'date_range':
                        filter.values.forEach(value => selections.push(buildRangeValue(value)));
                        break;
                    case 'value':
                    default:
                        filter.values.forEach(value => selections.push(`"${value}"`));
                        break;
                    // Other cases to be implemented in the future
                }
            });
            processedFacets[facet.type][facetName].selections = selections;
        }
    });
    let facetInputs = [];
    Object.entries(processedFacets).forEach(([facetType, facetGroup]) => {
        let processedFacetGroups = [];
        Object.entries(facetGroup).forEach(([facetName, facet]) => {
            if (facetType === 'value') {
                processedFacetGroups.push(`{ field: "${facetName}", disjunctive: ${Boolean(facet.facet.disjunctive)} ${facet.facet.size ? `, max: ${facet.facet.size},` : ''} ${facet.selections !== undefined && facet.selections.length > 0 ? `, selections: [${facet.selections.join(',')}]` : ''} }`);
            } else if (facetType === 'date_range' || facetType === 'range') {
                processedFacetGroups.push(`{ field: "${facetName}", ranges:[${facet.facet.ranges.map(range => `${buildRangeValue(range)}`).join(',')}], disjunctive: ${Boolean(facet.facet.disjunctive)} ${facet.facet.size ? `, max: ${facet.facet.size},` : ''} ${facet.selections !== undefined && facet.selections.length > 0 ? `, selections: [${facet.selections.join(',')}]` : ''} }`);
            }
        });
        facetInputs.push(`${facetTypeToInput[facetType]}: [${processedFacetGroups.join(',')}]`);
    });
    return `, facets: {${facetInputs.join(',')}}`;
}
