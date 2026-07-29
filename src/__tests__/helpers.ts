import {parse, print} from 'graphql';

/**
 * `filters()` and `facets()` return GraphQL *fragments* that `adaptRequest` interpolates into a
 * query and then runs through `print(parse(...))`. That round-trip erases their indentation, so the
 * raw spacing of a fragment is not observable from outside the package — only the GraphQL it parses
 * to is. These helpers apply the same round-trip, which is the granularity a rewrite has to match:
 * strict about structure and argument values, indifferent to layout.
 */

/** Normalize an argument-list fragment, as returned by `filters()`. */
export const normalizeArgs = (fragment: string): string => print(parse(`query { search(q: "" ${fragment}) { totalHits } }`));

/** Normalize a selection-set fragment, as returned by `facets()`. */
export const normalizeSelections = (fragment: string): string => print(parse(`query { search { totalHits ${fragment} } }`));

/** Pull the `q:` argument out of a printed query, to assert on search-term escaping. */
export const searchTermArgOf = (query: string): string => query.match(/q: "[^\n]*/)![0];
