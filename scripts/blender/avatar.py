"""Build the life-size avatar from assets/character-reference-full-pack.zip: 1.70 m, 50 kg, black zip hoodie, white tee, dark slim jeans,
white sneakers, </> necklace, wristband, sticker laptop (hidden until picked up). Backpack is a separate asset in the reference.

Usage: blender -b --factory-startup --python scripts/blender/avatar.py -- <out.glb> <front.png> <side.png>
Pivot empties (body, head, leg_l/r, knee_l/r, arm_l/r, elbow_l/r) sit at the joints; the web app rotates them to walk and swaps
the materials for toon shading (materials named shine_* stay unlit).
The laptop lid uses assets/avatar/laptop-lid.png (cropped from assets/avatar/reference.png).
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

out_glb, out_png, side_png = sys.argv[sys.argv.index("--") + 1:][:3]
lid_png = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "avatar", "laptop-lid.png")
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
collection = scene.collection
world_of = {}
FACE = (0.0, 0.0, 1.585), (0.074, 0.092, 0.112)
CAP = (0.0, 0.014, 1.612), (0.083, 0.104, 0.102)


def srgb(hex_color):
    return tuple((int(hex_color[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))


def material(name, hex_color, rough=0.8):
    mat = bpy.data.materials.new(name)
    if mat.node_tree is None:
        mat.use_nodes = True
    color = (*srgb(hex_color), 1)
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = rough
    mat.diffuse_color = color
    return mat


def textured(name, path):
    mat = material(name, "ffffff")
    node = mat.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = bpy.data.images.load(path)
    mat.node_tree.links.new(node.outputs["Color"], mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"])
    return mat


M = {
    "skin": material("skin", "d7b9a3"),
    "skin_shade": material("skin_shade", "c49f88"),
    "hair": material("hair", "0f0f12"),
    "hair_light": material("hair_light", "202024"),
    "jacket": material("jacket", "141417"),
    "jacket_trim": material("jacket_trim", "1f1f22"),
    "piping": material("piping", "d9dbe0"),
    "zip": material("zip", "3a3b40", 0.4),
    "string": material("string", "2b2b30"),
    "tee": material("tee", "ededed"),
    "trousers": material("trousers", "26272b"),
    "sneaker": material("sneaker", "ededed"),
    "sneaker_sole": material("sneaker_sole", "c8ccd3"),
    "sneaker_air": material("sneaker_air", "9ca3af"),
    "band": material("band", "17171a"),
    "cord": material("cord", "0b0b0d"),
    "print": material("print_white", "ffffff"),
    "laptop": material("laptop_shell", "1e2029"),
    "lid": textured("laptop_lid_stickers", lid_png),
    "lash": material("lash", "121214"),
    "sclera": material("sclera", "f2efec"),
    "iris": material("iris", "2b211d"),
    "pupil": material("pupil", "0d0b0b"),
    "shine": material("shine_eye", "ffffff"),
    "mouth": material("mouth", "b07f72"),
}


def pivot(name, loc, parent=None):
    obj = bpy.data.objects.new(name, None)
    collection.objects.link(obj)
    world_of[name] = Vector(loc)
    if parent:
        obj.parent = bpy.data.objects[parent]
        obj.location = world_of[name] - world_of[parent]
    else:
        obj.location = loc
    return obj


def finish(obj, name, loc, mat, parent, rot=(0, 0, 0)):
    obj.data.polygons.foreach_set("use_smooth", [True] * len(obj.data.polygons))
    obj.name = name
    obj.data.name = name
    obj.data.materials.append(mat)
    obj.parent = bpy.data.objects[parent]
    obj.location = Vector(loc) - world_of[parent]
    obj.rotation_euler = rot
    return obj


def sphere(name, loc, scale, mat, parent, rot=(0, 0, 0), detail=(16, 9)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=detail[0], ring_count=detail[1], radius=1)
    obj = bpy.context.active_object
    obj.scale = scale
    return finish(obj, name, loc, mat, parent, rot)


def shell(name, loc, scale, mat, parent, keep, thick=0.006):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=16, radius=1)
    obj = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    centers = [(face, face.calc_center_median()) for face in bm.faces]
    doomed = [face for face, c in centers if not keep(abs(math.degrees(math.atan2(c.x, -c.y))), loc[2] + c.z * scale[2])]
    bmesh.ops.delete(bm, geom=doomed, context="FACES")
    bm.to_mesh(obj.data)
    bm.free()
    obj.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    mod = obj.modifiers.new("solid", "SOLIDIFY")
    mod.thickness = thick
    mod.offset = -1
    return finish(obj, name, loc, mat, parent)


def tube(name, start, end, r_start, r_end, mat, parent, flat=1.0):
    start, end = Vector(start), Vector(end)
    axis = end - start
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=r_start, radius2=r_end, depth=axis.length)
    obj = bpy.context.active_object
    obj.scale = (1, flat, 1)
    return finish(obj, name, (start + end) / 2, mat, parent, axis.to_track_quat("Z", "Y").to_euler())


def ring(name, loc, major, minor, mat, parent, rot=(0, 0, 0), scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_torus_add(major_segments=32, minor_segments=8, major_radius=major, minor_radius=minor)
    obj = bpy.context.active_object
    obj.scale = scale
    return finish(obj, name, loc, mat, parent, rot)


def box(name, loc, half, mat, parent, rot=(0, 0, 0), bevel=0.4):
    bpy.ops.mesh.primitive_cube_add(size=2)
    obj = bpy.context.active_object
    obj.scale = half
    bpy.ops.object.transform_apply(scale=True)
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = min(half) * bevel
    mod.segments = 2
    return finish(obj, name, loc, mat, parent, rot)


def on(ellipsoid, lon, lat, r=1.0):
    (cx, cy, cz), (a, b, c) = ellipsoid
    lon, lat = math.radians(lon), math.radians(lat)
    return Vector((cx + a * r * math.cos(lat) * math.sin(lon), cy - b * r * math.cos(lat) * math.cos(lon), cz + c * r * math.sin(lat)))


def lock(name, points, width, thick, mat, steps=10, sides=8):
    def bezier(t):
        level = [Vector(p) for p in points]
        while len(level) > 1:
            level = [a.lerp(b, t) for a, b in zip(level, level[1:])]
        return level[0]

    centre = Vector(FACE[0])
    bm = bmesh.new()
    rings = []
    for i in range(steps):
        t = i / steps
        at = bezier(t)
        tangent = (bezier(t + 0.02) - bezier(max(t - 0.02, 0))).normalized()
        out = at - centre
        out = (out - tangent * out.dot(tangent)).normalized()
        across = tangent.cross(out)
        taper = min(1, t / 0.25) ** 0.5 * (1 - t * t) ** 0.9
        rings.append([
            bm.verts.new(at + across * math.cos(a) * width * taper + out * math.sin(a) * thick * taper)
            for a in (2 * math.pi * k / sides for k in range(sides))
        ])
    tip = bm.verts.new(bezier(1))
    for lower, upper in zip(rings, rings[1:]):
        for k in range(sides):
            bm.faces.new((lower[k], lower[(k + 1) % sides], upper[(k + 1) % sides], upper[k]))
    for k in range(sides):
        bm.faces.new((rings[-1][k], rings[-1][(k + 1) % sides], tip))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return finish(obj, name, (0, 0, 0), mat, "head")


def face_decal(name, x, z, size, lift, mat, tilt=0.0):
    (cx, cy, cz), (a, b, c) = FACE
    u, w = (x - cx) / a, (z - cz) / c
    y = cy - b * max(0.0, 1 - u * u - w * w) ** 0.5
    normal = Vector(((x - cx) / a ** 2, (y - cy) / b ** 2, (z - cz) / c ** 2)).normalized()
    rot = (normal.to_track_quat("-Y", "Z") @ Matrix.Rotation(tilt, 4, "Y").to_quaternion()).to_euler()
    depth = size[0] * size[1] / b + 0.001
    return sphere(name, Vector((x, y, z)) + normal * (lift - depth), (size[0], depth, size[1]), mat, "head", rot, (16, 8))


# Landmarks from the 7.5-head canon (Sine Art, "Ti le co the nguoi"): head = height / 7.5, crotch at mid-height,
# knee at a quarter, elbow at the waist, wrist at the crotch, hand = face (0.8 head), foot = 1 head, arm span = height.
HEIGHT, HEADS = 1.697, 7.5
HEAD = HEIGHT / HEADS
KNEE = HEIGHT / 4
pivot("character", (0, 0, 0))
for side, x in (("l", 1), ("r", -1)):
    leg, knee = f"leg_{side}", f"knee_{side}"
    pivot(leg, (0.088 * x, 0, 0.88), "character")
    tube(f"{leg}_trouser", (0.088 * x, 0, KNEE), (0.09 * x, 0, 0.92), 0.047, 0.07, M["trousers"], leg)
    pivot(knee, (0.088 * x, 0, KNEE), leg)
    sphere(f"{knee}_cap", (0.088 * x, -0.002, KNEE), (0.048, 0.05, 0.05), M["trousers"], knee)
    tube(f"{knee}_shin", (0.088 * x, 0, 0.11), (0.088 * x, 0, KNEE), 0.042, 0.048, M["trousers"], knee)
    ring(f"{leg}_cuff", (0.088 * x, 0, 0.115), 0.04, 0.009, M["trousers"], knee)
    box(f"{leg}_sole", (0.088 * x, -0.025, 0.009), (0.047, 0.12, 0.009), M["sneaker_sole"], knee, bevel=0.9)
    box(f"{leg}_midsole", (0.088 * x, -0.022, 0.027), (0.046, 0.115, 0.011), M["sneaker"], knee, bevel=0.9)
    sphere(f"{leg}_sneaker", (0.088 * x, -0.03, 0.052), (0.043, 0.108, 0.042), M["sneaker"], knee, detail=(24, 12))
    sphere(f"{leg}_heel", (0.088 * x, 0.052, 0.068), (0.041, 0.045, 0.05), M["sneaker"], knee, detail=(20, 10))
    box(f"{leg}_laces", (0.088 * x, -0.05, 0.091), (0.016, 0.04, 0.003), M["sneaker_sole"], knee, (0.28, 0, 0), 0.6)
    sphere(f"{leg}_air", (0.088 * x + 0.045 * x, 0.045, 0.027), (0.003, 0.032, 0.007), M["sneaker_air"], knee, detail=(12, 6))

pivot("body", (0, 0, 0.88), "character")
sphere("hips", (0, 0.008, 0.945), (0.155, 0.11, 0.095), M["trousers"], "body", detail=(28, 14))
sphere("tee", (0, 0, 1.2), (0.155, 0.1, 0.265), M["tee"], "body", detail=(32, 18))
shell("jacket", (0, 0, 1.2), (0.172, 0.112, 0.285), M["jacket"], "body", lambda lon, z: lon > 24 and z > 0.96)
shell("jacket_placket", (0, 0, 1.2), (0.174, 0.114, 0.287), M["jacket_trim"], "body",
      lambda lon, z: 24 < lon < 30 and z > 0.96, 0.004)
shell("jacket_hem", (0, 0, 1.2), (0.176, 0.116, 0.289), M["jacket_trim"], "body",
      lambda lon, z: lon > 30 and 0.96 < z < 1.0, 0.005)
sphere("hood", (0, 0.098, 1.405), (0.118, 0.042, 0.105), M["jacket"], "body", (0.18, 0, 0), (24, 12))
ring("hood_collar", (0, 0.014, 1.45), 0.075, 0.018, M["jacket"], "body", (-0.22, 0, 0), (1.25, 1, 1))
for side, x in (("l", 1), ("r", -1)):
    tube(f"drawstring_{side}", (0.058 * x, -0.088, 1.43), (0.063 * x, -0.108, 1.28), 0.0035, 0.0035, M["string"], "body")
    tube(f"necklace_cord_{side}", (0.036 * x, -0.05, 1.468), (0, -0.088, 1.37), 0.0018, 0.0018, M["cord"], "body")
box("necklace_pendant", (0, -0.09, 1.355), (0.012, 0.004, 0.014), M["cord"], "body")
box("pendant_mark", (0, -0.0945, 1.355), (0.006, 0.0006, 0.0018), M["print"], "body", bevel=0.2)
box("print_prompt_a", (0.085, -0.095, 1.345), (0.009, 0.003, 0.0025), M["print"], "body", (0, 0.6, 0.0), 0.3)
box("print_prompt_b", (0.085, -0.095, 1.335), (0.009, 0.003, 0.0025), M["print"], "body", (0, -0.6, 0.0), 0.3)
box("print_prompt_c", (0.105, -0.09, 1.329), (0.01, 0.003, 0.0025), M["print"], "body", bevel=0.3)
box("chest_zip", (0.07, -0.098, 1.27), (0.0022, 0.003, 0.04), M["zip"], "body", bevel=0.3)
tube("neck", (0, 0, 1.43), (0, 0.005, 1.505), 0.048, 0.042, M["skin"], "body")

for side, x in (("l", 1), ("r", -1)):
    arm, elbow = f"arm_{side}", f"elbow_{side}"
    pivot(arm, (0.155 * x, 0, 1.373), "body")
    sphere(f"{arm}_shoulder", (0.15 * x, 0, 1.365), (0.047, 0.053, 0.053), M["jacket"], arm)
    tube(f"{arm}_sleeve", (0.168 * x, 0, 1.07), (0.157 * x, 0, 1.36), 0.04, 0.045, M["jacket"], arm)
    tube(f"{arm}_piping", (0.15 * x, -0.04, 1.17), (0.19 * x, -0.024, 1.29), 0.0022, 0.0022, M["piping"], arm)
    pivot(elbow, (0.168 * x, 0, 1.07), arm)
    sphere(f"{elbow}_joint", (0.168 * x, 0, 1.07), (0.04, 0.04, 0.04), M["jacket"], elbow)
    tube(f"{elbow}_sleeve", (0.174 * x, -0.004, 0.87), (0.168 * x, 0, 1.07), 0.034, 0.04, M["jacket"], elbow)
    ring(f"{arm}_cuff", (0.174 * x, -0.004, 0.87), 0.031, 0.011, M["jacket_trim"], elbow, (0, 0.03 * x, 0))
    sphere(f"{arm}_hand", (0.176 * x, -0.006, 0.815), (0.014, 0.04, 0.05), M["skin"], elbow, detail=(16, 10))
    for finger, y, length in (("index", -0.027, 0.079), ("middle", -0.009, 0.0864), ("ring", 0.009, 0.081), ("pinky", 0.026, 0.066)):
        tube(f"{arm}_{finger}", (0.175 * x, y, 0.775), (0.169 * x, y * 1.08, 0.775 - length), 0.0085, 0.0065, M["skin"], elbow)
        sphere(f"{arm}_{finger}_tip", (0.169 * x, y * 1.08, 0.775 - length), (0.0066, 0.0066, 0.0066), M["skin"], elbow, detail=(8, 6))
    tube(f"{arm}_thumb", (0.171 * x, -0.036, 0.835), (0.164 * x, -0.052, 0.785), 0.0095, 0.0072, M["skin"], elbow)
ring("wristband", (-0.174, -0.006, 0.88), 0.023, 0.0065, M["band"], "elbow_r", (0, 0.03, 0), (0.85, 1.1, 1))

pivot("laptop", (-0.228, -0.02, 0.82), "elbow_r").rotation_euler = (0.3, 0.12, 0.3)
box("laptop_shell", (-0.228, -0.02, 0.82), (0.009, 0.162, 0.104), M["laptop"], "laptop", bevel=0.5)
bpy.ops.mesh.primitive_plane_add(size=2)
lid = bpy.context.active_object
lid.scale = (0.156, 0.098, 1)
lid_rot = Matrix(((0, 0, -1), (-1, 0, 0), (0, 1, 0))).to_euler()
finish(lid, "laptop_lid", (-0.2377, -0.02, 0.82), M["lid"], "laptop", lid_rot)

pivot("head", (0, 0, 1.49), "body")
sphere("face", FACE[0], FACE[1], M["skin"], "head", detail=(32, 18))
sphere("hair_cap", CAP[0], CAP[1], M["hair"], "head", detail=(32, 18))
sphere("hair_nape", (0, 0.035, 1.565), (0.075, 0.079, 0.095), M["hair"], "head", detail=(24, 12))
sphere("nose", (0, -0.089, 1.553), (0.006, 0.008, 0.011), M["skin_shade"], "head", detail=(10, 6))
face_decal("mouth", 0.0, 1.522, (0.01, 0.0022), 0.0007, M["mouth"])
EYE_Z = 1.578
for side, x in (("l", 1), ("r", -1)):
    sphere(f"ear_{side}", (0.073 * x, 0.008, 1.57), (0.01, 0.014, 0.027), M["skin"], "head", detail=(12, 8))
    face_decal(f"lash_{side}", 0.031 * x, EYE_Z + 0.005, (0.018, 0.016), 0.0009, M["lash"], 0.08 * x)
    face_decal(f"sclera_{side}", 0.031 * x, EYE_Z, (0.016, 0.014), 0.0018, M["sclera"])
    face_decal(f"iris_{side}", 0.031 * x, EYE_Z + 0.0005, (0.0105, 0.0125), 0.0027, M["iris"])
    face_decal(f"pupil_{side}", 0.031 * x, EYE_Z + 0.0008, (0.005, 0.006), 0.0036, M["pupil"])
    face_decal(f"shine_{side}", 0.031 * x + 0.004, EYE_Z + 0.005, (0.0028, 0.0032), 0.0045, M["shine"])
    face_decal(f"brow_{side}", 0.033 * x, 1.606, (0.019, 0.0042), 0.0011, M["lash"], -0.1 * x)

K, F = CAP, FACE
FRINGE = (
    ((K, -25, 62, 0.99), (K, 5, 40, 1.12), (F, 22, 34, 1.15), (F, 34, 13, 1.08), 0.03, "hair"),
    ((K, -10, 70, 0.99), (K, 35, 45, 1.12), (F, 52, 32, 1.14), (F, 58, 10, 1.08), 0.03, "hair_light"),
    ((K, -30, 58, 0.99), (K, -12, 36, 1.12), (F, -2, 32, 1.15), (F, 8, 16, 1.09), 0.026, "hair_light"),
    ((K, -35, 62, 0.99), (K, -40, 38, 1.12), (F, -36, 32, 1.15), (F, -26, 14, 1.09), 0.027, "hair"),
    ((K, -40, 66, 0.99), (K, -62, 42, 1.12), (F, -60, 30, 1.14), (F, -52, 10, 1.08), 0.029, "hair"),
    ((K, 20, 75, 0.99), (K, 80, 45, 1.12), (F, 88, 25, 1.14), (F, 82, -14, 1.07), 0.027, "hair"),
    ((K, -50, 72, 0.99), (K, -88, 44, 1.12), (F, -92, 25, 1.14), (F, -84, -14, 1.07), 0.027, "hair"),
    ((K, 0, 76, 0.99), (K, 18, 52, 1.14), (F, 12, 38, 1.16), (F, 20, 18, 1.09), 0.028, "hair_light"),
    ((K, -18, 72, 0.99), (K, -26, 50, 1.14), (F, -18, 36, 1.16), (F, -10, 18, 1.09), 0.028, "hair"),
    ((K, 30, 68, 0.99), (K, 62, 48, 1.14), (F, 72, 30, 1.15), (F, 70, 6, 1.08), 0.026, "hair"),
    ((K, -45, 66, 0.99), (K, -74, 46, 1.14), (F, -78, 28, 1.15), (F, -72, 6, 1.08), 0.026, "hair_light"),
)
for i, (*path, width, mat) in enumerate(FRINGE):
    lock(f"fringe_{i}", [on(*p) for p in path], width * 1.15, 0.016, M[mat], steps=14)
BACK = (
    ((170, 80, 0.98), (92, 60, 1.13), (100, 14, 1.12), 0.032, "hair"),
    ((170, 80, 0.98), (-98, 60, 1.13), (-106, 12, 1.12), 0.032, "hair"),
    ((170, 78, 0.98), (146, 40, 1.12), (150, -16, 1.09), 0.032, "hair"),
    ((170, 78, 0.98), (-150, 40, 1.12), (-154, -18, 1.09), 0.032, "hair_light"),
    ((170, 76, 0.98), (180, 20, 1.1), (182, -36, 1.07), 0.032, "hair"),
    ((118, 24, 0.98), (126, -16, 1.06), (132, -46, 1.09), 0.024, "hair"),
    ((-118, 24, 0.98), (-128, -16, 1.06), (-134, -44, 1.09), 0.024, "hair"),
    ((0, 86, 0.98), (60, 72, 1.14), (112, 50, 1.14), 0.03, "hair_light"),
    ((0, 86, 0.98), (-62, 72, 1.14), (-116, 48, 1.14), 0.03, "hair"),
    ((180, 86, 0.98), (140, 66, 1.14), (118, 40, 1.12), 0.028, "hair"),
    ((-20, 78, 1.0), (20, 88, 1.1), (80, 74, 1.13), 0.01, "hair"),
    ((60, 60, 0.98), (78, 34, 1.12), (86, 4, 1.1), 0.03, "hair"),
    ((-60, 60, 0.98), (-80, 34, 1.12), (-88, 4, 1.1), 0.03, "hair"),
    ((150, 82, 0.98), (110, 60, 1.15), (96, 30, 1.13), 0.03, "hair_light"),
    ((-150, 82, 0.98), (-112, 60, 1.15), (-98, 30, 1.13), 0.03, "hair"),
    ((30, 88, 0.98), (-10, 76, 1.16), (-40, 62, 1.15), 0.028, "hair_light"),
)
for i, (*path, width, mat) in enumerate(BACK):
    lock(f"lock_{i}", [on(K, *p) for p in path], width * 1.15, 0.017, M[mat], steps=12)

for obj in scene.objects:
    if obj.type == "MESH" and obj.name != "laptop_lid":
        while obj.data.uv_layers:
            obj.data.uv_layers.remove(obj.data.uv_layers[0])
bpy.context.view_layer.update()
bpy.ops.export_scene.gltf(filepath=out_glb, export_format="GLB", export_yup=True, export_apply=True,
                          export_image_format="JPEG", export_jpeg_quality=85)

camera = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
collection.objects.link(camera)
camera.data.type = "ORTHO"
camera.data.ortho_scale = 1.95
target = pivot("camera_target", (0, 0, 0.86))
track = camera.constraints.new("TRACK_TO")
track.target = target
scene.camera = camera
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 24
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.data.energy = 3
collection.objects.link(sun)
scene.world = bpy.data.worlds.new("world")
scene.world.color = (0.3, 0.33, 0.5)
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 640
for path, loc, sun_yaw in ((out_png, (-1.0, -3.0, 1.3), -0.5), (side_png, (-2.6, 1.5, 1.4), -2.5)):
    camera.location = loc
    sun.rotation_euler = (0.9, 0, sun_yaw)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

depsgraph = bpy.context.evaluated_depsgraph_get()
triangles = 0
top = 0.0
x_range = {}
box_of = {}
for obj in scene.objects:
    if obj.type == "MESH":
        mesh = obj.evaluated_get(depsgraph).to_mesh()
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        top = max(top, max((obj.matrix_world @ v.co).z for v in mesh.vertices))
        xs = [(obj.matrix_world @ v.co).x for v in mesh.vertices]
        x_range[obj.name] = (min(xs), max(xs))
        pts = [obj.matrix_world @ v.co for v in mesh.vertices]
        box_of[obj.name] = (Vector(map(min, *pts)), Vector(map(max, *pts)))
laptop_inner = max(x_range[name][1] for name in ("laptop_shell", "laptop_lid"))
leg_outer = min(low for name, (low, _) in x_range.items() if name.startswith("leg_r"))
skull = max((bpy.data.objects["face"].matrix_world @ v.co).z for v in bpy.data.objects["face"].data.vertices)
assert 1.69 <= skull <= 1.71, skull
assert top <= 1.74, top
assert laptop_inner < leg_outer, (laptop_inner, leg_outer)
head = skull - box_of["face"][0].z
crotch = box_of["hips"][0].z
wrist = box_of["arm_l_hand"][1].z
tip = min(box_of[n][0].z for n in box_of if n.startswith("arm_l_") and n.endswith("_tip"))
shoulder = world_of["arm_l"]
foot = max(box_of[n][1].y for n in box_of if n.startswith("leg_l_")) - min(box_of[n][0].y for n in box_of if n.startswith("leg_l_"))
span = 2 * (shoulder.x + (shoulder - Vector((box_of["arm_l_middle_tip"][0].x, 0, tip))).length)
RULES = {
    "head = height / 7.5": (head, skull / HEADS, 0.005),
    "crotch at mid-height": (crotch, skull / 2, 0.02),
    "knee at a quarter": (world_of["knee_l"].z, skull / 4, 0.02),
    "elbow at waist (navel + 5 cm)": (world_of["elbow_l"].z, skull - 3 * head + 0.05, 0.03),
    "wrist at crotch": (wrist, crotch, 0.03),
    "hand = face (0.8 head)": (wrist - tip, 0.8 * head, 0.01),
    "foot (shoe) = 1 head + 2.5 cm": (foot, head + 0.025, 0.015),
    "arm span = height": (span, skull, 0.02),
}
for rule, (got, want, tol) in RULES.items():
    assert abs(got - want) <= tol, (rule, round(got, 3), round(want, 3))
print("PROPORTIONS", {rule: round(got, 3) for rule, (got, _, _) in RULES.items()})
print("CHARACTER", {"pivots": sorted(n for n in world_of if n != "camera_target"), "triangles": triangles, "height": round(skull, 3), "with_hair": round(top, 3)})
