#!/usr/bin/env bash
# Status step before any progress, estimate or "done" report (rule 22): quote only what this prints.
# Prints the last pushed commits, the latest CI runs with their results, and the jobs of the newest run.
set -uo pipefail
REPO=heavenfort77-cpu/Nietzsche-
cd "$(dirname "$0")/.."
echo "== pushed (origin/main)"
git fetch -q origin main 2>/dev/null
git log --oneline -3 FETCH_HEAD
echo "== local commits not pushed"
git log --oneline FETCH_HEAD..HEAD
echo "== uncommitted files"
git status --short | head -20
echo "== latest CI runs"
gh api "repos/$REPO/actions/runs?per_page=3" --jq '.workflow_runs[] | "run \(.run_number) id \(.id) \(.head_sha[0:7]) \(.status) \(.conclusion // "-")"'
echo "== jobs of the newest run"
id=$(gh api "repos/$REPO/actions/runs?per_page=1" --jq '.workflow_runs[0].id')
gh api "repos/$REPO/actions/runs/$id/jobs" --jq '.jobs[] | "\(.name | .[0:45]) \(.status) \(.conclusion // "-")"'
