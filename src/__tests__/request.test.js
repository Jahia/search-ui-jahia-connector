import request from '../request.js';

const responseJson = {};

function fetchResponse(response, statusCode) {
    return Promise.resolve({
        status: statusCode,
        json: () => {
            if (response) {
                return Promise.resolve(response);
            }

            throw new Error('Couldn\'t parse');
        }
    });
}

beforeEach(() => {
    global.Headers = vi.fn();
    global.fetch = vi.fn().mockReturnValue(fetchResponse(responseJson, 200));
});

function respondWithSuccess(json) {
    global.fetch = vi.fn().mockReturnValue(fetchResponse(json, 200));
}

function respondWithError(json) {
    global.fetch = vi.fn().mockReturnValue(fetchResponse(json, 401));
}

function subject(variables) {
    return request('engine', 'http://localhost:8080', 'test', variables);
}

it('posts the query and its variables', async () => {
    respondWithSuccess(responseJson);
    await subject({q: 'a "quoted" term', size: 5});
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toEqual('http://localhost:8080/modules/graphql');
    expect(JSON.parse(init.body)).toEqual({query: 'test', variables: {q: 'a "quoted" term', size: 5}});
});

it('posts an empty variables object when none are given', async () => {
    respondWithSuccess(responseJson);
    await subject();
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({query: 'test', variables: {}});
});

it('will return json on successful request with json', async () => {
    respondWithSuccess(responseJson);
    const response = await subject();
    expect(response).toEqual(responseJson);
});

it('will return undefined on successful request without json', async () => {
    respondWithSuccess();
    const response = await subject();
    expect(response).toBeUndefined();
});

it('will throw with status on unsuccessful request without json', async () => {
    respondWithError();
    let error;

    try {
        error = await subject();
    } catch (e) {
        error = e;
    }

    expect(error.message).toEqual('401');
});

it('will throw with message on unsuccessful request with json and message', async () => {
    respondWithError({error: 'I am a server error message'});
    let error;

    try {
        error = await subject();
    } catch (e) {
        error = e;
    }

    expect(error.message).toEqual('I am a server error message');
});

it('will throw with message on unsuccessful request with json but no message', async () => {
    respondWithError({});
    let error;

    try {
        error = await subject();
    } catch (e) {
        error = e;
    }

    expect(error.message).toEqual('401');
});
