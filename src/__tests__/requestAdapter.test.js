import adaptRequest from '../requestAdapter';

describe('adaptRequest', () => {
    it('adapts request', () => {
        expect(adaptRequest(request, queryConfig)).toEqual(
            adaptedRequest
        );
    });
});

const queryConfig = {
    facets: {
        states: {
            type: 'value',
            size: 30
        }
    },
    result_fields: {
        title: {raw: {}, snippet: {size: 20, fallback: true}}
    },
    search_fields: {
        title: {},
        description: {},
        states: {}
    }
};

const request = {
    searchTerm: 'test',
    resultsPerPage: 10,
    current: 4,
    sortDirection: 'asc',
    sortField: 'title',
    result_fields: {
        title: {raw: {}, snippet: {size: 20, fallback: true}}
    },
    search_fields: {
        title: {},
        description: {},
        states: {}
    },
    filters: [
        {
            field: 'initial',
            values: ['values'],
            type: 'all'
        },
        {
            field: 'initial',
            values: ['more values'],
            type: 'all'
        },
        {
            field: 'test',
            values: [
                {
                    to: 100,
                    from: 0,
                    name: 'test'
                }
            ],
            type: 'all'
        },
        {
            field: 'initial',
            values: ['additional values', 'and values', 'and even more values'],
            type: 'all'
        },
        {
            field: 'another',
            values: ['additional values', 'and values', 'and even more values'],
            type: 'any'
        },
        {
            field: 'whatever',
            values: ['value']
        },
        {
            type: 'none',
            field: 'nunya',
            values: ['busi', 'ness']
        }
    ]
};

const adaptedRequest = `query {
    jcr {
        searches(siteKey: "academy", language: "en", workspace: LIVE) {
            search(searchInput: {searchCriteria: {
                text: "test"}, 
                nodeTypeCriteria:{
                    nodeType:"jnt:page"
                    }, 
                limit: 10,
                offset: 3
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
