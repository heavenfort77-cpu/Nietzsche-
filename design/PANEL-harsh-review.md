# Panel: harsh review of night 1 and the story, with a story writer (22 Nov, session 16)

Owner (22 Nov 15:06): "i want a detail break down by the panel and story writer is this good and let them debate harsh and to the bone for any improvement."

Method: the same 12 judges as `PANEL-act-price.md` plus a **story writer** (narrative lead, new seat), 13 votes, consensus at 7. Brief this time: no politeness, every claim backed by the code or the design, every fix a move, merge or addition (the owner's no-cuts rule). What was judged: night 1 as it runs in `web/step0/night1.html` and `cue_model.html` at 7b2880e, plus the agreed batch 3 plan (`PANEL-act-price.md`). Judgement of design and code by one model playing 13 seats, not a playtest by people.

Facts the panel checked in the code before speaking:
- Night 1 order: V logo, curtain title, paint at the mirror, Dazai card, corridor (4 crew, the child), board card, cue page in an iframe (its own "tap to begin"), crowd card, walk back, cube room, sit, fog card, Mirror World, Nietzsche card, small-win card, shards card, shop card, end card. **8 press-to-continue cards** (`show('dazai'|'board'|'crowd'|'nietzsche'|'small'|'kept'|'shop'|'end')`) plus the logo, the title, the cue's own start and the fog.
- Payouts: Perfect 10, Good 5, floor 15 (`cue_model.html` CONFIG); each act fall 20, the pie in his face 25, the trip 15 (`N1.hurtFall/hurtPie/hurtTrip`). Night 1 is 9 beats; 2 misses end the act.
- The child's verb button reads **"Trip (on purpose)"** (`N1.crew` child `verbText`); the child's line after it is "...on purpose."
- Every laugh in the game is `laugh()`: **four triangle-wave tones**, 340 to 250 Hz.
- The Dazai line is a card with the attribution "Dazai, No Longer Human (our translation)" under it.
- The end card lists the purchases under "The shame of living:", then a stats block: "Corridor: jumped the cable yes, took the pie yes, honked the horn yes, tripped for the child yes ..."
- Both acts on the board run the same cue chain (3 x 3 hit beats); the spotlight sweep's hold beats are not built.

## Scores (of 5)

| Judge | Story | Gameplay | Theme | Fun | Harshest line |
|---|---|---|---|---|---|
| Story writer | 2 | 3 | 4 | 2 | "There is a theme and a situation. There is no story yet." |
| Nietzsche (through his work) | 2 | 3 | 3 | 3 | "You gave me the Soothsayer's line. He is the nihilist my Zarathustra overcomes." |
| Dazai (through his work) | 3 | 3 | 4 | 2 | "Being seen through was Yozo's terror. Your child is a comfort." |
| Core gamer | 2 | 2 | 3 | 3 | "Perfect play is strictly beaten by playing clean and failing the last two beats." |
| Casual phone player | 2 | 3 | 3 | 3 | "Four control schemes in ten minutes." |
| Jam judge | 2 | 3 | 3 | 3 | "Where, in night 1, does the game get me? I read about it; it never happens to me." |
| Camus (through his work) | 3 | 3 | 4 | 3 | "The small win saves it. Everything else is the rock." |
| Chaplin (through his work) | 2 | 3 | 4 | 2 | "A clown game where the player never laughs. The sadness has nothing to fall from." |
| Professional auguste clown | 2 | 3 | 4 | 2 | "My hat is already battered. A dent on an auguste is costume, not loss." |
| Clinical psychologist | 3 | 3 | 4 | 3 | "The loop is right. The player cannot feel it through the cards." |
| Indie critic | 2 | 3 | 3 | 3 | "Inner demons in a cold arena is the most worn metaphor in indie games. And this panel says yes to everything." |
| Streamer | 2 | 3 | 3 | 3 | "The silence after the laugh is the clip, but your laugh is four beeps." |
| Mobile producer | 2 | 2 | 3 | 2 | "Eight cards. It is a slideshow between minigames." |

Averages: **story 2.23, gameplay 2.85, theme 3.46, fun 2.62.** The theme score is lower than the night-1 panel's 4.08 because this brief asked for a harsher bar and added story; the build did not get worse.

## Round 1: the indictments

1. **No story, only a theme** (story writer). The clown has no name, no past, no want stated on screen and no one to want it from. Dazai's book runs on people: the father, Takeichi, Horiki, Yoshiko. Night 1 has one relationship, the child, and it lasts one line. Three quote cards do the story's job. "If you took the quotes out, what happens to him tonight? He goes to work, comes back, sits down."
2. **The economy breaks the cue** (core gamer). All Perfect: 90 + trip 15 = 105. Seven Perfect then miss the last two: 70 + 40 + pie 25 + trip 15 = 150, for one extra Shame (3 hit points, about two slaps at 2 Laughs each). Falling at once: floor 15 + 40 + 25 + 15 = 95 in two seconds. "The best player learns to throw the act. Batch 3 makes the miss the biggest laugh on screen too: it advertises the exploit."
3. **The button spoils the only line** (story writer, Dazai). The verb says "Trip (on purpose)". The child then says "...on purpose." The game tells the player before the one who sees does. In the book Takeichi's whisper is a shock. Here it is a repeat.
4. **Being seen through has no cost** (Dazai). Yozo's response to "On purpose. On purpose." is fear, then a plan to win Takeichi over so the secret is kept. The clown here hears it and nothing changes: no face, no step, no lag.
5. **The quotes are labelled as quotes** (story writer). "My clowning was my last courtship of humanity." is first person. Under it sits "Dazai, No Longer Human (our translation)". The card tells the player this is a book, not him. "His one inner voice is footnoted."
6. **The Nietzsche line is the enemy's line** (Nietzsche). "In vain was all our labour" is the Soothsayer, the voice of nihilism Zarathustra answers with laughter in the next chapters. Fine for night 1 as the owner meant it ("how fruitless it is"), "only if the nights climb out of it. If the last word before 'I quit' is still the Soothsayer, the game agrees with him and the walk-off is despair, not a choice."
7. **Nothing is funny to the player** (Chaplin, auguste clown). The crew lines are greetings ("Evening. Full house tonight.", "Break a leg."). The horn honks, the pie is taken, the cable is jumped: verbs, no jokes. The crowd laughs on a card. "Funny first, then the silence. You have the silence."
8. **The laugh is four beeps** (streamer, Chaplin). The game's main reward and its main violence is one sound, and it is `laugh()`: four triangle tones. The batch 3 hold (laughter stops) can only land if the laughter was laughter.
9. **Card fatigue** (mobile producer, casual). Eight cards, plus the logo, title, the cue page's own start and the fog. The cue page also shows its own settings panel when hosted. "Each card is a place to close the tab."
10. **The end card is a test log** (story writer, indie critic). After the owner's heading and the purchases comes "Corridor: jumped the cable yes, took the pie yes ..." The last thing night 1 says is a debug summary.
11. **The choice is fake** (core gamer, casual). Both acts run the same 3 x 3 hit chain. The board's only choice changes nothing the hands do. Batch 3 gives each act its own routine to watch; the input is still the same.
12. **Night 1 never gets the player** (jam judge). The GDD's "out to get you" list (one more act in the shop, prompts in the crew's mouths, the lag growing, the whiteface lying, Quit greyed out) is all later nights. A judge may play only night 1. "Show me one moment tonight where the game itself refuses me."
13. **The dent is costume** (auguste clown). An auguste's bowler is battered by trade. A dented hat reads as the look, not as something lost.
14. **Inner demons in an arena** (indie critic). Of the four constructs only the Light asks for the theme's answer (stand still). The others are a twin-stick fight with clown names.
15. **The panel is a rubber stamp** (indie critic). Four rounds in a row reached 10 or 11 of 12, with the mobile producer as the lone no. "Thirteen voices from one model agree with each other. That is not a test. Put one stranger on it."

