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
        'jfs:tags': {
            type: 'value',
            size: 10,
            disjunctive: true
        },
        'jfs:lastModified': {
            type: 'date_range',
            disjunctive: true,
            ranges: [{from: 'now-1M', to: '', name: 'last month'}, {from: 'now-1y', to: 'now', name: 'last year'}]
        }
    },
    // eslint-disable-next-line camelcase
    result_fields: [
        new Field(FieldType.HIT, 'link'),
        new Field(FieldType.HIT, 'displayableName', 'title'),
        new Field(FieldType.HIT, 'excerpt', null, true),
        new Field(FieldType.HIT, 'score'),
        new Field(FieldType.NODE, 'jcr:created', 'created'),
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
        new Field(FieldType.NODE, 'jcr:created', 'created'),
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
            field: 'jfs:tags',
            values: ['cluster'],
            type: 'all'
        },
        {
            field: 'jfs:lastModified',
            values: [{from: "2018-09-26T18:09:35.527Z", to: "2019-09-26T18:09:35.527Z", name: "last year"}],
            type: 'all'
        }
    ]
};

const adaptedRequest = print(parse(`{
      jcr {
        searches(siteKey: "academy", language: "en", workspace: LIVE) {
          search(q: "test", limit: 10, offset: 3, filter: {nodeType: {type: "jnt:page"}}, sortBy: {orderType: ASC, property: "title"},
                 facets: {term: [{field: "jfs:tags", disjunctive: true, max: 10, selections: ["cluster"]}], dateRange: [{field: "jfs:lastModified", ranges: [{name: "last month", from: "now-1M"}, {name: "last year", from: "now-1y", to: "now"}], disjunctive: true, selections: [{name: "last year", from: "2018-09-26T18:09:35.527Z", to: "2019-09-26T18:09:35.527Z"}]}]}) { 
            totalHits
            took
            facets {
              field
              type
              data {
                ... on TermValue {
                  count
                  value
                }
                ... on DateRangeValue {
                  count
                  range {
                    from
                    to
                    name
                  }
                }
              }
            }
            hits {
              link
              displayableName
              excerpt
              score
              node {
                uuid
                jcr_created: property(name: "jcr:created") {
                  value
                }
                logo: property(name: "logo") {
                  refNode {
                    path
                  }
                }
                industryCat: property(name: "industryCat") {
                  refNode {
                    displayName
                  }
                }
              }
            }
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
