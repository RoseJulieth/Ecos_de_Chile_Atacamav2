"""
Biblioteca procedural del desierto florido (flora, entorno y fauna pequeña)
con estilo NPR tipo Maggi (Tree of Savior): acuarela suave + contorno sepia.

Uso: abrir en la pestaña Scripting de Blender (4.2+ / 5.x) y ejecutar.
Cada especie es un objeto Mesh 'DF_<id>' con materiales NPR propios; se
colocan en una grilla. Se puede re-ejecutar (reemplaza los DF_*).

Para generar solo algunas, cambia GENERAR (ej. ["pata_de_guanaco", "oruga"]).
Las formas son aproximaciones por descripción: ajusta parámetros y paletas
cuando las compares con fotos reales.

Estructura
  - Primitivas: tubo, lámina (pétalo/hoja), esfera, torno, ala.
  - Flores compuestas: platillo, lirio (tépalos), embudo/trompeta.
  - Una función sp_<id> por especie, registradas en ESPECIES.
"""

import math
import random
import traceback

import bmesh
import bpy
from mathutils import Matrix, Vector, noise

# --------------------------------------------------------------------------
# Parámetros
# --------------------------------------------------------------------------
GENERAR = None          # None = todas; o lista de ids
SEED = 11
SEPARACION = 1.8        # distancia entre objetos en la grilla
POR_FILA = 6
LIMPIAR_ESCENA = True   # borra Cube/Light por defecto y crea el Sol
OUTLINE_RATIO = 0.008   # grosor del contorno relativo al tamaño del objeto
OUTLINE_COLOR = (0.16, 0.08, 0.04, 1.0)  # café sepia, no negro puro
PAPER_NOISE_SCALE = 250.0
PAPER_NOISE_STRENGTH = 0.35
SUN_ENERGY = 2.0
SUN_ROTATION_DEG = (55.0, 10.0, 40.0)
PREFIJO = "DF_"

# Paletas: (sombra, medio tono, luz). Sombras azulinas/púrpuras desaturadas.
PALETAS = {
    "fucsia":       ((0.28, 0.22, 0.48), (0.66, 0.28, 0.68), (0.97, 0.35, 0.70)),
    "violeta":      ((0.25, 0.22, 0.50), (0.50, 0.38, 0.78), (0.78, 0.66, 0.95)),
    "azul_suspiro": ((0.22, 0.25, 0.52), (0.42, 0.50, 0.85), (0.70, 0.78, 0.98)),
    "amarillo":     ((0.45, 0.32, 0.20), (0.92, 0.70, 0.22), (1.00, 0.90, 0.45)),
    "rojo_naranja": ((0.38, 0.15, 0.25), (0.85, 0.22, 0.15), (1.00, 0.50, 0.22)),
    "rosa":         ((0.40, 0.25, 0.45), (0.85, 0.50, 0.70), (1.00, 0.75, 0.82)),
    "crema":        ((0.45, 0.38, 0.45), (0.85, 0.78, 0.72), (1.00, 0.96, 0.85)),
    "verde":        ((0.17, 0.27, 0.31), (0.38, 0.56, 0.40), (0.76, 0.86, 0.56)),
    "verde_gris":   ((0.22, 0.30, 0.32), (0.50, 0.60, 0.52), (0.78, 0.84, 0.70)),
    "verde_oruga":  ((0.18, 0.30, 0.20), (0.45, 0.68, 0.35), (0.80, 0.92, 0.55)),
    "dorado":       ((0.42, 0.26, 0.20), (0.85, 0.62, 0.28), (1.00, 0.88, 0.45)),
    "seco":         ((0.40, 0.30, 0.22), (0.72, 0.60, 0.38), (0.90, 0.82, 0.58)),
    "cafe":         ((0.18, 0.11, 0.09), (0.40, 0.26, 0.18), (0.65, 0.48, 0.32)),
    "negro":        ((0.05, 0.05, 0.09), (0.12, 0.11, 0.15), (0.26, 0.24, 0.30)),
    "rojo_vaquita": ((0.30, 0.05, 0.08), (0.70, 0.10, 0.10), (0.92, 0.25, 0.18)),
    "gris_roca":    ((0.28, 0.26, 0.32), (0.55, 0.50, 0.50), (0.80, 0.74, 0.66)),
    "arena":        ((0.55, 0.42, 0.35), (0.85, 0.70, 0.52), (0.97, 0.88, 0.70)),
    "gris_cururo":  ((0.15, 0.16, 0.22), (0.32, 0.34, 0.42), (0.55, 0.56, 0.62)),
    "ala":          ((0.55, 0.55, 0.62), (0.82, 0.82, 0.86), (0.97, 0.97, 0.98)),
    "oliva":        ((0.20, 0.22, 0.15), (0.45, 0.45, 0.30), (0.75, 0.72, 0.55)),
    "rosa_polilla": ((0.45, 0.20, 0.30), (0.85, 0.45, 0.50), (1.00, 0.75, 0.75)),
}


# --------------------------------------------------------------------------
# Constructor: una malla por especie, slots de material en pares
# (pintura = par, contorno = impar, porque Solidify desplaza +1 el casco).
# --------------------------------------------------------------------------
class Builder:
    def __init__(self):
        self.bm = bmesh.new()
        self.paletas = []
        self.plano = False  # True = sombreado facetado (rocas)

    def slot(self, paleta):
        if paleta not in self.paletas:
            self.paletas.append(paleta)
        return 2 * self.paletas.index(paleta)

    def cara(self, verts, paleta):
        f = self.bm.faces.new(verts)
        f.material_index = self.slot(paleta)
        return f


def T(x=0.0, y=0.0, z=0.0):
    return Matrix.Translation((x, y, z))


def taper(a, b, n):
    n = max(n, 2)
    return [a + (b - a) * i / (n - 1) for i in range(n)]


def curva(base, alto, lean=(0.0, 0.0), n=8):
    """Puntos de un tallo que sube `alto` y se inclina `lean` (curva cuadrática)."""
    return [Vector((base.x + lean[0] * (i / n) ** 2, base.y + lean[1] * (i / n) ** 2,
                    base.z + alto * i / n)) for i in range(n + 1)]


