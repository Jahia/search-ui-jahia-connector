import treeFacetHelper, {prepareCategoryFacet} from '../treeFacetHelper';
import adaptedResponse from '../../resources/adaptedResponse';


const treeFacetRequest = `{
  search(q: "", siteKeys: ["digitall"], language: "en", workspace: LIVE, filters: {nodeType: {type: "jnt:page"}}) {
    _music: treeFacet(field: "jgql:categories_path.facet", rootPath: "/Music", disjunctive: true, max: 50) {
      field
      rootPath
      data {
        value
        count
      }
    }
    _annual_filings: treeFacet(field: "jgql:categories_path.facet", rootPath: "/Annual Filings", disjunctive: true, max: 50) {
      field
      rootPath
      data {
        value
        count
      }
    }
    _music_classical: treeFacet(field: "jgql:categories_path.facet", rootPath: "/Music/Classical", disjunctive: true, max: 50) {
      field
      rootPath
      data {
        value
        count
      }
    }
    _music_electronic: treeFacet(field: "jgql:categories_path.facet", rootPath: "/Music/Electronic", disjunctive: true, max: 50) {
      field
      rootPath
      data {
        value
        count
      }
    }
    _music_blues: treeFacet(field: "jgql:categories_path.facet", rootPath: "/Music/Blues", disjunctive: true, max: 50) {
      field
      rootPath
      data {
        value
        count
      }
    }
    _music_blues_canadian_blues: treeFacet(field: "jgql:categories_path.facet", rootPath: "/Music/Blues/Canadian Blues", disjunctive: true, max: 50) {
      field
      rootPath
      data {
        value
        count
      }
    }
    _music_electronic_chiptune: treeFacet(field: "jgql:categories_path.facet", rootPath: "/Music/Electronic/Chiptune", disjunctive: true, max: 50) {
      field
      rootPath
      data {
        value
        count
      }
    }
  }
}
`;
const pathFacetsData = [
    {
        "value": "/Annual Filings",
        "count": 2
    },
    {
        "value": "/Music",
        "count": 2
    },
    {
        "value": "/Music/Classical",
        "count": 2
    },
    {
        "value": "/Music/Electronic",
        "count": 2
    },
    {
        "value": "/Music/Blues",
        "count": 1
    },
    {
        "value": "/Music/Blues/Canadian Blues",
        "count": 1
    },
    {
        "value": "/Music/Electronic/Chiptune",
        "count": 1
    }
]
const treeFacetSearchOutput = {
    "_annual_filings": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/Annual Filings",
        "data": []
    },
    "_music": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/Music",
        "data": [
            {
                "value": "Classical",
                "count": 2
            },
            {
                "value": "Blues",
                "count": 1
            },
            {
                "value": "Electronic",
                "count": 2
            }
        ]
    },
    "_music_classical": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/Music/Classical",
        "data": []
    },
    "_music_electronic": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/Music/Electronic",
        "data": [
            {
                "value": "Chiptune",
                "count": 1
            }
        ]
    },
    "_music_blues": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/Music/Blues",
        "data": [
            {
                "value": "Canadian Blues",
                "count": 1
            }
        ]
    },
    "_music_blues_canadian_blues": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/Music/Blues/Canadian Blues",
        "data": []
    },
    "_music_electronic_chiptune": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/Music/Electronic/Chiptune",
        "data": []
    }
}

const categoryTitleData = [
    {
        "value": "Classical",
        "count": 2
    },
    {
        "value": "Electronic",
        "count": 2
    },
    {
        "value": "Music",
        "count": 2
    },
    {
        "value": "Annual Filings",
        "count": 2
    },
    {
        "value": "Blues",
        "count": 1
    },
    {
        "value": "Canadian Blues",
        "count": 1
    },
    {
        "value": "Chiptune",
        "count": 1
    }
];

let requestOptions = {
    siteKey: ['digitall'],
    language: 'en',
    workspace: 'LIVE',
    nodeType: 'jnt:page'
};
const facetName = "jgql:categories_path.facet";
const state = {
    "current": 1,
    "filters": [],
    "resultsPerPage": 20,
    "searchTerm": "",
    "sortDirection": "",
    "sortField": ""
};

describe('test tree facet helper methods', () => {
    describe('test if treeFacetHelper creates correct request from facet response', () => {
        it('creates correct request', () => {
            expect(treeFacetHelper(adaptedResponse.facets[facetName][0].data, state, facetName, requestOptions)).toEqual(
               treeFacetRequest
            );
        });
        it('prepare category facet returns consistent category information for treeview', () => {
            const facetsResponse = prepareCategoryFacet(treeFacetSearchOutput, pathFacetsData, categoryTitleData);
            console.log(facetsResponse);
            const musicObject = facetsResponse.find(facet => facet.path === '/Music');
            expect(musicObject.isRoot).toBeTruthy();
            expect(musicObject.title).toEqual('Music');
            expect(musicObject.children).toEqual(['/Music/Classical', '/Music/Blues', '/Music/Electronic']);
            expect(musicObject.value).toEqual('/Music');
            expect(musicObject.count).toEqual(2);
            const canBluesObject = facetsResponse.find(facet => facet.path === '/Music/Blues/Canadian Blues');
            expect(canBluesObject.title).toEqual('Canadian Blues');
            expect(canBluesObject.children).toEqual([]);
            expect(canBluesObject.isRoot).toBeFalsy();

        });
    });
});
