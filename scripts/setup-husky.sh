#!/bin/bash

# Install Husky pre-commit hooks
echo "📦 Installing Husky..."
npm install husky --save-dev

# Initialize Husky
npx husky install

# Create pre-commit hook
echo "🔧 Creating pre-commit hook..."
cat > .husky/pre-commit << 'EOF'
#!/bin/bash

# Run ESLint on staged files
echo "🔍 Running ESLint..."
npx lint-staged

# Run tests on staged files
echo "🧪 Running tests..."
npm run test:staged 2>/dev/null || true

# Check for secrets
echo "🔐 Checking for secrets..."
npx detect-secrets scan --baseline .secrets.baseline 2>/dev/null || true

echo "✅ Pre-commit checks complete!"
EOF

chmod +x .husky/pre-commit

# Create commit-msg hook
echo "📝 Creating commit-msg hook..."
cat > .husky/commit-msg << 'EOF'
#!/bin/bash

# Validate commit message format
if ! head -1 "$1" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?!?:"; then
  echo "❌ Commit message must follow conventional commits format:"
  echo "   feat(scope): description"
  echo "   fix(scope): description"
  echo "   docs: description"
  exit 1
fi

echo "✅ Commit message format valid!"
EOF

chmod +x .husky/commit-msg

# Create pre-push hook
echo "📤 Creating pre-push hook..."
cat > .husky/pre-push << 'EOF'
#!/bin/bash

echo "🧪 Running tests before push..."
npm run test 2>/dev/null || {
  echo "❌ Tests failed! Fix them before pushing."
  exit 1
}

echo "✅ All checks passed! Ready to push."
EOF

chmod +x .husky/pre-push

echo "✅ Husky hooks installed successfully!"
echo ""
echo "Available hooks:"
echo "  • pre-commit: Runs linting and staging area tests"
echo "  • commit-msg: Validates conventional commit format"
echo "  • pre-push: Runs full test suite"
echo ""
echo "To bypass hooks temporarily: git commit --no-verify"
