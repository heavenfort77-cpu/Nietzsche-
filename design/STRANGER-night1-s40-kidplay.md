# Stranger report: nights 1-2 played cold by a 4th-grade reader (phone), session 40

Kind: cold-read (played: the player drove the game itself, from screenshots and on-screen text only)
Owner, 25 Nov 08:28: "i want the bot to have an elementary student understanding of language, i want to know at which stage instructions is unclear that player will be lost and which part is unplayable"
Build: 08d231f game code (`web/step0/night1.html?tester`, unchanged since session 39 batch 2, F46), served on the session box (software GL, no sound reaches the player).
Tool: `tools/coldplay/` with `KID=1` (batch 1, 6fdbffc; run 2 also with the init-script mask and `START`, batch 2): every word outside the Dale-Chall list (2,941 words most 4th graders know) shown as ??? in the picture, text list and button labels. Brief: "Kid reader" in `tools/coldplay/BRIEFS.md`. Reading grades: `tools/coldplay/readgrade.py` (Flesch-Kincaid, vowel-group syllables; lines of 4+ words). Positions are the log's hidden state (clown x, z).

## Players

| Run | Model | Device | Start | Commands | Furthest | Scores clarity/fun/next | Page errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| kid1 | Haiku | phone 390x844, touch | night 1 | 47 + quit | end of night 1 (night 2 title: tool mask lost on the reload, see below) | 2/3/2 | 0 |
| kid2 | Haiku | phone 390x844, touch | night 2 (`START=n=2&m=0&s=0`, what kid1 earned) | 60 | night 3 quote card | 3/3/3 | 0 |

## Where the kid is lost, by stage (both runs unless named)

| Stage | Instruction as the kid read it | Understood | Could do it |
| --- | --- | --- | --- |
| Title | "Night 1 · ???" (prototype) | yes | yes |
| Paint | "His face is half painted. Tap to paint the smile on." (grade 0.5) | yes | yes, 1 tap |
| Dazai card | "My clowning was my last ??? of ???." / "...(our ???)" | no | yes (button readable) |
| Act board | "Tap tonight's act on the board." "The fall" / "The ???" (sweep) | yes | yes |
| Act note | "The ??? fall" (deliberate); start button "??? it" (Perform it) | partly | yes, by guessing the gold button |
| Corridor | "Walk up the ??? to the ring. Go round the ???." (corridor, crew) + "Drag anywhere to walk." | partly | yes |
| Wings, walk out | "The ring is through the ??? by the red curtains" (gap); button "??? over the ???" (Pratfall over the cable); "Down over the ???, and up again" read as a drag down (both runs dragged down) | partly | kid1 yes; kid2 stuck among the crew 8 commands (steps 10-17), out only when the pratfall moved him |
| Ring entrance | "Walk into the light." + button "Trip" | yes / no ("I do not know what trip means": never pressed) | yes |
| **Fall act** | "Fall in the light, on the crash. · Fall 1 of 3" "Walk: drag anywhere. Fall: the gold button." | words yes, meaning no: nothing says what or when "the crash" is | **no: 0 of 4 falls, Laughs +0, both nights** |
| Walk back | "Walk back toward the ???, into the wings." (camera) "The ??? back is at the bottom left." (corridor) | partly | yes, slowly: kid1 7 commands, kid2 9 (bumping the crew) |
| Room | "Turn to the mirror wall and sit. Look around: the arrow buttons." "??? room" (Cube) | yes | yes, 3 right arrows then "Face the mirror" |
| Mirror | "Tap: ??? his hand to it." (press) | partly | yes (tapped the glass) |
| **Mirror World** | "Stick: move. ??? cost Laughs. Stand still and they ???." (Gags, gnaw); buttons SLAP -2, PIE -3 (grey), ??? -1 (DODGE); "Laughs 0 · Pies 0 · ??? 0" (Shards) | partly | **nothing to play: 0 Laughs, over after 1-2 commands at the first figure** (kid1 steps 36-37, kid2 47-48) |
| Nietzsche card | "In vain was all our labour." -> "In ??? was all our ???." | no | yes (button readable) |
| **Shop** | "...kept half his ???: 0 ???." "Every ??? adds a paint layer, and the ??? learns it." (shards, purchase, Performer); items "??? sweep", "Dash" | no | **nothing to do: 0 shards, every item grey** |
| End card | "End of night 1 · The shame of living: nothing bought tonight · Laughs earned 0" | partly ("did not get why the crowd did not laugh") | yes |

## The fall act (where both runs are first lost)

