"""
NPR "cuento de hadas / óleo suave / acuarela" (inspirado en Tree of Savior)

Pegar en la pestaña Scripting de Blender y ejecutar con los modelos (mesh)
seleccionados en modo Objeto. Probado en la lógica de Blender 4.2+ (Eevee Next)
y con fallbacks para 5.x.

1) Material pictórico: Diffuse -> Shader to RGB -> Color Ramp (3 paradas)
   -> Multiply con ruido tipo papel -> Emission -> Material Output
2) Contorno orgánico: Solidify (casco invertido) + material Emission sepia
3) Compositor: Render Layers -> Kuwahara -> Blur (Fast Gaussian) -> Composite
"""

import bpy

# --------------------------------------------------------------------------
# Parámetros ajustables
# --------------------------------------------------------------------------
MAT_NAME = "NPR_Acuarela"
OUTLINE_MAT_NAME = "NPR_Contorno"
MOD_NAME = "NPR_Contorno"

# Paradas del Color Ramp (posición, RGBA lineal)
RAMP_STOPS = (
    (0.00, (0.42, 0.38, 0.62, 1.0)),  # sombra profunda: lavanda / azul noche claro
    (0.50, (0.74, 0.68, 0.74, 1.0)),  # medio tono: malva pastel desaturado
    (1.00, (0.96, 0.91, 0.80, 1.0)),  # luz: crema pastel
)
OUTLINE_COLOR = (0.16, 0.08, 0.04, 1.0)  # café sepia oscuro (no negro puro)
OUTLINE_THICKNESS = -0.01

PAPER_NOISE_SCALE = 250.0   # escala alta = grano fino de papel
PAPER_NOISE_STRENGTH = 0.35  # mezcla del multiply (0 = sin papel)
PAPER_MIN, PAPER_MAX = 0.78, 1.0  # rango de luminosidad del grano

KUWAHARA_SIZE = 6           # tamaño de "pincelada" en px
BLUR_PX = 2                 # desenfoque etéreo (1 o 2)


# --------------------------------------------------------------------------
# Utilidades
# --------------------------------------------------------------------------
def set_if_exists(obj, **props):
    """Asigna propiedades solo si existen (compatibilidad entre versiones)."""
    for key, value in props.items():
        if hasattr(obj, key):
            setattr(obj, key, value)


def set_input(node, name, value):
    """Asigna un socket de entrada o, si es una propiedad antigua, el atributo."""
    sock = node.inputs.get(name)
    if sock is not None:
        sock.default_value = value
    else:
        set_if_exists(node, **{name.lower(): value})


