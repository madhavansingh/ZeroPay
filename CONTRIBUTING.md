# Contributing to ZeroPay

Thank you for contributing! Please follow these guidelines to keep the codebase consistent.

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code. Protected — no direct pushes. |
| `develop` | Integration branch for feature work |
| `feat/*` | New features |
| `fix/*` | Bug fixes |
| `chore/*` | Dependencies, tooling, config changes |
| `docs/*` | Documentation only |

Always branch from `main` (or `develop` for larger features):

```bash
git checkout main
git pull
git checkout -b feat/your-feature-name
```

---

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style`  
**Scopes:** `backend`, `web`, `contracts`, `shared-types`, `ci`, `deps`

**Examples:**
```
feat(backend): add Zod validation to merchant onboard endpoint
fix(web): clear Zustand persisted state on logout
chore(deps): upgrade MeshJS to 1.7.0
docs(readme): update wallet compatibility table
```

---

## Before Pushing

Run these checks locally — CI will enforce them anyway:

```bash
# Type-check both backend and frontend
npm run type-check

# Lint both
npm run lint

# Build both (catches import/bundle errors)
npm run build:backend
npm run build:web
```

**All four must pass with zero errors before opening a PR.**

---

## Pull Request Process

1. Create your branch from `main`
2. Make your changes
3. Run the checks above
4. Push and open a PR against `main`
5. Fill in the PR description: what changed and why
6. Wait for CI (GitHub Actions) to go green
7. Request a review

---

## Environment Setup

Never commit `.env` files. Always use `.env.example` as the template.

For service credentials, see [README.md → Required External Services](README.md#required-external-services).

---

## Code Style

- TypeScript strict mode — no `any` without explicit justification in a comment
- No `console.log` in production code — use `logger` (pino) on the backend
- All API request bodies must have Zod validation schemas
- React components: named exports, not default where possible
- Keep components focused — extract logic to hooks, keep JSX clean