- Fall 1: both pressed Fall at once when the button showed, at (0.6, 0); pool 1 is at (1.6, 0.2) radius 1.2 (`N1.fallFirst`, line 1288), so he stood 1.02 m from its centre, **inside the light**. Graded "dark" because the press came before the drum roll began (line 3539: `F.press < 0 || !F.inPool` -> dark). The caption "Nobody saw it. He fell in the dark." gives the wrong reason; kid2 concluded "I must be in the light when I fall".
- Fall 2: the pool moved; walking there (drag of 1.5-2 s plus 0.8 s settle per command) let the 1.6 s roll run out: "Too late. The crash hit a clown still standing." Part of this is the tool's step size (a real thumb can press mid-walk); the other part is that no seen tell says the crash is coming: the band leader's stick (0.5 s) was not noticed in either run, and the crash itself is a sound.
- Two misses end the act. kid2: "The Fall timing had no clear tell for when to fall, and the fall count only showed after I had already missed."

## Unplayable

1. The fall act, for a reader who cannot hear the drum or does not know to wait for it: 0 of 4 falls landed (two nights).
2. Because of 1, the rest of each night is empty: the Mirror World with 0 Laughs ends at the first figure in 1-2 commands, and the shop has 0 shards. Both nights scored Laughs 0, Mask 0, nothing bought.
3. Night 3 not reached in play (kid2 out of commands at its quote card).

## Hard words (outside the 4th-grade list) on the main path

prototype, Cube, courtship, humanity, deliberate, Perform, corridor, crew, gap, Props, Pratfall, cable, Strongman, laughter, entrance, camera, press, Shards, Gags, gnaw, DODGE, vain, labour, shards, purchase, Performer, Spotlight, Lent, Details. Quote credits (Dazai, Nietzsche, Zarathustra) also unreadable. Full per-line tables with grades: appendix.

## Tool fault in run 1 (test tool, not the game)

