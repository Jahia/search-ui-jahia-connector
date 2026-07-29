import type {FacetConfig, FacetRange, QueryConfig, RequestState} from './types.js';

interface TermGroup {
    /** The Search UI filter type: `any` becomes `OR`, anything else `AND`. */
    type?: string;
    terms: string[];
}

export default function filters(
    request: RequestState,
    queryConfig: QueryConfig,
    graphQLOptions: {nodeType?: string}
): string {
    const filters: string[] = [];
    if (graphQLOptions.nodeType) {
        filters.push(`nodeType:{type: "${graphQLOptions.nodeType}"}`);
    }

    function getTerms(terms: Record<string, TermGroup>): string {
        const termsArray = Object.keys(terms).map(value => `{operation: ${terms[value].type === 'any' ? 'OR' : 'AND'}, terms:[${terms[value].terms.join(',')}]}`).join(',');
        return `term: [${termsArray}]`;
    }

    function getDateRange(dateRanges: Record<string, string[]>): string {
        const dateRangesArray = Object.keys(dateRanges).map(value => `{operation: AND, ranges:[${dateRanges[value].join(',')}]}`).join(',');
        return `dateRange: [${dateRangesArray}]`;
    }

    function getNumberRange(numberRanges: Record<string, string[]>): string {
        const numberRangesArray = Object.keys(numberRanges).map(value => `{operation: AND, ranges:[${numberRanges[value].join(',')}]}`).join(',');
        return `numberRange: [${numberRangesArray}]`;
    }

    if (request.filters !== undefined && request.filters.length > 0) {
        const terms: Record<string, TermGroup> = {};
        const dateRanges: Record<string, string[]> = {};
        const numberRanges: Record<string, string[]> = {};
        request.filters.forEach(filter => {
            // Non-null: a request that carries filters while the query config declares no facets at
            // all throws here, unchanged from the JS implementation.
            const facet: FacetConfig | undefined = queryConfig.facets![filter.field];
            if (facet === undefined) {
                terms[filter.field] = {type: filter.type, terms: []};
                terms[filter.field].terms.push(`{field:"${filter.field}", value:"${filter.values[0]}"}`);
            } else {
                switch (facet.type) {
                    case 'range':
                        filter.values.forEach(value => {
                            // Non-null: a selected value that is not among the configured ranges is
                            // not handled, so this is undefined and the line below throws. Pinned by
                            // the characterization tests as a known bug.
                            const range = facet.ranges.find(range => range.name === value) as FacetRange;
                            let numberRange: string[] | undefined = numberRanges[filter.field];
                            if (numberRange === undefined) {
                                numberRange = [];
                            }

                            numberRange.push(`{field:"${filter.field}",gte:${range.from}, lt:${range.to}}`);
                            numberRanges[filter.field] = numberRange;
                        });
                        break;
                    case 'date_range':
                        filter.values.forEach(value => {
                            // Same unhandled miss as the numeric case above.
                            const range = facet.ranges.find(range => range.name === value) as FacetRange;
                            let dateRange: string[] | undefined = dateRanges[filter.field];
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
                            let term: TermGroup | undefined = terms[filter.field];
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
        filters.push(`custom:{
        ${Object.keys(terms).length > 0 ? getTerms(terms) : ''}
        ${Object.keys(dateRanges).length > 0 ? getDateRange(dateRanges) : ''}
        ${Object.keys(numberRanges).length > 0 ? getNumberRange(numberRanges) : ''}
        }`);
    }

    if (filters.length === 0) {
        return '';
    }

    return `filters: {${filters.join(',')}}`;
}
