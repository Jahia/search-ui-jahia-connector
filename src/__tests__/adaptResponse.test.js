import adaptResponse from '../adaptResponse';
import {Field, FieldType} from '../field';

const queryConfig = {
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
    facets: {
        'jfs:tags': {
            type: 'value',
            disjunctive: true
        },
        'jfs:lastModified': {
            type: 'date_range',
            disjunctive: true,
            ranges: [{from: 'now-1M', to: '', name: 'last month'}, {from: 'now-1y', to: 'now', name: 'last year'}]
        }
    }
};
const response = {
    data: {
        jcr: {
            searches: {
                search: {
                    totalHits: 16,
                    took: '33 milliseconds',
                    facets: [
                        {
                            field: 'jfs:tags',
                            type: 'sterms',
                            data: [
                                {
                                    count: 1,
                                    value: 'cluster'
                                }
                            ]
                        },
                        {
                            field: 'jfs:lastModified',
                            type: 'date_range',
                            data: [
                                {
                                    count: 91,
                                    range: {from: "2018-09-26T19:06:47.388Z", to: "2019-09-26T19:06:47.388Z", name: "last year"}
                                }
                            ]
                        }
                    ],
                    hits: [
                        {
                            score: 198.3385772705078,
                            displayableName: 'Jahia cluster setup',
                            excerpt: 'The Jahia Team Jahia <em>cluster</em> <em>setup</em> Here are the steps ' +
                                'followed to install an Jahia <em>cluster</em> for a production environment.' +
                                ' We will also detail ... Jahia <em>cluster</em> <em>setup</em>',
                            link: 'http://localhost/sites/academy/home/documentation/developer/dx/techwiki/misc/dx-cluster-setup.html',
                            node: {
                                uuid: 'cad826d1-edda-4587-b090-343158b40b5b',
                                jcr_created: {
                                    value: '2016-01-12T23:14:03.248+01:00'
                                },
                                industryCat: {
                                    refNode: {
                                        displayName: 'Media'
                                    }
                                },
                                logo: {
                                    refNode: {
                                        path: '/sites/digitall/files/images/companies/allsportslogo_light.png'
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
};

const adaptedResponse = {
    results: [
        {
            link: {
                raw: 'http://localhost/sites/academy/home/documentation/developer/dx/techwiki/misc/dx-cluster-setup.html'
            },
            created: {
                raw: '2016-01-12T23:14:03.248+01:00'
            },
            title: {
                raw: 'Jahia cluster setup'
            },
            excerpt: {
                snippet: 'The Jahia Team Jahia <em>cluster</em> <em>setup</em> Here are the steps ' +
                    'followed to install an Jahia <em>cluster</em> for a production environment.' +
                    ' We will also detail ... Jahia <em>cluster</em> <em>setup</em>'
            },
            id: {
                raw: 'cad826d1-edda-4587-b090-343158b40b5b'
            },
            score: {
                raw: 198.3385772705078
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
        'jfs:tags': [{
            field: 'jfs:tags',
            type: 'sterms',
            data: [{count: 1, value: 'cluster'}]
        }],
        'jfs:lastModified': [{
            field: 'jfs:lastModified',
            type: 'date_range',
            data: [{count: 91, value: {from: "2018-09-26T19:06:47.388Z", to: "2019-09-26T19:06:47.388Z", name: "last year"}}]
        }]
    }

};
const emptyResponse = {
    data: {
        jcr: {
            searches: {
                search: {
                    totalHits: 0,
                    took: '0 milliseconds',
                    hits: []
                }
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