def frame_end(pts):
    """Marco en la punta de una polilínea: Z = tangente."""
    t = (pts[-1] - pts[-2]).normalized()
    return Matrix.Translation(pts[-1]) @ t.to_track_quat("Z", "Y").to_matrix().to_4x4()


# --------------------------------------------------------------------------
# Primitivas
# --------------------------------------------------------------------------
def tube(b, pts, radii, pal, sides=8, caps=True, ribs=None):
    """Tubo por una polilínea, con transporte paralelo del marco. ribs=(n, amp)."""
    n = len(pts)
    tans = [(pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized() for i in range(n)]
    rot = tans[0].to_track_quat("Z", "Y")
    rings = []
    for i in range(n):
        if i > 0:
            rot = tans[i - 1].rotation_difference(tans[i]) @ rot
        rm = rot.to_matrix()
        ring = []
        for k in range(sides):
            a = 2.0 * math.pi * k / sides
            r = max(radii[i], 5e-4)
            if ribs:
                r *= 1.0 + ribs[1] * math.cos(ribs[0] * a)
            ring.append(b.bm.verts.new(pts[i] + rm @ Vector((r * math.cos(a), r * math.sin(a), 0.0))))
        rings.append(ring)
    faces = []
    for i in range(n - 1):
        for k in range(sides):
            k2 = (k + 1) % sides
            faces.append(b.cara((rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]), pal))
    if caps:
        faces.append(b.cara(list(reversed(rings[0])), pal))
        faces.append(b.cara(rings[-1], pal))
    return faces


def lathe(b, m, perfil, pal, segs=14, lobulos=None, flip=False):
    """Superficie de revolución sobre Z. perfil = [(radio, z), ...]. lobulos=(n, amp)."""
    rings = []
    for r0, z in perfil:
        ring = []
        for k in range(segs):
            a = 2.0 * math.pi * k / segs
            r = max(r0, 5e-4)
            if lobulos:
                r *= 1.0 + lobulos[1] * math.cos(lobulos[0] * a)
            ring.append(b.bm.verts.new(m @ Vector((r * math.cos(a), r * math.sin(a), z))))
        rings.append(ring)
    faces = []
    for i in range(len(perfil) - 1):
        for k in range(segs):
            k2 = (k + 1) % segs
            quad = (rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k])
            faces.append(b.cara(tuple(reversed(quad)) if flip else quad, pal))
    return faces


PERFILES = {
    "petalo": lambda t: 0.10 + 0.90 * math.sin(math.pi * t ** 0.75) ** 0.8,
    "ancho":  lambda t: 0.25 + 0.75 * math.sin(math.pi * t ** 0.6) ** 0.6,
    "lanza":  lambda t: 0.06 + 0.94 * math.sin(math.pi * t ** 0.6) ** 0.9,
    "cinta":  lambda t: 0.15 + 0.85 * (1.0 - t ** 2.5),
}


def sheet(b, m, largo, ancho, pal, perfil="petalo", bend=0.25, cup=0.3, tilt=30.0,
          azimut=0.0, offset=0.0, twist=0.0, seg_l=6, seg_w=4):
    """Lámina (pétalo u hoja): extiende hacia +X, se dobla hacia +Z, cóncava."""
    prof = PERFILES[perfil]
    rot = (m @ Matrix.Rotation(azimut, 4, "Z") @ T(offset) @ Matrix.Rotation(-math.radians(tilt), 4, "Y"))
    grid = []
    for i in range(seg_l + 1):
        t = i / seg_l
        w = ancho * prof(t)
        row = []
        for j in range(seg_w + 1):
            s = -1.0 + 2.0 * j / seg_w
            y, z = w * s, bend * largo * t * t + cup * w * s * s
            if twist:
                ang = twist * t
                y, z = y * math.cos(ang) - z * math.sin(ang), y * math.sin(ang) + z * math.cos(ang)
            row.append(b.bm.verts.new(rot @ Vector((largo * t, y, z))))
        grid.append(row)
    for i in range(seg_l):
        for j in range(seg_w):
            b.cara((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]), pal)


def ellipsoid(b, centro, escala, pal, rot=None, slot_fn=None, recorta=None, seg=12, anillos=8):
    """Elipsoide. slot_fn(d)->paleta por cara (d = centro de cara en esfera unitaria);
    recorta(d)->True borra la cara."""
    res = bmesh.ops.create_uvsphere(b.bm, u_segments=seg, v_segments=anillos, radius=1.0)
    verts = res["verts"]
    faces = {f for v in verts for f in v.link_faces}
    borrar = []
    for f in faces:
        d = f.calc_center_median()
        if recorta and recorta(d):
            borrar.append(f)
            continue
        f.material_index = b.slot(slot_fn(d) if slot_fn else pal)
    m = (Matrix.Translation(centro) @ (rot if rot is not None else Matrix.Identity(4))
         @ Matrix.Diagonal((escala[0], escala[1], escala[2], 1.0)))
    bmesh.ops.transform(b.bm, matrix=m, verts=verts)
    if borrar:
        bmesh.ops.delete(b.bm, geom=borrar, context="FACES")


def ala(b, raiz, contorno, pal, lado=1, angulo=25.0, escala=1.0):
    """Ala plana (abanico de triángulos) levantada `angulo` grados."""
    pts = [Vector((lado * x * escala, y * escala, 0.0)) for x, y in contorno]
    area = sum(pts[i].x * pts[(i + 1) % len(pts)].y - pts[(i + 1) % len(pts)].x * pts[i].y
               for i in range(len(pts)))
    if area < 0:
        pts.reverse()
    m = T(*raiz) @ Matrix.Rotation(-lado * math.radians(angulo), 4, "Y")
    verts = [b.bm.verts.new(m @ p) for p in pts]
    for i in range(1, len(verts) - 1):
        b.cara((verts[0], verts[i], verts[i + 1]), pal)


def pata(b, puntos, r, pal, sides=5):
    tube(b, [Vector(p) for p in puntos], taper(r, r * 0.4, len(puntos)), pal, sides=sides)


