# Stranger report: night 1 played cold by a newbie (phone), session 39

Kind: cold-read (played: the player drove the game itself, from screenshots and on-screen text only)
Owner, 25 Nov 07:51: "again i say i want a cold test have newbie bot to play. i want to know at what point it is lost on what to do."
Build: 3ea2391 (session 38 batch 3: blocked walk turns toward the free side, walk-back goal per shot, result line 4 s), `web/step0/night1.html?tester`, night 1, served on the session box (software GL).
Tool: `tools/coldplay/` unchanged from session 38. Brief: first-timer in `tools/coldplay/BRIEFS.md`. Step 0 of the log is the lead's `look` to check the server came up. Positions below are from the log's hidden state (clown root x, z), not from the player's words.

## Player

| Player | Model | Device | Commands | Furthest | Ended by |
| --- | --- | --- | --- | --- | --- |
| First-timer (newbie) | Haiku | phone 390x844, touch only | 50 + quit | end of night 1: the shop after the Mirror World | the 50-command limit |

Scores: clarity 3, fun 2, want next night 2 (session 38 phone: 3/2/2). Page errors 0. First cold player to reach the walk back's end, the room, the Mirror World and the shop.

## Where it got lost (in order)

1. **The fall act: on the phone he cannot walk** (steps 23-28). Both drags in the ring moved him 0 m (step 25: (0.6, 0) before and after; step 27: (0, 0) before and after). He pressed Fall at (0, 0) and (0.6, 0); pool 1 is at (1.6, 0.2), radius 1.2, so both were outside: two "fell in the dark", act cut. The player believed the second drag had walked him into the light ("the walk into the light worked"); the log shows it had not. Likely cause by code reading, not yet proven by a probe: `endWalk` sets `S.ended = true`, and in the act the touch handler returns on `S.ended` before it starts the stick (the session 38 phone player also pressed from (0, 0)). The session 36 phone load placed him in the pool from the test side, so a phone walk in the live fall act was never shown.
2. **Ring entrance "Trip" button** (step 18): "went away without anything visible"; two commands later he read that he had tripped and the child saw.
3. **Wings on the walk out** (steps 12-17): the pratfall button vanished when he moved; "Down over the cable, and up again" read as a drag, not a press; the ring found by guessing.
4. **Walk back** (steps 29-36): reached the room in 7 drags, the first time a cold player did. Straight down to (-1.25, -12.0), then the "bottom left" goal led him left (-2.05, -8.57) and out. He called the exit "found by luck". He did not hold toward the camera at the crates, so the S-into-the-corner dead end (session 38) was not met.
5. **Room** (steps 37-40): "Turn to the mirror wall and sit" took three turns; nothing says which way.
6. **Mirror World** (steps 42-47): Laughs 15 to 7 to 1 while he stood still; "hit it from the side" did not say which figure or side; his slap showed no hit. Out of Laughs, woke at the mirror.
7. **Shop** (steps 48-50): "Stand up" greyed, purchases not understood.

Player's own summary: the game says what to do but not what the controls do, and the target object is hard to see.

## Run 2: the same newbie brief on a215a08 (batch 2, F46: the phone stick now starts in the live fall act)

| Player | Model | Device | Commands | Furthest | Ended by |
| --- | --- | --- | --- | --- | --- |
| First-timer (newbie) | Haiku | phone 390x844, touch only | 50 (incl. quit) | night 2, the act board | the 50-command limit |

Scores: clarity 2, fun 2, want next night 2. Page errors 0. Step 43 "Go on to night 2" loads a new page; the tool's `page.evaluate` lost its context there (a tool error, not a game error; step 44 showed the night 2 logo).

Where it got lost (positions from the log):
1. **The fall act: he never tried to walk.** He pressed Fall where he stood, at (0.6, 0) and (0, 0), 1.6 m from pool 1 (1.6, 0.2) r 1.2: two "fell in the dark", act cut, Laughs +0 (step 19-23). With F46 a drag would now walk him (probe), but nothing on screen made him try: "Fall in the light, on the crash" did not read as "walk to the light first". He said: "I did not get a clear idea what counted as a hit."
2. **Mirror World with 0 Laughs** (steps 36-39): the act paid nothing, so he entered with 0 Laughs; the first pale figure ended it within one drag ((0, 29.46)), and he did not know if he was hit. DODGE / SLAP / PIE never explained.
3. **Shop with 0 shards** (step 42): everything greyed, no way to earn shown; he ended the night.
4. **Wings, walk out** (steps 6-14): the pratfall button and "Down over the cable, and up again" again unclear (same as run 1).
5. **Walk back** (steps 24-30): reached the room in 6 drags (via (1.09, -8.41) to the corridor), again "not clear this was the exit". The crates corner was not met.
6. **Room** (steps 31-34): three right turns to reach the mirror wall (same as run 1).

Runs 1 and 2 agree: the first point a newbie is lost is the fall act (where the light is and that he must walk into it); everything after it is played with 0 Laughs and stays unclear.
