import adaptRequest from '../adaptRequest.js';
import {Field, FieldType} from '../field.js';
import {parse, print} from 'graphql';
import {searchTermArgOf} from './helpers.js';

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
                    numberRange:[{operation:AND, ranges:[{field:"popularity",gte:500.0,lt:1000.0}]}]
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

/**
 * Characterization tests added ahead of a rewrite: they record what the current implementation does,
 * not what it ought to do. Cases marked KNOWN BUG pin behaviour we believe is wrong — a rewrite that
 * fixes one SHOULD fail here, and the expectation should then be updated deliberately rather than
 * the test deleted.
 */

const noFieldsQueryConfig = {result_fields: []};

describe('adaptRequest — search term escaping', () => {
    const q = (searchTerm, request = {}) =>
        searchTermArgOf(adaptRequest(defaultRequestOptions, {...request, searchTerm}, noFieldsQueryConfig));

    it('emits an empty q for an undefined search term', () => {
        expect(searchTermArgOf(adaptRequest(defaultRequestOptions, {}, noFieldsQueryConfig))).toMatchInlineSnapshot(`"q: """`);
    });

    it('emits an empty q for an empty search term', () => {
        expect(q('')).toMatchInlineSnapshot(`"q: """`);
    });

    // KNOWN BUG: htmlEscape guards on truthiness, so any falsy-but-meaningful term is discarded.
    // A numeric search term of 0 searches for nothing rather than for "0".
    it('discards a search term of 0 (KNOWN BUG)', () => {
        expect(q(0)).toMatchInlineSnapshot(`"q: """`);
    });

    it('escapes ampersands, quotes, apostrophes and angle brackets as HTML entities', () => {
        expect(q('a&b"c\'d<e>f')).toMatchInlineSnapshot(`"q: "a&amp;b&quot;c&#39;d&lt;e&gt;f""`);
    });

    it('doubles a trailing backslash', () => {
        expect(q('di\\')).toMatchInlineSnapshot(`"q: "di\\\\""`);
    });

    it('doubles an embedded backslash', () => {
        expect(q('di\\g\\it')).toMatchInlineSnapshot(`"q: "di\\\\g\\\\it""`);
    });

    it('escapes in a fixed order, so an entity typed by the user is double-escaped', () => {
        expect(q('&lt;')).toMatchInlineSnapshot(`"q: "&amp;lt;""`);
    });

    it('leaves other characters alone', () => {
        expect(q('café (résumé) 50% #1')).toMatchInlineSnapshot(`"q: "café (résumé) 50% #1""`);
    });

    // KNOWN BUG: newlines are not escaped, and a literal newline is illegal inside a GraphQL string
    // literal, so the query fails to parse. Pasting multi-line text into a search box throws out of
    // adaptRequest rather than searching.
    it('throws on a search term containing a newline (KNOWN BUG)', () => {
        expect(() => adaptRequest(defaultRequestOptions, {searchTerm: 'multi\nline'}, noFieldsQueryConfig))
            .toThrow('Syntax Error: Unterminated string.');
    });
});

describe('adaptRequest — result_fields resolution', () => {
    it('ignores entries that are not Field instances', () => {
        expect(adaptRequest(
            defaultRequestOptions,
            {},
            {result_fields: {notAField: 'link', alsoNot: null, real: new Field(FieldType.HIT, 'link')}}
        )).toMatchInlineSnapshot(`
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
        expect(adaptRequest(
            defaultRequestOptions,
            {},
            {results: {result_fields: [new Field(FieldType.HIT, 'link')]}}
        )).toMatchInlineSnapshot(`
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
                }
              }
            }
          }"
        `);
    });

    it('lets the request override the request options', () => {
        expect(adaptRequest(
            {...defaultRequestOptions, resultsPerPage: 20},
            {resultsPerPage: 3, current: 2},
            noFieldsQueryConfig
        )).toMatchInlineSnapshot(`
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
