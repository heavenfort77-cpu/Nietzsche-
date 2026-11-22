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
