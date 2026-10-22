# File Tree Explorer

A React application for browsing directory structures provided as JSON. It supports folder navigation, file and folder details, and search across the entire tree. A bundled 10,000-node dataset is loaded by default; you can replace it with your own JSON at any time.

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Useful commands: `npm run typecheck`, `npm test`, `npm run build`, `npm run preview`.

## Features

- Paste JSON or upload a `.json` file using the **Upload JSON** button in the header.
- Expand and collapse folders, browse file sizes, and open node details via URLs.
- Search all nodes by name. Results appear in a dropdown with full paths, without replacing the tree.
- Selecting a result reveals its ancestors and scrolls the tree to that node.
- Refresh the page without losing an imported tree, the selected path, or the search query.
- Explore the bundled demo with **10,000 nodes** and **100 nested folder levels**.
- Use **Load Demo JSON** on the home page to load the existing `src/data/demo.json` file and open the explorer, replacing the active tree.

## Input format

```json
{
  "name": "root",
  "type": "folder",
  "children": [
    { "name": "src", "type": "folder", "children": [
      { "name": "index.ts", "type": "file", "size": 1024 }
    ] },
    { "name": "package.json", "type": "file", "size": 300 }
  ]
}
```

Folders require a `children` array; files require a non-negative integer `size` in bytes. The import is validated before replacing the current tree.

## Routes

| Route | Description |
| --- | --- |
| `/` | Home page with JSON text and file input |
| `/import` | Redirects to `/` |
| `/tree` | Directory tree and root details |
| `/tree/*` | Details for a file or folder path |

The search query is stored in `?q=...`, so search results can be restored after refresh.

## Architecture

Built with **React 18, TypeScript (strict), React Router v6, Vite, TanStack Virtual, and CSS**.

JSON is validated and converted into a flat index (`Map`) for fast node lookups. Folder sizes are calculated once during indexing. Iterative tree traversal avoids recursive component nesting and supports deep structures. TanStack Virtual renders only the visible rows in the tree, search dropdown, and folder details.

The demo is stored in `src/data/demo.json` and loaded as a separate asset. User imports replace the active tree and are persisted in `localStorage`; the selected node and search query come from the URL. There is no backend or state-management library.

## Tests

Run `npm test` for unit tests covering indexing, validation, folder sizes, search, and deep trees. Run `npm run typecheck` and `npm run build` before submitting changes.

## Limitations and future improvements

- `localStorage` has browser-dependent size limits; IndexedDB would be a better option for larger persistent datasets.
- Parsing and searching run on the main thread. Very large datasets may benefit from background processing after profiling.
- Virtualized lists require further testing with screen readers.
- Production hosting needs an SPA fallback to `index.html` for direct `/tree/...` links.
