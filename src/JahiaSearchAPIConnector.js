import request from './request.js';
import adaptRequest from './adaptRequest.js';
import adaptResponse from './adaptResponse.js';
import Constants from './constants.js';

/**
 * @typedef {import('./types.js').RequestState} RequestState
 * @typedef {import('./types.js').QueryConfig} QueryConfig
 * @typedef {import('./types.js').ResponseState} ResponseState
 * @typedef {import('./types.js').AutocompleteResponseState} AutocompleteResponseState
 */

/**
 * Options accepted by the JahiaSearchAPIConnector constructor.
 *
 * Declared as a named type rather than with dotted "options.x" param tags: the constructor's
 * parameter is DESTRUCTURED, and TypeScript does not bind dotted param tags to a destructuring
 * pattern — the properties come out as required "any". Listing them as separate top-level param
 * tags is worse still: the whole options object is then typed as "string". Either way, correct call
 * sites fail to type-check. (Note: avoid writing JSDoc tag names in prose here — TypeScript parses
 * them, and an inline tag in this comment previously emitted a bogus exported type.)
 *
 * @typedef {Object} JahiaSearchAPIConnectorOptions
 * @property {string} apiToken Credential found in your Jahia Tools
 * @property {string} baseURL URL of your Jahia installation
 * @property {string} siteKey The site search will be performed in
 * @property {string} [language] Language in which search will be performed
 * @property {string} [workspace] Workspace in which search will be performed
 * @property {string} [nodeType] The node type that should be searched for
 * @property {string} [functionScore] The function score id that should be used to score the hits
 */

class JahiaSearchAPIConnector {
    /**
     * Define the options available to initialize your JahiaSearchAPIConnector
     * @param {JahiaSearchAPIConnectorOptions} options
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

    /**
     * Run a search. Called by Search UI with its request state and the searchQuery configuration.
     *
     * @param {RequestState} state
     * @param {QueryConfig} queryConfig
     * @returns {Promise<ResponseState>}
     */
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

    /**
     * Run an autocomplete query. Only the result section is honoured — suggestions are not supported
     * by the Jahia API, and asking for them warns and yields nothing.
     *
     * @param {RequestState} state
     * @param {QueryConfig} queryConfig the autocompleteQuery configuration
     * @returns {Promise<AutocompleteResponseState>}
     */
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

    /**
     * Called by Search UI when an autocomplete result is clicked. Nothing is reported back to Jahia;
     * the hook exists to satisfy the Search UI connector contract.
     *
     * @param {{documentId?: string, requestId?: string, tags?: string[]}} clickParams
     * @returns {void}
     */
    onAutocompleteResultClick({tags}) {
        if (tags) {
            console.warn(
                'search-ui-jahia-connector: Site Search does not support tags on autocompleteClick'
            );
        }
    }
}

export default JahiaSearchAPIConnector;
