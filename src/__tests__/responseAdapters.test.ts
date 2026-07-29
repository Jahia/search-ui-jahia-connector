import {getFacets, getResults} from '../responseAdapters.js';
import {Field, FieldType} from '../field.js';

/**
 * Characterization tests for `responseAdapters`, written ahead of a rewrite: they record what the
 * current implementation does, not what it ought to do. Cases marked KNOWN BUG pin behaviour we
 * believe is wrong — a rewrite that fixes one SHOULD fail here, and the expectation should then be
 * updated deliberately rather than the test deleted.
 */

describe('getFacets', () => {
    describe('nothing to normalize', () => {
        it('returns an empty object when the config has no facets key', () => {
            expect(getFacets({jgql_tags: {data: []}}, {})).toEqual({});
        });

        it('returns an empty object when the facets config is empty', () => {
            expect(getFacets({jgql_tags: {data: []}}, {facets: {}})).toEqual({});
        });

        it('returns an empty object when the response carries no facets', () => {
            expect(getFacets(undefined, {facets: {'jgql:tags': {type: 'value'}}})).toEqual({});
        });
    });

    describe('value facets', () => {
        it('looks the facet up by its sanitized alias and tags it with field and type', () => {
            expect(getFacets(
                {'jgql_categories_path': {data: [{value: 'Markets', count: 2}]}},
                {facets: {'jgql:categories.path': {type: 'value'}}}
            )).toMatchInlineSnapshot(`
              {
                "jgql:categories.path": [
                  {
                    "data": [
                      {
                        "count": 2,
                        "value": "Markets",
                      },
                    ],
                    "field": "jgql:categories.path",
                    "type": "value",
                  },
                ],
              }
            `);
        });

        it('passes the data through untouched', () => {
            expect(getFacets(
                {jgql_tags: {data: [{value: 'food', count: 1}, {value: 'health', count: 3}]}},
                {facets: {'jgql:tags': {type: 'value'}}}
            )).toMatchInlineSnapshot(`
              {
                "jgql:tags": [
                  {
                    "data": [
                      {
                        "count": 1,
                        "value": "food",
                      },
                      {
                        "count": 3,
                        "value": "health",
                      },
                    ],
                    "field": "jgql:tags",
                    "type": "value",
                  },
                ],
              }
            `);
        });

        it('wraps each facet in a single-element array', () => {
            const result = getFacets({jgql_tags: {data: []}}, {facets: {'jgql:tags': {type: 'value'}}});
            expect(result['jgql:tags']).toHaveLength(1);
        });
    });

    describe('range facets', () => {
        it('rewrites a range facet type to "range" and maps name to value', () => {
            expect(getFacets(
                {popularity: {data: [{name: '< 500', count: 432}]}},
                {facets: {popularity: {type: 'range'}}}
            )).toMatchInlineSnapshot(`
              {
                "popularity": [
                  {
                    "data": [
                      {
                        "count": 432,
                        "value": "< 500",
                      },
                    ],
                    "field": "popularity",
                    "type": "range",
                  },
                ],
              }
            `);
        });

        it('collapses date_range to "range" as well', () => {
            expect(getFacets(
                {'jgql_lastModified': {data: [{name: 'last year', count: 1}]}},
                {facets: {'jgql:lastModified': {type: 'date_range'}}}
            )).toMatchInlineSnapshot(`
              {
                "jgql:lastModified": [
                  {
                    "data": [
                      {
                        "count": 1,
                        "value": "last year",
                      },
                    ],
                    "field": "jgql:lastModified",
                    "type": "range",
                  },
                ],
              }
            `);
        });

        it('drops every entry key other than name and count', () => {
            expect(getFacets(
                {popularity: {data: [{name: '< 500', count: 432, from: 0, to: 500}]}},
                {facets: {popularity: {type: 'range'}}}
            )).toMatchInlineSnapshot(`
              {
                "popularity": [
                  {
                    "data": [
                      {
                        "count": 432,
                        "value": "< 500",
                      },
                    ],
                    "field": "popularity",
                    "type": "range",
                  },
                ],
              }
            `);
        });
    });

    // KNOWN BUG: the only guard is on the whole facets object, not on the individual lookup, so a
    // facet declared in the config but absent from the response crashes. Jahia omits a facet when it
    // matches nothing, and adaptResponse only avoids this today because it returns early on an empty
    // result set — a non-empty result set with one empty facet is enough to hit it.
    it('throws when a declared facet is missing from the response (KNOWN BUG)', () => {
        expect(() => getFacets(
            {jgql_tags: {data: []}},
            {facets: {'jgql:tags': {type: 'value'}, popularity: {type: 'range'}}}
        )).toThrow(TypeError);
    });

    // The response objects are annotated in place rather than copied. The rewrite should know this
    // is observable: adaptResponse hands it `response.data.search`, i.e. the caller's parsed JSON.
    it('mutates the response object it is given', () => {
        const searchResponse = {jgql_tags: {data: [{value: 'food', count: 1}]}};
        const result = getFacets(searchResponse, {facets: {'jgql:tags': {type: 'value'}}});
        expect(searchResponse.jgql_tags).toEqual({data: [{value: 'food', count: 1}], field: 'jgql:tags', type: 'value'});
        expect(result['jgql:tags'][0]).toBe(searchResponse.jgql_tags);
    });
});

