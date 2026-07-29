import {Field, FieldType} from './field.js';
import {parse, print} from 'graphql';
import sort from './sort.js';
import facets from './facets.js';
import filters from './filters.js';
import type {QueryConfig, RequestOptions, RequestState} from './types.js';

interface ConcatenatedFields {
    hitFields: string;
    nodeFields: string;
}

const buildFields = (fields: Field[]): ConcatenatedFields => {
    const fieldsConcatenated: ConcatenatedFields = {
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

function htmlEscape(str: string | undefined): string {
    if (str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\\/g, '\\\\');
    }

    return '';
}

/**
 * Adapt the request from Search UI to Jahia Augmented Search
 * @param requestOptions the options for this request
 * @param request the state of the current request
 * @param queryConfig the query configuration as defined when initializing the App
 * @returns the graphql query to be executed on a Jahia backend
 */
export default function adaptRequest(
    requestOptions: RequestOptions,
    request: RequestState,
    queryConfig: QueryConfig
): string {
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
    const resolvedRequestFields = buildFields(declaredFields.filter((field): field is Field => field instanceof Field));

    return print(parse(`query {
        search(
            q: "${graphQLOptions.searchTerm === undefined ? '' : htmlEscape(graphQLOptions.searchTerm)}",
            siteKeys: ["${graphQLOptions.siteKey}"],
            language: "${graphQLOptions.language}",
            workspace: ${graphQLOptions.workspace},
            functionScoreId: "${graphQLOptions.functionScore}",
            ${filters(request, queryConfig, graphQLOptions)}
            ) {

            results(size: ${graphQLOptions.resultsPerPage},
                    page: ${graphQLOptions.current - 1}
                    ${sort(request)}
                    ) {
                totalHits
                took
                hits {
                    id
                    ${resolvedRequestFields.hitFields}
                    ${resolvedRequestFields.nodeFields}
                }
            }

            ${facets(request, queryConfig)}
        }
    }`));
}
