import adaptResponse from '../responseAdapter';
import Field from "../field";
import {FieldType} from "../../dist/field";

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
const queryConfig = {
    result_fields: [
        new Field(FieldType.HIT, 'link'),
        new Field(FieldType.HIT, 'displayableName', 'title'),
        new Field(FieldType.HIT, 'excerpt', null, true),
        new Field(FieldType.HIT, 'score'),
        new Field(FieldType.NODE, 'jcr:created', 'created')
    ],
};
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
                            'node': {
                                'uuid': 'cad826d1-edda-4587-b090-343158b40b5b',
                                "jcr_created":{
                                    "value":"2016-01-12T23:14:03.248+01:00"
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
                "raw": "2016-01-12T23:14:03.248+01:00"
            },
            title: {
                raw: 'Jahia cluster setup'
            },
            excerpt: {
                snippet: 'The Jahia Team Jahia <em>cluster</em> <em>setup</em> Here are the steps followed to install an Jahia <em>cluster</em> for a production environment. We will also detail ... Jahia <em>cluster</em> <em>setup</em>'
            },
            id: {
                raw: 'cad826d1-edda-4587-b090-343158b40b5b'
            },
            score: {
                raw: 198.3385772705078
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
