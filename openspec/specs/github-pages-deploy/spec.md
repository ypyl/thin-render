## Purpose
The demo is built with a Vite base path so all built assets resolve correctly under GitHub Pages.

## Requirements

### Requirement: Demo builds with GitHub Pages base path
The demo Vite config SHALL set `base` to `'/thin-render/'` so that all built asset paths are absolute and resolve correctly when served from `https://<user>.github.io/thin-render/`.

#### Scenario: Built assets use absolute paths
- **WHEN** the demo is built with `npm run build`
- **THEN** `dist/index.html` contains `<script src="/thin-render/assets/...">` (absolute path with base prefix)
- **AND** all CSS, JS, and image references use the base prefix

#### Scenario: Local dev is unaffected
- **WHEN** the dev server is started with `npm run dev`
- **THEN** the demo loads at `http://localhost:5173/` with correct routing
- **AND** no `/thin-render/` prefix is required in the URL

### Requirement: wouter router strips the GitHub Pages base path
The wouter `Router` component in `App.tsx` SHALL set `base` to `"/thin-render"` so that client-side routes match the path after the repository name prefix.

#### Scenario: Route matching strips base prefix
- **WHEN** the browser is at `https://<user>.github.io/thin-render/large`
- **THEN** wouter matches the `/large` route and renders `LargeCase`
- **AND** `Link` components generate correct hrefs under `/thin-render/`

#### Scenario: Root route works
- **WHEN** the browser is at `https://<user>.github.io/thin-render/`
- **THEN** wouter matches the `/` route and renders `HomePage`

### Requirement: GitHub Pages serves SPA for unknown routes via 404.html
The GitHub Actions deploy workflow SHALL copy `dist/index.html` to `dist/404.html` so that GitHub Pages serves the SPA for any route that doesn't correspond to a static file.

#### Scenario: Direct navigation to a sub-route works
- **WHEN** a user navigates directly to `https://<user>.github.io/thin-render/table`
- **THEN** the SPA boots and renders the Table case (not a 404 page)

### Requirement: GitHub Actions deploys demo to GitHub Pages on push to master
A GitHub Actions workflow at `.github/workflows/deploy.yml` SHALL build the demo and deploy it to GitHub Pages on every push to the master branch. Deployment SHALL use the official `actions/deploy-pages` action.

#### Scenario: Push to master triggers deploy
- **WHEN** a commit is pushed to the master branch
- **THEN** the workflow builds the demo and deploys to GitHub Pages
- **AND** the live demo updates within a few minutes
