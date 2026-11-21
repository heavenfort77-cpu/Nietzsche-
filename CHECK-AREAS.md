# Where to look: areas to sweep (owner requirement 5)

When one fault is found, find its area below and check every item in that area on every page it applies to: `web/game/` (lasting) and `web/step0/` (prototype: playtest-blocking faults only, see the scope rule in `OWNER-REQUIREMENTS.md`). The fault often comes from a neighbouring area too, so read the "also check" line.

Each item says what to probe and the gate that covers it now. "None yet" is an open gap: when a fault lands there, its fix commit adds the gate and a mutation that proves it.

Pages and paths: G = `web/game/index.html`, S = `web/step0/cue.html`, P = pipeline (`clown_v2/`, `ring/`, `art/`), T = checks and tools (`web/*.mjs`, `web/*.cjs`, `tools/`, `.github/`).

## 1. Input and controls

Reference: `references/controls-reference.jpg` (third-party, never ships). It shows the standard a PC player expects: every action on keyboard, mouse and gamepad, actions grouped by colour, a key that shows the controls, and keyboard and gamepad working at the same time.

| Probe | Pages | Gate now |
| --- | --- | --- |
| Every action in the design has a binding on each input the build supports (keyboard, mouse, touch; gamepad once the owner decides it) | G, S | none yet |
| One table of bindings in CONFIG is the only source; the help or controls screen is drawn from it, so they can never disagree | G, S | none yet |
| No two actions share a key in the same scene; modifier keys and key repeat are ignored for menus and cues | G, S | S: key repeat and modifiers ignored (code), no gate |
| Held input is released on pointerup, pointercancel, lostpointercapture, blur, tab hidden and pause | G, S | S: browser probe `pad-cancel` (F7). G: `check_input_loop.cjs` (F8) |
| Multi-touch: each finger tracked by pointerId; a second finger never moves the first one's control | G, S | G: `check_input_loop.cjs` (F8). S: two pads at once is intended, no probe |
| Keyboard and gamepad (or touch and mouse) used at the same time do not fight | G, S | none yet |
| A focused DOM button never swallows or doubles a game key (Space, Enter) | G, S | S: browser probe `space-focus` |
| Touch targets at least 44 px, never covering the cue, HUD or result text | G, S | S: `layoutGate` (pads vs cue and result word) |
| Input timing judged on event timestamps, not on frames | S | S: `test_cue.cjs` latency bot |

Also check: 3 (scene changes drop held input), 4 (pads on every screen size).

## 2. Clocks and timing

| Probe | Pages | Gate now |
| --- | --- | --- |
| Game time keeps running when the audio clock is missing, suspended or stuck | S, G | S: browser probes for all three (F6) |
| Hidden tab, minimised app, phone call: time stops and nothing expires while away | S, G | S: `noAudioClockProbe` |
| Same play at 30, 60, 120 and 144 Hz displays: logic in fixed steps, drawing interpolates | G, S | none yet |
| Frame step clamped to about 0.05 s; first frame and the frame after a hidden tab clamped and not counted by the fps meter or governor | G, S | G: `check_input_loop.cjs` (F10) |
| Checks wait on game time or a condition, never on wall-clock seconds | T | gate 10 weak spot on slow runners (HANDOFF open item) |

Also check: 7 (sounds scheduled on the same clock), 9 (tells and windows measured in game time).

## 3. Scene and state lifecycle

| Probe | Pages | Gate now |
| --- | --- | --- |
| Everything a scene owns (beats, timers, queued sounds, UI cards, particles) is cleared in the function that leaves it | S, G | S: `sameRunProbe` (F1 class) |
| A new run in the same page plays exactly like a fresh page | S, G | S: `sameRunProbe`. G: none yet |
| Pause stops every time-based update (dt 0), not only drawing; end screens freeze the simulation | G, S | none yet |
| Nothing renders behind an opaque menu or overlay | G | none yet |
| Returning player who skips the intro reaches the same state | G | none yet (no intro yet) |
| Saves and settings from the previous release still load; storage wrapped in try/catch | G | none yet (no saves yet) |

Also check: 1 (held input), 7 (sounds still playing after the scene ends).

## 4. Screens and layout

| Probe | Pages | Gate now |
| --- | --- | --- |
| Every target screen: phone portrait and landscape, small phone, tablet, laptop, desktop, ultrawide | S, G | S: `layoutGate` (7 sizes). G: runtime at 4 sizes |
| Sizes measured from where things really are (face centre, safe areas, notch), never from an assumption such as the screen middle | S, G | S: `layoutGate` (F4) |
| Resize, rotation and moving the window to another monitor mid-play | G, S | none yet (pixel-ratio watcher untestable headless) |
| Canvas size equals its box times the pixel ratio; pixel ratio within the cap | G, S | G: perf gates (pixel ratio). S: none |
| Text never overflows its box; Japanese lines (Dazai) render with a fallback font | G, S | none yet (no quotes yet) |

Also check: 1 (touch targets), 8 (fonts loading).

## 5. Per-frame cost and memory

