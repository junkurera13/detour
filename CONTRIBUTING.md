# Contributing

Thanks for helping improve Detour. This guide keeps changes consistent and reviewable.

**Workflow**
1. Create a branch for your change.
2. Keep changes focused and small.
3. Run `npm run lint` and `npm run test` before opening a PR.
4. Open a PR with a clear summary and screenshots for UI changes.

**Branch protection (recommended)**
- Require `CI` to pass before merging.
- Require at least 1 approving review.
- Require branches to be up to date before merge.

**Code style**
- Prefer TypeScript types for props and utilities.
- Keep components small and composable.
- Avoid nested conditional JSX where possible.
- Add minimal comments only when logic is non-obvious.

**Testing**
- New UI logic should include a basic test when feasible.
- Keep mocks in `__mocks__/` and re-use `tests/test-utils.tsx`.

**Environment**
- Never commit secrets.
- Add new env vars to `.env.example` and document them in `README.md`.
