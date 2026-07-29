import facets from '../facets.js';
import {normalizeSelections} from './helpers.js';
import {GraphQLVariables} from '../graphql.js';
import type {NormalizedFragment} from './helpers.js';
import type {FacetConfig, QueryConfig, RequestState} from '../types.js';

const selectionsFor = (request: RequestState, queryConfig: QueryConfig): NormalizedFragment =>
    normalizeSelections(v => facets(request, queryConfig, v));

/** For the cases that assert on the raw fragment rather than the parsed document. */
const fragmentFor = (request: RequestState, queryConfig: QueryConfig): string =>
    facets(request, queryConfig, new GraphQLVariables());

/**
 * Tests for `facets()`. Most began as characterization tests recording what the string-building
 * implementation did; the cases that pinned a bug the move to variables fixed now pin the fix.
 *
 * Every value is a variable, so an assertion covers both the document — which must carry nothing
 * caller-supplied but the response key — and the values sent alongside it.
 *
 * `extractSelections`, which walked `request.filters` into a `selections` array that the
 * query-building loop never read, is gone. It was dead code no test could observe, and keeping it
 * would have meant registering variables the document never references, which invalidates a query.
 * 'ignores request filters entirely' still pins the behaviour it was invisible to.
 */

describe('facets', () => {
    describe('nothing to emit', () => {
        it('returns an empty string when the config has no facets key', () => {
            expect(fragmentFor({}, {})).toBe('');
        });

        it('returns an empty string when the facets config is empty', () => {
            expect(fragmentFor({}, {facets: {}})).toBe('');
        });

        // The value/range branches are an if/else-if chain with no fallback, so a facet whose type
        // is neither 'value' nor 'range'/'date_range' produces no facet query at all. Note the
        // inconsistency with filters(), which treats an unknown type as a value facet: a typo in a
        // facet type yields filtering with no corresponding facet.
        it('silently drops a facet with an unrecognised type', () => {
            expect(fragmentFor({}, {facets: {weird: {type: 'not-a-real-type'} as unknown as FacetConfig}})).toBe('');
        });

        // Dropping it must also leave no trace in the variables: a variable that is declared but
        // never referenced makes the whole query invalid.
        it('registers no variables for a facet it drops', () => {
            const variables = new GraphQLVariables();
            facets({}, {facets: {weird: {type: 'not-a-real-type'} as unknown as FacetConfig}}, variables);
            expect(variables.values()).toEqual({});
        });
    });

    describe('term facets', () => {
        it('omits max and minDocCount when neither is configured', () => {
            expect(selectionsFor({}, {facets: {'jgql:tags': {type: 'value'}}})).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_tags_disjunctive: Boolean!, $jgql_tags_field: String!) {
                search {
                  totalHits
                  jgql_tags: termFacet(
                    field: $jgql_tags_field
                    disjunctive: $jgql_tags_disjunctive
                  ) {
                    data {
                      value
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "jgql_tags_disjunctive": false,
                  "jgql_tags_field": "jgql:tags",
                },
              }
            `);
        });

        it('emits max only', () => {
            expect(selectionsFor({}, {facets: {'jgql:tags': {type: 'value', max: 10}}})).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_tags_disjunctive: Boolean!, $jgql_tags_field: String!, $jgql_tags_max: Int!) {
                search {
                  totalHits
                  jgql_tags: termFacet(
                    field: $jgql_tags_field
                    disjunctive: $jgql_tags_disjunctive
                    max: $jgql_tags_max
                  ) {
                    data {
                      value
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "jgql_tags_disjunctive": false,
                  "jgql_tags_field": "jgql:tags",
                  "jgql_tags_max": 10,
                },
              }
            `);
        });

        it('emits minDocCount only', () => {
            expect(selectionsFor({}, {facets: {'jgql:tags': {type: 'value', minDoc: 1}}})).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_tags_disjunctive: Boolean!, $jgql_tags_field: String!, $jgql_tags_minDocCount: Int!) {
                search {
                  totalHits
                  jgql_tags: termFacet(
                    field: $jgql_tags_field
                    disjunctive: $jgql_tags_disjunctive
                    minDocCount: $jgql_tags_minDocCount
                  ) {
                    data {
                      value
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "jgql_tags_disjunctive": false,
                  "jgql_tags_field": "jgql:tags",
                  "jgql_tags_minDocCount": 1,
                },
              }
            `);
        });

        it('emits both, and coerces a missing disjunctive to false', () => {
            expect(selectionsFor({}, {facets: {'jgql:tags': {type: 'value', max: 10, minDoc: 1}}})).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_tags_disjunctive: Boolean!, $jgql_tags_field: String!, $jgql_tags_max: Int!, $jgql_tags_minDocCount: Int!) {
                search {
                  totalHits
                  jgql_tags: termFacet(
                    field: $jgql_tags_field
                    disjunctive: $jgql_tags_disjunctive
                    max: $jgql_tags_max
                    minDocCount: $jgql_tags_minDocCount
                  ) {
                    data {
                      value
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "jgql_tags_disjunctive": false,
                  "jgql_tags_field": "jgql:tags",
                  "jgql_tags_max": 10,
                  "jgql_tags_minDocCount": 1,
                },
              }
            `);
        });

        it('emits disjunctive true', () => {
            expect(selectionsFor({}, {facets: {'jgql:tags': {type: 'value', disjunctive: true}}})).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_tags_disjunctive: Boolean!, $jgql_tags_field: String!) {
                search {
                  totalHits
                  jgql_tags: termFacet(
                    field: $jgql_tags_field
                    disjunctive: $jgql_tags_disjunctive
                  ) {
                    data {
                      value
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "jgql_tags_disjunctive": true,
                  "jgql_tags_field": "jgql:tags",
                },
              }
            `);
        });

        it('replaces colons and dots in the response alias but not in the field argument', () => {
            expect(selectionsFor({}, {facets: {'jgql:categories.path': {type: 'value'}}})).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_categories_path_disjunctive: Boolean!, $jgql_categories_path_field: String!) {
                search {
                  totalHits
                  jgql_categories_path: termFacet(
                    field: $jgql_categories_path_field
                    disjunctive: $jgql_categories_path_disjunctive
                  ) {
                    data {
                      value
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "jgql_categories_path_disjunctive": false,
                  "jgql_categories_path_field": "jgql:categories.path",
                },
              }
            `);
        });
    });

    describe('tree facets', () => {
        it('emits rootPath, max and minDocCount', () => {
            expect(selectionsFor({}, {
                facets: {'jgql:categories_path': {type: 'value', hierarchical: true, rootPath: '/sites', max: 50, minDoc: 1, disjunctive: true}}
            })).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_categories_path_rootPath: String!, $jgql_categories_path_disjunctive: Boolean!, $jgql_categories_path_field: String!, $jgql_categories_path_max: Int!, $jgql_categories_path_minDocCount: Int!) {
                search {
                  totalHits
                  jgql_categories_path: treeFacet(
                    field: $jgql_categories_path_field
                    rootPath: $jgql_categories_path_rootPath
                    disjunctive: $jgql_categories_path_disjunctive
                    max: $jgql_categories_path_max
                    minDocCount: $jgql_categories_path_minDocCount
                  ) {
                    data {
                      value
                      count
                      key
                      hasChildren
                      rootPath
                      filter
                    }
                  }
                }
              }",
                "variables": {
                  "jgql_categories_path_disjunctive": true,
                  "jgql_categories_path_field": "jgql:categories_path",
                  "jgql_categories_path_max": 50,
                  "jgql_categories_path_minDocCount": 1,
                  "jgql_categories_path_rootPath": "/sites",
                },
              }
            `);
        });

        // Was a KNOWN BUG: rootPath used to be interpolated with no guard, so an unset one reached
        // the backend as the literal string "undefined". The argument is now left out entirely —
        // it cannot be sent as null, because the variables are declared non-null.
        it('omits rootPath when it is unset', () => {
            expect(selectionsFor({}, {facets: {c: {type: 'value', hierarchical: true}}})).toMatchInlineSnapshot(`
              {
                "query": "query ($c_disjunctive: Boolean!, $c_field: String!) {
                search {
                  totalHits
                  c: treeFacet(field: $c_field, disjunctive: $c_disjunctive) {
                    data {
                      value
                      count
                      key
                      hasChildren
                      rootPath
                      filter
                    }
                  }
                }
              }",
                "variables": {
                  "c_disjunctive": false,
                  "c_field": "c",
                },
              }
            `);
        });

        it('only treats hierarchical === true as a tree facet', () => {
            expect(selectionsFor({}, {facets: {c: {type: 'value', hierarchical: 'yes'} as unknown as FacetConfig}})).toMatchInlineSnapshot(`
              {
                "query": "query ($c_disjunctive: Boolean!, $c_field: String!) {
                search {
                  totalHits
                  c: termFacet(field: $c_field, disjunctive: $c_disjunctive) {
                    data {
                      value
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "c_disjunctive": false,
                  "c_field": "c",
                },
              }
            `);
        });
    });

    describe('range facets', () => {
        const ranges = [
            {from: '0.0', to: '500.0', name: 'low'},
            {from: '500.0', to: '1000.0', name: 'high'}
        ];

        it('emits ranges without max', () => {
            expect(selectionsFor({}, {facets: {popularity: {type: 'range', ranges}}})).toMatchInlineSnapshot(`
              {
                "query": "query ($popularity_0_name: String!, $popularity_0_from: String!, $popularity_0_to: String!, $popularity_1_name: String!, $popularity_1_from: String!, $popularity_1_to: String!, $popularity_field: String!) {
                search {
                  totalHits
                  popularity: rangeFacet(
                    field: $popularity_field
                    ranges: [
                      { name: $popularity_0_name, from: $popularity_0_from, to: $popularity_0_to }
                      { name: $popularity_1_name, from: $popularity_1_from, to: $popularity_1_to }
                    ]
                  ) {
                    data {
                      name
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "popularity_0_from": "0.0",
                  "popularity_0_name": "low",
                  "popularity_0_to": "500.0",
                  "popularity_1_from": "500.0",
                  "popularity_1_name": "high",
                  "popularity_1_to": "1000.0",
                  "popularity_field": "popularity",
                },
              }
            `);
        });

        it('emits ranges with max', () => {
            expect(selectionsFor({}, {facets: {popularity: {type: 'range', ranges, max: 7}}})).toMatchInlineSnapshot(`
              {
                "query": "query ($popularity_0_name: String!, $popularity_0_from: String!, $popularity_0_to: String!, $popularity_1_name: String!, $popularity_1_from: String!, $popularity_1_to: String!, $popularity_field: String!, $popularity_max: Int!) {
                search {
                  totalHits
                  popularity: rangeFacet(
                    field: $popularity_field
                    ranges: [
                      { name: $popularity_0_name, from: $popularity_0_from, to: $popularity_0_to }
                      { name: $popularity_1_name, from: $popularity_1_from, to: $popularity_1_to }
                    ]
                    max: $popularity_max
                  ) {
                    data {
                      name
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "popularity_0_from": "0.0",
                  "popularity_0_name": "low",
                  "popularity_0_to": "500.0",
                  "popularity_1_from": "500.0",
                  "popularity_1_name": "high",
                  "popularity_1_to": "1000.0",
                  "popularity_field": "popularity",
                  "popularity_max": 7,
                },
              }
            `);
        });

        it('emits a date_range facet the same way', () => {
            expect(selectionsFor({}, {
                facets: {'jgql:lastModified': {type: 'date_range', ranges: [{from: 'now-1y', to: 'now', name: 'last year'}]}}
            })).toMatchInlineSnapshot(`
              {
                "query": "query ($jgql_lastModified_0_name: String!, $jgql_lastModified_0_from: String!, $jgql_lastModified_0_to: String!, $jgql_lastModified_field: String!) {
                search {
                  totalHits
                  jgql_lastModified: rangeFacet(
                    field: $jgql_lastModified_field
                    ranges: [
                      {
                        name: $jgql_lastModified_0_name
                        from: $jgql_lastModified_0_from
                        to: $jgql_lastModified_0_to
                      }
                    ]
                  ) {
                    data {
                      name
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "jgql_lastModified_0_from": "now-1y",
                  "jgql_lastModified_0_name": "last year",
                  "jgql_lastModified_0_to": "now",
                  "jgql_lastModified_field": "jgql:lastModified",
                },
              }
            `);
        });

        it('emits a range with only a from, and one with only a to', () => {
            expect(selectionsFor({}, {
                facets: {popularity: {type: 'range', ranges: [{from: '500.0', name: 'from only'}, {to: '500.0', name: 'to only'}]}}
            })).toMatchInlineSnapshot(`
              {
                "query": "query ($popularity_0_name: String!, $popularity_0_from: String!, $popularity_1_name: String!, $popularity_1_to: String!, $popularity_field: String!) {
                search {
                  totalHits
                  popularity: rangeFacet(
                    field: $popularity_field
                    ranges: [
                      { name: $popularity_0_name, from: $popularity_0_from }
                      { name: $popularity_1_name, to: $popularity_1_to }
                    ]
                  ) {
                    data {
                      name
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "popularity_0_from": "500.0",
                  "popularity_0_name": "from only",
                  "popularity_1_name": "to only",
                  "popularity_1_to": "500.0",
                  "popularity_field": "popularity",
                },
              }
            `);
        });

        // Was a KNOWN BUG: buildRangeValue tested the bounds for truthiness rather than presence, so
        // `{from: 0, to: 100}` lost its lower bound and became an open-ended range. Deciding whether
        // to send an argument is now a presence check, because a variable cannot carry an absent
        // value — so 0 is a bound like any other.
        it('keeps a numeric bound of 0', () => {
            expect(selectionsFor({}, {
                facets: {popularity: {type: 'range', ranges: [{from: 0, to: 100, name: 'first hundred'}]}}
            })).toMatchInlineSnapshot(`
              {
                "query": "query ($popularity_0_name: String!, $popularity_0_from: String!, $popularity_0_to: String!, $popularity_field: String!) {
                search {
                  totalHits
                  popularity: rangeFacet(
                    field: $popularity_field
                    ranges: [{ name: $popularity_0_name, from: $popularity_0_from, to: $popularity_0_to }]
                  ) {
                    data {
                      name
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "popularity_0_from": "0",
                  "popularity_0_name": "first hundred",
                  "popularity_0_to": "100",
                  "popularity_field": "popularity",
                },
              }
            `);
        });
    });

    describe('multiple facets', () => {
        it('groups by type and emits value facets before range facets', () => {
            expect(selectionsFor({}, {
                facets: {
                    popularity: {type: 'range', ranges: [{from: '0.0', to: '1.0', name: 'r'}]},
                    'jgql:tags': {type: 'value', max: 10},
                    'jgql:lastModified': {type: 'date_range', ranges: [{from: 'now-1y', to: 'now', name: 'd'}]}
                }
            })).toMatchInlineSnapshot(`
              {
                "query": "query ($popularity_0_name: String!, $popularity_0_from: String!, $popularity_0_to: String!, $popularity_field: String!, $jgql_tags_disjunctive: Boolean!, $jgql_tags_field: String!, $jgql_tags_max: Int!, $jgql_lastModified_0_name: String!, $jgql_lastModified_0_from: String!, $jgql_lastModified_0_to: String!, $jgql_lastModified_field: String!) {
                search {
                  totalHits
                  popularity: rangeFacet(
                    field: $popularity_field
                    ranges: [{ name: $popularity_0_name, from: $popularity_0_from, to: $popularity_0_to }]
                  ) {
                    data {
                      name
                      count
                    }
                  }
                  jgql_tags: termFacet(
                    field: $jgql_tags_field
                    disjunctive: $jgql_tags_disjunctive
                    max: $jgql_tags_max
                  ) {
                    data {
                      value
                      count
                    }
                  }
                  jgql_lastModified: rangeFacet(
                    field: $jgql_lastModified_field
                    ranges: [
                      {
                        name: $jgql_lastModified_0_name
                        from: $jgql_lastModified_0_from
                        to: $jgql_lastModified_0_to
                      }
                    ]
                  ) {
                    data {
                      name
                      count
                    }
                  }
                }
              }",
                "variables": {
                  "jgql_lastModified_0_from": "now-1y",
                  "jgql_lastModified_0_name": "d",
                  "jgql_lastModified_0_to": "now",
                  "jgql_lastModified_field": "jgql:lastModified",
                  "jgql_tags_disjunctive": false,
                  "jgql_tags_field": "jgql:tags",
                  "jgql_tags_max": 10,
                  "popularity_0_from": "0.0",
                  "popularity_0_name": "r",
                  "popularity_0_to": "1.0",
                  "popularity_field": "popularity",
                },
              }
            `);
        });

        // Both the document and the values it asks for: a request's filters must not leak into the
        // facet query in either form.
        it('ignores request filters entirely', () => {
            const config: QueryConfig = {facets: {'jgql:tags': {type: 'value', max: 10}}};
            const withFilters = selectionsFor({filters: [{field: 'jgql:tags', values: ['Action'], type: 'all'}]}, config);
            expect(withFilters).toEqual(selectionsFor({}, config));
        });
    });
});