# --------------------------------------------------------------------------
# Flores compuestas (eje Z del marco `m` = hacia arriba de la flor)
# --------------------------------------------------------------------------
def flor_platillo(b, m, n, largo, ancho, pal, pal_centro, rng, tilt=18.0, bend=0.2, cup=0.3):
    fase = rng.uniform(0, 2 * math.pi)
    for k in range(n):
        sheet(b, m, largo * rng.uniform(0.92, 1.08), ancho, pal, "ancho", bend=bend, cup=cup,
              tilt=tilt * rng.uniform(0.85, 1.15), azimut=fase + 2 * math.pi * k / n, offset=largo * 0.06)
    ellipsoid(b, (m @ Vector((0, 0, largo * 0.05))), (largo * 0.26, largo * 0.26, largo * 0.13),
              pal_centro, rot=m.to_3x3().to_4x4())


def flor_lirio(b, m, n, largo, ancho, tilt, pal, pal_garganta, rng, bend=0.35, cup=0.4, tubo=0.0):
    fase = rng.uniform(0, 2 * math.pi)
    if tubo:
        lathe(b, m, [(largo * 0.05, 0), (largo * 0.08, tubo * 0.6), (largo * 0.14, tubo)], pal_garganta, segs=8)
    mm = m @ T(0, 0, tubo)
    for k in range(n):
        sheet(b, mm, largo * rng.uniform(0.92, 1.08), ancho, pal, "petalo", bend=bend, cup=cup,
              tilt=tilt * rng.uniform(0.85, 1.15), azimut=fase + 2 * math.pi * k / n, offset=largo * 0.04,
              seg_l=5, seg_w=3)
    tube(b, [mm @ Vector((0, 0, 0)), mm @ Vector((0, 0, largo * 0.35))],
         [largo * 0.03, largo * 0.015], pal_garganta, sides=5)


def flor_embudo(b, m, largo, r_boca, pal, pal_garganta, lobulos=5):
    perfil = [(0.012, 0.0), (0.02, 0.25 * largo), (0.5 * r_boca, 0.6 * largo),
              (0.85 * r_boca, 0.88 * largo), (r_boca, largo)]
    lathe(b, m, perfil, pal, segs=15, lobulos=(lobulos, 0.08))
    zz = largo * 0.9
    lathe(b, m, [(0.001, zz), (r_boca * 0.55, zz)], pal_garganta, segs=15, flip=True)


def roseta(b, m, n, largo, ancho, pal, tilt, rng, perfil="cinta", bend=0.25, twist=0.0):
    for k in range(n):
        sheet(b, m, largo * rng.uniform(0.75, 1.1), ancho, pal, perfil, bend=bend, cup=0.4,
              tilt=rng.uniform(*tilt), azimut=2 * math.pi * k / n + rng.uniform(-0.2, 0.2),
              offset=0.01, twist=twist, seg_w=2)


def hojas_tallo(b, pts, n, largo, ancho, pal, rng, tilt=45.0, perfil="lanza", twist=0.0):
    """Hojas alternas a lo largo de un tallo (marco por tramo)."""
    for i in range(n):
        idx = 1 + int((len(pts) - 2) * i / max(n - 1, 1) * 0.8)
        idx = min(idx, len(pts) - 1)
        t = (pts[min(idx + 1, len(pts) - 1)] - pts[idx - 1]).normalized()
        m = Matrix.Translation(pts[idx]) @ t.to_track_quat("Z", "Y").to_matrix().to_4x4()
        sheet(b, m, largo * (1.0 - 0.5 * i / max(n, 1)), ancho, pal, perfil, bend=0.4, cup=0.4,
              tilt=tilt, azimut=i * 2.4 + rng.uniform(-0.3, 0.3), offset=0.008, twist=twist, seg_w=2)


# --------------------------------------------------------------------------
# Flora
# --------------------------------------------------------------------------
def sp_pata_de_guanaco(b, rng):
    roseta(b, T(), 12, 0.32, 0.035, "verde", (15, 50), rng)
    for i in range(5):
        a = 2 * math.pi * i / 5 + rng.uniform(-0.3, 0.3)
        r, h = rng.uniform(0.03, 0.10), rng.uniform(0.45, 0.85)
        pts = curva(Vector((r * math.cos(a), r * math.sin(a), 0.02)), h,
                    (math.cos(a) * rng.uniform(0.04, 0.14), math.sin(a) * rng.uniform(0.04, 0.14)))
        tube(b, pts, taper(0.011, 0.007, len(pts)), "verde", sides=6)
        flor_platillo(b, frame_end(pts), 5, 0.10, 0.075, "fucsia", "amarillo", rng,
                      tilt=rng.uniform(10, 25))
    # capullos
    for a in (0.7, 3.9):
        pts = curva(Vector((0.05 * math.cos(a), 0.05 * math.sin(a), 0.02)), 0.4, (0.05, 0.03))
        tube(b, pts, taper(0.009, 0.006, len(pts)), "verde", sides=5)
        ellipsoid(b, pts[-1] + Vector((0, 0, 0.025)), (0.025, 0.025, 0.04), "fucsia")


def sp_garra_de_leon(b, rng):
    pts = curva(Vector((0, 0, 0)), 0.9, (0.12, 0.0), n=10)
    tube(b, pts, taper(0.018, 0.010, len(pts)), "verde", sides=6)
    hojas_tallo(b, pts, 9, 0.22, 0.035, "verde_gris", rng, tilt=50)
    for i in range(7):
        t = 0.45 + 0.5 * i / 6
        base = pts[int(t * (len(pts) - 1))]
        az = i * 2.3
        arco = []
        for a in range(0, 105, 15):
            ar = math.radians(a)
            arco.append(Vector((0.13 * math.sin(ar), 0, 0.13 * (1 - math.cos(ar)) + 0.0)))
        arco = [base + Matrix.Rotation(az, 3, "Z") @ p for p in arco]
        tube(b, arco, [0.008, 0.016, 0.024, 0.030, 0.030, 0.026, 0.020], "rojo_naranja", sides=7)
        # labios de la boca
        m = Matrix.Translation(arco[-1]) @ (arco[-1] - arco[-2]).normalized().to_track_quat("Z", "Y").to_matrix().to_4x4()
        for s in (0, 1):
            sheet(b, m, 0.05, 0.025, "amarillo", "petalo", bend=0.4, cup=0.2, tilt=55, azimut=math.pi * s, seg_l=4, seg_w=2)


