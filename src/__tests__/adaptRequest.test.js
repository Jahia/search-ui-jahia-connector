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
        states: {
            type: 'value',
            size: 30
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
            field: 'initial',
            values: ['values'],
            type: 'all'
        },
        {
            field: 'initial',
            values: ['more values'],
            type: 'all'
        },
        {
            field: 'test',
            values: [
                {
                    to: 100,
                    from: 0,
                    name: 'test'
                }
            ],
            type: 'all'
        },
        {
            field: 'initial',
            values: ['additional values', 'and values', 'and even more values'],
            type: 'all'
        },
        {
            field: 'another',
            values: ['additional values', 'and values', 'and even more values'],
            type: 'any'
        },
        {
            field: 'whatever',
            values: ['value']
        },
        {
            type: 'none',
            field: 'nunya',
            values: ['busi', 'ness']
        }
    ]
};

const adaptedRequest = print(parse(`{
      jcr {
        searches(siteKey: "academy", language: "en", workspace: LIVE) {
          search(searchInput: {searchCriteria: {text: "test"}, nodeTypeCriteria: {nodeType: "jnt:page"}, limit: 10, offset: 3}) {
            totalHits
            took
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
