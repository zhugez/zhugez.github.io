"""Render the hero mascot poster from the Miku model.

Usage: blender -b --factory-startup --python scripts/blender/miku-poster.py -- <miku.glb> <out.png>
Transparent 512px Cycles render, 3/4 front view, warm key plus indigo rim, framed full body with the feet near the bottom.
"""
import sys

import bpy
from mathutils import Vector

glb, out_png = sys.argv[sys.argv.index("--") + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=glb)


def add_light(name, kind, loc, energy, color, size):
    light = bpy.data.lights.new(name, kind)
    light.energy = energy
    light.color = color
    if kind == "AREA":
        light.size = size
    obj = bpy.data.objects.new(name, light)
    scene.collection.objects.link(obj)
    obj.location = loc
    track = obj.constraints.new("TRACK_TO")
    track.target = target
    return obj


target = bpy.data.objects.new("target", None)
target.location = (0, 0, 0.4)
scene.collection.objects.link(target)

camera = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
scene.collection.objects.link(camera)
camera.data.type = "ORTHO"
camera.data.ortho_scale = 0.98
camera.location = Vector((0.55, -1.4, 0.62))
camera.constraints.new("TRACK_TO").target = target
scene.camera = camera

add_light("key", "AREA", (0.9, -1.3, 1.2), 190, (1.0, 0.88, 0.76), 1.2)
add_light("fill", "AREA", (-1.2, -0.9, 0.5), 45, (0.7, 0.78, 1.0), 1.5)
add_light("rim", "AREA", (-0.5, 1.2, 0.9), 120, (0.45, 0.58, 1.0), 0.8)
scene.world = bpy.data.worlds.new("world")
scene.world.color = (0.32, 0.36, 0.55)

scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 512
scene.render.filepath = out_png
bpy.ops.render.render(write_still=True)
