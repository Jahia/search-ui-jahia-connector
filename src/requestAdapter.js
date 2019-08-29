/**
 * @typedef RequestOptions
 * @param  {string} siteKey The site search will be performed in
 * @param  {string} language Language in which search will be performed
 * @param  {string} workspace Workspace in which search will be performed
 * @param  {string} nodeType The node type that should be searched
 */
/**
 *
 * @param {RequestOptions} options
 * @param request
 * @param queryConfig
 * @returns {string}
 */
export default function adaptRequest(requestOptions, request, queryConfig) {
    const graphQLOptions = {
        resultsPerPage: 5,
        current: 1,
        ...requestOptions,
        ...request
    };

    const query = `query {
    jcr {
        searches(siteKey: "${graphQLOptions.siteKey}", language: "${graphQLOptions.language}", workspace: ${graphQLOptions.workspace}) {
            search(searchInput: {searchCriteria: {
                text: "${graphQLOptions.searchTerm}"}, 
                nodeTypeCriteria:{
                    nodeType:"${graphQLOptions.nodeType}"
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
