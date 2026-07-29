import filters from '../filters.js';
import {normalizeArgs} from './helpers.js';

/**
 * Characterization tests for `filters()`, written ahead of a rewrite: they record what the current
 * implementation does, not what it ought to do. Cases that pin behaviour we believe is wrong are
 * marked KNOWN BUG — a rewrite that fixes one of them SHOULD fail here, and the expectation should
 * then be updated deliberately rather than the test deleted.
 */

const rangeFacetConfig = {
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

const dateRangeFacetConfig = {
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

const valueFacetConfig = {facets: {'jgql:tags': {type: 'value'}}};

describe('filters', () => {
    describe('no filters produced', () => {
        it('returns an empty string with no nodeType and no request filters', () => {
            expect(filters({}, {facets: {}}, {})).toBe('');
        });

        it('returns an empty string when request.filters is an empty array', () => {
            expect(filters({filters: []}, {facets: {}}, {})).toBe('');
        });

        it('emits only the nodeType filter when there are no request filters', () => {
            expect(normalizeArgs(filters({}, {facets: {}}, {nodeType: 'jnt:page'}))).toMatchInlineSnapshot(`
              "{
                search(q: "", filters: { nodeType: { type: "jnt:page" } }) {
                  totalHits
                }
              }"
            `);
        });
    });

    describe('fields that are not declared as facets', () => {
        // KNOWN BUG: only values[0] reaches the query. The declared-facet branches below iterate
        // filter.values; this one indexes it. Selecting two values on an undeclared field silently
        // drops all but the first.
        it('keeps only the first value (KNOWN BUG)', () => {
            expect(normalizeArgs(filters(
                {filters: [{field: 'jgql:author', values: ['alice', 'bob'], type: 'any'}]},
                {facets: {}},
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: { term: [{ operation: OR, terms: [{ field: "jgql:author", value: "alice" }] }] }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });

        it('maps type "any" to OR', () => {
            expect(normalizeArgs(filters(
                {filters: [{field: 'jgql:author', values: ['alice'], type: 'any'}]},
                {facets: {}},
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: { term: [{ operation: OR, terms: [{ field: "jgql:author", value: "alice" }] }] }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });

        it('maps any other type to AND', () => {
            expect(normalizeArgs(filters(
                {filters: [{field: 'jgql:author', values: ['alice'], type: 'all'}]},
                {facets: {}},
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: {
                      term: [{ operation: AND, terms: [{ field: "jgql:author", value: "alice" }] }]
                    }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });

        it('emits one term group per field', () => {
            expect(normalizeArgs(filters(
                {filters: [
                    {field: 'jgql:author', values: ['alice'], type: 'all'},
                    {field: 'jgql:lang', values: ['fr'], type: 'any'}
                ]},
                {facets: {}},
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: {
                      term: [
                        { operation: AND, terms: [{ field: "jgql:author", value: "alice" }] }
                        { operation: OR, terms: [{ field: "jgql:lang", value: "fr" }] }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });

        // KNOWN BUG: filter values are interpolated into the GraphQL string with no escaping, so a
        // quote in a value produces a query that cannot be parsed. Unlike the search term (which
        // goes through htmlEscape) there is no barrier here at all.
        it('does not escape quotes in values, producing an unparseable query (KNOWN BUG)', () => {
            const fragment = filters(
                {filters: [{field: 'jgql:author', values: ['a"b'], type: 'any'}]},
                {facets: {}},
                {}
            );
            expect(fragment).toContain('value:"a"b"');
            expect(() => normalizeArgs(fragment)).toThrow('Syntax Error: Unterminated string.');
        });
    });

    describe('value facets', () => {
        it('emits every selected value as a term', () => {
            expect(normalizeArgs(filters(
                {filters: [{field: 'jgql:tags', values: ['Action', 'Adventure'], type: 'all'}]},
                valueFacetConfig,
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: {
                      term: [
                        {
                          operation: AND
                          terms: [
                            { field: "jgql:tags", value: "Action" }
                            { field: "jgql:tags", value: "Adventure" }
                          ]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });

        it('treats an unrecognised facet type as a value facet', () => {
            expect(normalizeArgs(filters(
                {filters: [{field: 'weird', values: ['x', 'y'], type: 'any'}]},
                {facets: {weird: {type: 'not-a-real-type'}}},
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: {
                      term: [
                        {
                          operation: OR
                          terms: [{ field: "weird", value: "x" }, { field: "weird", value: "y" }]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });
    });

    describe('range facets', () => {
        it('emits a single selected range', () => {
            expect(normalizeArgs(filters(
                {filters: [{field: 'popularity', values: ['high'], type: 'any'}]},
                rangeFacetConfig,
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: {
                      numberRange: [{ operation: AND, ranges: [{ field: "popularity", gte: 500.0, lt: 1000.0 }] }]
                    }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });

        it('accumulates several selected ranges on the same field', () => {
            expect(normalizeArgs(filters(
                {filters: [{field: 'popularity', values: ['low', 'high'], type: 'any'}]},
                rangeFacetConfig,
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: {
                      numberRange: [
                        {
                          operation: AND
                          ranges: [
                            { field: "popularity", gte: 0.0, lt: 500.0 }
                            { field: "popularity", gte: 500.0, lt: 1000.0 }
                          ]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });

        // KNOWN BUG: the selected value is looked up in facet.ranges with no miss handling, so a
        // stale or unknown range name crashes instead of being ignored.
        it('throws when the selected range is not in the config (KNOWN BUG)', () => {
            expect(() => filters(
                {filters: [{field: 'popularity', values: ['does-not-exist'], type: 'any'}]},
                rangeFacetConfig,
                {}
            )).toThrow(TypeError);
        });
    });

    describe('date_range facets', () => {
        it('emits a single selected range', () => {
            expect(normalizeArgs(filters(
                {filters: [{field: 'jgql:lastModified', values: ['last year'], type: 'any'}]},
                dateRangeFacetConfig,
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: {
                      dateRange: [
                        {
                          operation: AND
                          ranges: [{ field: "jgql:lastModified", after: "now-1y", before: "now" }]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });

        it('accumulates several selected ranges on the same field', () => {
            expect(normalizeArgs(filters(
                {filters: [{field: 'jgql:lastModified', values: ['last year', 'last 5 years'], type: 'any'}]},
                dateRangeFacetConfig,
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: {
                      dateRange: [
                        {
                          operation: AND
                          ranges: [
                            { field: "jgql:lastModified", after: "now-1y", before: "now" }
                            { field: "jgql:lastModified", after: "now-5y", before: "now-1y" }
                          ]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });

        // KNOWN BUG: same missing-range crash as the numeric case above.
        it('throws when the selected range is not in the config (KNOWN BUG)', () => {
            expect(() => filters(
                {filters: [{field: 'jgql:lastModified', values: ['does-not-exist'], type: 'any'}]},
                dateRangeFacetConfig,
                {}
            )).toThrow(TypeError);
        });
    });

    describe('the custom block', () => {
        // The three sub-keys are emitted independently; each combination is a distinct branch.
        const config = {
            facets: {
                ...valueFacetConfig.facets,
                ...rangeFacetConfig.facets,
                ...dateRangeFacetConfig.facets
            }
        };

        it('omits dateRange and numberRange when only terms are selected', () => {
            expect(normalizeArgs(filters(
                {filters: [{field: 'jgql:tags', values: ['Action'], type: 'all'}]},
                config,
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: { term: [{ operation: AND, terms: [{ field: "jgql:tags", value: "Action" }] }] }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });

        it('omits term and numberRange when only a date range is selected', () => {
            expect(normalizeArgs(filters(
                {filters: [{field: 'jgql:lastModified', values: ['last year'], type: 'all'}]},
                config,
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: {
                      dateRange: [
                        {
                          operation: AND
                          ranges: [{ field: "jgql:lastModified", after: "now-1y", before: "now" }]
                        }
                      ]
                    }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });

        it('omits term and dateRange when only a numeric range is selected', () => {
            expect(normalizeArgs(filters(
                {filters: [{field: 'popularity', values: ['high'], type: 'all'}]},
                config,
                {}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    custom: {
                      numberRange: [{ operation: AND, ranges: [{ field: "popularity", gte: 500.0, lt: 1000.0 }] }]
                    }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });

        it('emits all three alongside nodeType', () => {
            expect(normalizeArgs(filters(
                {filters: [
                    {field: 'jgql:tags', values: ['Action'], type: 'all'},
                    {field: 'jgql:lastModified', values: ['last year'], type: 'all'},
                    {field: 'popularity', values: ['high'], type: 'all'}
                ]},
                config,
                {nodeType: 'jnt:page'}
            ))).toMatchInlineSnapshot(`
              "{
                search(
                  q: ""
                  filters: {
                    nodeType: { type: "jnt:page" }
                    custom: {
                      term: [{ operation: AND, terms: [{ field: "jgql:tags", value: "Action" }] }]
                      dateRange: [
                        {
                          operation: AND
                          ranges: [{ field: "jgql:lastModified", after: "now-1y", before: "now" }]
                        }
                      ]
                      numberRange: [{ operation: AND, ranges: [{ field: "popularity", gte: 500.0, lt: 1000.0 }] }]
                    }
                  }
                ) {
                  totalHits
                }
              }"
            `);
        });
    });
});