def setup_eevee(scene):
    engines = {e.identifier for e in
               bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        if engine in engines:
            scene.render.engine = engine
            break
    # Evita que AgX/Filmic desaturen los pasteles
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"


# --------------------------------------------------------------------------
# 1) Material pictórico
# --------------------------------------------------------------------------
def build_paint_material():
    mat = bpy.data.materials.get(MAT_NAME) or bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    new = nt.nodes.new
    link = nt.links.new

    diffuse = new("ShaderNodeBsdfDiffuse")
    diffuse.inputs["Color"].default_value = (1, 1, 1, 1)
    to_rgb = new("ShaderNodeShaderToRGB")
    to_bw = new("ShaderNodeRGBToBW")

    ramp = new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "EASE"  # transiciones suaves de acuarela
    elements = ramp.color_ramp.elements
    elements[0].position, elements[0].color = RAMP_STOPS[0]
    elements[1].position, elements[1].color = RAMP_STOPS[-1]
    mid_pos, mid_col = RAMP_STOPS[1]
    mid = elements.new(mid_pos)
    mid.color = mid_col

    # Grano de papel: ruido fino comprimido a un rango claro para multiplicar
    noise = new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = PAPER_NOISE_SCALE
    noise.inputs["Detail"].default_value = 8.0
    noise.inputs["Roughness"].default_value = 0.65
    paper = new("ShaderNodeMapRange")
    paper.inputs["To Min"].default_value = PAPER_MIN
    paper.inputs["To Max"].default_value = PAPER_MAX

    mix = new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = PAPER_NOISE_STRENGTH

    emission = new("ShaderNodeEmission")  # el color ya incluye la luz (Shader to RGB)
    out = new("ShaderNodeOutputMaterial")

    link(diffuse.outputs["BSDF"], to_rgb.inputs["Shader"])
    link(to_rgb.outputs["Color"], to_bw.inputs["Color"])
    link(to_bw.outputs["Val"], ramp.inputs["Fac"])
    link(noise.outputs["Fac"], paper.inputs["Value"])
    # Mix RGBA: entradas A = índice 6, B = índice 7; resultado = salida 2
    link(ramp.outputs["Color"], mix.inputs[6])
    link(paper.outputs["Result"], mix.inputs[7])
    link(mix.outputs[2], emission.inputs["Color"])
    link(emission.outputs["Emission"], out.inputs["Surface"])

    # Orden visual de los nodos
    for node, (x, y) in {
        diffuse: (-1000, 100), to_rgb: (-780, 100), to_bw: (-580, 100),
        ramp: (-400, 100), noise: (-780, -250), paper: (-580, -250),
        mix: (-150, 0), emission: (50, 0), out: (250, 0),
    }.items():
        node.location = (x, y)
    return mat


# --------------------------------------------------------------------------
# 2) Contorno orgánico (casco invertido)
# --------------------------------------------------------------------------
def build_outline_material():
    mat = (bpy.data.materials.get(OUTLINE_MAT_NAME)
           or bpy.data.materials.new(OUTLINE_MAT_NAME))
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    emission = nt.nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = OUTLINE_COLOR
    emission.inputs["Strength"].default_value = 1.0
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emission.location, out.location = (-200, 0), (0, 0)
    nt.links.new(emission.outputs["Emission"], out.inputs["Surface"])
    mat.use_backface_culling = True
    return mat


def apply_to_object(obj, paint_mat, outline_mat):
    # Slot 0: pintura, slot 1: contorno
    obj.data.materials.clear()
    obj.data.materials.append(paint_mat)
    obj.data.materials.append(outline_mat)

    mod = obj.modifiers.get(MOD_NAME) or obj.modifiers.new(MOD_NAME, "SOLIDIFY")
    mod.thickness = OUTLINE_THICKNESS
    mod.use_flip_normals = True
    mod.use_quality_normals = True  # High Quality Thickness
    mod.material_offset = 1


# --------------------------------------------------------------------------
# 3) Compositor
# --------------------------------------------------------------------------
def get_compositor_tree(scene):
    if hasattr(scene, "compositing_node_group"):  # Blender 5.x
        if scene.compositing_node_group is None:
            scene.compositing_node_group = bpy.data.node_groups.new(
                "Compositing", "CompositorNodeTree")
        return scene.compositing_node_group
    scene.use_nodes = True
    return scene.node_tree


def setup_compositor(scene):
    try:
        scene.use_nodes = True  # deprecado en 5.x pero inofensivo
    except Exception:
        pass
    nt = get_compositor_tree(scene)

    # Limpia nodos NPR previos para poder re-ejecutar el script
    for n in [n for n in nt.nodes if n.name.startswith("NPR_")]:
        nt.nodes.remove(n)

    render_layers = next((n for n in nt.nodes if n.bl_idname == "CompositorNodeRLayers"), None)
    if render_layers is None:
        render_layers = nt.nodes.new("CompositorNodeRLayers")
    output = next((n for n in nt.nodes if n.bl_idname in
                   ("CompositorNodeComposite", "NodeGroupOutput")), None)
    if output is None:
        try:
            output = nt.nodes.new("CompositorNodeComposite")
        except RuntimeError:  # 5.x: el Composite se sustituye por Group Output
            output = nt.nodes.new("NodeGroupOutput")
            nt.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")

    for link in list(output.inputs[0].links):
        nt.links.remove(link)

    kuwahara = nt.nodes.new("CompositorNodeKuwahara")
    kuwahara.name = "NPR_Kuwahara"
    set_if_exists(kuwahara, variation="ANISOTROPIC", uniformity=4,
                  sharpness=0.5, eccentricity=1.0, use_high_precision=False)
    set_input(kuwahara, "Size", KUWAHARA_SIZE)

    blur = nt.nodes.new("CompositorNodeBlur")
    blur.name = "NPR_Blur"
    set_if_exists(blur, filter_type="FAST_GAUSS", use_relative=False,
                  size_x=BLUR_PX, size_y=BLUR_PX)
    if "Size" in blur.inputs:  # 5.x: tamaño como socket
        try:
            blur.inputs["Size"].default_value = (BLUR_PX, BLUR_PX)
        except TypeError:
            blur.inputs["Size"].default_value = BLUR_PX

    render_layers.location = (-500, 0)
    kuwahara.location = (-250, 0)
    blur.location = (0, 0)
    output.location = (250, 0)

    img_out = render_layers.outputs.get("Image") or render_layers.outputs[0]
    nt.links.new(img_out, kuwahara.inputs["Image"])
    nt.links.new(kuwahara.outputs["Image"], blur.inputs["Image"])
    nt.links.new(blur.outputs["Image"], output.inputs[0])


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def main():
    scene = bpy.context.scene
    meshes = [o for o in bpy.context.selected_objects if o.type == "MESH"]
    if not meshes:
        raise RuntimeError("Selecciona al menos un objeto tipo Mesh antes de ejecutar.")

    import traceback

    def step(name, fn, *args):
        try:
            result = fn(*args)
            print(f"[NPR] OK: {name}")
            return result
        except Exception:
            print(f"[NPR] ERROR en '{name}':")
            traceback.print_exc()
            return None

    step("Eevee", setup_eevee, scene)
    paint_mat = step("Material pictórico", build_paint_material)
    outline_mat = step("Material contorno", build_outline_material)
    if paint_mat and outline_mat:
        for obj in meshes:
            step(f"Contorno en {obj.name}", apply_to_object, obj, paint_mat, outline_mat)
    step("Compositor", setup_compositor, scene)
    print(f"[NPR] Terminado ({len(meshes)} objeto(s)). Revisa la consola por errores.")

main()
