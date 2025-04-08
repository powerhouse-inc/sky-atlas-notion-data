# Sky Atlas Notion Data

A tool for fetching and processing Sky Atlas data from Notion, converting it into a structured tree representation, and optionally committing it to GitHub and posting it to an import API.

## Overview

This project fetches data from Notion pages, processes it, and creates a structured tree representation. It can also commit the generated tree to GitHub and post it to an import API.

## Installation

To install dependencies:

```bash
bun install
```

## Environment Setup

Create a `.env` file based on the `.env.example` template with the following variables:

```
API_KEY="your-notion-api-key"
IMPORT_API_KEY="your-import-api-key"
GITHUB_TOKEN="your-github-token"
IMPORT_API_URL="your-import-api-url"
SKIP_IMPORT_API="true"
SKIP_GITHUB_SNAPSHOT="true"
USE_LOCAL_DATA="false"
```

## Usage

### Running the Make Tree Script

The main script for generating the tree structure is `make-tree.ts`. You can run it using:

```bash
bun run make-tree
```

#### Command Line Options

```
make-tree [options]

Options:
  --outputPath <path>       Specify the output directory for generated files (default: "data")
  --useLocalData            Use locally cached data instead of fetching from Notion
                            Note: This option only works if you have already run the script at least once
                            to fetch and cache the Notion data. For development to avoid repeated fetches.
  --skipImportApi           Skip posting the generated tree to the import API
  --skipGithubSnapshot      Skip committing the generated tree to GitHub
  --help                    Display this help message
```

#### Environment Variables

- `API_KEY`: Notion API key
- `GITHUB_TOKEN`: GitHub token for committing snapshots
- `IMPORT_API_URL`: URL for the import API
- `IMPORT_API_KEY`: API key for the import API
- `USE_LOCAL_DATA`: Set to "true" to use locally cached data (requires previous fetch)
- `SKIP_IMPORT_API`: Set to "true" to skip posting to import API
- `SKIP_GITHUB_SNAPSHOT`: Set to "true" to skip committing to GitHub

### Running the Make Simplified Tree Script

You can also generate a simplified text representation of the tree:

```bash
bun run make-simplified-tree
```

## Output Files

The script generates the following output files:

- `data/notion-pages/`: Raw Notion page data
- `data/processed/`: Processed Notion page data
- `data/parsed/`: Parsed data ready for tree generation
- `data/view-node-tree.json`: Generated tree structure
- `data/view-node-map.json`: Map of nodes in the tree
- `data/slug-lookup.json`: Mapping of IDs to slugs

### Data Structure Explanation

The project generates several data structures that serve different purposes:

1. **View Node Tree**: This is the simplified hierarchical representation of the data. It represents the structure of the Sky Atlas as a tree, with parent-child relationships between nodes.

2. **View Node Map**: This is a flattened representation of the tree, where each node is indexed by its ID. It contains redundant data compared to the tree structure because it's used in the Atlas Next.js app to prerender open routes to nodes. The map format allows for quick lookups by ID without having to traverse the tree.

3. **Processing Flow**:
   - The raw Notion data is first processed to extract basic information and establish the structure.
   - Items in the Atlas are numbered during this initial processing.
   - The view node content is then processed, which may contain links to other items in the Atlas.
   - These links must use the name and numbering generated during the first parse of the Notion data.
   - This two-step process ensures that references between items are consistent and correctly numbered.

4. **Notion UUIDs and Slugs**:
   - Notion uses UUIDs (Universally Unique Identifiers) for all its items.
   - The slug lookup mechanism is created by adding a suffix which is part of the item's parent UUID.
   - This approach is necessary because items can have multiple parents in the Notion structure.
   - The slug lookup allows for unique links to every item, enabling the same item to have multiple locations and links with different suffixes.
   - When a user lands on a specific item in the tree, the slug lookup is used to find the correct instance based on the suffix.
   - This data is redundant and can be ignored outside of the website context.

5. **Simplified Tree**:
   - The simplified tree is a human-readable text representation of the tree structure.
   - It's particularly useful for reviewing changes in GitHub diffs.
   - Every time the project is built, a snapshot of the data is committed to GitHub.
   - The JSON format of the tree and map makes it difficult to see meaningful changes in git diffs.
   - The simplified tree provides a more readable format that makes it easier to spot structural changes, additions, and removals in the Atlas.

The view node map contains more data than the tree because it needs to support direct access to any node in the structure for the Next.js app's prerendering functionality, while the tree focuses on representing the hierarchical relationships.

## Development

This project was created using `bun init` in bun v1.1.0. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

### Project Structure

- `src/`: Source code
  - `constants.ts`: Constants used throughout the application
  - `fetching.ts`: Functions for fetching data from Notion
  - `make-view-node-inputs.ts`: Functions for creating view node inputs
  - `make-view-node-tree.ts`: Functions for creating the view node tree
  - `processors.ts`: Functions for processing Notion data
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions
  - `page-properties/`: Functions for handling Notion page properties
- `scripts/`: Executable scripts
  - `make-tree.ts`: Main script for generating the tree structure
  - `make-simplified-tree.ts`: Script for generating a simplified text representation

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
