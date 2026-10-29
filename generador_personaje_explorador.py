"""
Personaje explorador del juego (opción HOMBRE y opción MUJER) en Blender,
con el mismo modelaje low-poly de js/Characters.js y estilo NPR tipo Maggi.

Uso: pegar en la pestaña Scripting de Blender (4.2+ / 5.x) y ejecutar.

Mismo modelaje que el juego
  - Mismas piezas y medidas que Characters.js (cabeza esfera r 0.42, torso
    cilindro de 7 lados, brazos/piernas cápsula, zapatos elipsoides...), en
    unidades del juego: ~2.5 de alto, ~3 con sombrero.
  - Cuerpo en 6 partes (Torso, Cabeza, Brazo_L/R, Pierna_L/R) con el origen
    de cada parte en su articulación, con la misma jerarquía del juego
    (Raiz > Cuerpo > partes). Así se animan rotando cada parte.
  - Mira hacia -Y (Blender). Al exportar a glTF queda mirando +Z, como en el
    juego (el exportador convierte Z-arriba a Y-arriba).

Estilo NPR: cada color del juego se convierte en un material Shader to RGB +
Color Ramp (EASE) con grano de papel, y contorno sepia con Solidify (casco
invertido). Los colores salen de los hex del juego.

Opciones en la sección Parámetros (JUNTAR_PARTES, qué personajes crear, etc.).
"""

import math
import traceback

import bmesh
import bpy
from mathutils import Matrix, Vector

# --------------------------------------------------------------------------
# Parámetros
# --------------------------------------------------------------------------
CREAR = ("hombre", "mujer")   # qué opciones generar
JUNTAR_PARTES = False         # True = un solo Mesh por personaje (sin partes animables)
SEPARACION = 3.0              # distancia entre los dos personajes
OUTLINE = 0.022               # grosor del contorno, igual que Characters.js
OUTLINE_CABEZA = 0.02
OUTLINE_COLOR = (0.16, 0.08, 0.04, 1.0)  # café sepia, no negro puro
PAPER_NOISE_SCALE = 250.0
PAPER_NOISE_STRENGTH = 0.30
LIMPIAR_ESCENA = True         # borra Cube/Light por defecto y crea el Sol
SUN_ENERGY = 2.0
SUN_ROTATION_DEG = (55.0, 10.0, 40.0)

# Colores (hex sRGB, como en Characters.js)
SKINS = {"clara": 0xF1C9A5, "media": 0xE0A57C, "canela": 0xC58B62, "morena": 0x9A6A47}

LOOKS = {
    # Hereda la receta `player` del juego y le suma equipo de explorador
    "hombre": dict(
        nombre="Explorador_Hombre", skin=SKINS["media"], hair="short", hairColor=0x4A2F1B,
        hatColor=0xB98A4E, hatBand=0x5A3A1C, shirt=0x6B7A3A, vest=0x7A6A45, pants=0xA6875A,
        shoes=0x4A3320, cuff=0xD8C9A0, scarf=0xC0392B, backpack=0x8B5A2B, backpackAccent=0x3A2A18,
        leather=0x4A3320, bedroll=0x5B7A8A, metal=0x6E7378, k=1.0, legR=0.16,
        extras=("gafas_sombrero", "cantimplora", "bolsa_cinturon", "bolsillos_pecho", "saco_dormir"),
    ),
    # Basada en npc_011 (exploradora Diaguita) del juego
    "mujer": dict(
        nombre="Exploradora_Mujer", skin=SKINS["canela"], hair="ponytail", hairColor=0x2A1A10,
        hatColor=0xC9A46A, hatBand=0x7A3B3B, shirt=0xE9DCC0, vest=0x7A8A4A, pants=0x8A7350,
        shoes=0x4A3320, cuff=0xE9DCC0, scarf=0x2FB5C9, backpack=0x6B4A2E, backpackAccent=0x3A2A18,
        leather=0x4A3320, bedroll=0xC9A46A, metal=0x6E7378, k=0.92, legR=0.145,
        extras=("pluma_sombrero", "binoculares", "bolsa_cinturon", "bolsillos_pecho"),
    ),
}

