# Stranger: night 1 cold play for the theme panel (session 42, 25 Nov 2026)

Kind: cold-read
Build: d8e5541 (`web/step0/night1.html`, `?tester` marker on as in sessions 38-41)
Player: fresh agent on Fable, no design docs, code or owner intent; only `tools/coldplay/play` and its screenshots. Desktop 1280x720, keys and mouse. Brief: an adult who plays a few indie games a year "that mean something", reads what the screen shows. 60 commands (59 game steps + quit). Log `/tmp/coldplay/s42theme/log.jsonl` on the session box (not committed); step lines below from `tools/coldplay/summary.py`.
Page errors: 0. Software GL on the session box (fps 0.7-14.5): timings are game time, the game is frozen between commands.

## Player's report (verbatim)

1. Furthest point: "End of night 1" screen (step 59), reached by losing. Act failed (two missed falls, act cut), +15 Laughs, Mask 0; died in the Mirror's white-paper room; shop with 0 glass; "The shame of living: nothing bought tonight. He got up."

2. Scores: clarity 3, fun 3, want to play night 2: 4.

3. What it says about life (from what I did): you paint a smile on and offer people the only thing you have, which is falling over for them, and most of them do not react. The applause you scrape together is the only thing you have to live on later, alone, and it is never enough: defending yourself costs the same currency as surviving. When I failed, the crowd "laughed hardest at the trip", so even my failure was consumed as the act. At the end you have nothing, you are told that is shameful, and you get up anyway.

4. Hands score: 4. The spotlight walked away from me twice, the timing window shut before I could act, the act was cut after two misses with no third try, and my health went 13 to 4 in one key press; I never felt I had enough to work with.

5. Moments that carried it best:
- Steps 24-30: the spotlight leaves you standing in the dark, you chase it, press on gold and get "Too late. He fell into silence", then "Two misses. The act ends."
- Steps 51-53 plus 57-59: told to drop to shake the clinger off, the drop cost 9 Laughs not 1, dead a step later ("In vain was all our labour"), then a shop where "free tonight" is greyed out and "kept half his glass: 0".
Honourable mention, step 21: "He trips, and he meant to. The child saw."

6. Moments that worked against it or felt like another game:
- Steps 16-17: the Strongman's "For luck! Give it a honk" and "laughs out loud". Warm and friendly; life was on my side there.
- Steps 46-49: the Mirror turns into an action game with slap/pie/drop keys and a Pies/Glass counter. A full line of controls at once, and my slap cost 2 Laughs with no visible result. Also step 31: failing the act still paid +15, which softens the blow.

7. Moments I did not know what to do:
- Step 5: "The act board is next" with no board in view; guessed S and it worked.
- Steps 12-14: Wings camera turned, unclear which key is "forward"; got stuck between the white clown and the pie woman, slid with D.
- Step 15: fell over the rope and nothing reacted until the next step; thought it had done nothing.
- Steps 21-22: walking to the ring was very slow, three 3-second holds; two text lines overlapped on screen at 21.
- Steps 25-29: did not understand the fall timing. Gold showed, pressed, "Too late"; second time the window passed during a 0.2 s nudge. Never saw what a correct fall looks like.
- Steps 32-33: a giant fist sticking into the bottom-right corner, no idea what it was.
- Steps 35-38: return through the Wings blocked by the white clown; tried A, W+A, S, then S+A.
- Steps 39-43: "Turn to the mirror wall and sit": the Dressing room wall has a mirror, so I stopped there and waited; no sit button; the real one was one more turn. Laughs/Mask readout is hidden under the Full screen button.
- Step 48: "Hit it from the side" with two creatures; unsure which, or whether I was at its side.
- Steps 51-52: "Drop to shake it off" then at once "Step past it. Stay on your feet"; unclear what took 8 extra Laughs.
- Steps 57-58: "Light sweep, Free tonight" is greyed out and shows six gems; clicked, nothing.

Note on method (player's): the game is frozen between commands, so the fall timing at steps 25-29 may be harsher in this harness than for a live player; I cannot tell which from inside the run.

## Player's words during play (selected, from the log)

- 3 "Paint the smile on. That's a bit grim already." 5 "Clowning as a last attempt to be loved by people. Sad."
- 9 (act note, More) "Doing well paints the mask on harder, and that makes the mirror worse? So success costs me. Interesting."
- 15 "the game offers me a pratfall backstage, for the coworkers. Sure, clown for them too." 20 "Every person I meet, the only verb I get is falling over for them."
- 22 "'The child saw.' She caught that it was fake. That stung a bit."
- 25 "The spotlight walked off me while I stood still. I have to chase my own light."
- 31 "Two misses and they pull the act. No third try. I didn't even get one laugh. That's humiliating in a way that feels on purpose."
- 32 "'They laughed hardest at the trip.' Which trip? ... So they laughed at my failure, not my act. And I still got paid 15 laughs. Hm."
- 39 "Nobody here has anything to say to me after the flop, which is its own kind of answer."
- 41 "The act board, drained of colour. Nice touch." 46 "hand to hand with the grey one. Best image so far."
- 52 "To get it off I have to fall down, and falling costs a laugh. Even self-defence is a pratfall."
- 54 "'In vain was all our labour.' ... I never had enough to begin with." 56 "Stand up, I suppose. That's all anyone can do."
- 60 "'The shame of living: nothing bought tonight. He got up.' That last line got me a little."

## Lead's notes (from the log's hidden state, not the player's words)

- The act: 0 falls landed; Laughs 0 -> 15 after the act cut (the crowd pays for the trip, as the facts say). Mask stayed 0 all night.
- Mirror World entered with 15 Laughs; lost in the void (`result: lose`) with whisper, stare and shame up.
- Seen and not yet probed (fault rule before any change): the shop shows "Light sweep, free tonight" greyed with a six-shard price after the night's act was the fall; two text lines overlapping at step 21; the "giant fist" at steps 32-33 (likely a near figure's hand in the walk-back shot). Listed in HANDOFF open items.
