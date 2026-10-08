function invalidSortFields(qc) {
    return qc === null || qc.sortDirection === '' || qc.sortDirection === undefined || qc.sortField === '' || qc.sortField === undefined;
}

/**
 * The value of the sortBy argument of results, bound as a variable.
 *
 * @param {import('@elastic/search-ui').RequestState} state
 * @returns {Array<{dir: string, field: string}>|undefined} undefined when the state names no complete sort
 */
export default function (state) {
    if (invalidSortFields(state)) {
        return undefined;
    }

    return [{dir: state.sortDirection.toUpperCase(), field: state.sortField}];
}
