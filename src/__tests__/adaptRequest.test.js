import adaptRequest from '../adaptRequest';
import {Field, FieldType} from '../field';
import {parse, print} from 'graphql';
import filters from '../filters';

const defaultRequestOptions = {
    siteKey: 'academy',
    language: 'en',
    workspace: 'LIVE',
    functionScore: ''
};

const nodeTypeRequestOptions = {
    siteKey: 'academy',
    language: 'en',
    workspace: 'LIVE',
    nodeType: 'jnt:page',
    functionScore: ''
};

const queryConfig = {
    facets: {
        'jgql:tags': {
            type: 'value',
            max: 10,
            minDoc: 1,
            disjunctive: false
        },
        'jgql:lastModified': {
            type: 'date_range',
            disjunctive: true,
            ranges: [{from: 'now-1y', to: 'now', name: 'last year'},
                {from: 'now-5y', to: 'now-1y', name: 'last 5 years'}]
        },
        'popularity': {
            type: 'range',
            disjunctive: true,
            ranges: [{from: '0.0', to: '500.0', name: '< 500'},
                {from: '500.0', to: '1000.0', name: '> 500 < 1000'}]
        },
        'jgql:categories_path': {
            type: 'value',
            max: 50,
            minDoc: 1,
            disjunctive: true,
            rootPath:"",
            hierarchical: true
        }
    },
    // eslint-disable-next-line camelcase
    result_fields: [
        new Field(FieldType.HIT, 'link'),
        new Field(FieldType.HIT, 'displayableName', 'title'),
        new Field(FieldType.HIT, 'excerpt', null, true),
        new Field(FieldType.HIT, 'score'),
        new Field(FieldType.NODE, 'jgql:created'),
        new Field(FieldType.REFERENCE_AS_PATH, 'logo', 'logo'),
        new Field(FieldType.REFERENCE_AS_VALUE, 'industryCat', 'industry')
    ]
};

const requestWithFilters = {
    nodeType: 'jnt:page',
    searchTerm: 'test',
    resultsPerPage: 10,
    current: 4,
    sortDirection: 'asc',
    sortField: 'title',
    // eslint-disable-next-line camelcase
    result_fields: [
        new Field(FieldType.HIT, 'link'),
        new Field(FieldType.HIT, 'displayableName', 'title'),
        new Field(FieldType.HIT, 'excerpt', null, true),
        new Field(FieldType.HIT, 'score'),
        new Field(FieldType.NODE, 'jcr:created'),
        new Field(FieldType.REFERENCE_AS_PATH, 'logo', 'logo'),
        new Field(FieldType.REFERENCE_AS_VALUE, 'industryCat', 'industry')
    ],
    filters: [
        {
            field: 'jgql:tags',
            values: ['Action','Adventure'],
            type: 'all'
        },
        {
            field: 'jgql:lastModified',
            values: ['last year'],
            type: 'all'
        },
        {
            field: 'popularity',
            values: ['> 500 < 1000'],
            type: 'all'
        },
        {
            field: 'jgql:categories_path',
            values: ['reg:markets[^/]*/.*'],
            type: 'any'
        }
    ]
};

const defaultRequest = {
    searchTerm: 'test',
    resultsPerPage: 10,
    current: 4,
    sortDirection: 'asc',
    sortField: 'title',
    // eslint-disable-next-line camelcase
    result_fields: [
        new Field(FieldType.HIT, 'link'),
        new Field(FieldType.HIT, 'displayableName', 'title'),
        new Field(FieldType.HIT, 'excerpt', null, true),
        new Field(FieldType.HIT, 'score'),
        new Field(FieldType.NODE, 'jcr:created'),
        new Field(FieldType.REFERENCE_AS_PATH, 'logo', 'logo'),
        new Field(FieldType.REFERENCE_AS_VALUE, 'industryCat', 'industry')
    ]
};

const adaptedDefaultRequest = print(parse(`{
      search (q: "test", siteKeys: ["academy"], language: "en", workspace: LIVE, functionScoreId: "") {
            results (size: 10, page: 3, sortBy: {dir: ASC, field: "title"}) {
                totalHits
                took
                hits {
                  id
                  link
                  displayableName
                  excerpt
                  score
                  jgql_created: property(name: "jgql:created")
                  logo: property(name: "logo")
                  industry: property(name: "industryCat")
                }
            }
            jgql_tags: termFacet(field: "jgql:tags", disjunctive: false, max: 10, minDocCount: 1) {
                data {
                    value
                    count
                }
            },
            jgql_categories_path: treeFacet(field: "jgql:categories_path", rootPath:"", disjunctive: true, max: 50, minDocCount: 1) {
                data {
                    value
                    count
                    key
                    hasChildren
                    rootPath
                    filter
                }
            },
            jgql_lastModified: rangeFacet(field: "jgql:lastModified", ranges: [{name: "last year", from: "now-1y", to: "now"},
                                                            {name: "last 5 years", from: "now-5y", to: "now-1y"}]) {
                data {
                    name
                    count
                }
            },
            popularity: rangeFacet(field: "popularity", ranges: [{name: "< 500", from: "0.0", to: "500.0"},
                                                            {name: "> 500 < 1000", from: "500.0", to: "1000.0"}]) {
                data {
                    name
                    count
                }
            }
      }
}`));

