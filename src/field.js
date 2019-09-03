const FieldType = {
    HIT: 'hit',
    NODE: 'node'
};

class Field {
    /**
     *
     * @param type {FieldType} The type of field (ESHit or JCR)
     * @param name {string}  field name that should be returned in the response
     * @param alias {string} optional
     * @param useSnippet {boolean} configure if value is html based (snippet) or plain text (raw)
     */
    constructor(type, name, alias, useSnippet = false) {
        this.type = type;
        this.name = name;
        this.alias = alias;
        this.useSnippet = useSnippet;
    }

    resolveRequestField() {
        switch(this.type) {
            case FieldType.HIT:
                return this.name;
            case FieldType.NODE:
                return `${this.name.replace(':', '_')} : property(name: "${this.name}") {
                    value
                }`;
            default:
                return null;
        }
    }

    resolveResponseField(hit, result) {
        let property = null;
        switch(this.type) {
            case FieldType.HIT:
                property = hit[this.name.replace(':', "_")];
                break;
            case FieldType.NODE:
                property = hit.node[this.name.replace(':', "_")].value;
                break;
        }
        let field = {};
        if (this.useSnippet) {
            field.snippet = property;
        } else {
            field.raw = property;
        }
        result[this.alias ? this.alias : this.name.replace(':', '_')] = field;
    }
}

export {Field, FieldType};
