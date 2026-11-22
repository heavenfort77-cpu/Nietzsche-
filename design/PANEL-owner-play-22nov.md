# Panel: answers to the owner's play of night 1 (22 Nov 15:52, session 16)

Owner, after playing the artifact on his phone: "why is ring room still there? and why only the ring in mirror world? also in the ring, i would assume any sane players would try to avoid the light but the speed of walk is impossible. the going out to performance should walk faster and there too many pop up speech and what the point of jumping over cable? going back to room way to slow at that speed. and where the performance after the cue game? run the panel, i want answers"

Judgement by one model playing 13 seats (12 judges and the story writer), not a playtest. Rules: `design/PANEL-RULES.md`.

## Stranger report

Source: design/STRANGER-night1-cold-read.md

It covers the same corridor, room and Mirror World (none of them changed in session 16). Its findings that match the owner's: "two speech bubbles overlap and the clown is tiny and hidden behind the crew"; "the Mirror World is unreadable"; the act screen never showed the act in play. The owner's own play (not a stranger, but a player) is the second source; his points are the questions below.

## Facts from the code (CONFIG at d020300)

| Question | What the code does | Numbers |
|---|---|---|
| Ring wall in the room | `cube25d/build_cube.py` still renders the 4 walls Ring, Dressing room, Mirror, Tent exit | Owner asked to replace it on 22 Nov 11:22 (list item 5); not built |
| Mirror World only a ring | `buildMW()` builds one cold ring | The agreed route (rounds 2-4: 4 spaces, 5 camera spots) and the owner's 11:22 item 4 ("not straight to ring"); not built |
| Can't escape the Light | the spot follows him at `light.follow` 1.4 m/s; he moves at walk speed 0.764 x `mwTempo` 1.6 = 1.22 m/s; moving inside the spot drains 6 Laughs/s; only 3 s standing still in it beats it | He can never get out once it reaches him. The sane move (run) is impossible and punished, with no tell that standing is the answer except a tip |
| Walk out slow | 0.764 m/s x `moodOut` tempo 1.18 = 0.90 m/s over about 16 m (y 2.4 to 18.3) | About 18 s of pure walking (computed, not timed in play) |
| Too many pop-ups | crew greetings within `meetDist` 2.3 m, a "done" line for 3 s after each verb, 2 name tags in the wings, the child's line | Up to 11 text pop-ups on one walk, 2 can overlap |
| Point of the cable | GDD night loop step 2: one verb per crew member. Night 1's Mirror World has no jump (move, slap, pie, pratfall, stand still) | The jump teaches nothing used later. Only the pie (ammo) and the trip (Laughs, Whisper) carry forward |
| Walk back slow | 0.764 x `moodBack` tempo 0.78 = 0.60 m/s over 15.5 m (y 18.0 to 2.5) | About 26 s of walking (computed) |
| Performance after the cue | agreed 22 Nov 13:45 (`PANEL-act-price.md`, 11 of 12), briefed as batch 3 | Not built. At 15:13 the owner ordered the panel fix and the 7 findings first; the artifact still shows the crowd as a text card |

Producer finding (no vote needed): the owner's 11:22 list (items 2, 4, 5: unworldly Mirror backdrop, Mirror route, cube room wall) was overtaken by later requests in sessions 15 and 16, and no report said they were still waiting. That is the producer's fault, not the owner's. Fix: HANDOFF gets an "Owner requests not built" list at the top, printed by `tools/handoff.sh start` every session.

## Blind round

Written before the owner's suggested fixes were weighed (he gave none, only the problems):
- Story writer: the walk back is the result screen; 26 s of it with nothing new is padding, not mood.
- Nietzsche: a Light you cannot flee teaches obedience, not the choice to stand. Stillness must be chosen against a real alternative.
- Dazai: the Light is being seen. One cannot escape being seen. I defend the trap.
- Core gamer: 1.22 m/s chased by 1.4 m/s is a bug, not a theme. Every player will run first.
- Casual phone player: I walked for ages and read eleven bubbles. I'd have quit before the ring.
- Jam judge: a judge plays night 1 once. 18 s in, 26 s out, plus a cable with no reason: that is a third of the night in corridors.
- Camus: the walk back may be long if something happens on it. Nothing does.
- Chaplin: the cable is a free gag gone to waste. A jump is not funny; a pratfall over it is.
- Auguste clown: the corridor is the clown going to work: brisk, his mind on the act. The slow walk is after, and still not that slow.
- Clinical psychologist: the inescapable Light reads as learned helplessness. That is the opposite of the small win.
- Indie critic: the cube room's Ring wall contradicts the GDD (the act is in the ring) and the owner already said so.
- Streamer: where is the act? The cue then a text card. The clip of the game is missing.
- Mobile producer: one bubble at a time, or none.

