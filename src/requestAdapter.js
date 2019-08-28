export default function adaptRequest(request, queryConfig) {
    const query =`query {
    jcr {
        searches(siteKey: "academy", language: "en", workspace: LIVE) {
            search(searchInput: {searchCriteria: {
                text: "${request.searchTerm}"}, 
                nodeTypeCriteria:{
                    nodeType:"jnt:page"
                }, 
                limit: ${request.resultsPerPage}}) {
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