describe('getResults', () => {
    it('returns an empty array for no hits', () => {
        expect(getResults([], [new Field(FieldType.HIT, 'link')])).toEqual([]);
    });

    it('always exposes the hit id as a raw field, even with no configured fields', () => {
        expect(getResults([{id: 'abc'}], [])).toMatchInlineSnapshot(`
          [
            {
              "id": {
                "raw": "abc",
              },
            },
          ]
        `);
    });

    it('resolves each field type onto the result', () => {
        const hits = [{
            id: 'abc',
            link: 'http://example.test/page.html',
            displayableName: 'A page',
            excerpt: 'a <em>match</em>',
            jgql_created: '2016-08-11T01:04:54.216Z',
            logo: '/files/logo.png',
            industry: 'Media'
        }];
        const fields = [
            new Field(FieldType.HIT, 'link'),
            new Field(FieldType.HIT, 'displayableName', 'title'),
            new Field(FieldType.HIT, 'excerpt', null, true),
            new Field(FieldType.NODE, 'jgql:created'),
            new Field(FieldType.REFERENCE_AS_PATH, 'logo', 'logo'),
            new Field(FieldType.REFERENCE_AS_VALUE, 'industryCat', 'industry')
        ];
        expect(getResults(hits, fields)).toMatchInlineSnapshot(`
          [
            {
              "excerpt": {
                "snippet": "a <em>match</em>",
              },
              "id": {
                "raw": "abc",
              },
              "industry": {
                "raw": "Media",
              },
              "jgql_created": {
                "raw": "2016-08-11T01:04:54.216Z",
              },
              "link": {
                "raw": "http://example.test/page.html",
              },
              "logo": {
                "raw": "/files/logo.png",
              },
              "title": {
                "raw": "A page",
              },
            },
          ]
        `);
    });

    it('emits an undefined raw value for a field the hit does not carry', () => {
        expect(getResults([{id: 'abc'}], [new Field(FieldType.HIT, 'link')])).toMatchInlineSnapshot(`
          [
            {
              "id": {
                "raw": "abc",
              },
              "link": {
                "raw": undefined,
              },
            },
          ]
        `);
    });

    it('lets a configured field overwrite the default id entry', () => {
        expect(getResults([{id: 'abc'}], [new Field(FieldType.HIT, 'id', null, true)])).toMatchInlineSnapshot(`
          [
            {
              "id": {
                "snippet": "abc",
              },
            },
          ]
        `);
    });
});
