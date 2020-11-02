export default function filters(request, queryConfig, graphQLOptions) {
    const filters = [];
    if (graphQLOptions.nodeType) {
        filters.push(`{nodeType:{type: "${graphQLOptions.nodeType}"}}`);
    }

    function getTerms(terms) {
        return Object.keys(terms).map(value => `term: {operation: ${terms[value].type === 'any' ? 'OR' : 'AND'}, terms:[${terms[value].terms.join(',')}]}`).join(',');
    }

    function getDateRange(dateRanges) {
        return Object.keys(dateRanges).map(value => `dateRange: {operation: AND, ranges:[${dateRanges[value].join(',')}]}`).join(',');
    }

    function getNumberRange(numberRanges) {
        return Object.keys(numberRanges).map(value => `numberRange: {operation: AND, ranges:[${numberRanges[value].join(',')}]}`).join(',');
    }

    if (request.filters !== undefined && request.filters.length > 0) {
        const terms = {};
        const dateRanges = {};
        const numberRanges = {};
        request.filters.forEach(filter => {
            const facet = queryConfig.facets[filter.field];
            if (facet === undefined) {
                terms.push(`{field:"${filter.field}", value:"${filter.values[0]}"}`);
            } else {
                switch (facet.type) {
                    case 'range':
                        filter.values.forEach(value => {
                            const range = facet.ranges.find(range => range.name === value);
                            let numberRange = numberRanges[filter.field];
                            if (numberRange === undefined) {
                                numberRange = [];
                            }

                            numberRange.push(`{field:"${filter.field}",gte:"${range.from}", lt:"${range.to}"}`);
                            numberRanges[filter.field] = numberRange;
                        });
                        break;
                    case 'date_range':
                        filter.values.forEach(value => {
                            const range = facet.ranges.find(range => range.name === value);
                            let dateRange = dateRanges[filter.field];
                            if (dateRange === undefined) {
                                dateRange = [];
                            }

                            dateRange.push(`{field:"${filter.field}",after:"${range.from}", before:"${range.to}"}`);
                            dateRanges[filter.field] = dateRange;
                        });
                        break;
                    case 'value':
                    default:
                        filter.values.forEach(value => {
                            let term = terms[filter.field];
                            if (term === undefined) {
                                term = {type: filter.type, terms: []};
                            }

                            term.terms.push(`{field:"${filter.field}", value:"${value}"}`);
                            terms[filter.field] = term;
                        });
                        break;
                }
            }
        });
        filters.push(`{custom:{
        ${Object.keys(terms).length > 0 ? getTerms(terms) : ''}
        ${Object.keys(dateRanges).length > 0 ? getDateRange(dateRanges) : ''}
        ${Object.keys(numberRanges).length > 0 ? getNumberRange(numberRanges) : ''}
        }}`);
    }

    if (filters.length === 0) {
        return '';
    }

    return `filters: ${filters.join(',')}`;
}
