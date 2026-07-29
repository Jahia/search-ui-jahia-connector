import adaptRequest from '../adaptRequest.js';
import {Field, FieldType} from '../field.js';
import {parse, print} from 'graphql';
import {assertEveryVariableIsUsed, inlineVariables} from './helpers.js';
import type {FacetConfig, QueryConfig, RequestOptions, RequestState} from '../types.js';

const defaultRequestOptions: RequestOptions = {
    siteKey: 'academy',
    language: 'en',
    workspace: 'LIVE',
    functionScore: ''
};

const nodeTypeRequestOptions: RequestOptions = {
    siteKey: 'academy',
    language: 'en',
    workspace: 'LIVE',
    nodeType: 'jnt:page',
    functionScore: ''
};

const queryConfig: QueryConfig = {
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

const requestWithFilters: RequestState & QueryConfig & {nodeType: string} = {
    nodeType: 'jnt:page',
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

const defaultRequest: RequestState & QueryConfig = {
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
                    # Was gte:500.0, lt:1000.0. The bounds are configured as the strings "500.0" and
                    # "1000.0" and used to be interpolated raw, which happened to print as a Float
                    # literal. They are now converted and sent as numbers, so 500.0 prints as 500 —
                    # the same value for a Float argument.
                    numberRange:[{operation:AND, ranges:[{field:"popularity",gte:500,lt:1000}]}]
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
        expect(inlineVariables(adaptRequest(defaultRequestOptions, defaultRequest, queryConfig))).toEqual(
            adaptedDefaultRequest
        );
    });
    test('adapts nodetype request', () => {
        expect(inlineVariables(adaptRequest(nodeTypeRequestOptions, defaultRequest, queryConfig))).toEqual(
            adaptedNodeTypeFilterRequest
        );
    });
    test('adapts filtered request', () => {
        expect(inlineVariables(adaptRequest(defaultRequestOptions, requestWithFilters, queryConfig))).toEqual(
            adaptedFilteredRequest
        );
    });
});

const noFieldsQueryConfig: QueryConfig = {result_fields: []};

/**
 * The search term used to be HTML-escaped and interpolated into the query text. That was the only
 * barrier against a visitor's input reaching the document, and it leaked in both directions: it
 * mangled ordinary searches, and it did not actually stop a newline from breaking the query.
 *
 * The term is now a variable, so it is sent exactly as typed and never appears in the document.
 * Each case below replaces one that pinned the old escaping.
 */
describe('adaptRequest — the search term is sent as a variable', () => {
    // `searchTerm` is deliberately looser than RequestState declares: one case passes a number.
    const q = (searchTerm: unknown, request: RequestState = {}) =>
        adaptRequest(defaultRequestOptions, {...request, searchTerm} as RequestState, noFieldsQueryConfig).variables.q;

    it('searches for the empty string when the term is undefined', () => {
        expect(adaptRequest(defaultRequestOptions, {}, noFieldsQueryConfig).variables.q).toBe('');
    });

    it('searches for the empty string when the term is empty', () => {
        expect(q('')).toBe('');
    });

    // Was a KNOWN BUG: htmlEscape guarded on truthiness, so a numeric 0 searched for nothing.
    it('searches for "0" when the term is the number 0', () => {
        expect(q(0)).toBe('0');
    });

    // Was pinned as HTML-escaping. Escaping a search term was never right — a visitor looking for
    // `a & b` was searching for `a &amp; b`.
    it('leaves ampersands, quotes, apostrophes and angle brackets alone', () => {
        expect(q('a&b"c\'d<e>f')).toBe('a&b"c\'d<e>f');
    });

    it('leaves backslashes alone rather than doubling them', () => {
        expect(q('di\\')).toBe('di\\');
        expect(q('di\\g\\it')).toBe('di\\g\\it');
    });

    it('does not double-escape an entity the visitor typed', () => {
        expect(q('&lt;')).toBe('&lt;');
    });

    it('leaves other characters alone', () => {
        expect(q('café (résumé) 50% #1')).toBe('café (résumé) 50% #1');
    });

    // Was a KNOWN BUG: a literal newline is illegal inside a GraphQL string, so pasting multi-line
    // text into a search box threw out of adaptRequest instead of searching.
    it('searches for a term containing a newline instead of throwing', () => {
        expect(q('multi\nline')).toBe('multi\nline');
    });

    it('keeps the term out of the document, whatever it contains', () => {
        const {query, variables} = adaptRequest(
            defaultRequestOptions,
            {searchTerm: '") {id} evil('},
            noFieldsQueryConfig
        );
        expect(query).not.toContain('evil');
        expect(variables.q).toBe('") {id} evil(');
    });
});

