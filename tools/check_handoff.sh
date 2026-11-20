#!/usr/bin/env bash
# CI gate (rule 2: update the handoff file at the end of each batch).
# Fails when a pushed commit whose subject starts with "Batch " does not change HANDOFF.md.
# Usage: tools/check_handoff.sh <base-sha> <head-sha>   (needs history back to base)
set -uo pipefail
base=${1:?base sha}; head=${2:?head sha}
fail=0
range="$base..$head"
if [ "$base" = "0000000000000000000000000000000000000000" ]; then range="$head"; fi
for c in $(git rev-list "$range"); do
  subj=$(git log -1 --format=%s "$c")
  case "$subj" in
    "Batch "*)
      if grep -qx "$c" "$(git rev-parse --git-dir)/shallow" 2>/dev/null; then
        echo "FAIL ${c:0:7} parent not in this clone, cannot check (run: git fetch --depth=50 origin main): $subj"; fail=1
      elif git diff-tree --no-commit-id --name-only -r "$c" | grep -qx 'HANDOFF.md'; then
        echo "PASS ${c:0:7} $subj"
      else
        echo "FAIL ${c:0:7} batch commit does not update HANDOFF.md: $subj"; fail=1
      fi ;;
  esac
done
exit $fail