## Round 2: the debate

- **Story writer vs Camus and the psychologist on indictment 1.** Camus: "The absurd has no plot; the repetition is the point." Story writer: "Repetition needs a change to be seen against. Groundhog Day changes something every loop." Psychologist sided with the writer: "A loop only reads as a trap when one thing in it moves." Agreed: each night needs one event that changes him (H13), not more text.
- **Dazai vs the story writer on indictment 3.** Dazai first wanted the child's line moved after the act, as in the book (the fall is the gymnasium). Story writer: "The corridor trip is the setup; batch 3's child who does not laugh is the payoff. Keep both, just stop the button telling." Dazai accepted, on condition the line costs him something (H3). Chaplin: "Label it 'Trip'. The player does it because a child is watching. Let the child say why."
- **Core gamer vs Dazai and the psychologist on indictment 2.** Dazai: "They love the injury, not the skill. That is the book." Core gamer: "Then the injury must have a price in play, or the cue is decoration." Psychologist: "Tie the price to being seen: the Whisper is the one who sees. Each fall feeds it." Auguste clown: "And the house tires of the same fall in one act, as any house does: the second fall earns half." Core gamer accepted both, with the balance sweep (night-1 panel item 6) as the proof. Mobile producer: "Keep the numbers in CONFIG; nobody reads a formula."
- **Nietzsche vs the owner's brief on indictment 6.** Jam judge: "The owner chose the line for night 1 on purpose." Nietzsche: "Keep it. I object to it being the last word." Story writer: "Then the quote ladder is the story's spine: Soothsayer, then the mask, then laughter." Adopted as H10.
- **Mobile producer vs the jam judge on indictment 12.** Jam judge proposed a Quit button on the end card that reopens the curtain once ("One more show!"). Mobile producer: "Trapping a player is how a jam game gets one star." Story writer: "Once, as a joke, then it works. The second press is the lesson." Psychologist: "One refusal is a joke; two is hostile." Kept at one refusal (H11). Mobile producer still against.
- **Chaplin vs the indie critic on indictment 7.** Indie critic: "Jokes in a sad game undercut it." Chaplin: "The opposite. The tramp is funny for an hour so the last scene breaks you." Auguste clown: "Make the jokes physical and tie them to the theme: the strongman's horn honks back a beat late, like the reflection." Indie critic withdrew.
- **Streamer vs the owner's audio rule on indictment 8.** The owner's rule: sound generated in code by default, files only when needed. Streamer: "A crowd laugh is when it is needed." Audio view: an offline-rendered laugh (noise bursts through vowel filters, many voices, scaled by excitement) is the code route; a CC0 recording with credits is the fallback. Owner to choose (H8).
- **Indie critic vs everyone on indictment 15.** No one defended the vote counts. The story writer added: "The judges are told the owner's intent before they vote. Of course they agree." Process fix H14.
- **Story writer vs Dazai on "I quit".** Story writer: "One spoken line in the whole game, and it is office English. Risk of a laugh in the wrong place." Dazai and Camus: "The flatness is the point: he is resigning, not declaiming." Not voted: the ending is the owner's, unchanged. The panel's condition: he must never speak before it, and the line must not be shown as text.
- **Mobile producer vs the auguste clown on indictment 13.** Mobile producer: "Nobody sees a dent at 64 px." Auguste clown: "They see a man push his hat back into shape and fail." Agreed as a staging beat (H15).

