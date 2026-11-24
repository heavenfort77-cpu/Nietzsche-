# The Clown and the Mirror: current design (jam build, 18 Nov 2026; owner decisions to 23 Nov 2026)

Copy of the "Current design" part of the live design doc: https://claude.ai/artifact/Dg9iLQj6ZrECRh79T4vsow
The live doc also keeps the earlier design (before 16 Nov 2026) for history; where they differ, this part wins. All features and graphics quality are required: nothing here is cut for scope.

**Where this copy and the live doc differ, the live doc wins, with one exception:** the owner decisions of 22-23 Nov 2026 in the second list below are written here first (session 20). On those points this copy is ahead of the live doc and wins until the live doc is updated.

**Owner decisions, 22 Nov 2026 (written into both docs):**
- The act is performed in the centre ring (as below), not in the cube room.
- Laughs are spent only in the Mirror World; nothing backstage costs Laughs. The dressing-table proposal is off.
- Shop prices are shards, shown as shards (pieces on the mirror's ledge), never as number tags.
- Frame rate comes first: 60 fps or higher on desktop, 60 fps minimum on phone. Where a budget and the frame rate conflict, the frame rate wins.

**Owner decisions, 22-23 Nov 2026, session 20 (panels: `design/PANEL-light-22nov.md`, `PANEL-ending-22nov.md`, `PANEL-action-22nov.md`). These replace the earlier rule that stopping wins:**
- **Acting, not standing still.** "The mirror world is where your insecurity get you. You are fighting your insecurity." "Standing still is not taking action and no action insecure will alway gnaw." Insecurity is only beaten by acting. While an insecurity is up and he does nothing, the screen edge darkens at once and, after a 1 s warning, his Laughs drain until he moves or throws a gag. Built in night 1 (session 20 batch 2).
- **The Light is a monster**, pale white with a hard rim. It is put out for the night by gags landed on its lamp (three), never beaten: the dark lamp stays, turns to follow him and clicks, and it returns the next night with a beam 15% wider. Built in night 1.
- **The last night's light is his own.** "A spotlight on him not by monster": warm and bright, "internal clarity, a spotlight on self and determined not to be constraint by insecurity". It is a different light from the monster and is never attacked.
- **The Performer is himself and is beaten by gags**, not by standing still. On the last night the clown has lost every act he bought and has only the original three skills (slap, pie, pratfall). The Performer holds every act the clown bought and attacks with them; each attack has a tell, so he dodges and strikes. The more Mask he has, the more HP the Performer has.
- **The ending is a choice.** After the last insecurity is beaten he is bathed in the warm light; the audience appears one by one, clapping, heard and then cut to silence "like Evangelion"; two worded buttons appear: (1) he bows, says "I quit" and walks out of the ring, leaving his insecurity; (2) he performs one last act, shown with no judgement: he goes on with the endless fight.
- **Laughs are limited and the player must know it**, or he will spam gags: each gag button shows its cost, the count shows every spend and turns red when low. Built in night 1.
- Lead's starting values where the owner gave none (he can change them): tells at least 0.6 s, each with its own sound; Performer HP never below the base when nothing was bought and capped at 1.4 times the base.

## Concept and theme

A sad clown performs slapstick to earn Laughs, and those Laughs are what he fights his own insecurities with in the Mirror World. The game itself is what keeps him on stage. At the end the choice is his: quit, or go on.

**Theme: Dazai and Nietzsche, with the game read as life.** The jam theme, "the game is out to get you", is read as life being out to get you, and Dazai and Nietzsche are what drive it. Dazai gives the trap: Yōzō clowns to survive people and "society" (世間), a performance only one person sees through. Nietzsche gives the mask, the actor who becomes his role, and the same show repeating night after night. The circus, the crowd, the shop and the Performer are life asking him to keep playing the role. The Mirror World is where his insecurities get him, and he fights them there.

**Jam theme: "the game is out to get you."** The circus, the crowd, the shop and the final boss all push him to keep performing, and the crowd laughs hardest when he is really hurt. Doing nothing is no shelter: insecurity gnaws at a man who takes no action. The theme shows in play, not only in story:

- The shop always has one more act to sell.
- The circus members' tutorial lines turn into game prompts ("one more show!").
- The reflection's one-frame lag grows each night.
- On later nights the whiteface's call lies about the timing (the mask cue stays honest).
- On the last night the menu's Quit option is greyed out until the Performer is beaten.
- The Performer is built from what you bought: every act bought is one more attack it has, and every paint layer is more HP.
- In the Mirror World, standing still drains him.

## The night loop

Each night runs the same route; what changes is how the world treats the clown.

1. **Title and opening.** The title screen is the closed curtain; Start opens it. The clown sits at the changing-room mirror with his face half painted. The player's first input finishes the paint, so the mask goes on as the first action. A Dazai line appears before each show.
2. **Corridor (tutorial).** He walks to the ring past circus members, one verb each: walk past the stagehand, jump the cable a rigger lays, take a prop from the props girl, honk the horn the strongman hands over. Same route every night; their lines go from warm (nights 1–2) to polite to saying the clown's lines before he does.
3. **The one who sees.** One figure, a stagehand's child, watches him do a deliberate trip and quietly says "on purpose" once. No meter changes. The child stands at the exit at the end.
   - Owner, 24 Nov 2026: after her "...on purpose." his own thought shows over the picture (not a speech bubble): "I do it to feel I belong. But when the act ends, whether it went well or not, I always feel I have lost a part of myself." The walk to the ring waits until it has been read. Words in `night1.html` CONFIG `belongText` (owner's meaning, lead's wording).
4. **Centre ring.** The camera sits low behind the back rows: the clown faces the player, the crowd is backs of heads. Warm spotlight on him, crowd in dark silhouette.
5. **Choose an act** from a board backstage: the acts you own plus one unowned tryout each night. On night 1 the board also lends the spotlight sweep for free. The mirror routine unlocks on full mastery or on the last stage night, whichever comes first.
6. **Perform** in the centre ring with the clown-face timing cue (see Stage).
7. **Crowd reacts**; Laughs charge.
8. **Walk back** down the same corridor, empty, work lights on, no lines.
9. **Into the mirror.** He sits; the reflection is one beat late, and that is the way in.
10. **Mirror World fight** against insecurities spawned by the act just performed, spending Laughs.
11. **Out of the mirror:** a Nietzsche line; defeated monsters drop shards.
12. **Mirror shop** in the changing room (the hub). Then the next night.

The changing room is the hub for both losing and winning: if he loses in the Mirror he wakes at the mirror keeping part of his shards. The number of nights is set by how much gets built: at least 3 (the jam build), up to 7.

**Nights 2 and 3 (built 23 Nov 2026, session 24 batch 1; lead's defaults where the owner gave none, each a CONFIG value).** The jam build has 3 nights and night 3 is the last (the final night). The end card's "Go on to night N" starts the next night as a fresh page; Mask, shards, what he bought, the acts he has tried and the Light's widening carry over; Laughs do not (each night's act earns its own). Tonight's board holds the fall, every act he bought, and one tryout: night 1 the spotlight sweep (lent), night 2 the talking scale, night 3 the soldier drill (an owned one passes to the next unowned act). The shop sells an act once he has tried it; tit-for-tat is sold from night 2 without a tryout. Prices: sweep and scale 6 pieces, drill 7, tit-for-tat 8, dash 5 (to tune). The timing cue uses the night's tempo, and from night 2 the whiteface steps into the ring and bar games (take with K or TAKE). The crew's lines turn polite on night 3. The new acts' routine after the cue is the fall's until the art pass. Quotes: night 2 Dazai "I have lived a life full of shame.", Nietzsche "All is empty, all is alike, all hath been!" (Zarathustra II, "The Soothsayer", Common); night 3 Dazai "He was a good child, like a god.", Nietzsche "I refuse to be a saint; I would rather be a clown." (Ecce Homo, Ludovici 1911), the GDD's candidate for the final line.

## Meters: Laughs and Mask

Two meters only. Attention is no longer a meter: the crowd's bodies show it (leaning in, coughing, phones out, walking out).

| Meter | Comes from | Used for | Shown as |
| --- | --- | --- | --- |
| Laughs | The crowd, on stage | Health and ammo in the Mirror World; every gag spends Laughs, every hit taken costs Laughs, and doing nothing drains them | One counter; each spend shows beside it, and it turns red when low |
| Mask | Performing: each perfect fit adds a little paint; each shop purchase adds a paint layer | Higher Mask makes the Mirror World more aggressive and gives the Performer more HP | The clown's face paint in every scene; it cracks under strain |

- **Perfect hits pay clearly more Laughs**, and both meters move together on screen, so the trade (more Laughs, more Mask) reads as a choice, not a punishment.
- **Laughs floor:** the free starting act (the deliberate fall) always earns a small guaranteed amount, so a bad night can't lock the player out of the Mirror.
- **Losing in the Mirror** costs shards, never the run.
- **Laughs are limited and shown as limited** (owner, 23 Nov 2026): each gag button carries its cost (SLAP -2, PIE -3, FALL -1 on night 1), and the first spend explains it once.

Laughs are spent only in the Mirror World: nothing backstage costs Laughs (owner, 22 Nov 2026). The changing room shows what the act paid (the Laughs count and the paint the Mask added) before he goes in.

## Stage: acts and the clown-face cue

Acts are chains of timed beats, adapted from the Additions in *The Legend of Dragoon* (the mechanic only, not its look). The cue is a clown face, so the mask fitting his face is the input.

**One timing game per act (owner, 23 Nov 2026 09:23, pitch `design/PITCH-timing-games-and-mirror-styles-23nov.md`).** Same buttons, same windows, a drum on every beat; the picture never lies, only voices and the crowd may. Deliberate fall: the fall itself, in the light, on the crash (note above; replaces the mask ring for this act, owner 24 Nov). Spotlight sweep: hold HIT when the ring meets the mask, let go when the light pool shrinks onto the pan (2 beat gaps later); the ring is scored once, by the worse of press and release. Talking scale: a needle swings through a gold zone on the beat, the zone narrows each beat of an act (good window x1, x0.85, x0.7, never below perfect + 20 ms). Soldier drill: the whiteface taps a pattern (gaps of 1 or 2 beats), he taps it back 2 beats after the last tap; from night 2 the whiteface's "hup" on each answer comes 90 ms late, the drum stays on time. Tit-for-tat: neighbour's turn, then his, each exchange 8% faster, capped at 1.4x; the neighbour's hand is seen 0.5 s before it lands. The mirror routine and the encore dial stay as written below. Built in `cue_model.html` (CONFIG `game`, `?game=`); the board passes each act's game. At the act board the player can try the act's timing game first (rehearsal: one act, nothing counts) and is told what Laughs and Mask are (owner 09:23).

**The deliberate fall as the act (owner, 24 Nov 2026 14:33; design note, session 34; prototype next).** Player Kay (24 Nov): he chose "fall" for the show, so the act should be falling, practised in the corridor by tripping on purpose; falling at the right time or place fits the story better than pressing when a circle closes on his face; and "more clear goals would be helpful". Owner: "i think she is right ... theme and story is more important". So the deliberate fall act drops the mask ring. The other acts keep their own timing games until the owner says otherwise.

- **Story link.** This is Yozo's fall from the horizontal bar in *No Longer Human*: he fails on purpose, the class laughs, one boy (Takeichi) says "on purpose". In our corridor the child already says it; the ring is the same fall done for the house. After the trip for the child his thought says why he does it and what it costs (night loop step 3).
- **One input, learned in the corridor.** The fall is the corridor's own fall: same button (Space or the gold button on phone), same clown trip (stagger, dive, belly flop, get up). The rigger's cable and the child are free practice with no score. The act note on the board gets a one-line goal: "Fall in the light, on the crash."
- **One fall (a beat).** He walks the ring with the walk controls. (1) Place: a spotlight pool marks the spot on the sawdust; it settles and brightens for 0.8 s before the beat can start (tell). (2) Time: when he stands in the pool a drumroll starts (night 1: 1.6 s), the band leader's stick rises in the last 0.5 s (visible tell, at least 0.4 s on every night), and the cymbal crash ends it. He must press early enough that his belly-flop lands on the crash: the trip's landing comes a fixed time after the press (the clip's land key), so the skill is committing before the beat, like a real pratfall. The dive is turned side-on to the house as in the corridor (panel 22c fix 3: a dive at the camera hides the fall), so facing is not scored.
- **Grades.** Perfect: landed within the perfect window of the crash, inside the pool; big laugh, a little paint added (Mask). Good: in the pool and within the good window; small laugh. Miss, three kinds, each with its own picture and sound so the player knows why: out of the light ("nobody saw it": crash on an empty pool, murmur), early (he is lying down when the crash comes, silence, a cough), late (crash on a standing clown, he falls into silence). No drumroll repeats; two misses end the act, as before.
- **Act shape.** Rule of three: three falls, the pool moving to a new spot each time (walk 2-4 m), then the bow as the topper (no score). About 20-30 s.
- **Nights (caps about 1.4x).** Night 1: pool radius 1.2 m, drumroll 1.6 s, perfect window plus or minus 120 ms, good plus or minus 250 ms. Night 2: pool 1.0 m, drumroll 1.4 s, pool drifts slowly during the roll. Night 3 and later: pool 0.9 m, drumroll 1.2 s, the whiteface may call "Now!" early (the crash never lies). All values in CONFIG, to tune on play.
- **Clear goals in the Mirror World (same feedback).** One goal line on entry to each space, naming what wins there (the line text per space is the owner's to approve). Built after the fall act.
- **Not decided (owner):** whether the other acts also become physical; how the fall act's Laughs compare with the old cue's payouts (start equal, tune on play).

**The cue.** The painted clown mask sits fixed on his face at the cue size, and a thin ring closes in on it (gold for a hit, crimson under the silver cone hat for a take). Press when the ring fits the mask's edge. Drawn in screen space at a fixed size, about 20% of screen height on desktop and 30% on phone, centred on his head (lightly zoomed during acts). A drum or rimshot sounds on every beat and the mask's edge flashes at the fit moment, so timing is learned by ear. (Session 8 reversal; the live doc has the exact wording.)

| Result | What happens |
| --- | --- |
| Perfect | Mask snaps on, flash and confetti puff, the gag lands with the laugh; a little paint is added to his real face |
| Good | Gag lands, smaller laugh |
| Early | Mask lands crooked, he trips ahead of the beat |
| Late | Mask slips down his face, the whiteface sighs |
| Two misses | The act ends |

- **Act length:** 2–7 beats. Rule-of-three acts are 3 beats plus a topper; first and last beats can never be interrupted.
- **Topper choice:** on the topper, the second button lands the grin upside down: the auguste's "wrong in the right way" answer. Biggest laugh the first time each night, a groan if repeated. Opens on night 2, together with the take button and the whiteface interrupt; night 1 is pure timing.
- **Whiteface interrupt (from night 2):** it replaces a beat on the beat grid and is warned 1.5 beats ahead (750 ms on night 2, 600 ms on night 3 and later): the coming ring spawns crimson under the whiteface's silver cone-hat silhouette, with a sound sting as he steps in from the side, so its spawn is the warning. Press **take** to accept the slap with a pratfall on cue (bonus laugh). A missed take ends the act at once: the slap lands and he goes down. It is a separate rule from the two-miss rule, which covers timing beats only; the slap is the bigger danger. Night 1 uses one button only, with one scripted demonstration before any interrupt.
- **Later nights:** the cue always closes honestly; only the whiteface's spoken call comes a little late. The lesson is "trust the mask, not the voice".
- **Encore:** at full Laughs his face becomes a dial; a light runs round the rim and you press when it reaches the top of the hat. Faster each press, payout capped. On the final night it never stops speeding up.
- **Controls:** desktop Space (hit) and K or Shift (take); phone two large buttons, hit on the right, take on the left. Audio latency setting for phones.

**Open problem (player feedback relayed by the owner, 23 Nov 2026, `design/STRANGER-night1-owner-relay-23nov.md`):** "when the challenge appears there is a really long time between that and being able to try again so it doesn't feel like I can prepare for it at all." The cue is met once a night with no practice before it. Not solved in the design yet; lead's proposal for the next batch is a rehearsal before the show (the cue with its drum, no crowd, no Laughs, as often as he likes).

**Starting numbers to tune**

| Item | Night 1 | Night 2 | Night 3 and later |
| --- | --- | --- | --- |
| Ring close time | 900 ms | 750 ms | 600 ms (floor 500 ms) |
| Beats per act | 3 | 3–4 | 4–5 (7 only for the master act) |

Perfect window ±60 ms (±80 ms phone); good ±130 ms (±160 ms phone); gap between beats measured fit to fit, set per night (see Tempo below); take window ±150 ms; encore 1.2 s per lap, 12% faster per press, floor 350 ms on normal nights.

**Tempo with two rings on screen.** Beat gaps are measured from one fit to the next. The next ring starts closing before the current one fits, so up to two show: the current one bright, the coming one dim. How many overlap depends on close time divided by gap. Keeping close time at 1.5 × the gap every night means the screen always reads the same (one or two rings) while the tempo rises, and the close times above stay as they are.

| Night | Beat gap (fit to fit) | Ring close time | Rings on screen | Beats per second |
| --- | --- | --- | --- | --- |
| 1 | 600 ms | 900 ms | 1–2 | 1.7 |
| 2 | 500 ms | 750 ms | 1–2 | 2.0 |
| 3 and later | 400 ms | 600 ms | 1–2 | 2.5 |

- **Never three rings.** A fitted or missed ring disappears at once, and hit feedback is drawn on the mask, not the ring: at the 400 ms tempo on phone there are only 40 ms to spare before the next spawn. If gaps ever vary inside a chain, the close time must stay at or under (this fit minus the fit two earlier) minus the late good window.
- **How the game changes:** with one ring, timing is reaction (watch it close). With two, it becomes reading ahead, like notes in a rhythm game; players lock onto the rhythm, so the drum matters more than the picture.
- **Later nights get tighter without new windows:** ±60 ms perfect is 10% of the night-1 gap and 15% of the night-3 gap. Good windows never overlap (at 400 ms there are 140 ms of dead time on desktop, 80 ms on phone). Against button-mashing: each press belongs to the nearer ring (split at the midpoint between fits), the first press in that zone uses up the ring, and a press outside the window counts as a miss. Timing is judged on input timestamps, not frames.
- **Holds** (spotlight sweep): the next ring appears after release, and its fit snaps to the next beat on the grid so the music stays in time.
- **Act length:** a 5-beat chain takes about 3.3 seconds on night 1 and 2.2 seconds on night 3 (first spawn to last fit). An act is 3–4 chains with 2–3 seconds of gag animation between them, about 15–25 seconds; a 30–45 second act would need 6–8 chains. To tune.

**Acts** (from documented clown routines; see the routines report)

| Act | Source routine | Notes |
| --- | --- | --- |
| The deliberate fall | Dazai's school scene; the classic pratfall | Free starting act, can't be wiped, always pays a small floor |
| Soldier drill | *Entrée du service militaire* (French circus) | Whiteface calls the beats; topper is the swapped answer |
| The talking scale | *La bascule parlante* (Gin, 1958) | Short, solo, sad |
| Spotlight sweep | Emmett Kelly sweeping up the spotlight | Hold-style beat |
| Tit-for-tat | Laurel & Hardy, *Big Business* (1929) | Escalation finale |
| The mirror routine | Max Linder (1921), *Duck Soup* (1933) | Master act, last stage night only |

More acts can come from the routines report's shortlist (Hamlet of the clowns, water entrée, Lou Jacobs' tiny car).

## Crowd reactions and repeats

The crowd shows success and failure with bodies and sound, not text.

| Result | Crowd |
| --- | --- |
| Standing ovation | On their feet, applause |
| Wave of laughter | Rows rock together |
| A few laughs | Scattered heads move |
| Silence | Still |
| Bad | Coughs, a phone glow, someone walks out, a boo |

- **Repeats earn less:** an act pays about 100% the first time, 60% the next, then 30%, like the crowd in *WWF War Zone* turning on repeated moves. This boredom resets partly each night.
- **Mastery is permanent** (more Laughs per hit, longer chains with use), so perfecting an act and resting it a night is the rhythm, not a contradiction.
- **Crowd in 3D:** 4–8 painted silhouette cards copied hundreds of times, bobbing in the vertex shader by an excitement value; excitement 0 freezes the whole house at once.

## Mirror World combat

A small arena seen from a high three-quarter camera: the same ring as the stage, relit cold (hue about 220), with reflections where the audience sat. Each act spawns the insecurity tied to it, so the Mirror is built from what you did on stage. Laughs are health and ammo: every gag spends them, every hit taken costs them.

**The rule (owner, 22 Nov 2026): insecurity is only beaten by acting.** Standing still is never the answer. While any insecurity is up and he does nothing (no move, no gag), every figure is on him: the screen edge darkens at once and a whisper rises; after a 1.0 s warning his Laughs drain at 2 per second, climbing by 1 per second each second up to 8 per second. Any move, slap, pie or pratfall clears it. Once every insecurity is down nothing gnaws.

**Insecurities come together, the route mixes 2.5D styles, every night ends in the arena (owner, 23 Nov 2026 09:23; replaces "one at a time" of 06:22 and 08:08).** "2.5D styles all to mix and match to form each night only to end at the arena, insecurity come together never as 1 type and solo." Each night's Mirror World is a route of spaces in different 2.5D styles (corridor with fixed shots; the Stare's "three photographs" room; Shame's pencil void; from night 2 parade flats, a tilting box room, a house front, a toy theatre), always ending in the ring arena with the turning camera. In every space at least two insecurities of different types are up together; never one alone, never a space of one type. On entry one line says what he is fighting ("These are his insecurities. Face each one."). Hints stay (owner 06:22, "all insecurities have hints"): lead's default, the hint line shows the nearest insecurity's hint (Light "Three gags on its lamp.", Stare "Hit it from the side.", Shame "Dodge to shake it off.", Whisper "Step past it. Stay on your feet."). No count of figures left. His pratfall is called "Dodge" to the player. Built 23 Nov (session 23 batch 1, `mwMixer`): the route is the entry corridor, then the styles of the insecurities his acts earned in a mixed order (night 1: 3 spaces at most), the arena last. Each space's group is two different types (the space's own insecurity first, then earned types not yet met, then whisper, shame, stare as partners); the arena holds the Light and one more. Those still standing follow him through each exit. The corridor door holds until its whole group is out of the glass. A figure never enters within 2.5 m of him. The hint switches to another figure only when it is 0.6 m nearer. The Stare's photograph room (session 23 batch 2, `mwStyles.photo`, box and shape): one fixed sepia shot (sepia grade on the clown and the figures, a cream print border on screen), a studio with the three photographs on the backdrop wall. The Stare is a camera there: it turns toward him; 2.2 s after its last flash, once it has him in its cone, the lens opens for 0.6 s with a rising whine, its aim locks and its cone shows on the floor; then the flash: caught in the cone costs 8 Laughs (a dodge through it is safe), the frame freezes 0.3 s. Hit it from the side, as everywhere. The room's door opens when its group is down; a cut only then. Shame's pencil void (session 23 batch 3, `mwStyles.void`, box and shape): white paper all round, no floor; everyone in it is paper inside a pencil outline; the floor is one pencil line drawn under him as he walks (a stroke every 0.1 m, the oldest of 420 erased first). Shame's tell is the line trembling under him while it reaches for him (0.4 s, then it clings; a dodge shakes it off, as everywhere). The camera turns from one fixed spot, as in the ring. A door is drawn in three strokes; it fills and leads on when the group is down. Night 1 has room for one of the two rooms (3 spaces): which one is drawn at random from the insecurities the acts earned. The Sergeant's parade ground (session 24 batch 2, `mwStyles.parade`, box and shape): one fixed side-on shot of a drill ground with a low kerb; behind it three layers of flat cut-outs that step sideways on each drum beat and stop when no Sergeant drums. The Sergeant marches to a drum (one stride on each beat, 0.6 s); every fourth beat it shouts and marks a line on the floor in front of it, two beats later (1.2 s) it thrusts along the line: caught on it costs 8 Laughs, a dodge is safe. A gag landed within 0.12 s of a drum beat is parried ("On the beat it parries"); between beats it lands. Hint: "Hit it between the drum beats." The Weigher's scale room (`mwStyles.tilt`): a small box room seen from high above with a dial on its floor; the room leans toward him (a camera roll, 6 degrees per 60 Laughs held, at most 9) and the dial's needle reads the Laughs he holds. The Weigher slides toward him faster the more Laughs he holds (0.9 m/s x (0.25 + Laughs / 60), capped at 1.6); in reach it rises for 0.6 s with a ring on the floor, then drops: 4 + 8 x (Laughs / 60) Laughs if he is still within 1.2 m. Hint: "Spend Laughs and it gets lighter." The drill brings the Sergeant and the scale the Weigher (night 2 tries the scale, night 3 the drill); their spaces join the mix like the others. Both figures are box and shape until the art pass.

**Controls**

| Action | Desktop | Phone |
| --- | --- | --- |
| Move | WASD | Left thumb stick |
| Gag (attack) | Click, aimed at the cursor | Right-side button, auto-aims at the nearest |
| Pratfall (dodge) | Space | Swipe (night 1 build: the FALL button) |
| Do nothing | Not a move: they gnaw at his Laughs | The same |

**Gags** (each comes from an act you own; the Performer can copy them)

| Gag | Comes from | Effect | Cost |
| --- | --- | --- | --- |
| Batte slap | Starting fall | Short-range hit with a loud knap | Low (2 on night 1) |
| Pie | Food acts | Thrown, splashes a small area | Medium (3 on night 1; only the pies the props girl gave him) |
| Seltzer | Water act | Cone that pushes monsters back | Medium |
| Horn | Soldier drill | Stuns everything nearby for a moment | High |
| Spotlight | Spotlight sweep | To redesign: its old effect ("monsters in it freeze while you stand still") rewarded standing still and no longer fits the rule | High |

**Monsters spawned by acts**

| Spawned by | Monster | What it does | What beats it |
| --- | --- | --- | --- |
| Deliberate fall | The Whisper (the one who sees) | Copies your dodges and hits where you land | Don't dodge; step instead |
| Soldier drill | The Sergeant | Attacks to a beat, like the whiteface's calls | Hit on the off-beat |
| Talking scale | The Weigher | Grows heavier the more Laughs you hold | Spend Laughs quickly |
| Spotlight sweep | The Light | A pale white beam with a hard rim that follows him and drains Laughs while he moves in it; it flares 0.4 s before it chases, and each escape makes it bigger | Go to its lamp and land three gags (slap or pie) on it. Each hit dims the beam and holds it off for 0.6 s. It is put out for that night only, never beaten: the dark lamp stays, turns to follow him and clicks, and the next night its beam starts 15% wider |
| Tit-for-tat | The Neighbour | Breaks something of yours each time you hit it | To redesign: the old answer ("ignore it and it gives up") was not acting |
| Mirror routine | The Double | Copies your moves a beat behind | To redesign: the old answer ("stop moving") was not acting |

The Light always appears on night 1, whatever act was performed. Night 1's board also lends the spotlight sweep for free, so the act and its monster are met together. The earlier line that the Light, the Neighbour and the Double teach "that stopping works before the final" is withdrawn: the final is won by gags.

**Stage results still add monsters**, from the earlier design's bill: Perfect adds the Stare, a miss adds Shame, a repeated gag adds Echo, a whiteface-interrupt act adds the Clinger, high Mask adds Mask Shards. The full earlier monster list (Stare, Clinger, Echo, Hollow, Applause, Shame, Cue, Residue, Grey, Doubt, Mask Shard) stays in the pool; see Phase 2 under Earlier design in the live doc.

**Losing** wakes him at the mirror keeping half his shards.

## Mirror shop and the Performer

The changing-room mirror is the shop, and the reflection is the shopkeeper. It sells stage acts and Mirror abilities for shards, with one shared currency. Each night the board offers one unowned act as a tryout: it plays at full value once, and buying it here makes it permanent. The board is the repertoire, the tryout is the temptation, the shop is where you commit. Every purchase feeds the final boss.

| Choice | Stage | Mirror | Final night |
| --- | --- | --- | --- |
| Buy an act | More Laughs | More ammo; a paint layer, so Mask rises | The Performer has that act as an attack, and more HP; the clown no longer has it |
| Keep acts | Laughs keep coming | Harder fights | More attacks to read, more HP to get through |
| Wipe an act off | Fewer Laughs | Calmer fights | The Performer forgets that act |

- **Prices are shards, shown as shards:** a price is laid out as glass pieces on the mirror's ledge and the shards he holds show as a pile, never as a number tag. Each purchase also adds a visible paint layer (a wider painted smile, darker eyes, brighter nose) in every scene, so the real cost reads on his face.
- **Wipe-off:** at the mirror only; half the pieces it cost come back to his pile, and it leaves a paint stain, so Mask does not fully drop. Putting things down rehearses "I quit".
- **Mirror abilities** are gestures the Performer can also use: a dash you buy is a dash it gets.
- **Floor against buying nothing:** acts are the only Laughs source, repeats decay, and the Mirror gets hungrier each night. About three acts are needed to get through the middle nights.
- **Mastery and the master act:** acts level up with use. The mirror routine, his best act and the Performer's strongest move, unlocks on full mastery of every owned act or on the last stage night, whichever comes first.
- **What he bought is what he faces** on the final night: every act owned is one more Performer attack, and his Mask sets its HP, while he fights with only the three skills he started with.

**Making the learning visible** (four moments)

1. At purchase: the reflection does three beats of the new act by itself, slightly too well.
2. Next night, before the mirror opens: it does that act again, unasked, while the clown sits.
3. In the Mirror World: the Performer stands far off as a silhouette, quietly rehearsing your owned acts; busier as you buy more.
4. When you wipe an act: the reflection starts it, stops halfway confused, and drops it from its loop.

At the final fight the Performer opens by running through every act you own in a row.

## Quotes

One Dazai line before each show (the mask goes on) and one Nietzsche line on leaving the Mirror (the answer). Show the full line once, a short version on replays; both skippable. Show the Japanese small under the English Dazai lines.

| Night | Dazai, before the act (our own translation) | Nietzsche, out of the mirror (public-domain translation) |
| --- | --- | --- |
| 1 | "I have lived a life full of shame." 「恥の多い生涯を送って来ました」 | "Everything that is profound loves the mask." (*Beyond Good and Evil* §40, Zimmern) |
| 2 | "My clowning was my last courtship of humanity." | "Superficial—from profundity!" (*The Gay Science*, preface, Common) |
| 3 | "On purpose. On purpose." 「ワザ。ワザ。」 | "Thou hast made danger thy calling." (*Zarathustra*, Prologue §6, Common) |
| 4 | "Isn't 'society' just you?" | "Become what thou art." (*The Gay Science* §270, Common) |
| 5 | "Now I have neither happiness nor unhappiness." | "Ye could wear no better masks than your own faces!" (*Zarathustra*, "The Land of Culture", Common) |
| 6 | "Everything simply passes." | "Not by wrath, but by laughter, do we slay." (*Zarathustra*, "Reading and Writing", Common) |
| Final | "He was a good child, like a god." 「神様みたいないい子でした」 (the bar madam's last words in the novel) | To decide: it must come before the two choices appear (open decision below) |

- Both quotes stay, every night: a Dazai line before each show and a Nietzsche line on leaving the mirror. With fewer nights, use the rows in order.
- The night 1 build uses other lines by owner decision of 22 Nov (Dazai "My clowning was my last courtship of humanity."; Nietzsche "In vain was all our labour."); the table above is the plan for the full set.
- **Rights:** Dazai's Japanese original is public domain; use our own translations, not Keene's, Gibeau's or Carpenter's. Use only public-domain Nietzsche translations (Common, Zimmern), not Kaufmann or Hollingdale.
- **Leave out** Nietzsche's "free death" chapter and any Dazai line about dying, given the walk-off ending.
- Voice-over is optional; if used, it needs a voice for both languages.

## Final night and the ending

Rewritten from the owner's decisions of 22-23 Nov 2026. Built as box and shape on 23 Nov 2026 (session 24 batch 3, `performerFight`); lead's defaults where the GDD was open, each a CONFIG value:
- Night 3 of the jam build is the last night. It keeps its stage act (the board and the drill tryout) and its Mirror World route; when the arena's group is down, the Performer (the v2 Performer model, loaded on that night only) steps into the ring.
- It first runs through every act it holds, one after another, naming each on the tip line; it cannot be hurt during the run. Then it keeps about 2.6 m from him and attacks every 1.1 s, open to gags for 0.7 s after each.
- Its attacks: the deliberate fall always (it dives along a line on the floor, 0.7 s tell, 10 Laughs); one per act or ability he bought: spotlight sweep (a ring where he stood, 0.7 s, 8), talking scale (a wider ring, 0.8 s, 10), soldier drill (a thrust along a line, 0.7 s, 9), dash (a long fast lunge along a line, 0.6 s, 9), tit-for-tat (it answers each gag he lands, 0.6 s later, within 2 m in front of it, 8). Each tell has its own sound.
- HP 12 x (1 + 0.04 per Mask), never below 12, at most 1.4 x 12. Gnawing goes on as everywhere.
- Lost: he wakes at the mirror as on any night; the end card offers "Try the last night again" (the same night, with what the run carried in).
- The ending: the Performer shatters (flash, glass sound); black and silence (the music is cut, not faded); the last Nietzsche line on its own card ("I refuse to be a saint; I would rather be a clown.", Ecce Homo, Ludovici 1911); his warm light opens on him in the middle of the ring, his paint gone; the audience appears one by one round the ring, each with a clap, faster and faster (36 figures), held, then cut to silence; two worded buttons (keys 1 and 2): "Bow, say "I quit" and walk out" (he bows, "I quit." on screen, walks out to the ring's edge where the child stands, black) and "Perform one last act" (three falls in the light, no laugh, no words, no numbers, black). After either, 2.5 s of black and silence, then only "Start again from night 1".
- Not built: the Performer's face as the cue's mask on this night; the Quit option greyed out on the last night (there is no menu Quit yet).

**The fight.** The last night keeps its Dazai line. In the Mirror World he first fights the night's insecurities as on any night. Then the Performer, his pale double: the Performer is himself.

- **The clown has lost every act he bought.** He fights with the three skills he started with: slap, pie and pratfall.
- **The Performer holds every act he bought** and attacks with them. It opens by running through every act he owns, then fights. Each attack has a tell (starting value: at least 0.6 s, each with its own sound), so the fight is dodge and strike.
- **Its HP rises with his Mask** (starting values: never below the base when nothing was bought, capped at 1.4 times the base).
- **It is beaten by gags, not by standing still.** Doing nothing gnaws at him here as everywhere.
- The mask in the cue is the Performer's face on this night.

So a player who bought everything faces the most attacks and the most HP with the fewest tools, and watches his whole career come at him.

Withdrawn: beating the Performer by standing still in the spotlight for 15-40 s, its gags missing inside the light, and the section "Making stillness read as a choice, not a freeze".

**The ending**

1. The last insecurity is beaten. The Performer shatters with the mirror. Silence, darkness.
2. A warm, bright light opens on the clown. It is his own, not a monster's: a spotlight on himself. The mask is gone.
3. The audience appears one by one, clapping. The clapping is heard and builds, then cuts to silence, like the last episode of Evangelion.
4. Two worded buttons appear:
   - **He bows, says "I quit" and walks out of the ring**, leaving his insecurity behind. The child who said "on purpose" watches him leave from the exit.
   - **He performs one last act.** Shown with no judgement: he goes on with the endless fight.
5. Not decided: what is seen and heard after each choice (the earlier ending closed on unseen clapping over black, with no text and no score).

Panel cautions kept for when this is built (`design/PANEL-ending-22nov.md`, `PANEL-action-22nov.md`): the fight must cost him or "I quit" has no cause (it does: he has lost his acts); a jam judge plays once and sees one ending; four seats objected to the bow ("a bow is a performance") and four to the seen crowd.

## Platform and graphics

Real-time 3D in the browser, built for desktop first; the phone version is a dial-down of the finished desktop build. Target: the density and polish of a lush stylized web 3D game (painted textures, dense copied detail, soft warm light, bloom, sparkles, layered depth) at 60 fps on a mid-range desktop.

**How we get there**

- **Characters:** each becomes one rigged mesh (the approved models: 12–18k triangles) with a painted texture atlas and a separate face texture (expressions and paint layers swap at runtime), instead of 87 flat-coloured parts. Built headless in Blender from the existing build scripts.
- **Painted look:** bake ambient occlusion, edge and top-light maps, then colour them through the style's own palette ramps. The same bakes through cold ramps give the Mirror World versions.
- **Rendering:** three.js r187 on the WebGL renderer; a ramp shader with rim light and per-character key light; inverted-hull outlines on characters and key props only; one spotlight with soft shadows plus a fake light cone; bloom, tone mapping and grading in one after-effects pass.
- **Density:** baked light on static sets; crowd, confetti, sparkles and shards each drawn as one copied mesh with motion in the shader.

**Circus versions of each depth layer**

| Layer | Ring | Corridor and changing room | Mirror World |
| --- | --- | --- | --- |
| Ground detail | Sawdust, confetti, straw, peanut shells | Costume racks, trunks, floor cables | Glass shards, crystal growth |
| Midground | Ring curb, pedestals, prop carts, ladders | Bulb-framed mirrors, posters, wardrobe | Warped copies of stage props |
| Background | Tiered seats with the silhouette crowd | Tent canvas, hanging ropes | Reflections fading into fog |
| Top | Tent roof, bunting, bulb strings | Work lights | Cold glow, falling particles |
| Reward effect | Confetti and spotlight flare | | Shard bursts |

**Budgets** (starting points to tune on real hardware)

Frame rate comes first (owner, 22 Nov 2026): 60 fps or higher on desktop and 60 fps minimum on phone. Where a budget below and the frame rate conflict, the frame rate wins.

| Item | Desktop | Phone |
| --- | --- | --- |
| Frame rate | 60 fps or higher (frame p95 16.7 ms or less) | 60 fps minimum (frame p95 16.7 ms or less); no 30 fps tier |
| Draw calls | aim 150 or fewer, ceiling 300 | aim 80 or fewer |
| Triangles per character | the approved models, unchanged (12–18k built) | 10–15k; a lighter model only if the phone misses 60 fps, owner asked first |
| Triangles per scene | 500k or fewer | about 60k |
| Character textures | body 1024² + face 1024², KTX2 | body 512² + face 512² |
| Pixel ratio | up to 1.25, stepped down when frames run slow | up to 1.25, stepped down when frames run slow |
| Shadows | one spotlight, 2048 map | 1024 map or blob shadows |
| After-effects | bloom, SMAA, tone map, LUT, vignette; ambient occlusion off by default | bloom at reduced size, tone map, LUT, FXAA; no ambient occlusion |

**Phone dial-down:** lighter set models and textures (characters stay the approved models unless the phone misses 60 fps), then a quality ladder chosen from frame rate measured while loading, stepping down pixel ratio, shadows, ambient occlusion, bloom size, particle and crowd counts until it holds 60 fps; there is no 30 fps cap. Frame rate can't be measured in the build's headless test browser; it is checked on a real desktop and on the developer's phone.

## Art, assets and credits

The jam allows your own libraries, engine and tooling, licensed asset packs and AI-generated assets, as long as you have the right to use them and credit anything that needs crediting.

- **Style:** two worlds, one cast. Stage warm and low-chroma (hue 65–80, spot #FBD190, backdrop #1E1418); Mirror cold and low-chroma (hue about 220, backdrop #11272B, light #9DB5BB). Face paint colourless white; reds near hue 40. Mood comes from posture, not costume: wide and open on stage, closed and turned aside off it. Full values in the style study.
- **Two lights (owner, 22 Nov 2026):** the monster Light in the Mirror World is pale white (#DCE8EA) with a hard white rim; the last night's light on him is warm and bright. They must never look alike.
- **Cast (the developer's own art, approved for the jam on 16 Nov 2026):** the clown (auguste), the whiteface partner (crimson and gold, silver cone hat), the Performer (the clown's double in pale Mirror colours), the Clinger. 3D models with renders and turntables, plus a 64 px 2D sprite variant. The current models are 33–71k triangles and 0.7–1.5 MB each, flat colours, no rig: they are the source for the conversion above.
- **Movement:** timed from Muybridge, *The Human Figure in Motion* (1907 edition, public domain), indexed by game action in the Muybridge movement index.
- **Never ship:** the 12 reference screenshots from the style study (several under copyright). They were for measurement only.
- **Credits to include:** three.js and its add-ons (MIT, keep the notice); any CC0 assets used (Poly Haven, no credit required but list them); Muybridge as movement reference (optional); the *Legend of Dragoon* Additions system as the gag cue's inspiration (mechanic only, no art borrowed).
- **AI assets:** allowed by the jam; if used, check itch.io's generative-AI tagging rule before uploading.

## Jam build plan

The jam started on 18 Nov 2026; nothing was built before then. Desktop first, phone last. Each step has a check before the next starts.

| Step | Work | Done when |
| --- | --- | --- |
| 0 | Prototype the clown-face cue alone in flat 2D with a drum; tune the windows on the phone | It is fun within an hour of tuning |
| 1 | Toolchain probe: Blender Python module, glTF exporter options, a test bake, a three.js r187 page loading the effect libraries | Each item passes or fails with timings |
| 2 | Clown body: merge, cut, unwrap, bake colour and shading, palette-ramp paint, face texture with 4 expressions | 3 draw calls or fewer, side-by-side with the approved render |
| 3 | Clown rig and 3 clips (idle, walk, slap) timed from Muybridge | Plays in three.js; no torn vertices |
| 4 | Character shader, outlines, stage and Mirror light values, face paint layers | Stage and Mirror renders match the style's hues |
| 5 | Ring set: baked light, spotlight and cone, fog, crowd, confetti, sparkles, bloom | Desktop 150 draw calls or fewer |
| 6 | Whiteface, Performer and Clinger through the same scripts; remaining clips | Each meets the desktop budget |
| 7 | Corridor and changing room | Desktop budgets met |
| 8 | Mirror World arena | Desktop budgets met; first desktop build on itch.io |
| 9 | Phone dial-down: lighter set models and textures, compression, quality ladder | Holds 60 fps on the developer's phone without crashes |

Gameplay systems (cue, meters, crowd, shop, combat, final night) are built alongside steps 4–8 on one full night at final quality, then widened to more acts, monsters and nights.

**Untested until the first build:** baking through the Python Blender module; carrying weights from tagged parts onto the merged body; the animation format in the installed Blender version; the three.js r187 import map; outlines on animated meshes; texture memory on an iPhone. Each has a fallback in the graphics report.

**Advisor:** Fable reviews major decisions. Its suggestions to cut features are not taken; its other fixes are in this design.

**Research behind this design** (in the project and the session pack)

- *Clowns and negative emotion*: how clowns portray sadness
- *Clown slapstick routines for game acts*: documented routines and game precedents
- *Dazai No Longer Human and Nietzsche*: the literary and philosophical basis
- *Stylized web 3D graphics upgrade*: the graphics pipeline, budgets and build order
- *Clown and the Mirror study*: the approved art style
- *Muybridge movement index*: plates by game action

## Open decisions

- [ ] Number of nights: at least 3 for the jam build, up to 7; set by how much gets built.
- [ ] Free and paid split: earlier plan was a free 3-night build (the jam entry) and a paid 7-night game; what the paid game adds beyond length is still open.
- [ ] Voice-over for the quotes: none, or a voice for English and Japanese.
- [ ] Exact act-mastery thresholds and shard prices: to tune in play.
- [ ] Jam submission deadline and its rules on generative-AI tagging: check the jam page.
- [ ] Final night's Nietzsche line: where it goes before the two choices appear (for example as the Performer shatters), and which line. One candidate: "I refuse to be a saint; I would rather be a clown." (*Ecce Homo*, public-domain translation).
- [ ] Final night: whether it has a stage act before the mirror (the endless encore, the Performer's face in the cue). Not decided.
- [ ] The ending: what is seen and heard after each of the two choices.
- [ ] The Neighbour, the Double and the Spotlight gag: new answers under the acting rule (their old ones were "do nothing").
- [ ] The Performer's attack for each buyable act, and its tell.
- [ ] Practice for the timing cue before the show (player feedback, 23 Nov 2026): built as short acts of 3 rings and one ring that closes by itself (session 21 batch 1), not yet approved. The Mirror World half is decided (above).
- [ ] Still differing from later owner decisions (session 12 list, 22 Nov; not yet decided for this doc): walk back look (built: gloom and flakes), into the mirror (next sample: he stands, reflection cracks, fog), Mirror World camera and 2.5D sets (OWNER-REQUIREMENTS.md section 7), performers met in the wings.
