# Stranger report: night 1, cold read (22 Nov 2026, session 16)

Kind: cold-read

Who: a fresh agent on a different model (Fable) that had not seen the design docs, the owner's intent, the panel docs or the code. It was told only "you are a stranger trying a short browser game prototype" and had access to one folder.
What it saw: 9 desktop screenshots (1280x720) and the text a player could see on each screen (`design/stranger-night1/screens.txt`, 24 text screens), captured from `smoke_night1.cjs` with the new `TRANSCRIPT=` option (run: `ONLY=desk`, 27 of 27 steps OK, no page errors, game code as at 7b2880e). Screenshots are not committed (2 MB); rebuild with that command.
Limits: an automated player made the captures, so walking is skipped and some states are set by the check (see "Caused by the capture" below). An agent is not a person: this removes the panel's knowledge of the owner's intent, not the fact that it is a model. A human stranger (`design/STRANGER-TEST.md`) still comes first when the owner can get one.

## Caused by the capture, not the game

- Shop: both items show "(bought)" and the shard counts don't add up because the check sets shards to 11 and buys both; screenshot 08 is the first buy, the text is after the second.
- "Never saw the horn or the trip happen": the check teleports between verbs; screenshots exist only for the cable and the child.
- Mirror World "over in 7 seconds": the check beats the constructs by setting their hit points to 0.

## Findings that are the game's (owner to see)

1. **The act screen is developer notes** (screen 04): the cue page shows its own text about the approved model, Blender, 2D plates with parallax, night 2/3 buttons, timing windows, latency, hit vs take. "Where I'd most likely quit." The act itself was never seen in play.
2. **First hesitation at the board:** "The act is the cue: press when the ring fits the mask on his face" is not understood.
3. **Mirror World unreadable** (screen 06): a blue shape standing on the clown ("me, an enemy or a bug?"), five controls in one small line, no clear win or loss after.
4. **Numbers don't explain themselves:** the HUD shows "Laughs 0 · Mask 0" under "+105"; the room counts Laughs 22 then 105 with no reason given; Laughs, Mask, pies and shards never say what they are for.
5. **"They laughed hardest at the pie"** while the breakdown shows the act 45 and the pie 25: reads as a contradiction (the headline compares single items, the act total is bigger).
6. **The end card is a debug log**, and the only button is "Play night 1 again".
7. **"...on purpose."**: can't tell who says it or about what.
8. **Two speech bubbles overlap** in the corridor; the clown is small and hidden behind the crew.
9. What worked: the sad reflection (01, 05), the colour drain and crack, the crew banter ("Your pie. Don't eat it this time." was the one funny line), the creepy constructs, the reflection stepping closer ("a good creepy moment buried in tiny type").
10. "The shame of living: Spotlight sweep" reads as accidentally funny.
11. What would bring it back for night 2: "the reflection doing something on its own that I didn't do, big and on screen, right before the night ends", and a "Night 2" button.

Scores (of 5): clarity 2, fun 2, want to know what happens next 3.

## The report as written

> ## 1. What I think this game is about
> A circus clown walks to the ring, does a timing act for laughs, then goes into a dark mirror world where the laughs he earned get drained. It is a sad-clown game: being laughed at is the currency and it costs him something called Mask. Beyond that I can't tell what the goal is.
>
> ## 2. Who the clown is and what he wants
> A short, round man with ginger curls, a ruff and a red nose, who looks miserable in the mirror. The crew treat him as the one who falls over and eats his own pie. What he wants: I can't tell. The Dazai quote says clowning is how he courts people, so maybe to be liked. The game itself never says it.
>
> ## 3. Screen by screen
> - 01 (mirror, Dazai quote). I'd press "Go out to the ring". Good picture, the sad reflection lands. The Japanese line I skip. "Press any key to finish the paint" meant nothing to me. Keep playing: yes, curious.
> - 02 (corridor). I'd press E for the cable. Clear gold prompt. Two speech bubbles overlap and the clown is tiny and hidden behind the crew. Keep playing: yes, the crew banter is the most alive thing here.
> - 03 (ring entrance, child, "...on purpose."). I'd walk on. I can't tell who says "...on purpose." or about what. Keep playing: yes, the lit ring pulls me in.
> - Act board. "The act is the cue: press when the ring fits the mask on his face" is not a sentence I understand. First hesitation.
> - 04 (act instructions). Where I'd most likely quit. A wall of text talking to somebody else: "approved clown model", "rendered in Blender", "2D plates with parallax", "Clown model and room loaded". Then Night 2/3 buttons, timing windows, a latency setting, hit versus take, whiteface, crimson ring, chains. I'm on night 1 and only need "press Space when the ring fits".
> - Act and crowd. One word on screen: HIT. Then a result. The crowd result is the first clear feedback in the game. The HUD still says "Laughs 0 · Mask 0" underneath "+105".
> - 05 (grey mirror room, cracked mirror). I'd turn and sit. The colour drain and the crack are effective. The counter says Laughs 22 then 105; I can't tell why.
> - 06 (mirror world). I'd move, then get told off for moving. There is a blue shape standing on top of my clown; I can't tell if it is me, an enemy or a bug. A pale mannequin and an eyeball in a bush: creepy, good. Five controls in one small line at the bottom. "Stand still in the light" is clear. Keep playing: unsure.
> - 07 (Nietzsche quote). Nothing to do. I can't tell if I won or lost.
> - 08 (mirror shop). The reflection stepping closer is a good creepy moment buried in tiny type.
> - 09 (end of night 1). A debug log, not an ending. The only button is "Play night 1 again". Keep playing: no.
>
> ## 7. Three biggest problems
> 1. Screen 04. The act, the core of the game, is introduced by developer notes and settings.
> 2. Screen 06. The mirror world is unreadable: unknown blue figure, five controls, four enemies, no clear win or loss.
> 3. Screens 08-09. Laughs, Mask, Pies and Shards never explain themselves or add up, and the night ends on a stats dump.

(Sections 4-6 and 8-9 are summarised in the findings above; screens 08's shop details are left out where the capture caused them.)
