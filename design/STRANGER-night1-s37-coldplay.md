# Stranger report: night 1 played cold (desktop and phone), session 37

Kind: cold-read (played: each player drove the game itself, from screenshots and on-screen text only)
Owner, 24 Nov 20:55: "i need cold player and first timeer to play and where they get lost. as dumb as pos".
Build: 995cae9 (session 37 batch 1), `web/step0/night1.html`, night 1, served on the session box (software GL).
Tool: `tools/coldplay/` (new this batch). `server.cjs <name> <desk|phone>` loads the page; the player sends commands through `play` (look, click/tap, button, key, hold, hold2, drag, wait, watch, pressafter, quit) and gets back only the screenshot, the text drawn on screen (hidden, faded or covered text left out) and the visible buttons. The game is frozen between commands (loop stopped, audio clock suspended), and every hold or wait counts game seconds, so the players' thinking time and the box's slow drawing (desktop 0.7-5.6 fps, phone 4.5-18 fps) do not count in play. Keyboard commands are refused on the phone. The log (`/tmp/coldplay/<name>/log.jsonl`, the session box) keeps each command, the player's words and the hidden state (scene, position) for this report; `summary.py` prints it; `replay.py` replays a log.

## Players

| Player | Model | Device | Commands | Furthest | Ended by |
| --- | --- | --- | --- | --- | --- |
| Cold gamer ("fairly dumb, impatient, skims") | Sonnet | desk 1280x720, keys and mouse | 47 | ring entrance, the lit ring in view | soft-lock (F45, trip for the child) |
| First-timer ("almost never plays, as dumb and impatient as possible") | Haiku | phone 390x844, touch only | 24 | the wings, just past the cable | soft-lock (F45, pratfall over the cable) |

Neither reached the act, the Mirror World, the shop or the end card. Scores (clarity / fun / want next): cold gamer 2 / 2 / 2, first-timer 1 / 2 / 1.

Void runs (kept apart, not counted): the first desktop run (`cold-desk-run1-slow`, 60 commands) ran in wall time while the walk drew 1 fps, so the game moved at about 5% speed ("held W 10 s, nothing changed"); the first phone run (`first-phone-run1-invalid`) hit a tool fault (a second freeze cleared the frozen flag, so the game never ran again after its first "watch"). Both tool faults were fixed before the two runs above; the replay with positions proves the fix (game time advances after a watch).

## Where they got lost (from the logs; positions are the game's own)

1. **Dressing room, "finish the paint"** (both). Desk: "Press any key to finish the paint." pressed Space, the line went, nothing else said what to do; it walked about until the Dazai card came. Phone: "Tap to finish the paint." tapped the mirror and the clown. Neither knew what "the paint" was or whether it was done (desk steps 1-3, phone 1-2).
2. **The move from the dressing room to the act board is not explained** (both). After "To the act board" the clown stands in the room in his hat with no text; both moved by chance and the board came "by itself" (desk 4-5, phone 3-4). Phone: the only movement text it had seen was the title's "Walk: WASD or arrow keys", useless on a phone.
3. **The act note is a wall of text** (both skipped it): neither could say what Laughs or Mask are, and the desktop player found no meter for them afterwards (desk 6-7, phone 5-6).
4. **Corridor: a crew member stands on the straight line** (both). Straight up/W stops at z -4.68 every time; nothing says to go round. Desk took 4 commands (diagonal at step 11), then was blocked by "a pole/barrier" at (-0.89, 6.27) for 6 more (steps 12-17, including the pause card, which has no goal); phone took 7 (steps 7-13), and only a diagonal drag passed.
5. **"Tap/press the gold button when it shows"** (both): the hint names a button that is not there; the desktop player pressed E next to the old man for nothing (step 9) and searched for it for 10 steps; when buttons came (Take the pie, Pratfall over the cable, Honk the horn) neither saw any result ("Don't see a pie", "Honked, I guess", "Did I fall? I can't tell").
6. **Wings: no direction to the ring, and the clown is hard to find** (both). Desk: "Can't tell where I am or where to go", keys move in unexpected screen directions under the high fixed camera (S went down-left), boxed in by the coloured blocks and a pole (steps 22-31, 10 commands); phone: "I can't even tell which clown is me in this room".
7. **Soft-lock, both runs (F45).** Phone: the pratfall at x -2.18 landed him at (-2.18, 12.00), inside the prop box [-2.55, 11.9, -1.85, 13.3] grown by his radius; 7 drags in every direction moved him 0 m (steps 16-23; reproduced by the lead: 6 directions, 0 m). Desk: "Trip (E)" for the child at (-2.66, 16.48) moved him 0.6 m straight on to (-2.66, 17.08), 0.42 m from the child (her circle and his: 0.65 m); 12 commands of keys, arrows, Enter, a click and an 8 s wait moved him 0 m (steps 35-46). Both players quit there.
8. Ring entrance (desk only): the player saw the lit ring and walked for it ("The stage with the light!", step 33), so the light reads as the goal once it is in view.

## Not tested by this

The act's timing feel (the roll and crash run on the audio clock in wall time while the slow box draws a few frames a second), sound, real touch feel, a real phone. Nobody reached the act, the Mirror World, the shop or the end card, so this says nothing about them.
