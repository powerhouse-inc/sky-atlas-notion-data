# Sky Atlas Notion Data

A tool for fetching and processing Sky Atlas data from Notion, converting it into a structured tree representation, and optionally committing it to GitHub and posting it to an import API.

## Overview

This project fetches data from Notion pages, processes it, and creates a structured tree representation. The data transformation pipeline:

1. Fetches raw data from Notion using the Notion API
2. Processes the raw data into a structured format
3. Creates a tree of ViewNodes that represent the Sky Atlas structure
4. Optionally commits the data to GitHub and posts to an import API

### Data Transformation Stages

1. **Notion Data Fetching**
   - Fetches raw data from Notion pages
   - Stores in `data/notion-pages/` directory
   - Preserves Notion's original structure and relationships

2. **Initial Processing**
   - Converts Notion's block-based structure into a simpler format
   - Processes page properties and relationships
   - Stores in `data/processed/` directory
   - Maintains parent-child relationships from Notion

3. **Data Parsing**
   - Creates a unified data structure from processed pages
   - Uses `make-notion-data-by-id.ts` to combine Hub and Atlas page data
   - Creates a map of all items by their ID for quick lookups
   - Stores in `data/parsed/` directory
   - Prepares data for tree generation

4. **Tree Generation**
   - Creates the View Node Tree structure
   - Applies numbering system
   - Generates View Node Map for quick lookups
   - Produces simplified text representation

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

### Available Scripts

#### make-atlas-data.ts
The main script for generating the tree structure. This script:
- Fetches data from Notion
- Processes it into a structured format
- Creates the view node tree and map
- Optionally commits to GitHub and posts to import API

```bash
bun run make-atlas-data [options]
```

Options:
- `--outputPath <path>`: Specify output directory (default: "data")
- `--useLocalData`: Use locally cached data instead of fetching from Notion
- `--skipImportApi`: Skip posting to import API
- `--skipGithubSnapshot`: Skip committing to GitHub
- `--help`: Display help message

For development, you can use the `make-atlas-data-dev` script which automatically sets development-friendly options:
```bash
bun run make-atlas-data-dev
```

#### fetch-latest-atlas-data.ts
Fetches already processed Atlas data from the server instead of processing raw Notion data. Useful for development to avoid repeated fetches.

```bash
bun run fetch-latest-atlas-data [options]
```

Options:
- `--atlasDataUrl <url>`: URL to fetch atlas data from
- `--outputPath <path>`: Path to write output files
- `--help`: Show help message

#### diff-atlas-data.ts
Compares two atlas data files and generates diffs in multiple formats to help identify changes:

```bash
bun run diff-atlas-data [options]
```

Options:
- `--baseDataPath <path>`: Path to base data file
- `--newDataPath <path>`: Path to new data file
- `--outputPath <path>`: Path to save diff files
- `--help`: Display help message

The script generates three types of diffs to help identify changes:

1. **Raw JSON Diff**
   - Direct comparison of the JSON files
   - Shows structural changes in the data
   - Can be noisy due to JSON key ordering differences

2. **Simplified Text Diff**
   - Converts the data to a human-readable text format
   - Each node is represented as a block of text with its properties
   - Makes it easier to see content changes
   - Preserves the hierarchical structure

3. **Sorted Simplified Diff**
   - Same as the simplified text diff but with all lines sorted
   - Helps identify when the same data appears in a different order
   - Useful for detecting when only JSON key ordering has changed
   - Makes it easier to spot actual content changes vs. structural changes

Example output files:
```
<timestamp>-raw.diff           # Raw JSON comparison
<timestamp>-simplified.diff    # Human-readable text comparison
<timestamp>-simplified-sorted.diff  # Sorted text comparison
```

### Data Structure Explanation

The project transforms Notion data into several interconnected data structures:

1. **View Node Tree (Atlas Data)**
   - This is the primary data structure representing the Sky Atlas
   - Stored in `atlas-data.json` (also available as `view-node-tree.json` for legacy compatibility)
   - Hierarchical representation with Scopes (type: SCOPE) as root nodes
   - Each node can have subDocuments (children)
   - Contains processed content with correct numbering
   - Used for navigation and display in the Atlas Explorer
   - Represents the complete structure of the Atlas

2. **View Node Map**
   - A transformed version of the same data optimized for quick lookups
   - Stored in `view-node-map.json`
   - Takes the view node tree and flattens it into a map where:
     - Keys are the node's slug suffix (e.g., "node-id|parent-suffix")
     - Values are the complete node objects
   - Used by the Next.js app for prerendering and quick node lookups
   - Contains the same data as the tree, just organized differently
   - Enables direct access to any node without tree traversal
   - Makes it easy to find nodes by their URL path

