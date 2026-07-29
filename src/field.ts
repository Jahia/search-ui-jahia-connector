import type {GraphQLVariables} from './graphql.js';
import type {ResultField, SearchHit, SearchResult} from './types.js';

const FieldType = {
    HIT: 'hit',
    NODE: 'node',
    REFERENCE_AS_VALUE: 'refValue',
    REFERENCE_AS_PATH: 'refPath'
} as const;

/** The kind of field being requested — one of the {@link FieldType} values. */
type FieldTypeValue = (typeof FieldType)[keyof typeof FieldType];

class Field {
    type: FieldTypeValue;
    name: string;
    /** `null` is accepted alongside omission: the alias is only ever tested for truthiness. */
    alias?: string | null;
    useSnippet: boolean;

    /**
     * Field allows you define the data you want to receive from your searches
     *
     * @param type The type of field (ESHit or JCR)
     * @param name field name that should be returned in the response
     * @param alias optional, define an alias for this field
     * @param useSnippet configure if value is html based (snippet) or plain text (raw)
     */
    constructor(type: FieldTypeValue, name: string, alias?: string | null, useSnippet = false) {
        this.type = type;
        this.name = name;
        this.alias = alias;
        this.useSnippet = useSnippet;
    }

    /**
     * The selection for this field.
     *
     * The response key is written into the document — a GraphQL alias cannot be a variable — so it
     * has to be a bare name. Both it and the selected `name` come from the application's own field
     * configuration rather than from anything a visitor types.
     */
    resolveRequestField(variables: GraphQLVariables): string {
        const responseKey = this.alias ? this.alias : this.name.replace(':', '_');
        let fieldTemplate: string;
        switch (this.type) {
            case FieldType.REFERENCE_AS_VALUE:
            case FieldType.REFERENCE_AS_PATH:
            case FieldType.NODE:
                fieldTemplate = `${responseKey} : property(name: ${variables.add(`${responseKey}_name`, 'String!', this.name)})`;
                break;
            case FieldType.HIT:
            default:
                fieldTemplate = this.name;
        }

        return fieldTemplate;
    }

    resolveResponseField(hit: SearchHit, result: SearchResult): void {
        // No initialiser: every switch branch (including default) assigns before use.
        let property: unknown;
        switch (this.type) {
            case FieldType.NODE:
            case FieldType.REFERENCE_AS_PATH:
            case FieldType.REFERENCE_AS_VALUE:
                property = hit[this.alias ? this.alias : this.name.replace(':', '_')];
                break;
            case FieldType.HIT:
            default:
                property = hit[this.name.replace(':', '_')];
        }

        const field: ResultField = {};
        if (this.useSnippet) {
            field.snippet = property;
        } else {
            field.raw = property;
        }

        result[this.alias ? this.alias : this.name.replace(':', '_')] = field;
    }
}

export {Field, FieldType};
export type {FieldTypeValue};
