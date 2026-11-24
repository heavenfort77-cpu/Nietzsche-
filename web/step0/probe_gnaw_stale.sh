#!/usr/bin/env bash
# F41 probe and its mutation: the gnaw warning step must read the warning from a frame after its own setup.
# STALE=1 leaves the warning on from one real game frame before the setup (as a slow runner leaves it from the step before).
# 1. mutation: the check with the old wait (no M.t > t0 guard) must FAIL the warning stage;
# 2. the check as committed must PASS it.
# Usage (after cube25d/setup.sh, NODE_PATH with playwright-core): bash web/step0/probe_gnaw_stale.sh [out dir]
set -uo pipefail
cd "$(dirname "$0")"
OUT=${1:-/tmp/probe_gnaw}
STEP='standing still: they gnaw'
MUT=smoke_night1_stalewait.cjs
sed 's/window.__night.M.t > window.__t0 \&\& window.__night.M.gnawLvl === 1/window.__night.M.gnawLvl === 1/' smoke_night1.cjs > $MUT
if cmp -s smoke_night1.cjs $MUT; then echo "FAIL probe_gnaw_stale: mutation anchor not found"; rm -f $MUT; exit 1; fi
rc=0
m=$(STALE=1 ONLY=desk UNTIL="$STEP" node $MUT "$OUT/mut" 2>&1 | grep "$STEP")
rm -f $MUT
case "$m" in *FAIL*) echo "PASS mutation stalewait caught: ${m:0:220}";; *) echo "FAIL mutation stalewait not caught: ${m:0:220}"; rc=1;; esac
r=$(STALE=1 ONLY=desk UNTIL="$STEP" node smoke_night1.cjs "$OUT/real" 2>&1 | grep -E "$STEP|gnaw: warning")
case "$r" in *"desk OK"*) echo "PASS probe_gnaw_stale: warning read from a fresh frame: ${r:0:220}";; *) echo "FAIL probe_gnaw_stale: ${r:0:220}"; rc=1;; esac
exit $rc