3. **Processing Flow**
   - Raw Notion data is fetched and stored in `notion-pages/`
   - Data is processed into a structured format in `processed/`
   - Processed data is parsed into `parsed/`
   - Final tree structure is generated and stored in `atlas-data.json`

4. **Node Types**
   - SCOPE: Top-level nodes in the Atlas
   - ARTICLE: Main content nodes
   - SECTION: Content sections within articles
   - CATEGORY: Grouping nodes with special numbering
   - ANNOTATION: Supporting documentation
   - And more (see constants.ts for full list)

5. **Numbering System**
   The Sky Atlas uses a sophisticated numbering system to create unique identifiers for each node in the tree. Here's how it works:

   1. **Basic Structure**
      - Each node has a `formalId` consisting of a `prefix` and `numberPath`
      - The prefix is typically "A" for the first scope
      - The numberPath is an array of numbers/strings representing the node's position in the hierarchy

   2. **Numbering Rules**
      - **Scopes**: Use their index in the sorted scope list as their numberPath (e.g., [0], [1], [2])
      - **Regular Nodes**: Inherit parent's numberPath and append their counter value
      - **Categories**: Special handling where children are flattened into the parent's numbering
      - **Agent Artifacts**: Use "AG" prefix with index (e.g., "A.AG1", "A.AG2")
      - **Sky Primitives**: Use "P" prefix with counter (e.g., "A.P1", "A.P2")
      - **Support Documents**: Don't receive numbers in the path

   3. **Key Functions**
      - `makeSortedByNumberOrDocNo`: Sorts items by explicit number or document number
      - `updateCounter`: Manages counter increments based on node type
      - `flattenedCategoryChildren`: Calculates total children for category numbering
      - `makeViewNodeAtlasId`: Creates the final Atlas ID (e.g., "A.1.2.3")

   4. **Special Cases**
      - Categories remove their parent's last number from the path
      - Agent Artifacts reset their parent's path and use their own numbering
      - Support document types don't affect the numbering sequence
      - Sky Primitives use a global counter for unique "P" numbers

   5. **Example Numbering**
      ```
     See existing tree and https://www.notion.so/atlas-axis/7b5370146f1e448897b189299222e206?v=e21c5c37020f4935a58d45b750d9bd1e&pvs=4
      ```

6. **Hub and Relationships**
   - The Hub is a special Notion page that defines relationships between Atlas pages
   - Used to establish parent-child relationships that aren't explicit in Notion
   - Helps maintain the correct structure when pages can have multiple parents
   - Ensures consistent navigation paths in the Atlas

7. **Simplified Tree Format**
   - Human-readable text representation of the tree
   - Each node is represented as a block of text with:
     - Node ID
     - Formal ID and title
     - Content
     - Hub URLs
     - Sub-document IDs
     - Supporting document IDs
   - Used for:
     - Reviewing changes in GitHub diffs
     - Understanding the structure without parsing JSON
     - Spotting structural changes more easily
   - Generated alongside the JSON files for convenience

### Output Files

The scripts generate several output files:

- `data/notion-pages/`: Raw Notion page data
- `data/processed/`: Processed Notion page data
- `data/parsed/`: Parsed data ready for tree generation
- `data/atlas-data.json`: Generated tree structure
- `data/view-node-map.json`: Map of nodes in the tree
- `data/simplified-atlas-tree.txt`: Human-readable tree representation
- `data/view-node-tree.json`: Same as `atlas-data.json`, for legacy use

## Development

This project was created using `bun init` in bun v1.1.0. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

### Project Structure

- `src/`: Source code
  - `constants.ts`: Constants used throughout the application
  - `fetching.ts`: Functions for fetching data from Notion
  - `make-notion-data-by-id.ts`: Functions for creating a unified data structure from processed pages
  - `make-view-node-tree.ts`: Functions for creating the view node tree
  - `processors.ts`: Functions for processing Notion data
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions
  - `page-properties/`: Functions for handling Notion page properties
- `scripts/`: Executable scripts
  - `make-atlas-data.ts`: Main script for generating the tree structure
  - `fetch-latest-atlas-data.ts`: Script for fetching processed data
  - `diff-atlas-data.ts`: Script for comparing atlas data files
  - `make-simplified-atlas-data.ts`: Script for generating simplified text representation
  - `handleEnv.ts`: Environment variable handling
  - `utils.ts`: Script utility functions

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).