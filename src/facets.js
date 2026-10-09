function buildRangeValue(range) {
    const args = [`name: "${range.name}"`];
    if (range.from) {
        args.push(`from: "${range.from}"`);
    }

    if (range.to) {
        args.push(`to: "${range.to}"`);
    }

    return `{${args.join(',')}}`;
}

export default function facets(queryConfig) {
    if (!queryConfig.facets || Object.entries(queryConfig.facets).length === 0) {
        return '';
    }

    const processedFacets = {};
    Object.entries(queryConfig.facets).forEach(([facetName, facet]) => {
        if (processedFacets[facet.type] === undefined) {
            processedFacets[facet.type] = {};
        }

        processedFacets[facet.type][facetName] = {facet: facet};
    });
    const facetInputs = [];
    Object.entries(processedFacets).forEach(([facetType, facetGroup]) => {
        Object.entries(facetGroup).forEach(([facetName, facet]) => {
            if (facetType === 'value') {
                if (facet.facet.hierarchical === true) {
                    facetInputs.push(`${facetName.replace(/[:.]/g, '_')}: treeFacet(field:"${facetName}", rootPath: "${facet.facet.rootPath}", disjunctive: ${Boolean(facet.facet.disjunctive)} 
                ${facet.facet.max ? `, max: ${facet.facet.max},` : ''} ${facet.facet.minDoc ? `, minDocCount: ${facet.facet.minDoc},` : ''}) {
                data{value,count,key,hasChildren,rootPath,filter}}`);
                } else {
                    facetInputs.push(`${facetName.replace(/[:.]/g, '_')}: termFacet(field:"${facetName}", disjunctive: ${Boolean(facet.facet.disjunctive)} 
                ${facet.facet.max ? `, max: ${facet.facet.max},` : ''} ${facet.facet.minDoc ? `, minDocCount: ${facet.facet.minDoc},` : ''}) {
                data{value,count}}`);
                }
            } else if (facetType === 'date_range' || facetType === 'range') {
                facetInputs.push(`${facetName.replace(/[:.]/g, '_')}:rangeFacet(field: "${facetName}", 
               ranges:[${facet.facet.ranges.map(range => `${buildRangeValue(range)}`).join(',')}] 
                ${facet.facet.max ? `, max: ${facet.facet.max},` : ''}) {
                data{name,count}}`);
            }
        });
    });
    return `${facetInputs.join(',')}`;
}
