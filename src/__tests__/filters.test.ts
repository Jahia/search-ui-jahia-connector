import filters from '../filters.js';
import {normalizeArgs} from './helpers.js';
import {GraphQLVariables} from '../graphql.js';
import type {NormalizedFragment} from './helpers.js';
import type {FacetConfig, QueryConfig, RequestState} from '../types.js';

/**
 * Tests for `filters()`. Most began as characterization tests recording what the string-building
 * implementation did; the cases that pinned an injection bug now pin the fix, and say so.
 *
 * Every value is a variable, so an assertion covers two things: the document, which must carry no
 * caller-supplied text at all, and the values sent alongside it.
 */

const argsFor = (
    request: RequestState,
    queryConfig: QueryConfig,
    options: {nodeType?: string}
): NormalizedFragment => normalizeArgs(v => filters(request, queryConfig, options, v));

/** For the few cases that assert on the raw fragment rather than the parsed document. */
const fragmentFor = (
    request: RequestState,
    queryConfig: QueryConfig,
    options: {nodeType?: string}
): string => filters(request, queryConfig, options, new GraphQLVariables());

const rangeFacetConfig: QueryConfig = {
    facets: {
        popularity: {
            type: 'range',
            ranges: [
                {from: '0.0', to: '500.0', name: 'low'},
                {from: '500.0', to: '1000.0', name: 'high'}
            ]
        }
    }
};

const dateRangeFacetConfig: QueryConfig = {
    facets: {
        'jgql:lastModified': {
            type: 'date_range',
            ranges: [
                {from: 'now-1y', to: 'now', name: 'last year'},
                {from: 'now-5y', to: 'now-1y', name: 'last 5 years'}
            ]
        }
    }
};

const valueFacetConfig: QueryConfig = {facets: {'jgql:tags': {type: 'value'}}};