const adaptedNodeTypeFilterRequest = print(parse(`{
      search (q: "test", siteKeys: ["academy"], language: "en", workspace: LIVE, functionScoreId: "", filters: {nodeType: {type: "jnt:page"}}) {
            results (size: 10, page: 3, sortBy: {dir: ASC, field: "title"}) {
                totalHits
                took
                hits {
                  id
                  link
                  displayableName
                  excerpt
                  score
                  jgql_created: property(name: "jgql:created")
                  logo: property(name: "logo")
                  industry: property(name: "industryCat")
                }
            }
            jgql_tags: termFacet(field: "jgql:tags", disjunctive: false, max: 10, minDocCount: 1) {
                data {
                    value
                    count
                }
            },
            jgql_categories_path: treeFacet(field: "jgql:categories_path", rootPath:"", disjunctive: true, max: 50, minDocCount: 1) {
                data {
                    value
                    count
                    key
                    hasChildren
                    rootPath
                    filter
                }
            }
            jgql_lastModified: rangeFacet(field: "jgql:lastModified", ranges: [{name: "last year", from: "now-1y", to: "now"},
                                                            {name: "last 5 years", from: "now-5y", to: "now-1y"}]) {
                data {
                    name
                    count
                }
            },
            popularity: rangeFacet(field: "popularity", ranges: [{name: "< 500", from: "0.0", to: "500.0"},
                                                            {name: "> 500 < 1000", from: "500.0", to: "1000.0"}]) {
                data {
                    name
                    count
                }
            }
      }
}`));

const adaptedFilteredRequest = print(parse(`{
      search (q: "test", siteKeys: ["academy"], language: "en", workspace: LIVE, functionScoreId: ""
            filters:{
                nodeType: {type: "jnt:page"}
                custom:{
                    term:[{
                        operation:AND
                        terms:[{field:"jgql:tags",value:"Action"},{field:"jgql:tags",value:"Adventure"}]}, 
                        {
                        operation:OR
                        terms:[{field:"jgql:categories_path",value:"reg:markets[^/]*/.*"}]
                    }]
                    dateRange:[{operation:AND, ranges:[{field:"jgql:lastModified",after:"now-1y",before:"now"}]}],
                    numberRange:[{operation:AND, ranges:[{field:"popularity",gte:"500.0",lt:"1000.0"}]}]
                }
            }
      ) {
            results (size: 10, page: 3, sortBy: {dir: ASC, field: "title"}) {
                totalHits
                took
                hits {
                  id
                  link
                  displayableName
                  excerpt
                  score
                  jgql_created: property(name: "jgql:created")
                  logo: property(name: "logo")
                  industry: property(name: "industryCat")
                }
            }
            jgql_tags: termFacet(field: "jgql:tags", disjunctive: false, max: 10, minDocCount: 1) {
                data {
                    value
                    count
                }
            },
            jgql_categories_path: treeFacet(field: "jgql:categories_path", rootPath:"", disjunctive: true, max: 50, minDocCount: 1) {
                data {
                    value
                    count
                    key
                    hasChildren
                    rootPath
                    filter
                }
            }
            jgql_lastModified: rangeFacet(field: "jgql:lastModified", ranges: [{name: "last year", from: "now-1y", to: "now"},
                                                            {name: "last 5 years", from: "now-5y", to: "now-1y"}]) {
                data {
                    name
                    count
                }
            },
            popularity: rangeFacet(field: "popularity", ranges: [{name: "< 500", from: "0.0", to: "500.0"},
                                                            {name: "> 500 < 1000", from: "500.0", to: "1000.0"}]) {
                data {
                    name
                    count
                }
            }
      }
}`));

describe('adaptRequest', () => {
    test('adapts default request', () => {
        expect(adaptRequest(defaultRequestOptions, defaultRequest, queryConfig)).toEqual(
            adaptedDefaultRequest
        );
    });
    test('adapts nodetype request', () => {
        expect(adaptRequest(nodeTypeRequestOptions, defaultRequest, queryConfig)).toEqual(
            adaptedNodeTypeFilterRequest
        );
    });
    test('adapts filtered request', () => {
        expect(adaptRequest(defaultRequestOptions, requestWithFilters, queryConfig)).toEqual(
            adaptedFilteredRequest
        );
    });
});
