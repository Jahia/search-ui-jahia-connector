import request from './request';
import adaptRequest from './requestAdapter';
import adaptResponse from './responseAdapter';

class JahiaSearchAPIConnector {
    /**
     * @typedef Options
     * @param  {string} apiToken Credential found in your Jahia Tools
     * @param  {string} baseURL  URL of your Jahia installation
     */
    constructor({
        apiToken,
        baseURL
    }) {
        this.apiToken = apiToken;
        this.baseURL = baseURL;
    }

    onSearch(state, queryConfig) {
        console.log("state",state,"query", queryConfig);
        const query = adaptRequest(state, queryConfig);
        return request(this.apiToken, this.baseURL, 'POST', query).then(json =>
            adaptResponse(json, state.resultsPerPage)
        );
    }

    async onAutocomplete({searchTerm}, queryConfig) {
        if (queryConfig.results) {
            const query = adaptRequest(
                {searchTerm},
                queryConfig.results
            );

            return request(this.apiToken, this.baseURL, 'POST', query).then(json => ({
                autocompletedResults: adaptResponse(json, queryConfig.results.resultsPerPage).results
            }));
        }
        if (queryConfig.suggestions) {
            console.warn(
                'search-ui-jahia-connector: Site Search does support query suggestions on autocomplete'
            );
        }
    }

    onAutocompleteResultClick({ query, documentId, tags }) {
        if (tags) {
            console.warn(
                "search-ui-jahia-connector: Site Search does not support tags on autocompleteClick"
            );
        }
        //Todo integrate with JCustomer
    }
}

export default JahiaSearchAPIConnector;
