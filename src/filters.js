export default function filters(request, queryConfig, graphQLOptions) {
    const filters = [];
    if (graphQLOptions.nodeType) {
        filters.push(`{nodeType:{type: "${graphQLOptions.nodeType}"}}`);
    }

    function getTerms(terms) {
        return `term: {operation: AND, terms:[${terms.join(',')}]}`;
    }

    function getDateRange(dateRanges) {
        return `dateRange: {operation: AND, ranges:[${dateRanges.join(',')}]}`;
    }

    function getNumberRange(numberRanges) {
        return `numberRange: {operation: AND, ranges:[${numberRanges.join(',')}]}`;
    }

    if (request.filters !== undefined && request.filters.length > 0) {
        const terms = [];
        const dateRanges = [];
        const numberRanges = [];
        request.filters.forEach(filter => {
            const facet = queryConfig.facets[filter.field];
            if (facet === undefined) {
                terms.push(`{field:"${filter.field}", value:"${filter.values[0]}"}`);
            } else {
                let range;
                switch (facet.type) {
                    case 'range':
                        range = facet.ranges.find(range => range.name === filter.values[0]);
                        numberRanges.push(`{field:"${filter.field}",gte:"${range.from}", lt:"${range.to}"}`);
                        break;
                    case 'date_range':
                        range = facet.ranges.find(range => range.name === filter.values[0]);
                        dateRanges.push(`{field:"${filter.field}",after:"${range.from}", before:"${range.to}"}`);
                        break;
                    case 'value':
                    default:
                        terms.push(`{field:"${filter.field}", value:"${filter.values[0]}"}`);
                        break;
                }
            }
        });
        filters.push(`{custom:{
        ${terms.length > 0 ? getTerms(terms) : ''}
        ${dateRanges.length > 0 ? getDateRange(dateRanges) : ''}
        ${numberRanges.length > 0 ? getNumberRange(numberRanges) : ''}
        }}`);
    }

    if (filters.length === 0) {
        return '';
    }
    console.log(
        `filters: ${filters.join(',')}`
    );

    return `filters: ${filters.join(',')}`;
}
