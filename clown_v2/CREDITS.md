# Credits (clown v2 pipeline)

Add an entry the moment anything third-party goes into the game. All entries below allow commercial use.

| What | Author | Source | Licence | Used for |
|---|---|---|---|---|
| Clown model, textures, scripts | the developer | this project | own work | the character |
| Music: "Cold Tea and Morning Light", "The Trapeze Waltz", "The Weight of Remaining" | supplied by the developer (22 Nov 2026) | `music_src/` (originals), `web/step0/music/` (web copies, -18 LUFS, 128 kbps) | to confirm by the developer (how they were made and that commercial use is allowed) | night 1 music: backstage, ring, after |
| three.js 0.187.0 | mrdoob and contributors | https://github.com/mrdoob/three.js | MIT (keep the notice) | runtime, GLTFLoader, KTX2Loader |
| postprocessing 6.39.6 | Raoul van Rüschen | https://github.com/pmndrs/postprocessing | Zlib | bloom, tone mapping (step 4 on) |
| N8AO 2.1.0 | N8python | https://github.com/N8python/n8ao | ISC (keep the notice) | ambient occlusion, desktop tier (step 4 on) |
| meshoptimizer 1.3.0 decoder | Arseny Kapoulkine | https://github.com/zeux/meshoptimizer | MIT (keep the notice) | GLB compression (step 9) |
| glTF Transform 4.1.1 CLI | Don McCurdy | https://github.com/donmccurdy/glTF-Transform | MIT | GLB compression in CI (build tool, not shipped) |
| KTX-Software 4.3.2 (toktx) | Khronos Group | https://github.com/KhronosGroup/KTX-Software | Apache 2.0 | KTX2 texture encoding in CI (build tool, not shipped) |
| Basis Universal transcoder (three.js `examples/jsm/libs/basis`) | Binomial LLC | https://github.com/BinomialLLC/basis_universal | Apache 2.0 (keep the notice) | KTX2 textures in the page, once the compressed GLBs ship |
| Blender 5.3 (bpy) | Blender Foundation | https://www.blender.org | GPL tool; output is the developer's own | modelling, baking, rigging, export |
| Movement timing | Eadweard Muybridge, *The Human Figure in Motion* (1907) | public domain | public domain | walk and slap timing (optional credit) |
