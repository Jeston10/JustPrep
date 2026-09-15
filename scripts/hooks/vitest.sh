#!/usr/bin/env sh
# Pre-push unit tests. vitest is added in P0.5; this guard is removed in that PR.
if [ -x node_modules/.bin/vitest ]; then
  exec node_modules/.bin/vitest run --passWithNoTests
fi
echo "vitest not installed yet (added in P0.5); skipped"
