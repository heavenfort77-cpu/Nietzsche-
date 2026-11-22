# Panel verdict: night 1 on gameplay, theme and fun (22 Nov, session 15)

Method: the same 12 judges as `design/PANEL-theme.md`, scored from the design brief, targeted reads of `web/step0/night1.html` and `cue_model.html`, and the session 15 smoke run (`smoke_night1.cjs` 48 of 48, desktop and phone). This is a judgement of design and code, not a playtest by people.

What changed since the theme panel (session 15, batch 1, both behind CONFIG switches):
- Item 2 (`hurtPays`): each fall in the act pays 20 Laughs, the first fall puts the props girl's pie in his own face for 25 (one pie fewer for the Mirror), the trip for the child pays 15. A clean Perfect pays 10. The crowd card says "They laughed hardest at ..." when the hurt out-earns the act.
- Item 5 (`performerLearns`): the shop is held at the mirror. Each purchase: he stays seated, the reflection stands, a crack shows, it steps 1.4 m closer and performs the move (slap clip for the spotlight sweep, a lunge for the dash) and stays standing.
- End card heading over the purchase list: "The shame of living:" (owner, 22 Nov; was "The Performer now knows:").

Numbers the gameplay judges used (night 1: 9 beats, the act ends at the 2nd miss, floor 15): all Perfect 90 + trip 15 = 105 Laughs, Mask +9. Fall twice at once: 15 + 40 + 25 + 15 = 95, Mask 0. Seven Perfect then two falls: 70 + 40 + 25 + 15 = 150, Mask +7, and the Mirror adds both the Stare (a Perfect) and Shame (a miss).

| Judge | Gameplay | Theme | Fun | End card heading | Note |
|---|---|---|---|---|---|
| Nietzsche (through his work) | 3 | 4 | 3 | shame of living | The reflection one step closer per purchase is recurrence you can see. What he buys is how he goes on living, so the heading fits the list. |
| Dazai (through his work) | 3 | 5 | 3 | shame of living | My first line made into a ledger. The house laughing hardest at the pie in his own face is the clowning of the book: they love the injury, not the skill. |
| Core gamer | 4 | 4 | 3 | Performer knows | Item 2 makes a real choice: play clean, then fall twice at the end for 150 against 105, and pay for it with two extra monsters. Nothing tells me before the card, so a first player cannot plan it. The old heading warned me about the boss. |
| Casual phone player | 3 | 3 | 3 | Performer knows | The crowd headline reads at a glance. In the shop I see him stand up, fine. The new heading is pretty but I no longer know the shop taught the boss. |
| Jam judge | 3 | 4 | 3 | shame of living | The theme now shows in the first five minutes, at the crowd card (theme 3 to 4). But I read it; I do not hear it. |
| Camus (through his work) | 3 | 5 | 3 | shame of living | He learns falling pays and he falls again tomorrow. The heading names that. |
| Chaplin (through his work) | 3 | 5 | 4 | shame of living | What I asked for, with one contradiction: in the act a fall still plays a slip and a cough (`cue_model.html` line 430), then the card says they laughed hardest. The biggest laugh must be heard at the fall itself. |
| Professional auguste clown | 3 | 4 | 3 | shame of living | The house wants real falls; the pie in your own face is the oldest laugh there is. True to the trade. |
| Clinical psychologist | 3 | 4 | 3 | shame of living | Reward for the injury, then the reflection rehearsing what he bought: a reinforcement loop shown, not preached. Shame is about the self, not the deed, so the word is right. |
| Indie critic | 3 | 4 | 3 | shame of living | Each card carries one idea. The heading over a list of purchases reads like a receipt; that is the point. |
| Streamer | 3 | 4 | 4 | shame of living | The reflection getting up while he stays seated, then walking at the camera: that is the clip. Give it a sound: the crack, a laugh from the glass. |
| Mobile producer | 2 | 3 | 3 | Performer knows | Paying for falls with no tell feels like a trick on the second night unless the game carries the lesson over. On portrait the shop buttons sit low over the glass; nobody has checked the performance stays visible there. |

Averages: gameplay 3.08, theme 4.08 (was 3.17 on the theme panel), fun 3.17 (of 5). Heading vote: "The shame of living:" 9, "The Performer now knows:" 3.

Verdict: keep items 2 and 5 on. Theme rose by about 0.9; gameplay and fun are held back by what night 1 still lacks (the act choice does not change the cue, the Mirror World is one cold ring) more than by these two items. Keep the owner's heading; the three who voted against it asked for the boss warning back, not for the old words (item 4 below).

Ranked items (nothing cut; owner to agree before any is built):

| # | Item | Where | Judges asking |
|---|---|---|---|
| 1 | The fall gets the biggest laugh in the act itself: with `hurtPays` on, a miss plays the slip and then the big laugh, not the cough. Night 1 tells the cue page by a URL flag (`cue_model.html?hurt=1`); the cue page's own default stays as it is. | `cue_model.html` missBeat, `night1.html` startAct | Chaplin, jam judge, streamer, Dazai |
| 2 | Carry the lesson to night 2: the night-2 board shows what they laughed at last night ("They laughed hardest at the pie."), so the second night is a choice, not a trick. Night 1 stays a discovery. | Board, night 2 | Core gamer, mobile producer, casual |
| 3 | Sound and face for the shop performance: a crack tone when the reflection stands, a short laugh from the glass at the move, and the Performer's grin on the reflection (needs its own face material; it shares the clown's now). | Shop at the mirror | Streamer, Nietzsche, psychologist |
| 4 | One small line under the end card list: "The Performer learned each one." Heading unchanged. | End card | Core gamer, casual, mobile producer |
| 5 | Layout check: on phone portrait and landscape the shop card must not cover the reflection's body during the performance (gate: mirror glass rect vs card content rect, with a mutation). | Shop at the mirror, smoke check | Mobile producer |
| 6 | Balance check once the Mirror World sample exists: bot sweep of "clean", "fall early" and "clean then fall twice" through the act and the Mirror, so the 150-Laughs line cannot make the Mirror trivial. | Act plus Mirror World | Core gamer |
