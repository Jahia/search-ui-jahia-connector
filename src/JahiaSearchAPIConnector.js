import request from './request';
import adaptRequest from './requestAdapter';
import adaptResponse from './responseAdapter';

class JahiaSearchAPIConnector {
    /**
     * @typedef Options
     * @param  {string} apiToken Credential found in your Jahia Tools
     * @param  {string} baseURL  URL of your jahia installation
     */
    constructor({
        apiToken,
        baseURL
    }) {
        this.apiToken = apiToken;
        this.baseURL = baseURL;
    }

    onSearch(state, queryConfig) {
        console.log(state, queryConfig);
        const query = adaptRequest(state, queryConfig);
        return request(this.apiToken, this.baseURL, 'POST', query).then(json =>
            adaptResponse(json, state.resultsPerPage)
        );
    }
}

export default JahiaSearchAPIConnector;
