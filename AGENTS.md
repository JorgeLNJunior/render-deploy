# Agent Guide for render-deploy

This repository contains a GitHub Action implemented in TypeScript (ESM) to trigger and monitor deployments on Render, with optional GitHub Deployments integration. This guide sets conventions and commands for agentic coding agents operating here. The scope of this AGENTS.md is the repository root and all subdirectories.

## Quick Reference
- Node: `>=20`
- Package manager: `npm`
- Module type: ESM (`"type": "module"`)
- Source: `src/**`, Tests: `tests/**`, Build output: `lib/**`, Bundle: `dist/**`
- Lint: ESLint v9 (flat config), plugin `simple-import-sort`
- Formatter: Prettier (`.prettierrc.json`)
- Test runner: Vitest v4

## Build, Lint, Test
- Install dependencies: `npm install`
- Build TypeScript: `npm run build`
- Lint all files: `npm run lint`
- Bundle action (ncc): `npm run package`
- Full pipeline: `npm run all`
- Run tests (CI mode): `npm test`
- Run tests with coverage: `npm run test:cov`
- Test UI/watch: `npm run test:watch`

### Running a Single Test
Vitest looks in `tests/`. Use one of:
- By filename: `npx vitest run tests/action.test.ts`
- By pattern: `npx vitest run -t "should trigger a deploy"`
- Filter suite: `npx vitest run -t "Deploy"`
- With UI during dev: `npx vitest --ui` then filter in the UI.

### Test Config
- Config file: `vitest.config.ts`
- Important options:
  - `test.dir = "tests"`
  - `clearMocks = true`
  - `coverage.include = ["src/**"]`
  - `coverage.exclude = ["src/main.ts"]`
  - `testTimeout = 25000`

## Git Hooks and Commit Messages
- Husky pre-commit: runs `lint-staged` which executes `eslint --cache --fix` on staged `*.{ts,js}`
- Husky commit-msg: runs Commitlint against Conventional Commits (`@commitlint/config-conventional`)
- Do not bypass hooks unless explicitly requested.
- Write commit messages following Conventional Commits (e.g., `feat: ...`, `fix: ...`).

## ESLint Guidelines
Config: `eslint.config.js` (flat config)
- Base configs: `@eslint/js` recommended, `typescript-eslint` recommended + stylistic
- Plugins: `eslint-plugin-simple-import-sort`
- Rules enforced:
  - `simple-import-sort/imports`: `error`
  - `simple-import-sort/exports`: `error`
- Ignored paths: `dist`, `lib`

When adding rules or files, keep flat config style consistent. Prefer minimal, targeted changes.

## Prettier Formatting
Prettier settings from `.prettierrc.json`:
- `tabWidth: 2`
- `semi: false`
- `singleQuote: true`

Run Prettier implicitly via editors; for CI consistency rely on `lint-staged` + ESLint. Keep formatting aligned with these settings.

## TypeScript Settings
- `tsconfig.json`:
  - `target: ES2022`
  - `module: NodeNext`, `moduleResolution: nodenext`
  - `lib: ["ES2022"]`
  - `strict: true`, `strictNullChecks: true`, `noImplicitAny: true`
  - `esModuleInterop: true`
  - `removeComments: true`
  - `outDir: lib`
- `tsconfig.build.json` extends `tsconfig.json` and includes `src`, excludes `tests`, `dist`.

## Imports and Module Style
- ESM everywhere. Use explicit `.js` extensions when importing local TS-compiled modules (e.g., `import X from './file.js'`).
- Group and sort imports using `simple-import-sort`:
  - External packages first
  - Internal aliases/relative paths next
  - Keep side-effect imports separated
- Avoid default-exporting objects unless class/primary entry. Current pattern uses default class export for `Action` and named exports for services and enums.