## Round 3: votes on the fixes (13 judges, consensus 7)

| # | Fix | Where | Yes | Against |
|---|---|---|---|---|
| H1 | **Price the fall.** Each act fall feeds the Whisper (more hit points and speed per fall, CONFIG); the second fall in one act pays half (repeats earn less, as the GDD's crowd boredom). Proof: night-1 panel item 6 bot sweep (clean, fall early, clean then fall twice) within a set band. | `night1.html` hurtLaughs, Whisper | 12 | Dazai (wants the price only in the Mirror, not in the payout) |
| H2 | **Stop the button telling.** Child's verb reads "Trip". The child still says "...on purpose." | `N1.crew` child | 13 | |
| H3 | **Make being seen cost him.** At the child's line his face cell goes to startle for about 1 s and the reflection's lag at the mirror tonight grows one step (CONFIG). | corridor, mirror entry | 11 | Mobile producer, casual (subtle) |
| H4 | **His thought, not a citation.** The Dazai line appears in greasepaint on the mirror glass as the paint finishes (Japanese small under it); the attribution moves to the credits and a small line on the glass edge. One card fewer. | paint scene | 10 | Indie critic, jam judge, mobile producer (legibility on phone) |
| H5 | **At most 4 press-to-continue cards per night.** Board as the backstage wall (already Next step 5), crowd card replaced by batch 3's caption, shards card merged into the shop (the pile is already on the ledge), cue page's own start screen and settings panel hidden when hosted. Kept: Nietzsche card (agreed hold), small win, shop, end. | flow | 12 | Nietzsche (wants his card longer, not fewer cards) |
| H6 | **End card says something.** Heading and purchases (owner's), the small-win line, three facts (Laughs, what they laughed at, Mask); the stats block behind a Details button. Behind the card the reflection is still standing. | `endCard()` | 12 | Core gamer (wants the stats open) |
| H7 | **One physical joke per corridor verb.** Horn honks back a beat late (the lag motif); the cable he jumps springs up behind him and trips the rigger; he sniffs the pie the props girl told him not to eat. No new lines. | corridor | 11 | Indie critic, psychologist |
| H8 | **A real laugh.** Replace `laugh()` with an offline-rendered crowd laugh scaled by excitement (code route) or a CC0 recording with credits; same sound for the single laugh after the wipe. Owner picks the route. | audio | 13 | |
| H9 | **The player is the audience.** In batch 3's hold he looks up into the camera (the player's seat in the back rows) for the 1.5 s, then the smile and bow. Look change: owner option. | batch 3 hold | 10 | Mobile producer, core gamer, indie critic ("too knowing") |
| H10 | **Quote ladder for the 3-night jam build.** Night 1 Soothsayer "In vain was all our labour." (owner's), night 2 "Everything that is profound loves the mask." (Zimmern), last night before "I quit": "Not by wrath, but by laughter, do we slay." (Common). Owner decides; it also settles the GDD's open final-line decision. | GDD quotes | 9 | Jam judge, casual, mobile producer, core gamer (no view) |
| H11 | **Night 1 refuses once.** End card has a Quit button: the first press reopens the curtain and the stagehand says "One more show!"; the second press works. | `endCard()` | 8 | Mobile producer, casual, core gamer, psychologist, Camus |
| H12 | **A real choice on the board.** Spotlight sweep plays its hold beats (GDD Tempo, Holds) so the two acts feel different in the hands. | `cue_model.html` | 11 | Mobile producer, casual (more to learn) |
| H13 | **One event per night that changes him** (story spine for the 3-night build; beat sheet below). | GDD night loop | 11 | Camus, indie critic |
| H14 | **One stranger before the next panel.** The owner gives the artifact link to one person who has never seen it and notes where they stop or get lost (rule 19); the panel then votes after reading that, and every losing dissent is kept in the doc. | process | 13 | |
| H15 | **The dent he cannot fix.** At the bow he pushes the dented hat back into shape; it springs back dented. | batch 3 bow | 10 | Mobile producer, core gamer, indie critic |
| H16 | **Mirror World answers by opposites.** Already agreed (rounds 2-4: opposite-answer pairs per construct); the panel asks that the Mirror World sample proves each construct is beaten by a clown answer, not by damage alone. Not new work. | Mirror World sample | 12 | Indie critic (still "inner demons") |

All 16 pass. Ranked by votes and by what blocks a judge's first five minutes: **H2, H8, H14, H1, H5, H6, H16, H3, H7, H12, H13, H4, H9, H15, H10, H11.**

## Story spine proposal (H13, story writer; owner to approve)

One event per night that he cannot take back. No new text; each is a body or an object.

| Night | Event | What changes |
|---|---|---|
| 1 | The child sees through the trip ("...on purpose."), and at the act is the one who does not laugh. | He is seen once. The reflection lags one step more (H3). |
| 2 | The crew say his lines before he does (GDD). On the board, last night's best laugh is written up ("They laughed hardest at the pie.", night-1 panel item 2). The reflection performs the act he bought before the mirror opens (GDD visible learning 2). | The role starts to play him. |
| Last | The Performer runs every act he owns; he stands still; the Nietzsche line climbs out of the Soothsayer (H10); "I quit"; the child watches him go; unseen clapping. | He stops. |

## What the panel defends (keep as it is)

- The silent clown until "I quit".
- The camera behind the crowd: the player is the audience (H9 only makes it felt).
- The reflection standing while he sits, then walking at him: the best image in night 1 (streamer, story writer).
- The small win and its loss branch (Camus: "the only hope in the game, and it is his own hand").
- The cue: the ring closing onto the mask.
- Batch 3's plan as agreed: the routine, the beat after, the child who does not laugh, the slump earned by success.

## Producer check

1. No cuts: every fix moves, merges or adds. H5 merges cards; nothing is taken out of the game. H2 changes four words of a label.
2. Look changes (H4, H9, H15) and the audio route (H8) are owner options. H1 changes the economy: numbers in CONFIG, proven by the bot sweep before it is called done.
3. Batch 3 is built as agreed (owner 22 Nov 13:45). H9 and H15 touch its hold and bow: added only if the owner agrees, behind CONFIG switches.
4. H10 replaces night 2's and the last night's GDD rows; the owner's night-1 line stays. Translations public domain only (Zimmern, Common), as the GDD rights rule.
5. Panel limits stated: one model, 13 seats, no playtest. H14 is the answer to that.
