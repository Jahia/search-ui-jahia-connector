/**
 * The value of the filters argument of search, bound as a variable.
 *
 * @param {import('@elastic/search-ui').RequestState} request
 * @param {import('./types.js').JahiaQueryConfig} queryConfig
 * @param {{nodeType?: string}} graphQLOptions
 * @returns {Record<string, any>|undefined} undefined when nothing filters the search
 */
export default function filters(request, queryConfig, graphQLOptions) {
    const filters = {};
    if (graphQLOptions.nodeType) {
        filters.nodeType = {type: graphQLOptions.nodeType};
    }

    if (request.filters !== undefined && request.filters.length > 0) {
        const terms = {};
        const dateRanges = {};
        const numberRanges = {};
        request.filters.forEach(filter => {
            const facet = queryConfig.facets[filter.field];
            if (facet === undefined) {
                terms[filter.field] = {type: filter.type, terms: [{field: filter.field, value: filter.values[0]}]};
            } else {
                switch (facet.type) {
                    case 'range':
                        filter.values.forEach(value => {
                            const range = facet.ranges.find(range => range.name === value);
                            let numberRange = numberRanges[filter.field];
                            if (numberRange === undefined) {
                                numberRange = [];
                            }

                            numberRange.push({field: filter.field, gte: Number(range.from), lt: Number(range.to)});
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

                            dateRange.push({field: filter.field, after: range.from, before: range.to});
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

                            term.terms.push({field: filter.field, value});
                            terms[filter.field] = term;
                        });
                        break;
                }
            }
        });

        const custom = {};
        if (Object.keys(terms).length > 0) {
            custom.term = Object.values(terms).map(term => ({operation: term.type === 'any' ? 'OR' : 'AND', terms: term.terms}));
        }

        if (Object.keys(dateRanges).length > 0) {
            custom.dateRange = Object.values(dateRanges).map(ranges => ({operation: 'AND', ranges}));
        }

        if (Object.keys(numberRanges).length > 0) {
            custom.numberRange = Object.values(numberRanges).map(ranges => ({operation: 'AND', ranges}));
        }

        filters.custom = custom;
    }

    if (Object.keys(filters).length === 0) {
        return undefined;
    }

    return filters;
}
