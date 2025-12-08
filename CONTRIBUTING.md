# Contributing to Bolter Banking Platform

Thank you for your interest in contributing to Bolter! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions. We're building a welcoming community.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Git
- PostgreSQL (for local development)

### Setup Development Environment

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_ORG/bolter.git
   cd bolter
   ```

2. **Install dependencies**

   ```bash
   npm ci
   ```

3. **Setup Husky pre-commit hooks**

   ```bash
   bash scripts/setup-husky.sh
   ```

4. **Create environment files**

   ```bash
   cp .env.example .env
   # Update .env with your local settings
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

## Development Workflow

### 1. Create a Branch

Use descriptive branch names following the pattern: `<type>/<feature-name>`

```bash
git checkout -b feat/kyc-document-storage
git checkout -b fix/login-form-validation
git checkout -b docs/api-endpoints
```

### 2. Make Changes

- Write clean, readable code
- Follow the project's coding standards
- Add tests for new features
- Update documentation as needed

### 3. Commit Your Work

We follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
git commit -m "feat(kyc): add document storage integration"
git commit -m "fix(auth): resolve 2FA timeout issue"
git commit -m "docs(api): update endpoint documentation"
```

**Valid commit types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code formatting
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Build, dependencies

**Examples of good commit messages:**

```
feat(admin): add audit log export functionality
fix(kyc): resolve file upload size limit issue
docs(setup): add CI/CD configuration guide
refactor(auth): simplify token validation logic
```

### 4. Push and Create Pull Request

```bash
git push origin feat/kyc-document-storage
```

Then:

1. Open GitHub and create a Pull Request
2. Fill in the PR template
3. Link related issues
4. Wait for CI/CD checks to pass
5. Request review from maintainers

## Testing

### Run Tests Locally

```bash
# All tests
npm run test

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch

# E2E tests
npm run e2e
```

### Test Requirements

- New features must include unit tests
- Bug fixes should include regression tests
- Maintain or improve code coverage (target: 70%+)
- All tests must pass before merging

### Writing Tests

**Backend (NestJS with Jest):**

```typescript
describe("AuthService", () => {
  it("should verify valid TOTP token", async () => {
    const result = await authService.verifyTwoFactor(userId, token);
    expect(result).toBe(true);
  });
});
```

**Frontend (React with Vitest):**

```typescript
describe('LoginForm', () => {
  it('should validate email format', () => {
    render(<LoginForm />);
    const input = screen.getByPlaceholderText(/email/i);
    fireEvent.change(input, { target: { value: 'invalid' } });
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

## Code Quality

### Linting

```bash
# Check lint issues
npm run lint

# Auto-fix lint issues
npm run lint:fix
```

### Code Formatting

```bash
# Check formatting
npm run format:check

# Auto-format
npm run format
```

### Pre-Commit Hooks

Husky automatically runs:

- ESLint with auto-fix
- Prettier formatting
- Jest tests (staged files)
- Commit message validation

Hooks run automatically on `git commit`. To bypass: `git commit --no-verify` (not recommended)

## Documentation

### Types of Documentation

- **README files**: Project overviews, quick start guides
- **API docs**: Endpoint documentation, request/response examples
- **Architecture docs**: System design, decision records
- **Setup guides**: Installation, configuration instructions
- **Feature docs**: Feature-specific documentation

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep docs in sync with code
- Link to related documentation

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass locally (`npm run test`)
- [ ] Coverage maintained/improved
- [ ] Documentation updated
- [ ] Commit messages follow Conventional Commits
- [ ] No console errors or warnings

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Related Issues

Closes #123

## Testing

Describe how you tested the changes

## Screenshots (if applicable)

Add screenshots for UI changes

## Checklist

- [ ] Tests pass locally
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] No new warnings
```

## Code Review

### During Review

- Be open to feedback
- Explain your reasoning when needed
- Request clarification if feedback is unclear
- Make suggested changes or discussion points

### Common Review Comments

- "Can you extract this to a helper function?" → Improves reusability
- "This needs a test" → Ensures coverage
- "See existing pattern in [file]" → Maintains consistency
- "Consider error handling here" → Improves robustness

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Steps

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release commit: `chore(release): v1.2.3`
4. Create GitHub release with notes
5. Publish npm packages

## Project Structure

```
bolter/
├── apps/
│   ├── client/          # React user application
│   ├── admin/           # React admin dashboard
│   └── server/          # NestJS backend
├── src/                 # Root backend code
├── docs/                # Documentation
├── .github/
│   └── workflows/       # GitHub Actions CI/CD
├── scripts/             # Utility scripts
└── packages/            # Shared packages (optional)
```

## Common Tasks

### Adding a New Feature

1. Create feature branch: `git checkout -b feat/feature-name`
2. Implement feature with tests
3. Update documentation
4. Create PR with detailed description
5. Request review

### Fixing a Bug

1. Create issue describing the bug (if not exists)
2. Create fix branch: `git checkout -b fix/bug-name`
3. Implement fix with regression test
4. Reference issue in commit/PR
5. Request review

### Updating Documentation

1. Create branch: `git checkout -b docs/doc-name`
2. Update docs files
3. Preview locally (if applicable)
4. Create PR with explanation
5. Request review (maintainers)

## Getting Help

- **Questions about contributing**: Open a discussion
- **Bug reports**: Use GitHub Issues with detailed reproduction
- **Feature requests**: Open an issue with clear description
- **Code help**: Comment on PR or open discussion

## Recognition

Contributors are recognized in:

- `CONTRIBUTORS.md`
- GitHub contributors page
- Release notes

## License

By contributing to Bolter, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to Bolter! 🚀**

For questions, open an issue or discussion in the repository.
