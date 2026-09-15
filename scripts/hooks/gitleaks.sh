#!/usr/bin/env sh
# Pre-commit secret scan. gitleaks is a Go binary (winget/scoop/brew), not an npm package.
# CI runs gitleaks-action on every push regardless of local installation (docs/SECURITY.md §2.12).
if command -v gitleaks >/dev/null 2>&1; then
  exec gitleaks protect --staged --redact --verbose
fi
echo "gitleaks not installed locally; skipped (enforced in CI)"
