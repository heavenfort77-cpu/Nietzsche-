# Panel verdict: night 1 on theme, and where the Nietzsche line goes (22 Nov)

Method: 12 judges scored from the design brief and targeted reads of `web/step0/night1.html` (quote config lines 560-561, `showDazai` 1428, `nietzscheCard` 2103-2108, construct config 573-576, shop 2110-2125). This is a judgement of design and code, not a playtest; the Project doc `Panel-review-22-Nov.md` could not be read here, so the roster is the one in the brief.

Lines: (a) "All is empty, all is alike, all hath been!"  (b) "In vain was all our labour."  Both Common, Zarathustra II, "The Soothsayer". Placement: 1 = on leaving the mirror, 2 = at the big mirror before going in, 3 = both.

| Judge | Theme score (1-5) | Placement | Line | Note |
|---|---|---|---|---|
| Nietzsche (through his work) | 3 | 1 | (b) | The mask and the recurrence are both there, but nothing yet comes back the same. The line belongs after the effort, when he sits down in the chair he left. |
| Dazai (through his work) | 4 | 1 | (b) | The child asking for the trip "on purpose" is the strongest moment: someone sees the act is an act. The corridor before it is too friendly; the crew should want something from him. |
| Core gamer | 3 | 1 | (b) | The constructs fight fair with 0.4 s tells, so the fight does not feel hostile. Hostility has to come from what winning costs, and the shop teaching the boss is the right place. It is one small line of text now. |
| Casual phone player | 3 | 1 | (b) | Six words read at a glance on a phone. The current card puts the quote, the shard count and a button together, so I would tap past it. |
| Jam judge | 3 | 1 | (b) | I would have to be told the theme. In the first five minutes nothing works against the player; the first place it could is the crowd reaction. |
| Camus (through his work) | 3 | 3 | (a) in, (b) out | He should know it is pointless before he goes in and go anyway. That is the whole character. |
| Chaplin (through his work) | 4 | 1 | (b) | The crowd laughing hardest at the fall he did not want is the theme without a word. Pay the trip more than the clean hit and show it. |
| Professional auguste clown | 4 | 1 | (b) | Putting on the face before you may leave the room is true to the job. The door should not open for a bare face. |
| Clinical psychologist | 3 | 3 | (a) in, (b) out | Standing still in the Light is accurate exposure. The constructs are not tied to anyone from his evening, so they read as monsters and not as his own thoughts. |
| Indie critic | 3 | 1 | (b) | The Dazai line gives the reason, the Nietzsche line gives the result: one each side of the night is clean. A third card weakens both. |
| Streamer | 2 | 2 | (a) | Nothing here makes me say "the game did that to me" out loud. Put the line where the reflection cracks; that is the clip. |
| Mobile producer | 3 | 1 | (b) | One line before the act, one after the mirror, each alone on screen. Keep the shard count for the shop. |

Averages: theme fit 3.17 / 5 (38 of 60). Range 2 to 4.

Placement vote: option 1 = 9, option 3 = 2, option 2 = 1. Line: (b) = 9 as the only line, plus 2 as the exit line in option 3; (a) = 1 as the only line.

Verdict: placement 1, line (b) "In vain was all our labour.", shown on leaving the mirror, as its own beat (fix 1). Reason the owner missed it, from the code: `nietzscheCard` shows the quote on the same card as the shard count and the "To the mirror" button, so it reads as a results screen. The code also still carries the old lines (560: "I have lived a life full of shame."; 561: "Everything that is profound loves the mask."), so the line the owner was looking for was not the one shown. (Producer: the panel read the file before session 14's batch 1 edit; that batch swapped both lines.) Credit as: Nietzsche, Thus Spake Zarathustra, "The Soothsayer" (Common). Line (a) is kept in reserve for a later night's mirror entry if the owner wants the foreboding beat.

Ranked fixes (fixes only, nothing cut):

| # | Fix | Where in night 1 | Overlaps owner note? | Judges asking |
|---|---|---|---|---|
| 1 | Give the Nietzsche line its own beat: after the fog he is back in the same chair in the same pose, screen dark, the line alone, held about 2.5 s with one low tone before any button appears. Move the shard count to the shop card. Same beat for win and loss, so a win lands in the same place as a loss. | Leaving the Mirror World, before the shop (`nietzscheCard`) | Yes: "where is the Nietzsche line?" | Nietzsche, casual, mobile producer, indie critic, core gamer, jam judge |
| 2 | Make the crowd pay most for what hurts him: the trip and the pie earn more Laughs than a clean cue, and the reaction line says so ("They laughed hardest at the fall."). The tell stays; only the reward is turned against him. | Crowd reaction after the timing cue | No | Chaplin, Dazai, jam judge, streamer |
| 3 | Tie each construct to someone from his evening, and walk him in through a bent copy of the corridor instead of starting in the ring: the stagehand's lamp becomes the Light, the child's look becomes the Stare, the strongman's horn is heard before the Whisper strikes. The crew stand where they stood, wrong-sized and facing him. | Fog to Mirror World entry, and each construct's first tell | Yes: Mirror World must look unworldly; must not start straight in the ring | Psychologist, Dazai, Camus, streamer |
| 4 | Give the dressing table the job of the mask: the door to the corridor stays shut until the face is finished there, and each paint layer bought in the shop sits on the table as one more pot he must put on the next night. | Changing room at the start; shop to end card | Yes: dressing table has no purpose | Auguste clown, Nietzsche, indie critic |
| 5 | Show the shop turning on him at the moment of buying: the reflection performs the bought move back at him at full size, and the end card lists "The Performer now knows:" with every purchase. | Mirror shop and end card | No | Core gamer, jam judge, streamer, mobile producer |
| 6 | Let the gains leak in front of him: in the cube room the Laughs count ticks down while the applause fades in the sound, stopping only when he sits at the mirror; faint clapping is heard in the Mirror World on each pratfall (plants the final night's unseen clapping). | Walk back, cube room, Mirror World sound | Partly: cube room (it is being reworked so it does not show the ring) | Camus, Chaplin, psychologist |

## Producer notes (session 14, batch 1)

- Applied: night-1 Dazai line "My clowning was my last courtship of humanity." (owner); Nietzsche line (b) on leaving the mirror (`N1.nietzscheAt: 'out'`); fix 1 in part: the line has its own card, its button shows after 2.5 s (`nietzscheHoldMs`) over a 98 Hz tone, the shard count moved to its own card after it, same for win and loss. Not applied from fix 1: "back in the same chair" (the card covers the screen; no chair shot exists yet).
- Line (a) kept as `N1.nietzscheIn`, shown at the mirror before he goes in only with `nietzscheAt: 'both'`.
- Fixes 3, 4, 6 overlap the owner's queued notes (Next step 4, 5, 2) and are folded into those samples as proposals. Fixes 2 and 5 are new: owner to agree before they are built.
