# Stranger report: night 1 with the live fall act (desktop)

Kind: cold-read
Model: Fable 5.2 (claude-fable-5-2), subagent a9538143ade8874fd
Saw: `/tmp/cap/cold/` only: 17 desktop screenshots (1280x720) and the on-screen text of one play-through (52 screens); no design docs, no code, no intent.
Build: 36ceaf9 (session 36). Captured in two runs (session box, software GL), spliced in play order: (a) `smoke_night1.cjs` on desk with `N1.fallLive` served as false (the smoke's act steps still drive the old cue page), used for everything except the act; (b) `/tmp/probe/load_fall.cjs` for the board note, the live fall act (one Perfect, one late, one early) and its bow and caption. Step names were replaced by "screen N".

## Lead's notes on the capture (read before the findings; not the stranger's words)
- Screens 27-29 (room Laughs 33, 53, 105; "Into the Mirror: 105 Laughs") and the end card's "They laughed hardest at the act" / "Laughs earned 105" come from run (a), whose act was the old cue page with its hurt pay; the live fall act shown in screens 6-10 paid +10. The contradiction in findings 3 and 4 is the splice, not the game.
- Screens 38-39 (Laughs 89 -> 289) and the Mirror World beaten without a visible fight: the smoke sets Laughs to at least 300 and moves figures test-side to reach each check (`smoke_night1.cjs` lines 610-648). Finding 5 and part of finding 6 (shards) are the capture, not the game.
- Everything else (screens 1-26, 30-37, 40-52 text and the 17 screenshots) is what the build shows.

## The stranger's report (verbatim)

Basis: I read transcript.txt (52 screens) and all 17 screenshots in /tmp/cap/cold/, nothing else. I judged from stills and text only: no sound, no motion, no hands on the controls. Anything about feel is therefore a guess from what the screen shows.

## Scores (1-5, one line of reason each)
- Clarity: 2. The stage act is explained well (04_note), but the mirror half, the numbers (Laughs, Shards, Mask) and "the Performer" do not add up from what is shown (screens 27-50).
- Fun: 2. One timing gag done three times (screens 6-9) and a mirror fight whose goal I could not work out from the screen (screens 31-45); the best moments are things I read, not things I do.
- Want to play the next night: 3. The reflection that copies what I buy (16_shop) and the child's line (06_child) make me curious; the play itself does not.

## Ask-after questions
1. What is this game about? A circus clown who falls over on purpose for laughs, then sits at a mirror and goes inside it, where the laughs he earned are his health and he fights or dodges grey figures. Afterwards he buys tricks from his own reflection, and each purchase puts more paint on his face.
2. Who is the clown, and what does he want? A small, round, sad-faced man in a bowler hat and ruff (03_board: head down, hands clasped, frowning). I think he wants to be liked, and the only way he knows is to be laughed at. That reading comes from the Dazai quote (01_mirror), not from anything he does or says. He never speaks.
3. Was anything funny? Was anything sad? Funny: mildly, the Rigger's "Cable going down. Fall over it, they love that" (05_cable) and the Strongman's horn (screen 17). Nothing made me laugh. Sad: yes. The child at the ring entrance saying "...on purpose." after the Trip (06_child) is the best beat in the run. Also the clown's face at the board (03_board), "Silence: the house is still" after the bow (10_ring_bow), and the grey reflection pointing at him (11_mirror_glass).
4. What did the crowd laugh at most? The end card says "They laughed hardest at the act" (17_end_card). What I saw contradicts it: the act ended in silence with Laughs +10 (10_ring_bow), and the count then went 33, 53, 105 while he stood in a room (screens 27-29). So I do not know, and I do not believe the card.
5. What would make you play night 2? Finding out what the reflection does with the dash and sweep it "learned" (16_shop, 17_end_card), and whether the child comes back. I would need to see the Performer use them against me early in night 2.
6. One thing I'd change: make the mirror world say in one line what I am trying to do and when I have done it. Screens 31-45 show the same control line for 15 screens and then a quote; I never saw a win or a loss.

## What the game seems to say about life
The play says: you humiliate yourself on cue, to someone else's beat, and the reward for doing it right is a currency you then spend just to stay standing. Getting better at it costs you: "each perfect beat adds some" Mask, and every purchase adds a paint layer and arms the thing in the mirror (04_note, 16_shop). So skill and progress are both punished, which is a clear and bleak view. But I mostly read it. In play, one perfect fall of three gave me a silent house and still let me through, the Laughs jumped from 89 to 289 in the mirror for no reason I could see (screens 38-39), and I bought two upgrades without it hurting. What the game is out to get is the clown's own face, the self under the paint. I understand that from the text; nothing I did on night 1 made me feel hunted.

## Where I would quit, and why
Most likely in the mirror world, around screens 39-45. The hints alternate "Step past it. Stay on your feet." and "Three gags on its lamp." with no visible change, my health number rises by 200 unexplained, Shards stays at 0, and the figures (13_mirror_world_ring, 14_mirror_world_still) do not look like they are attacking. An earlier risk is screens 11-15 and 18-19: seven screens of corridor and wings with no text but the control line, right after the act, so the pace drops just when I should be told why I am walking.

## Findings
1. Screens 6-10, 07/08/09/10 ring screenshots. The clown is about 60 px tall on a 720 px screen and the band leader's stick, which is the tell I am told to watch (04_note), is a thin yellow line of about 30 px on a dark figure. Foreground crowd heads cover the bottom of the ring. The one skill moment in the night is hard to read.
2. Screen 10, 10_ring_bow. One perfect, one late, one early gives "Silence: the house is still" and +10, then "Walk back". No retry, no reaction from anyone, no sense of what a good night looks like. I cannot tell if I failed or if this is scripted.
3. Screens 27-29. Laughs go 33, 53, 105 while he looks around a room, and "Into the Mirror: 105 Laughs" is hit exactly. It reads as a number being filled in for me, so the laughs do not feel earned.
4. 17_end_card vs 10_ring_bow. "They laughed hardest at the act" contradicts the silent house. Also "Laughs earned 105" while the mirror HUD ended on 294 (screen 45). The summary does not match the night I played.
5. Screens 38-39. Laughs jump from 89 to 289. No text explains it. If this is the health bar, an unexplained +200 removes any tension.
6. Screens 31-45 vs screen 48. The HUD says "Shards 0" the whole time, then the shop says "He came out of the mirror with 3 shards". 16_shop shows 5 shard icons on the ledge, prices of 6 and 5 icons, and both items bought. The prices mean nothing if I can buy everything.
7. Screens 46-47, 15_leaving_mirror. The mirror ends on "In vain was all our labour." with no result. I do not know if I won, died or timed out. A faint "The Mirror" label shows through behind the quote's credit line, which looks like a bug.
8. 16_shop, 17_end_card. "The Performer" appears as a name for the first time in the shop and I was never told who that is (the reflection? an enemy in the ring?). "Spotlight sweep: Lent tonight" also confuses, because I picked The fall (screen 5) and never saw a sweep. The central threat is named but not introduced.
9. 13_mirror_world_ring, 14_mirror_world_still, 11_mirror_glass. Hint and HUD text is low contrast and in 13 the hint is drawn over a figure ("Step past it. Sta- on your feet"); in 14 the HUD and bottom line are greyed almost out. The only guidance in the hardest part is the least readable text.
10. 05_cable, 06_child, 03_board. The wings shot is crowded: the clown is behind a costume rack and three people, with a black rectangle on the floor at left that looks like a hole (a similar black slab sits under the table in 02_bravado). A stray balloon-like object is cut off in the bottom right corner of 06_child. On 03_board the card labels "The fall" and "The sweep" are tiny. These make the nicest-looking area feel unfinished.

Good points worth keeping: 04_note is the clearest screen in the run; "Press any key to finish the paint" (screens 2-3) makes me complicit in a nice way; 06_child and 11_mirror_glass are the two images I would remember.
