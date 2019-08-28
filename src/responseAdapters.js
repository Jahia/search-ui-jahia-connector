export function getFacets() {
    return {};
}

export function getResults(hits) {
    return hits.map(hit => {
        const result = {
            link: {
                raw: hit.link
            },
            updatedAt : {
                raw: hit.lastModified
            },
            excerpt: {
                snippet: hit.excerpt
            },
            title: {
                raw: hit.displayableName
            },
            id: {
                raw: hit.node.uuid
            }
        };
        return result;
    });

}
