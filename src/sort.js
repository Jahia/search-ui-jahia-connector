function invalidSortFields(qc) {
    return qc === null || qc.sortDirection === "" || qc.sortDirection === undefined || qc.sortField === "" || qc.sortField === undefined;
}
export default function(queryConfig) {
    if (invalidSortFields(queryConfig)) {
        return "";
    }
    return `, sortBy: { orderType: ${queryConfig.sortDirection.toUpperCase()}, property: "${queryConfig.sortField}"}`;
}