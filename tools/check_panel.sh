#!/usr/bin/env bash
# Gate for design/PANEL-RULES.md (owner 22 Nov 2026: the panel was too agreeable).
# Every design/PANEL-*.md not in EXEMPT must have: "## Stranger report" with "Source: design/STRANGER-*.md" (file exists,
# contains "Kind: human" or "Kind: cold-read"); "## Blind round"; at least one "First vote: <yes> of <seats>" line, and
# "## Red team" when any first vote is 75% yes or more; "## Dissent" with at least one "- " line under it.
# Usage: tools/check_panel.sh [repo dir, default .]   Prints PASS/FAIL lines; exit 1 on any FAIL.
set -uo pipefail
cd "${1:-.}" || exit 2
# written before the rules (22 Nov, sessions 13-16); kept as history
# written before rule 7 (theme and intent carry, 25 Nov 2026): exempt from that one item only
THEME_EXEMPT=" PANEL-light-22nov.md PANEL-ending-22nov.md PANEL-action-22nov.md PANEL-owner-play-22nov.md PANEL-owner-play-22nov-b.md PANEL-owner-play-22nov-c.md PANEL-player-feedback-23nov.md PANEL-theme-nihilism-24nov.md "
EXEMPT=" PANEL-act-price.md PANEL-night1-gameplay.md PANEL-small-win.md PANEL-theme.md PANEL-harsh-review.md PANEL-RULES.md "
fail=0; n=0
for f in design/PANEL-*.md; do
  [ -e "$f" ] || continue
  b=$(basename "$f")
  case "$EXEMPT" in *" $b "*) continue ;; esac
  n=$((n + 1))
  te=0; case "$THEME_EXEMPT" in *" $b "*) te=1 ;; esac
  out=$(THEME_EXEMPT_THIS=$te python3 - "$f" <<'EOF'
import os, re, sys
f = sys.argv[1]; t = open(f, encoding="utf-8").read()
bad = []
def section(name):
    m = re.search(r"(?m)^## " + re.escape(name) + r"\s*$", t)
    if not m: return None
    rest = t[m.end():]; e = re.search(r"(?m)^## ", rest)
    return rest[:e.start()] if e else rest
s = section("Stranger report")
if s is None: bad.append("no '## Stranger report'")
else:
    m = re.search(r"Source:\s*(design/STRANGER-[^\s`]+\.md)", s)
    if not m: bad.append("stranger report has no 'Source: design/STRANGER-....md'")
    elif not os.path.exists(m.group(1)): bad.append("stranger file missing: " + m.group(1))
    elif not re.search(r"Kind:\s*(human|cold-read)\b", open(m.group(1), encoding="utf-8").read()): bad.append("stranger file has no 'Kind: human' or 'Kind: cold-read'")
if section("Blind round") is None: bad.append("no '## Blind round'")
votes = [(int(a), int(b)) for a, b in re.findall(r"First vote:\s*(\d+)\s+of\s+(\d+)", t)]
if not votes: bad.append("no 'First vote: <yes> of <seats>' line")
if any(b and a / b >= 0.75 for a, b in votes) and section("Red team") is None: bad.append("a first vote reached 75% but there is no '## Red team'")
d = section("Dissent")
if d is None: bad.append("no '## Dissent'")
elif not re.search(r"(?m)^- \S", d): bad.append("'## Dissent' is empty")
if os.environ.get("THEME_EXEMPT_THIS") != "1":
    th = section("Theme and intent")
    if th is None: bad.append("no '## Theme and intent' (rule 7: theme and the owner's intent carry)")
    elif not re.search(r"Weighting:\s*theme and intent first", th): bad.append("'## Theme and intent' has no line 'Weighting: theme and intent first'")
for x in bad: print("FAIL " + f + ": " + x)
if not bad: print("PASS " + f)
EOF
)
  echo "$out"
  echo "$out" | grep -q '^FAIL' && fail=1
done
echo "panel docs checked: $n (exempt: written before design/PANEL-RULES.md)"
exit $fail
