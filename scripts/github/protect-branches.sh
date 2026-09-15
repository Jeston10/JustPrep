#!/usr/bin/env sh
# Applies the branch protection described in PROCESS.md to main and dev.
# Requires: GitHub CLI authenticated with repo admin scope (`gh auth login`).
# Usage: sh scripts/github/protect-branches.sh [owner/repo]
set -eu

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

# Job names from .github/workflows/ci.yml and promote-guard.yml (required status checks).
CHECKS='"Lint · Typecheck · Secrets","Unit · Integration","Build · Audit · Size","Check source branch"'

protect() {
  branch="$1"; linear="$2"
  echo "Protecting $REPO:$branch"
  gh api -X PUT "repos/$REPO/branches/$branch/protection" \
    -H "Accept: application/vnd.github+json" \
    --input - <<JSON
{
  "required_status_checks": { "strict": true, "contexts": [${CHECKS}] },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "required_linear_history": ${linear},
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
}

protect main true
protect dev false
echo "Done. Verify under Settings → Branches."
