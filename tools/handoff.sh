#!/usr/bin/env bash
# Session handoff. Live state lives in HANDOFF.md and git, never only in chat.
#   tools/handoff.sh start  : first command of every new session. Records the session's start commit, prints status, OWNER-REQUIREMENTS.md and HANDOFF.md.
#   tools/handoff.sh        : run after every batch. Counts batch commits this session; prints NEW SESSION NOW at the limit.
#   tools/handoff.sh close  : before handing over. PASS only if HANDOFF.md is committed, current and pushed.
# A batch commit is one whose subject starts with "Batch " (CI fails a batch commit that does not touch HANDOFF.md).
set -uo pipefail
cd "$(dirname "$0")/.."

# Batches per session before a forced restart (owner rule, START-HERE.md: "after 3 batches").
LIMIT=3
# Line a new session is started with, in a new chat inside the "Nietzsche," Project.
PASTE='Read RESTART.md and START-HERE.md, then continue the jam build from Next step in HANDOFF.md.'

start_commit() { grep -m1 '^Session start: ' HANDOFF.md | awk '{print $3}'; }
batches() {
  local s; s=$(start_commit)
  if [ -z "$s" ] || ! git cat-file -e "$s" 2>/dev/null; then echo "?"; return; fi
  git log --format=%s "$s"..HEAD | grep -c '^Batch ' || true
}
banner() {
  echo "=================================================="
  echo " NEW SESSION NOW ($1)"
  echo " 1. tools/handoff.sh close   (must print PASS)"
  echo " 2. new chat in the Nietzsche, Project, paste:"
  echo "    $PASTE"
  echo "=================================================="
}

case "${1:-check}" in
  start)
    head=$(git rev-parse --short HEAD)
    sed -i "s/^Session start: .*/Session start: $head ($(date -u +%F))/" HANDOFF.md
    bash tools/status.sh
    echo "== OWNER-REQUIREMENTS.md"
    cat OWNER-REQUIREMENTS.md
    echo "== HANDOFF.md"
    cat HANDOFF.md
    echo "== session start recorded: $head (commit HANDOFF.md with the first batch)"
    ;;
  check)
    git fetch -q --depth=50 origin main 2>/dev/null
    n=$(batches)
    s=$(start_commit)
    if [ -n "$s" ] && ! out=$(bash tools/check_handoff.sh "$s" HEAD); then
      echo "$out" | grep FAIL; echo "FAIL fix HANDOFF.md before the next batch"; exit 1
    fi
    echo "batches this session: $n of $LIMIT (start $(start_commit))"
    if [ "$n" = "?" ]; then banner "session start commit unknown"; exit 1; fi
    if [ "$n" -ge "$LIMIT" ]; then banner "$n batches done"; exit 1; fi
    echo "PASS continue"
    ;;
  close)
    fail=0
    git fetch -q --depth=50 origin main 2>/dev/null
    if [ -n "$(git status --porcelain)" ]; then echo "FAIL uncommitted changes:"; git status --short | head -10; fail=1; fi
    if [ -n "$(git log --oneline FETCH_HEAD..HEAD 2>/dev/null)" ]; then echo "FAIL commits not pushed"; fail=1; fi
    last_batch=$(git log --format=%H --grep='^Batch ' -1)
    last_handoff=$(git log --format=%H -1 -- HANDOFF.md)
    if [ -n "$last_batch" ] && ! git merge-base --is-ancestor "$last_batch" "$last_handoff" 2>/dev/null; then
      echo "FAIL HANDOFF.md older than the last batch commit"; fail=1
    fi
    s=$(start_commit)
    if [ -n "$s" ] && ! out=$(bash tools/check_handoff.sh "$s" HEAD); then echo "$out" | grep FAIL; fail=1; fi
    grep -q '^## Next step' HANDOFF.md || { echo "FAIL HANDOFF.md has no '## Next step'"; fail=1; }
    if [ "$fail" = 0 ]; then
      echo "PASS handoff ready. Also write START-HERE.md to the Project if its rules changed."
      echo "Paste in a new chat in the Nietzsche, Project:"
      echo "  $PASTE"
    fi
    exit $fail
    ;;
  *) echo "usage: tools/handoff.sh [start|check|close]"; exit 2 ;;
esac
