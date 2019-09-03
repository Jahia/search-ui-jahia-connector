import adaptRequest, {buildFields} from '../requestAdapter';
import Field from "../field";
import {FieldType} from "../../dist/field";

describe('adaptRequest', () => {
    it('adapts request', () => {
        expect(adaptRequest(requestOptions, request, queryConfig)).toEqual(
            adaptedRequest
        );
    });
});

const requestOptions = {
    siteKey: "academy",
    language: "en",
    workspace: "LIVE",
    nodeType:"jnt:page"
};

const queryConfig = {
    facets: {
        states: {
            type: 'value',
            size: 30
        }
    },
    result_fields: [
        new Field(FieldType.HIT, 'link'),
        new Field(FieldType.HIT, 'displayableName', 'title'),
        new Field(FieldType.HIT, 'excerpt', null, true),
        new Field(FieldType.HIT, 'score'),
        new Field(FieldType.NODE, 'jcr:created', 'created')
    ],
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
    result_fields: [
        new Field(FieldType.HIT, 'link'),
        new Field(FieldType.HIT, 'displayableName', 'title'),
        new Field(FieldType.HIT, 'excerpt', null, true),
        new Field(FieldType.HIT, 'score'),
        new Field(FieldType.NODE, 'jcr:created', 'created')
    ],
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

let resultFields = "results" in queryConfig ? queryConfig.results.result_fields : queryConfig.result_fields;
let resolvedRequestFields = buildFields(Object.keys(resultFields).reduce((acc, curr) => {
    let field = resultFields[curr];
    if (field instanceof Field) {
        acc.push(field);
    }
    return acc;
}, []));

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
                        ${resolvedRequestFields.hitFields}
                        score
                        displayableName
                        excerpt
                        link
                        node {
                            uuid
                            ${resolvedRequestFields.nodeFields}
                        }                  
                    }
                }
            }
          }
        }`;
