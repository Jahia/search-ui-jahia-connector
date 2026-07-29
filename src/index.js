export {default} from './JahiaSearchAPIConnector.js';
export {Field, FieldType} from './field.js';

// The connector's contract, re-exported as types only so consumers can name it without reaching into
// subpaths. There is nothing to export at runtime — these are JSDoc typedefs.
// Prose stays in `//` comments: a description inside the block below would be copied onto every one
// of the generated type aliases.
/**
 * @typedef {import('./JahiaSearchAPIConnector.js').JahiaSearchAPIConnectorOptions} JahiaSearchAPIConnectorOptions
 * @typedef {import('./field.js').FieldTypeValue} FieldTypeValue
 * @typedef {import('./types.js').RequestState} RequestState
 * @typedef {import('./types.js').QueryConfig} QueryConfig
 * @typedef {import('./types.js').ResponseState} ResponseState
 * @typedef {import('./types.js').AutocompleteResponseState} AutocompleteResponseState
 * @typedef {import('./types.js').SearchResult} SearchResult
 * @typedef {import('./types.js').ResultField} ResultField
 * @typedef {import('./types.js').SearchFilter} SearchFilter
 * @typedef {import('./types.js').FacetConfig} FacetConfig
 * @typedef {import('./types.js').FacetRange} FacetRange
 * @typedef {import('./types.js').FacetResult} FacetResult
 * @typedef {import('./types.js').FacetResultEntry} FacetResultEntry
 */
