import {Field, FieldType} from './field.js';
import {parse, print} from 'graphql';
import sort from './sort.js';
import facets from './facets.js';
import filters from './filters.js';
import {enumValue, GraphQLVariables} from './graphql.js';
import type {GraphQLRequest, QueryConfig, RequestOptions, RequestState} from './types.js';

interface ConcatenatedFields {
    hitFields: string;
    nodeFields: string;
}

const buildFields = (fields: Field[], variables: GraphQLVariables): ConcatenatedFields => {
    const fieldsConcatenated: ConcatenatedFields = {
        hitFields: '',
        nodeFields: ''
    };
    fields.forEach(field => {
        if (field.type === FieldType.HIT) {
            fieldsConcatenated.hitFields = `${fieldsConcatenated.hitFields},${field.resolveRequestField(variables)}`;
        } else {
            fieldsConcatenated.nodeFields = `${fieldsConcatenated.nodeFields},${field.resolveRequestField(variables)}`;
        }
    });
    return fieldsConcatenated;
};

/**
 * Adapt the request from Search UI to Jahia Augmented Search
 *
 * Every value is sent as a GraphQL variable rather than written into the query text. The two
 * exceptions are enums (`workspace` and the sort direction), which cannot be variables without
 * knowing the schema's type names, and response keys — a GraphQL alias is part of the document's
 * structure. Both are validated or derived from the application's own configuration.
 *
 * @param requestOptions the options for this request
 * @param request the state of the current request
 * @param queryConfig the query configuration as defined when initializing the App
 * @returns the graphql query to be executed on a Jahia backend, and the values it needs
 */
export default function adaptRequest(
    requestOptions: RequestOptions,
    request: RequestState,
    queryConfig: QueryConfig
): GraphQLRequest {
    const graphQLOptions = {
        resultsPerPage: 5,
        current: 1,
        ...requestOptions,
        ...request
    };
    // Non-null: `in` proves the key is present but does not un-optional the declared type.
    const resultFields = 'results' in queryConfig ? queryConfig.results!.result_fields : queryConfig.result_fields;
    // Non-null: a config with no result_fields at all throws here, unchanged. Object.values covers
    // both shapes the config may take — the array used in practice, and a plain record — in the same
    // order the original's Object.keys walk did.
    const declaredFields: unknown[] = Object.values(resultFields!);

    const variables = new GraphQLVariables();
    const resolvedRequestFields = buildFields(declaredFields.filter((field): field is Field => field instanceof Field), variables);
    // An absent search term still searches for the empty string. A term that is not a string is
    // coerced rather than dropped, so a numeric 0 searches for "0".
    const searchTerm = graphQLOptions.searchTerm === undefined ? '' : String(graphQLOptions.searchTerm);

    // Built before the declaration list is read: every add() has to have happened by then.
    const operation = `{
        search(
            q: ${variables.add('q', 'String!', searchTerm)},
            siteKeys: [${variables.add('siteKey', 'String!', graphQLOptions.siteKey)}],
            language: ${variables.add('language', 'String!', graphQLOptions.language)},
            workspace: ${enumValue('workspace', graphQLOptions.workspace)},
            functionScoreId: ${variables.add('functionScoreId', 'String!', graphQLOptions.functionScore)},
            ${filters(request, queryConfig, graphQLOptions, variables)}
            ) {

            results(size: ${variables.add('size', 'Int!', graphQLOptions.resultsPerPage)},
                    page: ${variables.add('page', 'Int!', graphQLOptions.current - 1)}
                    ${sort(request, variables)}
                    ) {
                totalHits
                took
                hits {
                    id
                    ${resolvedRequestFields.hitFields}
                    ${resolvedRequestFields.nodeFields}
                }
            }

            ${facets(request, queryConfig, variables)}
        }
    }`;

    return {
        query: print(parse(`query ${variables.declaration()} ${operation}`)),
        variables: variables.values()
    };
}
