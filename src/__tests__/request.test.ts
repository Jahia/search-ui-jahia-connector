import request from '../request.js';

const responseJson = {};

function fetchResponse(response: unknown, statusCode: number) {
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

// The stubs are far narrower than the real globals — just the `status` and `json()` that `request`
// reads — so each assignment is cast rather than fully modelled.
beforeEach(() => {
    global.Headers = vi.fn() as unknown as typeof Headers;
    global.fetch = vi.fn().mockReturnValue(fetchResponse(responseJson, 200));
});

function respondWithSuccess(json?: unknown) {
    global.fetch = vi.fn().mockReturnValue(fetchResponse(json, 200));
}

function respondWithError(json?: unknown) {
    global.fetch = vi.fn().mockReturnValue(fetchResponse(json, 401));
}

const graphQLRequest = {query: 'query ($q: String!) { search(q: $q) { totalHits } }', variables: {q: 'test'}};

function subject() {
    return request('engine', 'http://localhost:8080', 'GET', graphQLRequest);
}

it('posts the document and its variables together', async () => {
    respondWithSuccess(responseJson);
    await subject();
    expect(JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]!.body as string)).toEqual(graphQLRequest);
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
    let error: unknown;

    try {
        error = await subject();
    } catch (e) {
        error = e;
    }

    expect((error as Error).message).toEqual('401');
});

it('will throw with message on unsuccessful request with json and message', async () => {
    respondWithError({error: 'I am a server error message'});
    let error: unknown;

    try {
        error = await subject();
    } catch (e) {
        error = e;
    }

    expect((error as Error).message).toEqual('I am a server error message');
});

it('will throw with message on unsuccessful request with json but no message', async () => {
    respondWithError({});
    let error: unknown;

    try {
        error = await subject();
    } catch (e) {
        error = e;
    }

    expect((error as Error).message).toEqual('401');
});
