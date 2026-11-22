"""Build the chibi explorer character.

Usage: blender -b --factory-startup --python scripts/blender/character.py -- <out.glb> <preview.png>
Pivot empties (body, head, leg_l/r, arm_l/r, tail_l/r) sit at the joints; the web app rotates them to walk
and swaps the materials for toon shading, so colours here are flat albedo picked to sit in the indigo room.
"""
import sys

import bpy
from mathutils import Vector

out_glb, out_png = sys.argv[sys.argv.index("--") + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
collection = scene.collection
world_of = {}
FACE = (0.0, 0.0, 0.555), (0.15, 0.138, 0.136)


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


M = {
    "skin": material("skin", "ffe1d2"),
    "hair": material("hair", "35c4bd"),
    "hair_shade": material("hair_shade", "1f9a9c"),
    "ribbon": material("ribbon", "7d97ec"),
    "top": material("top", "eef0fb"),
    "navy": material("navy", "2e3766"),
    "sock": material("sock", "222849"),
    "shoe": material("shoe", "3a3f63"),
    "eye": material("eye", "1d2350"),
    "iris": material("iris", "4f8fe6"),
    "shine": material("shine", "ffffff"),
    "mouth": material("mouth", "8e3b4a"),
    "blush": material("blush", "ffb4a8"),
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
    bpy.ops.object.shade_smooth()
    obj.name = name
    obj.data.name = name
    obj.data.materials.append(mat)
    obj.parent = bpy.data.objects[parent]
    obj.location = Vector(loc) - world_of[parent]
    obj.rotation_euler = rot
    return obj


def sphere(name, loc, scale, mat, parent, rot=(0, 0, 0), detail=(18, 10)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=detail[0], ring_count=detail[1], radius=1)
    obj = bpy.context.active_object
    obj.scale = scale
    return finish(obj, name, loc, mat, parent, rot)


def cone(name, loc, bottom, top, depth, mat, parent, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=bottom, radius2=top, depth=depth)
    return finish(bpy.context.active_object, name, loc, mat, parent, rot)


def ring(name, loc, major, minor, mat, parent):
    bpy.ops.mesh.primitive_torus_add(major_segments=32, minor_segments=8, major_radius=major, minor_radius=minor)
    return finish(bpy.context.active_object, name, loc, mat, parent)


def face_decal(name, x, z, size, lift, mat):
    (cx, cy, cz), (a, b, c) = FACE
    u, w = (x - cx) / a, (z - cz) / c
    y = cy - b * max(0.0, 1 - u * u - w * w) ** 0.5
    normal = Vector(((x - cx) / a ** 2, (y - cy) / b ** 2, (z - cz) / c ** 2)).normalized()
    rot = normal.to_track_quat("-Y", "Z").to_euler()
    return sphere(name, Vector((x, y, z)) + normal * lift, (size[0], 0.006, size[1]), mat, "head", rot, (12, 6))


pivot("character", (0, 0, 0))
for side, x in (("l", 1), ("r", -1)):
    leg = f"leg_{side}"
    pivot(leg, (0.045 * x, 0, 0.2), "character")
    cone(f"{leg}_skin", (0.045 * x, 0, 0.175), 0.028, 0.03, 0.05, M["skin"], leg)
    cone(f"{leg}_sock", (0.045 * x, 0, 0.095), 0.026, 0.03, 0.12, M["sock"], leg)
    sphere(f"{leg}_shoe", (0.045 * x, -0.012, 0.03), (0.04, 0.06, 0.032), M["shoe"], leg)

pivot("body", (0, 0, 0.2), "character")
cone("skirt", (0, 0, 0.25), 0.125, 0.068, 0.11, M["navy"], "body")
ring("skirt_hem", (0, 0, 0.198), 0.121, 0.007, M["top"], "body")
sphere("torso", (0, 0, 0.345), (0.07, 0.062, 0.075), M["top"], "body", detail=(28, 16))
cone("collar", (0, 0.004, 0.392), 0.084, 0.034, 0.028, M["navy"], "body")
for side, x in (("l", 1), ("r", -1)):
    sphere(f"bow_{side}", (0.018 * x, -0.067, 0.37), (0.022, 0.01, 0.014), M["ribbon"], "body", (0, 0.35 * x, 0))
sphere("bow_knot", (0, -0.072, 0.37), (0.009, 0.008, 0.01), M["ribbon"], "body")
cone("neck", (0, 0, 0.415), 0.024, 0.022, 0.03, M["skin"], "body")

for side, x in (("l", 1), ("r", -1)):
    arm = f"arm_{side}"
    pivot(arm, (0.08 * x, 0, 0.385), "body")
    sphere(f"{arm}_puff", (0.084 * x, 0, 0.372), (0.032, 0.032, 0.034), M["top"], arm)
    cone(f"{arm}_skin", (0.09 * x, 0, 0.31), 0.019, 0.022, 0.1, M["skin"], arm, (0, 0.08 * x, 0))
    sphere(f"{arm}_hand", (0.095 * x, 0, 0.255), (0.024, 0.024, 0.026), M["skin"], arm)

pivot("head", (0, 0, 0.43), "body").scale = (1.3, 1.3, 1.3)
sphere("face", FACE[0], FACE[1], M["skin"], "head", detail=(32, 18))
sphere("hair_cap", (0, 0.028, 0.585), (0.162, 0.152, 0.15), M["hair"], "head", detail=(32, 18))
sphere("hair_back", (0, 0.07, 0.53), (0.15, 0.1, 0.13), M["hair_shade"], "head", detail=(24, 14))
for i, (x, tilt) in enumerate(((-0.1, 0.5), (-0.05, 0.2), (0, 0), (0.05, -0.2), (0.1, -0.5))):
    sphere(f"bang_{i}", (x, -0.112 + abs(x) * 0.3, 0.632 - abs(x) * 0.12), (0.05, 0.03, 0.06), M["hair"], "head", (0.45, 0, tilt))
sphere("ahoge", (0.012, 0.0, 0.745), (0.012, 0.01, 0.045), M["hair"], "head", (0.5, 0.6, 0))
for side, x in (("l", 1), ("r", -1)):
    sphere(f"side_lock_{side}", (0.128 * x, -0.045, 0.5), (0.036, 0.045, 0.11), M["hair"], "head", (0.15, -0.12 * x, 0))
    face_decal(f"eye_{side}", 0.056 * x, 0.535, (0.034, 0.044), 0.0, M["eye"])
    face_decal(f"iris_{side}", 0.056 * x, 0.527, (0.026, 0.031), 0.002, M["iris"])
    face_decal(f"pupil_{side}", 0.056 * x, 0.53, (0.011, 0.016), 0.004, M["eye"])
    face_decal(f"lash_{side}", 0.057 * x, 0.566, (0.036, 0.008), 0.003, M["eye"])
    face_decal(f"shine_{side}", 0.066 * x, 0.546, (0.012, 0.014), 0.006, M["shine"])
    face_decal(f"spark_{side}", 0.047 * x, 0.514, (0.005, 0.005), 0.006, M["shine"])
    face_decal(f"blush_{side}", 0.094 * x, 0.497, (0.022, 0.011), 0.0, M["blush"])
    tail = f"tail_{side}"
    pivot(tail, (0.15 * x, 0.03, 0.63), "head")
    sphere(f"{tail}_ribbon", (0.158 * x, 0.03, 0.635), (0.022, 0.036, 0.03), M["ribbon"], tail)
    sphere(f"{tail}_upper", (0.19 * x, 0.07, 0.47), (0.046, 0.042, 0.16), M["hair"], tail, (0.08, -0.16 * x, 0))
    sphere(f"{tail}_mid", (0.21 * x, 0.085, 0.335), (0.038, 0.034, 0.095), M["hair"], tail, (0.12, -0.05 * x, 0))
    sphere(f"{tail}_tip", (0.208 * x, 0.09, 0.25), (0.026, 0.024, 0.055), M["hair_shade"], tail, (0.1, 0.12 * x, 0))
face_decal("mouth", 0.0, 0.482, (0.012, 0.006), 0.0, M["mouth"])

bpy.context.view_layer.update()
bpy.ops.export_scene.gltf(filepath=out_glb, export_format="GLB", export_yup=True, export_apply=True)

camera = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
collection.objects.link(camera)
camera.data.type = "ORTHO"
camera.data.ortho_scale = 1.0
camera.location = (0.9, -1.25, 0.75)
target = pivot("camera_target", (0, 0, 0.42))
track = camera.constraints.new("TRACK_TO")
track.target = target
scene.camera = camera
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 24
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.data.energy = 3
sun.rotation_euler = (0.8, 0.2, 0.6)
collection.objects.link(sun)
scene.world = bpy.data.worlds.new("world")
scene.world.color = (0.22, 0.25, 0.42)
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 512
scene.render.filepath = out_png
bpy.ops.render.render(write_still=True)

depsgraph = bpy.context.evaluated_depsgraph_get()
triangles = 0
for obj in scene.objects:
    if obj.type == "MESH":
        mesh = obj.evaluated_get(depsgraph).to_mesh()
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
print("CHARACTER", {"pivots": sorted(n for n in world_of if n != "camera_target"), "triangles": triangles})
