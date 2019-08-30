import JahiaSearchAPIConnector from '..';

import exampleAPIResponse from '../../resources/example-response.json';

function fetchResponse(response) {
    return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(response)
    });
}

beforeEach(() => {
    global.Headers = jest.fn();
    global.fetch = jest.fn().mockReturnValue(fetchResponse(exampleAPIResponse));
});

const apiToken = 12345;
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

describe('#onSearch', () => {
    function subject({state, queryConfig = {}}) {
        const connector = new JahiaSearchAPIConnector({
            ...params
        });
        return connector.onSearch(state, queryConfig);
    }

    it('will correctly format an API response', async () => {
        const response = await subject({state: {}, queryConfig: {}});
        expect(response).toMatchSnapshot();
    });
});

describe('#onAutocomplete', () => {
    function subject({
        state,
        queryConfig = {
            results: {}
        }
    }) {
        const connector = new JahiaSearchAPIConnector({
            ...params
        });
        return connector.onAutocomplete(state, queryConfig);
    }

    it('will correctly format an API response', async () => {
        const response = await subject({
            state: {},
            queryConfig: {
                results: {}
            }
        });
        expect(response).toMatchSnapshot();
    });

    it('will not return anything for suggestions', async () => {
        const response = await subject({
            state: {},
            queryConfig: {
                suggestions: {}
            }
        });
        expect(response).toMatchSnapshot();
    });
});

describe("#onAutocompleteResultClick", () => {
    function subject(clickData) {
        const connector = new JahiaSearchAPIConnector(params);
        return connector.onAutocompleteResultClick(clickData);
    }

    it("will call the API with the correct body params", async () => {
        const query = "test";
        const documentId = "12345";
        const tags = "12345";

        const response = await subject({
            query,
            documentId,
            tags
        });

        expect(response).toMatchSnapshot();
    });
});
