import {Field, FieldType} from './field.js';
import {parse, print} from 'graphql';
import sort from './sort.js';
import facets from './facets.js';
import filters from './filters.js';

const buildFields = fields => {
    const fieldsConcatenated = {
        hitFields: '',
        nodeFields: ''
    };
    fields.forEach(field => {
        if (field.type === FieldType.HIT) {
            fieldsConcatenated.hitFields = `${fieldsConcatenated.hitFields},${field.resolveRequestField()}`;
        } else {
            fieldsConcatenated.nodeFields = `${fieldsConcatenated.nodeFields},${field.resolveRequestField()}`;
        }
    });
    return fieldsConcatenated;
};

/**
 * The part of the connector's configuration that varies per request. Was referenced by the JSDoc
 * below without ever being declared, which emitted a .d.ts naming a type that does not exist.
 *
 * @typedef {Object} RequestOptions
 * @property {string} siteKey
 * @property {string} [language]
 * @property {string} [workspace]
 * @property {string} [nodeType]
 * @property {string} [functionScore]
 */

/**
 * A GraphQL request: the document, and the values it binds as variables.
 *
 * @typedef {Object} GraphQLRequest
 * @property {string} query the document, in graphql print() form
 * @property {Record<string, any>} variables the values of the document's variables
 */

/**
 * Adapt the request from Search UI to Jahia Augmented Search.
 *
 * The document names the result fields and the facets of the query configuration. The request
 * values and the connector options travel as variables. One configuration therefore yields one
 * document.
 *
 * @param {RequestOptions} requestOptions the options for this request
 * @param {import('@elastic/search-ui').RequestState} request the state of the current request
 * @param {import('./types.js').JahiaQueryConfig|import('./types.js').JahiaAutocompleteQueryConfig} queryConfig the query configuration as defined when initializing the App
 * @returns {GraphQLRequest} the graphql request to be executed on a Jahia backend
 */
export default function adaptRequest(requestOptions, request, queryConfig) {
    const graphQLOptions = {
        resultsPerPage: 5,
        current: 1,
        ...requestOptions,
        ...request
    };
    const resultFields = 'results' in queryConfig ? queryConfig.results.result_fields : queryConfig.result_fields;
    const resolvedRequestFields = buildFields(Object.keys(resultFields).reduce((acc, curr) => {
        const field = resultFields[curr];
        if (field instanceof Field) {
            acc.push(field);
        }

        return acc;
    }, []));

    const variables = {
        q: graphQLOptions.searchTerm === undefined || graphQLOptions.searchTerm === null ? '' : String(graphQLOptions.searchTerm),
        siteKeys: [graphQLOptions.siteKey],
        language: graphQLOptions.language,
        workspace: graphQLOptions.workspace,
        functionScoreId: graphQLOptions.functionScore,
        filters: filters(request, queryConfig, graphQLOptions),
        size: graphQLOptions.resultsPerPage,
        page: graphQLOptions.current - 1,
        sortBy: sort(request)
    };

    const query = print(parse(`query (
        $q: String!,
        $siteKeys: [String],
        $language: String,
        $workspace: Workspace,
        $functionScoreId: String,
        $filters: Inputfilter,
        $size: Int,
        $page: Int,
        $sortBy: [InputsortV2]
    ) {
        search(
            q: $q,
            siteKeys: $siteKeys,
            language: $language,
            workspace: $workspace,
            functionScoreId: $functionScoreId,
            filters: $filters
            ) {

            results(size: $size,
                    page: $page,
                    sortBy: $sortBy
                    ) {
                totalHits
                took
                hits {
                    id
                    ${resolvedRequestFields.hitFields}
                    ${resolvedRequestFields.nodeFields}
                }
            }

            ${facets(queryConfig)}
        }
    }`));

    return {query, variables};
}
