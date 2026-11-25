# Panel rules (owner 22 Nov 2026, session 16: "the panel is too agreeable ... solve this first")

Why: rounds 1-4, theme, gameplay, small win and act price all reached 10 or 11 of 12, with the mobile producer as the lone no. The judges were told the owner's intent before they voted, and all 12 seats are played by one model. That is judgement, not a test.

## Rules

1. **Stranger evidence first.** No panel vote on fun, clarity or how the theme reads until a stranger report exists for the build being judged: `design/STRANGER-<build>-<kind>.md` with `Kind: human` (preferred: someone who has never seen the game, following only the in-game text; kit in `design/STRANGER-TEST.md`) or `Kind: cold-read` (an agent on a different model that has not seen the design docs, the owner's intent or the code; it gets only what a player sees). Where the stranger and the panel disagree on clarity or fun, the stranger wins.
2. **Blind first round.** Each seat scores and writes its harshest objection before it is shown the owner's intent or who proposed what. The blind round is written down before the debate.
3. **Every seat names one change.** "No change" needs a reason in one line.
4. **Red team at 75%.** If a first vote reaches 75% yes or more (10 of 13), one seat (rotating, never the proposer) argues the no case in full under `## Red team`, and the vote is taken again.
5. **Dissent is kept.** Every no and every losing argument stays in the doc under `## Dissent`, word for word, even after a consensus.
6. **Label.** Every panel doc says "judgement by one model, not a playtest" next to its scores, and quotes the stranger findings beside them.
7. **Theme and intent carry (owner, 25 Nov 2026, OWNER-REQUIREMENTS.md section 9).** The blind round asks first what the play says and whether it carries the theme (Dazai, Nietzsche, the last episode of Evangelion; "the game is out to get you" read as life is out to get you). From round 2 every seat gets the owner's intent (his words and the GDD "Concept and theme" lines) and the weighting: theme and intent first; a change that only makes the game clearer, easier or more fun passes only if it also carries the theme; where they conflict, the theme wins. The lead's summary lists theme-carrying results first. One agent per seat on mixed models (RESTART.md, owner 23 Nov).

## Doc format (checked by `tools/check_panel.sh`)

A panel doc (`design/PANEL-*.md`, except the exempt list in the script, written before these rules) must have:
- `## Stranger report` with a line `Source: design/STRANGER-....md`; that file must exist and contain `Kind: human` or `Kind: cold-read`;
- `## Blind round`;
- one line `First vote: <yes> of <seats>` per question; any first vote at 75% or more needs `## Red team`;
- `## Dissent` with at least one `- ` line.
- `## Theme and intent` with the owner's intent quoted and a line `Weighting: theme and intent first` (docs before rule 7, listed in the script, are exempt from this one item only).

The gate runs in `tools/handoff.sh check` and `close` in every session (a text check, no browser), and in the CI `handoff` job. `tools/test_check_panel.sh` proves each rule with a doc that breaks it.
