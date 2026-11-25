#!/usr/bin/env bash
# Session 42 (owner 25 Nov 12:33): browser probes and smokes run on GitHub runners, all at once, never on the session box.
# Usage: tools/probe_ci.sh "<entry>,<entry>,..." [ref]
#   entry = optional VAR=value words, then a .cjs path under web/, e.g. "step0/probe_s42_stranger.cjs,ONLY=desk step0/smoke_night1.cjs"
#   ref   = branch to dispatch on (default main; the commit must be pushed first)
# Dispatches .github/workflows/probe.yml through the REST API, waits for the run, fetches each job's log from ci-out/probe-<run>-<i>
# and prints only: per entry its RESULT lines, FAIL lines and exit line; then "probe run <n>: N of M entries passed". Exit 1 if any failed.
set -uo pipefail
cd "$(dirname "$0")/.."
LIST=${1:?entries}; REF=${2:-main}
REPO=heavenfort77-cpu/Nietzsche-
since=$(date -u +%Y-%m-%dT%H:%M:%SZ)
gh api -X POST "repos/$REPO/actions/workflows/probe.yml/dispatches" -f ref="$REF" -f "inputs[probes]=$LIST" > /dev/null || { echo "FAIL dispatch"; exit 2; }
run=""; num=""
for i in $(seq 1 30); do
  sleep 5
  read -r run num < <(gh api "repos/$REPO/actions/workflows/probe.yml/runs?event=workflow_dispatch&per_page=5" \
    --jq "[.workflow_runs[] | select(.created_at >= \"$since\")] | sort_by(.created_at) | last | \"\(.id) \(.run_number)\"" 2>/dev/null)
  [ -n "${run:-}" ] && [ "$run" != "null" ] && break
done
[ -n "${run:-}" ] && [ "$run" != "null" ] || { echo "FAIL no run found after dispatch"; exit 2; }
echo "probe run $num (id $run) dispatched on $REF"
while :; do
  st=$(gh api "repos/$REPO/actions/runs/$run" --jq '.status + " " + (.conclusion // "")')
  case "$st" in completed*) break ;; esac
  sleep 30
done
n=$(echo "$LIST" | tr ',' '\n' | grep -c .); ok=0
for i in $(seq 0 $((n - 1))); do
  if git fetch -q --depth=1 origin "ci-out/probe-$num-$i" 2>/dev/null; then
    t=$(git show FETCH_HEAD:probe.txt)
    echo "$t" | head -1
    echo "$t" | grep -E '^(RESULT|FAIL|[a-z]+ FAIL)|^exit ' | head -40
    echo "$t" | grep -q '^exit 0,' && ! echo "$t" | grep -qE '^FAIL|^[a-z]+ FAIL' && ok=$((ok + 1))
  else
    echo "entry $i: FAIL no log (ci-out/probe-$num-$i missing)"
  fi
done
echo "probe run $num: $ok of $n entries passed ($st)"
[ "$ok" = "$n" ]
