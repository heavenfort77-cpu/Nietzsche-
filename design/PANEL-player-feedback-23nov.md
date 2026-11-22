# Panel: the player feedback of 23 Nov (owner 23 Nov 04:09: "run panel on what to do", session 21)

Judgement by one model playing 13 seats (12 judges and the story writer), not a playtest. Rules: `design/PANEL-RULES.md`. Blind round: subagent a91b2e71e5068ae12 (shown only what a player sees and the player's words; not the lead's proposal). Vote and red team: subagent ab12bdb73b5dcddbd. Nothing is built from this.

## Stranger report

Source: design/STRANGER-night1-owner-relay-23nov.md

Kind human, relayed by the owner; which build was played was not said. The words in full: "It is hard to know what to do, and when the challenge appears there is a really long time between that and being able to try again so it doesn't feel like I can prepare for it at all. Then in the mirror I also don't know what to do." Earlier cold reads agree (clarity 2, fun 2). Where a stranger disagrees with this panel on clarity or fun, the stranger wins.

## Facts from the build (lead, read from `web/step0/night1.html` at ed33e0a)

- The cue comes once per run. No rehearsal exists. Only night 1 exists, so the next try is a new run from the title through paint, board wall, note and the corridor walk.
- The time from a missed cue to the next cue is NOT measured yet (first step of the build batch, HANDOFF Next step 1).
- Mirror World: no goal line on entry, no count of figures left. Tips (`TIPS`, line 3610) are queued and each shows `tipSecs` 4.5 s while play continues: one per figure on first sight (line 3796), one after the first spend, one when the idle drain starts.
- Not checked this session: what the player is shown about the press when the cue runs inside night 1 (`cue_model.html?host=night1`); what ends the Mirror World in code.

### Correction (lead, 23 Nov 04:40, after the owner asked "do you actually understand the comment")

The facts above were incomplete when the panel voted; the cue's own values were not read. From `web/step0/cue_model.html` CONFIG (lines 97-121, 150-153) and its hosted line (line 85):
- Night 1's act is 3 chains of 3 beats, beats 600 ms apart (`gapMs`), ring close time 900 ms, first ring 1.2 s after the start (`leadInMs`), 2.2 s gag between chains.
- `missesToEnd: 2`: two timing misses end the act. A first-time player who misses the first two rings has the whole challenge over about 2-3 s after it appears (worked out from these values, not measured in a run), and the next ring is a full new run away. "The cue comes once per run" above should read: one act of up to 9 presses, which can end after 2.
- A line is already shown before the cue: "Tap HIT when the ring closes onto the mask on his face." (Q5 option a exists.)
- A result word already shows under the mask, for 320 ms (`feedbackMs`). Q6 voted to add what exists; the open point is whether 320 ms is seen.
- The panel was not asked about `missesToEnd`, the 600 ms gap or the lead-in. Its votes on Q5 and Q6 rest on wrong facts and need retaking; Q1-Q4 and Q7-Q9 do not depend on them.

## Blind round

