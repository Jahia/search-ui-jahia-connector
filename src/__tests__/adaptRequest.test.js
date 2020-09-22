import adaptRequest from '../adaptRequest';
import {Field, FieldType} from '../field';
import {parse, print} from 'graphql';

const requestOptions = {
    siteKey: 'academy',
    language: 'en',
    workspace: 'LIVE',
    nodeType: 'jnt:page'
};

const queryConfig = {
    facets: {
        'jgql:tags': {
            type: 'value',
            size: 10,
            minDoc: 1,
            disjunctive: true
        },
        'jgql:lastModified': {
            type: 'date_range',
            disjunctive: true,
            ranges: [{from: 'now-1y', to: 'now', name: 'last year'},
                {from: 'now-5y', to: 'now-1y', name: 'last 5 years'}]
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
    ],
    // eslint-disable-next-line camelcase
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
    // eslint-disable-next-line camelcase
    search_fields: {
        title: {},
        description: {},
        states: {}
    },
    filters: [
        {
            field: 'jgql:tags',
            values: ['cluster'],
            type: 'all'
        },
        {
            field: 'jgql:lastModified',
            values: [{from: 'now-1y', to: 'now', name: 'last year'}],
            type: 'all'
        }
    ]
};

const adaptedRequest = print(parse(`{
      search (q: "test", siteKeys: ["academy"], language: "en", workspace: LIVE, filters: {nodeType: {type: "jnt:page"}}) {
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
            jgql_tags: termFacet(field: "jgql:tags", disjunctive: true, max: 10, minDocCount: 1) {
                data {
                    value
                    count
                }
            }
            jgql_lastModified: rangeFacet(field: "jgql:lastModified", ranges: [{name: "last year", from: "now-1y", to: "now"},
                                                            {name: "last 5 years", from: "now-5y", to: "now-1y"}]) {
                data {
                    name
                    count
                }
            }
      }
}`));

describe('adaptRequest', () => {
    it('adapts request', () => {
        expect(adaptRequest(requestOptions, request, queryConfig)).toEqual(
            adaptedRequest
        );
    });
});
