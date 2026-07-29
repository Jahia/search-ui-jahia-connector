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
export default function sort(state: RequestState | null): string {
    if (!hasSortFields(state)) {
        return '';
    }

    return `, sortBy: { dir: ${state.sortDirection.toUpperCase()}, field: "${state.sortField}"}`;
}
