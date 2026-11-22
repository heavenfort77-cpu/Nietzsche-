# Panel: the owner's phone play of batch 3 (22 Nov 19:38, session 18)

Owner, after playing artifact version 1795346627-11b9 on his phone (screenshots: the dressing table opening, the ring entrance): "1. the vanity table too high, does not show his face. need to be lower. 2. after dazai line he should straighten up as a false bravo. 3. what that fall he squashed.... run throught panel and rebuild with their comments, give a html file as well i pass to cold tester."

Judgement by one model playing 13 seats (12 judges and the story writer), not a playtest. Rules: `design/PANEL-RULES.md`.

## Stranger report

Source: design/STRANGER-night1-full-cold-read.md

That cold read is of the batch 2 build (ad627c5), not batch 3. It did not see the vanity opening or the page fall poses. What it says that bears on these points: finding 11, the child's trip worked as a joke, "though the two figures are so small I had to squint to see there was a child"; finding 1, on a phone the walking screens are a strip a quarter of the screen high and the clown is "fingernail-sized". The human cold test the owner asked for (the single HTML file from this batch, kit `design/STRANGER-TEST.md`) is the stranger report for this build; where it disagrees with this panel on clarity or fun, it wins.

## Facts from the code and probes (session 18, before any change)

| Owner's point | What the build does | Measured |
|---|---|---|
| 1 Vanity too high | table top 0.80 m, glass centre 1.55 m, 1.1 m tall; he sits with his head bone at 0.85 m | desk probe: glass y 140-357 px, the reflection's head bone at y 360 px, 3 px below the glass: its face is cut off. The batch 3 check measured a fixed point 1.3 m above the reflection's feet, not its head, so it passed |
| 2 Bravado | after the Dazai card he turns to the board sitting slumped (chest +18) | |
| 3 Squashed fall | fall poses are added after the clip each frame. three.js rewrites a bone only when the clip's value changes, and the idle clip holds most bones still, so the poses added up frame after frame | `gpProbe` (new test hook, same input three times): first-frame height 1.785 / 0.793 / 1.102 m; lowest body point -0.96 to -1.18 m (body through the floor) for prat, trip, dive and kneel; ring entrance screenshot: a folded lump. After a restore step only: three runs identical (1.785 m), lowest point still -0.07 to -0.30 m (belly flop face 0.17 m into the floor; the slumped walk-back lean adds 0.13 m) |
| 3 Staging | the child's trip runs toward the ring, straight away from the ring-entrance camera; the act's missed-chain fall faces the low-seat camera and falls straight back | a fall along the camera axis reads as a squat at 62 px |

## Blind round

Harshest objection per seat, written before the owner's suggestions were weighed:
- Story writer: the opening's whole point is the face he paints; if the glass hides it, the scene is a man's back.
- Nietzsche: the bravado is the mask going on; the glass must not be fooled by it.
- Dazai: Yozo straightens for others, never for himself; the reflection should stay bent.
- Core gamer: a body that sinks through the floor is a bug, not a style.
- Casual phone player: on the strip-sized phone picture I could not tell he fell; I saw a yellow blob.
- Jam judge: the trip is the one gag in the walk; it must read in one look.
- Camus: the straightening should be visibly absurd: too much, held too long.
- Chaplin: a fall is played across the camera, never into it. Profile or nothing.
- Auguste clown: the flop must land flat and full length, chin on the floor, heels up, not folded.
- Clinical psychologist: false bravado has a tell: the breath in, the chin up, then the shoulders drop a hair. Keep the drop.
- Indie critic: lower the table, not the camera; the plates are approved.
- Streamer: the straighten wants a sound; a sharp inhale or a "hup".
- Mobile producer: lower the glass enough that the face shows on a 390 px phone, not only on desktop.

## The fixes and the votes (13 seats)

| # | Fix | First vote | After red team |
|---|---|---|---|
| 1 | **Lower vanity.** Re-render only the dressing plate: table top 0.80 -> 0.72 m, glass centre 1.55 -> 1.20 m, glass 1.1 -> 0.9 m tall (bottom at 0.75 m, just above the table), the 10 bulbs follow the glass. Page values follow (`vanityGlass`, `vanitySize`). The check measures the reflection's head bone and face, not a fixed height: the face box (head bone to 0.3 m above it) inside the glass on all three screens, and the two heads apart. | First vote: 13 of 13 | 13 |
| 2 | **False bravado.** On "To the act board" the card closes and the beat plays in the dressing view before the turn: he stands from the chair, a sharp breath in, chest out, chin up, the painted smile; held, then the shoulders drop a hair. The reflection in the vanity is late and only half straightens, still sad-faced. Then the turn to the board. CONFIG: times and angles; switch `bravado`. | First vote: 11 of 13 | 11 |
| 3 | **Falls (fault F27).** (a) The fall poses are saved and put back before each mixer update, like the mood layer. (b) While a fall plays, the posture lean fades out (the fall owns the body) and returns as he gets up. (c) Floor contact: after the pose, sample points on his body (extremes of each bone's skin) find the lowest point; if it is under the floor the hips lift by that much. (d) Staging: the child's trip turns him across the camera (away from the child, so he does not land on her) and he falls in profile; the act's missed chain turns him side-on before the pratfall. Checks: `gpProbe` same result twice, lowest point at least -0.03 m for every fall with every mood; each walk and act fall at least 45 degrees off the camera axis. | First vote: 13 of 13 | 13 |
| H | **Single HTML for the human cold test** (owner's order, no vote): the night-1 build as one file that opens offline on a phone, assets inside. Owner rule 43 (no big inlined base64) is about the game build; this copy is a test file. | | |

## Red team

- **1** (indie critic argues no): "Re-rendering an approved plate changes approved art." Answer: only the vanity group moves; the rest of the dressing plate renders from the same script, seed and samples, and the other four views are not re-rendered. The owner asked for it. 13.
- **2** (core gamer argues no): "Another beat between the quote and play." Answer: about 2 s, and the tap that closes the card starts it; it is the only character beat between the quote and the board. 11 (the casual player and the mobile producer stay no; see Dissent).
- **3** (casual player argues no): "Turning him sideways before he trips looks staged." Answer: the clown's trip for a child is staged; the turn is folded into the first stagger step (0.15 s). 13.

## Dissent

- Casual phone player (2, no): "Two seconds with no input after a long quote; on a phone I will tap again and wonder if it broke." Kept: a tap during the beat skips to the board (folded into the build).
- Mobile producer (2, no): "The breath-in sound is lost on a silent phone; the beat must read with sound off." Kept: the beat is built to read with sound off (posture and face); the breath is extra.
- Streamer (2, yes with a note): "A 'hup' would sell it more than a breath." Not taken: the owner asked for false bravado, not a gag.
