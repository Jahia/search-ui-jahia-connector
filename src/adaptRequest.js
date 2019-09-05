import {Field, FieldType} from './field';
import {parse, print} from 'graphql';
import sort from './sort';

const buildFields = (fields) => {
    let fieldsConcatenated = {
        hitFields: ``,
        nodeFields: ``
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
 * @typedef RequestOptions
 * @param  {string} siteKey The site search will be performed in
 * @param  {string} language Language in which search will be performed
 * @param  {string} workspace Workspace in which search will be performed
 * @param  {string} nodeType The node type that should be searched
 */
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
            search(searchInput: {searchCriteria: {
                text: "${graphQLOptions.searchTerm}"},
                nodeTypeCriteria:{
                    nodeType:"${graphQLOptions.nodeType}"
                    },
                limit: ${graphQLOptions.resultsPerPage},
                offset: ${graphQLOptions.current - 1}
                }${sort(queryConfig)}) {
                    totalHits
                    took
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
