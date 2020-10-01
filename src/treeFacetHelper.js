import {parse, print} from 'graphql';

export default function treeFacetRequest(data, state, fieldName, requestOptions) {
    const graphQLOptions = {
        resultsPerPage: 5,
        current: 1,
        ...requestOptions,
        ...state
    };
    const facetInputs = [];
    data.forEach(facet => {
        facetInputs.push(`${facet.value.replace(/[/-]/g, '_')}: treeFacet(field:"${fieldName}", rootPath: "${facet.value}" 
                ${facet.disjunctive ? `, disjunctive: ${facet.disjunctive},` : ''} ${facet.minDoc ? `, minDocCount: ${facet.facet.minDoc},` : ''}) {
                field rootPath data{value,count}}`);
    });

    return print(parse(`query {
        search(
            q: "${graphQLOptions.searchTerm}",
            siteKeys: ["${graphQLOptions.siteKey}"],
            language: "${graphQLOptions.language}",
            workspace: ${graphQLOptions.workspace}
            filters: { nodeType: { type: "${graphQLOptions.nodeType}" } }) {


           ${facetInputs.join('\n')}
        }
    }`));
}

export function prepareCategoryFacet(treeFacetResponse, pathFacetsData, categoryTitleData) {
    const facetData = Object.values(treeFacetResponse);
    const mappedFacetData = facetData.map(result => {
        let childrenPathArray;
        if (result.data) {
            childrenPathArray = result.data.map(child => `${result.rootPath}/${child.value}`);
        }

        // We are working with root category if we get 2 elements by splitting on a forward slash
        const splittedPath = result.rootPath.split('/');
        const isRoot = splittedPath.length === 2;
        const prettifiedPath = splittedPath[splittedPath.length - 1].replace(/[^a-zA-Z0-9]/g, '');
        const correspondingCategory = categoryTitleData.find(category => {
            const lowerCaseTitle = category.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return lowerCaseTitle === prettifiedPath;
        });
        return {path: result.rootPath, isRoot: isRoot, children: childrenPathArray, title: correspondingCategory.value};
    });
    return pathFacetsData.map(facet => {
        const correspondingData = mappedFacetData.find(data => facet.value === data.path);
        return {...facet, ...correspondingData};
    });
}
