import {enumValue, type GraphQLVariables} from './graphql.js';
import type {RequestState} from './types.js';

type SortedState = RequestState & {sortDirection: string; sortField: string};

/**
 * The negation of the original `invalidSortFields`, as a type predicate so the two fields narrow.
 * The `null` check still comes first and there is still no `undefined` check, so `sort(undefined)`
 * throws exactly as it did.
 */
function hasSortFields(state: RequestState | null): state is SortedState {
    return !(state === null ||
        state.sortDirection === '' || state.sortDirection === undefined ||
        state.sortField === '' || state.sortField === undefined);
}

// Generate sort field
export default function sort(state: RequestState | null, variables: GraphQLVariables): string {
    if (!hasSortFields(state)) {
        return '';
    }

    // `dir` is an enum, so it stays in the document and is validated instead of parameterized.
    const dir = enumValue('sortDirection', state.sortDirection.toUpperCase());
    return `, sortBy: { dir: ${dir}, field: ${variables.add('sortField', 'String!', state.sortField)}}`;
}