describe('filters', () => {
    describe('no filters produced', () => {
        it('returns an empty string with no nodeType and no request filters', () => {
            expect(fragmentFor({}, {facets: {}}, {})).toBe('');
        });

        it('returns an empty string when request.filters is an empty array', () => {
            expect(fragmentFor({filters: []}, {facets: {}}, {})).toBe('');
        });

        it('emits only the nodeType filter when there are no request filters', () => {
            expect(argsFor({}, {facets: {}}, {nodeType: 'jnt:page'})).toMatchInlineSnapshot(`
              {
                "query": "query ($nodeType: String!) {
                search(q: "", filters: { nodeType: { type: $nodeType } }) {
                  totalHits
                }
              }",
                "variables": {
                  "nodeType": "jnt:page",
                },
              }
            `);
        });
    });

    describe('fields that are not declared as facets', () => {
        // KNOWN BUG: only values[0] reaches the query. The declared-facet branches below iterate
        // filter.values; this one indexes it. Selecting two values on an undeclared field silently
        // drops all but the first.
        it('keeps only the first value (KNOWN BUG)', () => {
            expect(argsFor(
                {filters: [{field: 'jgql:author', values: ['alice', 'bob'], type: 'any'}]},
                {facets: {}},
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_author_field: String!, $jgql_author_value: String!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      term: [
                        {
                          operation: OR
                          terms: [{ field: $jgql_author_field, value: $jgql_author_value }]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "jgql_author_field": "jgql:author",
                  "jgql_author_value": "alice",
                },
              }
            `);
        });

        it('maps type "any" to OR', () => {
            expect(argsFor(
                {filters: [{field: 'jgql:author', values: ['alice'], type: 'any'}]},
                {facets: {}},
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_author_field: String!, $jgql_author_value: String!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      term: [
                        {
                          operation: OR
                          terms: [{ field: $jgql_author_field, value: $jgql_author_value }]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "jgql_author_field": "jgql:author",
                  "jgql_author_value": "alice",
                },
              }
            `);
        });

        it('maps any other type to AND', () => {
            expect(argsFor(
                {filters: [{field: 'jgql:author', values: ['alice'], type: 'all'}]},
                {facets: {}},
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_author_field: String!, $jgql_author_value: String!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      term: [
                        {
                          operation: AND
                          terms: [{ field: $jgql_author_field, value: $jgql_author_value }]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "jgql_author_field": "jgql:author",
                  "jgql_author_value": "alice",
                },
              }
            `);
        });

        it('emits one term group per field', () => {
            expect(argsFor(
                {filters: [
                    {field: 'jgql:author', values: ['alice'], type: 'all'},
                    {field: 'jgql:lang', values: ['fr'], type: 'any'}
                ]},
                {facets: {}},
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_author_field: String!, $jgql_author_value: String!, $jgql_lang_field: String!, $jgql_lang_value: String!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      term: [
                        {
                          operation: AND
                          terms: [{ field: $jgql_author_field, value: $jgql_author_value }]
                        }
                        { operation: OR, terms: [{ field: $jgql_lang_field, value: $jgql_lang_value }] }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "jgql_author_field": "jgql:author",
                  "jgql_author_value": "alice",
                  "jgql_lang_field": "jgql:lang",
                  "jgql_lang_value": "fr",
                },
              }
            `);
        });

        // Was a KNOWN BUG: values used to be interpolated into the query with no escaping at all, so
        // a quote produced a document that could not even be parsed. The value is now a variable,
        // so it reaches the server verbatim and never touches the document.
        it('sends a value containing a quote as a variable, verbatim', () => {
            const {query, variables} = argsFor(
                {filters: [{field: 'jgql:author', values: ['a"b'], type: 'any'}]},
                {facets: {}},
                {}
            );
            expect(query).not.toContain('a"b');
            expect(variables).toEqual({'jgql_author_field': 'jgql:author', 'jgql_author_value': 'a"b'});
        });

        // The same holds for input that used to be able to close an argument list and append to the
        // query. There is no longer any path from a filter value into the document text.
        it('cannot break out of the query, whatever the value contains', () => {
            const {query, variables} = argsFor(
                {filters: [{field: 'jgql:author', values: ['") {id} evil('], type: 'any'}]},
                {facets: {}},
                {}
            );
            expect(query).not.toContain('evil');
            expect(variables['jgql_author_value']).toBe('") {id} evil(');
        });
    });

    describe('value facets', () => {
        it('emits every selected value as a term', () => {
            expect(argsFor(
                {filters: [{field: 'jgql:tags', values: ['Action', 'Adventure'], type: 'all'}]},
                valueFacetConfig,
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_tags_field: String!, $jgql_tags_value: String!, $jgql_tags_field_2: String!, $jgql_tags_value_2: String!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      term: [
                        {
                          operation: AND
                          terms: [
                            { field: $jgql_tags_field, value: $jgql_tags_value }
                            { field: $jgql_tags_field_2, value: $jgql_tags_value_2 }
                          ]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "jgql_tags_field": "jgql:tags",
                  "jgql_tags_field_2": "jgql:tags",
                  "jgql_tags_value": "Action",
                  "jgql_tags_value_2": "Adventure",
                },
              }
            `);
        });

        it('treats an unrecognised facet type as a value facet', () => {
            expect(argsFor(
                {filters: [{field: 'weird', values: ['x', 'y'], type: 'any'}]},
                {facets: {weird: {type: 'not-a-real-type'} as unknown as FacetConfig}},
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($weird_field: String!, $weird_value: String!, $weird_field_2: String!, $weird_value_2: String!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      term: [
                        {
                          operation: OR
                          terms: [
                            { field: $weird_field, value: $weird_value }
                            { field: $weird_field_2, value: $weird_value_2 }
                          ]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "weird_field": "weird",
                  "weird_field_2": "weird",
                  "weird_value": "x",
                  "weird_value_2": "y",
                },
              }
            `);
        });
    });

    describe('range facets', () => {
        it('emits a single selected range', () => {
            expect(argsFor(
                {filters: [{field: 'popularity', values: ['high'], type: 'any'}]},
                rangeFacetConfig,
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($popularity_field: String!, $popularity_gte: Float!, $popularity_lt: Float!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      numberRange: [
                        {
                          operation: AND
                          ranges: [{ field: $popularity_field, gte: $popularity_gte, lt: $popularity_lt }]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "popularity_field": "popularity",
                  "popularity_gte": 500,
                  "popularity_lt": 1000,
                },
              }
            `);
        });

        it('accumulates several selected ranges on the same field', () => {
            expect(argsFor(
                {filters: [{field: 'popularity', values: ['low', 'high'], type: 'any'}]},
                rangeFacetConfig,
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($popularity_field: String!, $popularity_gte: Float!, $popularity_lt: Float!, $popularity_field_2: String!, $popularity_gte_2: Float!, $popularity_lt_2: Float!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      numberRange: [
                        {
                          operation: AND
                          ranges: [
                            { field: $popularity_field, gte: $popularity_gte, lt: $popularity_lt }
                            { field: $popularity_field_2, gte: $popularity_gte_2, lt: $popularity_lt_2 }
                          ]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "popularity_field": "popularity",
                  "popularity_field_2": "popularity",
                  "popularity_gte": 0,
                  "popularity_gte_2": 500,
                  "popularity_lt": 500,
                  "popularity_lt_2": 1000,
                },
              }
            `);
        });

        // KNOWN BUG: the selected value is looked up in facet.ranges with no miss handling, so a
        // stale or unknown range name crashes instead of being ignored.
        it('throws when the selected range is not in the config (KNOWN BUG)', () => {
            expect(() => fragmentFor(
                {filters: [{field: 'popularity', values: ['does-not-exist'], type: 'any'}]},
                rangeFacetConfig,
                {}
            )).toThrow(TypeError);
        });
    });

    describe('date_range facets', () => {
        it('emits a single selected range', () => {
            expect(argsFor(
                {filters: [{field: 'jgql:lastModified', values: ['last year'], type: 'any'}]},
                dateRangeFacetConfig,
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_lastModified_field: String!, $jgql_lastModified_after: String!, $jgql_lastModified_before: String!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      dateRange: [
                        {
                          operation: AND
                          ranges: [
                            {
                              field: $jgql_lastModified_field
                              after: $jgql_lastModified_after
                              before: $jgql_lastModified_before
                            }
                          ]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "jgql_lastModified_after": "now-1y",
                  "jgql_lastModified_before": "now",
                  "jgql_lastModified_field": "jgql:lastModified",
                },
              }
            `);
        });

        it('accumulates several selected ranges on the same field', () => {
            expect(argsFor(
                {filters: [{field: 'jgql:lastModified', values: ['last year', 'last 5 years'], type: 'any'}]},
                dateRangeFacetConfig,
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_lastModified_field: String!, $jgql_lastModified_after: String!, $jgql_lastModified_before: String!, $jgql_lastModified_field_2: String!, $jgql_lastModified_after_2: String!, $jgql_lastModified_before_2: String!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      dateRange: [
                        {
                          operation: AND
                          ranges: [
                            {
                              field: $jgql_lastModified_field
                              after: $jgql_lastModified_after
                              before: $jgql_lastModified_before
                            }
                            {
                              field: $jgql_lastModified_field_2
                              after: $jgql_lastModified_after_2
                              before: $jgql_lastModified_before_2
                            }
                          ]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "jgql_lastModified_after": "now-1y",
                  "jgql_lastModified_after_2": "now-5y",
                  "jgql_lastModified_before": "now",
                  "jgql_lastModified_before_2": "now-1y",
                  "jgql_lastModified_field": "jgql:lastModified",
                  "jgql_lastModified_field_2": "jgql:lastModified",
                },
              }
            `);
        });

        // KNOWN BUG: same missing-range crash as the numeric case above.
        it('throws when the selected range is not in the config (KNOWN BUG)', () => {
            expect(() => fragmentFor(
                {filters: [{field: 'jgql:lastModified', values: ['does-not-exist'], type: 'any'}]},
                dateRangeFacetConfig,
                {}
            )).toThrow(TypeError);
        });
    });

    describe('the custom block', () => {
        // The three sub-keys are emitted independently; each combination is a distinct branch.
        const config: QueryConfig = {
            facets: {
                ...valueFacetConfig.facets,
                ...rangeFacetConfig.facets,
                ...dateRangeFacetConfig.facets
            }
        };

        it('omits dateRange and numberRange when only terms are selected', () => {
            expect(argsFor(
                {filters: [{field: 'jgql:tags', values: ['Action'], type: 'all'}]},
                config,
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_tags_field: String!, $jgql_tags_value: String!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      term: [
                        {
                          operation: AND
                          terms: [{ field: $jgql_tags_field, value: $jgql_tags_value }]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "jgql_tags_field": "jgql:tags",
                  "jgql_tags_value": "Action",
                },
              }
            `);
        });

        it('omits term and numberRange when only a date range is selected', () => {
            expect(argsFor(
                {filters: [{field: 'jgql:lastModified', values: ['last year'], type: 'all'}]},
                config,
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_lastModified_field: String!, $jgql_lastModified_after: String!, $jgql_lastModified_before: String!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      dateRange: [
                        {
                          operation: AND
                          ranges: [
                            {
                              field: $jgql_lastModified_field
                              after: $jgql_lastModified_after
                              before: $jgql_lastModified_before
                            }
                          ]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "jgql_lastModified_after": "now-1y",
                  "jgql_lastModified_before": "now",
                  "jgql_lastModified_field": "jgql:lastModified",
                },
              }
            `);
        });

        it('omits term and dateRange when only a numeric range is selected', () => {
            expect(argsFor(
                {filters: [{field: 'popularity', values: ['high'], type: 'all'}]},
                config,
                {}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($popularity_field: String!, $popularity_gte: Float!, $popularity_lt: Float!) {
                search(
                  q: ""
                  filters: {
                    custom: {
                      numberRange: [
                        {
                          operation: AND
                          ranges: [{ field: $popularity_field, gte: $popularity_gte, lt: $popularity_lt }]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "popularity_field": "popularity",
                  "popularity_gte": 500,
                  "popularity_lt": 1000,
                },
              }
            `);
        });

        it('emits all three alongside nodeType', () => {
            expect(argsFor(
                {filters: [
                    {field: 'jgql:tags', values: ['Action'], type: 'all'},
                    {field: 'jgql:lastModified', values: ['last year'], type: 'all'},
                    {field: 'popularity', values: ['high'], type: 'all'}
                ]},
                config,
                {nodeType: 'jnt:page'}
            )).toMatchInlineSnapshot(`
              {
                "query": "query ($nodeType: String!, $jgql_tags_field: String!, $jgql_tags_value: String!, $jgql_lastModified_field: String!, $jgql_lastModified_after: String!, $jgql_lastModified_before: String!, $popularity_field: String!, $popularity_gte: Float!, $popularity_lt: Float!) {
                search(
                  q: ""
                  filters: {
                    nodeType: { type: $nodeType }
                    custom: {
                      term: [
                        {
                          operation: AND
                          terms: [{ field: $jgql_tags_field, value: $jgql_tags_value }]
                        }
                      ]
                      dateRange: [
                        {
                          operation: AND
                          ranges: [
                            {
                              field: $jgql_lastModified_field
                              after: $jgql_lastModified_after
                              before: $jgql_lastModified_before
                            }
                          ]
                        }
                      ]
                      numberRange: [
                        {
                          operation: AND
                          ranges: [{ field: $popularity_field, gte: $popularity_gte, lt: $popularity_lt }]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }",
                "variables": {
                  "jgql_lastModified_after": "now-1y",
                  "jgql_lastModified_before": "now",
                  "jgql_lastModified_field": "jgql:lastModified",
                  "jgql_tags_field": "jgql:tags",
                  "jgql_tags_value": "Action",
                  "nodeType": "jnt:page",
                  "popularity_field": "popularity",
                  "popularity_gte": 500,
                  "popularity_lt": 1000,
                },
              }
            `);
        });
    });
});