def sp_cuernecillo(b, rng):
    roseta(b, T(), 9, 0.20, 0.04, "verde_gris", (10, 40), rng, perfil="lanza", bend=0.3)
    for i in range(4):
        a = 2 * math.pi * i / 4 + rng.uniform(-0.3, 0.3)
        pts = curva(Vector((0.05 * math.cos(a), 0.05 * math.sin(a), 0.02)), rng.uniform(0.22, 0.4),
                    (math.cos(a) * 0.06, math.sin(a) * 0.06), n=5)
        tube(b, pts, taper(0.007, 0.005, len(pts)), "verde", sides=5)
        flor_embudo(b, frame_end(pts), 0.10, 0.065, "violeta", "amarillo", lobulos=5)


def sp_malvilla(b, rng):
    for i in range(5):
        a = 2 * math.pi * i / 5 + rng.uniform(-0.3, 0.3)
        pts = curva(Vector((0.02 * math.cos(a), 0.02 * math.sin(a), 0)), rng.uniform(0.3, 0.6),
                    (math.cos(a) * 0.2, math.sin(a) * 0.2), n=7)
        tube(b, pts, taper(0.010, 0.005, len(pts)), "verde", sides=5)
        hojas_tallo(b, pts, 4, 0.08, 0.03, "verde_gris", rng, tilt=55, perfil="ancho")
        flor_platillo(b, frame_end(pts), 5, 0.05, 0.04, "rosa", "amarillo", rng, tilt=20)


def sp_suspiro(b, rng):
    for i in range(4):
        a = 2 * math.pi * i / 4 + rng.uniform(-0.3, 0.3)
        d = Vector((math.cos(a), math.sin(a), 0))
        pts = [Vector((0, 0, 0.02)) + d * (0.30 * t) + Vector((0, 0, 0.10 * math.sin(math.pi * t) * 0.6))
               for t in (i2 / 6 for i2 in range(7))]
        tube(b, pts, taper(0.012, 0.006, len(pts)), "verde", sides=5)
        for j in (3, 5):
            hojas_tallo(b, pts[:j + 1], 1, 0.07, 0.04, "verde_gris", rng, tilt=40, perfil="ancho")
        for j in (4, 6):
            m = Matrix.Translation(pts[j]) @ Matrix.Rotation(rng.uniform(-0.2, 0.2), 4, "X")
            flor_embudo(b, m, 0.12, 0.075, "azul_suspiro", "crema", lobulos=5)


def sp_huille(b, rng):
    roseta(b, T(), 6, 0.55, 0.018, "verde", (5, 25), rng, perfil="cinta", bend=0.5)
    pts = curva(Vector((0, 0, 0)), 0.72, (0.04, 0.0), n=8)
    tube(b, pts, taper(0.009, 0.006, len(pts)), "verde", sides=5)
    top = frame_end(pts)
    for k in range(6):
        az = 2 * math.pi * k / 6
        mm = top @ Matrix.Rotation(az, 4, "Z") @ Matrix.Rotation(-math.radians(55), 4, "Y")
        ped = [mm @ Vector((0, 0, 0.0)), mm @ Vector((0, 0, 0.08))]
        tube(b, ped, [0.004, 0.003], "verde", sides=4)
        flor_lirio(b, Matrix.Translation(ped[-1]) @ top.to_3x3().to_4x4() @ Matrix.Rotation(az, 4, "Z") @
                   Matrix.Rotation(-math.radians(30), 4, "Y"),
                   6, 0.09, 0.04, 35, "azul_suspiro", "crema", rng, tubo=0.04)


def _ananuca(b, rng, pal):
    roseta(b, T(), 3, 0.45, 0.04, "verde", (10, 35), rng, perfil="cinta", bend=0.4)
    pts = curva(Vector((0, 0, 0)), 0.6, (0.03, 0.0), n=8)
    tube(b, pts, taper(0.014, 0.010, len(pts)), "verde", sides=6)
    top = frame_end(pts)
    for k in range(4):
        az = 2 * math.pi * k / 4 + 0.4
        mm = top @ Matrix.Rotation(az, 4, "Z") @ Matrix.Rotation(-math.radians(48), 4, "Y")
        ped = [mm @ Vector((0, 0, 0.0)), mm @ Vector((0, 0, 0.07))]
        tube(b, ped, [0.006, 0.005], "verde", sides=4)
        fm = Matrix.Translation(ped[-1]) @ top.to_3x3().to_4x4() @ Matrix.Rotation(az, 4, "Z") @ \
            Matrix.Rotation(-math.radians(35), 4, "Y")
        flor_lirio(b, fm, 6, 0.10, 0.04, 40, pal, "crema", rng, tubo=0.05)


def sp_ananuca_amarilla(b, rng):
    _ananuca(b, rng, "amarillo")


def sp_ananuca_roja(b, rng):
    _ananuca(b, rng, "rojo_naranja")


def sp_ananuca_rosada(b, rng):
    _ananuca(b, rng, "rosa")


def sp_lirio_campo(b, rng):
    pts = curva(Vector((0, 0, 0)), 0.65, (0.05, 0.0), n=10)
    tube(b, pts, taper(0.010, 0.006, len(pts)), "verde", sides=5)
    hojas_tallo(b, pts, 10, 0.16, 0.025, "verde", rng, tilt=55, twist=1.2)
    top = frame_end(pts)
    for k in range(5):
        az = 2 * math.pi * k / 5
        mm = top @ Matrix.Rotation(az, 4, "Z") @ Matrix.Rotation(-math.radians(50), 4, "Y")
        ped = [mm @ Vector((0, 0, 0.0)), mm @ Vector((0, 0, 0.09))]
        tube(b, ped, [0.004, 0.003], "verde", sides=4)
        fm = Matrix.Translation(ped[-1]) @ top.to_3x3().to_4x4() @ Matrix.Rotation(az, 4, "Z") @ \
            Matrix.Rotation(-math.radians(30), 4, "Y")
        flor_lirio(b, fm, 6, 0.09, 0.035, 55, "rosa", "amarillo", rng)


