# Night-1 cast, round 1 (proposal, not approved)

New characters as data on the approved style generator (`art/3_blender_3d/build.py` and `palette.py`, both unchanged; extra warm ramps for the crew are in this script's CONFIG section).

- Stage crew (warm): stagehand (walk past), rigger (lays the cable; jump it), props girl (hands over a cream pie), strongman (hands over the bulb horn), the child (the one who sees).
- Mirror constructs, the clown's insecurities (cold): the Light (being watched), the Whisper (being seen through), the Stare (being judged), Shame.

Run: `pip install bpy`, then from this folder `python3 -I build_cast2.py all` (9 figures, about 10 s), `python3 -I build_cast2.py lineup` (the approved cast at the same scale, renders only).
Out: `renders/<name>_{front,left,back,right}.png` (ortho 80, 256 px; review detail, 32 segments) and `renders/<name>.glb` (web build of the same data, 14 segments, one mesh, one primitive per material, 4k-9.5k triangles). Per-view PNGs are not committed (rebuilt in seconds).
Sheets: `lineup_front.png` (approved cast + new, one scale), `lineup_playsize.png` (clown 64 px tall), `sheet_crew.png`, `sheet_constructs.png`. Panel: `PANEL.md`.
In the game page the GLB material names are the palette ramp names; the page shades each with the same 4 bands.
