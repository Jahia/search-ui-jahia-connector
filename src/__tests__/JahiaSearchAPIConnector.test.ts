// Explicit `../index.js`: the bare `..` directory import only ever resolved because Vitest is
// lenient about it — NodeNext, which the package publishes under, is not.
import JahiaSearchAPIConnector from '../index.js';

import exampleAPIResponse from '../../resources/example-response.json' with {type: 'json'};
import {Field, FieldType} from '../field.js';
import type {QueryConfig, RequestState} from '../types.js';

function fetchResponse(response: unknown) {
    return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(response)
    });
}

beforeEach(() => {
    global.Headers = vi.fn() as unknown as typeof Headers;
    global.fetch = vi.fn().mockReturnValue(fetchResponse(exampleAPIResponse));
});

// A number rather than a string: the constructor only checks the token for truthiness, and this
// pins that it is passed through untouched.
const apiToken = 12345 as unknown as string;
const baseURL = 'http://localhost:8080';
const siteKey = 'localhost';

const params = {
    apiToken,
    baseURL,
    siteKey
};

it('can be initialized', () => {
    const connector = new JahiaSearchAPIConnector(params);
    expect(connector).toBeInstanceOf(JahiaSearchAPIConnector);
});

it('can not be initialized', () => {
    expect(() => {
        // Three positional empty strings rather than an options object: the constructor destructures
        // its first argument, so every required option comes out undefined and it throws.
        new JahiaSearchAPIConnector('' as unknown as {apiToken: string; baseURL: string; siteKey: string});
    }).toThrow();
});

describe('#onSearch', () => {
    function subject({state, queryConfig = {}}: {state: RequestState; queryConfig?: QueryConfig}) {
        const connector = new JahiaSearchAPIConnector({
            ...params
        });
        return connector.onSearch(state, queryConfig);
    }

    it('will correctly format an API response', async () => {
        const queryConfig: QueryConfig = {
             
            result_fields: [
                new Field(FieldType.HIT, 'link'),
                new Field(FieldType.HIT, 'displayableName', 'title'),
                new Field(FieldType.HIT, 'excerpt', null, true),
                new Field(FieldType.HIT, 'score'),
                new Field(FieldType.NODE, 'jgql:created', 'created')
            ],
            facets: {
                'jgql:tags': {
                    type: 'value',
                    max: 10,
                    disjunctive: true
                }
            }
        };
        const response = await subject({state: {}, queryConfig: queryConfig});
        expect(response).toMatchSnapshot();
    });

    it('will not break on special character at the end', async () => {
        const queryConfig: QueryConfig = {
             
            result_fields: [
                new Field(FieldType.HIT, 'link'),
                new Field(FieldType.HIT, 'displayableName', 'title'),
                new Field(FieldType.HIT, 'excerpt', null, true),
                new Field(FieldType.HIT, 'score'),
                new Field(FieldType.NODE, 'jgql:created', 'created')
            ],
            facets: {
                'jgql:tags': {
                    type: 'value',
                    max: 10,
                    disjunctive: true
                }
            }
        };
        const response = await subject({state: {searchTerm:'di\\'}, queryConfig: queryConfig});
        expect(response).toMatchSnapshot();
    });

    it('will not break on special character in the middle', async () => {
        const queryConfig: QueryConfig = {
             
            result_fields: [
                new Field(FieldType.HIT, 'link'),
                new Field(FieldType.HIT, 'displayableName', 'title'),
                new Field(FieldType.HIT, 'excerpt', null, true),
                new Field(FieldType.HIT, 'score'),
                new Field(FieldType.NODE, 'jgql:created', 'created')
            ],
            facets: {
                'jgql:tags': {
                    type: 'value',
                    max: 10,
                    disjunctive: true
                }
            }
        };
        const response = await subject({state: {searchTerm:'di\\g\\it'}, queryConfig: queryConfig});
        expect(response).toMatchSnapshot();
    });
});

describe('#onAutocomplete', () => {
    function subject({
        state,
        queryConfig
    }: {state: RequestState; queryConfig: QueryConfig}) {
        const connector = new JahiaSearchAPIConnector({
            ...params
        });
        return connector.onAutocomplete(state, queryConfig);
    }

    const config: QueryConfig = {
        results: {
             
            result_fields: [
                new Field(FieldType.HIT, 'link'),
                new Field(FieldType.HIT, 'displayableName', 'title'),
                new Field(FieldType.HIT, 'excerpt', null, true),
                new Field(FieldType.HIT, 'score'),
                new Field(FieldType.NODE, 'jcr:created', 'created')
            ]
        },
        facets: {}
    };
    it('will correctly format an API response', async () => {
        const response = await subject({
            state: {},
            queryConfig: config
        });
        expect(response).toMatchSnapshot();
    });

    it('will not return anything for suggestions', async () => {
        const response = await subject({
            state: {},
            queryConfig: {
                suggestions: {},
                 
                result_fields: [
                    new Field(FieldType.HIT, 'link'),
                    new Field(FieldType.HIT, 'displayableName', 'title'),
                    new Field(FieldType.HIT, 'excerpt', null, true),
                    new Field(FieldType.HIT, 'score'),
                    new Field(FieldType.NODE, 'jcr:created', 'created')
                ]
            }
        });
        expect(response).toMatchSnapshot();
    });
});

describe('#onAutocompleteResultClick', () => {
    function subject(clickData: {query: string; documentId: string; tags?: string}) {
        const connector = new JahiaSearchAPIConnector(params);
        return connector.onAutocompleteResultClick(clickData);
    }

    it('will call the API with the correct body params', async () => {
        const query = 'test';
        const documentId = '12345';
        const tags = '12345';

        const response = await subject({
            query,
            documentId,
            tags
        });

        expect(response).toMatchSnapshot();
    });

    // Characterization: the unsupported-feature warnings are the only observable effect of these two
    // methods beyond their return value, so a rewrite has to preserve them.
    it('warns that tags are unsupported when tags are passed', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        subject({query: 'test', documentId: '12345', tags: '12345'});
        expect(warn).toHaveBeenCalledWith(
            'search-ui-jahia-connector: Site Search does not support tags on autocompleteClick'
        );
    });

    it('stays silent when no tags are passed', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(subject({query: 'test', documentId: '12345'})).toBeUndefined();
        expect(warn).not.toHaveBeenCalled();
    });
});

describe('unsupported autocomplete features', () => {
    it('warns about query suggestions and returns an empty object with no results config', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const connector = new JahiaSearchAPIConnector(params);
        const response = await connector.onAutocomplete({searchTerm: 'test'}, {suggestions: {}});
        expect(warn).toHaveBeenCalledWith(
            'search-ui-jahia-connector: Site Search does support query suggestions on autocomplete'
        );
        expect(response).toEqual({});
    });

    it('returns an empty object when the query config has neither suggestions nor results', async () => {
        const connector = new JahiaSearchAPIConnector(params);
        await expect(connector.onAutocomplete({searchTerm: 'test'}, {})).resolves.toEqual({});
    });
});
