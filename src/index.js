export {default} from './JahiaSearchAPIConnector.js';
export {Field, FieldType} from './field.js';

// Where this connector's contract differs from Search UI's, re-exported as types only so consumers
// can name it without reaching into subpaths. Everything it does not diverge on — RequestState,
// Filter, SearchResult, FacetValue — comes from @elastic/search-ui directly.
// Prose stays in `//` comments: a description inside the block below would be copied onto every one
// of the generated type aliases.
/**
 * @typedef {import('./JahiaSearchAPIConnector.js').JahiaSearchAPIConnectorOptions} JahiaSearchAPIConnectorOptions
 * @typedef {import('./field.js').FieldTypeValue} FieldTypeValue
 * @typedef {import('./types.js').JahiaQueryConfig} JahiaQueryConfig
 * @typedef {import('./types.js').JahiaAutocompleteQueryConfig} JahiaAutocompleteQueryConfig
 * @typedef {import('./types.js').JahiaFacetConfiguration} JahiaFacetConfiguration
 * @typedef {import('./types.js').JahiaResponseState} JahiaResponseState
 * @typedef {import('./types.js').JahiaAutocompleteResponseState} JahiaAutocompleteResponseState
 * @typedef {import('./types.js').JahiaFacet} JahiaFacet
 * @typedef {import('./types.js').JahiaFacetValue} JahiaFacetValue
 */
