import {Field, FieldType} from './field';
import {parse, print} from 'graphql';
import sort from './sort';
import facets from './facets';

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
 * Adapt the request from Search UI to Jahia Augmented Search
 * @param {RequestOptions} requestOptions the options for this request
 * @param {any} request the state of the current request
 * @param {any} queryConfig the query configuration as defined when initializing the App
 * @returns {string} the graphql query to be excuted on a Jahia backend
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

    return print(parse(`query {
        search(
            q: "${graphQLOptions.searchTerm}",
            siteKeys: ["${graphQLOptions.siteKey}"],
            language: "${graphQLOptions.language}",
            workspace: ${graphQLOptions.workspace}
            filters: { nodeType: { type: "${graphQLOptions.nodeType}" } }) {

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
