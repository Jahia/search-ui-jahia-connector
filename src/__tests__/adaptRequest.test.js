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
        }
    ]
};

const adaptedRequest = print(parse(`{
      jcr {
        searches(siteKey: "academy", language: "en", workspace: LIVE) {
          search(searchInput: {searchCriteria: {text: "test"}, nodeTypeCriteria: {nodeType: "jnt:page"}, limit: 10, offset: 3}, sortBy: {orderType: ASC, property: "title"},
                facetsInput: {facets: [{field: "jfs:tags", type: VALUE, disjunctive: true, max: 10, selections: [{value: "cluster"}]}]}) {
            totalHits
            took
            facets {
              field
              type
              data {
                count
                value
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