Scores a/b/c, 1-5: a = knows what to do before and during the act; b = can prepare for and retry the challenge; c = knows what to do in the Mirror World. Means: a 1.9, b 1.6, c 1.5. Written before the lead's proposal was shown.
- Story writer, 2/2/1: four named figures and no sentence saying what he wants from them: a set with no scene. Change: on entry freeze 3 s on one centred goal line, which then shrinks to a permanent top-left line.
- Nietzsche, 2/3/2: one chance per night is correct, but hidden as a law it reads as a bug. Change: before he walks, "This night comes once. It will come again." for 3 s; end card button "Live this night again" restarting at the board wall.
- Dazai, 3/2/2: the player is confused about buttons, not about people, which is the wrong shame. Change: keep the Mirror World unexplained, but the clown mutters one first-person line under each figure, held until the player acts on it.
- Core gamer, 2/1/1: a one-shot timing test with no practice and a full-run retry is a coin flip. Change: three cues in the act, the first unscored and labelled "Warm-up".
- Casual phone player, 1/1/1: I never knew where or when to tap, and text scrolled past while things hit me. Change: a pulsing thumb-size TAP button in time with the drum for the first two beats; the Mirror World pauses on each tip until tapped away.
- Jam judge, 2/1/2: the one interactive moment of the act passes before I understand it. Change: an unscored rehearsal in the face-paint mirror scene (the ring closes on his reflection three times, with the drum).
- Camus, 3/3/2: the player cannot see the rock. Change: no retries, but a fixed "Figures left: 4" counter top-right.
- Chaplin, 2/2/2: the gag is explained in words and never shown. Change: a 4 s silent loop of the act on each act card, showing the press moment.
- Auguste clown, 2/1/2: no clown goes on without doing the bit in the wings first. Change: two unpaid ring cues during the corridor walk; a miss in the real act is a big loud fall that still earns a visible laugh.
- Clinical psychologist, 2/1/1: delayed, unexplained punishment with no way to act on it produces helplessness. Change: after the act a 3 s replay marking the press "early" or "late".
- Indie critic, 2/2/1: a tip queue that lags behind the action is a tutorial fighting the game. Change: night 1 Mirror World cut to two figures, each with its answer as an icon above it while alive.
- Streamer, 1/1/2: walk a minute, fail one tap, walk again: dead air twice. Change: "Encore" once per night after the crowd reaction, replaying the cue at once for half Laughs.
- Mobile producer, 1/1/1: three unclear inputs before any reward. Change: a forced 10 s interactive tutorial before the act on first run; a persistent bottom banner naming the current figure's answer in five words or fewer.

## The questions and the votes (13 seats)

Q1. An unscored rehearsal of the cue before the scored act.
First vote: 11 of 13
Yes: all but Dazai and Camus. After red team: 11 of 13. Answer: the same ring-and-drum cue played before the act with no crowd and no Laughs, labelled "Rehearsal. Nothing counts." top centre.

Q2. Where the rehearsal lives.
First vote: 5 of 13
(b) face-paint mirror 5 (Story writer, Dazai, Jam judge, Chaplin, Indie critic); (a) repeatable "Rehearse" button on the board wall 3 (Nietzsche, Camus, Psychologist); (d) first cue of the act unscored 2 (Core gamer, Streamer); (e) forced tutorial 2 (Casual, Mobile producer); (c) corridor 1 (Auguste). A plurality, not a majority. Answer: after the last paint stroke the ring closes on his reflection three times with the drum, about 8 s, on the path; not skippable on the first run.

Q3. A second chance inside the night.
First vote: 8 of 13
(a) none, stated as a rule 8; (b) one Encore for half Laughs 4 (Core gamer, Psychologist, Streamer, Mobile producer); (c) free retry 1 (Casual). Answer: no second chance; before the ring appears "This night comes once. It will come again." is held centre screen 2.5 s.

Q4. "Live this night again" on the end card restarts at the board wall, not the title.
First vote: 12 of 13
No: Camus. After red team: 10 of 13 (Story writer and Jam judge moved to no: restart at the face-paint mirror with the rehearsal skippable by one tap). Answer: one thumb-size button bottom centre on the end card; one tap, no title or intro.

Q5. Teaching the press.
First vote: 5 of 13
(b) pulsing TAP target 5 (Core gamer, Casual, Auguste, Psychologist, Streamer); (a) one line of text 4 (Story writer, Nietzsche, Dazai, Camus); (c) silent demo on the act card 2 (Chaplin, Indie critic); (d) b and c 2 (Jam judge, Mobile producer). A plurality. Answer: a pulsing TAP disc (64 px or more, bottom centre) beats with the drum on the first two rehearsal cues and the first beat of the real act, then fades.

Q6. One word after each press: "early", "late" or "fits".
First vote: 11 of 13
No: Dazai, Chaplin. After red team: 10 of 13 (Auguste moved to no). Answer: the word under the ring for 0.8 s after every press, in rehearsal and in the act.

Q7. Mirror World goal line on entry that stays, plus a figures-left count.
First vote: 12 of 13
No: Dazai. After red team: 11 of 13 (Nietzsche moved to no). Answer: on entry the world freezes 3 s (no gnawing) with one goal line centre screen; it shrinks to top-left and stays; the count top-right changes only when a figure goes down. The line must say what ends the room.

