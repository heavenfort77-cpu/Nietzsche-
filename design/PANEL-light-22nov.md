# Panel: what the Light is (owner 22 Nov 23:08, session 20)

Owner: "presently once in the light you are kick out of the mirror world and mirror world is where your insecurity get you. you are fighting your insecurity. the light on last night is internal clarity, a spotlight on self and determined not to be constraint by insecurity. get panel to judge."

Judgement by one model playing 13 seats (12 judges and the story writer), not a playtest. Rules: `design/PANEL-RULES.md`. Blind round: subagent a2780aa8889c9bb87 (not told the owner's view). Vote and red team: subagent add2d543c0247ca71. Nothing is built from this panel yet: the owner decides.

## Stranger report

Source: design/STRANGER-night1-s20-cold-read.md

Cold read of this build (Opus, phone screenshots and on-screen text only): clarity 2, fun 2, want-next 2. On the Light: "It looks exactly like the stage spotlight from the act. Since it drains Laughs, I read it as against me: the audience's gaze pulling something out of me." Holding still: "That felt like hiding, or playing dead, not beating anything. I had to freeze until it stopped looking at me. Uneasy, not relieved." Leaving: "Leaving felt like losing, or like it never mattered, not escaping." Where it disagrees with this panel on clarity or fun, it wins.

## Facts from the code (83de597)

- `night1.html` `mwLight()`: the Light chases him; moving inside its beam drains Laughs (`light.drain` 6 per s, more after each escape); holding still in it `light.beatSecs` 3 s kills it (`killFoe`) and drops 3 shards.
- The Mirror World ends as a win when no construct is alive and the shards are picked up (`endMW('win')`); at 0 Laughs it ends as a loss (`endMW('lose')`, half the shards).
- So the build treats the Light as one of the insecurities. The GDD does too ("Monsters spawned by acts": the Light, beaten by standing still), while its final night makes the spotlight the safe place where the Performer's gags miss.

## Blind round

Score 1-5 for how well the Light as built fits the Mirror World and the final night's spotlight; harshest objection; one change. Written before the owner's view was shown.
- Story writer, 2: in the final the spotlight is where gags miss; here it is a monster, one image with two opposite meanings. Change: the Light never drains; constructs can't enter it; it fades when he stops in it.
- Nietzsche, 2: freezing until the gaze leaves is submission, not overcoming. Change: he turns to face the beam and stares it down.
- Dazai, 4: being drained by being watched is right; wrong that it is cured in 3 s. Change: it never goes out on night 1, it follows at a distance.
- Core gamer, 2: the winning move is putting the controller down. Change: slap and pie stay usable while he stands in the beam.
- Casual phone player, 2: it looks like the nice spotlight, so I walked in and lost Laughs. Change: flicker and hum before the first drain.
- Jam judge, 3: on theme, but the stranger's 2s say it does not land. Change: cut the tip; the first Light sits on the only path.
- Camus, 3: the Light dying turns stillness into a trick with a reward. Change: no shards; it stays lit on him, harmless.
- Chaplin, 2: a clown who stands still is not funny and nothing is staged. Change: holding still played as a visible refusal, arms dropping.
- Auguste clown, 2: the spot is the clown's home; a predator on night 1 spends the ending early. Change: it drains only while he performs gags in it.
- Clinical psychologist, 2: it teaches freeze-and-hide, which is avoidance, not acceptance. Change: posture rises; the hold ends by his action, not a timer.
- Indie critic, 3: one good idea buried under a pie-shooter that says the opposite. Change: the Light is the only construct on night 1.
- Streamer, 2: three seconds of nothing is dead air. Change: the act's laughter plays back distorted during the hold.
- Mobile producer, 2: clarity 2 on a phone means players quit in the first Mirror World. Change: a ring fills while he holds; the beam turns warm when he is safe.

## The questions and the votes (13 seats, owner's view shown)

| # | Question | First vote | After red team |
|---|---|---|---|
| Q1 | Adopt the owner's reading as the rule: the Mirror World is where his insecurities get him and he fights them there; the Light is not one of them; on the last night it is his own clarity. | First vote: 11 of 13 | 10 |
| Q2 | The Light on the nights before the last. (a) the way out every night: never drains, constructs and their hits cannot reach him in it, holding still in it takes him out with what he has; small, cold and far on night 1, warmer and nearer each night, on him on the last. (b) hostile early (the crowd's gaze), his own only on the last night. (c) no Light before the last night. | First vote: 7 of 13 for (a); (b) 3: Dazai, Core gamer, Streamer; (c) 3: Nietzsche, Camus, Indie critic | no red team (under 75%) |
| Q3 | Stillness as an act, not a freeze: posture rises, he faces the Light, a ring fills, the player's input ends the hold. | First vote: 11 of 13 | 10 |
| Q4 | Room and Mirror World lit soft and dim, the Light the only hard-edged warm light outside the act's follow spot. | First vote: 9 of 13 | no red team (under 75%) |
| Q5 | Leaving by the Light with constructs alive costs something visible (they wait in the corridor next night). | First vote: 11 of 13 | 10 |

What the panel would build first: Light (a) on night 1 (small, cold, far, never drains, constructs stop at its edge); the hold with one clearly prompted input; make it look unlike the act's follow spot; then back to a stranger. Risk it names for a judge's first five minutes: he walks straight into the Light, leaves having fought nothing, and "it never mattered" comes back; a far, small Light may also not be noticed.

## Red team

- Q1, Core gamer: "Take the Light out of the enemy list and night 1 is three targets for pie and slap. The Light was the only thing that asked for a different verb. The jam theme is 'out to get you', and you are removing the cleverest thing that was. The stranger's 'audience gaze pulling something out of me' was the one line of theme that landed." Jam judge changed to no.
- Q3, Streamer: "A ring filling is a progress bar on a feeling. Hold, then press again to end: nobody will guess the second input, and the stranger already scored clarity 2. Three seconds of a man standing up straight is dead air unless something answers him." Core gamer changed to no.
- Q5, Clinical psychologist: "If the Light is clarity, taxing its use says clarity is avoidance. That contradicts Q1 in the same night. The players who leave early are the weak ones, so night 2 stacks on exactly them. The stranger already felt 'leaving felt like losing'; this confirms it." Auguste clown changed to no.

## Dissent

- Dazai, Q1: "The eyes of others are the insecurity. A kind light on night 1 is a lie he hasn't earned."
- Indie critic, Q1: "It still looks like the follow spot. A rule the picture contradicts is not a rule."
- Jam judge, Q1 (after red team): "A friendly Light leaves nothing clever hunting me in the minutes I play."
- Dazai, Core gamer, Streamer, Q2 (b): "Being chased by the crowd's gaze is the game. The turn on the last night only works if it was against him."
- Nietzsche, Q2 (c): "Clarity handed out nightly is comfort. It comes once, and he makes it."
- Camus, Q2 (c): "A door out every night is hope. Let him stay in it until the end."
- Indie critic, Q2 (c): "One appearance is the strongest image you have. Don't spend it seven times."
- Dazai, Q3: "On night 1 he should hold badly, shoulders in. Rising posture belongs to the last night."
- Casual phone player, Q3: "I won't know when to let go. Just finish it for me."
- Core gamer, Q3 (after red team): "Two inputs with no prompt is a guess."
- Casual phone player, Q4: "Dim on dim, on my phone, outdoors: I see nothing."
- Mobile producer, Q4: "Low-contrast scenes fail on cheap screens. Constructs need their own readable edge."
- Indie critic, Q4: "Soft teal everywhere is mud."
- Jam judge, Q4: "It keeps the follow spot as the exception. That lookalike is what confused the stranger."
- Casual phone player, Q5: "You gave me an exit and then punish me for using it."
- Mobile producer, Q5: "Carry-over snowballs on the weakest players."
- Auguste clown, Q5 (after red team): "The clown who rests should not be scolded."

## Producer notes (lead, not a vote)

- The stranger read the built Light as "the audience's gaze" and the hold as "hiding, or playing dead". That is evidence against the build for the owner's reading, and it is also the evidence the (b) seats use for theirs. Q2 is split 7 / 3 / 3: not a consensus. Owner to choose (a), (b) or (c).
- (a) changes the GDD: the Light leaves the monster table, and "the player learns three times that stopping works" falls to two (the Neighbour, the Double) plus the Light as the exit. It also needs a new rule for what ends the Mirror World (now: all constructs gone).
- Q4 is where "softer" would land if the owner meant the picture and not the music; this session read it as the music level (`musicSoft`).
- Owner, 22 Nov 23:22, after reading the votes: "last night light is a spotlight on him not by monster". The last night's spotlight is his own and is not the Light construct; the construct stays an insecurity on the earlier nights. Q2 is closed that way. Open: the construct and his spotlight must look different (Indie critic's and Jam judge's dissent, the stranger's finding 6).

## Round 2: the owner's own wording (owner 22 Nov 23:24: "one more panel round")

Subagent aee7fdc4d29fc5ae9, same 13 seats, same stranger report, round 1 results shown. Question as the owner worded it: the Light construct stays a monster, one of his insecurities, on the earlier nights; the last night's spotlight is a separate light, his own, on himself, "not by monster".

| # | Question | First vote | After red team |
|---|---|---|---|
| R1 | The owner's reading exactly as worded. | First vote: 9 of 13 (no: Nietzsche, Camus, Auguste clown, Indie critic) | no red team (under 75%) |
| R2 | How the player tells the two lights apart: (a) colour and edge only; (b) source and behaviour: the monster's beam comes from a visible lamp-headed figure and hunts him, his has no lamp, opens around him and moves only when he moves; (c) both; (d) the same look on purpose. | First vote: 6 of 13 for (b) (Dazai, Core gamer, Jam judge, Chaplin, Auguste clown, Psychologist); (c) 3: Story writer, Casual, Streamer; (d) 3: Nietzsche, Camus, Indie critic; (a) 1: Mobile producer | no red team |
| R3 | The monster Light on the earlier nights: (a) as built, hold still 3 s and it goes out; (b) it cannot be put out before the last night, holding still only stops the drain; (c) beaten by an active clown answer (face it and bow), stillness saved for the last night. | First vote: 8 of 13 for (c) (Story writer, Core gamer, Casual, Jam judge, Chaplin, Auguste clown, Psychologist, Streamer); (b) 4: Nietzsche, Dazai, Camus, Indie critic; (a) 1: Mobile producer | no red team |
| R4 | On the last night the monster Light is seen once more and fails (finds him, he does not move, it goes out by itself) just before his own spotlight opens. | First vote: 10 of 13 (no: Dazai, Camus, Indie critic) | 9 |

Where the panel still disagrees with the owner: four seats reject two lights and want one light whose meaning changes; ten of 13 (R2 a, b, c) say the monster must stop looking like the stage follow spot, which is how it is built; twelve of 13 reject hold-still-to-kill as built on the earlier nights.

What it would build first: a visible lamp-headed source for the monster Light with a warning before the drain; face-it-and-bow in place of hold-still; then night 1 back to a stranger. Risk it names: a judge who stops after night 1 never sees the second light and may read the lamp-head as one more enemy with one more rule in a build scored 2 for clarity.

Open question from the red team, for the owner: whose spotlight is the Performer fight held in (GDD: "beaten by standing still in the spotlight")?

## Round 2 red team

- R4, Jam judge (voted yes): the last night already has the Performer beaten by standing still in a spotlight. The monster Light failing the same way plays that beat twice, and then a third light opens. "Goes out by itself" gives the player nothing to do at the peak. The design doc does not say whose light the Performer fight happens in; if it is the monster's, R4 is already there. Mobile producer changed to no (an extra scene for a repeated beat).

## Round 2 dissent

- Nietzsche, R1: "A clarity that arrives as a second lamp is a gift. What hunted him should be what he finally stands in."
- Camus, R1: "The light should not care about him. Two lights give the world a moral."
- Auguste clown, R1: "A spotlight that bites on night 1 teaches the audience the trick before the finale."
- Indie critic, R1: "Two lights is tidier and weaker. The change should be in him, not in the lamp."
- Story writer, Casual, Streamer, R2 (c): "Phones in daylight lose colour and small screens lose shapes. Use both."
- Nietzsche, Camus, Indie critic, R2 (d): "Same light, different man. That is the whole ending."
- Mobile producer, R2 (a): "A tint and an edge is one afternoon. A lamp-headed figure is a new character."
- Dazai, R3 (b): "He cannot put out other people's eyes on night 1. He can only stop feeding them."
- Nietzsche, Camus, Indie critic, R3 (b): "If it dies early, the last night has nothing left to overcome."
- Mobile producer, R3 (a): "It is built and it works. The stranger's problem was the look, not the rule."
- Dazai, R4: "The gaze never goes out. He stops performing for it."
- Camus, R4: "He should walk out with it still burning."
- Indie critic, R4: "This is an explanation scene. Trust the player."

Producer note: the night-1 cast proposal already draws the Light as a figure with barn doors (`art/cast2/PANEL.md`: "Light with two barn doors"); whether the page shows that figure or only the disc and cone was not checked this round. R3 (c) would change the GDD's "learns three times that stopping works" (the Light leaves that list).

Owner decision 22 Nov 23:28 (R2): "my take currently is a pale white light. last night as a warm bright light". The monster Light stays pale white; the last night's own spotlight is warm and bright. Colour, not a lamp-headed figure. Fact from the build (`night1.html` lines 2289-2316): the monster is already pale (`#DCE8EA`, opacity 0.32 disc / 0.14 cone) and the act's follow spot already warm (`#FFE2AE` / `#FFE9C4`, opacity 0.34 / 0.09), and the stranger still wrote that the Light "looks exactly like the stage spotlight from the act". So the colour gap as built did not read on a phone; the last night's light is not built. Open: R3, R4, whose spotlight the Performer fight is in.
