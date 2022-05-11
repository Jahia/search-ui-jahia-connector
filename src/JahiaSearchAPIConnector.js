import request from './request';
import adaptRequest from './adaptRequest';
import adaptResponse from './adaptResponse';
import Constants from './constants';

class JahiaSearchAPIConnector {
    /**
     * Define the options available to initialize your JahiaSearchAPIConnector
     * @param  {string} apiToken Credential found in your Jahia Tools
     * @param  {string} baseURL  URL of your Jahia installation
     * @param  {string} siteKey The site search will be performed in
     * @param  {string} language Language in which search will be performed
     * @param  {string} workspace Workspace in which search will be performed
     * @param  {string} nodeType The node type that should be searched for
     * @param  {string} functionScore The function score id that should be used to score the hits
     */
    constructor({
        apiToken,
        baseURL,
        siteKey,
        language = Constants.LANGUAGE,
        workspace = Constants.WORKSPACE,
        nodeType,
        functionScore = ''
    }) {
        if (!apiToken || !baseURL || !siteKey) {
            throw new Error(
                'apiToken, baseURL, and siteKey are required'
            );
        }

        this.apiToken = apiToken;
        this.baseURL = baseURL;
        this.siteKey = siteKey;
        this.language = language;
        this.workspace = workspace;
        this.nodeType = nodeType;
        this.functionScore = functionScore;
    }

    async onSearch(state, queryConfig) {
        // Console.log("state",state,"query config", queryConfig);
        let requestOptions = {
            siteKey: this.siteKey,
            language: this.language,
            workspace: this.workspace,
            nodeType: this.nodeType,
            functionScore: this.functionScore
        };
        const query = adaptRequest(requestOptions, state, queryConfig);
        const responseJson = await request(this.apiToken, this.baseURL, 'POST', query);
        return adaptResponse(responseJson, state.resultsPerPage, queryConfig);
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
                nodeType: this.nodeType,
                functionScore: this.functionScore
            };
            const query = adaptRequest(requestOptions,
                {searchTerm},
                queryConfig
            );

            return request(this.apiToken, this.baseURL, 'POST', query).then(json => ({
                autocompletedResults: adaptResponse(json, queryConfig.results.resultsPerPage, queryConfig).results
            }));
        }

        return {};
    }

    onAutocompleteResultClick({tags}) {
        if (tags) {
            console.warn(
                'search-ui-jahia-connector: Site Search does not support tags on autocompleteClick'
            );
        }
    }
}

export default JahiaSearchAPIConnector;
