function invalidSortFields(qc) {
    return qc === null || qc.sortDirection === "" || qc.sortDirection === undefined || qc.sortField === "" || qc.sortField === undefined;
}
export default function(state) {
    if (invalidSortFields(state)) {
        return "";
    }
    return `, sortBy: { orderType: ${state.sortDirection.toUpperCase()}, property: "${state.sortField}"}`;
}