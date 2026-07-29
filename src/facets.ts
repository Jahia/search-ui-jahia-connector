import type {FacetConfig, FacetRange, QueryConfig, RequestFilter, RequestState} from './types.js';

interface ProcessedFacet {
    facet: FacetConfig;
    selections?: string[];
}

function buildRangeValue(range: FacetRange): string {
    const args = [`name: "${range.name}"`];
    if (range.from) {
        args.push(`from: "${range.from}"`);
    }

    if (range.to) {
        args.push(`to: "${range.to}"`);
    }

    return `{${args.join(',')}}`;
}

export default function facets(request: RequestState, queryConfig: QueryConfig): string {
    if (!queryConfig.facets || Object.entries(queryConfig.facets).length === 0) {
        return '';
    }

    const processedFacets: Record<string, Record<string, ProcessedFacet>> = {};

    function extractSelections(filters: RequestFilter[], facetName: string, facet: FacetConfig): void {
        const selections: string[] = [];
        filters.filter(filter => facetName === filter.field).forEach(filter => {
            switch (facet.type) {
                case 'range':
                case 'date_range':
                    // The cast records the assumption this branch makes: a range selection is a
                    // FacetRange, not the plain string a value facet reports. Nothing reads
                    // `selections`, so it is never exercised — see the note in facets.test.ts.
                    filter.values.forEach(value => selections.push(buildRangeValue(value as FacetRange)));
                    break;
                case 'value':
                default:
                    filter.values.forEach(value => selections.push(`"${value}"`));
                    break;
            }
        });
        processedFacets[facet.type][facetName].selections = selections;
    }

    Object.entries(queryConfig.facets).forEach(([facetName, facet]) => {
        // Handle filter values
        const filters = request.filters;
        if (processedFacets[facet.type] === undefined) {
            processedFacets[facet.type] = {};
        }

        processedFacets[facet.type][facetName] = {facet: facet};
        if (filters) {
            extractSelections(filters, facetName, facet);
        }
    });
    const facetInputs: string[] = [];
    Object.values(processedFacets).forEach(facetGroup => {
        Object.entries(facetGroup).forEach(([facetName, processed]) => {
            // The group key is the facet's own `type`, so switching on the config discriminates on
            // exactly the same value as the original did on the key — and narrows the union.
            const facet = processed.facet;
            if (facet.type === 'value') {
                if (facet.hierarchical === true) {
                    facetInputs.push(`${facetName.replace(/[:.]/g, '_')}: treeFacet(field:"${facetName}", rootPath: "${facet.rootPath}", disjunctive: ${Boolean(facet.disjunctive)} 
                ${facet.max ? `, max: ${facet.max},` : ''} ${facet.minDoc ? `, minDocCount: ${facet.minDoc},` : ''}) {
                data{value,count,key,hasChildren,rootPath,filter}}`);
                } else {
                    facetInputs.push(`${facetName.replace(/[:.]/g, '_')}: termFacet(field:"${facetName}", disjunctive: ${Boolean(facet.disjunctive)} 
                ${facet.max ? `, max: ${facet.max},` : ''} ${facet.minDoc ? `, minDocCount: ${facet.minDoc},` : ''}) {
                data{value,count}}`);
                }
            } else if (facet.type === 'date_range' || facet.type === 'range') {
                // Deliberately not a bare `else`: a facet whose type is neither value nor range is
                // dropped rather than emitted, which is what the current implementation does.
                facetInputs.push(`${facetName.replace(/[:.]/g, '_')}:rangeFacet(field: "${facetName}", 
               ranges:[${facet.ranges.map(range => `${buildRangeValue(range)}`).join(',')}] 
                ${facet.max ? `, max: ${facet.max},` : ''}) {
                data{name,count}}`);
            }
        });
    });
    return `${facetInputs.join(',')}`;
}