## The fixes and the votes (13 seats)

| # | Fix | First vote | After red team |
|---|---|---|---|
| A | **Act routine first** (the agreed batch 3 brief: zoom-out ring, walk-on, cue, routine per chain, the beat after, caption, slump). Next build, before the hold beats. | First vote: 12 of 13 | 12 |
| B | **Light you can run from, at a price.** Clown in the Mirror faster than the spot (`mwTempo` 1.6 -> 2.3: 1.76 m/s; `light.follow` 1.4 -> 1.2). Each time he leaves the spot it grows (`spotR` +0.25 m, cap 2.5 m) and its drain on re-entry rises; standing still 3 s in it still beats it. A 0.4 s tell (the spot flares) before it starts to follow. | First vote: 11 of 13 | 10 |
| C | **Walk out brisk, one bubble at a time.** `moodOut` tempo 1.18 -> 1.6 (1.22 m/s, about 13 s; clip sped the same, no foot slide). Only the crew member whose verb is next speaks; done lines go (the item 5 jokes carry the reaction); wings name tags off in night 1. | First vote: 12 of 13 | 12 |
| D | **The cable teaches the Mirror dodge.** The rigger's verb becomes "Pratfall over the cable": same key as the Mirror pratfall (Space / FALL pad), same animation, and he lands past it. The corridor now teaches 2 Mirror moves (pratfall, the pie). | First vote: 9 of 13 | (no red team) |
| E | **Walk back shorter, still sad.** `moodBack` tempo 0.78 -> 0.95 (0.73 m/s) and the corridor shot is cut on the way back (wings, then the room door): about 12 s. The slump scaled by the act's Laughs (batch 3 brief) carries the mood. | First vote: 8 of 13 | (no red team) |
| F | **Cube room Ring wall becomes the backstage act board** (owner's 11:22 item 5): the board card becomes this wall, one card fewer. | First vote: 11 of 13 | 11 |
| G | **Mirror World night 1: mirror corridor, then the ring**, one cut between, unworldly backdrop scaled by Mask (owner's 11:22 items 2 and 4; route from rounds 2-4). | First vote: 10 of 13 | 10 |

Order the panel asks for: A, then B with C, D, E in one batch (all CONFIG and small code), then F, then G, then the hold beats (owner's item 7).

## Red team

- **A** (indie critic argues no): "Build G first: the Mirror is half the night and it is one grey ring." Answer: the owner asked "where is the performance" and the act is agreed and briefed; G needs plates and a new camera. Vote unchanged, 12.
- **B** (Dazai argues no): "Being seen cannot be escaped; the trap is the theme." Answer (Nietzsche, psychologist, core gamer): the GDD itself says stillness must read as a choice, not a freeze; a trap with no alternative teaches helplessness, and the first thing every player does is run. The price (a bigger, hungrier light each time) keeps the theme: running works and makes it worse. Camus switched to no ("let him run forever if he wants, without the growth"). 10.
- **C** (story writer argues no): "Brisk out, slow back is the contrast; make out too fast and it is just a corridor." Answer (auguste clown): the contrast stays (1.22 vs 0.73 m/s, upright vs slumped); what goes is the waiting. 12.
- **F** (mobile producer argues no): "A wall board is harder to tap on a phone than a card." Answer: the wall shows the board, the two acts are 44 px buttons on it, as the room's other buttons. 11.
- **G** (core gamer argues no): "Two grey spaces are not better than one grey ring." Answer: the owner asked for both the route and the unworldly backdrop; together they are the change, not the corridor alone. 10.

## Dissent

- A, mobile producer: "Fix the speeds first; they cost minutes on every play, the act costs nothing until it exists." Lost.
- B, Dazai: "You are curing the theme." Camus: "No growth; running should cost nothing but time." Both lost.
- C, story writer: "Out at 1.6 will look like a scurry; 1.4." Lost; owner can tune `moodOut.tempo`.
- D, indie critic, Camus, Dazai, mobile producer: "Keep the jump; give it a joke, not a lesson." Lost 9 to 4.
- E, story writer, Dazai, psychologist, Camus, jam judge: "The walk back is the result; cut the shot but keep 0.78." Lost 8 to 5. The owner may prefer their version: cut the corridor shot, keep the slow tempo (about 15 s).
- F, mobile producer, core gamer: "Keep the card until the wall is play-tested on a phone." Lost.
- G, core gamer, indie critic, casual: "Do the backdrop first, the corridor later." Lost.
