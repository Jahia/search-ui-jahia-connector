// A bound that the configuration leaves out stays out of the variable.
const toText = value => (value === undefined || value === null ? undefined : String(value));
const toNumber = value => (value === undefined || value === null ? undefined : Number(value));

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
        filters.nodeType = {type: String(graphQLOptions.nodeType)};
    }

    if (request.filters !== undefined && request.filters.length > 0) {
        const facets = queryConfig.facets || {};
        const terms = {};
        const dateRanges = {};
        const numberRanges = {};
        request.filters.forEach(filter => {
            const field = String(filter.field);
            const values = filter.values || [];
            if (values.length === 0) {
                return;
            }

            const facet = facets[filter.field];
            if (facet === undefined) {
                terms[field] = {type: filter.type, terms: [{field, value: String(values[0])}]};
            } else {
                switch (facet.type) {
                    case 'range':
                        values.forEach(value => {
                            const range = facet.ranges.find(range => range.name === value);
                            if (range === undefined) {
                                return;
                            }

                            let numberRange = numberRanges[field];
                            if (numberRange === undefined) {
                                numberRange = [];
                            }

                            numberRange.push({field, gte: toNumber(range.from), lt: toNumber(range.to)});
                            numberRanges[field] = numberRange;
                        });
                        break;
                    case 'date_range':
                        values.forEach(value => {
                            const range = facet.ranges.find(range => range.name === value);
                            if (range === undefined) {
                                return;
                            }

                            let dateRange = dateRanges[field];
                            if (dateRange === undefined) {
                                dateRange = [];
                            }

                            dateRange.push({field, after: toText(range.from), before: toText(range.to)});
                            dateRanges[field] = dateRange;
                        });
                        break;
                    case 'value':
                    default:
                        values.forEach(value => {
                            let term = terms[field];
                            if (term === undefined) {
                                term = {type: filter.type, terms: []};
                            }

                            term.terms.push({field, value: String(value)});
                            terms[field] = term;
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

        if (Object.keys(custom).length > 0) {
            filters.custom = custom;
        }
    }

    if (Object.keys(filters).length === 0) {
        return undefined;
    }

    return filters;
}
