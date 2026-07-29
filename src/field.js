/**
 * The kind of field being requested — one of the FieldType values.
 * @typedef {'hit'|'node'|'refValue'|'refPath'} FieldTypeValue
 */

/** @type {{HIT: FieldTypeValue, NODE: FieldTypeValue, REFERENCE_AS_VALUE: FieldTypeValue, REFERENCE_AS_PATH: FieldTypeValue}} */
const FieldType = {
    HIT: 'hit',
    NODE: 'node',
    REFERENCE_AS_VALUE: 'refValue',
    REFERENCE_AS_PATH: 'refPath'
};

class Field {
    /**
     * Field allows you define the data you want to receive from your searches
     *
     * `type` is a FieldType *value* (e.g. FieldType.HIT), not the FieldType object — documenting it
     * as `{FieldType}` made the generated .d.ts demand the whole object and reject correct calls.
     *
     * @param {FieldTypeValue} type The type of field (ESHit or JCR)
     * @param {string} name  field name that should be returned in the response
     * @param {string|null} [alias] optional, define an alias for this field — the README passes null
     * to reach the useSnippet argument, so null is accepted as "no alias" alongside undefined
     * @param {boolean} [useSnippet] configure if value is html based (snippet) or plain text (raw)
     */
    constructor(type, name, alias, useSnippet = false) {
        this.type = type;
        this.name = name;
        this.alias = alias;
        this.useSnippet = useSnippet;
    }

    /**
     * The fragment of the GraphQL query that asks for this field.
     * @returns {string}
     */
    resolveRequestField() {
        let fieldTemplate;
        switch (this.type) {
            case FieldType.REFERENCE_AS_VALUE:
            case FieldType.REFERENCE_AS_PATH:
            case FieldType.NODE:
                fieldTemplate = `${this.alias ? this.alias : this.name.replace(':', '_')} : property(name: "${this.name}")`;
                break;
            case FieldType.HIT:
            default:
                fieldTemplate = this.name;
        }

        return fieldTemplate;
    }

    /**
     * Copy this field out of a raw hit and onto the result Search UI renders, under its alias.
     *
     * @param {Record<string, any>} hit one hit of the GraphQL response
     * @param {import('./types.js').SearchResult} result mutated in place
     * @returns {void}
     */
    resolveResponseField(hit, result) {
        // No initialiser: every switch branch (including default) assigns before use.
        let property;
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

        const field = {};
        if (this.useSnippet) {
            field.snippet = property;
        } else {
            field.raw = property;
        }

        result[this.alias ? this.alias : this.name.replace(':', '_')] = field;
    }
}

export {Field, FieldType};
