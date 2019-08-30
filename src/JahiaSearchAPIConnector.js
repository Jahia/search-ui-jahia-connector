import request from './request';
import adaptRequest from './requestAdapter';
import adaptResponse from './responseAdapter';
import Constants from './constants';

class JahiaSearchAPIConnector {
    /**
     * @typedef Options
     * @param  {string} apiToken Credential found in your Jahia Tools
     * @param  {string} baseURL  URL of your Jahia installation
     * @param  {string} siteKey The site search will be performed in
     * @param  {string} language Language in which search will be performed
     * @param  {string} workspace Workspace in which search will be performed
     * @param  {string} nodeType The node type that should be searched for
     */
    constructor({
        apiToken,
        baseURL,
        siteKey,
        language = Constants.LANGUAGE,
        workspace = Constants.WORKSPACE,
        nodeType = Constants.NODE_FILTER.TYPE
    }) {
        this.apiToken = apiToken;
        this.baseURL = baseURL;
        this.siteKey = siteKey;
        this.language = language;
        this.workspace = workspace;
        this.nodeType = nodeType;
    }

    onSearch(state, queryConfig) {
        console.log("state",state,"query", queryConfig);
        let requestOptions = {
            siteKey: this.siteKey,
            language: this.language,
            workspace: this.workspace,
            nodeType: this.nodeType
        };
        const query = adaptRequest(requestOptions, state, queryConfig);
        return request(this.apiToken, this.baseURL, 'POST', query).then(json =>
            adaptResponse(json, state.resultsPerPage)
        );
    }

    async onAutocomplete({searchTerm}, queryConfig) {
        if (queryConfig.suggestions) {
            console.warn(
                'search-ui-jahia-connector: Site Search does support query suggestions on autocomplete'
            );
        }
        if (queryConfig.results) {
            let requestOptions = {
                siteKey: this.siteKey,
                language: this.language,
                workspace: this.workspace,
                nodeType: this.nodeType
            };
            const query = adaptRequest(requestOptions,
                {searchTerm},
                queryConfig.results
            );

            return request(this.apiToken, this.baseURL, 'POST', query).then(json => ({
                autocompletedResults: adaptResponse(json, queryConfig.results.resultsPerPage).results
            }));
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
