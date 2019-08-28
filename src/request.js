export default async function request(apiToken, baseURL, method, query) {
    const headers = new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
    });
    const response = await fetch(
        `${baseURL}/modules/graphql`,
        {
            method,
            headers,
            body: JSON.stringify({
                query
            }),
            credentials: 'omit'
        }
    );

    let json;
    try {
        json = await response.json();
    } catch (error) {
        // Nothing to do here, certain responses won't have json
    }

    if (response.status >= 200 && response.status < 300) {
        return json;
    } else {
        const message = json && json.error ? json.error : response.status;
        throw new Error(message);
    }
}