def _flor_pajarito(b, m, k, rng):
    """Flor zigomorfa: 2 pétalos superiores erguidos, labio inferior de 3 lóbulos, centro amarillo."""
    for s in (-1, 1):
        sheet(b, m, 0.11 * k, 0.055 * k, "violeta", "ancho", bend=0.1, cup=0.2, tilt=50, azimut=s * 0.5, seg_w=3)
    for s in (-1, 0, 1):
        sheet(b, m, 0.12 * k, 0.04 * k, "rosa", "petalo", bend=-0.2, cup=0.2, tilt=-10,
              azimut=math.pi + s * 0.55, seg_l=4, seg_w=2)
    ellipsoid(b, m @ Vector((0.03 * k, 0, 0.008 * k)), (0.028 * k, 0.028 * k, 0.02 * k), "amarillo")


def sp_pajarito(b, rng):
    pts = curva(Vector((0, 0, 0)), 0.55, (0.05, 0.02), n=8)
    tube(b, pts, taper(0.010, 0.005, len(pts)), "verde", sides=5)
    hojas_tallo(b, pts, 7, 0.14, 0.035, "verde_gris", rng, tilt=55)
    for i in range(6):
        j = 3 + i
        a = i * 2.4
        d = Vector((math.cos(a), math.sin(a), 0))
        rama = [pts[min(j, len(pts) - 1)], pts[min(j, len(pts) - 1)] + d * 0.08 + Vector((0, 0, 0.05)),
                pts[min(j, len(pts) - 1)] + d * 0.15 + Vector((0, 0, 0.10))]
        tube(b, rama, [0.005, 0.004, 0.003], "verde", sides=4)
        fm = Matrix.Translation(rama[-1]) @ Matrix.Rotation(a, 4, "Z") @ Matrix.Rotation(-math.radians(35), 4, "Y")
        _flor_pajarito(b, fm, 1.0, rng)
    _flor_pajarito(b, frame_end(pts), 0.9, rng)


def sp_churco(b, rng):
    for i in range(3):
        a = 2 * math.pi * i / 3
        pts = curva(Vector((0.02 * math.cos(a), 0.02 * math.sin(a), 0)), rng.uniform(0.35, 0.55),
                    (math.cos(a) * 0.15, math.sin(a) * 0.15), n=8)
        tube(b, pts, taper(0.014, 0.006, len(pts)), "cafe", sides=5)
        for j in range(3, len(pts)):
            mj = Matrix.Translation(pts[j])
            for lf in range(3):  # hoja trifoliada
                sheet(b, mj, 0.07, 0.04, "verde", "ancho", bend=0.2, cup=0.5, tilt=35,
                      azimut=j * 1.7 + lf * 2.1, seg_w=2, seg_l=4)
        flor_embudo(b, frame_end(pts), 0.07, 0.04, "amarillo", "dorado", lobulos=5)


# --------------------------------------------------------------------------
# Entorno
# --------------------------------------------------------------------------
def sp_copao(b, rng):
    pts = curva(Vector((0, 0, 0)), 1.0, (0.0, 0.0), n=10)
    radios = [0.075] * 8 + [0.07, 0.05, 0.02]
    tube(b, pts, radios, "verde_gris", sides=24, ribs=(12, 0.10))
    for lado, alt in ((1, 0.45), (-1, 0.35)):
        brazo = [Vector((lado * 0.05, 0, alt)), Vector((lado * 0.20, 0, alt + 0.05)),
                 Vector((lado * 0.30, 0, alt + 0.20)), Vector((lado * 0.32, 0, alt + 0.45)),
                 Vector((lado * 0.32, 0, alt + 0.60))]
        tube(b, brazo, [0.055, 0.052, 0.05, 0.045, 0.02], "verde_gris", sides=20, ribs=(10, 0.10))
    for a in (0.3, 2.2, 4.1):
        m = Matrix.Translation((0.07 * math.cos(a), 0.07 * math.sin(a), 0.95)) @ Matrix.Rotation(a, 4, "Z") @ \
            Matrix.Rotation(-math.radians(70), 4, "Y")
        flor_embudo(b, m, 0.07, 0.04, "rosa", "crema")


def sp_cactus_globular(b, rng):
    n = 9
    pts = [Vector((0, 0, 0.30 * (1 - math.cos(math.pi * i / (n - 1))) / 2 * 2)) for i in range(n)]
    radios = [max(0.20 * math.sin(math.pi * i / (n - 1)), 0.01) for i in range(n)]
    tube(b, pts, radios, "verde_gris", sides=24, ribs=(14, 0.10))
    flor_platillo(b, T(0, 0, 0.60), 9, 0.07, 0.025, "amarillo", "dorado", rng, tilt=35, bend=0.1, cup=0.1)


def sp_arbusto_gris(b, rng):
    for i in range(7):
        a = 2 * math.pi * i / 7 + rng.uniform(-0.3, 0.3)
        pts = curva(Vector((0.02 * math.cos(a), 0.02 * math.sin(a), 0)), rng.uniform(0.35, 0.6),
                    (math.cos(a) * rng.uniform(0.08, 0.25), math.sin(a) * rng.uniform(0.08, 0.25)), n=6)
        tube(b, pts, taper(0.012, 0.004, len(pts)), "cafe", sides=5)
        hojas_tallo(b, pts, 5, 0.09, 0.025, "verde_gris", rng, tilt=50)
        for j in (3, 5):
            m = Matrix.Translation(pts[j])
            for lf in range(3):
                sheet(b, m, 0.07, 0.025, "verde_gris", "lanza", bend=0.3, cup=0.3, tilt=40,
                      azimut=lf * 2.1 + j, seg_w=2, seg_l=4)