# Articulaciones (coordenadas del juego: Y arriba, +Z frente)
PIVOTES = {
    "Torso": (0, 1.34, 0), "Cabeza": (0, 2.22, 0),
    "Brazo_L": (0.5, 1.72, 0), "Brazo_R": (-0.5, 1.72, 0),
    "Pierna_L": (0.2, 0.93, 0), "Pierna_R": (-0.2, 0.93, 0),
}

# Convierte coordenadas del juego (Y arriba, +Z frente) a Blender (Z arriba, -Y frente)
C = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))


# --------------------------------------------------------------------------
# Materiales NPR a partir de los colores hex del juego
# --------------------------------------------------------------------------
def srgb_a_lineal(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def paleta_desde_hex(h):
    """(sombra, medio, luz): sombra azulina/púrpura desaturada, luz cálida."""
    base = tuple(srgb_a_lineal(((h >> s) & 255) / 255.0) for s in (16, 8, 0))
    luz = tuple(c + (w - c) * 0.40 for c, w in zip(base, (1.0, 0.90, 0.70)))
    sombra = tuple(c * 0.55 * 0.65 + v * 0.35 for c, v in zip(base, (0.10, 0.08, 0.28)))
    return sombra, base, luz


def _material(nombre):
    mat = bpy.data.materials.get(nombre) or bpy.data.materials.new(nombre)
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    return mat


def material_pintura(h):
    mat = _material(f"NPR_Personaje_{h:06X}")
    nt = mat.node_tree
    new, link = nt.nodes.new, nt.links.new
    sombra, medio, luz = paleta_desde_hex(h)

    diffuse = new("ShaderNodeBsdfDiffuse")
    diffuse.inputs["Color"].default_value = (1, 1, 1, 1)
    to_rgb = new("ShaderNodeShaderToRGB")
    to_bw = new("ShaderNodeRGBToBW")
    ramp = new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "EASE"
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = 0.0, (*sombra, 1.0)
    els[1].position, els[1].color = 1.0, (*luz, 1.0)
    els.new(0.5).color = (*medio, 1.0)
    noise = new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = PAPER_NOISE_SCALE
    noise.inputs["Detail"].default_value = 8.0
    noise.inputs["Roughness"].default_value = 0.65
    paper = new("ShaderNodeMapRange")
    paper.inputs["To Min"].default_value = 0.82
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
    link(ramp.outputs["Color"], mix.inputs[6])
    link(paper.outputs["Result"], mix.inputs[7])
    link(mix.outputs[2], emission.inputs["Color"])
    link(emission.outputs["Emission"], out.inputs["Surface"])
    for node, x, y in ((diffuse, -1000, 100), (to_rgb, -780, 100), (to_bw, -580, 100), (ramp, -400, 100),
                       (noise, -780, -250), (paper, -580, -250), (mix, -150, 0),
                       (emission, 50, 0), (out, 250, 0)):
        node.location = (x, y)
    return mat


def material_contorno():
    mat = _material("NPR_Contorno_Sepia")
    nt = mat.node_tree
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = OUTLINE_COLOR
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em.location, out.location = (-200, 0), (0, 0)
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    mat.use_backface_culling = True
    return mat


# --------------------------------------------------------------------------
# Primitivas estilo three.js (mismas firmas que usa Characters.js)
# --------------------------------------------------------------------------
class Builder:
    """Una malla. Slots de material en pares: pintura (par) + contorno (impar)."""

    def __init__(self, base=None):
        self.bm = bmesh.new()
        self.colores = []
        self.base = base if base is not None else Matrix.Identity(4)

    def slot(self, color):
        if color not in self.colores:
            self.colores.append(color)
        return 2 * self.colores.index(color)


def rotxyz(rx, ry, rz):
    """Euler 'XYZ' de three.js: R = Rx · Ry · Rz."""
    return Matrix.Rotation(rx, 4, "X") @ Matrix.Rotation(ry, 4, "Y") @ Matrix.Rotation(rz, 4, "Z")


class Pieza:
    def __init__(self, b, color, pos, rot, scale, suave=True):
        self.b, self.slot, self.suave = b, b.slot(color), suave
        m = Matrix.Translation(pos) @ rotxyz(*rot) @ Matrix.Diagonal((*scale, 1.0))
        self.m = C @ b.base @ m
        self.cache = {}

    def v(self, p):
        key = (round(p[0], 5), round(p[1], 5), round(p[2], 5))
        if key not in self.cache:
            self.cache[key] = self.b.bm.verts.new(self.m @ Vector(p))
        return self.cache[key]

    def cara(self, *pts):
        verts = []
        for p in pts:
            vv = self.v(p)
            if vv not in verts:
                verts.append(vv)
        if len(verts) < 3:
            return
        try:
            f = self.b.bm.faces.new(verts)
        except ValueError:
            return
        f.material_index = self.slot
        f.smooth = self.suave


def revolve(b, perfil, seg, color, pos, rot, scale):
    """Superficie de revolución sobre Y; perfil [(radio, y)] de arriba hacia abajo."""
    pz = Pieza(b, color, pos, rot, scale)
    anillos = [[(r * math.sin(2 * math.pi * i / seg), y, r * math.cos(2 * math.pi * i / seg))
                for i in range(seg)] for r, y in perfil]
    for j in range(len(perfil) - 1):
        for i in range(seg):
            i2 = (i + 1) % seg
            pz.cara(anillos[j + 1][i], anillos[j + 1][i2], anillos[j][i2], anillos[j][i])


def sph(b, r, ws, hs, color, pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), theta=(0.0, math.pi)):
    perfil = [(r * math.sin(theta[0] + (theta[1] - theta[0]) * k / hs),
               r * math.cos(theta[0] + (theta[1] - theta[0]) * k / hs)) for k in range(hs + 1)]
    revolve(b, perfil, ws, color, pos, rot, scale)


