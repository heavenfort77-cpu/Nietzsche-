#!/usr/bin/env bash
# CI gate for owner requirement 5 (wide fault sweep, probe first, one commit).
# For every commit in <base>..<head>:
#   - each new "## F<n>:" entry in FAULTS.md must have all fields (Found, Probe, Cause, Class, Sweep, Fix, Proof),
#     Probe must quote a FAIL line and Proof a PASS line;
#   - a commit whose subject says fix/bug/fault and that changes anything other than .md files must add an entry;
#   - a deferred entry (has "- Deferred:") needs Found, Probe (FAIL), Cause, Class, Where, Deferred instead of Fix/Proof,
#     and its Where path must be under a prototype path in tools/prototype_paths.txt (owner requirement 5, scope).
# At <head>: every deferred entry must still point into a prototype path (a kept prototype must clear its deferred faults).
# Across the range: new entries in more than one commit fail ("consolidate all fixes into one commit").
# Usage: tools/check_faults.sh <base-sha> <head-sha>   (needs history back to base)
set -uo pipefail
base=${1:?base sha}; head=${2:?head sha}
fail=0; withEntries=0
range="$base..$head"
if [ "$base" = "0000000000000000000000000000000000000000" ]; then range="$head"; fi
newEntries() { # $1 commit: prints validation lines for entries added by it
  local parentText
  parentText=$(git show "$1^:FAULTS.md" 2>/dev/null || true)
  git show "$1:FAULTS.md" 2>/dev/null | PARENT="$parentText" PROTOS="$(git show "$1:tools/prototype_paths.txt" 2>/dev/null)" python3 -c '
import os, re, sys
cur = sys.stdin.read(); old = os.environ["PARENT"]
def entries(t):
    parts = re.split(r"(?m)^## (F\d+):", t)
    return {parts[i]: parts[i + 1] for i in range(1, len(parts) - 1, 2)}
o, c = entries(old), entries(cur)
protos = [l.strip() for l in os.environ.get("PROTOS", "").splitlines() if l.strip() and not l.startswith("#")]
for k, body in c.items():
    if k in o: continue
    miss = []
    deferred = re.search(r"(?m)^- Deferred:\s*\S", body) is not None
    fields = ["Found", "Probe", "Cause", "Class", "Where", "Deferred"] if deferred else ["Found", "Probe", "Cause", "Class", "Sweep", "Fix", "Proof"]
    if deferred:
        w = re.search(r"(?m)^- Where:\s*`?([^`\s]+)", body)
        if w and not any(w.group(1).startswith(pp) for pp in protos): miss.append("deferred outside prototype code (" + w.group(1) + ")")
    for f in fields:
        m = re.search(r"(?m)^- " + f + r":\s*(\S.*)$", body)
        if not m: miss.append(f)
        elif f == "Probe" and "FAIL" not in m.group(1): miss.append("Probe has no FAIL line")
        elif f == "Proof" and "PASS" not in m.group(1): miss.append("Proof has no PASS line")
    print(("BAD " if miss else "OK ") + k + (" missing: " + ", ".join(miss) if miss else ""))
'
}
for c in $(git rev-list --reverse "$range"); do
  subj=$(git log -1 --format=%s "$c")
  if grep -qx "$c" "$(git rev-parse --git-dir)/shallow" 2>/dev/null; then
    echo "FAIL ${c:0:7} parent not in this clone, cannot check (run: git fetch --depth=50 origin main): $subj"; fail=1; continue
  fi
  res=$(newEntries "$c")
  if [ -n "$res" ]; then
    withEntries=$((withEntries + 1))
    while read -r line; do
      case "$line" in
        OK*) echo "PASS ${c:0:7} FAULTS ${line#OK }";;
        BAD*) echo "FAIL ${c:0:7} FAULTS ${line#BAD }"; fail=1;;
      esac
    done <<< "$res"
  elif echo "$subj" | grep -qiE '\b(fix|fixes|fixed|bug|bugs|fault|faults)\b' && git diff-tree --no-commit-id --name-only -r "$c" | grep -qv '\.md$'; then
    echo "FAIL ${c:0:7} fix commit without a FAULTS.md entry (probe, class, sweep): $subj"; fail=1
  fi
done
headState=$(git show "$head:FAULTS.md" 2>/dev/null | PROTOS="$(git show "$head:tools/prototype_paths.txt" 2>/dev/null)" python3 -c '
import os, re, sys
t = sys.stdin.read()
protos = [l.strip() for l in os.environ.get("PROTOS", "").splitlines() if l.strip() and not l.startswith("#")]
parts = re.split(r"(?m)^## (F\d+):", t)
for i in range(1, len(parts) - 1, 2):
    body = parts[i + 1]
    if not re.search(r"(?m)^- Deferred:\s*\S", body): continue
    w = re.search(r"(?m)^- Where:\s*`?([^`\s]+)", body)
    if not w or not any(w.group(1).startswith(pp) for pp in protos):
        print(parts[i] + " is deferred but " + (w.group(1) if w else "has no Where") + " is not prototype code: sweep and fix it now")
')
if [ -n "$headState" ]; then while read -r line; do echo "FAIL FAULTS $line"; done <<< "$headState"; fail=1; fi
if [ "$withEntries" -gt 1 ]; then echo "FAIL fixes spread over $withEntries commits in one push: consolidate into one commit"; fail=1; fi
[ $fail -eq 0 ] && echo "PASS faults gate ($withEntries commit(s) with new entries)"
exit $fail