Cause: log steps 44-46 `TypeError: window.__kidMask is not a function` after "Go on to night 2" (the next night is a page reload; the mask was evaluated into the first load only; step 45's real text `Night 2 · prototype` shows the game loaded). Removed by: `page.addInitScript` (batch 2). Proof: lead's load with `START=n=2&m=0&s=0`, `location.reload()`, then `Night 2 · ???` at step 2 with no error; kid2 went from night 2 to night 3 through the reload (step 54 "Execution context was destroyed" is the reload itself; step 56 onward played).

## Appendix: per-line reading grade

### kid1 (night 1)
| step | scene | kind | line | grade | words a 4th grader may not know |
| --- | --- | --- | --- | --- | --- |
| 0 | title | text | Corridor |  | Corridor |
| 0 | title | text | The Clown and the Mirror | 0.5 |  |
| 0 | title | text | Night 1 · prototype |  | prototype |
| 0 | title | button | Full screen |  |  |
| 0 | title | button | Start |  |  |
| 1 | paint | text | Cube room: Dressing room | 0.7 | Cube |
| 1 | paint | text | His face is half painted. Tap to paint the smile on. | 0.5 |  |
| 1 | paint | button | Full screen |  |  |
| 2 | paint | text | "My clowning was my last courtship of humanity." | 6.7 | courtship, humanity |
| 2 | paint | text | そこで考え出したのは、道化でした。それは、自分の、人間に対する最後の求愛でした。 |  |  |
| 2 | paint | text | Dazai, No Longer Human (our translation) | 8.4 | Dazai, Human, translation |
| 2 | paint | button | To the act board | -2.2 |  |
| 3 | bravado | text | Cube room: Dressing room | 0.7 | Cube |
| 3 | bravado | text | He gets into the role. The act board is next. | 0.5 | role |
| 3 | bravado | button | Full screen |  |  |
| 4 | boardwall | text | Cube room: Act board | -2.2 | Cube |
| 4 | boardwall | text | Choose tonight's act on the board. | 0.5 |  |
| 4 | boardwall | text | Tap tonight's act on the board. | 0.5 |  |
| 4 | boardwall | button | The fall |  |  |
| 4 | boardwall | button | The sweep |  |  |
| 4 | boardwall | button | Full screen |  |  |
| 5 | note | text | The deliberate fall |  | deliberate |
| 5 | note | text | Fall in the light, on the crash. | -1.1 |  |
| 5 | note | button | More |  |  |
| 5 | note | button | Perform it |  | Perform |
| 5 | note | button | Back |  |  |
| 6 | walk | text | Corridor |  | Corridor |
| 6 | walk | text | Walk up the corridor to the ring. Go round the crew. | 0.5 | corridor, crew |
| 6 | walk | text | Drag anywhere to walk. | 3.7 |  |
| 6 | walk | button | Full screen |  |  |
| 8 | walk | text | Wings |  |  |
| 8 | walk | text | The ring is through the gap by the red curtains, at the back. | 2.2 | gap |
| 8 | walk | text | Props: Your pie. Don't eat it this time. | -2.2 | Props |
| 9 | walk | button | Pratfall over the cable | 6.6 | Pratfall, cable |
| 10 | walk | text | Strongman: For luck! Give it a honk. | -0.7 | Strongman |
| 11 | walk | text | Down over the cable, and up again. | 4.0 | cable |
| 12 | walk | button | Honk the horn |  |  |
| 13 | walk | text | HONK! The strongman roars with laughter. | 1.3 | strongman, laughter |
| 14 | walk | text | Ring entrance |  | entrance |
| 14 | walk | text | Walk into the light. | 0.7 |  |
| 15 | walk | button | Trip |  |  |
| 16 | act | text | Fall in the light, on the crash. · Fall 1 of 3 | -0.3 |  |
| 16 | act | text | Walk: drag anywhere. Fall: the gold button. | 2.6 |  |
| 16 | act | button | Fall |  |  |
| 16 | act | button | Full screen |  |  |
| 17 | act | text | Nobody saw it. He fell in the dark. | 0.7 |  |
| 19 | act | text | Fall in the light, on the crash. · Fall 2 of 3 | -0.3 |  |
| 21 | act | text | Too late. The crash hit a clown still standing. | -0.7 |  |
| 22 | act | text | Bad: coughs, a phone glow, someone walks out. | 0.8 |  |
| 22 | act | text | Laughs +0 · Mask 0 |  |  |
| 22 | act | button | Walk back |  |  |
| 23 | back | text | Ring entrance |  | entrance |
| 23 | back | text | Walk back toward the camera, into the wings. | 5.2 | camera |
| 23 | back | text | Drag anywhere to walk. | 3.7 |  |
| 23 | back | button | Full screen |  |  |
| 26 | back | text | Wings |  |  |
| 26 | back | text | The corridor back is at the bottom left. | 3.8 | corridor |
| 30 | back | text | Cube room: Tent exit | 0.7 | Cube |
| 30 | back | text | Laughs |  |  |
| 30 | back | text | 0 |  |  |
| 30 | back | text | · Mask |  |  |
| 30 | back | text | Into the Mirror: 0 Laughs | 3.7 |  |
| 30 | back | text | Turn to the mirror wall and sit. | 0.6 |  |
| 30 | back | text | Look around: the arrow buttons. | 5.2 |  |
| 30 | back | button | ◀ |  |  |
| 30 | back | button | ▶ |  |  |
| 31 | back | text | Cube room: Act board | -2.2 | Cube |
| 32 | back | text | Cube room: Dressing room | 0.7 | Cube |
| 33 | back | text | Cube room: Mirror |  | Cube |
| 33 | back | button | Face the mirror |  |  |
| 34 | back | text | A pale form of him in the glass. Tap: press his hand to it. | -0.2 | press |
| 36 | mw | text | Laughs 0 · Pies 0 · Shards 0 |  | Shards |
| 36 | mw | text | Stick: move. Gags cost Laughs. Stand still and they gnaw. | -2.5 | Gags, gnaw |
| 36 | mw | text | The mirror corridor. The way to the white is the pale door. | 2.5 | corridor |
| 36 | mw | button | Full screen |  |  |
| 36 | mw | button | SLAP -2 |  |  |
| 36 | mw | button | PIE -3 |  |  |
| 36 | mw | button | DODGE -1 |  | DODGE |
| 37 | mw | text | Step past it. Stay on your feet. | -2.4 |  |
| 38 | out | text | "In vain was all our labour." | 0.5 | vain, labour |
| 38 | out | text | Nietzsche, Thus Spake Zarathustra II, "The Soothsayer" (Common) | 6.7 | Nietzsche, Thus, Spake, Zarathustra, II, Soothsayer, Common |
| 39 | small | button | Stand up |  |  |
| 41 | shop | text | Cube room: Mirror |  | Cube |
| 41 | shop | text | He woke at the mirror and kept half his shards: 0 shards. | 1.6 | shards, shards |
| 41 | shop | text | Every purchase adds a paint layer, and the Performer learns it. | 5.9 | purchase, Performer |
| 41 | shop | button | Full screen |  |  |
| 41 | shop | button | Spotlight sweep Lent tonight. Buy it and it is yours. | 0.5 | Spotlight, Lent |
| 41 | shop | button | Dash (Mirror) A dash you buy is a dash the Performer gets. | 3.8 | Performer |
| 41 | shop | button | End the night |  |  |
| 42 | end | text | End of night 1 |  |  |
| 42 | end | text | The shame of living: | 0.7 |  |
| 42 | end | text | nothing bought tonight |  |  |
| 42 | end | text | Laughs earned 0 · They laughed hardest at the act · Mask 0 | 3.7 |  |
| 42 | end | text | He got up. |  |  |
| 42 | end | button | Details |  | Details |
| 42 | end | button | Go on to night 2 | -2.2 |  |
| 42 | end | button | Start again from night 1 | 0.7 |  |
| 45 | title | text | Night 2 · prototype |  | prototype |

### kid2 (nights 2-3)
| step | scene | kind | line | grade | words a 4th grader may not know |
| --- | --- | --- | --- | --- | --- |
| 0 | title | text | Corridor |  | Corridor |
| 0 | title | text | The Clown and the Mirror | 0.5 |  |
| 0 | title | text | Night 2 · prototype |  | prototype |
| 0 | title | button | Full screen |  |  |
| 0 | title | button | Start |  |  |
| 1 | paint | text | Cube room: Dressing room | 0.7 | Cube |
| 1 | paint | text | His face is half painted. Tap to paint the smile on. | 0.5 |  |
| 1 | paint | button | Full screen |  |  |
| 2 | paint | text | He paints the smile on. | 0.5 |  |
| 3 | paint | text | "I have lived a life full of shame." | 0.8 |  |
| 3 | paint | text | 恥の多い生涯を送って来ました。 |  |  |
| 3 | paint | text | Dazai, No Longer Human (our translation) | 8.4 | Dazai, Human, translation |
| 3 | paint | button | To the act board | -2.2 |  |
| 4 | bravado | text | Cube room: Dressing room | 0.7 | Cube |
| 4 | bravado | text | He gets into the role. The act board is next. | 0.5 | role |
| 4 | bravado | button | Full screen |  |  |
| 5 | boardwall | text | Cube room: Act board | -2.2 | Cube |
| 5 | boardwall | text | Choose tonight's act on the board. | 0.5 |  |
| 5 | boardwall | text | Tap tonight's act on the board. | 0.5 |  |
| 5 | boardwall | button | The fall |  |  |
| 5 | boardwall | button | The scale |  | scale |
| 5 | boardwall | button | Full screen |  |  |
| 6 | note | text | The deliberate fall |  | deliberate |
| 6 | note | text | Fall in the light, on the crash. | -1.1 |  |
| 6 | note | button | More |  |  |
| 6 | note | button | Perform it |  | Perform |
| 6 | note | button | Back |  |  |
| 7 | walk | text | Corridor |  | Corridor |
| 7 | walk | text | Walk up the corridor to the ring. Go round the crew. | 0.5 | corridor, crew |
| 7 | walk | text | Drag anywhere to walk. | 3.7 |  |
| 7 | walk | button | Full screen |  |  |
| 9 | walk | text | Wings |  |  |
| 9 | walk | text | The ring is through the gap by the red curtains, at the back. | 2.2 | gap |
| 9 | walk | text | Props: Your pie. Don't eat it this time. | -2.2 | Props |
| 17 | walk | button | Pratfall over the cable | 6.6 | Pratfall, cable |
| 19 | walk | text | Down over the cable, and up again. | 4.0 | cable |
| 20 | walk | text | Strongman: For luck! Give it a honk. | -0.7 | Strongman |
| 20 | walk | button | Honk the horn |  |  |
| 21 | walk | text | HONK! The strongman roars with laughter. | 1.3 | strongman, laughter |
| 24 | walk | text | Ring entrance |  | entrance |
| 24 | walk | text | Walk into the light. | 0.7 |  |
| 24 | walk | button | Trip |  |  |
| 26 | act | text | Fall in the light, on the crash. · Fall 1 of 3 | -0.3 |  |
| 26 | act | text | Walk: drag anywhere. Fall: the gold button. | 2.6 |  |
| 26 | act | button | Fall |  |  |
| 26 | act | button | Full screen |  |  |
| 27 | act | text | Nobody saw it. He fell in the dark. | 0.7 |  |
| 28 | act | text | Fall in the light, on the crash. · Fall 2 of 3 | -0.3 |  |
| 29 | act | text | Too late. The crash hit a clown still standing. | -0.7 |  |
| 30 | act | text | Two misses. The act ends. | -0.5 |  |
| 31 | act | text | Bad: coughs, a phone glow, someone walks out. | 0.8 |  |
| 31 | act | text | Laughs +0 · Mask 0 |  |  |
| 31 | act | button | Walk back |  |  |
| 32 | back | text | Ring entrance |  | entrance |
| 32 | back | text | Walk back toward the camera, into the wings. | 5.2 | camera |
| 32 | back | text | Drag anywhere to walk. | 3.7 |  |
| 32 | back | button | Full screen |  |  |
| 35 | back | text | Wings |  |  |
| 35 | back | text | The corridor back is at the bottom left. | 3.8 | corridor |
| 41 | back | text | Cube room: Tent exit | 0.7 | Cube |
| 41 | back | text | Laughs |  |  |
| 41 | back | text | 0 |  |  |
| 41 | back | text | · Mask |  |  |
| 41 | back | text | Into the Mirror: 0 Laughs | 3.7 |  |
| 41 | back | text | Turn to the mirror wall and sit. | 0.6 |  |
| 41 | back | text | Look around: the arrow buttons. | 5.2 |  |
| 41 | back | button | ◀ |  |  |
| 41 | back | button | ▶ |  |  |
| 42 | back | text | Cube room: Act board | -2.2 | Cube |
| 43 | back | text | Cube room: Dressing room | 0.7 | Cube |
| 44 | back | text | Cube room: Mirror |  | Cube |
| 44 | back | button | Face the mirror |  |  |
| 45 | back | text | A pale form of him in the glass. Tap: press his hand to it. | -0.2 | press |
| 47 | mw | text | Laughs 0 · Pies 0 · Shards 0 |  | Shards |
| 47 | mw | text | Stick: move. Gags cost Laughs. Stand still and they gnaw. | -2.5 | Gags, gnaw |
| 47 | mw | text | The mirror corridor. The way to the white is the pale door. | 2.5 | corridor |
| 47 | mw | text | The Mirror |  |  |
| 47 | mw | button | Full screen |  |  |
| 47 | mw | button | SLAP -2 |  |  |
| 47 | mw | button | PIE -3 |  |  |
| 47 | mw | button | DODGE -1 |  | DODGE |
| 48 | mw | text | Step past it. Stay on your feet. | -2.4 |  |
| 49 | out | text | "All is empty, all is alike, all hath been!" | 2.3 | hath |
| 49 | out | text | Nietzsche, Thus Spake Zarathustra II, "The Soothsayer" (Common) | 6.7 | Nietzsche, Thus, Spake, Zarathustra, II, Soothsayer, Common |
| 50 | small | button | Stand up |  |  |
| 52 | shop | text | Cube room: Mirror |  | Cube |
| 52 | shop | text | He woke at the mirror and kept half his shards: 0 shards. | 1.6 | shards, shards |
| 52 | shop | text | Every purchase adds a paint layer, and the Performer learns it. | 5.9 | purchase, Performer |
| 52 | shop | button | Full screen |  |  |
| 52 | shop | button | The talking scale Tried out tonight. Buy it and it is yours. | 1.5 | scale |
| 52 | shop | button | Tit-for-tat Never tried on the board. Buy it and it is yours. | -0.2 | Tit, tat |
| 52 | shop | button | Dash (Mirror) A dash you buy is a dash the Performer gets. | 3.8 | Performer |
| 52 | shop | button | End the night |  |  |
| 53 | end | text | End of night 2 |  |  |
| 53 | end | text | The shame of living: | 0.7 |  |
| 53 | end | text | nothing bought tonight |  |  |
| 53 | end | text | Laughs earned 0 · They laughed hardest at the act · Mask 0 | 3.7 |  |
| 53 | end | text | He got up. |  |  |
| 53 | end | button | Details |  | Details |
| 53 | end | button | Go on to night 3 | -2.2 |  |
| 53 | end | button | Start again from night 1 | 0.7 |  |
| 56 | title | text | Night 3 (the last) · prototype | 3.7 | prototype |
| 59 | paint | text | "He was a good child, like a god." | -0.7 |  |
| 59 | paint | text | 神様みたいないい子でした |  |  |
| 59 | paint | text | Dazai, No Longer Human, the madam's last words (our translation) | 7.2 | Dazai, Human, madam's, translation |
