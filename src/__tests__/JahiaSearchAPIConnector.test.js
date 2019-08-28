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
const params = {
    apiToken,
    baseURL
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
