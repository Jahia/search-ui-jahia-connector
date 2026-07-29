import request from './request.js';
import adaptRequest from './adaptRequest.js';
import adaptResponse from './adaptResponse.js';
import Constants from './constants.js';
import type {
    AdaptedResponse,
    AutocompleteResponse,
    QueryConfig,
    RequestOptions,
    RequestState,
    SearchResponse
} from './types.js';

/** Options accepted by the JahiaSearchAPIConnector constructor. */
export interface JahiaSearchAPIConnectorOptions {
    /** Credential found in your Jahia Tools */
    apiToken: string;
    /** URL of your Jahia installation */
    baseURL: string;
    /** The site search will be performed in */
    siteKey: string;
    /** Language in which search will be performed */
    language?: string;
    /** Workspace in which search will be performed */
    workspace?: string;
    /** The node type that should be searched for */
    nodeType?: string;
    /** The function score id that should be used to score the hits */
    functionScore?: string;
}

class JahiaSearchAPIConnector {
    apiToken: string;
    baseURL: string;
    siteKey: string;
    language: string;
    workspace: string;
    /** Unset unless configured — no default is applied. */
    nodeType?: string;
    functionScore: string;

    /**
     * Define the options available to initialize your JahiaSearchAPIConnector
     */
    constructor({
        apiToken,
        baseURL,
        siteKey,
        language = Constants.LANGUAGE,
        workspace = Constants.WORKSPACE,
        nodeType,
        functionScore = ''
    }: JahiaSearchAPIConnectorOptions) {
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

    async onSearch(state: RequestState, queryConfig: QueryConfig): Promise<AdaptedResponse> {
        // Console.log("state",state,"query config", queryConfig);
        const requestOptions: RequestOptions = {
            siteKey: this.siteKey,
            language: this.language,
            workspace: this.workspace,
            nodeType: this.nodeType,
            functionScore: this.functionScore
        };
        const graphQLRequest = adaptRequest(requestOptions, state, queryConfig);
        const responseJson = await request<SearchResponse>(this.apiToken, this.baseURL, 'POST', graphQLRequest);
        return adaptResponse(responseJson, state.resultsPerPage, queryConfig);
    }

    async onAutocomplete({searchTerm}: RequestState, queryConfig: QueryConfig): Promise<AutocompleteResponse> {
        if (queryConfig.suggestions) {
            console.warn(
                'search-ui-jahia-connector: Site Search does support query suggestions on autocomplete'
            );
        }

        if (queryConfig.results) {
            const requestOptions: RequestOptions = {
                siteKey: this.siteKey,
                language: this.language,
                workspace: this.workspace,
                nodeType: this.nodeType,
                functionScore: this.functionScore
            };
            const graphQLRequest = adaptRequest(requestOptions,
                {searchTerm},
                queryConfig
            );

            return request<SearchResponse>(this.apiToken, this.baseURL, 'POST', graphQLRequest).then(json => ({
                autocompletedResults: adaptResponse(json, queryConfig.results!.resultsPerPage, queryConfig).results
            }));
        }

        return {};
    }

    onAutocompleteResultClick({tags}: {tags?: unknown}): void {
        if (tags) {
            console.warn(
                'search-ui-jahia-connector: Site Search does not support tags on autocompleteClick'
            );
        }
    }
}

export default JahiaSearchAPIConnector;
