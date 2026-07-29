import facets from '../facets.js';
import {normalizeSelections} from './helpers.js';

/**
 * Characterization tests for `facets()`, written ahead of a rewrite: they record what the current
 * implementation does, not what it ought to do. Cases marked KNOWN BUG pin behaviour we believe is
 * wrong — a rewrite that fixes one SHOULD fail here, and the expectation should then be updated
 * deliberately rather than the test deleted.
 *
 * Note for the rewrite: `extractSelections` walks `request.filters` and stores a `selections` array
 * on each processed facet, but the query-building loop below it never reads that array. It is dead
 * code, and no test here can observe it — the outputs for a request with and without filters are
 * identical (pinned by 'ignores request filters entirely').
 */

describe('facets', () => {
    describe('nothing to emit', () => {
        it('returns an empty string when the config has no facets key', () => {
            expect(facets({}, {})).toBe('');
        });

        it('returns an empty string when the facets config is empty', () => {
            expect(facets({}, {facets: {}})).toBe('');
        });

        // The value/range branches are an if/else-if chain with no fallback, so a facet whose type
        // is neither 'value' nor 'range'/'date_range' produces no facet query at all. Note the
        // inconsistency with filters(), which treats an unknown type as a value facet: a typo in a
        // facet type yields filtering with no corresponding facet.
        it('silently drops a facet with an unrecognised type', () => {
            expect(facets({}, {facets: {weird: {type: 'not-a-real-type'}}})).toBe('');
        });
    });

    describe('term facets', () => {
        it('omits max and minDocCount when neither is configured', () => {
            expect(normalizeSelections(facets({}, {facets: {'jgql:tags': {type: 'value'}}}))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  jgql_tags: termFacet(field: "jgql:tags", disjunctive: false) {
                    data {
                      value
                      count
                    }
                  }
                }
              }"
            `);
        });

        it('emits max only', () => {
            expect(normalizeSelections(facets({}, {facets: {'jgql:tags': {type: 'value', max: 10}}}))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  jgql_tags: termFacet(field: "jgql:tags", disjunctive: false, max: 10) {
                    data {
                      value
                      count
                    }
                  }
                }
              }"
            `);
        });

        it('emits minDocCount only', () => {
            expect(normalizeSelections(facets({}, {facets: {'jgql:tags': {type: 'value', minDoc: 1}}}))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  jgql_tags: termFacet(field: "jgql:tags", disjunctive: false, minDocCount: 1) {
                    data {
                      value
                      count
                    }
                  }
                }
              }"
            `);
        });

        it('emits both, and coerces a missing disjunctive to false', () => {
            expect(normalizeSelections(facets({}, {facets: {'jgql:tags': {type: 'value', max: 10, minDoc: 1}}}))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  jgql_tags: termFacet(
                    field: "jgql:tags"
                    disjunctive: false
                    max: 10
                    minDocCount: 1
                  ) {
                    data {
                      value
                      count
                    }
                  }
                }
              }"
            `);
        });

        it('emits disjunctive true', () => {
            expect(normalizeSelections(facets({}, {facets: {'jgql:tags': {type: 'value', disjunctive: true}}}))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  jgql_tags: termFacet(field: "jgql:tags", disjunctive: true) {
                    data {
                      value
                      count
                    }
                  }
                }
              }"
            `);
        });

        it('replaces colons and dots in the response alias but not in the field argument', () => {
            expect(normalizeSelections(facets({}, {facets: {'jgql:categories.path': {type: 'value'}}}))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  jgql_categories_path: termFacet(
                    field: "jgql:categories.path"
                    disjunctive: false
                  ) {
                    data {
                      value
                      count
                    }
                  }
                }
              }"
            `);
        });
    });

    describe('tree facets', () => {
        it('emits rootPath, max and minDocCount', () => {
            expect(normalizeSelections(facets({}, {
                facets: {'jgql:categories_path': {type: 'value', hierarchical: true, rootPath: '/sites', max: 50, minDoc: 1, disjunctive: true}}
            }))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  jgql_categories_path: treeFacet(
                    field: "jgql:categories_path"
                    rootPath: "/sites"
                    disjunctive: true
                    max: 50
                    minDocCount: 1
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
              }"
            `);
        });

        // KNOWN BUG: rootPath is interpolated with no guard, so an unset rootPath is sent to the
        // backend as the literal string "undefined".
        it('sends the string "undefined" when rootPath is unset (KNOWN BUG)', () => {
            const fragment = facets({}, {facets: {c: {type: 'value', hierarchical: true}}});
            expect(fragment).toContain('rootPath: "undefined"');
            expect(normalizeSelections(fragment)).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  c: treeFacet(field: "c", rootPath: "undefined", disjunctive: false) {
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
              }"
            `);
        });

        it('only treats hierarchical === true as a tree facet', () => {
            expect(normalizeSelections(facets({}, {facets: {c: {type: 'value', hierarchical: 'yes'}}}))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  c: termFacet(field: "c", disjunctive: false) {
                    data {
                      value
                      count
                    }
                  }
                }
              }"
            `);
        });
    });

    describe('range facets', () => {
        const ranges = [
            {from: '0.0', to: '500.0', name: 'low'},
            {from: '500.0', to: '1000.0', name: 'high'}
        ];

        it('emits ranges without max', () => {
            expect(normalizeSelections(facets({}, {facets: {popularity: {type: 'range', ranges}}}))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  popularity: rangeFacet(
                    field: "popularity"
                    ranges: [
                      { name: "low", from: "0.0", to: "500.0" }
                      { name: "high", from: "500.0", to: "1000.0" }
                    ]
                  ) {
                    data {
                      name
                      count
                    }
                  }
                }
              }"
            `);
        });

        it('emits ranges with max', () => {
            expect(normalizeSelections(facets({}, {facets: {popularity: {type: 'range', ranges, max: 7}}}))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  popularity: rangeFacet(
                    field: "popularity"
                    ranges: [
                      { name: "low", from: "0.0", to: "500.0" }
                      { name: "high", from: "500.0", to: "1000.0" }
                    ]
                    max: 7
                  ) {
                    data {
                      name
                      count
                    }
                  }
                }
              }"
            `);
        });

        it('emits a date_range facet the same way', () => {
            expect(normalizeSelections(facets({}, {
                facets: {'jgql:lastModified': {type: 'date_range', ranges: [{from: 'now-1y', to: 'now', name: 'last year'}]}}
            }))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  jgql_lastModified: rangeFacet(
                    field: "jgql:lastModified"
                    ranges: [{ name: "last year", from: "now-1y", to: "now" }]
                  ) {
                    data {
                      name
                      count
                    }
                  }
                }
              }"
            `);
        });

        it('emits a range with only a from, and one with only a to', () => {
            expect(normalizeSelections(facets({}, {
                facets: {popularity: {type: 'range', ranges: [{from: '500.0', name: 'from only'}, {to: '500.0', name: 'to only'}]}}
            }))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  popularity: rangeFacet(
                    field: "popularity"
                    ranges: [{ name: "from only", from: "500.0" }, { name: "to only", to: "500.0" }]
                  ) {
                    data {
                      name
                      count
                    }
                  }
                }
              }"
            `);
        });

        // KNOWN BUG: buildRangeValue tests `range.from` / `range.to` for truthiness rather than for
        // presence, so a numeric bound of 0 is dropped from the query — `{from: 0, to: 100}` becomes
        // an open-ended range. String '0.0' is unaffected, which is why the fixtures above hide it.
        it('drops a numeric bound of 0 (KNOWN BUG)', () => {
            expect(normalizeSelections(facets({}, {
                facets: {popularity: {type: 'range', ranges: [{from: 0, to: 100, name: 'first hundred'}]}}
            }))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  popularity: rangeFacet(
                    field: "popularity"
                    ranges: [{ name: "first hundred", to: "100" }]
                  ) {
                    data {
                      name
                      count
                    }
                  }
                }
              }"
            `);
        });
    });

    describe('multiple facets', () => {
        it('groups by type and emits value facets before range facets', () => {
            expect(normalizeSelections(facets({}, {
                facets: {
                    popularity: {type: 'range', ranges: [{from: '0.0', to: '1.0', name: 'r'}]},
                    'jgql:tags': {type: 'value', max: 10},
                    'jgql:lastModified': {type: 'date_range', ranges: [{from: 'now-1y', to: 'now', name: 'd'}]}
                }
            }))).toMatchInlineSnapshot(`
              "{
                search {
                  totalHits
                  popularity: rangeFacet(
                    field: "popularity"
                    ranges: [{ name: "r", from: "0.0", to: "1.0" }]
                  ) {
                    data {
                      name
                      count
                    }
                  }
                  jgql_tags: termFacet(field: "jgql:tags", disjunctive: false, max: 10) {
                    data {
                      value
                      count
                    }
                  }
                  jgql_lastModified: rangeFacet(
                    field: "jgql:lastModified"
                    ranges: [{ name: "d", from: "now-1y", to: "now" }]
                  ) {
                    data {
                      name
                      count
                    }
                  }
                }
              }"
            `);
        });

        it('ignores request filters entirely', () => {
            const config = {facets: {'jgql:tags': {type: 'value', max: 10}}};
            const withFilters = facets({filters: [{field: 'jgql:tags', values: ['Action'], type: 'all'}]}, config);
            expect(withFilters).toBe(facets({}, config));
        });
    });
});