def _roca(b, centro, escala, rng, sem):
    res = bmesh.ops.create_icosphere(b.bm, subdivisions=2, radius=1.0)
    verts = res["verts"]
    off = Vector((sem * 7.3, sem * 3.1, sem * 1.7))
    for v in verts:
        v.co *= 1.0 + 0.30 * noise.noise(v.co * 1.7 + off)
        v.co.z = max(v.co.z, -0.45)
    bmesh.ops.transform(b.bm, matrix=Matrix.Translation(centro) @ Matrix.Diagonal((*escala, 1.0)), verts=verts)
    for f in {f for v in verts for f in v.link_faces}:
        f.material_index = b.slot("gris_roca")


def sp_rocas(b, rng):
    b.plano = True
    _roca(b, (0, 0, 0.18), (0.30, 0.26, 0.24), rng, 1)
    _roca(b, (0.38, 0.12, 0.10), (0.18, 0.16, 0.14), rng, 2)
    _roca(b, (-0.30, -0.18, 0.07), (0.12, 0.11, 0.09), rng, 3)


def sp_suelo(b, rng):
    res = bmesh.ops.create_grid(b.bm, x_segments=22, y_segments=22, size=0.8)
    for v in {v for f in b.bm.faces for v in f.verts}:
        v.co.z = 0.03 * noise.noise(v.co * 3.0)
    for f in b.bm.faces:
        f.material_index = b.slot("arena")


def sp_pasto_seco(b, rng):
    for i in range(26):
        a = rng.uniform(0, 2 * math.pi)
        r = rng.uniform(0.0, 0.10)
        m = Matrix.Translation((r * math.cos(a), r * math.sin(a), 0))
        sheet(b, m, rng.uniform(0.25, 0.5), 0.012, "seco", "cinta", bend=rng.uniform(0.2, 0.7), cup=0.3,
              tilt=rng.uniform(15, 55), azimut=a + rng.uniform(-0.5, 0.5), seg_w=2)


# --------------------------------------------------------------------------
# Fauna (escala "de lupa": insectos ~0.4-0.6 unidades)
# --------------------------------------------------------------------------
def _patas_6(b, y_raices, raiz_x, raiz_z, abre, alto_rodilla, pal, r=0.012, largo_y=0.06):
    for lado in (-1, 1):
        for y in y_raices:
            pata(b, [(lado * raiz_x, y, raiz_z),
                     (lado * (raiz_x + abre), y + largo_y * 0.3, alto_rodilla),
                     (lado * (raiz_x + abre * 1.5), y + largo_y, 0.0)], r, pal)


def sp_oruga(b, rng):
    n, paso = 12, 0.05
    for i in range(n):
        t = i / (n - 1)
        r = 0.034 * (0.65 + 0.35 * math.sin(math.pi * (0.15 + 0.85 * t)))
        z = 0.04 + 0.025 * math.sin(i * 0.6)
        ellipsoid(b, (0, -i * paso, z), (r, paso * 0.62, r * 0.95), "verde_oruga",
                  slot_fn=lambda d: "crema" if d.z > 0.8 else "verde_oruga", seg=10, anillos=6)
        if 3 <= i <= 8 or i == n - 1:  # falsas patas
            ellipsoid(b, (0, -i * paso, 0.012), (r * 0.5, 0.012, 0.014), "cafe", seg=6, anillos=4)
    ellipsoid(b, (0, 0.045, 0.06), (0.032, 0.036, 0.032), "verde_oruga", seg=10, anillos=6)
    for s in (-1, 1):  # ocelos
        ellipsoid(b, (s * 0.018, 0.075, 0.07), (0.006, 0.006, 0.006), "negro", seg=6, anillos=4)
    cuerno = [Vector((0, -(n - 1) * paso - 0.02, 0.05)), Vector((0, -(n - 1) * paso - 0.06, 0.09)),
              Vector((0, -(n - 1) * paso - 0.08, 0.13))]
    tube(b, cuerno, [0.012, 0.007, 0.003], "rojo_naranja", sides=6)
    for i in range(1, 4):
        ellipsoid(b, (0, -i * paso + 0.01, 0.012), (0.010, 0.012, 0.012), "cafe", seg=6, anillos=4)


def sp_vaquita(b, rng):
    # Polos de la esfera sobre el eje largo: las franjas rojas siguen los meridianos.
    def elitros(d):
        idx = int(((math.atan2(d.y, d.x) % (2 * math.pi)) / (2 * math.pi)) * 24)
        return "rojo_vaquita" if idx in (14, 15, 20, 21) and d.y < 0.3 else "negro"
    ellipsoid(b, (0, -0.03, 0.11), (0.11, 0.085, 0.18), "negro", rot=Matrix.Rotation(-math.pi / 2, 4, "X"),
              slot_fn=elitros, seg=24, anillos=14)
    ellipsoid(b, (0, 0.12, 0.11), (0.085, 0.07, 0.06), "negro")
    ellipsoid(b, (0, 0.20, 0.10), (0.05, 0.045, 0.04), "negro", seg=10, anillos=6)
    _patas_6(b, (0.10, 0.02, -0.08), 0.07, 0.08, 0.05, 0.10, "negro", r=0.014, largo_y=0.04)
    for s_ in (-1, 1):
        tube(b, [Vector((s_ * 0.02, 0.24, 0.11)), Vector((s_ * 0.05, 0.31, 0.15)), Vector((s_ * 0.09, 0.35, 0.17))],
             [0.007, 0.006, 0.005], "negro", sides=4)


def sp_mariquita(b, rng):
    spots = [Vector(p).normalized() for p in
             ((0.5, 0.3, 0.8), (-0.5, 0.3, 0.8), (0.65, -0.25, 0.7), (-0.65, -0.25, 0.7),
              (0.3, -0.75, 0.55), (-0.3, -0.75, 0.55), (0.0, 0.7, 0.7))]

    def cuerpo(d):
        dn = d.normalized()
        if any(dn.dot(s) > 0.90 for s in spots):
            return "negro"
        return "rojo_vaquita"
    ellipsoid(b, (0, -0.02, 0.04), (0.15, 0.17, 0.12), "rojo_vaquita", slot_fn=cuerpo,
              recorta=lambda d: d.z < -0.05, seg=24, anillos=14)
    ellipsoid(b, (0, 0.15, 0.05), (0.08, 0.05, 0.06), "negro", seg=10, anillos=6)
    ellipsoid(b, (0, 0.19, 0.05), (0.06, 0.04, 0.05), "crema", seg=10, anillos=6)
    _patas_6(b, (0.09, 0.0, -0.09), 0.07, 0.03, 0.07, 0.06, "negro", r=0.011, largo_y=0.05)


