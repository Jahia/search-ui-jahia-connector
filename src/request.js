/**
 * POST one GraphQL request to the Jahia backend.
 *
 * @param {string} apiToken
 * @param {string} baseURL
 * @param {string} query the GraphQL document
 * @param {Record<string, any>} [variables] the values the document binds as variables
 * @returns {Promise<any>} the JSON body of a 2xx response
 */
export default async function request(apiToken, baseURL, query, variables = {}) {
    const headers = new Headers({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json'
    });
    const response = await fetch(
        `${baseURL}/modules/graphql`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query,
                variables
            }),
            credentials: 'include'
        }
    );

    let json;
    try {
        json = await response.json();
    } catch (error) {
        console.log(error);
    }

    if (response.status >= 200 && response.status < 300) {
        return json;
    }

    const message = json && json.error ? json.error : response.status;
    throw new Error(message);
}