## Naming Conventions
- Files: kebab-case for non-TypeScript configs; TypeScript files use kebab-case as seen (`render.service.ts`). Keep existing pattern.
- Types/Interfaces/Enums: PascalCase (`RenderService`, `RenderDeployStatus`).
- Functions/Methods/Variables: camelCase (`triggerDeploy`, `latestDeployCreatedAfter`).
- Constants: UPPER_CASE for simple constants; Enums preferred for grouped constants (see `Seconds` in `wait.helper.ts`).
- Booleans: prefix with verbs (`is`, `has`, `should`, `can`) where natural.

## Error Handling
- Axios errors: check with `isAxiosError` and branch on `error.response?.status`. Map to `RenderErrorResponse` for user-friendly messages.
- Unknown errors: if `error instanceof Error`, use `error.message`; otherwise fall back to a generic failure.
- In the GitHub Action context, use `@actions/core`:
  - `core.setFailed(message)` to mark the step as failed
  - `core.error(...)` to log error details (do not leak secrets)
  - Use `core.setSecret(...)` for sensitive values
- When throwing errors inside services, include status codes and concise context, but avoid logging raw response bodies that might contain secrets.

## Logging and Diagnostics
- Prefer `core.debug` for verbose traces and `core.info` for status updates visible in logs.
- Keep logs concise; avoid high-frequency logging inside tight loops.
- Mask sensitive fields via `core.setSecret`.

## Testing Conventions
- Tests live under `tests/**` and use Vitest (`describe`, `test`, `expect`, `vi`).
- Mock asynchronous waits with `vi.spyOn(WaitHelper, 'wait').mockResolvedValue()` to avoid time costs.
- Stub external calls (Axios/Octokit) via spies and provide deterministic responses.
- Validate side effects on `@actions/core` (e.g., `setFailed`, `info`, `debug`).
- Use environment variables `INPUT_*`, `GITHUB_*` to simulate the GitHub Actions runtime.

## Project Structure
- `src/action.ts`: Orchestrates inputs, Render deploy trigger, optional GitHub deployment, waiting logic, and final statuses.
- `src/render.service.ts`: Wraps Render API; trigger deploy, check status, resolve service URL, custom domains, and error message mapping.
- `src/github.service.ts`: Wraps Octokit for deployments and statuses.
- `src/helpers/wait.helper.ts`: Lightweight wait helper and a `Seconds` enum.
- `tests/**`: Comprehensive tests for inputs, deploy flows, error handling, and GitHub deployment status updates.

## CI and Releases
- CI workflows: `.github/workflows/*.yml` (see `ci.yml`, `pull_request.yml`, `release.yml`, `codeql-analysis.yml`).
- Release: `npm run release` uses `release-it` with conventional changelog; do not modify release config unless requested.

## Cursor / Copilot Rules
- No Cursor rules directories (`.cursor/rules/`, `.cursorrules`) were found.
- No Copilot instructions file at `.github/copilot-instructions.md` was found.
- If such files are added later, agents must incorporate those instructions into their behavior and update this AGENTS.md accordingly.

## Agent Operating Principles
- Be surgical: follow existing patterns and keep changes minimal.
- Do not add license headers or new config frameworks unless asked.
- Respect ESM: avoid CommonJS `require`/`module.exports`.
- Prefer editing existing files; avoid creating new ones unless necessary.
- Keep code deterministic and testable; mock external calls in tests.
- Validate with local commands before proposing commits.

## Common Commands
- `npm install` — install dependencies
- `npm run build` — compile TS to `lib`
- `npm run lint` — lint and sort imports
- `npm run package` — bundle to `dist` via ncc
- `npm test` — run vitest (CI mode)
- `npm run test:cov` — run tests with coverage
- `npx vitest run tests/action.test.ts` — run a single file
- `npx vitest run -t "<name>"` — run tests matching name

## Notes for Agents
- Avoid leaking secrets in logs. Use `core.setSecret` for any inputs.
- When touching imports, ensure `.js` extensions on local ESM paths (compiled TS emits `.js`).
- Maintain enums and mapped error responses as single sources of truth. Reuse `RenderErrorResponse` and `RenderDeployStatus` rather than duplicating literals.
- Update documentation only when necessary; keep README examples in sync with action inputs.
