# Stranger report: night 1, full build (phone portrait)

Kind: cold-read
Model: Fable 5.2 (claude-fable-5-2)
Saw: 14 phone screenshots and the on-screen text of one play-through; no design docs, no code, no intent.
Build: ad627c5 (session 17 batch 2), captured with `ONLY=phone TRANSCRIPT=... node web/step0/smoke_night1.cjs` (45 of 45 pass). The agent could not write files; its reply text is copied here verbatim below this line.

## Scores (1-5)
- Clarity: 2 — I always knew which button to press next, but never what Laughs, Mask, Shards or the Mirror World enemies were for.
- Fun: 2 — the only skill I could see was one timing tap and "stand still"; the rest was walking and pressing the gold button.
- Want to play the next night: 3 — the mood and the "what you buy, he learns" idea pull me, but the end card only offers "Play night 1 again".

## Where I would quit, and why
In the Mirror World ring (phone_mw.png). I arrive with three buttons (SLAP, PIE, FALL), two strange figures, a Laughs number that is already dropping, and a top line still telling me to find the pale door I just walked through. Nothing says what the figures are, what hurts me, what each button does to them, or what winning looks like. If I got through that, I would quit at the end card, because the night finishes with a list titled "The shame of living" and a replay button, with no next night.

## What I understood the game to be about
A sad clown paints his face at a mirror, goes on stage, and gets his biggest laughs when he is hurt, not when he is good. Afterwards he goes into the mirror, spends those laughs fighting things, and buys tricks that his reflection (the "Performer") copies, each one adding paint to a mask. I think the mask growing is bad and wiping paint off is the small good thing, but I am guessing.

## Findings
1. All walking screens (phone_paint, phone_board, phone_cable, phone_child, phone_walkon, phone_routine): the picture is a strip about a quarter of the screen high with black above and below. The clown is fingernail-sized. Only the act screen fills the phone. This is the first thing I noticed and it makes the game look broken, not moody.
2. phone_mw.png: the top line still reads "The mirror corridor. The way to the ring is the pale door." while I am standing in the ring. No line says what the pillar figure or the eye-blob are or what to do to them. I did not know what to do.
3. phone_mw_corridor.png / phone_mw.png: the FALL button sits on top of the bottom hint, cutting off "Lift your thumbs to stand still", which later turns out to be the one rule that matters (the Light). There is also no visible stick, so "Stick: move" points at nothing.
4. phone_act.png: the cue page says "Clown model and room loaded (2.5D: 3D clown, 2D room)." That is a developer note in the player's face. The "Night 1 Laughs 0 Mask 0" line at the top is dimmed almost to invisible.
5. Transcript, act: Laughs and Mask stay at 0 during the HIT screen, then jump to "+105 · Mask 2" on the caption. I never saw a laugh land when I tapped, so the timing game felt disconnected from its score.
6. Transcript, back in the room: "Laughs 59 · Mask 2" directly above "Into the Mirror: 105 Laughs". Two different Laughs numbers on one screen. I did not know which was mine.
7. phone_board.png: the two act labels overlap; "The deliberate fa..." is cut off by "Spotlight sweep", and both cover the cards on the board. I could not read my first real choice. I also never saw what the choice changed: the caption afterwards talks about a pie.
8. phone_shop_learn.png: card text is grey on near-black and hard to read. "Spotlight sweep (bought)" still says "Lent tonight. Buy it and it is yours." The price pips (6 and 5) do not match the 5 shards shown, and the play text said Shards 3. I could not tell what anything cost or whether I could refuse. The line under it ("does the spotlight sweep back at him, slightly too well") is the best writing in the build.
9. phone_end.png: "Cube room: Mirror" shows through the end card, "Details" is a tiny tap target, and the only button is "Play night 1 again". "The shame of living:" followed by a shopping list is a strong idea, but "Mask 3" is never explained, so the sting is half lost.
10. phone_caption.png: "The pie in his face got a bigger laugh than a clean beat." This worked. One sentence told me what the game thinks of its audience. It is the moment I started caring.
11. phone_child.png: he trips, then the bubble says "...on purpose." Small, funny and sad at once. It worked, though the two figures are so small I had to squint to see there was a child.
12. phone_cable.png: five or six tiny figures in a cluster and I could not tell which was me. The gold "Pratfall over the cable" button is big and clear, the best control in the build, but it means I only ever press what I am told.
13. Title and room hints on a phone: "Walk: WASD or arrow keys" and "Look around: A / D or arrow keys" come first, and the room hint stays on screen after I have already sat down (phone_entry.png). Keyboard text on a phone is noise.
14. phone_nietzsche_out.png: "The Mirror" title ghosts through behind the quote, and the credit line ends in "(Common)", which means nothing to me. The quote itself lands after a fight I did not understand, so "In vain was all our labour" read as a comment on my confusion.

## One change I would make first
Make the picture fill the phone screen on every walking and Mirror World screen, the way the act screen already does, so I can see the clown and what he is doing.
