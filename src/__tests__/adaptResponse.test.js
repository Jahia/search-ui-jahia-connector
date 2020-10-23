import adaptResponse from '../adaptResponse';
import {Field, FieldType} from '../field';

const queryConfig = {
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
    facets: {
        'jgql:tags': {
            type: 'value',
            max: 10,
            minDoc: 1,
            disjunctive: true
        },
        'jgql:lastModified': {
            type: 'date_range',
            disjunctive: true,
            ranges: [{from: 'now-1y', to: 'now', name: 'last year'},
                {from: 'now-5y', to: 'now-1y', name: 'last 5 years'}]
        }
    }
};
const response = {
    data: {
        search: {
            results: {
                totalHits: 16,
                took: '6ms',
                hits: [
                    {
                        id: '1bbcb33b-28b6-4db4-9d9d-77d7792d88ff',
                        link: 'http://localhost/sites/digitall/home/demo-roles-and-users.html',
                        displayableName: 'Demo Roles and Users',
                        excerpt: 'How to use this <em>dem</em>onstration?\n\nYou can discover Jahia 7 using the following users (login / password):\n\n\n root / ' +
                            'root (if you\'re using the <em>Dem</em>o Pack. Otherwise, the root password is the one set using the Jahia\'s installation tool): ' +
                            'Server Administrator of this Jahia instance (with access to the full',
                        score: 105.96808624267578,
                        'jgql_created': '2016-08-11T01:04:54.216Z',
                        logo: '/sites/digitall/files/images/companies/allsportslogo_light.png',
                        industry: 'Media'
                    }
                ]
            },
            'jgql_tags': {
                data: [
                    {
                        value: '2015',
                        count: 1
                    },
                    {
                        value: 'awards',
                        count: 1
                    },
                    {
                        value: 'food',
                        count: 1
                    },
                    {
                        value: 'health',
                        count: 1
                    },
                    {
                        value: 'movies',
                        count: 1
                    }
                ]
            },
            'jgql_lastModified': {
                data: [
                    {
                        name: 'last 5 years',
                        count: 3
                    },
                    {
                        name: 'last year',
                        count: 1
                    }
                ]
            }
        }
    }
};

const adaptedResponse = {
    results: [
        {
            link: {
                raw: 'http://localhost/sites/digitall/home/demo-roles-and-users.html'
            },
            "jgql_created": {
                raw: '2016-08-11T01:04:54.216Z'
            },
            title: {
                raw: 'Demo Roles and Users'
            },
            excerpt: {
                snippet: 'How to use this <em>dem</em>onstration?\n\nYou can discover Jahia 7 using the following users (login / password):\n\n\n root / ' +
                    'root (if you\'re using the <em>Dem</em>o Pack. Otherwise, the root password is the one set using the Jahia\'s installation tool): ' +
                    'Server Administrator of this Jahia instance (with access to the full'
            },
            id: {
                raw: '1bbcb33b-28b6-4db4-9d9d-77d7792d88ff'
            },
            score: {
                raw: 105.96808624267578
            },
            industry: {
                raw: 'Media'
            },
            logo: {
                raw: '/sites/digitall/files/images/companies/allsportslogo_light.png'
            }
        }
    ],
    totalPages: 2,
    totalResults: 16,
    requestId: '',
    facets: {
        'jgql:tags': [{
            data: [
                {
                    value: '2015',
                    count: 1
                },
                {
                    value: 'awards',
                    count: 1
                },
                {
                    value: 'food',
                    count: 1
                },
                {
                    value: 'health',
                    count: 1
                },
                {
                    value: 'movies',
                    count: 1
                }
            ],
            field: 'jgql:tags'
        }],
        'jgql:lastModified': [{
            data: [
                {
                    value: 'last 5 years',
                    count: 3
                },
                {
                    value: 'last year',
                    count: 1
                }
            ],
            field: 'jgql:lastModified'
        }]
    }

};
const emptyResponse = {
    data: {
        search: {
            results: {
                totalHits: 0,
                took: '2ms',
                hits: []
            },
            'jgql_tags': {
                data: []
            },
            'jgql_lastModified': {
                data: [
                    {
                        value: 'last 5 years',
                        count: 0
                    },
                    {
                        value: 'last year',
                        count: 0
                    }
                ]
            }
        }
    }
};

const adaptedEmptyResponse = {
    requestId: '',
    results: []
};

describe('adaptResponse', () => {
    describe('adaptResponse', () => {
        it('adapts response', () => {
            expect(adaptResponse(response, 10, queryConfig)).toEqual(
                adaptedResponse
            );
        });

        it('adapts empty response', () => {
            expect(adaptResponse(emptyResponse, 10, queryConfig)).toEqual(
                adaptedEmptyResponse
            );
        });
    });
});
