const FieldType = {
    HIT: 'hit',
    NODE: 'node',
    REFERENCE_AS_VALUE: 'refValue',
    REFERENCE_AS_PATH: 'refPath'
};

class Field {
    /**
     * Field allows you define the data you want to receive from your searches
     * @param {FieldType} type The type of field (ESHit or JCR)
     * @param {string} name  field name that should be returned in the response
     * @param {string} alias optional, define an alias for this field
     * @param {boolean} useSnippet configure if value is html based (snippet) or plain text (raw)
     */
    constructor(type, name, alias, useSnippet = false) {
        this.type = type;
        this.name = name;
        this.alias = alias;
        this.useSnippet = useSnippet;
    }

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

    resolveResponseField(hit, result) {
        let property = null;
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
