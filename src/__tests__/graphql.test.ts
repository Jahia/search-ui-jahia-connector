import {enumValue, GraphQLVariables} from '../graphql.js';
import {assertEveryVariableIsUsed} from './helpers.js';

describe('GraphQLVariables', () => {
    it('declares nothing when nothing was collected', () => {
        const variables = new GraphQLVariables();
        expect(variables.declaration()).toBe('');
        expect(variables.values()).toEqual({});
    });

    it('returns the reference to place in the document, and declares it non-null', () => {
        const variables = new GraphQLVariables();
        expect(variables.add('q', 'String!', 'hello')).toBe('$q');
        expect(variables.declaration()).toBe('($q: String!)');
        expect(variables.values()).toEqual({q: 'hello'});
    });

    // Two facets can easily want the same hint — `field`, say — and two variables with one name is
    // not a document the server will accept.
    it('de-duplicates a repeated hint', () => {
        const variables = new GraphQLVariables();
        expect(variables.add('field', 'String!', 'a')).toBe('$field');
        expect(variables.add('field', 'String!', 'b')).toBe('$field_2');
        expect(variables.add('field', 'String!', 'c')).toBe('$field_3');
        expect(variables.values()).toEqual({field: 'a', field_2: 'b', field_3: 'c'});
    });

    it('does not collide with a hint that already looks like a de-duplicated one', () => {
        const variables = new GraphQLVariables();
        variables.add('field_2', 'String!', 'first');
        variables.add('field', 'String!', 'second');
        expect(variables.add('field', 'String!', 'third')).toBe('$field_3');
    });

    // Hints are derived from facet and property names, which carry colons and dots.
    it('sanitizes a hint into a usable variable name', () => {
        const variables = new GraphQLVariables();
        expect(variables.add('jgql:categories.path', 'String!', 'x')).toBe('$jgql_categories_path');
    });

    it('keeps a hint that starts with a digit from producing an invalid name', () => {
        const variables = new GraphQLVariables();
        expect(variables.add('2015', 'String!', 'x')).toBe('$_2015');
    });

    it('keeps declarations in the order they were added', () => {
        const variables = new GraphQLVariables();
        variables.add('q', 'String!', '');
        variables.add('size', 'Int!', 5);
        variables.add('disjunctive', 'Boolean!', false);
        expect(variables.declaration()).toBe('($q: String!, $size: Int!, $disjunctive: Boolean!)');
    });

    it('hands out a copy, so a caller cannot mutate what will be sent', () => {
        const variables = new GraphQLVariables();
        variables.add('q', 'String!', 'hello');
        variables.values().q = 'tampered';
        expect(variables.values()).toEqual({q: 'hello'});
    });
});

describe('enumValue', () => {
    it('passes a bare enum name through', () => {
        expect(enumValue('workspace', 'LIVE')).toBe('LIVE');
        expect(enumValue('sortDirection', 'ASC')).toBe('ASC');
        expect(enumValue('workspace', '_private2')).toBe('_private2');
    });

    it.each([
        ['a quoted string', '"LIVE"'],
        ['something that closes the argument list', 'LIVE) {id} evil('],
        ['a value with a space', 'not an enum'],
        ['a value starting with a digit', '2workspaces'],
        ['an empty value', '']
    ])('rejects %s', (_name, value) => {
        expect(() => enumValue('workspace', value)).toThrow('workspace must be a GraphQL enum value');
    });

    it('names the offending value in the error', () => {
        expect(() => enumValue('workspace', 'not an enum')).toThrow('"not an enum"');
    });
});

// The guard the fragment helpers rely on. A variable declared but never referenced makes a query
// invalid, and nothing else in the suite would notice — so the guard itself needs pinning.
describe('assertEveryVariableIsUsed', () => {
    it('accepts a document that references every variable it declares', () => {
        expect(() => assertEveryVariableIsUsed({
            query: 'query ($q: String!) {\n  search(q: $q) {\n    totalHits\n  }\n}',
            variables: {q: 'hello'}
        })).not.toThrow();
    });

    it('rejects a document that declares a variable it never references', () => {
        expect(() => assertEveryVariableIsUsed({
            query: 'query ($q: String!, $unused: Int!) {\n  search(q: $q) {\n    totalHits\n  }\n}',
            variables: {q: 'hello', unused: 1}
        })).toThrow('Declared but never referenced in the document: unused');
    });

    it('rejects a value with no matching variable in the document at all', () => {
        expect(() => assertEveryVariableIsUsed({
            query: 'query ($q: String!) {\n  search(q: $q) {\n    totalHits\n  }\n}',
            variables: {q: 'hello', orphan: 'sent but never declared'}
        })).toThrow('Declared but never referenced in the document: orphan');
    });

    // `$q` must not be counted as a reference to `$q_2`, or a genuinely unused variable slips past.
    it('does not treat a prefix of a longer name as a reference', () => {
        expect(() => assertEveryVariableIsUsed({
            query: 'query ($q: String!, $q_2: String!) {\n  search(q: $q) {\n    totalHits\n  }\n}',
            variables: {q: 'hello', q_2: 'unused'}
        })).toThrow('Declared but never referenced in the document: q_2');
    });
});
