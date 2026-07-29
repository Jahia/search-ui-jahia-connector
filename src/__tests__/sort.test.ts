import adaptRequest from '../adaptRequest.js';
import {Field, FieldType} from '../field.js';
import type {QueryConfig, RequestOptions, RequestState} from '../types.js';

// Module-scoped rather than assigned onto `global`: the specs referenced these as bare identifiers,
// which only worked because they were implicit globals. Still reset before each test, so the
// isolation is unchanged.
let queryConfig: QueryConfig;
let state: RequestState;

beforeEach(() => {
    queryConfig = {
        result_fields: [
            new Field(FieldType.HIT, 'link'),
            new Field(FieldType.HIT, 'displayableName', 'title'),
            new Field(FieldType.HIT, 'excerpt', null, true),
            new Field(FieldType.HIT, 'score'),
            new Field(FieldType.NODE, 'jcr:created', 'created')
        ],
        facets: {}
    };
    state = {};
});

describe('Sort parameters tests', function () {
    const requestOptions: RequestOptions = {
        siteKey: 'fake',
        language: 'fake',
        workspace: 'fake',
        nodeType: 'fake',
        functionScore: 'fake'
    };

    it('Query without sort', function () {
        const query = adaptRequest(requestOptions, state, queryConfig);
        expect(query).toMatchSnapshot();
    });

    it('Query with sort', function () {
        state.sortDirection = 'ASC';
        state.sortField = 'jcr:title';
        const query = adaptRequest(requestOptions, state, queryConfig);
        expect(query).toMatchSnapshot();
    });

    it('Query with incorrect sort field', function () {
        // Note that in this case sort parameters are ignored and the sort falls back to Relevance
        state.sortDirection = 'ASC';
        state.sortField = '';
        const query = adaptRequest(requestOptions, state, queryConfig);
        expect(query).toMatchSnapshot();
    });

    it('Query with incorrect sort direction', function () {
        // Note that in this case sort parameters are ignored and the sort falls back to Relevance
        state.sortDirection = '';
        state.sortField = 'jcr:title';
        const query = adaptRequest(requestOptions, state, queryConfig);
        expect(query).toMatchSnapshot();
    });
});
