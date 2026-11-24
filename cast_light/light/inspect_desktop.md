
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
| 0   | Scene | clown_rig | -0.42875, -1, -0.35734 | 0.42875, 1, 0.35734 | 36,078             | 8,424             | 8,424                  |

¹ Expected number of vertices processed by the vertex shader for one render
  pass, without considering the vertex cache.

² Expected number of vertices uploaded to GPU, assuming each Accessor
  is uploaded only once. Actual number uploaded may be higher, 
  dependent on the implementation and vertex buffer layout.

³ Expected number of vertices uploaded to GPU, assuming each Primitive
  is uploaded once, duplicating vertex attributes shared among Primitives.



 MESHES
 ────────────────────────────────────────────
| #   | name       | mode      | meshPrimitives | glPrimitives | vertices | indices | attributes                                                                                        | instances | size¹     |
| --- | ---        | ---       | ---            | ---          | ---      | ---     | ---                                                                                               | ---       | ---       |
| 0   | Cone.038   | TRIANGLES | 1              | 9,818        | 7,293    | u16     | JOINTS_0:u8, NORMAL:i8_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm, WEIGHTS_0:u8_norm, _SPEC:f32 | 1         | 241.23 KB |
| 1   | Sphere.142 | TRIANGLES | 1              | 2,208        | 1,131    | u16     | JOINTS_0:u8, NORMAL:i8_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm, WEIGHTS_0:u8_norm, _SPEC:f32 | 1         | 41.52 KB  |

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
| #   | name          | uri | slots            | instances | mimeType   | compression | resolution | size     | gpuSize⁵  |
| --- | ---           | --- | ---              | ---       | ---        | ---         | ---        | ---      | ---       |
| 0   | body_1024     |     | baseColorTexture | 1         | image/ktx2 | ETC1S       | 1024x1024  | 91.09 KB | 699.05 KB |
| 1   | face_combined |     | baseColorTexture | 1         | image/ktx2 | ETC1S       | 1024x1024  | 38.35 KB | 699.05 KB |

⁵ gpuSize estimates minimum VRAM memory allocation. Older devices may require
  additional memory for GPU compression formats.



 ANIMATIONS
 ────────────────────────────────────────────
| #   | name  | channels | samplers | duration | keyframes | size      |
| --- | ---   | ---      | ---      | ---      | ---       | ---       |
| 0   | flare | 18       | 18       | 0        | 80        | 772 Bytes |
| 1   | hit   | 18       | 18       | 1        | 121       | 1.12 KB   |
| 2   | idle  | 18       | 18       | 2        | 331       | 2.97 KB   |
| 3   | out   | 18       | 18       | 1        | 152       | 1.44 KB   |


