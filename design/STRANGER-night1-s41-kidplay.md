# Stranger report: night 1 played cold by a 4th-grade reader (phone), session 41

Kind: cold-read (played: the player drove the game itself, from screenshots and on-screen text only)
Owner, 25 Nov 08:28 (session 40, still the goal): "i want the bot to have an elementary student understanding of language, i want to know at which stage instructions is unclear that player will be lost and which part is unplayable"
Build: 69bc8c3 (session 41 batch 1 words), `web/step0/night1.html?tester`, served on the session box (software GL, no sound reaches the player).
Tool: `tools/coldplay/` with `KID=1` (fall stage, pool and position logged since session 40 batch 3). Brief: "Kid reader" in `tools/coldplay/BRIEFS.md`, plus "a friend told you: pick The fall" (as kid4 and kid5). Reading grades: `python3 tools/coldplay/readgrade.py /tmp/coldplay/kid6/log.jsonl`.

## Player

| Run | Model | Device | Start | Commands | Furthest | Scores clarity/fun/next | Page errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| kid6 | Haiku | phone 390x844, touch | night 1 | 60 + quit | night 2 act board (step 59) | 3/3/4 | 0 in 61 steps |

Step 53's tool note `Execution context was destroyed` is the night-2 page load during the tool's read (as in session 39), not a page error; step 54 shows the night 2 title.

## Words (batch 1 check)

Seen with no ???: "Hall", "Ring door", "He is the clown now. The act board is next.", "Light sweep / Sweep the light off the floor.", "He trips, and he meant to. The child saw.", title "Night 1". Still outside the list (readgrade, real text): the quotes and credits (kept); act note More fold "gag", "perfect"; the child's "...on purpose." (kept, theme); his thought "whether"; Mirror tip "gnaw, gag"; shop "Performer" (2 lines); end card "Details"; night 2 board "The scale".

## Where the kid is lost, by stage

| Stage | Instruction as read | Understood | Could do it |
| --- | --- | --- | --- |
| Title, paint, quote, board | as session 40 | yes (quote: no) | yes |
| Act note | "Stand in the light. Fall when the gold button lights up." | yes | yes (Do it) |
| Hall, wings | "Walk up the hall to the ring. Go round the people." / "The ring is past the red curtains, at the back." | yes | yes; "Fall over the rope": "nothing I could see happened" |
| Ring door | "Walk into the light." + Trip | yes | yes, trip pressed and its line read |
| **The fall** | goal + "Walk: drag anywhere. Fall: the gold button." | partly: "I did not know the light moves" | **no: 0 of 2, never saw the button lit** |
| Walk back | goal lines per shot | yes | yes, "stuck behind other clowns for a while" |
| Room | "Turn to the mirror wall and sit." | partly (which way) | yes, 3 right arrows then "Face the mirror" |
| Mirror World | "Drag: move. Each trick costs Laughs. Stand still and they bite." | partly | Laughs 15 -> 14 -> 6 -> 1 -> 0 (steps 43-47, log `mwLaughs`), then out |
| Shop | cards greyed out, 0 pieces | no | Stand up, End the night |

## The fall act, from the log (pool x, z, radius m; his position x, z)

| Step | Command | Stage after | Pool | He | Kid's words |
| --- | --- | --- | --- | --- | --- |
| 20 | wait 2 | settle | (1.6, 0.2) r 1.2 | (0, 0) | "no words on the screen" |
| 21 | wait 1 | wait | same | (0, 0) | "The Fall button is dark right now" |
| 22 | drag right 1 s | **roll** | same | (2.07, 0), 0.47 m from centre | "The Fall button is still dark. The light moved to my right, so I think I am not standing in it." |
| 23 | wait 2 | settle (pool 2) | (-1.32, 0.41) | (2.07, 0) | fall 1 graded late (no press) during the wait |
| 24 | drag left 1 s | **wait** | same | (-0.15, 0), **1.24 m** from centre | "I am at the edge of the light now, and the Fall button is still dark" (said at step 25) |
| 25 | drag left 1 s | result | same | (-1.92, 0) | "Too late. The crash hit a clown still standing." shown at the end of this one command |

Findings (from the log lines above):
1. **Edge of the light (kid5's fall 2 explained in shape, kid5 itself not logged):** at step 24 he stood 1.24 m from pool 2's centre, 0.04 m outside the 1.2 m grade radius, and the kid saw him at the edge of the light. The roll starts only when his root point is inside `F.N.pool` (`fallInPool`); the drawn disc has the same radius (code reading, session 39), so with his body over the disc's edge the picture says "in" and the rule says "out". Not yet probed in the page: how far his drawn body reaches past his root on the phone framing.
2. **The roll starts mid-walk:** at step 22 and step 25 he walked into the pool during a drag and the roll began at once, while he was still moving. Step 24 -> 25 ran 2.7 s of game time (gt 52.2 -> 54.9) against roll 1.6 s + give-up 0.6 s, so at step 25 the whole roll and the crash fell inside one command and the kid never saw a frame of it. The goal says "Stand in the light", but the roll does not wait for him to stand. For a real person the roll shows live; for this turn-based tool the drag's run time can swallow it (tool limit).
3. **"Still dark" while rolling (step 22):** the roll was running when the shot was taken, yet the kid read the button as dark. Which beat state the shot showed (`fill` part-way or `dim`) was not logged; the tool does not log the button's class yet.
4. **"The light moved":** pool 2 lands 2.0-3.6 m from him (`fallNext`) by design; night 1 has no drift. The kid read the new place as the light moving away.
5. The trip paid again with the act cut: "They laughed hardest at the trip.", Laughs +15 (as kid3 and kid5).
6. Mirror World with 15 Laughs: 15 -> 14 -> 6 -> 1 -> 0 over steps 43-47 (log `mwLaughs`; the kid said 15, 6, 2), out to the Nietzsche card; shop with 0 pieces (both as before).

## Lead's list (not built; owner to agree or pick)

(1) Count his body for the light: the roll starts when he is within the pool plus his drawn half-width (or the drawn disc is the grade radius less his half-width): a probe first (fault rule, requirement 5), measuring his body's reach past the root on phone and desktop. (2) Start the roll only once he stands still in the light (matches "Stand in the light"), behind a CONFIG switch. (3) Tool: log the Fall button's beat state with each step. (4) Easy words left: "gag", "perfect" (note fold), "whether" (his thought), "gnaw" (Mirror tip), "Performer" (shop), "Details" (end card), "The scale" (night 2 board). Owner still to say: the lit window on a real phone; the trip paying when the act flops; the Mirror World with few Laughs.
