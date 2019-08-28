export default function adaptRequest(request, queryConfig) {
    const graphQLOptions = {
        resultsPerPage: 5,
        current: 1,
        ...request
    };

    const query = `query {
    jcr {
        searches(siteKey: "academy", language: "en", workspace: LIVE) {
            search(searchInput: {searchCriteria: {
                text: "${graphQLOptions.searchTerm}"}, 
                nodeTypeCriteria:{
                    nodeType:"jnt:page"
                    }, 
                limit: ${graphQLOptions.resultsPerPage},
                offset: ${graphQLOptions.current - 1}
                }) {
                    totalHits
                    took
                    hits {
                        score
                        displayableName
                        excerpt
                        link
                        lastModified
                        lastModifiedBy
                        node {
                            uuid
                        }                  
                    }
                }
            }
          }
        }`;
    return query;
}
