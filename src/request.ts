import type {GraphQLRequest} from './types.js';

export default async function request<T = unknown>(
    apiToken: string,
    baseURL: string,
    method: string,
    graphQLRequest: GraphQLRequest
): Promise<T> {
    const headers = new Headers({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json'
    });
    const response = await fetch(
        `${baseURL}/modules/graphql`,
        {
            method,
            headers,
            body: JSON.stringify(graphQLRequest),
            credentials: 'include'
        }
    );

    let json: unknown;
    try {
        json = await response.json();
    } catch (error) {
        console.log(error);
    }

    if (response.status >= 200 && response.status < 300) {
        // The body may have failed to parse; a 2xx with an unparseable body resolves to undefined,
        // unchanged from the JS implementation.
        return json as T;
    }

    const serverError = (json as {error?: string} | undefined)?.error;
    const message = serverError ? serverError : response.status;
    throw new Error(String(message));
}
