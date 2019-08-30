import adaptResponse from '../responseAdapter';

describe('adaptResponse', () => {
    describe('adaptResponse', () => {
        it('adapts response', () => {
            expect(adaptResponse(response, 10)).toEqual(
                adaptedResponse
            );
        });

        it('adapts empty response', () => {
            expect(adaptResponse(emptyResponse, 10)).toEqual(
                adaptedEmptyResponse
            );
        });
    });
});

const response = {
    'data': {
        'jcr': {
            'searches': {
                'search': {
                    'totalHits': 16,
                    'took': '33 milliseconds',
                    'hits': [
                        {
                            'score': 198.3385772705078,
                            'displayableName': 'Jahia cluster setup',
                            'excerpt': 'The Jahia Team Jahia <em>cluster</em> <em>setup</em> Here are the steps followed to install an Jahia <em>cluster</em> for a production environment. We will also detail ... Jahia <em>cluster</em> <em>setup</em>',
                            'link': 'http://localhost/sites/academy/home/documentation/developer/dx/techwiki/misc/dx-cluster-setup.html',
                            'lastModified': 'Tue Jul 16 04:07:26 EDT 2019',
                            'lastModifiedBy': '',
                            'node': {
                                'uuid': 'cad826d1-edda-4587-b090-343158b40b5b'
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
            updatedAt: {
                raw: 'Tue Jul 16 04:07:26 EDT 2019'
            },
            title: {
                raw: 'Jahia cluster setup'
            },
            excerpt: {
                snippet: 'The Jahia Team Jahia <em>cluster</em> <em>setup</em> Here are the steps followed to install an Jahia <em>cluster</em> for a production environment. We will also detail ... Jahia <em>cluster</em> <em>setup</em>'
            },
            id: {
                raw: 'cad826d1-edda-4587-b090-343158b40b5b'
            }
        }
    ],
    totalPages: 2,
    totalResults: 16,
    requestId: ''
};
const emptyResponse = {
    'data': {
        'jcr': {
            'searches': {
                'search': {
                    'totalHits': 0,
                    'took': '0 milliseconds',
                    'hits': []
                }
            }
        }
    }
};
const adaptedEmptyResponse = {
    requestId: '',
    results: []
};
