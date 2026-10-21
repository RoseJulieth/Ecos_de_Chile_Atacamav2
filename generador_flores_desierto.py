"""
Generador procedural de flor del desierto florido (garra de león / suspiro)
con estilo NPR tipo Maggi (Tree of Savior): acuarela suave + contorno sepia.

Uso: pegar en la pestaña Scripting de Blender (4.2+ / 5.x) y ejecutar.
Crea un único objeto Mesh llamado 'Flor_Desierto'. Se puede re-ejecutar.

Qué hace
  1. Geometría (bmesh, sin operadores): tallo curvo, 2 anillos de pétalos
     doblados hacia arriba, centro de esfera aplastada y 2 hojas.
  2. Materiales NPR: Diffuse -> Shader to RGB -> Color Ramp (EASE) -> Multiply
     con grano de papel -> Emission. Contorno con Solidify (casco invertido)
     y material Emission café sepia con Backface Culling.
  3. Escena: borra Cube y luces por defecto, crea un Sol de 2.0 en diagonal.
"""

import math
import random
import traceback

import bmesh
import bpy
from mathutils import Matrix, Vector

# --------------------------------------------------------------------------
# Parámetros ajustables
# --------------------------------------------------------------------------
OBJ_NAME = "Flor_Desierto"
SEED = 7

STEM_HEIGHT = 1.0
STEM_BEND = 0.30            # cuánto se curva el tallo en X
STEM_RADIUS = (0.030, 0.018)  # base, punta

OUTER_PETALS = dict(count=9, length=0.17, width=0.075, bend=0.30, cup=0.35,
                    tilt=34.0, base_offset=0.012)
INNER_PETALS = dict(count=6, length=0.115, width=0.060, bend=0.45, cup=0.45,
                    tilt=62.0, base_offset=0.008)

OUTLINE_THICKNESS = -0.006
OUTLINE_COLOR = (0.16, 0.08, 0.04, 1.0)  # café sepia, no negro puro
PAPER_NOISE_SCALE = 250.0
PAPER_NOISE_STRENGTH = 0.35

SUN_ENERGY = 2.0
SUN_ROTATION_DEG = (55.0, 10.0, 40.0)

# Los índices de slot van de 2 en 2: Solidify desplaza +1 el material de las
# caras del casco, así cada material de pintura (par) cae en el contorno (impar).
SLOT_PETAL, SLOT_STEM, SLOT_CENTER = 0, 2, 4

# Paradas (posición, RGBA) de cada Color Ramp: sombra -> medio tono -> luz
RAMP_PETAL = (
    (0.00, (0.27, 0.25, 0.50, 1.0)),  # púrpura azulino desaturado (sombra)
    (0.50, (0.62, 0.30, 0.72, 1.0)),  # violeta
    (1.00, (0.97, 0.38, 0.74, 1.0)),  # magenta / fucsia encendido (luz)
)
RAMP_STEM = (
    (0.00, (0.17, 0.27, 0.31, 1.0)),
    (0.50, (0.38, 0.56, 0.40, 1.0)),
    (1.00, (0.76, 0.86, 0.56, 1.0)),
)
RAMP_CENTER = (
    (0.00, (0.42, 0.26, 0.20, 1.0)),
    (0.50, (0.85, 0.62, 0.28, 1.0)),
    (1.00, (1.00, 0.88, 0.45, 1.0)),
)


# --------------------------------------------------------------------------
# 1) Geometría
# --------------------------------------------------------------------------
def stem_point(t):
    """Punto y tangente del tallo (curva suave que se inclina en X)."""
    p = Vector((STEM_BEND * STEM_HEIGHT * t * t, 0.0, STEM_HEIGHT * t))
    tangent = Vector((2.0 * STEM_BEND * STEM_HEIGHT * t, 0.0, STEM_HEIGHT)).normalized()
    return p, tangent


def frame_at(t):
    """Matriz 4x4 con origen en el tallo (t) y eje Z a lo largo de la tangente."""
    p, tangent = stem_point(t)
    rot = tangent.to_track_quat("Z", "Y").to_matrix().to_4x4()
    return Matrix.Translation(p) @ rot


