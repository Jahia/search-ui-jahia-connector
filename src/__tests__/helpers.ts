import {parse, parseValue, print, visit} from 'graphql';
import {GraphQLVariables} from '../graphql.js';
import type {GraphQLRequest} from '../types.js';

/**
 * `filters()` and `facets()` return GraphQL *fragments* that `adaptRequest` interpolates into a
 * query and then runs through `print(parse(...))`. That round-trip erases their indentation, so the
 * raw spacing of a fragment is not observable from outside the package — only the GraphQL it parses
 * to is. These helpers apply the same round-trip, which is the granularity a rewrite has to match:
 * strict about structure and argument values, indifferent to layout.
 *
 * A fragment now also registers the values it needs on a shared {@link GraphQLVariables}, so the
 * helpers take a builder rather than a finished string: they own the bag, hand it to the fragment,
 * and report the document and the values together.
 */

/** A normalized fragment: the document it parses to, and the values it asks to be sent. */
export interface NormalizedFragment {
    query: string;
    variables: Record<string, unknown>;
}

/**
 * A variable that is declared but never referenced makes the whole query invalid, and neither
 * `parse` nor a snapshot notices. Every helper checks it, so no spec can pin a query the server
 * would reject.
 */
export const assertEveryVariableIsUsed = ({query, variables}: GraphQLRequest): void => {
    const unused = Object.keys(variables).filter(name => {
        const references = query.match(new RegExp(`\\$${name}\\b`, 'g')) ?? [];
        // One reference is the declaration itself; a used variable appears at least twice.
        return references.length < 2;
    });
    if (unused.length > 0) {
        throw new Error(`Declared but never referenced in the document: ${unused.join(', ')}`);
    }
};

const normalize = (document: string, variables: GraphQLVariables): NormalizedFragment => {
    const normalized = {query: print(parse(document)), variables: variables.values()};
    assertEveryVariableIsUsed(normalized);
    return normalized;
};

/** Normalize an argument-list fragment, as returned by `filters()`. */
export const normalizeArgs = (build: (variables: GraphQLVariables) => string): NormalizedFragment => {
    const variables = new GraphQLVariables();
    const fragment = build(variables);
    return normalize(`query ${variables.declaration()} { search(q: "" ${fragment}) { totalHits } }`, variables);
};

/** Normalize a selection-set fragment, as returned by `facets()`. */
export const normalizeSelections = (build: (variables: GraphQLVariables) => string): NormalizedFragment => {
    const variables = new GraphQLVariables();
    const fragment = build(variables);
    return normalize(`query ${variables.declaration()} { search { totalHits ${fragment} } }`, variables);
};

/**
 * Substitute a request's variables back into its document.
 *
 * The whole point of parameterizing is that no value appears in the query text, which makes the
 * document on its own a poor thing to state an expectation against — it says nothing about what is
 * actually being searched for. Putting the values back yields the query the request *means*, so a
 * spec can write that out in full, independently of how it happens to be parameterized. The
 * expectations that predate variables are still readable, and still assert the same thing.
 */
export const inlineVariables = ({query, variables}: GraphQLRequest): string => {
    const withoutDefinitions = visit(parse(query), {
        OperationDefinition: node => ({...node, variableDefinitions: []})
    });
    return print(visit(withoutDefinitions, {
        Variable: node => parseValue(JSON.stringify(variables[node.name.value]))
    }));
};