def sp_hormiga(b, rng):
    ellipsoid(b, (0, -0.30, 0.20), (0.12, 0.18, 0.12), "negro")
    ellipsoid(b, (0, -0.14, 0.23), (0.03, 0.04, 0.04), "cafe", seg=8, anillos=5)
    ellipsoid(b, (0, -0.02, 0.23), (0.07, 0.12, 0.07), "cafe")
    ellipsoid(b, (0, 0.17, 0.24), (0.085, 0.095, 0.075), "negro")
    for s in (-1, 1):
        tube(b, [Vector((s * 0.03, 0.25, 0.22)), Vector((s * 0.07, 0.29, 0.20)), Vector((s * 0.03, 0.31, 0.19))],
             [0.012, 0.01, 0.005], "cafe", sides=4)
        tube(b, [Vector((s * 0.04, 0.22, 0.30)), Vector((s * 0.09, 0.30, 0.38)), Vector((s * 0.12, 0.42, 0.34))],
             [0.007, 0.006, 0.005], "negro", sides=4)
    for lado in (-1, 1):
        for y, dy in ((0.06, 0.10), (0.0, -0.01), (-0.07, -0.14)):
            pata(b, [(lado * 0.05, y, 0.21), (lado * 0.15, y + dy * 0.4, 0.31), (lado * 0.22, y + dy * 0.8, 0.0)],
                 0.017, "negro")


def sp_abeja_caupolicana(b, rng):
    def bandas(d):
        return "cafe" if (int((d.y + 1.0) * 3.0) % 2 == 1) else "dorado"
    ellipsoid(b, (0, 0.0, 0.20), (0.14, 0.15, 0.13), "dorado")
    ellipsoid(b, (0, -0.27, 0.19), (0.12, 0.20, 0.11), "dorado", slot_fn=bandas)
    ellipsoid(b, (0, 0.17, 0.21), (0.09, 0.07, 0.08), "cafe", seg=10, anillos=6)
    for s in (-1, 1):
        ellipsoid(b, (s * 0.06, 0.20, 0.23), (0.035, 0.03, 0.04), "negro", seg=6, anillos=4)
        tube(b, [Vector((s * 0.03, 0.22, 0.27)), Vector((s * 0.07, 0.30, 0.33)), Vector((s * 0.10, 0.36, 0.30))],
             [0.007, 0.006, 0.005], "cafe", sides=4)
    delantera = [(0, 0), (0.1, 0.06), (0.3, 0.10), (0.42, 0.04), (0.40, -0.04), (0.2, -0.07), (0, -0.04)]
    trasera = [(0, 0), (0.08, 0.03), (0.22, 0.05), (0.28, -0.02), (0.14, -0.06), (0, -0.03)]
    for lado in (-1, 1):
        ala(b, (lado * 0.08, 0.04, 0.31), delantera, "ala", lado, 28.0, 1.2)
        ala(b, (lado * 0.08, -0.04, 0.30), trasera, "ala", lado, 22.0, 1.2)
    _patas_6(b, (0.07, 0.0, -0.08), 0.07, 0.17, 0.08, 0.24, "dorado", r=0.016, largo_y=0.05)


def sp_polilla_colibri(b, rng):
    def abdomen(d):
        return "rosa_polilla" if int((d.y + 1.0) * 3.0) % 2 == 1 else "oliva"
    ellipsoid(b, (0, 0.0, 0.20), (0.10, 0.16, 0.10), "oliva")
    ellipsoid(b, (0, -0.30, 0.18), (0.085, 0.28, 0.085), "oliva", slot_fn=abdomen)
    ellipsoid(b, (0, 0.16, 0.21), (0.07, 0.06, 0.07), "oliva", seg=10, anillos=6)
    for s in (-1, 1):
        ellipsoid(b, (s * 0.045, 0.20, 0.23), (0.03, 0.025, 0.035), "negro", seg=6, anillos=4)
        tube(b, [Vector((s * 0.02, 0.20, 0.26)), Vector((s * 0.07, 0.30, 0.34)), Vector((s * 0.09, 0.36, 0.30))],
             [0.006, 0.005, 0.003], "cafe", sides=4)
    tube(b, [Vector((0, 0.21, 0.20)), Vector((0, 0.34, 0.18)), Vector((0, 0.46, 0.12)), Vector((0, 0.52, 0.08))],
         [0.008, 0.006, 0.005, 0.004], "cafe", sides=4)
    delantera = [(0, 0), (0.06, 0.10), (0.30, 0.14), (0.50, 0.05), (0.56, -0.04), (0.40, -0.08),
                 (0.20, -0.09), (0.04, -0.06)]
    trasera = [(0, 0), (0.05, -0.02), (0.22, -0.05), (0.30, -0.14), (0.18, -0.20), (0.04, -0.12)]
    for lado in (-1, 1):
        ala(b, (lado * 0.07, 0.08, 0.28), delantera, "oliva", lado, 30.0)
        ala(b, (lado * 0.07, 0.0, 0.275), trasera, "rosa_polilla", lado, 24.0)
    for lado in (-1, 1):
        for y in (0.10, 0.02):
            pata(b, [(lado * 0.04, y, 0.15), (lado * 0.08, y, 0.10), (lado * 0.09, y + 0.03, 0.04)], 0.008, "cafe")


