# Stranger report: night 1, session 20 build (phone portrait)

Kind: cold-read
Model: Claude Opus (subagent `a411b14f38460c732`, model "opus"; the lead and the panel run on Fable 5.2)
Saw: 17 phone screenshots and the on-screen text of one play-through, test step names removed; no design docs, no code, no intent.
Build: 83de597 plus the session 20 music level (`musicSoft`), captured with `ONLY=phone TRANSCRIPT=... node web/step0/smoke_night1.cjs` (`RESULT night1 smoke 59 of 59 pass`). The agent could not write files; its reply text is copied here verbatim below this line.

## Scores (1-5)
- Clarity: 2. Every screen tells me which button to press, but I could not tell what Laughs, Mask, Pies, Shards or paint actually do, and the numbers contradict each other.
- Fun: 2. It looks good and has a mood, but the play is tap a gold button, tap HIT once, then a short walk where standing still is the main move.
- Want to play the next night: 2. The end screen only offers "Play night 1 again", with no night 2, and I don't know what I'd be working towards.

## Where I would quit, and why
At the shop (shop_learn). I'm offered "Spotlight sweep" and "Dash" but never told what buying them does or what it costs me. The caption says the Performer did "the spotlight sweep" when the text log says "dash", and then the night ends. Nothing tells me I won or lost.

## What I understood the game to be about
A sad clown paints his face, picks a pratfall act, gets laughed at, and then sits in front of a mirror. The quotes from Dazai and Nietzsche say his clowning is a mask he wears for people and that the effort is wasted. Each night the mask seems to get thicker ("Mask 3", "paint layer").

## The second world (the part after the mirror)
1. A dark teal copy of backstage: a corridor of grey mirrors leading to a pale door, then a round empty ring.
2. A grey statue-like figure with a ball for a head (left in mw) and a lumpy blob with an eye (right). From the text, one of them is probably "Shame", which "clings and slows you", but I couldn't tell which is which.
3. It looks exactly like the stage spotlight from the act. Since it drains Laughs, I read it as against me: the audience's gaze pulling something out of me.
4. I stand still for 3 s and it goes out. That felt like hiding, or playing dead, not beating anything. I had to freeze until it stopped looking at me. Uneasy, not relieved.
5. It cuts to "In vain was all our labour." on black. Leaving felt like losing, or like it never mattered, not escaping. Laughs jumped to 262, then the end screen says I earned 105.

## Findings
1. phone_* (all gameplay): the game sits in a thin strip and about 60% of the phone screen is black. Everything is tiny.
2. act: the developer text "Clown model and room loaded (2.5D: 3D clown, 2D room)" and the label "[act screen]" are shown to the player.
3. caption: I'm told to tap HIT when the ring closes, then told the pie in his face got the bigger laugh. Did I fail or succeed? Laughs are +105 either way.
4. entry / mw / end: the numbers don't agree. Laughs reads 66 then 105 at the tent exit, 262 in the Mirror, then "earned 105" at the end. Shards reach 3, but I never learned what they are for.
5. shop_learn: the caption names "spotlight sweep", while the text log names "dash (mirror)". "Lent tonight. Buy it and it is yours" is unclear, and no price is shown.
6. mw: the hint is the only way to learn the Light rule. The Light looks like the friendly spotlight from the act, so I couldn't read it as a threat before it hurt me.
7. walkon / routine: the act plays itself out. I watch the clown fall with nothing to do.
8. end: "The shame of living" lists what I bought as shame, but I was never told buying was bad, so it reads as a trap I couldn't see coming.

## One change I would make first
Make the game fill the phone screen and remove the developer text. Then make one number, Laughs, consistent from screen to screen and say what it is for before the mirror.
