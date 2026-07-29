import type {GraphQLVariables} from './graphql.js';
import type {FacetConfig, FacetRange, QueryConfig, RequestState} from './types.js';

/**
 * `{name: $n, from: $f, to: $t}` — a bound that is not configured is left out of the object rather
 * than sent as null, since the variables are declared non-null.
 */
function buildRangeValue(range: FacetRange, hint: string, variables: GraphQLVariables): string {
    const args = [`name: ${variables.add(`${hint}_name`, 'String!', range.name)}`];
    if (range.from !== undefined) {
        args.push(`from: ${variables.add(`${hint}_from`, 'String!', String(range.from))}`);
    }

    if (range.to !== undefined) {
        args.push(`to: ${variables.add(`${hint}_to`, 'String!', String(range.to))}`);
    }

    return `{${args.join(',')}}`;
}

/**
 * `_request` is deliberately unused. The previous implementation walked `request.filters` into a
 * `selections` array that nothing ever read; registering variables for it now would declare
 * variables the document never references, which makes the query invalid. The parameter stays so
 * the "ignores request filters entirely" characterization test can keep asserting that a request's
 * filters make no difference to the facet query.
 */
export default function facets(_request: RequestState, queryConfig: QueryConfig, variables: GraphQLVariables): string {
    if (!queryConfig.facets || Object.entries(queryConfig.facets).length === 0) {
        return '';
    }

    // Grouped by type, so value facets are emitted before range facets, as before.
    const byType: Record<string, Record<string, FacetConfig>> = {};
    Object.entries(queryConfig.facets).forEach(([facetName, facet]) => {
        if (byType[facet.type] === undefined) {
            byType[facet.type] = {};
        }

        byType[facet.type][facetName] = facet;
    });

    const facetInputs: string[] = [];
    Object.values(byType).forEach(group => {
        Object.entries(group).forEach(([facetName, facet]) => {
            // The response key is written into the document: a GraphQL alias cannot be a variable.
            // It comes from the application's facet configuration, not from visitor input.
            const responseKey = facetName.replace(/[:.]/g, '_');
            // Every one of these is registered lazily, inside the branch that writes it into the
            // document: a declared variable the document never references makes the query invalid,
            // and a facet with an unrecognised type is dropped without emitting anything at all.
            const field = () => variables.add(`${responseKey}_field`, 'String!', facetName);
            // Left out when not configured, rather than sent as null.
            const max = () => facet.max === undefined ? '' : `, max: ${variables.add(`${responseKey}_max`, 'Int!', facet.max)}`;
            const minDocCount = () => facet.minDoc === undefined ? '' : `, minDocCount: ${variables.add(`${responseKey}_minDocCount`, 'Int!', facet.minDoc)}`;

            if (facet.type === 'value') {
                const hierarchical = facet.hierarchical === true;
                const rootPath = hierarchical && facet.rootPath !== undefined ?
                    `rootPath: ${variables.add(`${responseKey}_rootPath`, 'String!', facet.rootPath)}, ` :
                    '';
                const disjunctive = variables.add(`${responseKey}_disjunctive`, 'Boolean!', Boolean(facet.disjunctive));
                if (hierarchical) {
                    facetInputs.push(`${responseKey}: treeFacet(field:${field()}, ${rootPath}disjunctive: ${disjunctive}${max()}${minDocCount()}) {
                data{value,count,key,hasChildren,rootPath,filter}}`);
                } else {
                    facetInputs.push(`${responseKey}: termFacet(field:${field()}, disjunctive: ${disjunctive}${max()}${minDocCount()}) {
                data{value,count}}`);
                }
            } else if (facet.type === 'date_range' || facet.type === 'range') {
                // Deliberately not a bare `else`: a facet whose type is neither value nor range is
                // dropped rather than emitted, which is what the previous implementation did.
                // Note there is no minDocCount here either — range facets never sent one.
                const ranges = facet.ranges
                    .map((range, index) => buildRangeValue(range, `${responseKey}_${index}`, variables))
                    .join(',');
                facetInputs.push(`${responseKey}:rangeFacet(field: ${field()}, ranges:[${ranges}]${max()}) {
                data{name,count}}`);
            }
        });
    });
    return `${facetInputs.join(',')}`;
}
