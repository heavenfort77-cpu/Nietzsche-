# Pitch: a different timing game per act, a different 2.5D style per insecurity (23 Nov 2026, session 22)

Owner, 23 Nov 09:13: "pitch to have multiple different timing game for cue to meet the theme. currently we have ff7 corridor and arena, introduces other 2.5d style to battle insecurities"

Status: pitch only, nothing built. Written by the lead (design, tech and QA notes); not a panel vote. The current goal (owner plays the act-by-act build) does not move.

## Why

Every act now uses the same cue (a ring closes on the mask), so 3 acts on night 1 are the same game three times. The Mirror World uses two 2.5D methods (fixed-camera corridor, turning-camera ring). One timing game per act and one 2.5D style per insecurity make each act and each insecurity feel like its own thing, and the style itself can say what the insecurity is (owner 23 Nov: the player must know he is fighting his insecurities).

## Rules every new game and style keeps

- Same buttons: hit (Space / right button) and, from night 2, take (K or Shift / left button). Night 1 stays one button. Mirror World controls never change: move, gag, dodge.
- The game lies only in what it says, never in what it shows (GDD: "the cue always closes honestly"). The drum is on every beat; the picture is always true; only voices and the crowd can mislead. This is the theme in the mechanic: the world is out to get him, his own mask is the one honest signal.
- GDD windows hold: perfect ±60 ms (±80 phone), good ±130 (±160), judged on input timestamps; every danger has a tell of at least 0.4 s (0.6 s for the Performer).
- Each game and each style is one CONFIG switch, off until approved.
- Perf: plates plus 3D characters only, no new real lights, effects in the one post pass; each style must pass the existing gates.
- The camera never cuts during a fight (cuts flip the controls). No first-person or over-the-shoulder camera.

## A. Timing games, one per act

| Act | Timing game | Input | Tell | What it says |
| --- | --- | --- | --- | --- |
| The deliberate fall | The mask ring (as built) | Tap when the ring fits the mask | Ring closes, drum | Learning to wear the mask (Dazai's school fall) |
| Spotlight sweep | Hold and release (already in the GDD; owner request H12 not built) | Hold to sweep the light into the pan, release when the pool fits the pan | The pool shrinks to the pan's edge on the beat | Sweeping away the light that shows him |
| The talking scale | Bar with a hit zone (the owner's own idea, 22 Nov) | Tap when the needle is in the zone | Needle swings on the beat; zone narrows a little each beat, shown before the swing | Being weighed by others |
| Soldier drill | Call and response | Whiteface taps a pattern of 2-4 beats, he repeats it on the next bar | The call itself; from night 2 the voice comes late but the drum stays on time | Doing what he is told ("trust the mask, not the voice") |
| Tit-for-tat | Exchange that speeds up | Hit on his turn; take on the neighbour's (night 2 on) | Each turn is one beat ahead on screen; tempo +8% per exchange, capped at 1.4x | Revenge that escalates the longer he plays along |
| The mirror routine (last stage night) | Two masks, his and the reflection's | Tap when both fit; the reflection drifts off the beat, the drum does not | Drum and his own mask | Self against the mask; the reflection is the liar |
| Encore (full Laughs) | The face dial (as in the GDD) | Tap when the light reaches the hat | Light runs the rim | On the last night it never stops speeding up |

Night 1 (3 acts, 3 rings each): fall (mask ring), sweep (hold), scale (bar): three different games, all one button.

## B. 2.5D styles, one per insecurity

| Insecurity | Style | How it plays | Why this style | Cost (guess) |
| --- | --- | --- | --- | --- |
| The Light | Ring arena, turning camera (as built) | As built: three gags on its lamp | The stage he cannot leave | 0 |
| The Whisper | Mirror corridor, fixed shots (FF7, as built) | Step past it, stay on your feet | The one who sees him, around every cut | 0 |
| The Stare | "Three photographs" (opening of *No Longer Human*) | One fixed sepia shot in a photo frame. The Stare is a camera: the bulb whines and the lens opens (0.6 s), then the flash freezes the frame into a photo; caught facing it costs Laughs. Hit it from the side (same hint) | Yozo's photos: the smile others see | Low: one plate, sepia grade in the post pass |
| Shame | Evangelion last-episode void | White paper; the floor is one pencil line drawn as he walks; he and Shame drawn in outline only. Shame clings; dodge shakes it off (same hint). Its tell is the line trembling under him | Eva's "the ground exists because you drew it" | Lowest: no plate; outline shader exists |
| The Sergeant (night 2+) | Side-on parade ground, layered flats | Flats scroll; it marches to the drum; hit on the off-beat | Drill, rank, conformity | Medium: 3-4 parallax plates |
| The Weigher (night 2+) | Tilting box room seen from above (miniature) | The room tilts toward him the more Laughs he holds; spend fast | The scale pan he stands in | Medium: small real box or one plate per tilt step |
| The Neighbour (night 3+) | Side-view house front (*Big Business*) | Each hit breaks a piece of the set; answer to be redesigned (GDD) | Wrecking his own home to win | Medium |
| The Double (night 3+) | Toy theatre with a proscenium | Flats slide in from the wings and flip to their back; it copies him a beat behind; answer to be redesigned (GDD) | Life as a set somebody else built | Medium |

Night 1 would then be: corridor (Whisper breaking out), ring (Light), photographs (Stare), void (Shame). One cut between spaces, never inside a fight.

## Lead's defaults (owner overrides any)

1. First box-and-shape sample, for the owner to play (rule 1): the spotlight sweep hold game (owner request H12, already in the GDD), then the Stare's photograph room. Art and sound only after he says they work.
2. Then the scale bar, then Shame's void; the night 2-3 styles stay pitch until night 2 is built.
3. Fairness check for every new game: bot sweep at three skill levels and tell times measured, as for the cue.
