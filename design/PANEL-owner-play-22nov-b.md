# Panel: the owner's phone play of the full night-1 build (22 Nov 17:58, session 17)

Owner, after playing artifact version 1795340607-5550 on his phone: "the act board, both act over lap each other, it should be a parchment or note on the board that interact expand so that it won't be clutter with future acts add in. the mirror on both side should not be so pristine and widen the width use the bag of marble theory to have a random construct breaking the mirror to attack him. the ring still unable to avoid the light. the fall and trip unatural and not like a clown. the act is lacking in intensity. the first cut should be him sitting facing the dressing table with his reflection facing him. the large mirror he should see a pale form of himself with get darker everynight and instead of sit, he should press his hand on the mirror and his reflection should mirror that so the the hands touch. run panel and if agreeable built"

Judgement by one model playing 13 seats (12 judges and the story writer), not a playtest. Rules: `design/PANEL-RULES.md`.

## Stranger report

Source: design/STRANGER-night1-full-cold-read.md

Cold read of this exact build on a phone (Fable 5.2): clarity 2, fun 2, want-next 3. It agrees with the owner on the board (finding 7: "the two act labels overlap ... I could not read my first real choice"). It adds what the owner did not list: the phone portrait picture is a strip a quarter of the screen high (finding 1, its first change); the corridor tip still shows in the ring (finding 2, a fault of batch 2); the FALL button covers the hint (finding 3); a developer line on the act screen (finding 4); keyboard hints on a phone (finding 13). What worked for it: the caption "The pie in his face got a bigger laugh than a clean beat." and the child's "...on purpose."

## Facts from the code and a probe

| Owner's point | What the build does | Measured |
|---|---|---|
| Board acts overlap | two buttons with a sub-line placed over the cards; on a 390 px phone each wraps or overflows | stranger finding 7; portrait CSS of batch 2 cut the sub-line but the labels still collide at 390 px |
| Light unavoidable | stick speed = run speed x stick length (radius 48 px); the spot grows 0.25 m per escape to 2.5 m inside a 6.8 m ring | probe (real-play bot, phone portrait, 8 s game time): full stick 3.45 s inside the spot; 60% stick (a thumb drag) caught and lost in 1.7 s. Batch 2's check teleported him out and never ran from it |
| Fall and trip | the whole body turns as a plank about the feet (`rotation.x`), no knees, hips or arms | approved clips are idle, walk, slap only |
| Act intensity | one laugh sound per gag, crowd bob, no camera or sound accent | segment 2.0 s |
| First shot | paint at the big mirror wall, standing camera behind him | GDD: "changing-room mirror (paint face)" |
| Big mirror | reflection is a full-colour copy; he sits; cracks where the poses disagree | |

## Blind round

Harshest objection per seat, written before the owner's suggestions were weighed:
- Story writer: the opening is the wrong room; a clown paints at his dressing table, not at the mirror that eats him.
- Nietzsche: a reflection in full colour is a twin; a pale one that darkens is the abyss looking back.
- Dazai: the hands touching the glass is Yozo's whole life: reaching for people through a surface.
- Core gamer: a Light you cannot outrun on a phone is a bug. Fix input before theme.
- Casual phone player: I could not read the board; I could not see him; I quit.
- Jam judge: the act is the clip a judge remembers; right now it is polite.
- Camus: the corridor is a hallway with nothing in it; a mirror that breaks without warning is the absurd arriving.
- Chaplin: a fall where the knees never bend is not a fall, it is a door closing. The feet must go up first.
- Auguste clown: the trip must sell: catch, three windmill steps, the flop, the bounce, up and a bow.
- Clinical psychologist: random attacks are fine if each has a tell; surprise without a tell is punishment.
- Indie critic: the strip-sized picture on a phone undoes every other fix.
- Streamer: intensity is sound and shake: a drum roll that builds and a crash on the fall.
- Mobile producer: notes on a board must open to a card big enough to read; never two labels side by side at 390 px.

## The fixes and the votes (13 seats)

