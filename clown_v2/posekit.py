"""Posing helpers shared by every character's clips. Armature space, characters face -y.
s3_rig sets ARM (the armature object) and U (metres per approved unit) before any pose runs."""
import math
import bpy
from mathutils import Vector, Matrix
from chars.common import side

ARM = None
U = 0.03

def P(n): return ARM.pose.bones[n]
def upd(): bpy.context.view_layer.update()

def rotw(n, axis, deg):
    """Rotate a bone about an armature-space axis through its head."""
    upd(); pb = P(n); M = pb.matrix.copy(); h = M.translation.copy()
    pb.matrix = Matrix.Translation(h) @ Matrix.Rotation(math.radians(deg), 4, Vector(axis)) @ Matrix.Translation(-h) @ M

def aim(n, d):
    """Turn a bone so it points along d (armature space)."""
    upd(); pb = P(n); cur = (pb.tail - pb.head).normalized()
    q = cur.rotation_difference(Vector(d).normalized()); M = pb.matrix.copy(); h = M.translation.copy()
    pb.matrix = Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h) @ M

def move(n, d):
    """Move a bone by d approved units."""
    upd(); pb = P(n); M = pb.matrix.copy(); M.translation += Vector(d) * U; pb.matrix = M

def rest():
    for pb in ARM.pose.bones: pb.matrix_basis = Matrix.Identity(4)

def arms_down(cfg, s, out_deg):
    """Bring an arm from the bind A-pose to out_deg from vertical (rotation about the forward axis)."""
    rotw(f'upper_arm_{side(s)}', (0, 1, 0), s * (cfg['arm_out'] - out_deg))

def legs(crouch):
    """Knees bend by crouch (0..1), hips drop, feet stay roughly planted."""
    for s in (-1, 1):
        S = side(s)
        rotw(f'thigh_{S}', (1, 0, 0), -14 * crouch); rotw(f'shin_{S}', (1, 0, 0), 28 * crouch); rotw(f'foot_{S}', (1, 0, 0), -14 * crouch)
    move('hips', (0, 0, -1.3 * crouch))

def walk(cfg, timing, t, style):
    """Muybridge-timed walk cycle. style: thigh, knee, arm swing (degrees), bob (units), arm angle, sway (degrees)."""
    T = timing['walk_dt'] * timing['walk_n']; p = 2 * math.pi * t / T
    move('hips', (0, 0, style['bob'] * math.cos(2 * p) - style['bob']))
    rotw('hips', (0, 0, 1), 5 * math.sin(p))
    rotw('chest', (0, 0, 1), -8 * math.sin(p))
    rotw('chest', (0, 1, 0), style.get('sway', 0) * math.sin(p))
    rotw('head', (0, 0, 1), 3 * math.sin(p))
    for s, ph in ((1, p), (-1, p + math.pi)):
        S = side(s)
        # + = thigh forward; the knee bends most mid-swing
        sw = style['thigh'] * math.sin(ph)
        kn = 6 + style['knee'] * max(0.0, math.cos(ph)) ** 1.5
        rotw(f'thigh_{S}', (1, 0, 0), -sw)
        rotw(f'shin_{S}', (1, 0, 0), kn)
        rotw(f'foot_{S}', (1, 0, 0), 0.8 * (sw - kn))
        arms_down(cfg, s, style['arm_out'])
        # the arm swings opposite its own leg
        rotw(f'upper_arm_{S}', (1, 0, 0), style['arm'] * math.sin(ph))
        rotw(f'forearm_{S}', (1, 0, 0), -10 - 6 * max(0.0, -math.sin(ph)))

def slap_key(table, i, guard_l=(0.55, -0.45, -0.70), guard_lf=(0.10, -0.85, -0.50)):
    """One photograph of the slap: chest yaw, spine lean, crouch, right upper-arm and forearm directions."""
    yaw, lean, cr, ua, fa = table[i]
    legs(cr)
    rotw('spine', (1, 0, 0), -lean * 0.5); rotw('chest', (1, 0, 0), -lean * 0.5)
    rotw('spine', (0, 0, 1), yaw * 0.4); rotw('chest', (0, 0, 1), yaw * 0.6)
    rotw('head', (0, 0, 1), -yaw * 0.5)
    aim('upper_arm_R', ua); aim('forearm_R', fa)
    aim('upper_arm_L', guard_l); aim('forearm_L', guard_lf)

# Muybridge series 32 (striking a blow), 12 photographs: chest yaw, spine lean, crouch, right upper arm, right forearm
SLAP = [
    (0, 0, 0.25, (-0.55, -0.45, -0.70), (-0.10, -0.85, -0.50)),
    (-18, -2, 0.30, (-0.80, 0.35, 0.50), (-0.25, 0.25, 1.00)),
    (-8, 2, 0.35, (-0.95, -0.10, 0.30), (-0.45, -0.75, 0.40)),
    (22, 9, 0.45, (-0.25, -1.00, 0.08), (0.25, -1.00, 0.00)),
    (32, 14, 0.55, (0.10, -1.00, -0.05), (0.40, -0.95, -0.10)),
    (34, 15, 0.55, (0.12, -1.00, -0.08), (0.42, -0.92, -0.15)),
    (32, 14, 0.55, (0.08, -1.00, -0.12), (0.38, -0.92, -0.22)),
    (25, 11, 0.50, (-0.10, -1.00, -0.25), (0.20, -0.95, -0.30)),
    (15, 7, 0.40, (-0.35, -0.85, -0.45), (0.00, -0.90, -0.45)),
    (7, 3, 0.32, (-0.50, -0.60, -0.62), (-0.08, -0.88, -0.48)),
    (2, 1, 0.27, (-0.55, -0.48, -0.69), (-0.10, -0.86, -0.50)),
    (0, 0, 0.25, (-0.55, -0.45, -0.70), (-0.10, -0.85, -0.50)),
]