Q8. How each figure's answer is given.
First vote: 7 of 13
(b) persistent banner for the nearest living figure 7; (c) the clown's own first-person line held until acted on 5 (Story writer, Nietzsche, Dazai, Camus, Auguste); (d) the world pauses on each first tip 1 (Casual); (a) timed tips as now 0. Answer: one banner above the action buttons, five words or fewer, "<figure>: <answer>", until that figure is down or another is nearest; the timed tips go.

Q9. Night 1 Mirror World cut from four figures to two.
First vote: 3 of 13
Yes: Casual, Psychologist, Indie critic. No 10 (the owner's no-cut rule). After red team: unchanged; the no side accepts the figures entering one at a time, which is ordering, not a cut.

## Red team

- Q1 (Nietzsche argues no): a rehearsal tells the player the night is a test that can be studied, and the act stops being life arriving unannounced. The fall is the content; a prepared clown is only a performer. If we must teach, teach in the act and let him fail once. Second vote: 11 of 13, nobody moved: the human's only words on the act were "it doesn't feel like I can prepare", and the stranger wins on clarity.
- Q4 (Story writer argues no): restarting at the board wall skips the face paint, which is the mask going on, and under Q2 it also skips the only rehearsal. The failed player gets back to the cue faster but exactly as unprepared. Restart at the mirror instead. Second vote: 10 of 13.
- Q6 (Chaplin argues no): a word is a caption, and a caption says the picture failed. Early should be a stumble forward and late a fall backward, readable with the sound off. Text under the ring pulls the eye off the face at the moment it matters. Second vote: 10 of 13.
- Q7 (Indie critic argues no): a permanent goal line and a counter turn four figures of dread into a checklist, and in phone portrait they eat the arena. The player's problem was the first ten seconds, not the whole room. Show it on entry and take it away. Second vote: 11 of 13.
- Q9 (Casual phone player argues the cut; no stood at 10 of 13): four unknown things at once on a small screen is why I scored it 1. Two figures I understand beat four I flee. The other two can arrive on night 2. Second vote: no stays 10 of 13.

## Dissent

- Camus, Dazai (Q1 no): he was never ready for people; a rehearsal is a lie about what the night is.
- Nietzsche, Camus, Psychologist (Q2 a): only a repeatable rehearsal the player chooses answers "I can't prepare"; three forced cues in a mirror do not.
- Core gamer, Streamer (Q2 d): teach it on stage where the stakes are, first cue unscored.
- Casual, Mobile producer (Q2 e): if it is not forced and interactive, phone players will not learn it.
- Auguste (Q2 c): a clown practises while walking to the ring, and the corridor is dead time now.
- Core gamer, Psychologist, Streamer, Mobile producer (Q3 b): one Encore right after the feedback is when learning happens; a rule on screen teaches nothing.
- Casual (Q3 c): let me try again, I am not here to be punished by a prototype.
- Camus (Q4 no): there is no again; the end card should end.
- Story writer, Jam judge (Q4 no, second vote): restart at the face-paint mirror, rehearsal skippable by one tap.
- Story writer, Nietzsche, Dazai, Camus (Q5 a): one sentence in his voice, not a tutorial button on his face.
- Chaplin, Indie critic (Q5 c): show the press on the act card, silently; a pulsing button is an app, not a circus.
- Jam judge, Mobile producer (Q5 d): do both, one alone will be missed by half the players.
- Dazai, Chaplin (Q6 no): nobody tells him why they did not laugh.
- Auguste (Q6 no, second vote): the body should carry it.
- Dazai (Q7 no): the Mirror World should not hand him a job description.
- Nietzsche (Q7 no, second vote): a count makes it an errand.
- Story writer, Nietzsche, Dazai, Camus, Auguste (Q8 c): the answer should be his own muttered thought, not a HUD label.
- Casual (Q8 d): stop the room while I read, or I will not read.
- Casual, Psychologist, Indie critic (Q9 yes): four first meetings at once is overload whatever the banner says.

## What this breaks or needs (panel)

- Q2 (b) against Q4: a restart at the board wall skips the mirror rehearsal, and (b) is not repeatable, so the player's "long time before I can try again" is answered only by Q4.
- The Q3 line and the "Nothing counts" label must both show, or the rehearsal reads as the act.
- Q7 and Q8 written in the clown's first person give the five (c) voters most of what they asked for at no extra cost.
- Phone portrait: goal line, count, banner, Laughs and three action buttons compete for space; 44 px targets, nothing over the arena centre, text written only on change.
- Checks: the TAP pulse on the audio clock and equal to the scored window; "early/late/fits" from the same thresholds as scoring; the 3 s entry freeze stops the idle gnaw.
- Nothing here counts as proven until a stranger cold read of the result.

## Producer check (lead, not a vote)

- The player's two complaints about the act are different: "can't prepare" and "a really long time before I can try again". Q2 (b) answers only the first, once. Default, stated under rule 17 and the owner overrides: build (b) on the path for the first run AND (a) the repeatable "Rehearse" button on the board wall (3 votes, and the only option the player chooses himself); "Live this night again" restarts at the board wall, where that button is. This closes the Q2/Q4 conflict without a restart at the mirror.
- Q3: Laughs carry into the Mirror World as health and ammo, so one bad cue also decides the fight. The rule line tells the player; it does not soften that. Left with the owner: no second chance (8) or one Encore for half Laughs (4).
- Q7 wording: the Light is put out, not beaten (owner 22 Nov 23:59), so the count cannot say "beaten". What ends the Mirror World in the build is read from the code before the line is written.
- Q9: no cut. Figures entering one at a time is a design change to night 1 and is the owner's call.
- Measure first: the time from a missed cue to the next cue, before and after, in the batch report.

## Order to build (one batch, switches in CONFIG, after the owner's answers)

1. Q6 word after each press.
2. Q5 TAP disc on the drum.
3. Q2 rehearsal: mirror (first run) and the board-wall button.
4. Q3 rule line; Q4 "Live this night again".
5. Q7 entry freeze, goal line, count.
6. Q8 nearest-figure banner in his voice; timed tips off.
7. Stranger cold read of the result before any further vote.

## Round 2: solutions on the corrected facts (owner 23 Nov 04:35: "so now run the panel and seek solutions")

Subagent a728bc353456ee21e, shown the corrected cue values, the Mirror World's end rule (`night1.html` line 3817: every figure down and every shard picked up; line 3519: 0 Laughs loses) and that all four figures stand in the room from the first second (CONFIG lines 807-821). Round 1's Q5 and Q6 are void. Every value below is a starting value, not measured. Nothing is built.

### P1. What ends the act
Argument: Casual: "It was over before I knew it had started; let me finish the act badly." / Core gamer: "Chain 1 can be safe, but a clown who keeps missing should get pulled from chain 2 on." / Dazai: "Two misses and the lights go down is the truest thing in the game; fix the teaching, not the rule."
First vote: 8 of 13
All 9 rings always run, misses pay less 8 (Casual, Mobile producer, Psychologist, Chaplin, Auguste, Jam judge, Story writer, Camus); misses end it only from chain 2 on 3 (Core gamer, Indie critic, Streamer); keep two misses 2 (Nietzsche, Dazai).
Answer: on night 1 no miss ends the act. A chain with 2 or 3 misses swaps its 2.2 s gag for a flop gag (silence, one cough): the tell that the crowd is going cold. `missesToEnd` night 1: never; later nights keep 2.

### P2. Announcing the first ring
Argument: Psychologist: "A written rule read beforehand is not learning; show one ring fit by itself, on the beat." / Core gamer: "Count-in yes, slower rings no, or chain 2 teaches a different game." / Dazai: "Nobody counts him in."
First vote: 10 of 13
Count-in plus ghost ring plus slower chain 1: 10; count-in only 2 (Core gamer, Nietzsche); nothing 1 (Dazai). After red team: 9 of 13.
Answer: the 1.2 s wait becomes 3 drum beats 800 ms apart. A ghost ring appears at 400 ms and fits by itself on beat 3, with "NOW" and the HIT button pulsing (scale 1.15, 120 ms). Real ring 1 appears at 2000 ms and fits at 3200 ms on the same beat grid. Night 1 chain 1: close 1200 ms, gap 800 ms, perfect 100 ms, good 220 ms; chains 2 and 3 stay 900 / 600 / 80 / 160. The line "HIT when the ring fits the mask" stays through chain 1. The ghost plays only until the player has landed a first fit.

### P3. Feedback after each press
Argument: Core gamer: "320 ms of text while the next ring is already closing is unreadable; freeze the ring where I pressed." / Chaplin: "The body must say it: he goes too soon, or he is left behind." / Dazai: "He never finds out why they did not laugh."
First vote: 12 of 13
All but Dazai. After red team: 11 of 13.
Answer: the word stays 550 ms (replaced early by the next result): EARLY, LATE, FITS, MISSED (no press). The pressed ring freezes at its size for 300 ms: outside the mask is early, inside is late. Body: early he lurches forward, late he sags back, a fit snaps the pose. Sound: early a high tick, late a low thud, a fit the drum plus a laugh; each with a 1-4 kHz layer.

### P4. The rehearsal
Argument: Mobile producer: "Compulsory once at the mirror, then a button at the board wall forever." / Indie critic: "Board wall only; the mirror scene is about the face, not drills." / Nietzsche: "Once. A man who rehearses forever never walks out."
First vote: 9 of 13
Mirror (compulsory first time) plus repeatable board-wall button 9; board wall only 2 (Core gamer, Indie critic); mirror once, no repeat 2 (Nietzsche, Dazai).
Answer: the same ring code at chain-1 values. It loops 3 rings with a 1.0 s pause; no miss ends it. First run: one loop is compulsory (about 4 s); the "To the ring" button (56 px high) shows after loop 1, at once on later runs. After 3 fits in a row "That will do." shows and the button pulses. Fixed banner "REHEARSAL - nothing counts", no Laughs meter, no crowd, the same drum. The board wall gets a third button, "Rehearse", using the same module.

### P5. Retry distance
Argument: Mobile producer: "The error is fresh in the dressing room; offer practice there." / Dazai: "After a flop he sits with it; a drill is a lie." / Nietzsche: "Live this night again is the only honest retry."
First vote: 11 of 13
No offer after the act: Dazai, Camus. After red team: 10 of 13.
Answer: "Live this night again" on the end card, restarting at the board wall (no title, no face paint). On reruns the corridor walk runs at 1.6x. After an act with 3 or fewer fits of 9 the dressing-room mirror shows "Practise in the mirror" and "Step through"; the practice is unscored. Target board wall to first ring 15 s or less: a guess until measured.

### P6. Mirror World, first 10 seconds
Argument: Psychologist: "Four threats plus scrolling text is overload; freeze, state the goal, wake them one by one." / Core gamer: "After the card, all four at once; that is the room." / Jam judge: "One at a time is fine only if a clock forces the next one in."
First vote: 11 of 13
All four after the card: Core gamer; no card: Nietzsche. After red team: 10 of 13.
Answer: at 0.0 s everything is frozen (figures, drain, idle timer); all four stand at their spots as dim, dormant shapes. Card: "Bring every figure down. Put out the Light. Pick up every shard. At 0 Laughs you wake at the mirror." with a "Begin" button and no timer. On Begin the Stare wakes with a 0.8 s tell (glow plus sound). The idle timer starts on the first input or 3 s after Begin. Wake order Stare, Shame, Whisper, Light: the next wakes when the last is down and its shards are picked up, or 15 s after the last wake, whichever is first. Count, fixed top left: "Figures left 4 · Shards to pick up 0".

### P7. Banner or the clown's own line
Argument: Mobile producer: "One fixed place, five words, always there." / Story writer: "A HUD label is the game talking; it should be his thought." / Chaplin: "No words; show it."
First vote: 8 of 13
Banner 8; the clown's line 4 (Story writer, Dazai, Camus, Nietzsche); no words 1 (Chaplin).
Answer: a banner for the nearest awake figure. Stare: "Hit it from the side." Shame: "Fall to shake it off." Whisper: "Step aside. Don't fall." Light: "Three gags on its lamp." (with 3 pips). Portrait: top centre under the Laughs meter, 36 px high, 16 px text, 90% max width, not tappable, never in the bottom 40%. The four figure tips are switched off; the spend and idle tips stay.

### Round 2 red team

- P2 (Streamer argues no): "The ghost repeats what the rehearsal just taught and adds dead air to every run; the slower chain 1 also makes chain 2 feel like a speed-up trap." Second vote: 9 of 13; Streamer moved to count-in only.
- P3 (Indie critic argues no): "Word, frozen ring, lean and sound inside 600 ms is four signals for one fact; on a phone that is noise." Second vote: 11 of 13; Indie critic moved (wants the word dropped after chain 1).
- P5 (Story writer argues no): "Practice straight after the flop turns his shame into a drill and cheapens the mirror scene that follows." Second vote: 10 of 13; Story writer moved to no offer.
- P6 (Jam judge argues no): "One at a time with a 15 s cap can make the room over a minute long; judges leave." Second vote: 10 of 13; Jam judge moved to all four after the card.

### Round 2 dissent

- Dazai: "An act that cannot end is not an act. You have removed the one moment the game was honest."
- Nietzsche: "Keep two misses. With a rehearsal he has had his look; now let him fall."
- Core gamer, Indie critic, Streamer: "From chain 2 on, misses should end it. Nine free rings has no stakes."
- Core gamer, Nietzsche: "Slowing chain 1 teaches the wrong tempo."
- Dazai: "No count-in, no result word. Nobody tells him why."
- Indie critic, Core gamer: "Rehearsal belongs at the board wall only."
- Nietzsche, Dazai: "Rehearse once. A repeatable button is a place to hide."
- Dazai, Camus, Story writer: "No practice offer after the act. Let it sit."
- Core gamer, Jam judge: "All four figures at once after the card."
- Nietzsche: "No goal card. He does not get told what ends it."
- Story writer, Dazai, Camus, Nietzsche: "The answer should be his own line, not a label."
- Chaplin: "If it needs words, the figure is drawn wrong."

### What this breaks or needs (panel)

- P1 and the wider chain-1 windows raise the Laughs that reach the Mirror World for weak players, so its balance shifts: log Laughs at entry before and after, then rerun the bot sweep.
- The one-chance rule needs stating: "This night comes once." on the act's start card (round 1, 8 votes).
- Tells: the flop gag is the act's tell; each figure wake is 0.8 s; the 1.0 s idle warning must not start under the frozen card.
- With the 15 s cap figures can still stack to four; the count and the win check must treat dormant figures as "left".
- Phone portrait top stack (Laughs, count, banner) must fit in about 130 px; HIT button 72 px or more; every new button 44 px or more.
- Open risk from the P2 red team: chain 2 speeding up from 1200 to 900 ms; watch it in the fresh-player test.

### Producer check (lead, not a vote)

- P1: the panel wrote "a missed ring pays 0 Laughs". The build already pays per fall in the act (`night1.html` line 834: each timing miss is a fall) and the deliberate fall has a floor. Default: the existing pay stays; only the two-miss ending goes on night 1. Not checked: whether the cue page or `night1.html` owns that pay.
- P2: the slower first chain changes the GDD's night-1 tempo (600 ms). It changes the feel, so it is the owner's choice, behind a CONFIG switch. The count-in alone had 12 of 13 behind it (everyone but Dazai).
- P5: the 1.6x rerun walk changes how the approved walk clip looks; owner's choice. The dressing-room practice offer passed 10 of 13 with the three story seats against.
- P6: one at a time changes night 1's fight (asked in round 1 as well); owner's choice. The card and the count do not depend on it.
- P7: banner 8 against his own line 4. Default: the banner's place and persistence, worded as his thought where it costs nothing ("Three gags on its lamp." already reads either way).
- The values are the panel's guesses. The batch measures the board-wall-to-first-ring time and the Laughs at Mirror World entry before and after.

### Build list (one batch, each item behind a CONFIG switch, after the owner's answers)

1. Measure only: board wall to first ring; Laughs at Mirror World entry.
2. Night 1: no miss ends the act; flop gag at 2 misses in a chain.
3. Result word 550 ms, frozen ring 300 ms, early/late body and sound.
4. Count-in of 3 beats at 800 ms, ghost ring until the first fit, HIT pulse; chain-1 values 1200 / 800 / 100 / 220 if the owner agrees.
5. Rehearsal at the mirror (one loop compulsory on the first run) and "Rehearse" on the board wall; "This night comes once." on the act's start card.
6. Mirror World entry card with the goal text, the count, 3 s idle grace.
7. Wake order with 0.8 s tells and the 15 s cap, if the owner agrees.
8. Nearest-figure banner; figure tips off.
9. "Live this night again" at the board wall; practice offer in the dressing room; rerun walk speed if the owner agrees.
10. Step 1's measurements again, the bot sweep, and a stranger cold read before any further vote.
