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
        const facetAlias = facet.value.toLowerCase().replace(/\W/g, '_');
        facetInputs.push(`${facetAlias}: treeFacet(field:"${fieldName}", rootPath: "${facet.value}" 
                , disjunctive: true, max : 50, ${facet.minDoc ? `, minDocCount: ${facet.facet.minDoc},` : ''}) {
                field rootPath data{value,count}}`);
    });

    return print(parse(`query {
        search(
            q: "${graphQLOptions.searchTerm}",
            siteKeys: ["${graphQLOptions.siteKey}"],
            language: "${graphQLOptions.language}",
            workspace: ${graphQLOptions.workspace}
            ${graphQLOptions.nodeType ? `filters: { nodeType: { type: "${graphQLOptions.nodeType}" } }` : ''}
            ) {


           ${facetInputs.join('\n')}
        }
    }`));
}

const transformTreeFacetsToTreeComponentData = (result, categoryTitleData) => {
    let childrenPathArray;
    if (result.data) {
        childrenPathArray = result.data.map(child => `${result.rootPath}/${child.value}`);
    }

    // We are working with root category if we get 2 elements by splitting on a forward slash
    const splittedPath = result.rootPath.split('/');
    const isRoot = splittedPath.length === 2;
    const prettifiedPath = splittedPath[splittedPath.length - 1].replace(/\W/g, '').toLowerCase();
    const correspondingCategory = categoryTitleData.find(category => {
        const lowerCaseTitle = category.value.replace(/\W/g, '').toLowerCase();

        return lowerCaseTitle === prettifiedPath;
    });
    return correspondingCategory ? {
        path: result.rootPath,
        isRoot: isRoot,
        children: childrenPathArray,
        title: correspondingCategory.value,
        count: correspondingCategory.count
    } : {};
};

const appendCategoryTitleAndCount = (pathFacetsData, mappedFacetData) => {
    return pathFacetsData.reduce((accumulator, facet) => {
        const correspondingData = mappedFacetData.find(data => facet.value === data.path);
        if (correspondingData) {
            accumulator = [...accumulator, {...facet, ...correspondingData}];
        }

        return accumulator;
    }, []);
};

export function prepareCategoryFacet(treeFacetResponse, pathFacetsData, categoryTitleData) {
    const facetData = Object.values(treeFacetResponse);
    // Filter tree facets that get removed by selections
    const filteredTreeFacetData = facetData.filter(result => {
        return categoryTitleData.find(category => {
            return result.rootPath.toLowerCase().includes(category.value.toLowerCase());
        });
    });
    const mappedFacetData = filteredTreeFacetData.map(result => {
        return transformTreeFacetsToTreeComponentData(result, categoryTitleData);
    });
    return appendCategoryTitleAndCount(pathFacetsData, mappedFacetData);
}
