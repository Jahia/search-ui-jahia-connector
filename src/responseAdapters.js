export function getFacets() {
    return {};
}

export function getResults(hits) {
    return hits.filter(hit => {
        return hit.node !== null;
    }).map(hit => {
        return {
            link: {
                raw: hit.link
            },
            updatedAt: {
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
    });
}