def cyl(b, rt, rb, h, seg, color, pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    revolve(b, [(0, h / 2), (rt, h / 2), (rb, -h / 2), (0, -h / 2)], seg, color, pos, rot, scale)


def cone(b, r, h, seg, color, pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    cyl(b, 0.0, r, h, seg, color, pos, rot, scale)


def caps(b, r, largo, cap_seg, seg, color, pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    n = cap_seg + 1
    perfil = [(r * math.sin(math.pi / 2 * k / n), largo / 2 + r * math.cos(math.pi / 2 * k / n)) for k in range(n + 1)]
    perfil += [(r * math.sin(math.pi / 2 + math.pi / 2 * k / n), -largo / 2 + r * math.cos(math.pi / 2 + math.pi / 2 * k / n))
               for k in range(n + 1)]
    revolve(b, perfil, seg, color, pos, rot, scale)


def box(b, w, h, d, color, pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    pz = Pieza(b, color, pos, rot, scale, suave=False)
    x, y, z = w / 2, h / 2, d / 2

    def p(sx, sy, sz):
        return (sx * x, sy * y, sz * z)
    for quad in (((-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)),
                 ((1, -1, -1), (-1, -1, -1), (-1, 1, -1), (1, 1, -1)),
                 ((1, -1, 1), (1, -1, -1), (1, 1, -1), (1, 1, 1)),
                 ((-1, -1, -1), (-1, -1, 1), (-1, 1, 1), (-1, 1, -1)),
                 ((-1, 1, 1), (1, 1, 1), (1, 1, -1), (-1, 1, -1)),
                 ((-1, -1, -1), (1, -1, -1), (1, -1, 1), (-1, -1, 1))):
        pz.cara(*[p(*c) for c in quad])


def torus(b, R, r, rs, ts, color, pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    """Toro en el plano XY (eje Z), como TorusGeometry de three.js."""
    pz = Pieza(b, color, pos, rot, scale)

    def pt(i, j):
        a, c = 2 * math.pi * (i % ts) / ts, 2 * math.pi * (j % rs) / rs
        return ((R + r * math.cos(c)) * math.cos(a), (R + r * math.cos(c)) * math.sin(a), r * math.sin(c))
    for i in range(ts):
        for j in range(rs):
            pz.cara(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1))


# --------------------------------------------------------------------------
# Partes del cuerpo (misma receta que Characters.js + equipo de explorador)
# --------------------------------------------------------------------------
def parte_cabeza(b, L):
    skin = L["skin"]
    sph(b, 0.42, 9, 7, skin)
    for s in (-1, 1):
        sph(b, 0.08, 5, 4, skin, pos=(s * 0.41, -0.02, 0))
        sph(b, 0.052, 6, 5, 0x1A1410, pos=(s * 0.15, 0.04, 0.385))                       # ojos
        sph(b, 0.06, 5, 4, 0xE58F7A, pos=(s * 0.25, -0.1, 0.34), scale=(1, 0.6, 0.4))     # mejillas
    cone(b, 0.05, 0.1, 4, skin, pos=(0, -0.04, 0.43), rot=(math.pi / 2, 0, 0))             # nariz

    hair = L["hairColor"]
    sph(b, 0.46, 9, 5, hair, pos=(0, 0.02, -0.03), rot=(-0.45, 0, 0), theta=(0.0, math.pi / 2))
    if L["hair"] == "ponytail":
        caps(b, 0.11, 0.5, 2, 5, hair, pos=(0, -0.1, -0.5), rot=(0.5, 0, 0))
        sph(b, 0.07, 5, 4, 0xE8372C, pos=(0, 0.04, -0.43))                                 # liga
        sph(b, 0.22, 6, 5, hair, pos=(0, 0.2, 0.34), scale=(1.1, 0.5, 0.5))                # flequillo
        for s in (-1, 1):
            sph(b, 0.13, 6, 5, hair, pos=(s * 0.37, -0.02, 0.0), scale=(0.7, 1.3, 0.8))   # mechones

    # sombrero de explorador (igual que el juego)
    hc = L["hatColor"]
    cyl(b, 0.72, 0.72, 0.05, 10, hc, pos=(0, 0.3, 0))
    cyl(b, 0.3, 0.42, 0.3, 8, hc, pos=(0, 0.47, 0))
    cyl(b, 0.43, 0.43, 0.08, 8, L["hatBand"], pos=(0, 0.35, 0))
    cyl(b, 0.31, 0.31, 0.03, 8, L["hatBand"], pos=(0, 0.63, 0))                            # copa hundida
    if "gafas_sombrero" in L["extras"]:
        for s in (-1, 1):
            torus(b, 0.07, 0.022, 5, 8, 0x2B2B2B, pos=(s * 0.13, 0.37, 0.43))
            cyl(b, 0.06, 0.06, 0.02, 8, 0xA8D8E8, pos=(s * 0.13, 0.37, 0.435), rot=(math.pi / 2, 0, 0))
    if "pluma_sombrero" in L["extras"]:
        caps(b, 0.035, 0.32, 2, 4, 0xE8372C, pos=(0.36, 0.58, -0.08), rot=(0, 0, -0.7))


def parte_torso(b, L):
    k = L["k"]
    cyl(b, 0.33 * k, 0.40 * k, 0.92, 7, L["shirt"])
    cyl(b, 0.405 * k, 0.405 * k, 0.09, 7, L["leather"], pos=(0, -0.4, 0))                  # cinturón
    cyl(b, 0.355 * k, 0.42 * k, 0.62, 7, L["vest"], pos=(0, -0.1, 0.01))                   # chaleco
    torus(b, 0.3 * k, 0.09, 5, 8, L["scarf"], pos=(0, 0.5, 0), rot=(math.pi / 2, 0, 0))     # bufanda
    # mochila (igual que el juego) + bolsillos, solapa y correas
    box(b, 0.58, 0.75, 0.3, L["backpack"], pos=(0, 0.02, -0.42))
    box(b, 0.4, 0.28, 0.12, L["backpackAccent"], pos=(0, -0.15, -0.62))
    box(b, 0.6, 0.2, 0.34, L["backpack"], pos=(0, 0.33, -0.43), rot=(0.08, 0, 0))
    box(b, 0.12, 0.05, 0.04, L["metal"], pos=(0, 0.28, -0.62))
    for s in (-1, 1):
        box(b, 0.14, 0.32, 0.2, L["backpack"], pos=(s * 0.37, -0.12, -0.45))
        box(b, 0.09, 0.56, 0.05, L["leather"], pos=(s * 0.2 * k, 0.12, 0.34), rot=(-0.08, 0, 0))   # correas
    if "saco_dormir" in L["extras"]:
        cyl(b, 0.13, 0.13, 0.72, 8, L["bedroll"], pos=(0, 0.56, -0.43), rot=(0, 0, math.pi / 2))
        for x in (-0.2, 0.2):
            cyl(b, 0.135, 0.135, 0.05, 8, L["leather"], pos=(x, 0.56, -0.43), rot=(0, 0, math.pi / 2))
    if "bolsillos_pecho" in L["extras"]:
        for s in (-1, 1):
            box(b, 0.17 * k + 0.01, 0.15, 0.07, L["vest"], pos=(s * 0.15 * k, 0.04, 0.35 * k + 0.02))
            box(b, 0.17 * k + 0.01, 0.04, 0.075, L["leather"], pos=(s * 0.15 * k, 0.09, 0.35 * k + 0.02))
    if "bolsa_cinturon" in L["extras"]:
        box(b, 0.2, 0.17, 0.11, L["leather"], pos=(0.3 * k, -0.5, 0.3 * k), rot=(0, 0.6, 0))
        box(b, 0.2, 0.05, 0.12, L["backpackAccent"], pos=(0.3 * k, -0.43, 0.3 * k), rot=(0, 0.6, 0))
    if "cantimplora" in L["extras"]:
        cyl(b, 0.14, 0.14, 0.09, 8, L["metal"], pos=(-0.4 * k, -0.52, 0.12), rot=(0, 0, math.pi / 2))
        cyl(b, 0.04, 0.04, 0.05, 6, L["leather"], pos=(-0.46 * k, -0.52, 0.12), rot=(0, 0, math.pi / 2))
    if "binoculares" in L["extras"]:
        for s in (-1, 1):
            cyl(b, 0.065, 0.075, 0.22, 6, 0x2B2B2B, pos=(s * 0.08, 0.02, 0.4 * k + 0.04), rot=(math.pi / 2, 0, 0))
        box(b, 0.1, 0.04, 0.06, 0x2B2B2B, pos=(0, 0.02, 0.4 * k + 0.04))
        box(b, 0.05, 0.4, 0.03, L["leather"], pos=(0.02, 0.28, 0.33 * k), rot=(0, 0, 0.12))


def parte_brazo(b, L, lado):
    caps(b, 0.12, 0.42, 2, 5, L["shirt"], pos=(0, -0.33, 0))
    cyl(b, 0.127, 0.127, 0.07, 6, L["leather"], pos=(0, -0.55, 0))                          # muñequera
    sph(b, 0.12, 6, 5, L["skin"], pos=(0, -0.66, 0))
    sph(b, 0.07, 5, 4, L["vest"], pos=(0, -0.12, 0.0), scale=(1.8, 1, 1.6))                 # hombrera del chaleco


def parte_pierna(b, L, lado):
    r = L["legR"]
    caps(b, r, 0.5, 2, 5, L["pants"], pos=(0, -0.4, 0))
    cyl(b, r + 0.03, r + 0.03, 0.1, 6, L["cuff"], pos=(0, -0.62, 0))                        # puño / calceta
    cyl(b, 0.19, 0.2, 0.2, 6, L["shoes"], pos=(0, -0.72, 0.02))                             # caña de la bota
    sph(b, 0.2, 6, 5, L["shoes"], pos=(0, -0.8, 0.07), scale=(1, 0.65, 1.35))
    box(b, 0.05, 0.16, 0.12, L["pants"], pos=(lado * (r + 0.01), -0.32, 0.03))              # bolsillo cargo


PARTES = {
    "Torso": lambda b, L, lado: parte_torso(b, L),
    "Cabeza": lambda b, L, lado: parte_cabeza(b, L),
    "Brazo_L": lambda b, L, lado: parte_brazo(b, L, 1),
    "Brazo_R": lambda b, L, lado: parte_brazo(b, L, -1),
    "Pierna_L": lambda b, L, lado: parte_pierna(b, L, 1),
    "Pierna_R": lambda b, L, lado: parte_pierna(b, L, -1),
}


# --------------------------------------------------------------------------
# Objetos
# --------------------------------------------------------------------------
def a_objeto(b, nombre, loc, grosor, padre=None):
    for viejo in [o for o in bpy.data.objects if o.name == nombre]:
        bpy.data.objects.remove(viejo, do_unlink=True)
    contorno = material_contorno()
    mesh = bpy.data.meshes.new(nombre)
    for color in b.colores:  # slots: pintura (par) + contorno (impar)
        mesh.materials.append(material_pintura(color))
        mesh.materials.append(contorno)
    b.bm.to_mesh(mesh)
    b.bm.free()
    obj = bpy.data.objects.new(nombre, mesh)
    obj.location = loc
    bpy.context.scene.collection.objects.link(obj)
    if padre is not None:
        obj.parent = padre
    mod = obj.modifiers.new("NPR_Contorno", "SOLIDIFY")
    mod.thickness = -grosor
    mod.use_flip_normals = True
    mod.use_quality_normals = True
    mod.material_offset = 1
    mod.material_offset_rim = 1
    return obj


def vacio(nombre, padre=None, loc=(0, 0, 0)):
    for viejo in [o for o in bpy.data.objects if o.name == nombre]:
        bpy.data.objects.remove(viejo, do_unlink=True)
    e = bpy.data.objects.new(nombre, None)
    e.empty_display_type = "PLAIN_AXES"
    e.location = loc
    bpy.context.scene.collection.objects.link(e)
    if padre is not None:
        e.parent = padre
    return e


def pivote_blender(p):
    return tuple((C @ Vector((*p, 1.0)))[:3])


def construir(clave, offset_x):
    L = LOOKS[clave]
    nombre = L["nombre"]
    loc_raiz = (offset_x, 0.0, 0.0)
    for viejo in [o for o in bpy.data.objects if o.name.split(".")[0].startswith(nombre)]:
        bpy.data.objects.remove(viejo, do_unlink=True)  # limpia ejecuciones previas (también al cambiar de modo)

    if JUNTAR_PARTES:
        b = Builder()
        for parte, fn in PARTES.items():
            b.base = Matrix.Translation(PIVOTES[parte])
            fn(b, L, 1)
        return a_objeto(b, nombre, loc_raiz, OUTLINE)

    raiz = vacio(nombre, loc=loc_raiz)
    cuerpo = vacio(nombre + "_Cuerpo", padre=raiz)  # como `body` en el juego (rebote al caminar)
    for parte, fn in PARTES.items():
        b = Builder()
        fn(b, L, 1)
        padre = raiz if parte.startswith("Pierna") else cuerpo
        a_objeto(b, f"{nombre}_{parte}", pivote_blender(PIVOTES[parte]), OUTLINE_CABEZA if parte == "Cabeza" else OUTLINE, padre)
    return raiz


# --------------------------------------------------------------------------
# Escena
# --------------------------------------------------------------------------
def preparar_escena():
    scene = bpy.context.scene
    if LIMPIAR_ESCENA:
        for o in list(bpy.data.objects):
            if o.name.split(".")[0] in ("Cube", "Light", "Sol_Acuarela"):
                bpy.data.objects.remove(o, do_unlink=True)
        sun_data = bpy.data.lights.get("Sol_Acuarela") or bpy.data.lights.new("Sol_Acuarela", "SUN")
        sun_data.energy = SUN_ENERGY
        sun_data.angle = math.radians(8.0)
        sun = bpy.data.objects.new("Sol_Acuarela", sun_data)
        sun.rotation_euler = [math.radians(a) for a in SUN_ROTATION_DEG]
        sun.location = (3.0, -3.0, 4.0)
        scene.collection.objects.link(sun)
    engines = {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        if engine in engines:
            scene.render.engine = engine
            break
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == "VIEW_3D":
                area.spaces[0].shading.type = "RENDERED"


def step(nombre, fn, *args):
    try:
        res = fn(*args)
        print(f"[Personaje] OK: {nombre}")
        return res
    except Exception:
        print(f"[Personaje] ERROR en '{nombre}':")
        traceback.print_exc()
        return None


def main():
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    step("Escena", preparar_escena)
    n = len(CREAR)
    for i, clave in enumerate(CREAR):
        step(clave, construir, clave, (i - (n - 1) / 2) * SEPARACION)
    print("[Personaje] Terminado. Revisa la consola del sistema por errores.")


main()
