<!--
    Template for Readmes, see alternatives/examples here: https://github.com/matiassingers/awesome-readme
-->
<a href="https://www.jahia.com/">
    <img src="https://www.jahia.com/files/live/sites/jahiacom/files/logo-jahia-2016.png" alt="Jahia logo" title="Jahia" align="right" height="60" />
</a>

Jahia Search UI Connector
======================

<!--
    TEST A one-liner about the project, like a subtitle. For example: Jahia Digital Experience Manager Core
-->
<p align="center">A connector based on <a href="https://github.com/elastic/search-ui/tree/master/packages/search-ui-site-search-connector">Search UI Site Search Connector</a> by <a href="https://elastic.co">Elastic</a></p>

<!--
    A short technical description (not more than one paragraph) about the project, eventually with tech/tools/framework used.
-->
<p align="center">This connector aims at providing a compatibility layer between Jahia GraphQL API and Elastic Search-ui react components.</p>

![screenshot](./img/sandbox.jpg)

## Installation
In order to use Search UI Jahia Connector, you simply need to add the `"@jahia/search-ui-jahia-connector": "^1.0.0"` package to the list of dependencies in your package.json

Then import the relevant components (described in detail below) in your app

## Usage
Interfacing with Jahia's GraphQL Search API is done by instantiating the
JahiaSearchAPIConnector object.

The following functionality is currently implemented:
* onSearch
* onAutocomplete
* Sort

#### Options
The following configuration is required in order for the custom request/response adaptors to work

| Param     | Type                | Description                                                                                                            |
| --------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **apiToken***   | <code>string</code> | [Jahia GraphQL API token](https://academy.jahia.com/documentation/developer/dx/7.3/headless-development-with-dx/headless-react-graphql-app-tutorial#Setting_up_authorization) |
| **baseURL***   | <code>string</code> | URL for Jahia server |
| **siteKey***   | <code>string</code> | Identifies which site search will be performed in |
| **language***  | <code>string</code> | The language in which to perform the search |
| **workspace*** | <code>string</code> | Specifies which workspace to perform search in `LIVE` or `DEFAULT` |
| **nodeType***  | <code>string</code> | Indexed document type to filter by (defaults to `jnt:page`) |


#### Result Field Configuration

Fields in result set are determined by a list of instantiated `Field` object

| Param     | Type                | Description                                                                                                            |
| --------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **type***   | <code>FieldType</code> | The type of field to return from search |
| **name***  | <code>string</code> | The JCR property name to retrieve |
| **alias** | <code>string</code> | Alternate name to be used in response |
| **useSnippet**  | <code>string</code> | Field rendering type; snippet (HTML) or raw (Plain text) |

## Example

By following the guidelines below, you will be able to use JahiaSearchAPIConnector in your Search UI app.
![example_results](./img/example_results.png)

Import the require classes to be used in Search UI's SearchProvider
```javascript
import JahiaSearchAPIConnector, {Field, FieldType} from '@jahia/search-ui-jahia-connector';
...
```
Instantiate the connector by providing the configuration of your server and search results.

Note* for testing purposes we will provide a fake string for apiToken. See connection options for how to generate the token.
```javascript
let connector = new JahiaSearchAPIConnector({
        apiToken: 'none',
        baseURL: 'http://localhost:8080',
        siteKey: 'digitall',
        language: 'en',
        workspace: 'LIVE',
        nodeType: 'jnt:page'
    });
```

Instantiate a list of fields to be returned from the search query
```javascript
let fields = [
    new Field(FieldType.HIT, 'link'),
    new Field(FieldType.HIT, 'displayableName', 'title'),
    new Field(FieldType.HIT, 'excerpt', null, true),
    new Field(FieldType.NODE, 'jcr:created', 'created')
    ...
];
```
Define the configuration object for Search UI's `SearchProvider` components
```javascript
let config = {
        searchQuery: {
            //Set defined fields for search query
            result_fields: fields
        },
        autocompleteQuery: {
            results: {
                resultsPerPage: 10,
                //Set defined fields for autocomplete query
                result_fields: fields
            }
        },
        //Set the JahiaSearchAPIConnector connector that was defined above
        apiConnector: connector,
        hasA11yNotifications: true
    }
```
At this point you should have all bricks necessary to successfully use Jahia's Search UI Connector.
