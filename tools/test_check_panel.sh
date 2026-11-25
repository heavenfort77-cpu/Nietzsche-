#!/usr/bin/env bash
# Proves tools/check_panel.sh: a good panel doc passes; each broken rule fails. Scratch dir, repo untouched.
# Ends with RESULT check_panel <n> of <m> cases as intended.
set -uo pipefail
here=$(cd "$(dirname "$0")" && pwd)
ok=0; all=0
good() { cat <<'EOF'
# Panel: test
## Stranger report
Source: design/STRANGER-test-cold-read.md
## Blind round
- seat: objection
First vote: 8 of 13
## Dissent
- Mobile producer: no.
## Theme and intent
Owner: "theme and story is more important".
Weighting: theme and intent first
EOF
}
case_() { # $1 name, $2 want pass|fail, $3 sed expression on the good doc ('' = none), $4 stranger file text ('' = none)
  local d; d=$(mktemp -d); mkdir -p "$d/design"
  if [ -n "$3" ]; then good | sed -E "$3" > "$d/design/PANEL-test.md"; else good > "$d/design/PANEL-test.md"; fi
  [ -n "$4" ] && printf '%s\n' "$4" > "$d/design/STRANGER-test-cold-read.md"
  local got=pass; bash "$here/check_panel.sh" "$d" > "$d/out" 2>&1 || got=fail
  all=$((all + 1))
  if [ "$got" = "$2" ]; then ok=$((ok + 1)); echo "ok   $1 ($got)"; else echo "BAD  $1: want $2, got $got"; sed 's/^/     /' "$d/out"; fi
  rm -rf "$d"
}
K='Kind: cold-read'
case_ "good doc passes" pass '' "$K"
case_ "human stranger passes" pass '' 'Kind: human'
case_ "no theme and intent section" fail '/^## Theme and intent/d' "$K"
case_ "theme section without the weighting line" fail '/^Weighting:/d' "$K"
case_ "no stranger section" fail '/^## Stranger report/d' "$K"
case_ "no Source line" fail '/^Source:/d' "$K"
case_ "stranger file missing" fail '' ''
case_ "stranger file without Kind" fail '' 'just notes'
case_ "no blind round" fail '/^## Blind round/d' "$K"
case_ "no first vote line" fail '/^First vote:/d' "$K"
case_ "10 of 13 without red team" fail 's/First vote: 8 of 13/First vote: 10 of 13/' "$K"
case_ "10 of 13 with red team passes" pass 's/^First vote: 8 of 13/First vote: 10 of 13\n## Red team\n- no case/' "$K"
case_ "no dissent section" fail '/^## Dissent/,$d' "$K"
case_ "empty dissent" fail '/^- Mobile producer/d' "$K"
echo "RESULT check_panel $ok of $all cases as intended"
[ "$ok" = "$all" ]
