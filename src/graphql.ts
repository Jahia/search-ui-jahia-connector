/** The built-in scalars this package sends values as. Always non-null — see {@link GraphQLVariables}. */
export type GraphQLScalar = 'String!' | 'Int!' | 'Float!' | 'Boolean!';

const ENUM_VALUE = /^[_A-Za-z][_0-9A-Za-z]*$/;

/**
 * Check that a value can be written into the document as a GraphQL enum.
 *
 * Enums are the one thing a variable cannot replace without knowing the schema's type names, so
 * `workspace` and the sort direction are still written into the document itself. Validating the
 * shape is what keeps that from being an injection point: anything that is not a bare enum name is
 * rejected here rather than concatenated in.
 */
export function enumValue(argument: string, value: string): string {
    if (!ENUM_VALUE.test(value)) {
        throw new Error(`search-ui-jahia-connector: ${argument} must be a GraphQL enum value, got ${JSON.stringify(value)}`);
    }

    return value;
}

/**
 * Collects the values a query needs, hands back the `$name` to write into the document, and builds
 * the matching variable declarations.
 *
 * Every variable is declared non-null. A nullable variable cannot be used where the schema declares
 * a non-null argument, and this package does not know the schema — `T!` is accepted in both
 * positions. The consequence is that there is no way to send an explicit null, so an argument whose
 * value is absent is left out of the document rather than passed as null.
 */
export class GraphQLVariables {
    private readonly declarations: string[] = [];
    private readonly collected: Record<string, unknown> = {};

    /**
     * Register a value and return the `$name` to place in the document.
     *
     * `hint` only shapes the variable name, to keep a printed query readable; it is sanitized and
     * de-duplicated, so any string is safe to pass.
     */
    add(hint: string, type: GraphQLScalar, value: unknown): string {
        const name = this.uniqueName(hint);
        this.declarations.push(`$${name}: ${type}`);
        this.collected[name] = value;
        return `$${name}`;
    }

    /** The `($a: String!, $b: Int!)` clause for the operation, or `''` when nothing was collected. */
    declaration(): string {
        return this.declarations.length === 0 ? '' : `(${this.declarations.join(', ')})`;
    }

    /** The values to send alongside the document. */
    values(): Record<string, unknown> {
        return {...this.collected};
    }

    private uniqueName(hint: string): string {
        const base = hint.replace(/[^_0-9A-Za-z]/g, '_').replace(/^[0-9]/, '_$&');
        if (!(base in this.collected)) {
            return base;
        }

        let suffix = 2;
        while (`${base}_${suffix}` in this.collected) {
            suffix++;
        }

        return `${base}_${suffix}`;
    }
}