describe('adaptRequest — the workspace enum', () => {
    // `workspace` cannot be a variable without knowing the schema's enum type name, so it is the
    // one connector option still written into the document — and therefore checked.
    it('rejects a workspace that is not a GraphQL enum value', () => {
        expect(() => adaptRequest(
            {...defaultRequestOptions, workspace: 'LIVE) {id} evil('},
            {},
            noFieldsQueryConfig
        )).toThrow('workspace must be a GraphQL enum value');
    });
});

describe('adaptRequest — every declared variable is used', () => {
    // A variable that is declared but never referenced makes the whole query invalid, and neither
    // parse() nor a snapshot notices. These are the configurations most likely to regress it.
    it.each([
        ['default', defaultRequestOptions, defaultRequest, queryConfig],
        ['nodeType filter', nodeTypeRequestOptions, defaultRequest, queryConfig],
        ['request filters', defaultRequestOptions, requestWithFilters, queryConfig],
        ['no fields', defaultRequestOptions, {}, noFieldsQueryConfig],
        ['facet with an unrecognised type', defaultRequestOptions, {}, {
            ...noFieldsQueryConfig,
            facets: {weird: {type: 'not-a-real-type'} as unknown as FacetConfig}
        }],
        ['range facet carrying a minDoc it never sends', defaultRequestOptions, {}, {
            ...noFieldsQueryConfig,
            facets: {popularity: {type: 'range', minDoc: 1, ranges: [{name: 'r', from: '0', to: '1'}]} as FacetConfig}
        }]
    ])('%s', (_name, options, request, config) => {
        expect(() => assertEveryVariableIsUsed(adaptRequest(options, request, config))).not.toThrow();
    });
});

describe('adaptRequest — result_fields resolution', () => {
    it('ignores entries that are not Field instances', () => {
        expect(inlineVariables(adaptRequest(
            defaultRequestOptions,
            {},
            {result_fields: {notAField: 'link', alsoNot: null, real: new Field(FieldType.HIT, 'link')}}
        ))).toMatchInlineSnapshot(`
          "{
            search(
              q: ""
              siteKeys: ["academy"]
              language: "en"
              workspace: LIVE
              functionScoreId: ""
            ) {
              results(size: 5, page: 0) {
                totalHits
                took
                hits {
                  id
                  link
                }
              }
            }
          }"
        `);
    });

    it('reads result_fields from the results wrapper when the config has one', () => {
        expect(inlineVariables(adaptRequest(
            defaultRequestOptions,
            {},
            {results: {result_fields: [new Field(FieldType.HIT, 'link')]}}
        ))).toMatchInlineSnapshot(`
          "{
            search(
              q: ""
              siteKeys: ["academy"]
              language: "en"
              workspace: LIVE
              functionScoreId: ""
            ) {
              results(size: 5, page: 0) {
                totalHits
                took
                hits {
                  id
                  link
                }
              }
            }
          }"
        `);
    });

    it('defaults to 5 results on page 0 when the request sets no paging', () => {
        expect(adaptRequest(defaultRequestOptions, {}, noFieldsQueryConfig)).toMatchInlineSnapshot(`
          {
            "query": "query ($q: String!, $siteKey: String!, $language: String!, $functionScoreId: String!, $size: Int!, $page: Int!) {
            search(
              q: $q
              siteKeys: [$siteKey]
              language: $language
              workspace: LIVE
              functionScoreId: $functionScoreId
            ) {
              results(size: $size, page: $page) {
                totalHits
                took
                hits {
                  id
                }
              }
            }
          }",
            "variables": {
              "functionScoreId": "",
              "language": "en",
              "page": 0,
              "q": "",
              "siteKey": "academy",
              "size": 5,
            },
          }
        `);
    });

    it('lets the request override the request options', () => {
        expect(inlineVariables(adaptRequest(
            {...defaultRequestOptions, resultsPerPage: 20},
            {resultsPerPage: 3, current: 2},
            noFieldsQueryConfig
        ))).toMatchInlineSnapshot(`
          "{
            search(
              q: ""
              siteKeys: ["academy"]
              language: "en"
              workspace: LIVE
              functionScoreId: ""
            ) {
              results(size: 3, page: 1) {
                totalHits
                took
                hits {
                  id
                }
              }
            }
          }"
        `);
    });
});
