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
