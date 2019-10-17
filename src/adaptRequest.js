import {Field, FieldType} from './field';
import {parse, print} from 'graphql';
import sort from './sort';
import facets from './facets';

const buildFields = fields => {
    let fieldsConcatenated = {
        hitFields: '',
        nodeFields: ''
    };
    fields.forEach(field => {
        switch (field.type) {
            case FieldType.HIT:
                fieldsConcatenated.hitFields = `${fieldsConcatenated.hitFields},${field.resolveRequestField()}`;
                break;
            default:
                fieldsConcatenated.nodeFields = `${fieldsConcatenated.nodeFields},${field.resolveRequestField()}`;
                break;
        }
    });
    return fieldsConcatenated;
};

/**
 *
 * @param {RequestOptions} requestOptions
 * @param request
 * @param queryConfig
 * @returns {string}
 */
export default function adaptRequest(requestOptions, request, queryConfig) {
    const graphQLOptions = {
        resultsPerPage: 5,
        current: 1,
        ...requestOptions,
        ...request
    };
    let resultFields = 'results' in queryConfig ? queryConfig.results.result_fields : queryConfig.result_fields;
    let resolvedRequestFields = buildFields(Object.keys(resultFields).reduce((acc, curr) => {
        let field = resultFields[curr];
        if (field instanceof Field) {
            acc.push(field);
        }

        return acc;
    }, []));

    return print(parse(`query {
    jcr {
        searches(siteKey: "${graphQLOptions.siteKey}", language: "${graphQLOptions.language}", workspace: ${graphQLOptions.workspace}) {
            search(
                q: "${graphQLOptions.searchTerm}",
                limit: ${graphQLOptions.resultsPerPage},
                offset: ${graphQLOptions.current - 1},
                filter: { nodeType: { type: "${graphQLOptions.nodeType}" } },
                ${sort(request)}, 
                ${facets(request, queryConfig)}) {
                    totalHits
                    took
                    facets {
                        field
                        type
                        data {
                            ... on TermValue {
                                count
                                value
                            }
                            ... on DateRangeValue {
                                count
                                range {
                                    from
                                    to
                                    name
                                }
                            }
                        }
                    }
                    hits {
                        ${resolvedRequestFields.hitFields}
                        node {
                            uuid
                            ${resolvedRequestFields.nodeFields}
                        }
                    }
                }
            }
          }
        }`));
}