def build_stem(bm, rings=12, sides=8):
    ring_verts = []
    for i in range(rings + 1):
        t = i / rings
        frame = frame_at(t)
        radius = STEM_RADIUS[0] + (STEM_RADIUS[1] - STEM_RADIUS[0]) * t
        ring = []
        for k in range(sides):
            a = 2.0 * math.pi * k / sides
            ring.append(bm.verts.new(frame @ Vector((radius * math.cos(a),
                                                     radius * math.sin(a), 0.0))))
        ring_verts.append(ring)

    faces = []
    for i in range(rings):
        for k in range(sides):
            k2 = (k + 1) % sides
            faces.append(bm.faces.new((ring_verts[i][k], ring_verts[i][k2],
                                       ring_verts[i + 1][k2], ring_verts[i + 1][k])))
    faces.append(bm.faces.new(ring_verts[0]))
    faces.append(bm.faces.new(reversed(ring_verts[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    for f in faces:
        f.material_index = SLOT_STEM
    return faces


def add_petal(bm, base, length, width, bend, cup, tilt, azimuth, mat_index,
              base_offset=0.0, seg_l=6, seg_w=4):
    """Pétalo = lámina con perfil de ancho, doblada hacia arriba y ligeramente cóncava."""
    rot = (Matrix.Rotation(azimuth, 4, "Z")
           @ Matrix.Translation((base_offset, 0.0, 0.0))
           @ Matrix.Rotation(-math.radians(tilt), 4, "Y"))
    grid = []
    for i in range(seg_l + 1):
        t = i / seg_l
        w = width * (0.08 + 0.92 * math.sin(math.pi * t ** 0.75) ** 0.8)
        row = []
        for j in range(seg_w + 1):
            s = -1.0 + 2.0 * j / seg_w
            local = Vector((length * t, w * s,
                            bend * length * t * t + cup * w * s * s))
            row.append(bm.verts.new(base @ rot @ local))
        grid.append(row)

    faces = []
    for i in range(seg_l):
        for j in range(seg_w):
            f = bm.faces.new((grid[i][j], grid[i + 1][j],
                              grid[i + 1][j + 1], grid[i][j + 1]))
            f.material_index = mat_index
            faces.append(f)
    return faces


def build_flower_head(bm, rng):
    head = frame_at(1.0)
    faces = []
    for cfg in (OUTER_PETALS, INNER_PETALS):
        n = cfg["count"]
        phase = rng.uniform(0, 2 * math.pi)
        if cfg is INNER_PETALS:
            phase += math.pi / n  # pétalos internos intercalados con los externos
        for k in range(n):
            jitter = lambda amp: 1.0 + rng.uniform(-amp, amp)
            faces += add_petal(
                bm, head,
                length=cfg["length"] * jitter(0.10),
                width=cfg["width"] * jitter(0.08),
                bend=cfg["bend"] * jitter(0.15),
                cup=cfg["cup"],
                tilt=cfg["tilt"] * jitter(0.12),
                azimuth=phase + 2.0 * math.pi * k / n,
                mat_index=SLOT_PETAL,
                base_offset=cfg["base_offset"])

    # Centro: esfera aplastada
    sphere = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.038)
    verts = sphere["verts"]
    squash = Matrix.Diagonal((1.0, 1.0, 0.55, 1.0))
    bmesh.ops.transform(bm, matrix=head @ Matrix.Translation((0, 0, 0.012)) @ squash,
                        verts=verts)
    center_faces = {f for v in verts for f in v.link_faces}
    bmesh.ops.recalc_face_normals(bm, faces=list(center_faces))
    for f in center_faces:
        f.material_index = SLOT_CENTER
    return faces + list(center_faces)


def build_leaves(bm):
    faces = []
    for t, az in ((0.22, 0.0), (0.42, math.pi)):
        frame = frame_at(t)
        faces += add_petal(bm, frame, length=0.28, width=0.028, bend=0.35, cup=0.5,
                           tilt=48.0, azimuth=az, mat_index=SLOT_STEM,
                           base_offset=STEM_RADIUS[0] * 0.6, seg_l=8, seg_w=3)
    return faces


def build_flower_object(materials):
    for old in [o for o in bpy.data.objects if o.name.startswith(OBJ_NAME)]:
        bpy.data.objects.remove(old, do_unlink=True)
    for old in [m for m in bpy.data.meshes if m.name.startswith(OBJ_NAME) and m.users == 0]:
        bpy.data.meshes.remove(old)

    rng = random.Random(SEED)
    bm = bmesh.new()
    build_stem(bm)
    build_leaves(bm)
    build_flower_head(bm, rng)
    for f in bm.faces:
        f.smooth = True

    mesh = bpy.data.meshes.new(OBJ_NAME)
    # Los slots deben existir antes de volcar la malla: si no, Blender recorta
    # los índices de material a 0.
    for mat in materials:
        mesh.materials.append(mat)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bpy.context.view_layer.update()
    for o in bpy.context.view_layer.objects:
        if o is not None:
            o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    return obj


# --------------------------------------------------------------------------
# 2) Materiales NPR + contorno
# --------------------------------------------------------------------------
def get_material(name):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True  # deprecado en 5.x pero inofensivo
    mat.node_tree.nodes.clear()
    return mat


def build_paint_material(name, stops):
    mat = get_material(name)
    nt = mat.node_tree
    new, link = nt.nodes.new, nt.links.new

    diffuse = new("ShaderNodeBsdfDiffuse")
    diffuse.inputs["Color"].default_value = (1, 1, 1, 1)
    to_rgb = new("ShaderNodeShaderToRGB")
    to_bw = new("ShaderNodeRGBToBW")

    ramp = new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "EASE"
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = stops[0]
    els[1].position, els[1].color = stops[-1]
    mid = els.new(stops[1][0])
    mid.color = stops[1][1]

    noise = new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = PAPER_NOISE_SCALE
    noise.inputs["Detail"].default_value = 8.0
    noise.inputs["Roughness"].default_value = 0.65
    paper = new("ShaderNodeMapRange")
    paper.inputs["To Min"].default_value = 0.78
    paper.inputs["To Max"].default_value = 1.0

    mix = new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = PAPER_NOISE_STRENGTH

    emission = new("ShaderNodeEmission")
    out = new("ShaderNodeOutputMaterial")

    link(diffuse.outputs["BSDF"], to_rgb.inputs["Shader"])
    link(to_rgb.outputs["Color"], to_bw.inputs["Color"])
    link(to_bw.outputs["Val"], ramp.inputs["Fac"])
    link(noise.outputs["Fac"], paper.inputs["Value"])
    link(ramp.outputs["Color"], mix.inputs[6])      # A
    link(paper.outputs["Result"], mix.inputs[7])    # B
    link(mix.outputs[2], emission.inputs["Color"])  # Result
    link(emission.outputs["Emission"], out.inputs["Surface"])

    for node, x, y in ((diffuse, -1000, 100), (to_rgb, -780, 100), (to_bw, -580, 100),
                       (ramp, -400, 100), (noise, -780, -250), (paper, -580, -250),
                       (mix, -150, 0), (emission, 50, 0), (out, 250, 0)):
        node.location = (x, y)
    return mat


def build_outline_material():
    mat = get_material("NPR_Contorno_Sepia")
    nt = mat.node_tree
    emission = nt.nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = OUTLINE_COLOR
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emission.location, out.location = (-200, 0), (0, 0)
    nt.links.new(emission.outputs["Emission"], out.inputs["Surface"])
    mat.use_backface_culling = True
    return mat


def build_materials():
    petal = build_paint_material("NPR_Petalo_Fucsia", RAMP_PETAL)
    stem = build_paint_material("NPR_Tallo_Verde", RAMP_STEM)
    center = build_paint_material("NPR_Centro_Dorado", RAMP_CENTER)
    outline = build_outline_material()

    # pintura en slots pares, contorno en los impares (ver SLOT_*)
    return [petal, outline, stem, outline, center, outline]


def add_outline_modifier(obj):
    mod = obj.modifiers.get("NPR_Contorno") or obj.modifiers.new("NPR_Contorno", "SOLIDIFY")
    mod.thickness = OUTLINE_THICKNESS
    mod.use_flip_normals = True
    mod.use_quality_normals = True     # High Quality Thickness
    mod.material_offset = 1
    mod.material_offset_rim = 1        # el borde de las láminas también usa el contorno


# --------------------------------------------------------------------------
# 3) Escena
# --------------------------------------------------------------------------
def setup_scene():
    scene = bpy.context.scene

    # Borra el cubo inicial y la luz por defecto (y soles de ejecuciones previas)
    for o in list(bpy.data.objects):
        if o.name.split(".")[0] in ("Cube", "Light", "Sol_Acuarela"):
            bpy.data.objects.remove(o, do_unlink=True)

    sun_data = bpy.data.lights.get("Sol_Acuarela") or bpy.data.lights.new("Sol_Acuarela", "SUN")
    sun_data.type = "SUN"
    sun_data.energy = SUN_ENERGY
    sun_data.angle = math.radians(8.0)  # sombras suaves
    sun = bpy.data.objects.new("Sol_Acuarela", sun_data)
    sun.rotation_euler = [math.radians(a) for a in SUN_ROTATION_DEG]
    sun.location = (3.0, -3.0, 4.0)
    scene.collection.objects.link(sun)

    engines = {e.identifier for e in
               bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        if engine in engines:
            scene.render.engine = engine
            break
    scene.view_settings.view_transform = "Standard"  # conserva los pasteles
    scene.view_settings.look = "None"

    # Visor 3D en modo Rendered para ver Shader to RGB
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == "VIEW_3D":
                area.spaces[0].shading.type = "RENDERED"


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def step(name, fn, *args):
    try:
        result = fn(*args)
        print(f"[Flor] OK: {name}")
        return result
    except Exception:
        print(f"[Flor] ERROR en '{name}':")
        traceback.print_exc()
        return None


def main():
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    step("Escena (limpieza, sol, Eevee)", setup_scene)
    materials = step("Materiales NPR", build_materials)
    obj = step("Geometría", build_flower_object, materials) if materials else None
    if obj:
        step("Contorno (Solidify)", add_outline_modifier, obj)
    print("[Flor] Terminado. Revisa la consola del sistema por errores.")


main()
