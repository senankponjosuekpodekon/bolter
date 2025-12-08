# CI/CD Documentation

## Overview

Bolter uses a comprehensive CI/CD pipeline powered by GitHub Actions to ensure code quality, security, and reliability.

## Pipeline Stages

### 1. **Code Quality** (`lint-and-format`)

- ESLint: JavaScript/TypeScript linting
- Prettier: Code formatting
- Max warnings: 0

**Status**: ✅ Required for all PRs

### 2. **Backend Tests** (`backend-tests`)

- Jest unit tests for NestJS server
- Database tests with PostgreSQL
- Coverage reporting to Codecov

**Status**: ✅ Required for all PRs

### 3. **Frontend Tests** (`frontend-tests`)

- Jest unit tests for React Client
- Vitest for Vite-based apps
- Coverage reporting to Codecov

**Status**: ✅ Required for all PRs

### 4. **Build Validation** (`build-validation`)

- Builds all 3 workspaces:
  - `client` (Vite + React)
  - `admin` (Vite + React)
  - `server` (NestJS)

**Status**: ✅ Required for all PRs

### 5. **E2E Tests** (`e2e-tests`)

- Playwright E2E tests
- Runs after unit tests pass
- Artifact: Playwright report

**Status**: ⚠️ Optional (can fail without blocking)

### 6. **Security Scanning** (`security-scan`)

- npm audit
- Snyk vulnerability scan (if token configured)
- OWASP Dependency Check

**Status**: ⚠️ Optional (informational)

### 7. **Final Status** (`status-check`)

- Aggregates all job results
- Comments on PRs with summary

**Status**: ✅ Required

---

## Running Locally

### Lint & Format

```bash
# Lint all apps
npm run lint

# Format all files
npx prettier --write "apps/**/*.{ts,tsx,js,jsx,json}" "src/**/*.{ts,js}"
```

### Run Tests

```bash
# Backend tests
npm --workspace=server run test

# Frontend tests
npm --workspace=client run test

# E2E tests
npm --workspace=client run e2e
```

### Build All Workspaces

```bash
npm run build
```

---

## Pre-Commit Hooks

Husky is configured to run before commits, pushes, and message validation.

### Installation

```bash
bash scripts/setup-husky.sh
```

### Available Hooks

#### Pre-Commit Hook

Runs on `git commit`:

- ESLint with auto-fix
- Prettier formatting
- Staged tests
- Secret detection

#### Commit-Msg Hook

Validates commit message format using **Conventional Commits**:

- ✅ `feat(auth): add 2FA support`
- ✅ `fix(kyc): resolve upload issue`
- ✅ `docs: update README`
- ❌ `updated stuff`

#### Pre-Push Hook

Runs before `git push`:

- Full test suite
- Build validation

### Bypass Hooks (Not Recommended)

```bash
git commit --no-verify          # Skips all hooks
git push --no-verify            # Skips pre-push hook
```

---

## Conventional Commits Format

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature change
- **perf**: Performance optimization
- **test**: Adding or updating tests
- **chore**: Build, dependencies, tooling

### Examples

```bash
git commit -m "feat(2fa): add TOTP backup codes"
git commit -m "fix(kyc): resolve file upload timeout"
git commit -m "docs: add CI/CD documentation"
git commit -m "refactor(auth): simplify token validation"
```

---

## Test Coverage

### Coverage Thresholds

- **Lines**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Statements**: 70%

### View Coverage Reports

```bash
# Generate coverage
npm run test:coverage

# View HTML report
open apps/server/coverage/index.html
open apps/client/coverage/index.html
```

### Codecov Integration

Coverage reports are automatically uploaded to Codecov.com when tests pass.

---

## Security Scanning

### npm Audit

```bash
npm audit
npm audit --fix
```

### Snyk

Configure GitHub secret `SNYK_TOKEN` to enable Snyk scanning.

```bash
npx snyk auth
npx snyk test
```

### Dependency Check

```bash
docker run -it --rm -v "$(pwd)":/src owasp/dependency-check:latest \
  --scan /src --format JSON
```

---

## Troubleshooting

### "ESLint errors preventing commit"

```bash
npm run lint --fix
```

### "Tests failing locally but passing in CI"

- Clear node_modules: `rm -rf node_modules && npm ci`
- Check Node version: `node --version` (should be 20+)
- Check environment variables: Ensure `.env` file exists

### "Pre-commit hook not running"

```bash
# Reinstall husky
npm install husky --save-dev
npx husky install
```

### "Can't push due to pre-push hook"

```bash
# Run tests locally first
npm run test

# Or bypass (temporary)
git push --no-verify
```

---

## GitHub Secrets Configuration

Required for full CI/CD functionality:

| Secret          | Purpose                     | How to Set                                            |
| --------------- | --------------------------- | ----------------------------------------------------- |
| `SNYK_TOKEN`    | Snyk vulnerability scanning | [Snyk Account](https://app.snyk.io/account/api-token) |
| `CODECOV_TOKEN` | Codecov coverage reports    | [Codecov Setup](https://codecov.io)                   |

Add via: Settings > Secrets and Variables > Actions > New Repository Secret

---

## Status Badges

Add to README:

```markdown
[![CI/CD Pipeline](https://github.com/YOUR_OWNER/bolter/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/YOUR_OWNER/bolter/actions)
[![codecov](https://codecov.io/gh/YOUR_OWNER/bolter/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_OWNER/bolter)
```

---

## Future Improvements

- [ ] Docker image builds
- [ ] Automated semantic versioning
- [ ] Changelog auto-generation
- [ ] Container registry push
- [ ] Performance benchmarking
- [ ] Type coverage tracking
- [ ] Bundle size monitoring

---

**Last Updated**: December 5, 2025  
**Maintained By**: Development Team
