import adaptRequest from '../adaptRequest';
import {Field, FieldType} from '../field';

beforeEach(() => {
    global.queryConfig = {
        // eslint-disable-next-line camelcase
        result_fields: [
            new Field(FieldType.HIT, 'link'),
            new Field(FieldType.HIT, 'displayableName', 'title'),
            new Field(FieldType.HIT, 'excerpt', null, true),
            new Field(FieldType.HIT, 'score'),
            new Field(FieldType.NODE, 'jcr:created', 'created')
        ]
    };
});

describe("Sort parameters tests", function() {
    const requestOptions = {
        siteKey: "fake",
        language: "fake",
        workspace: "fake",
        nodeType: "fake"
    };

    it("Query without sort", function() {
        const query = adaptRequest(requestOptions, {}, queryConfig);
        expect(query).toMatchSnapshot();
    });

    it("Query with sort", function() {
        queryConfig["sortDirection"] = "ASC";
        queryConfig["sortField"] = "jcr:title";
        const query = adaptRequest(requestOptions, {}, queryConfig);
        expect(query).toMatchSnapshot();
    });

    it("Query with incorrect sort field", function() {
        //Note that in this case sort parameters are ignored and the sort falls back to Relevance
        queryConfig["sortDirection"] = "ASC";
        queryConfig["sortField"] = "";
        const query = adaptRequest(requestOptions, {}, queryConfig);
        expect(query).toMatchSnapshot();
    });

    it("Query with incorrect sort direction", function() {
        //Note that in this case sort parameters are ignored and the sort falls back to Relevance
        queryConfig["sortDirection"] = "";
        queryConfig["sortField"] = "jcr:title";
        const query = adaptRequest(requestOptions, {}, queryConfig);
        expect(query).toMatchSnapshot();
    });
});