def sp_cururo(b, rng):
    ellipsoid(b, (0, -0.05, 0.19), (0.17, 0.27, 0.16), "gris_cururo")
    ellipsoid(b, (0, 0.27, 0.22), (0.12, 0.14, 0.11), "gris_cururo")
    ellipsoid(b, (0, 0.38, 0.19), (0.06, 0.07, 0.05), "gris_cururo", seg=10, anillos=6)
    ellipsoid(b, (0, 0.44, 0.20), (0.02, 0.015, 0.015), "negro", seg=6, anillos=4)
    for s in (-1, 1):
        ellipsoid(b, (s * 0.07, 0.34, 0.27), (0.016, 0.016, 0.016), "negro", seg=6, anillos=4)
        ellipsoid(b, (s * 0.09, 0.22, 0.31), (0.03, 0.015, 0.035), "gris_cururo", seg=8, anillos=5)
        ellipsoid(b, (s * 0.01, 0.43, 0.14), (0.011, 0.012, 0.03), "crema", seg=6, anillos=4)
        for y in (0.12, -0.20):
            ellipsoid(b, (s * 0.12, y, 0.07), (0.05, 0.08, 0.07), "gris_cururo", seg=8, anillos=5)
        for k in range(3):
            ellipsoid(b, (s * 0.13 + s * 0.012 * (k - 1), 0.19, 0.012), (0.008, 0.02, 0.008), "cafe", seg=5, anillos=3)
    tube(b, [Vector((0, -0.30, 0.16)), Vector((0, -0.40, 0.13)), Vector((0, -0.46, 0.14))],
         [0.025, 0.018, 0.010], "gris_cururo", sides=6)


# --------------------------------------------------------------------------
# Registro
# --------------------------------------------------------------------------
ESPECIES = {
    # flora
    "pata_de_guanaco": sp_pata_de_guanaco,
    "garra_de_leon": sp_garra_de_leon,
    "cuernecillo": sp_cuernecillo,
    "malvilla": sp_malvilla,
    "suspiro": sp_suspiro,
    "huille": sp_huille,
    "anañuca_amarilla": sp_ananuca_amarilla,
    "anañuca_roja": sp_ananuca_roja,
    "anañuca_rosada": sp_ananuca_rosada,
    "lirio_campo": sp_lirio_campo,
    "pajarito": sp_pajarito,
    "churco": sp_churco,
    # entorno
    "copao": sp_copao,
    "cactus_globular": sp_cactus_globular,
    "arbusto_gris": sp_arbusto_gris,
    "rocas": sp_rocas,
    "suelo": sp_suelo,
    "pasto_seco": sp_pasto_seco,
    # fauna
    "oruga": sp_oruga,
    "vaquita": sp_vaquita,
    "mariquita": sp_mariquita,
    "hormiga": sp_hormiga,
    "abeja_caupolicana": sp_abeja_caupolicana,
    "polilla_colibri": sp_polilla_colibri,
    "cururo": sp_cururo,
}


# --------------------------------------------------------------------------
# Materiales NPR
# --------------------------------------------------------------------------
def _material(nombre):
    mat = bpy.data.materials.get(nombre) or bpy.data.materials.new(nombre)
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    return mat


def material_pintura(pal):
    mat = _material(f"NPR_{pal}")
    nt = mat.node_tree
    new, link = nt.nodes.new, nt.links.new
    sombra, medio, luz = PALETAS[pal]

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

    noise_n = new("ShaderNodeTexNoise")
    noise_n.inputs["Scale"].default_value = PAPER_NOISE_SCALE
    noise_n.inputs["Detail"].default_value = 8.0
    noise_n.inputs["Roughness"].default_value = 0.65
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
    link(noise_n.outputs["Fac"], paper.inputs["Value"])
    link(ramp.outputs["Color"], mix.inputs[6])
    link(paper.outputs["Result"], mix.inputs[7])
    link(mix.outputs[2], emission.inputs["Color"])
    link(emission.outputs["Emission"], out.inputs["Surface"])
    for node, x, y in ((diffuse, -1000, 100), (to_rgb, -780, 100), (to_bw, -580, 100), (ramp, -400, 100),
                       (noise_n, -780, -250), (paper, -580, -250), (mix, -150, 0),
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
# Objeto y escena
# --------------------------------------------------------------------------
def crear_objeto(b, ident, loc):
    nombre = PREFIJO + ident
    viejo = bpy.data.objects.get(nombre)
    if viejo:
        bpy.data.objects.remove(viejo, do_unlink=True)
    viejo_mesh = bpy.data.meshes.get(nombre)
    if viejo_mesh and viejo_mesh.users == 0:
        bpy.data.meshes.remove(viejo_mesh)

    coords = [v.co for v in b.bm.verts]
    dims = [max(c[i] for c in coords) - min(c[i] for c in coords) for i in range(3)]
    tam = max(dims)
    for f in b.bm.faces:
        f.smooth = not b.plano

    mesh = bpy.data.meshes.new(nombre)
    contorno = material_contorno()
    for pal in b.paletas:  # slots: pintura (par) + contorno (impar)
        mesh.materials.append(material_pintura(pal))
        mesh.materials.append(contorno)
    b.bm.to_mesh(mesh)
    b.bm.free()

    obj = bpy.data.objects.new(nombre, mesh)
    obj.location = loc
    bpy.context.scene.collection.objects.link(obj)
    mod = obj.modifiers.new("NPR_Contorno", "SOLIDIFY")
    mod.thickness = -OUTLINE_RATIO * tam
    mod.use_flip_normals = True
    mod.use_quality_normals = True
    mod.material_offset = 1
    mod.material_offset_rim = 1
    return obj


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
        print(f"[DF] OK: {nombre}")
        return res
    except Exception:
        print(f"[DF] ERROR en '{nombre}':")
        traceback.print_exc()
        return None


def generar(ident, idx):
    b = Builder()
    ESPECIES[ident](b, random.Random(f"{SEED}-{ident}"))
    loc = ((idx % POR_FILA) * SEPARACION, -(idx // POR_FILA) * SEPARACION, 0.0)
    return crear_objeto(b, ident, loc)


def main():
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    step("Escena", preparar_escena)
    ids = GENERAR or list(ESPECIES)
    for idx, ident in enumerate(ids):
        if ident not in ESPECIES:
            print(f"[DF] id desconocido: {ident}")
            continue
        step(ident, generar, ident, idx)
    print(f"[DF] Terminado ({len(ids)} especies). Revisa la consola del sistema por errores.")


main()