| Probe | Pages | Gate now |
| --- | --- | --- |
| No allocation, DOM lookup, traversal, closure or string building in per-frame and per-event code | S, G | S: `hotGate` + `callGraphGate` (F2, F5). G: `check_perf.mjs` |
| Every function reachable from the frame loop is covered, not a hand-picked list | S, G | S: `callGraphGate`. G: none yet |
| HUD and DOM written only when the text changes | S, G | S: `hotGate`. G: gate 10 |
| Pools for everything spawned; idle pooled items leave the scene graph | G, S | G: perf gates. S: confetti ring buffer, no gate |
| Memory flat over a long soak and over N new runs | G, S | none yet |
| Heaviest scene measured as real play on a real GPU | G | `gpu` job (Mac) |

Also check: 6 (GPU side of the same frame).

## 6. Graphics (WebGL)

| Probe | Pages | Gate now |
| --- | --- | --- |
| Context lost and restored mid-play, including on a phone sent to the background | G | G: handled in code; no restore probe yet |
| Shaders and textures warmed under a card; warm-up proven to have drawn | G | G: warm-up gate |
| Quality tier changed mid-game; tier chosen by measured frame time, not input type | G | tier start: `check_input_loop.cjs` (F11); mid-game change: none yet |
| Draw calls, triangles and texture memory within budget in the heaviest scene | G | G: perf gates 1-18 |
| Culling on everything; skinned bounds grown | G | G: perf gate |

Also check: 5 (CPU side), 8 (assets failing to load).

## 7. Audio

| Probe | Pages | Gate now |
| --- | --- | --- |
| Unlock on the first tap; iOS silent switch; context resumed after a phone call | S, G | S: browser probes (frozen and stuck clock). iOS: real phone only |
| A sound used before its buffer is ready does not throw or stall | S, G | none yet |
| Graphs, buffers and filters built once; only one-shot sources per event | S, G | S: `hotGate` (create* calls) |
| Scheduled sounds stopped when the act or scene ends | S, G | S: code (`stopScheduled`), no gate |
| Every gameplay-critical sound has a 1-4 kHz layer, heard on laptop speakers | S, G | none yet |

## 8. Loading, assets and the shipped build

| Probe | Pages | Gate now |
| --- | --- | --- |
| One asset file blocked or slow: retry, then fallback, never a blank screen | G | none yet |
| The zipped release served the way itch.io serves it (case-sensitive relative paths, HTTPS only) | G | none yet |
| No network requests during play; load size within budget | G | G: perf gate (load) |
| Compressed GLBs (meshopt, KTX2) load and render in the browser | G | none yet (HANDOFF open item) |

## 9. Game rules and fairness

| Probe | Pages | Gate now |
| --- | --- | --- |
| Always-true invariants checked every tick in bot runs (never three rings, meters in range, one judgement per beat) | S, G | S: bot sweep invariants |
| Bot sweep at several skills (perfect, good, late, idle, masher); a profile that stops finishing is a regression | S, G | S: 7 bots x 3 nights x 2 window sets |
| Every failure has a tell of at least 0.4 s at the hardest setting; only the real hazard causes it | S, G | S: whiteface spawn is the tell (600 ms at night 3); no gate |
| No exploit: mashing, holding, pressing both buttons, buying and wiping to farm shards | S, G | S: masher bot. Shop: none yet |
| No soft-lock: zero Laughs, nothing affordable, losing in the Mirror always leaves a way on | G | none yet (no shop or Mirror yet) |

## 10. Text, strings and config

| Probe | Pages | Gate now |
| --- | --- | --- |
| Every string shown to the player comes from a config key that exists | G, S | none yet |
| CONFIG values match the GDD (tempos, windows, budgets) or the GDD is updated with the owner's decision | S, G | none yet |
| Docs that describe the build (GDD, style study, HANDOFF) match the code | all | none yet (the cast-colour mismatch of 20 Nov was this class) |

## 11. Errors

| Probe | Pages | Gate now |
| --- | --- | --- |
| A frame error never stops the loop silently: next frame scheduled first, body in try/catch, error screen shown | S, G | G: `check_input_loop.cjs` (F9). S: code, no probe |
| Errors outside the loop (handlers, timers, resize, context restore, loading, rejected promises) reach the error screen | S, G | G: `check_input_loop.cjs` (F9). S: browser probe `late-error` (F12) |
| No silent guards that hide a bug | all | review only |

## 12. The checks themselves

| Probe | Pages | Gate now |
| --- | --- | --- |
| Every gate has a mutation that makes it fail | T | S: 14 mutations. G: step 4, step 5 and perf mutations |
| A gate checks the real thing, not an assumption about it | T | review; F4 was this class |
| Lists in checks are derived, not hand-picked | T | F5 was this class |
| A check that did not run is not a pass; a green CI tick can hide FAIL lines (the `gpu` job) | T | `gpu` FAIL-line count; CI greps for FAIL |
| A check is never loosened; it changes only when the game changed on purpose | T | review |
| Fault log complete: probe, class, sweep, proof, one commit; deferred only in prototype code | T | `tools/check_faults.sh` |

## 13. Platforms and devices

| Probe | Pages | Gate now |
| --- | --- | --- |
| Chrome, Safari on iPhone, Firefox, Samsung Internet | G, S | Chrome headless only |
| A real phone run of each build | G, S | owner only (not done yet) |
| Fresh-player test following only the in-game instructions | G, S | owner only (not done yet) |
| Fuzz check on every device profile (planned in the Project's RESTART.md) | G, S | none yet |
