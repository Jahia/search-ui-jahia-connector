import treeFacetHelper, {prepareCategoryFacet} from '../treeFacetHelper';
import adaptedResponse from '../../resources/adaptedResponse';
const treeFacetResponse = `{
  search(q: "", siteKeys: ["digitall"], language: "en", workspace: LIVE, filters: {nodeType: {type: "jnt:page"}}) {
    _music: treeFacet(field: "jgql:categories_path.facet", rootPath: "/music") {
      field
      rootPath
      data {
        value
        count
      }
    }
    _music_classical: treeFacet(field: "jgql:categories_path.facet", rootPath: "/music/classical") {
      field
      rootPath
      data {
        value
        count
      }
    }
    _music_electronic: treeFacet(field: "jgql:categories_path.facet", rootPath: "/music/electronic") {
      field
      rootPath
      data {
        value
        count
      }
    }
    _annual_filings: treeFacet(field: "jgql:categories_path.facet", rootPath: "/annual-filings") {
      field
      rootPath
      data {
        value
        count
      }
    }
    _music_blues: treeFacet(field: "jgql:categories_path.facet", rootPath: "/music/blues") {
      field
      rootPath
      data {
        value
        count
      }
    }
    _music_blues_canadian_blues: treeFacet(field: "jgql:categories_path.facet", rootPath: "/music/blues/canadian_blues") {
      field
      rootPath
      data {
        value
        count
      }
    }
    _music_electronic_chiptune: treeFacet(field: "jgql:categories_path.facet", rootPath: "/music/electronic/chiptune") {
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
        "value": "/music",
        "count": 2
    },
    {
        "value": "/music/classical",
        "count": 2
    },
    {
        "value": "/music/electronic",
        "count": 2
    },
    {
        "value": "/annual-filings",
        "count": 1
    },
    {
        "value": "/music/blues",
        "count": 1
    },
    {
        "value": "/music/blues/canadian_blues",
        "count": 1
    },
    {
        "value": "/music/electronic/chiptune",
        "count": 1
    }
];
const treeFacetSearchOutput = {
    "_music": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/music",
        "data": [
            {
                "value": "classical",
                "count": 2
            },
            {
                "value": "electronic",
                "count": 2
            },
            {
                "value": "blues",
                "count": 1
            }
        ]
    },
    "_music_classical": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/music/classical",
        "data": []
    },
    "_music_electronic": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/music/electronic",
        "data": [
            {
                "value": "chiptune",
                "count": 1
            }
        ]
    },
    "_annual_filings": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/annual-filings",
        "data": []
    },
    "_music_blues": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/music/blues",
        "data": [
            {
                "value": "canadian_blues",
                "count": 1
            }
        ]
    },
    "_music_blues_canadian_blues": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/music/blues/canadian_blues",
        "data": []
    },
    "_music_electronic_chiptune": {
        "field": "jgql:categories_path.facet",
        "rootPath": "/music/electronic/chiptune",
        "data": []
    }
};
const categoryTitleData = [
    {
        "value": "Categories",
        "count": 3
    },
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
        "count": 1
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
               treeFacetResponse
            );
        });
        it('prepare category facet returns consistent category information for treeview', () => {
            const facetsResponse = prepareCategoryFacet(treeFacetSearchOutput, pathFacetsData, categoryTitleData);
            const musicObject = facetsResponse.find(facet => facet.path === '/music');
            expect(musicObject.isRoot).toBeTruthy();
            expect(musicObject.title).toEqual('Music');
            expect(musicObject.children).toEqual(['/music/classical', '/music/electronic', '/music/blues']);
            expect(musicObject.value).toEqual('/music');
            expect(musicObject.count).toEqual(2);
            const canBluesObject = facetsResponse.find(facet => facet.path === '/music/blues/canadian_blues');
            expect(canBluesObject.title).toEqual('Canadian Blues');
            expect(canBluesObject.children).toEqual([]);
            expect(canBluesObject.isRoot).toBeFalsy();

        });
    });
});
