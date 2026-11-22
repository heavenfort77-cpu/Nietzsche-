
 OVERVIEW
 ────────────────────────────────────────────
| key                | value                                                                                      |
| ---                | ---                                                                                        |
| version            | 2.0                                                                                        |
| generator          | glTF-Transform v4.5.1                                                                      |
| extensionsUsed     | EXT_meshopt_compression, KHR_materials_specular, KHR_mesh_quantization, KHR_texture_basisu |
| extensionsRequired | EXT_meshopt_compression, KHR_mesh_quantization, KHR_texture_basisu                         |



 SCENES
 ────────────────────────────────────────────
| #   | name  | rootName  | bboxMin                | bboxMax             | renderVertexCount¹ | uploadVertexCount | uploadNaiveVertexCount |
| --- | ---   | ---       | ---                    | ---                 | ---                | ---               | ---                    |
| 0   | Scene | clown_rig | -0.58052, -1, -0.23658 | 0.58052, 1, 0.23658 | 35,922             | 7,947             | 7,947                  |

¹ Expected number of vertices processed by the vertex shader for one render
  pass, without considering the vertex cache.

² Expected number of vertices uploaded to GPU, assuming each Accessor
  is uploaded only once. Actual number uploaded may be higher, 
  dependent on the implementation and vertex buffer layout.

³ Expected number of vertices uploaded to GPU, assuming each Primitive
  is uploaded once, duplicating vertex attributes shared among Primitives.



 MESHES
 ────────────────────────────────────────────
| #   | name       | mode      | meshPrimitives | glPrimitives | vertices | indices | attributes                                                                                        | instances | size¹    |
| --- | ---        | ---       | ---            | ---          | ---      | ---     | ---                                                                                               | ---       | ---      |
| 0   | Sphere.061 | TRIANGLES | 1              | 9,766        | 6,816    | u16     | JOINTS_0:u8, NORMAL:i8_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm, WEIGHTS_0:u8_norm, _SPEC:f32 | 1         | 229 KB   |
| 1   | Sphere.098 | TRIANGLES | 1              | 2,208        | 1,131    | u16     | JOINTS_0:u8, NORMAL:i8_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm, WEIGHTS_0:u8_norm, _SPEC:f32 | 1         | 41.52 KB |

⁴ size estimates GPU memory required by a mesh, in isolation. If accessors are
  shared by other mesh primitives, but the meshes themselves are not reused, then
  the sum of all mesh sizes will overestimate the asset's total size. See "dedup".



 MATERIALS
 ────────────────────────────────────────────
| #   | name | instances | textures         | alphaMode | doubleSided |
| --- | ---  | ---       | ---              | ---       | ---         |
| 0   | body | 1         | baseColorTexture | OPAQUE    | ✓           |
| 1   | face | 1         | baseColorTexture | OPAQUE    | ✓           |



 TEXTURES
 ────────────────────────────────────────────
| #   | name          | uri | slots            | instances | mimeType   | compression | resolution | size      | gpuSize⁵  |
| --- | ---           | --- | ---              | ---       | ---        | ---         | ---        | ---       | ---       |
| 0   | body_1024     |     | baseColorTexture | 1         | image/ktx2 | ETC1S       | 1024x1024  | 102.79 KB | 699.05 KB |
| 1   | face_combined |     | baseColorTexture | 1         | image/ktx2 | ETC1S       | 1024x1024  | 45.17 KB  | 699.05 KB |

⁵ gpuSize estimates minimum VRAM memory allocation. Older devices may require
  additional memory for GPU compression formats.



 ANIMATIONS
 ────────────────────────────────────────────
| #   | name | channels | samplers | duration | keyframes | size    |
| --- | ---  | ---      | ---      | ---      | ---       | ---     |
| 0   | idle | 63       | 63       | 2        | 539       | 4.76 KB |
| 1   | slap | 63       | 63       | 1        | 616       | 4.8 KB  |
| 2   | walk | 63       | 63       | 1        | 532       | 4.49 KB |