| # | Fix | First vote | After red team |
|---|---|---|---|
| 1 | **Act notes.** The board shows one small note per act (title only, one line, 44 px tap target), laid out in a grid that takes more acts later. Tapping a note opens it as a parchment card in the middle of the screen (title, the routine in one line, what it is: yours or lent), with "Perform it" and "Back". | First vote: 12 of 13 | 12 |
| 2 | **Mirror corridor.** Twice as wide (half width 1.2 -> 2.2 m). Mirrors tarnished: smudged silvering, old cracks, uneven heights and tilts, dark frames. **Bag of marbles:** tonight's constructs except the Light, plus 2 blank marbles, go in a bag; at each mirror he passes from the second on, one marble is drawn without putting it back; the first construct drawn breaks that mirror (0.4 s tell: the glass flashes and a crack spreads, then it bursts) and attacks him there. Beaten there, it is not in the ring; if he runs to the door it follows him into the ring. | First vote: 11 of 13 | (no red team) |
| 3 | **Light he can escape (fault).** Cause from the probe: stick length scales his speed, and the spot grows to fill the ring. Any drag past 35% of the stick is full speed; growth 0.15 m per escape, cap 1.75 m; after chasing 2.5 s without catching him it loses him and drifts back to the middle for 1.5 s. Standing still 3 s in it still beats it. Gate: the real-play bot at 60% and 100% stick spends at most 2 of 8 s inside the spot. | First vote: 12 of 13 | 12 |
| 4 | **Clown falls.** Bone poses in the page (prototype; no new clips in the approved GLB): the pratfall (feet fly forward, airborne flat, lands on his backside, legs up, bounce, arms flail, up again) and the trip (toe catches, three windmilling stagger steps, belly flop, heels kick, pops up). Used for every fall: act misses, the bar, the bow, the cable, the Mirror FALL, the child's trip. | First vote: 13 of 13 | 13 |
| 5 | **Act intensity.** A drum roll that builds under each gag, a cymbal crash on each fall, a crowd roar that rises with excitement, a short camera shake on falls, the spotlight flashes on a Perfect, the crowd throws popcorn at each peak (one instanced burst), segments 2.0 -> 1.6 s. Framing stays at 64 px (owner, 21 Nov). | First vote: 11 of 13 | (no red team) |
| 6 | **Opening at the dressing table.** First shot: seated at the vanity, back to the camera, his reflection facing him in its glass; the paint is finished there. | First vote: 12 of 13 | 12 |
| 7 | **Pale reflection, hands meet.** The big mirror's reflection is a pale form of him (night 1 pale, darker each night: a CONFIG list per night); instead of sitting he presses his hand to the glass and the reflection presses back, late, until the hands meet; cracks where they disagree. Sitting stays for the shop and the small win. | First vote: 12 of 13 | 12 |
| S | **Stranger's clarity faults in this build's screens** (no vote: faults): the corridor tip left on screen in the ring; the FALL pad over the hint. Its other findings (portrait picture size, act-screen developer line, keyboard hints on a phone, shop and end card texts) go to the owner as the next list. | | |

## Red team

- **1** (casual player argues no): "One more tap before the act." Answer: the tap opens the only readable view of the act on a 390 px phone; the board stays readable with ten acts. 12.
- **3** (Dazai argues no): "Being seen should not be escapable." Answer: it is still beaten only by standing still; losing him for a moment is the operator looking away, not freedom. 12.
- **4** (indie critic argues no): "Make real clips in Blender, not page poses." Answer: real clips come with the art pass (rule 1); page poses can be tuned tonight and change nothing approved. Vote unchanged, 13.
- **6** (mobile producer argues no): "Seen from behind at a small vanity, the face will be tiny." Answer: the reflection is framed inside the vanity glass at face size; the shot is the dressing view, not the wall view. 12.
- **7** (core gamer argues no): "Hands that must meet need exact alignment." Answer: the reflection's place is fitted so the raised hands meet on screen; a check measures it. 12.

## Dissent

- 1, casual player: "One more tap before the act." Lost.
- 2, core gamer: "Random means some players meet no attack in the corridor." Answer folded in: the bag always holds at least one construct, and blanks only delay it; the core gamer kept the no: "then it is not random enough to matter." Psychologist kept a condition: the 0.4 s tell. Lost 11 to 2.
- 3, Dazai: "You are curing the theme again." Lost.
- 5, Chaplin: "Intensity is timing, not noise." Dazai: "Louder gags make the silence after louder; keep the hold." Chaplin lost.
- 6, mobile producer: "The face will be tiny from behind." Lost; answered by the framing check.
- 7, core gamer: "Hands that must meet need exact alignment." Lost; answered by a check.
- Indie critic (all items): "Fill the phone screen first (stranger finding 1)." Not voted: outside the owner's list; it is first on the next list.
